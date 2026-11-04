"use server";

import { prisma } from "@/lib/prisma";
import { companyConfig } from "@/config/company";
import { formatCurrency } from "@/lib/utils";
import { revalidateEcommerceCatalogCache } from "./catalogActions";
import {
  SubmitTransferProofSchema,
  VerifyTransferPaymentSchema,
  type SubmitTransferProofInput,
  type VerifyTransferPaymentInput,
} from "@/schemas/ecommerce";
import { revalidatePath as nextRevalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    nextRevalidatePath(path);
  } catch {
    // Silenciado fuera del ciclo de petición HTTP de Next.js (ej: scripts tsx o CLI)
  }
}

/**
 * ============================================================================
 * TRANSFERENCIA BANCARIA Y CONCILIACIÓN DE COMPROBANTES (RF-17)
 * Matacos Deportes — Saavedra 241, Formosa Capital
 * ============================================================================
 */

export interface BankTransferDetailsDTO {
  bankName: string;
  accountType: string;
  accountHolder: string;
  cuit: string;
  cleanCuit: string;
  cbu: string;
  alias: string;
  address: string;
  instructions: string;
}

export interface SubmitTransferProofResult {
  success: boolean;
  orderId?: string;
  orderCode?: string;
  status?: string;
  transferProofUrl?: string;
  message?: string;
  error?: string;
  whatsappConfirmationUrl?: string;
}

export interface VerifyTransferPaymentResult {
  success: boolean;
  orderId?: string;
  orderCode?: string;
  status?: string;
  approved?: boolean;
  message?: string;
  error?: string;
}

export interface PendingTransferOrderDTO {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerDni: string;
  total: number;
  formattedTotal: string;
  status: string;
  shippingMethod: string;
  shippingStatus: string;
  transferProofUrl: string | null;
  transferProofUploadedAt: string | null;
  referenceCode: string | null;
  reconciliationNotes: string | null;
  createdAt: string;
  itemsCount: number;
  itemsSummary: string;
}

/**
 * Tarea 2: Expone de forma segura los datos bancarios institucionales de Matacos Deportes
 * desde src/config/company.ts (CBU, Alias, CUIT, Titular).
 */
export async function getBankTransferDetails(): Promise<BankTransferDetailsDTO> {
  return {
    bankName: companyConfig.bankName,
    accountType: companyConfig.bankAccountType,
    accountHolder: companyConfig.bankAccountHolder,
    cuit: companyConfig.cuit,
    cleanCuit: companyConfig.cleanCuit,
    cbu: companyConfig.bankCbu,
    alias: companyConfig.bankAlias,
    address: `${companyConfig.address}, ${companyConfig.city}`,
    instructions:
      "Transferí el importe exacto al CBU o Alias institucional de Matacos Deportes. Luego adjuntá el comprobante emitido por tu banco para que nuestro equipo concilie y despache tu pedido.",
  };
}

/**
 * Tarea 4: Carga y registro del comprobante de transferencia bancaria adjuntado por el cliente.
 * Cambia el estado de la orden a PENDIENTE_VERIFICACION y registra la trazabilidad.
 */
