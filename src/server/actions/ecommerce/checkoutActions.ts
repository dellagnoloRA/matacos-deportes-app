"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  ValidateCartItemsSchema,
  GuestCheckoutSchema,
  CartItemInput,
  GuestCheckoutInput,
  ShippingMethod,
} from "@/schemas/ecommerce";
import { WEB_ORDER_RESERVATION_MINUTES } from "@/types/ecommerce";
import { revalidateEcommerceCatalogCache } from "./catalogActions";
import { formatCurrency } from "@/lib/utils";
import { formatCheckoutContingencyWhatsAppUrl } from "@/lib/whatsapp";
import { companyConfig } from "@/config/company";
import {
  ProcessWebOrderPaymentSchema,
  type ProcessWebOrderPaymentInput,
  type WebPaymentOption,
  type WebCardBrand,
} from "@/schemas/ecommerce";

/**
 * Tiempo máximo de reserva de stock en pasarela de pago para órdenes web impagas (15 minutos según Hoja de Riesgo R-01 / RF-15)
 */


/**
 * Tarifas logísticas de referencia (Saavedra 241, Formosa Capital)
 */
const DEFAULT_SHIPPING_COSTS: Record<ShippingMethod, number> = {
  RETIRO_LOCAL: 0,
  CADETERIA_FORMOSA: 2500,
  CORREO_ARGENTINO: 7500,
};

export interface ValidatedCartItem {
  variantId: string;
  productId: string | null;
  productName: string;
  brandName: string;
  size: string;
  color: string;
  sku: string;
  imageUrl: string | null;
  requestedQuantity: number;
  availableStock: number;
  isAvailable: boolean;
  hasEnoughStock: boolean;
  currentUnitPrice: number;
  expectedUnitPrice: number | null;
  priceChanged: boolean;
  subtotal: number;
  issueMessage: string | null;
}

export interface CartValidationResult {
  isValid: boolean;
  hasStockIssues: boolean;
  hasPriceChanges: boolean;
  items: ValidatedCartItem[];
  subtotalProducts: number;
  totalItemsCount: number;
}

export interface GuestOrderItemSummary {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface GuestOrderCreatedResult {
  saleId: string;
  orderCode: string; // Ej: WEB-2026-0001
  status: "PENDIENTE_PAGO";
  channel: "WEB";
  customer: {
    name: string;
    dni: string;
    email: string;
    phone: string;
    isGuest: boolean;
  };
  shipping: {
    method: ShippingMethod;
    address: string;
    city: string;
    postalCode: string;
    cost: number;
  };
  totals: {
    subtotalProducts: number;
    shippingCost: number;
    total: number;
    totalFormatted: string;
  };
  items: GuestOrderItemSummary[];
  reservation: {
    expiresAt: string;
    expirationMinutes: number;
  };
  whatsappContingencyUrl: string;
  createdAt: string;
}

export interface ReleaseExpiredOrdersResult {
  releasedOrdersCount: number;
  releasedUnitsCount: number;
  releasedOrderCodes: string[];
}

function serialize<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (
        typeof value === "object" &&
        value !== null &&
        typeof value.toNumber === "function"
      ) {
        return value.toNumber();
      }
      if (
        typeof value === "object" &&
        value !== null &&
        "d" in value &&
        "e" in value &&
        "s" in value
      ) {
        return Number(value);
      }
      return value;
    })
  );
}

/**
 * Obtiene el año actual en la zona horaria oficial America/Argentina/Buenos_Aires
 */
function getCurrentArgentinaYear(): number {
  const formatted = new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
  return parseInt(formatted, 10) || new Date().getFullYear();
}

/**
 * Genera el próximo código correlativo anual para órdenes web (ej: WEB-2026-0001)
 * Se ejecuta dentro de la transacción de creación de la orden.
 */
