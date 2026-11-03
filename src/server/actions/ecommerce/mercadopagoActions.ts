"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, PaymentMethod } from "@prisma/client";
import {
  mpClient,
  Preference,
  Payment,
  PaymentRefund,
  getAppBaseUrl,
} from "@/lib/mercadopago";
import { WEB_ORDER_RESERVATION_MINUTES } from "@/types/ecommerce";
import { revalidateEcommerceCatalogCache } from "./catalogActions";

export interface PreferenceCreatedResult {
  preferenceId: string;
  initPoint: string | null;
  sandboxInitPoint: string | null;
  orderCode: string | null;
  expiresAt: string;
}

/**
 * Server Action para generar la Preferencia oficial de Mercado Pago Checkout Pro (RF-16)
 * Se vincula a una orden web existente en estado PENDIENTE_PAGO.
 */
export async function createMercadoPagoPreference(
  orderIdOrCode: string
): Promise<{
  success: boolean;
  data?: PreferenceCreatedResult;
  error?: string;
}> {
  try {
    if (!orderIdOrCode) {
      return { success: false, error: "Identificador de orden no proporcionado" };
    }

    // 1. Obtener la orden de venta con sus ítems, variantes y datos de producto
    const sale = await prisma.sale.findFirst({
      where: {
        OR: [{ id: orderIdOrCode }, { invoiceNumber: orderIdOrCode }],
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    active: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return { success: false, error: "Pedido web no encontrado en la base de datos" };
    }

    if (sale.status === "COMPLETADA") {
      return { success: false, error: "El pedido ya ha sido pagado y completado previamente" };
    }

    if (sale.status === "CANCELADA") {
      return { success: false, error: "El pedido ha sido cancelado o sus unidades han retornado al stock" };
    }

    if (!sale.items || sale.items.length === 0) {
      return { success: false, error: "El pedido no contiene artículos para pagar" };
    }

    // 2. Verificar vigencia de la reserva de stock (15 min según RF-15 / RF-16)
    const expirationMs = WEB_ORDER_RESERVATION_MINUTES * 60 * 1000;
    const expiresAtDate = sale.reservedUntil
      ? sale.reservedUntil
      : new Date(sale.createdAt.getTime() + expirationMs);
    const now = new Date();

    if (now.getTime() > expiresAtDate.getTime()) {
      return {
        success: false,
        error: "El tiempo de reserva de inventario ha expirado. Por favor, vuelve a armar tu carrito.",
      };
    }

    if (!sale.reservedUntil) {
      await prisma.sale.update({
        where: { id: sale.id },
        data: { reservedUntil: expiresAtDate },
      });
    }

    // 3. Mapear artículos para el payload de Checkout Pro
    const items = sale.items.map((item) => {
      const productName = item.variant.product.name;
      const variantDesc = `Talle ${item.variant.size} - Color ${item.variant.color}`;
      return {
        id: item.variantId,
        title: `${productName} (${variantDesc})`,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        currency_id: "ARS",
      };
    });

    // 4. Mapear costo de envío (si aplica)
    const shippingCost = Number(sale.shippingCost || 0);
    const shipments =
      shippingCost > 0
        ? {
            cost: shippingCost,
            mode: "not_specified" as const,
          }
        : undefined;

    // 5. Configurar datos del comprador (Payer)
    const nameParts = (sale.customerName || "Cliente Web").trim().split(/\s+/);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "General";

    const payer = {
      name: firstName,
      surname: lastName,
      email: sale.customerEmail?.includes("@testuser.com") ? "comprador.prueba@matacosdeportes.com" : (sale.customerEmail || "cliente@matacosdeportes.com"),
      identification: sale.customerDni
        ? {
            type: "DNI",
            number: sale.customerDni.replace(/\D/g, ""),
          }
        : undefined,
      phone: sale.customerPhone
        ? {
            number: sale.customerPhone.replace(/\D/g, ""),
          }
        : undefined,
      address: sale.shippingAddress
        ? {
            street_name: sale.shippingAddress,
            zip_code: sale.shippingPostalCode || undefined,
          }
        : undefined,
    };

    // 6. Configurar URLs de retorno y webhooks
    const rawBaseUrl = getAppBaseUrl();
    const baseUrl = rawBaseUrl.replace("://localhost", "://localtest.me").replace("://127.0.0.1", "://localtest.me");
    const isHttps = baseUrl.startsWith("https://");

    const backUrls = {
      success: `${baseUrl}/checkout/resultado?orderCode=${sale.invoiceNumber}&status=approved`,
      failure: `${baseUrl}/checkout/resultado?orderCode=${sale.invoiceNumber}&status=failure`,
      pending: `${baseUrl}/checkout/resultado?orderCode=${sale.invoiceNumber}&status=pending`,
    };

    // 7. Crear la preferencia invocando al SDK oficial de Mercado Pago
    const preferenceClient = new Preference(mpClient);

    const preference = await preferenceClient.create({
      body: {
        items,
        payer,
        shipments,
        back_urls: backUrls,
        // Mercado Pago exige HTTPS para auto_return y notification_url
        ...(isHttps ? { auto_return: "approved" } : {}),
        ...(isHttps ? { notification_url: `${baseUrl}/api/webhooks/mercadopago` } : {}),
        external_reference: sale.id,
        expires: true,
        expiration_date_from: sale.createdAt.toISOString(),
        expiration_date_to: expiresAtDate.toISOString(),
        date_of_expiration: expiresAtDate.toISOString(),
        statement_descriptor: "MATACOS DEPORTES",
        metadata: {
          sale_id: sale.id,
          order_code: sale.invoiceNumber,
        },
      },
    });

    return {
      success: true,
      data: {
        preferenceId: preference.id || "",
        initPoint: preference.init_point || null,
        sandboxInitPoint: preference.sandbox_init_point || null,
        orderCode: sale.invoiceNumber,
        expiresAt: expiresAtDate.toISOString(),
      },
    };
  } catch (error) {
    console.error("[MercadoPago Preference] Error al generar la preferencia:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al conectar con Mercado Pago",
    };
  }
}

/**
 * Procesa atómica e idempotentemente un pago notificado por Mercado Pago (Webhooks / IPN)
 */
export async function processMercadoPagoPayment(paymentId: string | number): Promise<{
  success: boolean;
  alreadyProcessed?: boolean;
  status?: string;
  orderCode?: string | null;
  saleId?: string;
  error?: string;
}> {
  try {
    const paymentClient = new Payment(mpClient);
    const payment = await paymentClient.get({ id: String(paymentId) });

    if (!payment) {
      return { success: false, error: `No se encontró el pago con id ${paymentId} en Mercado Pago` };
    }

    const saleId = payment.external_reference;
    if (!saleId) {
      console.warn(`[MercadoPago Webhook] Pago ${paymentId} omitido: external_reference vacío`);
      return { success: true, alreadyProcessed: true, status: payment.status };
    }

    // Ejecutar mutaciones atómicas dentro de prisma.$transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Control de Idempotencia: Verificar si el pago ya fue asentado previamente
      const existingPayment = await tx.salePayment.findFirst({
        where: { referenceCode: String(payment.id) },
      });

      if (existingPayment) {
        return {
          alreadyProcessed: true,
          status: payment.status,
          saleId,
        };
      }

      // 2. Obtener la orden de venta vinculada
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      if (!sale) {
        throw new Error(`Orden de venta ${saleId} no encontrada`);
      }

      // 3. Manejo según estado del pago en Mercado Pago
      if (payment.status === "approved") {
        // Verificar existencias físicas actuales de todas las variantes
        const variants = await Promise.all(
          sale.items.map((it) =>
            tx.productVariant.findUnique({
              where: { id: it.variantId },
              select: { id: true, stockStore: true, stockWarehouse: true, stockReserved: true },
            })
          )
        );

        const variantMap = new Map(
          variants
            .filter((v): v is NonNullable<typeof v> => v !== null)
            .map((v) => [v.id, v])
        );
        let hasPhysicalShortage = false;

        for (const item of sale.items) {
          const v = variantMap.get(item.variantId);
          if (!v || (v.stockStore + v.stockWarehouse) < item.quantity) {
            hasPhysicalShortage = true;
            break;
          }
        }

        const wasCancelled = sale.status === "CANCELADA";

        // =========================================================================
        // SALVAGUARDA REACTIVA (FAIL-SAFE):
        // Pago aprobado recibido tardíamente sobre orden cancelada sin stock físico
        // =========================================================================
        if (wasCancelled && hasPhysicalShortage) {
          console.warn(
            `[MercadoPago Fail-safe] Pago tardío aprobado (${payment.id}) para orden expirada (${sale.invoiceNumber}) sin stock físico. Disparando reembolso automático.`
          );

          let refundError: string | null = null;
          try {
            const refundClient = new PaymentRefund(mpClient);
            await refundClient.total({ payment_id: String(payment.id) });
          } catch (err: any) {
            console.error(`[MercadoPago Fail-safe] Error al procesar reembolso automático:`, err);
            refundError = err instanceof Error ? err.message : String(err);
          }

          const auditNote = `[FAIL-SAFE REEMBOLSO]: Pago tardío MP #${payment.id} de $ ${payment.transaction_amount || sale.total} recibido tras expiración sin stock físico disponible en Saavedra 241. Reembolso total ${refundError ? 'FALLIDO (' + refundError + ')' : 'EMITIDO AUTOMÁTICAMENTE'}.`;
          const updatedNotes = sale.notes ? `${sale.notes} | ${auditNote}` : auditNote;

          await tx.sale.update({
            where: { id: sale.id },
            data: { notes: updatedNotes },
          });

          return {
            alreadyProcessed: false,
            status: "refunded_due_to_stock_shortage",
            saleId: sale.id,
            orderCode: sale.invoiceNumber,
            refunded: !refundError,
          };
        }

        // =========================================================================
        // CASO NORMAL O RESCATE: Stock físico disponible para abastecer la venta
        // =========================================================================
        const rescueNote = wasCancelled
          ? `[RESCATE DE ORDEN]: Pago aprobado tras expiración pero completado con éxito gracias a stock remanente en mostrador/depósito.`
          : null;
        const finalNotes = rescueNote
          ? (sale.notes ? `${sale.notes} | ${rescueNote}` : rescueNote)
          : sale.notes;

        // 3.1. Pasar la orden a COMPLETADA
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: "COMPLETADA",
            notes: finalNotes,
            syncedAt: new Date(),
          },
        });

        // 3.2. Asentar el comprobante en SalePayment con MERCADOPAGO_ONLINE
        const transactionAmount = payment.transaction_amount || Number(sale.total);
        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            method: PaymentMethod.MERCADOPAGO_ONLINE,
            amount: new Prisma.Decimal(transactionAmount),
            receivedAmount: new Prisma.Decimal(transactionAmount),
            change: new Prisma.Decimal(0),
            cardBrand: payment.payment_method_id || null,
            installments: payment.installments || 1,
            referenceCode: String(payment.id),
          },
        });

        // 3.3. Para cada ítem: Prioridad Depósito en canal WEB (protege el salón físico)
        for (const item of sale.items) {
          const v = variantMap.get(item.variantId);
          const currentReserved = v ? v.stockReserved : 0;
          const currentWarehouse = v ? v.stockWarehouse : 0;
          const currentStore = v ? v.stockStore : 0;

          // Prioridad 1: Descontar primero de Depósito. Prioridad 2: Descontar remanente de Salón.
          const deductFromWarehouse = Math.min(currentWarehouse, item.quantity);
          const deductFromStore = item.quantity - deductFromWarehouse;

          const newStockReserved = wasCancelled
            ? currentReserved
            : Math.max(0, currentReserved - item.quantity);
          const newStockWarehouse = Math.max(0, currentWarehouse - deductFromWarehouse);
          const newStockStore = Math.max(0, currentStore - deductFromStore);

          const updatedVariant = await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockWarehouse: newStockWarehouse,
              stockStore: newStockStore,
              stockReserved: newStockReserved,
            },
          });

          const totalStockAfter = updatedVariant.stockStore + updatedVariant.stockWarehouse;

          let location = "STORE";
          if (deductFromWarehouse > 0 && deductFromStore === 0) {
            location = "WAREHOUSE";
          } else if (deductFromWarehouse > 0 && deductFromStore > 0) {
            location = "SPLIT";
          }

          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              type: wasCancelled ? "VENTA_WEB_RESCATADA" : "VENTA_WEB",
              quantity: item.quantity,
              stockAfter: totalStockAfter,
              location,
              reason: `Venta Web Mercado Pago ${sale.invoiceNumber || sale.id} (Depósito: -${deductFromWarehouse}, Salón: -${deductFromStore}, Pago MP #${payment.id}${wasCancelled ? ' - Rescatada post-expiración' : ''})`,
            },
          });
        }

        return {
          alreadyProcessed: false,
          status: "approved",
          saleId: sale.id,
          orderCode: sale.invoiceNumber,
        };
      }

      if (payment.status === "rejected" || payment.status === "cancelled") {
        if (sale.status === "PENDIENTE_PAGO") {
          // 4.1. Pasar la orden a CANCELADA
          await tx.sale.update({
            where: { id: sale.id },
            data: {
              status: "CANCELADA",
            },
          });

          // 4.2. Devolver las unidades de stockReserved al catálogo disponible
          for (const item of sale.items) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stockReserved: { decrement: item.quantity },
              },
            });
          }
        }

        return {
          alreadyProcessed: false,
          status: payment.status,
          saleId: sale.id,
          orderCode: sale.invoiceNumber,
        };
      }

      // Si el pago está en estado pending / in_process, se mantiene la reserva activa
      return {
        alreadyProcessed: false,
        status: payment.status,
        saleId: sale.id,
        orderCode: sale.invoiceNumber,
      };
    });

    // Invalida el caché del catálogo público para reflejar las nuevas existencias
    if (payment.status === "approved" || payment.status === "rejected" || payment.status === "cancelled") {
      await revalidateEcommerceCatalogCache();
    }

    return {
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      status: result.status,
      saleId: result.saleId,
      orderCode: result.orderCode,
    };
  } catch (error) {
    console.error("[MercadoPago Payment] Error en procesamiento del pago:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al procesar el pago",
    };
  }
}