export async function submitTransferProof(
  input:
    | SubmitTransferProofInput
    | {
        orderId: string;
        proofUrl: string;
        reference?: string | null;
        customerNotes?: string | null;
      }
): Promise<SubmitTransferProofResult> {
  try {
    const parsed = SubmitTransferProofSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Datos de comprobante de transferencia inválidos",
      };
    }

    const { orderId, proofUrl, reference, customerNotes } = parsed.data;
    const cleanOrderId = orderId.trim();

    // 1. Buscar la orden por UUID, ticketCode o invoiceNumber
    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          { id: cleanOrderId },
          { ticketCode: cleanOrderId },
          { invoiceNumber: cleanOrderId },
        ],
      },
      include: {
        payments: true,
      },
    });

    if (!sale) {
      return {
        success: false,
        error: `No se encontró ningún pedido con el identificador "${cleanOrderId}".`,
      };
    }

    if (sale.status === "COMPLETADA") {
      return {
        success: false,
        error: "Este pedido ya se encuentra pagado y completado.",
      };
    }

    if (sale.status === "CANCELADA") {
      return {
        success: false,
        error:
          "Este pedido se encuentra cancelado. Por favor comunicate con administración para reactivarlo.",
      };
    }

    const normalizedOrderCode =
      sale.invoiceNumber ||
      sale.ticketCode ||
      `ORD-${sale.id.slice(0, 8).toUpperCase()}`;

    const uploadTimestamp = new Date();
    const cleanRef = reference?.trim() || null;
    const cleanCustomerNotes = customerNotes?.trim() || null;

    const auditTag = `[COMPROBANTE TRANSFERENCIA ADJUNTADO: ${uploadTimestamp.toLocaleDateString(
      "es-AR"
    )} ${uploadTimestamp.toLocaleTimeString("es-AR")}${
      cleanRef ? ` - Ref: ${cleanRef}` : ""
    }${cleanCustomerNotes ? ` - Nota: ${cleanCustomerNotes}` : ""}]`;

    const updatedNotes = sale.notes
      ? `${sale.notes} | ${auditTag}`
      : auditTag;

    // 2. Transacción de actualización a PENDIENTE_VERIFICACION
    await prisma.$transaction(async (tx) => {
      // 2.1 Actualizar estado y comprobante en Sale
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: "PENDIENTE_VERIFICACION",
          transferProofUrl: proofUrl.trim(),
          transferProofUploadedAt: uploadTimestamp,
          notes: updatedNotes,
        },
      });

      // 2.2 Actualizar o crear registro en SalePayment
      const existingPayment = sale.payments.find(
        (p) => p.method === "TRANSFERENCIA"
      );

      if (existingPayment) {
        await tx.salePayment.update({
          where: { id: existingPayment.id },
          data: {
            transferProofUrl: proofUrl.trim(),
            referenceCode: cleanRef || existingPayment.referenceCode,
            reconciliationNotes:
              cleanCustomerNotes || existingPayment.reconciliationNotes,
          },
        });
      } else {
        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            method: "TRANSFERENCIA",
            amount: sale.total,
            transferProofUrl: proofUrl.trim(),
            referenceCode: cleanRef,
            reconciliationNotes: cleanCustomerNotes,
          },
        });
      }
    });

    // 3. Generar enlace de aviso directo por WhatsApp
    const totalAmount = Number(sale.total);
    const whatsappMessage = `¡Hola Matacos Deportes! Adjunté el comprobante de transferencia bancaria para mi pedido web *${normalizedOrderCode}* por *${formatCurrency(
      totalAmount
    )}* a nombre de ${sale.customerName ?? "Cliente"}${
      cleanRef ? ` (Comprobante N°: ${cleanRef})` : ""
    }. Por favor verifiquen la acreditación. ¡Muchas gracias!`;

    const whatsappConfirmationUrl = `https://wa.me/${
      companyConfig.whatsappNumber
    }?text=${encodeURIComponent(whatsappMessage)}`;

    safeRevalidatePath("/seguimiento");
    safeRevalidatePath("/cuenta");

    return {
      success: true,
      orderId: sale.id,
      orderCode: normalizedOrderCode,
      status: "PENDIENTE_VERIFICACION",
      transferProofUrl: proofUrl.trim(),
      message:
        "¡Comprobante adjuntado correctamente! El pedido quedó en estado PENDIENTE_VERIFICACION y será revisado por administración.",
      whatsappConfirmationUrl,
    };
  } catch (error) {
    console.error("Error en submitTransferProof:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error inesperado al cargar el comprobante de transferencia",
    };
  }
}

/**
 * Tarea 5: Server Action para Administrador para verificar y conciliar la transferencia bancaria (RF-17).
 *
 * 5.1 Si approved === true:
 *   - Marca la orden como COMPLETADA y shippingStatus como EN_PREPARACION.
 *   - En una transacción atómica Prisma:
 *     * Descuenta stock físico de variantes (priorizando WAREHOUSE depósito interno y luego STORE mostrador Saavedra 241).
 *     * Libera stockReserved de las variantes.
 *     * Genera movimiento de inventario "VENTA_WEB" para cada ítem.
 *     * Actualiza / consolida SalePayment y notas de conciliación.
 *
 * 5.2 Si approved === false:
 *   - Notifica el motivo del rechazo.
 *   - Si cancelOrderOnReject === true: Cancela la orden (CANCELADA) y libera el stockReserved.
 *   - Si cancelOrderOnReject === false: Devuelve a PENDIENTE_PAGO conservando la reserva para que el cliente reenvíe el comprobante correcto.
 */