async function generateNextWebOrderCode(
  tx: Prisma.TransactionClient
): Promise<string> {
  const year = getCurrentArgentinaYear();
  const prefix = `WEB-${year}-`;

  const lastWebOrder = await tx.sale.findFirst({
    where: {
      channel: "WEB",
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextSequence = 1;
  if (lastWebOrder?.invoiceNumber) {
    const suffix = lastWebOrder.invoiceNumber.replace(prefix, "");
    const parsed = parseInt(suffix, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      nextSequence = parsed + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

/**
 * 4. Mecanismo de liberación de stock reservado por vencimiento (RF-15)
 * Si una orden web permanece en estado PENDIENTE_PAGO tras 45 minutos (o el umbral configurado),
 * pasa a estado CANCELADA y restituye atómicamente el stockReserved en cada ProductVariant.
 */
export async function releaseExpiredWebOrders(
  expirationMinutes: number = WEB_ORDER_RESERVATION_MINUTES
): Promise<{
  success: boolean;
  data?: ReleaseExpiredOrdersResult;
  error?: string;
}> {
  try {
    const now = new Date();
    const safeMinutes = Math.max(1, expirationMinutes);
    const cutoffDate = new Date(now.getTime() - safeMinutes * 60 * 1000);

    // Buscar órdenes web impagas cuya reserva haya vencido (TTL 15 min)
    const expiredSales = await prisma.sale.findMany({
      where: {
        channel: "WEB",
        status: "PENDIENTE_PAGO",
        OR: [
          { reservedUntil: { lte: now } },
          { reservedUntil: null, createdAt: { lte: cutoffDate } },
        ],
      },
      include: {
        items: true,
      },
    });

    if (expiredSales.length === 0) {
      return {
        success: true,
        data: {
          releasedOrdersCount: 0,
          releasedUnitsCount: 0,
          releasedOrderCodes: [],
        },
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      let releasedOrdersCount = 0;
      let releasedUnitsCount = 0;
      const releasedOrderCodes: string[] = [];

      for (const sale of expiredSales) {
        // Re-verificar dentro de la transacción que siga PENDIENTE_PAGO
        const currentSale = await tx.sale.findUnique({
          where: { id: sale.id },
          select: { id: true, status: true, invoiceNumber: true, notes: true },
        });

        if (!currentSale || currentSale.status !== "PENDIENTE_PAGO") {
          continue;
        }

        // Liberar stockReserved de cada variante asociada
        for (const item of sale.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
            select: { id: true, stockStore: true, stockWarehouse: true, stockReserved: true },
          });

          if (variant) {
            const newReserved = Math.max(0, variant.stockReserved - item.quantity);
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stockReserved: newReserved },
            });
            releasedUnitsCount += item.quantity;

            await tx.inventoryMovement.create({
              data: {
                variantId: variant.id,
                type: "RESERVA_EXPIRADA",
                quantity: item.quantity,
                stockAfter: variant.stockStore + variant.stockWarehouse,
                location: "STORE",
                reason: `Liberación automática de reserva vencida Orden Web ${currentSale.invoiceNumber || currentSale.id}`,
              },
            });
          }
        }

        const expirationNote = `[AUTO-EXPIRACIÓN] Stock reservado liberado tras ${safeMinutes} min sin confirmación de pago.`;
        const updatedNotes = currentSale.notes
          ? `${currentSale.notes} | ${expirationNote}`
          : expirationNote;

        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: "CANCELADA",
            notes: updatedNotes,
          },
        });

        releasedOrdersCount++;
        if (currentSale.invoiceNumber) {
          releasedOrderCodes.push(currentSale.invoiceNumber);
        }
      }

      return {
        releasedOrdersCount,
        releasedUnitsCount,
        releasedOrderCodes,
      };
    });

    if (result.releasedOrdersCount > 0) {
      await revalidateEcommerceCatalogCache();
    }

    return {
      success: true,
      data: serialize(result),
    };
  } catch (error) {
    console.error("Error en releaseExpiredWebOrders:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Error al liberar reservas de órdenes web expiradas",
    };
  }
}

/**
 * 2. Validar los ítems del carrito en tiempo real (RF-15)
 * Verifica existencia en DB, estado activo del producto, precios vigentes y stock neto disponible:
 * Stock Disponible = (Stock de la Tienda + Stock del Depósito) - Stock Reservado
 */
export async function validateCartItems(
  items: CartItemInput[]
): Promise<{
  success: boolean;
  data?: CartValidationResult;
  error?: string;
}> {
  try {
    // Liberar preventivamente órdenes expiradas (> 45 min) antes de verificar disponibilidad
    await releaseExpiredWebOrders(WEB_ORDER_RESERVATION_MINUTES);

    const parsed = ValidateCartItemsSchema.safeParse(items);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Ítems del carrito inválidos",
      };
    }
    const validatedItems = parsed.data;

    // Consolidar cantidades si el mismo variantId aparece más de una vez en el array
    const consolidatedMap = new Map<
      string,
      { quantity: number; expectedUnitPrice?: number }
    >();
    for (const item of validatedItems) {
      const existing = consolidatedMap.get(item.variantId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        consolidatedMap.set(item.variantId, {
          quantity: item.quantity,
          expectedUnitPrice: item.expectedUnitPrice,
        });
      }
    }

    const variantIds = Array.from(consolidatedMap.keys());

    // Consultar variantes con sus productos en PostgreSQL (Zero-Leakage: nunca seleccionamos costPrice)
    const dbVariants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
      select: {
        id: true,
        size: true,
        color: true,
        sku: true,
        price: true,
        stockStore: true,
        stockWarehouse: true,
        stockReserved: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            active: true,
            imageUrl: true,
            brand: {
              select: { name: true },
            },
          },
        },
      },
    });

    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    const detailedItems: ValidatedCartItem[] = [];
    let hasStockIssues = false;
    let hasPriceChanges = false;
    let subtotalProducts = 0;
    let totalItemsCount = 0;

    for (const [variantId, reqInfo] of consolidatedMap.entries()) {
      const dbVariant = variantMap.get(variantId);

      if (!dbVariant || !dbVariant.product.active) {
        hasStockIssues = true;
        detailedItems.push({
          variantId,
          productId: dbVariant?.product.id ?? null,
          productName: dbVariant?.product.name ?? "Artículo no disponible",
          brandName: dbVariant?.product.brand.name ?? "",
          size: dbVariant?.size ?? "-",
          color: dbVariant?.color ?? "-",
          sku: dbVariant?.sku ?? "-",
          imageUrl: dbVariant?.product.imageUrl ?? null,
          requestedQuantity: reqInfo.quantity,
          availableStock: 0,
          isAvailable: false,
          hasEnoughStock: false,
          currentUnitPrice: 0,
          expectedUnitPrice: reqInfo.expectedUnitPrice ?? null,
          priceChanged: false,
          subtotal: 0,
          issueMessage:
            "El artículo seleccionado ya no se encuentra activo o no existe en el catálogo",
        });
        continue;
      }

      const availableStock = Math.max(
        0,
        dbVariant.stockStore + dbVariant.stockWarehouse - dbVariant.stockReserved
      );
      const isAvailable = availableStock > 0;
      const hasEnoughStock = availableStock >= reqInfo.quantity;

      if (!hasEnoughStock) {
        hasStockIssues = true;
      }

      const currentUnitPrice =
        dbVariant.price !== null
          ? Number(dbVariant.price)
          : Number(dbVariant.product.price);

      const priceChanged =
        reqInfo.expectedUnitPrice !== undefined &&
        Math.abs(currentUnitPrice - reqInfo.expectedUnitPrice) > 0.01;

      if (priceChanged) {
        hasPriceChanges = true;
      }

      const subtotal = currentUnitPrice * reqInfo.quantity;
      subtotalProducts += subtotal;
      totalItemsCount += reqInfo.quantity;

      let issueMessage: string | null = null;
      if (!isAvailable) {
        issueMessage = `Sin stock disponible para "${dbVariant.product.name}" (Talle ${dbVariant.size}, Color ${dbVariant.color})`;
      } else if (!hasEnoughStock) {
        issueMessage = `Stock insuficiente para "${dbVariant.product.name}" (Talle ${dbVariant.size}). Disponible: ${availableStock} un., Solicitado: ${reqInfo.quantity} un.`;
      } else if (priceChanged) {
        issueMessage = `El precio unitario de "${dbVariant.product.name}" se actualizó a ${formatCurrency(currentUnitPrice)}`;
      }

      detailedItems.push({
        variantId: dbVariant.id,
        productId: dbVariant.product.id,
        productName: dbVariant.product.name,
        brandName: dbVariant.product.brand.name,
        size: dbVariant.size,
        color: dbVariant.color,
        sku: dbVariant.sku,
        imageUrl: dbVariant.product.imageUrl,
        requestedQuantity: reqInfo.quantity,
        availableStock,
        isAvailable,
        hasEnoughStock,
        currentUnitPrice,
        expectedUnitPrice: reqInfo.expectedUnitPrice ?? null,
        priceChanged,
        subtotal,
        issueMessage,
      });
    }

    const result: CartValidationResult = {
      isValid: !hasStockIssues,
      hasStockIssues,
      hasPriceChanges,
      items: detailedItems,
      subtotalProducts,
      totalItemsCount,
    };

    return {
      success: true,
      data: serialize(result),
    };
  } catch (error) {
    console.error("Error en validateCartItems:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "No se pudieron validar los artículos del carrito",
    };
  }
}