export async function verifyTransferPayment(
  input:
    | VerifyTransferPaymentInput
    | {
        orderId: string;
        approved: boolean;
        rejectionReason?: string | null;
        cancelOrderOnReject?: boolean;
        adminNotes?: string | null;
        reconciledBy?: string | null;
      }
): Promise<VerifyTransferPaymentResult> {
  try {
    const parsed = VerifyTransferPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Parámetros de verificación de transferencia inválidos",
      };
    }

    const {
      orderId,
      approved,
      rejectionReason,
      cancelOrderOnReject,
      adminNotes,
      reconciledBy,
    } = parsed.data;

    const cleanOrderId = orderId.trim();

    // 1. Recuperar orden completa con variantes y pagos
    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          { id: cleanOrderId },
          { ticketCode: cleanOrderId },
          { invoiceNumber: cleanOrderId },
        ],
      },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
        payments: true,
      },
    });

    if (!sale) {
      return {
        success: false,
        error: `No se encontró la orden "${cleanOrderId}".`,
      };
    }

    if (sale.status === "COMPLETADA") {
      return {
        success: false,
        error: "Esta orden ya se encuentra aprobada y completada con anterioridad.",
      };
    }

    const normalizedOrderCode =
      sale.invoiceNumber ||
      sale.ticketCode ||
      `ORD-${sale.id.slice(0, 8).toUpperCase()}`;

    const actionDate = new Date();
    const verifierName = reconciledBy?.trim() || "Administrador Matacos";

    // 5.1 APROBACIÓN DE LA TRANSFERENCIA BANCARIA
    if (approved) {
      await prisma.$transaction(async (tx) => {
        // Descontar stock físico y liberar reserva atómicamente
        for (const item of sale.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant) {
            throw new Error(
              `Variante de producto no encontrada (ID: ${item.variantId})`
            );
          }

          // Prioridad: Depósito (WAREHOUSE) -> Salón de Ventas (STORE)
          const deductFromWarehouse = Math.min(
            variant.stockWarehouse,
            item.quantity
          );
          const deductFromStore = item.quantity - deductFromWarehouse;

          const newStockWarehouse =
            variant.stockWarehouse - deductFromWarehouse;
          const newStockStore = variant.stockStore - deductFromStore;
          const newStockReserved = Math.max(
            0,
            variant.stockReserved - item.quantity
          );
          const totalStockAfter = newStockStore + newStockWarehouse;

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stockWarehouse: newStockWarehouse,
              stockStore: newStockStore,
              stockReserved: newStockReserved,
            },
          });

          let location = "STORE";
          if (deductFromWarehouse > 0 && deductFromStore === 0) {
            location = "WAREHOUSE";
          } else if (deductFromWarehouse > 0 && deductFromStore > 0) {
            location = "SPLIT";
          }

          // Registrar movimiento oficial VENTA_WEB
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "VENTA_WEB",
              quantity: item.quantity,
              stockAfter: totalStockAfter,
              location,
              reason: `Transferencia bancaria acreditada y aprobada para Orden ${normalizedOrderCode} (Salón: -${deductFromStore}, Depósito: -${deductFromWarehouse}). Conciliado por ${verifierName}`,
            },
          });
        }

        const reconciliationSummary = `Conciliación bancaria aprobada el ${actionDate.toLocaleDateString(
          "es-AR"
        )} a las ${actionDate.toLocaleTimeString(
          "es-AR"
        )} por ${verifierName}${adminNotes ? `. Detalle: ${adminNotes.trim()}` : ""}`;

        // Consolidar SalePayment
        const existingPayment = sale.payments.find(
          (p) => p.method === "TRANSFERENCIA"
        );

        if (existingPayment) {
          await tx.salePayment.update({
            where: { id: existingPayment.id },
            data: {
              amount: sale.total,
              reconciliationNotes: reconciliationSummary,
            },
          });
        } else {
          await tx.salePayment.create({
            data: {
              saleId: sale.id,
              method: "TRANSFERENCIA",
              amount: sale.total,
              transferProofUrl: sale.transferProofUrl,
              reconciliationNotes: reconciliationSummary,
            },
          });
        }

        // Marcar Sale como COMPLETADA
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: "COMPLETADA",
            shippingStatus: "EN_PREPARACION",
            reconciledAt: actionDate,
            reconciledBy: verifierName,
            reconciliationNotes: reconciliationSummary,
          },
        });
      });

      await revalidateEcommerceCatalogCache();
      safeRevalidatePath("/seguimiento");
      safeRevalidatePath("/cuenta");

      return {
        success: true,
        orderId: sale.id,
        orderCode: normalizedOrderCode,
        status: "COMPLETADA",
        approved: true,
        message: `Orden ${normalizedOrderCode} aprobada con éxito. Stock físico consolidado y movimiento VENTA_WEB registrado.`,
      };
    }

    // 5.2 RECHAZO DE LA TRANSFERENCIA BANCARIA
    const reasonText =
      rejectionReason?.trim() ||
      "El comprobante no coincide con el importe o no figura acreditado en la cuenta institucional.";

    const rejectionSummary = `Transferencia bancaria rechazada el ${actionDate.toLocaleDateString(
      "es-AR"
    )} a las ${actionDate.toLocaleTimeString(
      "es-AR"
    )} por ${verifierName}. Motivo: ${reasonText}${
      adminNotes ? ` | Nota: ${adminNotes.trim()}` : ""
    }`;

    if (cancelOrderOnReject) {
      // Opción A: Cancelar orden y liberar inmediatamente el stock reservado
      await prisma.$transaction(async (tx) => {
        for (const item of sale.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stockReserved: Math.max(
                  0,
                  variant.stockReserved - item.quantity
                ),
              },
            });
          }
        }

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: "CANCELADA",
            reconciledAt: actionDate,
            reconciledBy: verifierName,
            reconciliationNotes: rejectionSummary,
            notes: sale.notes
              ? `${sale.notes} | ${rejectionSummary}`
              : rejectionSummary,
          },
        });
      });

      await revalidateEcommerceCatalogCache();
      safeRevalidatePath("/seguimiento");
      safeRevalidatePath("/cuenta");

      return {
        success: true,
        orderId: sale.id,
        orderCode: normalizedOrderCode,
        status: "CANCELADA",
        approved: false,
        message: `Orden ${normalizedOrderCode} rechazada y cancelada. Se liberó el stock reservado.`,
      };
    } else {
      // Opción B: Mantener la orden en PENDIENTE_PAGO y el stock reservado por tiempo limitado para reintento
      await prisma.sale.update({
        where: { id: sale.id },
        data: {
          status: "PENDIENTE_PAGO",
          reconciledAt: actionDate,
          reconciledBy: verifierName,
          reconciliationNotes: rejectionSummary,
          notes: sale.notes
            ? `${sale.notes} | ${rejectionSummary}`
            : rejectionSummary,
        },
      });

      safeRevalidatePath("/seguimiento");
      safeRevalidatePath("/cuenta");

      return {
        success: true,
        orderId: sale.id,
        orderCode: normalizedOrderCode,
        status: "PENDIENTE_PAGO",
        approved: false,
        message: `Comprobante rechazado. La orden regresó al estado PENDIENTE_PAGO conservando la reserva temporal para permitir la subsanación por parte del cliente.`,
      };
    }
  } catch (error) {
    console.error("Error en verifyTransferPayment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error inesperado al verificar la transferencia bancaria",
    };
  }
}