/**
 * 3. Crear Orden Web como Invitado (Guest Checkout) con Reserva Atómica de Stock (RF-15)
 * - Mitigación R-01: Ejecuta prisma.$transaction con bloqueo pesimista a nivel de fila (SELECT ... FOR UPDATE)
 *   para impedir sobreventas simultáneas entre el mostrador de Saavedra 241 y la tienda online.
 * - Mitigación R-04: Permite compra directa sin registro obligatorio y genera link de contingencia por WhatsApp.
 */
export async function createGuestOrder(
  payload: GuestCheckoutInput
): Promise<{
  success: boolean;
  data?: GuestOrderCreatedResult;
  error?: string;
}> {
  try {
    // 0. Liberar reservas vencidas (> 45 min) antes de procesar la nueva compra
    await releaseExpiredWebOrders(WEB_ORDER_RESERVATION_MINUTES);

    // 1. Validar el payload completo con GuestCheckoutSchema (Zod)
    const parsed = GuestCheckoutSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message || "Datos del formulario de checkout inválidos",
      };
    }
    const validated = parsed.data;

    // Consolidar ítems repetidos del mismo variantId
    const consolidatedItemsMap = new Map<string, number>();
    for (const item of validated.items) {
      consolidatedItemsMap.set(
        item.variantId,
        (consolidatedItemsMap.get(item.variantId) || 0) + item.quantity
      );
    }
    const variantIds = Array.from(consolidatedItemsMap.keys());

    // 2. Ejecutar Transacción Atómica con bloqueo de registros en PostgreSQL
    const orderResult = await prisma.$transaction(async (tx) => {
      // Bloqueo pesimista a nivel de fila (FOR UPDATE) sobre las variantes solicitadas (Directiva AGENTS.md y Riesgo R-01)
      await tx.$queryRaw`
        SELECT id
        FROM "ProductVariant"
        WHERE id IN (${Prisma.join(variantIds)})
        FOR UPDATE
      `;

      // Leer estado actual exacto de cada variante dentro del bloqueo transaccional
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          size: true,
          color: true,
          sku: true,
          price: true,
          stockStore: true,
          stockWarehouse: true,
          stockReserved: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              active: true,
            },
          },
        },
      });

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      let subtotalProducts = 0;
      const preparedItems: GuestOrderItemSummary[] = [];

      // Verificar disponibilidad real y congelar precios vigentes en DB
      for (const [variantId, quantity] of consolidatedItemsMap.entries()) {
        const variant = variantMap.get(variantId);

        if (!variant) {
          throw new Error(
            `El artículo seleccionado (${variantId}) no existe en el inventario.`
          );
        }

        if (!variant.product.active) {
          throw new Error(
            `El producto "${variant.product.name}" ya no se encuentra disponible para la venta.`
          );
        }

        const availableStock =
          variant.stockStore + variant.stockWarehouse - variant.stockReserved;

        if (availableStock < quantity) {
          throw new Error(
            `Stock insuficiente para "${variant.product.name}" (Talle ${variant.size}, Color ${variant.color}). Disponible: ${Math.max(0, availableStock)} un., Solicitado: ${quantity} un.`
          );
        }

        const unitPrice =
          variant.price !== null
            ? Number(variant.price)
            : Number(variant.product.price);
        const itemSubtotal = unitPrice * quantity;
        subtotalProducts += itemSubtotal;

        preparedItems.push({
          variantId: variant.id,
          productId: variant.product.id,
          productName: variant.product.name,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          quantity,
          unitPrice,
          subtotal: itemSubtotal,
        });
      }

      // Determinar costo y dirección de envío según modalidad elegida
      const shippingMethod = validated.shippingMethod;
      const shippingCost =
        validated.shippingCost !== undefined
          ? validated.shippingCost
          : DEFAULT_SHIPPING_COSTS[shippingMethod];

      const effectiveAddress =
        shippingMethod === "RETIRO_LOCAL"
          ? "Retiro en Sucursal — Saavedra 241, Formosa Capital"
          : validated.shippingAddress!.trim();

      const totalOrder = subtotalProducts + shippingCost;

      // 3.1. Generar código correlativo (ej: WEB-2026-0001) y crear registro en tabla Sale
      const orderCode = await generateNextWebOrderCode(tx);

      const sale = await tx.sale.create({
        data: {
          invoiceNumber: orderCode,
          ticketCode: orderCode,
          channel: "WEB",
          status: "PENDIENTE_PAGO",
          reservedUntil: new Date(Date.now() + WEB_ORDER_RESERVATION_MINUTES * 60 * 1000),
          customerId: validated.customerId ?? null,
          customerName: validated.customerName,
          customerDni: validated.customerDni,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone,
          shippingMethod,
          shippingCost: new Prisma.Decimal(shippingCost),
          shippingAddress: effectiveAddress,
          shippingCity: validated.shippingCity,
          shippingPostalCode: validated.shippingPostalCode,
          subtotalGross: new Prisma.Decimal(subtotalProducts),
          discount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(totalOrder),
          notes: validated.notes ?? null,
        },
      });

      // 3.2 y 3.3. Incrementar stockReserved en cada ProductVariant y crear registros en SaleItem
      for (const item of preparedItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockReserved: {
              increment: item.quantity,
            },
          },
        });

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            variantId: item.variantId,
            quantity: item.quantity,
            originalPrice: new Prisma.Decimal(item.unitPrice),
            discount: new Prisma.Decimal(0),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            price: new Prisma.Decimal(item.unitPrice),
            subtotal: new Prisma.Decimal(item.subtotal),
          },
        });
      }

      const expiresAtDate = new Date(
        sale.createdAt.getTime() + WEB_ORDER_RESERVATION_MINUTES * 60 * 1000
      );

      // Generar enlace de contingencia por WhatsApp (Mitigación R-04)
      const itemsText = preparedItems
        .map((i) => `${i.quantity}x ${i.productName} (${i.size}/${i.color})`)
        .join(", ");
      const waMessage = encodeURIComponent(
        `¡Hola Matacos Deportes! Generé el pedido web *${orderCode}* a nombre de ${validated.customerName} (DNI ${validated.customerDni}) por ${formatCurrency(totalOrder)}. Detalle: ${itemsText}.`
      );

      const response: GuestOrderCreatedResult = {
        saleId: sale.id,
        orderCode,
        status: "PENDIENTE_PAGO",
        channel: "WEB",
        customer: {
          name: validated.customerName,
          dni: validated.customerDni,
          email: validated.customerEmail,
          phone: validated.customerPhone,
          isGuest: !validated.customerId,
        },
        shipping: {
          method: shippingMethod,
          address: effectiveAddress,
          city: validated.shippingCity,
          postalCode: validated.shippingPostalCode,
          cost: shippingCost,
        },
        totals: {
          subtotalProducts,
          shippingCost,
          total: totalOrder,
          totalFormatted: formatCurrency(totalOrder),
        },
        items: preparedItems,
        reservation: {
          expiresAt: expiresAtDate.toISOString(),
          expirationMinutes: WEB_ORDER_RESERVATION_MINUTES,
        },
        whatsappContingencyUrl: `https://wa.me/5493704000000?text=${waMessage}`,
        createdAt: sale.createdAt.toISOString(),
      };

      return response;
    });

    // Revalidar caché de catálogo y PDP para reflejar inmediatamente el descuento de disponibilidad (Mitigación R-01)
    await revalidateEcommerceCatalogCache();

    return {
      success: true,
      data: serialize(orderResult),
    };
  } catch (error) {
    console.error("Error en createGuestOrder:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "No se pudo procesar la orden de compra web",
    };
  }
}

/**
 * Cancelar manualmente una orden web pendiente y restituir su stock reservado
 */
export async function cancelGuestOrder(
  orderIdOrCode: string,
  reason = "Cancelada por el cliente antes del pago"
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const cleanId = orderIdOrCode.trim();
    if (!cleanId) {
      return { success: false, error: "Identificador de orden requerido" };
    }

    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          channel: "WEB",
          OR: [{ id: cleanId }, { invoiceNumber: cleanId }],
        },
        include: { items: true },
      });

      if (!sale) {
        throw new Error("Orden web no encontrada");
      }

      if (sale.status !== "PENDIENTE_PAGO") {
        throw new Error(
          `Solo se pueden cancelar órdenes pendientes de pago (estado actual: ${sale.status})`
        );
      }

      for (const item of sale.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          select: { id: true, stockReserved: true },
        });
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stockReserved: Math.max(0, variant.stockReserved - item.quantity),
            },
          });
        }
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: "CANCELADA",
          notes: sale.notes ? `${sale.notes} | ${reason}` : reason,
        },
      });
    });

    await revalidateEcommerceCatalogCache();

    return {
      success: true,
      message: "Orden cancelada y stock reservado liberado correctamente",
    };
  } catch (error) {
    console.error("Error en cancelGuestOrder:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al cancelar la orden web" };
  }
}