/**
 * Consulta de soporte para el panel de administración:
 * Recupera todas las órdenes en estado PENDIENTE_VERIFICACION (o PENDIENTE_PAGO con comprobante cargado).
 */
export async function getPendingTransferOrders(options?: {
  search?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  data?: PendingTransferOrderDTO[];
  error?: string;
}> {
  try {
    const limit = options?.limit ?? 50;
    const search = options?.search?.trim();

    const whereClause: Record<string, unknown> = {
      channel: "WEB",
      OR: [
        { status: "PENDIENTE_VERIFICACION" },
        {
          status: "PENDIENTE_PAGO",
          transferProofUrl: { not: null },
        },
      ],
    };

    if (search) {
      whereClause.AND = [
        {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" } },
            { ticketCode: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerDni: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const mapped: PendingTransferOrderDTO[] = sales.map((s) => {
      const orderCode =
        s.invoiceNumber || s.ticketCode || `ORD-${s.id.slice(0, 8).toUpperCase()}`;

      const transferPayment = s.payments.find(
        (p) => p.method === "TRANSFERENCIA"
      );

      const itemsSummary = s.items
        .map(
          (it) =>
            `${it.quantity}x ${it.variant.product.name} (Talle: ${it.variant.size}, Color: ${it.variant.color})`
        )
        .join("; ");

      return {
        id: s.id,
        orderCode,
        customerName: s.customerName || "Cliente Web",
        customerEmail: s.customerEmail || "-",
        customerPhone: s.customerPhone || "-",
        customerDni: s.customerDni || "-",
        total: Number(s.total),
        formattedTotal: formatCurrency(Number(s.total)),
        status: s.status,
        shippingMethod: s.shippingMethod || "RETIRO_LOCAL",
        shippingStatus: s.shippingStatus,
        transferProofUrl: s.transferProofUrl,
        transferProofUploadedAt: s.transferProofUploadedAt
          ? s.transferProofUploadedAt.toISOString()
          : null,
        referenceCode: transferPayment?.referenceCode || null,
        reconciliationNotes: s.reconciliationNotes,
        createdAt: s.createdAt.toISOString(),
        itemsCount: s.items.reduce((acc, it) => acc + it.quantity, 0),
        itemsSummary,
      };
    });

    return {
      success: true,
      data: mapped,
    };
  } catch (error) {
    console.error("Error en getPendingTransferOrders:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al recuperar órdenes pendientes de verificación",
    };
  }
}