/**
 * ============================================================================
 * PASO 2 DEL CHECKOUT: SELECCIÓN Y PROCESAMIENTO DE PAGO SOBRE RESERVA ACTIVA
 * ============================================================================
 */

export interface WebBankTransferDetails {
  bankName: string;
  accountHolder: string;
  cuit: string;
  alias: string;
  cbu: string;
}

export interface WebOrderPaymentResult {
  saleId: string;
  orderCode: string;
  status: "COMPLETADA" | "PENDIENTE_PAGO";
  shippingStatus: "EN_PREPARACION" | "PENDIENTE";
  paymentOption: WebPaymentOption;
  cardBrand: WebCardBrand | null;
  cardLast4: string | null;
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  totalFormatted: string;
  voucherCode: string | null;
  referenceCode: string | null;
  transferReference: string | null;
  bankDetails: WebBankTransferDetails | null;
  whatsappActionUrl: string;
  reservationExpiresAt: string | null;
  processedAt: string;
}

export interface WebOrderResumePayload {
  order: GuestOrderCreatedResult;
  completedPayment: WebOrderPaymentResult | null;
}

export type WebPaymentErrorCode =
  | "VALIDATION_ERROR"
  | "ORDER_NOT_FOUND"
  | "VERIFICATION_FAILED"
  | "ORDER_EXPIRED"
  | "ALREADY_PAID"
  | "PAYMENT_DECLINED"
  | "INVALID_METHOD"
  | "STOCK_CONFLICT"
  | "INTERNAL_ERROR";

function getOfficialBankTransferDetails(): WebBankTransferDetails {
  return {
    bankName: process.env.COMPANY_BANK_NAME || "Banco de Formosa S.A. / Red Link",
    accountHolder: companyConfig.legalName,
    cuit: companyConfig.cuit,
    alias: process.env.COMPANY_BANK_ALIAS || "MATACOS.DEPORTES.FSA",
    cbu: process.env.COMPANY_BANK_CBU || "0110263720026300489124",
  };
}

function matchesBuyerVerification(
  verificationRaw: string,
  saleDni: string | null,
  saleEmail: string | null
): boolean {
  const cleanInput = verificationRaw.trim();
  if (!cleanInput) return false;

  const inputDigits = cleanInput.replace(/\D/g, "");
  const dbDigits = (saleDni || "").replace(/\D/g, "");
  if (inputDigits.length >= 6 && dbDigits && inputDigits === dbDigits) {
    return true;
  }

  if (saleEmail && cleanInput.toLowerCase() === saleEmail.trim().toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Recupera una orden web activa (o recién abonada) para retomar el Paso 2 de pago en /checkout
 */
export async function getWebOrderForCheckoutPayment(
  orderCode: string,
  verification: string
): Promise<{
  success: boolean;
  data?: WebOrderResumePayload;
  code?: WebPaymentErrorCode;
  error?: string;
}> {
  try {
    await releaseExpiredWebOrders(WEB_ORDER_RESERVATION_MINUTES);

    const normalizedCode = orderCode.trim().toUpperCase();
    const normalizedVerification = verification.trim();

    if (!normalizedCode || !normalizedVerification) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        error: "Código de orden y verificación del comprador requeridos.",
      };
    }

    const sale = await prisma.sale.findFirst({
      where: {
        channel: "WEB",
        invoiceNumber: normalizedCode,
      },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
                sku: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!sale || !sale.invoiceNumber) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        error: `No encontramos la orden ${normalizedCode}.`,
      };
    }

    if (
      !matchesBuyerVerification(
        normalizedVerification,
        sale.customerDni,
        sale.customerEmail
      )
    ) {
      return {
        success: false,
        code: "VERIFICATION_FAILED",
        error:
          "El DNI o correo electrónico no coincide con el comprador registrado en este pedido.",
      };
    }

    if (sale.status === "CANCELADA") {
      return {
        success: false,
        code: "ORDER_EXPIRED",
        error:
          "El tiempo de reserva de este pedido expiró o fue cancelado, liberando el stock automáticamente.",
      };
    }

    const shippingMethod: ShippingMethod =
      sale.shippingMethod === "CADETERIA_FORMOSA" ||
      sale.shippingMethod === "CORREO_ARGENTINO"
        ? sale.shippingMethod
        : "RETIRO_LOCAL";

    const subtotalProducts = Number(sale.subtotalGross);
    const shippingCost = Number(sale.shippingCost ?? 0);
    const totalOrder = Number(sale.total);

    const itemsSummary: GuestOrderItemSummary[] = sale.items.map((item) => ({
      variantId: item.variantId,
      productId: item.variant.product.id,
      productName: item.variant.product.name,
      size: item.variant.size,
      color: item.variant.color,
      sku: item.variant.sku,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    }));

    const expiresAtDate = new Date(
      sale.createdAt.getTime() + WEB_ORDER_RESERVATION_MINUTES * 60 * 1000
    );

    const itemsText = itemsSummary
      .map((i) => `${i.quantity}x ${i.productName} (${i.size}/${i.color})`)
      .join(", ");
    const waMessage = encodeURIComponent(
      `¡Hola Matacos Deportes! Consulto por mi pedido web *${sale.invoiceNumber}* a nombre de ${sale.customerName ?? "Cliente"} (DNI ${sale.customerDni ?? "-"}) por ${formatCurrency(totalOrder)}. Detalle: ${itemsText}.`
    );

    const orderDto: GuestOrderCreatedResult = {
      saleId: sale.id,
      orderCode: sale.invoiceNumber,
      status: "PENDIENTE_PAGO",
      channel: "WEB",
      customer: {
        name: sale.customerName ?? "Cliente Web",
        dni: sale.customerDni ?? "",
        email: sale.customerEmail ?? "",
        phone: sale.customerPhone ?? "",
        isGuest: !sale.customerId,
      },
      shipping: {
        method: shippingMethod,
        address:
          sale.shippingAddress ??
          "Retiro en Sucursal — Saavedra 241, Formosa Capital",
        city: sale.shippingCity ?? "Formosa",
        postalCode: sale.shippingPostalCode ?? "3600",
        cost: shippingCost,
      },
      totals: {
        subtotalProducts,
        shippingCost,
        total: totalOrder,
        totalFormatted: formatCurrency(totalOrder),
      },
      items: itemsSummary,
      reservation: {
        expiresAt: expiresAtDate.toISOString(),
        expirationMinutes: WEB_ORDER_RESERVATION_MINUTES,
      },
      whatsappContingencyUrl: `https://wa.me/${companyConfig.whatsappNumber}?text=${waMessage}`,
      createdAt: sale.createdAt.toISOString(),
    };

    let completedPayment: WebOrderPaymentResult | null = null;
    if (sale.status === "COMPLETADA") {
      const firstPayment = sale.payments[0];
      const installments = firstPayment?.installments ?? 1;
      const paymentOption: WebPaymentOption =
        firstPayment?.method === "DEBITO"
          ? "TARJETA_DEBITO"
          : firstPayment?.method === "TRANSFERENCIA"
            ? "TRANSFERENCIA"
            : "TARJETA_CREDITO";

      const cardBrandCandidate = firstPayment?.cardBrand;
      const validCardBrand: WebCardBrand | null =
        cardBrandCandidate === "VISA" ||
        cardBrandCandidate === "MASTERCARD" ||
        cardBrandCandidate === "NARANJA_X" ||
        cardBrandCandidate === "CABAL"
          ? cardBrandCandidate
          : null;

      completedPayment = {
        saleId: sale.id,
        orderCode: sale.invoiceNumber,
        status: "COMPLETADA",
        shippingStatus: "EN_PREPARACION",
        paymentOption,
        cardBrand: validCardBrand,
        cardLast4: null,
        installments,
        installmentAmount: totalOrder / installments,
        totalAmount: totalOrder,
        totalFormatted: formatCurrency(totalOrder),
        voucherCode: firstPayment?.cardVoucher ?? null,
        referenceCode: firstPayment?.referenceCode ?? null,
        transferReference: null,
        bankDetails: null,
        whatsappActionUrl: orderDto.whatsappContingencyUrl,
        reservationExpiresAt: null,
        processedAt: sale.updatedAt.toISOString(),
      };
    }

    return {
      success: true,
      data: serialize({
        order: orderDto,
        completedPayment,
      }),
    };
  } catch (error) {
    console.error("Error en getWebOrderForCheckoutPayment:", error);
    return {
      success: false,
      code: "INTERNAL_ERROR",
      error:
        error instanceof Error
          ? error.message
          : "No se pudo recuperar el pedido para completar el pago.",
    };
  }
}

/**
 * Procesa la selección y ejecución de pago sobre una orden web con stock reservado:
 * - TARJETA_CREDITO / TARJETA_DEBITO: Simula autorización en tiempo real.
 *   Si es aprobada -> descuenta stock físico (Depósito primero, luego Salón), libera stockReserved,
 *   registra InventoryMovement (VENTA_WEB) y SalePayment, y pasa Sale a COMPLETADA (EN_PREPARACION).
 *   Si es rechazada -> mantiene Sale en PENDIENTE_PAGO y conserva la reserva para reintentar.
 * - TRANSFERENCIA / PAGO_LOCAL: Registra el compromiso de pago manteniendo Sale en PENDIENTE_PAGO
 *   y el stock reservado hasta acreditación o cobro en caja de Saavedra 241.
 */
export async function processWebOrderPayment(
  payload: ProcessWebOrderPaymentInput
): Promise<{
  success: boolean;
  data?: WebOrderPaymentResult;
  code?: WebPaymentErrorCode;
  error?: string;
}> {
  try {
    // 0. Liberar órdenes cuya ventana de 15 minutos haya vencido
    await releaseExpiredWebOrders(WEB_ORDER_RESERVATION_MINUTES);

    // 1. Validar entrada con Zod
    const parsed = ProcessWebOrderPaymentSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        code: "VALIDATION_ERROR",
        error:
          parsed.error.errors[0]?.message ||
          "Revisá los datos del medio de pago seleccionado.",
      };
    }
    const validated = parsed.data;
    const normalizedOrderCode = validated.orderCode.toUpperCase();

    // 2. Buscar orden web y verificar titularidad
    const existingSale = await prisma.sale.findFirst({
      where: {
        channel: "WEB",
        invoiceNumber: normalizedOrderCode,
      },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
                sku: true,
                product: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existingSale || !existingSale.invoiceNumber) {
      return {
        success: false,
        code: "ORDER_NOT_FOUND",
        error: `No se encontró la orden web ${normalizedOrderCode}.`,
      };
    }

    if (
      !matchesBuyerVerification(
        validated.verification,
        existingSale.customerDni,
        existingSale.customerEmail
      )
    ) {
      return {
        success: false,
        code: "VERIFICATION_FAILED",
        error:
          "Los datos de verificación del comprador no coinciden con la orden.",
      };
    }

    if (existingSale.status === "CANCELADA") {
      return {
        success: false,
        code: "ORDER_EXPIRED",
        error:
          "El tiempo de reserva de 15 minutos expiró y las unidades fueron liberadas. Volvé a iniciar tu compra para verificar disponibilidad.",
      };
    }

    if (existingSale.status === "COMPLETADA") {
      return {
        success: false,
        code: "ALREADY_PAID",
        error: "Este pedido ya fue abonado y se encuentra confirmado.",
      };
    }

    const totalAmount = Number(existingSale.total);
    const expiresAtIso = new Date(
      existingSale.createdAt.getTime() +
        WEB_ORDER_RESERVATION_MINUTES * 60 * 1000
    ).toISOString();

    // =========================================================================
    // CASO A: PAGO ONLINE INMEDIATO CON TARJETA (CRÉDITO / DÉBITO)
    // =========================================================================
    if (
      validated.paymentOption === "TARJETA_CREDITO" ||
      validated.paymentOption === "TARJETA_DEBITO"
    ) {
      const shouldDecline =
        validated.simulateDecline ||
        validated.cardLast4 === "0000" ||
        (validated.cardHolderName?.toUpperCase().includes("RECHAZ") ?? false);

      if (shouldDecline) {
        return {
          success: false,
          code: "PAYMENT_DECLINED",
          error:
            "Pago rechazado por la entidad emisora de la tarjeta (código de prueba: autorización denegada). Tu stock continúa reservado: podés intentar con otra tarjeta o elegir otro medio de pago.",
        };
      }

      const variantIds = existingSale.items.map((i) => i.variantId);
      const cardBrand = validated.cardBrand!;
      const cardLast4 = validated.cardLast4!;
      const installments =
        validated.paymentOption === "TARJETA_DEBITO"
          ? 1
          : validated.installments;

      const approvedResult = await prisma.$transaction(async (tx) => {
        // Re-verificar orden dentro de la transacción
        const lockedSale = await tx.sale.findUnique({
          where: { id: existingSale.id },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            notes: true,
          },
        });

        if (!lockedSale || lockedSale.status !== "PENDIENTE_PAGO") {
          throw new Error(
            "La orden ya no se encuentra pendiente de pago o expiró durante la operación."
          );
        }

        // Bloqueo pesimista FOR UPDATE sobre las variantes involucradas (Directiva AGENTS.md)
        await tx.$queryRaw`
          SELECT id
          FROM "ProductVariant"
          WHERE id IN (${Prisma.join(variantIds)})
          FOR UPDATE
        `;

        const lockedVariants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            size: true,
            color: true,
            stockStore: true,
            stockWarehouse: true,
            stockReserved: true,
            product: {
              select: { name: true },
            },
          },
        });

        const variantMap = new Map(lockedVariants.map((v) => [v.id, v]));

        // Descontar stock físico real (prioridad Depósito en canal WEB) y liberar stockReserved
        for (const saleItem of existingSale.items) {
          const variant = variantMap.get(saleItem.variantId);
          if (!variant) {
            throw new Error(
              `Variante no encontrada al confirmar pago (${saleItem.variantId}).`
            );
          }

          const totalPhysical = variant.stockStore + variant.stockWarehouse;
          if (totalPhysical < saleItem.quantity) {
            throw new Error(
              `Conflicto de inventario en "${variant.product.name}" (Talle ${variant.size}). Stock físico insuficiente.`
            );
          }

          const deductFromWarehouse = Math.min(
            variant.stockWarehouse,
            saleItem.quantity
          );
          const deductFromStore = saleItem.quantity - deductFromWarehouse;

          const newStockWarehouse =
            variant.stockWarehouse - deductFromWarehouse;
          const newStockStore = variant.stockStore - deductFromStore;
          const newStockReserved = Math.max(
            0,
            variant.stockReserved - saleItem.quantity
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

          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "VENTA_WEB",
              quantity: saleItem.quantity,
              stockAfter: totalStockAfter,
              location,
              reason: `Pago online aprobado Orden ${normalizedOrderCode} (Salón: -${deductFromStore}, Depósito: -${deductFromWarehouse})`,
            },
          });
        }

        const voucherCode = `AUT-${Math.floor(100000 + Math.random() * 900000)}`;
        const referenceCode = `WEB-${Date.now().toString().slice(-6)}`;
        const prismaMethod =
          validated.paymentOption === "TARJETA_CREDITO" ? "CREDITO" : "DEBITO";

        await tx.salePayment.create({
          data: {
            saleId: existingSale.id,
            method: prismaMethod,
            amount: existingSale.total,
            cardBrand,
            cardVoucher: voucherCode,
            installments,
            referenceCode,
          },
        });

        const auditNote = `[PAGO ONLINE APROBADO] ${prismaMethod} ${cardBrand} ****${cardLast4} (${installments} pago/s) - Cód. Aut: ${voucherCode}`;
        const updatedNotes = lockedSale.notes
          ? `${lockedSale.notes} | ${auditNote}`
          : auditNote;

        const updatedSale = await tx.sale.update({
          where: { id: existingSale.id },
          data: {
            status: "COMPLETADA",
            shippingStatus: "EN_PREPARACION",
            notes: updatedNotes,
          },
          select: {
            updatedAt: true,
          },
        });

        const waMsg = encodeURIComponent(
          `¡Hola Matacos Deportes! Ya aboné con tarjeta (${cardBrand} ****${cardLast4}, Cód. ${voucherCode}) mi pedido web *${normalizedOrderCode}* por ${formatCurrency(totalAmount)}.`
        );

        const result: WebOrderPaymentResult = {
          saleId: existingSale.id,
          orderCode: normalizedOrderCode,
          status: "COMPLETADA",
          shippingStatus: "EN_PREPARACION",
          paymentOption: validated.paymentOption,
          cardBrand,
          cardLast4,
          installments,
          installmentAmount: totalAmount / installments,
          totalAmount,
          totalFormatted: formatCurrency(totalAmount),
          voucherCode,
          referenceCode,
          transferReference: null,
          bankDetails: null,
          whatsappActionUrl: `https://wa.me/${companyConfig.whatsappNumber}?text=${waMsg}`,
          reservationExpiresAt: null,
          processedAt: updatedSale.updatedAt.toISOString(),
        };

        return result;
      });

      await revalidateEcommerceCatalogCache();

      return {
        success: true,
        data: serialize(approvedResult),
      };
    }

    // =========================================================================
    // CASO B: COMPROMISO DE PAGO DIFERIDO (TRANSFERENCIA BANCARIA O PAGO EN LOCAL)
    // =========================================================================
    if (
      validated.paymentOption === "PAGO_LOCAL" &&
      existingSale.shippingMethod !== "RETIRO_LOCAL"
    ) {
      return {
        success: false,
        code: "INVALID_METHOD",
        error:
          "El pago presencial en mostrador solo está disponible cuando seleccionás Retiro gratis en el local (Saavedra 241).",
      };
    }

    const cleanTransferRef = validated.transferReference?.trim() || null;
    const bankDetails =
      validated.paymentOption === "TRANSFERENCIA"
        ? getOfficialBankTransferDetails()
        : null;

    const preferenceTag =
      validated.paymentOption === "TRANSFERENCIA"
        ? `[PAGO PENDIENTE: TRANSFERENCIA BANCARIA${cleanTransferRef ? ` - Comp: ${cleanTransferRef}` : ""}]`
        : "[PAGO PENDIENTE: ABONA AL RETIRAR EN CAJA SAAVEDRA 241]";

    const baseNotes = (existingSale.notes || "")
      .replace(/\s*\|\s*\[PAGO PENDIENTE:[^\]]+\]/g, "")
      .replace(/^\[PAGO PENDIENTE:[^\]]+\]\s*\|\s*/g, "")
      .replace(/^\[PAGO PENDIENTE:[^\]]+\]$/g, "")
      .trim();

    const mergedNotes = baseNotes
      ? `${baseNotes} | ${preferenceTag}`
      : preferenceTag;

    const updatedPendingSale = await prisma.sale.update({
      where: { id: existingSale.id },
      data: {
        notes: mergedNotes,
      },
      select: {
        updatedAt: true,
      },
    });

    const whatsappText =
      validated.paymentOption === "TRANSFERENCIA"
        ? `¡Hola Matacos Deportes! Realicé el pedido web *${normalizedOrderCode}* por *${formatCurrency(totalAmount)}* a nombre de ${existingSale.customerName ?? "Cliente"} (DNI ${existingSale.customerDni ?? "-"})${cleanTransferRef ? ` — N° de comprobante: ${cleanTransferRef}` : ""}. Envío el comprobante de transferencia al alias ${bankDetails?.alias} para confirmar mi compra.`
        : `¡Hola Matacos Deportes! Reservé el pedido web *${normalizedOrderCode}* por *${formatCurrency(totalAmount)}* a nombre de ${existingSale.customerName ?? "Cliente"} (DNI ${existingSale.customerDni ?? "-"}) para retirar y abonar en mostrador de Saavedra 241.`;

    const pendingResult: WebOrderPaymentResult = {
      saleId: existingSale.id,
      orderCode: normalizedOrderCode,
      status: "PENDIENTE_PAGO",
      shippingStatus: "PENDIENTE",
      paymentOption: validated.paymentOption,
      cardBrand: null,
      cardLast4: null,
      installments: 1,
      installmentAmount: totalAmount,
      totalAmount,
      totalFormatted: formatCurrency(totalAmount),
      voucherCode: null,
      referenceCode: null,
      transferReference: cleanTransferRef,
      bankDetails,
      whatsappActionUrl: `https://wa.me/${companyConfig.whatsappNumber}?text=${encodeURIComponent(whatsappText)}`,
      reservationExpiresAt: expiresAtIso,
      processedAt: updatedPendingSale.updatedAt.toISOString(),
    };

    return {
      success: true,
      data: serialize(pendingResult),
    };
  } catch (error) {
    console.error("Error en processWebOrderPayment:", error);
    return {
      success: false,
      code: "INTERNAL_ERROR",
      error:
        error instanceof Error
          ? error.message
          : "Ocurrió un error al procesar el pago del pedido web.",
    };
  }
}
