"use server";

import { prisma } from "@/lib/prisma";
import {
  CreatePendingSaleSchema,
  CreatePendingSaleInput,
  CreatePendingExchangeSaleSchema,
  CreatePendingExchangeSaleInput,
  UpdatePendingSaleSchema,
  UpdatePendingSaleInput,
  CompletePendingSaleSchema,
  CompletePendingSaleInput,
  CreateSaleSchema,
  CreateSaleInput,
} from "@/schemas/sale";
import {
  calculateSaleTotals,
  RawSaleItemInput,
  DiscountConfig,
} from "@/lib/discounts";
import { CreateQuickPosProductSchema, CreateQuickPosProductInput } from "@/schemas/product";
import { Prisma, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { formatCurrency } from "@/lib/utils";
import { resolveEffectiveProductPromo } from "@/server/services/landingService";
import {
  getNextOfficialInvoiceNumber,
  buildReceiptPayloadFromSaleRecord,
} from "@/server/services/receiptService";


export interface PendingSaleSummaryResult {
  saleId: string;
  ticketCode: string | null;
  customerName: string | null;
  subtotalGross: number;
  totalDiscount: number;
  totalNet: number;
  itemsCount: number;
  sale?: any;
}

function serializeData<T>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "object" && typeof obj.toNumber === "function") {
    return obj.toNumber() as unknown as T;
  }
  if (typeof obj === "object" && "d" in obj && "e" in obj && "s" in obj) {
    return Number(obj) as unknown as T;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeData(item)) as any;
  }
  if (typeof obj === "object") {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = serializeData(obj[key]);
    }
    return res;
  }
  return obj;
}

/**
 * Búsqueda de productos optimizada para Server Actions en mostrador
 */
export async function searchPosProducts(query: string) {
  const q = query.trim();
  if (!q) return { success: true, items: [] };

  try {
    const words = q.split(/\s+/).filter(Boolean);

    // 1. Verificar si hay coincidencia exacta por código de barras o SKU
    const exactVariant = await prisma.productVariant.findFirst({
      where: {
        product: { active: true },
        OR: [{ barcode: q }, { sku: q }],
      },
      include: {
        product: {
          include: {
            brand: { select: { name: true } },
            category: { select: { name: true } },
            variants: {
              select: {
                id: true,
                size: true,
                color: true,
                sku: true,
                barcode: true,
                stockStore: true,
                stockWarehouse: true,
                stockReserved: true,
                price: true,
              },
            },
          },
        },
      },
    });

    // 2. Buscar productos que coincidan por nombre, marca, categoría o variantes
    const products = await prisma.product.findMany({
      where: {
        active: true,
        ...(words.length === 1
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { brand: { name: { contains: q, mode: "insensitive" } } },
                { category: { name: { contains: q, mode: "insensitive" } } },
                { variants: { some: { barcode: q } } },
                { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
                { variants: { some: { color: { contains: q, mode: "insensitive" } } } },
                { variants: { some: { size: { contains: q, mode: "insensitive" } } } },
              ],
            }
          : {
              AND: words.map((w) => ({
                OR: [
                  { name: { contains: w, mode: "insensitive" } },
                  { brand: { name: { contains: w, mode: "insensitive" } } },
                  { category: { name: { contains: w, mode: "insensitive" } } },
                  { variants: { some: { barcode: { contains: w, mode: "insensitive" } } } },
                  { variants: { some: { sku: { contains: w, mode: "insensitive" } } } },
                  { variants: { some: { color: { contains: w, mode: "insensitive" } } } },
                  { variants: { some: { size: { contains: w, mode: "insensitive" } } } },
                ],
              })),
            }),
      },
      take: 20,
      orderBy: [{ name: "asc" }],
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        variants: {
          select: {
            id: true,
            size: true,
            color: true,
            sku: true,
            barcode: true,
            stockStore: true,
            stockWarehouse: true,
            stockReserved: true,
            price: true,
          },
        },
      },
    });

    const now = new Date();
    const items = products.map((prod) => {
      const totalStockStore = prod.variants.reduce(
        (sum, v) => sum + Math.max(0, v.stockStore - (v.stockReserved || 0)),
        0
      );

      const promo = resolveEffectiveProductPromo(prod, now);
      const prodBasePrice = Number(prod.price);
      const prodPrice = promo.isPromoActive ? promo.effectivePrice : prodBasePrice;

      return {
        productId: prod.id,
        name: prod.name,
        brand: prod.brand.name,
        category: prod.category.name,
        price: prodPrice,
        originalPrice: promo.isPromoActive ? prodBasePrice : undefined,
        discountActive: promo.isPromoActive,
        discountPercentage: promo.isPromoActive ? promo.discountPercentage : null,
        imageUrl: prod.imageUrl,
        totalStockStore,
        variantsCount: prod.variants.length,
        isExactBarcodeMatch: exactVariant && exactVariant.product.id === prod.id,
        exactVariant:
          exactVariant && exactVariant.product.id === prod.id
            ? {
                id: exactVariant.id,
                size: exactVariant.size,
                color: exactVariant.color,
                sku: exactVariant.sku,
                barcode: exactVariant.barcode,
                stockStore: exactVariant.stockStore,
                stockReserved: exactVariant.stockReserved || 0,
                price: (() => {
                  const vBase = exactVariant.price ? Number(exactVariant.price) : prodBasePrice;
                  if (promo.isPromoActive && promo.discountPercentage) {
                    const vDiscount = Math.round(((vBase * promo.discountPercentage) / 100) * 100) / 100;
                    return Math.max(0, Math.round((vBase - vDiscount) * 100) / 100);
                  }
                  return vBase;
                })(),
                originalPrice: exactVariant.price ? Number(exactVariant.price) : prodBasePrice,
              }
            : undefined,
        availableVariants: prod.variants.map((v) => {
          const vBase = v.price ? Number(v.price) : prodBasePrice;
          let vEffective = vBase;
          if (promo.isPromoActive && promo.discountPercentage) {
            const vDiscount = Math.round(((vBase * promo.discountPercentage) / 100) * 100) / 100;
            vEffective = Math.max(0, Math.round((vBase - vDiscount) * 100) / 100);
          }
          return {
            id: v.id,
            size: v.size,
            color: v.color,
            sku: v.sku,
            barcode: v.barcode,
            stockStore: v.stockStore,
            stockReserved: v.stockReserved || 0,
            price: vEffective,
            originalPrice: promo.isPromoActive ? vBase : undefined,
          };
        }),
      };
    });

    // Si hubo coincidencia exacta y no estaba en la lista, anteponerla
    if (exactVariant && !items.some((it) => it.productId === exactVariant.product.id)) {
      const prod = exactVariant.product;
      const totalStockStore = prod.variants.reduce(
        (sum, v) => sum + Math.max(0, v.stockStore - (v.stockReserved || 0)),
        0
      );
      const promo = resolveEffectiveProductPromo(prod, now);
      const prodBasePrice = Number(prod.price);
      const prodPrice = promo.isPromoActive ? promo.effectivePrice : prodBasePrice;

      items.unshift({
        productId: prod.id,
        name: prod.name,
        brand: prod.brand.name,
        category: prod.category.name,
        price: prodPrice,
        originalPrice: promo.isPromoActive ? prodBasePrice : undefined,
        discountActive: promo.isPromoActive,
        discountPercentage: promo.isPromoActive ? promo.discountPercentage : null,
        imageUrl: prod.imageUrl,
        totalStockStore,
        variantsCount: prod.variants.length,
        isExactBarcodeMatch: true,
        exactVariant: {
          id: exactVariant.id,
          size: exactVariant.size,
          color: exactVariant.color,
          sku: exactVariant.sku,
          barcode: exactVariant.barcode,
          stockStore: exactVariant.stockStore,
          stockReserved: exactVariant.stockReserved || 0,
          price: (() => {
            const vBase = exactVariant.price ? Number(exactVariant.price) : prodBasePrice;
            if (promo.isPromoActive && promo.discountPercentage) {
              const vDiscount = Math.round(((vBase * promo.discountPercentage) / 100) * 100) / 100;
              return Math.max(0, Math.round((vBase - vDiscount) * 100) / 100);
            }
            return vBase;
          })(),
          originalPrice: exactVariant.price ? Number(exactVariant.price) : prodBasePrice,
        },
        availableVariants: prod.variants.map((v) => {
          const vBase = v.price ? Number(v.price) : prodBasePrice;
          let vEffective = vBase;
          if (promo.isPromoActive && promo.discountPercentage) {
            const vDiscount = Math.round(((vBase * promo.discountPercentage) / 100) * 100) / 100;
            vEffective = Math.max(0, Math.round((vBase - vDiscount) * 100) / 100);
          }
          return {
            id: v.id,
            size: v.size,
            color: v.color,
            sku: v.sku,
            barcode: v.barcode,
            stockStore: v.stockStore,
            stockReserved: v.stockReserved || 0,
            price: vEffective,
            originalPrice: promo.isPromoActive ? vBase : undefined,
          };
        }),
      });
    }

    return { success: true, items };
  } catch (error) {
    console.error("Error en searchPosProducts:", error);
    return { success: false, error: "Error al realizar la búsqueda" };
  }
}

/**
 * Previsualizar y calcular totales y descuentos en tiempo real (RF-08)
 * Permite al Frontend obtener el desglose exacto antes de enviar la transacción.
 */
export async function previewSaleTotals(
  items: RawSaleItemInput[],
  globalDiscount?: DiscountConfig | null
) {
  try {
    const totals = calculateSaleTotals(items, globalDiscount);
    return { success: true, data: totals };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al calcular totales" };
  }
}

/**
 * Crear Preventa en Salón de Ventas (Terminal 1)
 * Aplica motor de descuentos (RF-08), reserva stock preventivo y genera ticket #042
 */
export async function createPendingSale(input: CreatePendingSaleInput) {
  try {
    // 1. Validar payload con Zod
    const validated = CreatePendingSaleSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 2. Verificar existencia y stock disponible de cada variante en salón
      const variantIds = validated.items.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          product: {
            select: { name: true, active: true },
          },
        },
      });

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of validated.items) {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          throw new Error(`Variante no encontrada: ${item.variantId}`);
        }
        if (!variant.product.active) {
          throw new Error(`El producto "${variant.product.name}" se encuentra inactivo.`);
        }

        const stockAvailable = variant.stockStore - variant.stockReserved;
        if (stockAvailable < item.quantity) {
          throw new Error(
            `Stock insuficiente en salón para "${variant.product.name}" (Talle ${variant.size}, Color ${variant.color}). Disponible: ${stockAvailable}, Solicitado: ${item.quantity}`
          );
        }
      }

      // 3. Generar número de ticket correlativo del día (#001, #002...)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const countToday = await tx.sale.count({
        where: { createdAt: { gte: todayStart } },
      });
      const ticketCode = `#${String(countToday + 1).padStart(3, "0")}`;
      const invoiceNumber = `PRE-${Date.now().toString().slice(-8)}`;

      // 4. Calcular importes con el motor determinista de descuentos (RF-08)
      const totals = calculateSaleTotals(
        validated.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          originalPrice: i.originalPrice,
          discountType: i.discountType,
          discountValue: i.discountValue,
        })),
        validated.globalDiscount
      );

      // 5. Crear Venta en estado PENDIENTE_PAGO
      const sale = await tx.sale.create({
        data: {
          ticketCode,
          invoiceNumber,
          offlineId: validated.offlineId ?? null,
          sellerId: validated.sellerId ?? null,
          customerName: validated.customerName,
          channel: "MOSTRADOR",
          status: "PENDIENTE_PAGO",
          subtotalGross: new Prisma.Decimal(totals.subtotalGross),
          discount: new Prisma.Decimal(totals.totalDiscount),
          discountType: validated.globalDiscount?.type,
          discountValue: validated.globalDiscount?.value
            ? new Prisma.Decimal(validated.globalDiscount.value)
            : null,
          total: new Prisma.Decimal(totals.totalNet),
          notes: validated.notes ?? null,
        },
      });

      // 6. Crear ítems y reservar stock preventivo
      for (const item of totals.items) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            variantId: item.variantId,
            quantity: item.quantity,
            originalPrice: new Prisma.Decimal(item.originalPrice),
            discount: new Prisma.Decimal(item.unitDiscount),
            discountType: item.discountType,
            discountValue: item.discountValue ? new Prisma.Decimal(item.discountValue) : null,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            price: new Prisma.Decimal(item.unitPrice),
            subtotal: new Prisma.Decimal(item.subtotal),
          },
        });

        // Incrementar reserva preventiva en salón
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockReserved: { increment: item.quantity } },
        });
      }

      return {
        saleId: sale.id,
        ticketCode,
        customerName: validated.customerName,
        subtotalGross: totals.subtotalGross,
        totalDiscount: totals.totalDiscount,
        totalNet: totals.totalNet,
        itemsCount: totals.items.length,
      };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignored outside Next.js request context (e.g. testing scripts)
    }

    return { success: true, data: serializeData<PendingSaleSummaryResult>(result) };
  } catch (error: any) {
    console.error("Error en createPendingSale:", error);
    return { success: false, error: error.message || "Error al generar la preventa" };
  }
}

/**
 * Modificar Preventa en Caja Mostrador antes del cobro (RF-08 / Terminal 2)
 * Permite cambiar ítems, talles, cantidades y descuentos (% o $), rebalanceando el stock reservado.
 */
export async function updatePendingSale(input: UpdatePendingSaleInput) {
  try {
    const validated = UpdatePendingSaleSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener la preventa existente
      const existingSale = await tx.sale.findUnique({
        where: { id: validated.saleId },
        include: { items: true },
      });

      if (!existingSale) throw new Error("Preventa no encontrada");
      if (existingSale.status !== "PENDIENTE_PAGO") {
        throw new Error("Solo se pueden editar preventas pendientes de pago");
      }

      // Mapear reservas previas
      const oldReservations = new Map<string, number>();
      for (const oldItem of existingSale.items) {
        oldReservations.set(
          oldItem.variantId,
          (oldReservations.get(oldItem.variantId) || 0) + oldItem.quantity
        );
      }

      // Mapear nuevas reservas deseadas
      const newReservations = new Map<string, number>();
      for (const newItem of validated.items) {
        newReservations.set(
          newItem.variantId,
          (newReservations.get(newItem.variantId) || 0) + newItem.quantity
        );
      }

      // Todas las variantes involucradas en el cambio
      const allVariantIds = Array.from(
        new Set([...oldReservations.keys(), ...newReservations.keys()])
      );

      const variants = await tx.productVariant.findMany({
        where: { id: { in: allVariantIds } },
        include: { product: true },
      });
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      // 2. Validar disponibilidad de stock para las variantes que aumentan cantidad
      for (const [vId, newQty] of newReservations.entries()) {
        const oldQty = oldReservations.get(vId) || 0;
        const diff = newQty - oldQty;
        if (diff > 0) {
          const v = variantMap.get(vId);
          if (!v) throw new Error(`Variante no encontrada: ${vId}`);
          const available = v.stockStore - v.stockReserved;
          if (available < diff) {
            throw new Error(
              `Stock insuficiente para "${v.product.name}" (${v.size}/${v.color}). Se solicitaron ${diff} un. adicionales pero solo hay ${available} disponibles.`
            );
          }
        }
      }

      // 3. Ajustar reservas de stock atómicamente
      for (const vId of allVariantIds) {
        const oldQty = oldReservations.get(vId) || 0;
        const newQty = newReservations.get(vId) || 0;
        const diff = newQty - oldQty;
        if (diff !== 0) {
          await tx.productVariant.update({
            where: { id: vId },
            data: { stockReserved: { increment: diff } },
          });
        }
      }

      // 4. Recalcular importes y descuentos
      const totals = calculateSaleTotals(
        validated.items.map((i) => {
          let dType = i.discountType;
          let dVal = i.discountValue;
          if (!dType && !dVal && i.unitPrice !== undefined && i.unitPrice < i.originalPrice) {
            dType = "FIXED";
            dVal = Math.round((i.originalPrice - i.unitPrice) * 100) / 100;
          }
          return {
            variantId: i.variantId,
            quantity: i.quantity,
            originalPrice: i.originalPrice,
            discountType: dType,
            discountValue: dVal,
          };
        }),
        validated.globalDiscount
      );

      // 5. Reemplazar los ítems de la venta
      await tx.saleItem.deleteMany({
        where: { saleId: existingSale.id },
      });

      for (const item of totals.items) {
        await tx.saleItem.create({
          data: {
            saleId: existingSale.id,
            variantId: item.variantId,
            quantity: item.quantity,
            originalPrice: new Prisma.Decimal(item.originalPrice),
            discount: new Prisma.Decimal(item.unitDiscount),
            discountType: item.discountType,
            discountValue: item.discountValue ? new Prisma.Decimal(item.discountValue) : null,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            price: new Prisma.Decimal(item.unitPrice),
            subtotal: new Prisma.Decimal(item.subtotal),
          },
        });
      }

      // 6. Actualizar cabecera de la venta
      const updated = await tx.sale.update({
        where: { id: existingSale.id },
        data: {
          customerName: validated.customerName ?? existingSale.customerName,
          subtotalGross: new Prisma.Decimal(totals.subtotalGross),
          discount: new Prisma.Decimal(totals.totalDiscount),
          discountType: validated.globalDiscount?.type,
          discountValue: validated.globalDiscount?.value
            ? new Prisma.Decimal(validated.globalDiscount.value)
            : null,
          total: new Prisma.Decimal(totals.totalNet),
          notes: validated.notes !== undefined ? validated.notes : existingSale.notes,
        },
      });

      const fullUpdatedSale = await tx.sale.findUnique({
        where: { id: existingSale.id },
        include: {
          seller: {
            select: { id: true, name: true },
          },
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  size: true,
                  color: true,
                  sku: true,
                  barcode: true,
                  stockStore: true,
                  stockWarehouse: true,
                  stockReserved: true,
                  price: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                      price: true,
                      brand: { select: { name: true } },
                      category: { select: { name: true } },
                      variants: {
                        select: {
                          id: true,
                          size: true,
                          color: true,
                          sku: true,
                          barcode: true,
                          stockStore: true,
                          stockReserved: true,
                          price: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return {
        saleId: updated.id,
        ticketCode: updated.ticketCode,
        customerName: updated.customerName,
        subtotalGross: totals.subtotalGross,
        totalDiscount: totals.totalDiscount,
        totalNet: totals.totalNet,
        itemsCount: totals.items.length,
        sale: fullUpdatedSale,
      };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignored outside Next.js request context
    }

    return { success: true, data: serializeData<PendingSaleSummaryResult>(result) };
  } catch (error: any) {
    console.error("Error en updatePendingSale:", error);
    return { success: false, error: error.message || "Error al modificar la preventa" };
  }
}

/**
 * Cobro de Preventa en Caja Mostrador (RF-09 / Terminal 2)
 * Admite pagos combinados (Efectivo, Débito, Crédito, QR, Transferencia), calcula vuelto,
 * descuenta definitivamente de stockStore, libera stockReserved y genera auditoría de movimientos.
 */
export async function completePendingSale(input: CompletePendingSaleInput) {
  try {
    const validated = CompletePendingSaleSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener la preventa y sus ítems
      const sale = await tx.sale.findUnique({
        where: { id: validated.saleId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      if (!sale) throw new Error("Preventa no encontrada");
      if (sale.status !== "PENDIENTE_PAGO") {
        throw new Error(`La venta ya se encuentra en estado ${sale.status}`);
      }

      // 2. Validar o resolver turno de caja activo (RF-11: Bloqueo de cobro sin caja abierta)
      let resolvedCashShiftId = validated.cashShiftId ?? null;
      let shiftUserId: string | null = null;

      if (resolvedCashShiftId) {
        const shift = await tx.cashShift.findUnique({
          where: { id: resolvedCashShiftId },
        });
        if (!shift) throw new Error("Turno de caja no encontrado.");
        if (shift.status !== "ABIERTA") {
          throw new Error("El turno de caja especificado ya se encuentra cerrado.");
        }
        shiftUserId = shift.userId;
      } else {
        const activeShift = await tx.cashShift.findFirst({
          where: {
            ...(validated.terminalId ? { terminalId: validated.terminalId } : {}),
            status: "ABIERTA",
          },
          orderBy: { openedAt: "desc" },
        });

        if (!activeShift) {
          throw new Error(
            "No se puede procesar el cobro: La caja se encuentra cerrada en el mostrador. Debe abrir el turno de caja antes de cobrar."
          );
        }
        resolvedCashShiftId = activeShift.id;
        shiftUserId = activeShift.userId;
      }

      // 3. Validar que la suma de pagos cubra el total neto
      const totalNet = Number(sale.total);
      const totalPayments = validated.payments.reduce((sum, p) => sum + p.amount, 0);

      if (totalPayments < totalNet - 0.05) {
        throw new Error(
          `Los pagos ingresados ($ ${totalPayments.toFixed(2)}) no cubren el total de la venta ($ ${totalNet.toFixed(2)}).`
        );
      }

      // 4. Generar número de comprobante oficial correlativo (RF-10: PPPPP-NNNNNNNN)
      const { invoiceNumber } = await getNextOfficialInvoiceNumber(tx);


      // 5. Descontar definitivamente de stockStore, liberar stockReserved y registrar movimiento
      for (const item of sale.items) {
        const variant = item.variant;
        const newStockStore = variant.stockStore - item.quantity;
        const newStockReserved = Math.max(0, variant.stockReserved - item.quantity);
        const totalStockAfter = newStockStore + variant.stockWarehouse;

        // Actualizar stock de la variante
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stockStore: newStockStore,
            stockReserved: newStockReserved,
          },
        });

        // Registrar auditoría en InventoryMovement
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            type: "VENTA_MOSTRADOR",
            quantity: item.quantity,
            stockAfter: totalStockAfter,
            location: "STORE",
            reason: `Venta Mostrador ${invoiceNumber} (Ticket ${sale.ticketCode || "Salón"})`,
          },
        });
      }

      // 5.1 Reingreso de prenda devuelta si la preventa provino de un Cambio / Devolución
      const exchangeMatch = sale.notes?.match(/\[CAMBIO:returnVariantId=([^:]+):qty=(\d+)(?::reason=([^\]]*))?\]/);
      if (exchangeMatch) {
        const returnVariantId = exchangeMatch[1];
        const returnQty = parseInt(exchangeMatch[2], 10);
        const rawReason = exchangeMatch[3] ? decodeURIComponent(exchangeMatch[3]) : "Cambio de producto";

        const returnVariant = await tx.productVariant.findUnique({
          where: { id: returnVariantId },
          include: { product: true },
        });

        if (returnVariant) {
          const newReturnStore = returnVariant.stockStore + returnQty;
          const totalReturnAfter = newReturnStore + returnVariant.stockWarehouse;

          await tx.productVariant.update({
            where: { id: returnVariant.id },
            data: { stockStore: newReturnStore },
          });

          await tx.inventoryMovement.create({
            data: {
              variantId: returnVariant.id,
              type: "DEVOLUCION_CLIENTE",
              quantity: returnQty,
              stockAfter: totalReturnAfter,
              location: "STORE",
              reason: `Reingreso por cambio de prenda (Ticket ${sale.ticketCode || "Salón"} - Comprobante ${invoiceNumber}): Devuelto por ${sale.customerName || "Cliente"}. Motivo: ${rawReason}`,
            },
          });
        }
      }

      // 6. Registrar los medios de pago con cálculo de vuelto
      let totalChangeGiven = 0;

      for (const payment of validated.payments) {
        let change: number | null = null;
        let received: number | null = null;

        if (payment.method === "EFECTIVO") {
          received = payment.receivedAmount ?? payment.amount;
          if (received < payment.amount - 0.05) {
            throw new Error(
              `El monto entregado en efectivo ($ ${received.toFixed(2)}) es menor al monto a abonar ($ ${payment.amount.toFixed(2)}).`
            );
          }
          change = Math.max(0, Math.round((received - payment.amount) * 100) / 100);
          totalChangeGiven += change;
        }

        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            method: payment.method as PaymentMethod,
            amount: new Prisma.Decimal(payment.amount),
            receivedAmount: received !== null ? new Prisma.Decimal(received) : null,
            change: change !== null ? new Prisma.Decimal(change) : null,
            cardBrand: payment.cardBrand ?? null,
            cardVoucher: payment.cardVoucher ?? null,
            installments: payment.installments ?? null,
            referenceCode: payment.referenceCode ?? null,
          },
        });
      }

      // 7. Actualizar la venta a estado COMPLETADA
      const completedSale = await tx.sale.update({
        where: { id: sale.id },
        data: {
          invoiceNumber,
          status: "COMPLETADA",
          cashierId: validated.cashierId ?? shiftUserId ?? null,
          cashShiftId: resolvedCashShiftId,
        },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { brand: true },
                  },
                },
              },
            },
          },
          payments: true,
          seller: { select: { id: true, name: true, email: true } },
          cashier: { select: { id: true, name: true, email: true } },
        },
      });

      const receipt = buildReceiptPayloadFromSaleRecord(completedSale);

      return {
        sale: completedSale,
        invoiceNumber,
        totalNet,
        totalPayments,
        totalChangeGiven,
        receipt,
      };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignored outside Next.js request context
    }

    return {
      success: true,
      data: serializeData(result.sale),
      receipt: result.receipt,
      message: `Venta ${result.invoiceNumber} cobrada con éxito. Vuelto: $ ${result.totalChangeGiven.toFixed(2)}`,
    };

  } catch (error: any) {
    console.error("Error en completePendingSale:", error);
    if (error?.issues && Array.isArray(error.issues)) {
      const messages = error.issues.map((i: any) => i.message).join(", ");
      return { success: false, error: messages };
    }
    return { success: false, error: error.message || "Error al procesar el cobro" };
  }
}

/**
 * Cobro Directo en Mostrador (Sin preventa previa en salón)
 * Realiza el escaneo, cálculo de descuentos, cobro multimétodo y baja de stock en una sola transacción.
 */
export async function createDirectSale(input: CreateSaleInput) {
  try {
    const validated = CreateSaleSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verificar o resolver turno de caja activo (RF-11: Bloqueo de cobro sin caja abierta)
      let resolvedCashShiftId = validated.cashShiftId ?? null;
      let shiftUserId: string | null = null;

      if (resolvedCashShiftId) {
        const shift = await tx.cashShift.findUnique({ where: { id: resolvedCashShiftId } });
        if (!shift || shift.status !== "ABIERTA") {
          throw new Error("El turno de caja especificado se encuentra cerrado o no existe.");
        }
        shiftUserId = shift.userId;
      } else {
        const activeShift = await tx.cashShift.findFirst({
          where: {
            ...(validated.terminalId ? { terminalId: validated.terminalId } : {}),
            status: "ABIERTA",
          },
          orderBy: { openedAt: "desc" },
        });

        if (!activeShift) {
          throw new Error(
            "No se puede procesar el cobro: La caja se encuentra cerrada en el mostrador. Debe abrir el turno de caja antes de cobrar."
          );
        }
        resolvedCashShiftId = activeShift.id;
        shiftUserId = activeShift.userId;
      }

      // 2. Verificar disponibilidad de stock en salón
      const variantIds = validated.items.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });
      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of validated.items) {
        const v = variantMap.get(item.variantId);
        if (!v) throw new Error(`Variante no encontrada: ${item.variantId}`);
        const available = v.stockStore - v.stockReserved;
        if (available < item.quantity) {
          throw new Error(`Stock insuficiente en mostrador para ${v.product.name}.`);
        }
      }

      // 3. Generar número de comprobante oficial correlativo (RF-10: PPPPP-NNNNNNNN)
      const { invoiceNumber } = await getNextOfficialInvoiceNumber(tx);


      // 4. Calcular totales
      const totals = calculateSaleTotals(
        validated.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          originalPrice: i.price,
          discountType: i.discountType,
          discountValue: i.discountValue,
        })),
        validated.discountType && validated.discountValue
          ? { type: validated.discountType, value: validated.discountValue }
          : validated.discount > 0
          ? { type: "FIXED", value: validated.discount }
          : null
      );

      // 5. Validar pagos
      const totalPayments = validated.payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPayments < totals.totalNet - 0.05) {
        throw new Error(
          `Los pagos ingresados ($ ${totalPayments.toFixed(2)}) no cubren el total neto ($ ${totals.totalNet.toFixed(2)}).`
        );
      }

      // 6. Crear Venta COMPLETADA
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          offlineId: validated.offlineId ?? null,
          sellerId: validated.sellerId ?? validated.userId ?? null,
          cashierId: validated.cashierId ?? validated.userId ?? shiftUserId ?? null,
          cashShiftId: resolvedCashShiftId,
          customerName: validated.customerName || "Cliente Mostrador",
          channel: validated.channel || "MOSTRADOR",
          status: "COMPLETADA",
          subtotalGross: new Prisma.Decimal(totals.subtotalGross),
          discount: new Prisma.Decimal(totals.totalDiscount),
          discountType: validated.discountType,
          discountValue: validated.discountValue ? new Prisma.Decimal(validated.discountValue) : null,
          total: new Prisma.Decimal(totals.totalNet),
        },
      });

      // 7. Crear SaleItems y descontar stock
      for (const item of totals.items) {
        const variant = variantMap.get(item.variantId)!;
        const newStockStore = variant.stockStore - item.quantity;

        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stockStore: newStockStore },
        });

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            variantId: item.variantId,
            quantity: item.quantity,
            originalPrice: new Prisma.Decimal(item.originalPrice),
            discount: new Prisma.Decimal(item.unitDiscount),
            discountType: item.discountType,
            discountValue: item.discountValue ? new Prisma.Decimal(item.discountValue) : null,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            price: new Prisma.Decimal(item.unitPrice),
            subtotal: new Prisma.Decimal(item.subtotal),
          },
        });

        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            type: "VENTA_MOSTRADOR",
            quantity: item.quantity,
            stockAfter: newStockStore + variant.stockWarehouse,
            location: "STORE",
            reason: `Venta Directa Mostrador ${invoiceNumber}`,
          },
        });
      }

      // 8. Registrar pagos y calcular vuelto
      for (const payment of validated.payments) {
        let change: number | null = null;
        let received: number | null = null;

        if (payment.method === "EFECTIVO") {
          received = payment.receivedAmount ?? payment.amount;
          change = Math.max(0, Math.round((received - payment.amount) * 100) / 100);
        }

        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            method: payment.method as PaymentMethod,
            amount: new Prisma.Decimal(payment.amount),
            receivedAmount: received !== null ? new Prisma.Decimal(received) : null,
            change: change !== null ? new Prisma.Decimal(change) : null,
            cardBrand: payment.cardBrand ?? null,
            cardVoucher: payment.cardVoucher ?? null,
            installments: payment.installments ?? null,
            referenceCode: payment.referenceCode ?? null,
          },
        });
      }

      const fullSale = await tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: {
                    include: { brand: true },
                  },
                },
              },
            },
          },
          payments: true,
          seller: { select: { id: true, name: true, email: true } },
          cashier: { select: { id: true, name: true, email: true } },
        },
      });

      const receipt = fullSale ? buildReceiptPayloadFromSaleRecord(fullSale) : null;

      return {
        sale: fullSale || sale,
        receipt,
      };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {}

    return {
      success: true,
      data: serializeData(result.sale),
      receipt: result.receipt,
    };

  } catch (error: any) {
    console.error("Error en createDirectSale:", error);
    return { success: false, error: error.message || "Error al procesar la venta directa" };
  }
}

/**
 * Obtener lista de Preventas Pendientes de Cobro para la Terminal de Caja
 */
export async function getPendingSales() {
  try {
    const sales = await prisma.sale.findMany({
      where: { status: "PENDIENTE_PAGO" },
      orderBy: { createdAt: "asc" }, // FIFO: primero en salón, primero en caja
      include: {
        seller: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            variant: {
              select: {
                id: true,
                size: true,
                color: true,
                sku: true,
                barcode: true,
                stockStore: true,
                stockWarehouse: true,
                stockReserved: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    price: true,
                    brand: { select: { name: true } },
                    category: { select: { name: true } },
                    variants: {
                      select: {
                        id: true,
                        size: true,
                        color: true,
                        sku: true,
                        barcode: true,
                        stockStore: true,
                        stockReserved: true,
                        price: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return { success: true, data: serializeData(sales) };
  } catch (error: any) {
    console.error("Error en getPendingSales:", error);
    return { success: false, error: "Error al recuperar preventas pendientes" };
  }
}

/**
 * Cancelar Preventa y liberar automáticamente el stock reservado
 */
export async function cancelPendingSale(saleId: string, reason?: string) {
  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      });

      if (!sale) {
        throw new Error("Preventa no encontrada");
      }
      if (sale.status !== "PENDIENTE_PAGO") {
        throw new Error("Solo se pueden cancelar preventas pendientes de pago");
      }

      // 1. Liberar stock reservado de cada variante
      for (const item of sale.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockReserved: { decrement: item.quantity },
          },
        });
      }

      // 2. Marcar venta como CANCELADA
      await tx.sale.update({
        where: { id: saleId },
        data: {
          status: "CANCELADA",
          notes: reason ? `Cancelado: ${reason}` : "Cancelado por el operador",
        },
      });
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignored outside Next.js request context (e.g. testing scripts)
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error en cancelPendingSale:", error);
    return { success: false, error: error.message || "Error al cancelar preventa" };
  }
}

export interface PosSyncPulseResult {
  lastSaleUpdatedAt: string | null;
  lastMovementCreatedAt: string | null;
  pendingSalesCount: number;
}

/**
 * Obtener pulso ultra-liviano de sincronización para terminales POS (RF-08 / Terminal 1 y 2)
 * Devuelve timestamps de última modificación y conteo de preventas para detección de cambios.
 */
export async function getPosSyncPulse(): Promise<{
  success: boolean;
  data?: PosSyncPulseResult;
  error?: string;
}> {
  try {
    const [lastSale, lastMovement, pendingSalesCount] = await Promise.all([
      prisma.sale.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.inventoryMovement.findFirst({
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.sale.count({
        where: { status: "PENDIENTE_PAGO" },
      }),
    ]);

    return {
      success: true,
      data: {
        lastSaleUpdatedAt: lastSale?.updatedAt ? lastSale.updatedAt.toISOString() : null,
        lastMovementCreatedAt: lastMovement?.createdAt ? lastMovement.createdAt.toISOString() : null,
        pendingSalesCount,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener pulso de sincronización";
    return { success: false, error: msg };
  }
}

export interface VariantStockSnapshotItem {
  id: string;
  stockStore: number;
  stockWarehouse: number;
  stockReserved: number;
}

/**
 * Obtener snapshot rápido del stock de todas las variantes para actualizar el catálogo sin recargar productos completos
 */
export async function getPosVariantStockSnapshot(): Promise<{
  success: boolean;
  data?: VariantStockSnapshotItem[];
  error?: string;
}> {
  try {
    const variants = await prisma.productVariant.findMany({
      select: {
        id: true,
        stockStore: true,
        stockWarehouse: true,
        stockReserved: true,
      },
    });

    return {
      success: true,
      data: variants.map((v) => ({
        id: v.id,
        stockStore: v.stockStore,
        stockWarehouse: v.stockWarehouse,
        stockReserved: v.stockReserved || 0,
      })),
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al obtener snapshot de stock";
    return { success: false, error: msg };
  }
}

export interface CreatePendingExchangeSaleResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    saleId: string;
    ticketCode: string;
    customerName: string;
    subtotalGross: number;
    totalDiscount: number;
    totalNet: number;
    balance: number;
    stockDeltas: Array<{
      variantId: string;
      stockReservedDelta: number;
    }>;
  };
}

/**
 * Generar Preventa de Cambio de Producto hacia Caja Mostrador (Pase de Ticket a Caja)
 * Reserva stock de la prenda entregada y emite ticket correlativo pendiente en Caja,
 * sin ejecutar la devolución física ni emitir ticket definitivo hasta que Caja complete el cobro.
 */
export async function createPendingExchangeSale(
  input: CreatePendingExchangeSaleInput
): Promise<CreatePendingExchangeSaleResult> {
  try {
    const validated = CreatePendingExchangeSaleSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const [returnVariant, exchangeVariant] = await Promise.all([
        tx.productVariant.findUnique({
          where: { id: validated.returnVariantId },
          include: {
            product: { select: { id: true, name: true, price: true, active: true } },
          },
        }),
        tx.productVariant.findUnique({
          where: { id: validated.exchangeVariantId },
          include: {
            product: { select: { id: true, name: true, price: true, active: true } },
          },
        }),
      ]);

      if (!returnVariant) {
        throw new Error("La variante a devolver no existe en la base de datos.");
      }
      if (!exchangeVariant) {
        throw new Error("La variante a entregar no existe en la base de datos.");
      }
      if (returnVariant.id === exchangeVariant.id) {
        throw new Error("La prenda devuelta y la prenda a entregar no pueden ser el mismo talle y color.");
      }
      if (!exchangeVariant.product.active) {
        throw new Error(`El producto "${exchangeVariant.product.name}" se encuentra inactivo.`);
      }

      const qty = validated.quantity;
      const stockAvailable = exchangeVariant.stockStore - (exchangeVariant.stockReserved || 0);
      if (stockAvailable < qty) {
        throw new Error(
          `Stock insuficiente en salón para "${exchangeVariant.product.name}" (Talle ${exchangeVariant.size}). Disponible: ${stockAvailable}, Solicitado: ${qty}`
        );
      }

      const returnPrice =
        returnVariant.price !== null && returnVariant.price !== undefined && Number(returnVariant.price) > 0
          ? Number(returnVariant.price)
          : Number(returnVariant.product.price);

      const exchangePrice =
        exchangeVariant.price !== null && exchangeVariant.price !== undefined && Number(exchangeVariant.price) > 0
          ? Number(exchangeVariant.price)
          : Number(exchangeVariant.product.price);

      const totalReturn = Math.round(returnPrice * qty * 100) / 100;
      const totalExchange = Math.round(exchangePrice * qty * 100) / 100;
      const balance = Math.round((totalExchange - totalReturn) * 100) / 100;
      const totalNet = Math.max(0, balance);
      const totalDiscount = Math.min(totalExchange, totalReturn);

      // Generar código de ticket correlativo del día (#001, #002...)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const countToday = await tx.sale.count({
        where: { createdAt: { gte: todayStart } },
      });
      const ticketCode = `#${String(countToday + 1).padStart(3, "0")}`;
      const invoiceNumber = `PRV-CAMBIO-${Date.now().toString().slice(-6)}`;

      const customerLabel = validated.customerName?.trim() || "Consumidor Final";
      const returnDesc = `${returnVariant.product.name} (Talle ${returnVariant.size}${returnVariant.color ? ` • ${returnVariant.color}` : ""})`;
      const exchangeDesc = `${exchangeVariant.product.name} (Talle ${exchangeVariant.size}${exchangeVariant.color ? ` • ${exchangeVariant.color}` : ""})`;

      const notes =
        `[CAMBIO:returnVariantId=${returnVariant.id}:qty=${qty}:reason=${encodeURIComponent(validated.reason)}] ` +
        `Devuelve: ${returnDesc} x${qty}. ` +
        `Entrega: ${exchangeDesc} x${qty}. ` +
        (balance > 0
          ? `Diferencia a cobrar: $ ${balance.toFixed(2)}.`
          : balance < 0
          ? `Saldo a favor del cliente: $ ${Math.abs(balance).toFixed(2)}.`
          : `Cambio directo sin diferencia ($ 0,00).`);

      const sale = await tx.sale.create({
        data: {
          ticketCode,
          invoiceNumber,
          sellerId: validated.sellerId ?? null,
          customerName: customerLabel,
          channel: "MOSTRADOR",
          status: "PENDIENTE_PAGO",
          subtotalGross: new Prisma.Decimal(totalExchange),
          discount: new Prisma.Decimal(totalDiscount),
          discountType: "FIXED",
          discountValue: new Prisma.Decimal(totalDiscount),
          total: new Prisma.Decimal(totalNet),
          notes,
        },
      });

      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          variantId: exchangeVariant.id,
          quantity: qty,
          originalPrice: new Prisma.Decimal(exchangePrice),
          discount: new Prisma.Decimal(Math.round((totalDiscount / qty) * 100) / 100),
          discountType: "FIXED",
          discountValue: new Prisma.Decimal(Math.round((totalDiscount / qty) * 100) / 100),
          unitPrice: new Prisma.Decimal(Math.round((totalNet / qty) * 100) / 100),
          price: new Prisma.Decimal(Math.round((totalNet / qty) * 100) / 100),
          subtotal: new Prisma.Decimal(totalNet),
        },
      });

      // Reservar preventivamente la prenda a entregar en salón
      await tx.productVariant.update({
        where: { id: exchangeVariant.id },
        data: { stockReserved: { increment: qty } },
      });

      return {
        saleId: sale.id,
        ticketCode,
        customerName: sale.customerName || customerLabel,
        subtotalGross: totalExchange,
        totalDiscount,
        totalNet,
        balance,
        stockDeltas: [
          {
            variantId: exchangeVariant.id,
            stockReservedDelta: qty,
          },
        ],
      };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignorado fuera del contexto Next.js
    }

    return {
      success: true,
      message: `Ticket de cambio generado (${result.ticketCode}). Pasado a Caja para su cobro.`,
      data: serializeData(result),
    };
  } catch (error: unknown) {
    console.error("Error en createPendingExchangeSale:", error);
    const msg = error instanceof Error ? error.message : "Error al generar ticket de cambio para caja";
    return { success: false, error: msg };
  }
}

export interface PosProductExchangeInput {
  returnVariantId: string;
  exchangeVariantId: string;
  quantity: number;
  reason: string;
  settlementType: "EQUAL" | "PAY_DIFFERENCE" | "STORE_CREDIT_VOUCHER" | "CASH_REFUND";
  differenceAmount: number;
  paymentMethod?: PaymentMethod;
  receivedAmount?: number | null;
  change?: number | null;
  cardBrand?: string | null;
  cardVoucher?: string | null;
  installments?: number | null;
  referenceCode?: string | null;
  customerName?: string | null;
  customerDni?: string | null;
  voucherCode?: string | null;
  cashShiftId?: string | null;
  cashierId?: string | null;
}

export interface PosProductExchangeResult {
  success: boolean;
  message?: string;
  error?: string;
  settlementType?: "EQUAL" | "PAY_DIFFERENCE" | "STORE_CREDIT_VOUCHER" | "CASH_REFUND";
  invoiceNumber?: string | null;
  saleId?: string | null;
  voucher?: {
    code: string;
    amount: number;
    customerName?: string | null;
    customerDni?: string | null;
  } | null;
}

/**
 * Procesar un cambio de producto con liquidación económica atómica en mostrador (Opción B)
 * Maneja reingreso y egreso de stock, cobro de diferencias en caja registradora, vales de compra y reintegros.
 */
export async function processPosProductExchange(
  input: PosProductExchangeInput
): Promise<PosProductExchangeResult> {
  try {
    if (!input.returnVariantId || !input.exchangeVariantId) {
      return {
        success: false,
        error: "Debes seleccionar tanto la prenda a devolver como la prenda a entregar.",
      };
    }
    if (input.returnVariantId === input.exchangeVariantId) {
      return {
        success: false,
        error: "La prenda devuelta y la prenda a entregar no pueden ser el mismo talle y color.",
      };
    }
    const qty = Math.max(1, input.quantity || 1);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener variantes con sus productos
      const [returnVariant, exchangeVariant] = await Promise.all([
        tx.productVariant.findUnique({
          where: { id: input.returnVariantId },
          include: { product: true },
        }),
        tx.productVariant.findUnique({
          where: { id: input.exchangeVariantId },
          include: { product: true },
        }),
      ]);

      if (!returnVariant) {
        throw new Error("La variante a reingresar (devuelta) no existe en la base de datos.");
      }
      if (!exchangeVariant) {
        throw new Error("La variante a entregar no existe en la base de datos.");
      }

      // 2. Verificar disponibilidad de stock en salón
      if (exchangeVariant.stockStore < qty) {
        throw new Error(
          `No hay suficiente stock en Salón Saavedra para entregar el Talle ${exchangeVariant.size}. Disponible: ${exchangeVariant.stockStore} un., Solicitado: ${qty} un.`
        );
      }

      // 3. Movimiento de inventario: Reingreso de la prenda devuelta
      const newReturnStore = returnVariant.stockStore + qty;
      const totalReturnAfter = newReturnStore + returnVariant.stockWarehouse;

      await tx.productVariant.update({
        where: { id: returnVariant.id },
        data: { stockStore: newReturnStore },
      });

      await tx.inventoryMovement.create({
        data: {
          variantId: returnVariant.id,
          type: "DEVOLUCION_CLIENTE",
          quantity: qty,
          stockAfter: totalReturnAfter,
          location: "STORE",
          reason: `Cambio de producto (Reingreso ${returnVariant.product.name} Talle ${returnVariant.size}): Se entrega ${exchangeVariant.product.name} Talle ${exchangeVariant.size}. Motivo: ${input.reason}`,
        },
      });

      // 4. Movimiento de inventario: Egreso de la prenda entregada
      const newExchangeStore = exchangeVariant.stockStore - qty;
      const totalExchangeAfter = newExchangeStore + exchangeVariant.stockWarehouse;

      await tx.productVariant.update({
        where: { id: exchangeVariant.id },
        data: { stockStore: newExchangeStore },
      });

      await tx.inventoryMovement.create({
        data: {
          variantId: exchangeVariant.id,
          type: "AJUSTE_EGRESO",
          quantity: qty,
          stockAfter: totalExchangeAfter,
          location: "STORE",
          reason: `Cambio de producto (Egreso ${exchangeVariant.product.name} Talle ${exchangeVariant.size}): Por devolución de ${returnVariant.product.name} Talle ${returnVariant.size}. Motivo: ${input.reason}`,
        },
      });

      // 5. Determinar turno de caja activo para asentar operaciones monetarias
      let targetCashShiftId = input.cashShiftId ?? null;
      if (!targetCashShiftId) {
        const activeShift = await tx.cashShift.findFirst({
          where: { status: "ABIERTA" },
          orderBy: { openedAt: "desc" },
        });
        if (activeShift) {
          targetCashShiftId = activeShift.id;
        }
      }

      let invoiceNumber: string | null = null;
      let saleId: string | null = null;
      let voucherData: PosProductExchangeResult["voucher"] = null;

      // 6. Manejo según el tipo de liquidación económica
      if (input.settlementType === "PAY_DIFFERENCE") {
        const diffAmount = Math.abs(input.differenceAmount);
        if (diffAmount <= 0) {
          throw new Error("El monto de la diferencia a cobrar debe ser mayor a cero.");
        }
        if (!input.paymentMethod) {
          throw new Error("Debes especificar el medio de pago para cobrar la diferencia.");
        }

        const nextNumber = await getNextOfficialInvoiceNumber(tx);
        invoiceNumber = nextNumber.invoiceNumber;

        const saleRecord = await tx.sale.create({
          data: {
            invoiceNumber,
            ticketCode: `CAMBIO-${Math.floor(100 + Math.random() * 900)}`,
            channel: "MOSTRADOR",
            status: "COMPLETADA",
            subtotalGross: new Prisma.Decimal(diffAmount),
            discount: new Prisma.Decimal(0),
            total: new Prisma.Decimal(diffAmount),
            notes: `Diferencia cobrada por cambio de producto: Reingresó ${returnVariant.product.name} (${returnVariant.size}) y se entregó ${exchangeVariant.product.name} (${exchangeVariant.size}). Motivo: ${input.reason}`,
            cashierId: input.cashierId ?? null,
            cashShiftId: targetCashShiftId,
          },
        });
        saleId = saleRecord.id;

        await tx.saleItem.create({
          data: {
            saleId: saleRecord.id,
            variantId: exchangeVariant.id,
            quantity: qty,
            originalPrice: new Prisma.Decimal(diffAmount),
            discount: new Prisma.Decimal(0),
            unitPrice: new Prisma.Decimal(diffAmount),
            price: new Prisma.Decimal(diffAmount),
            subtotal: new Prisma.Decimal(diffAmount),
          },
        });

        await tx.salePayment.create({
          data: {
            saleId: saleRecord.id,
            method: input.paymentMethod,
            amount: new Prisma.Decimal(diffAmount),
            receivedAmount: input.receivedAmount ? new Prisma.Decimal(input.receivedAmount) : null,
            change: input.change ? new Prisma.Decimal(input.change) : null,
            cardBrand: input.cardBrand ?? null,
            cardVoucher: input.cardVoucher ?? null,
            installments: input.installments ?? null,
            referenceCode: input.referenceCode ?? null,
          },
        });
      } else if (input.settlementType === "STORE_CREDIT_VOUCHER") {
        const creditAmount = Math.abs(input.differenceAmount);
        const code =
          input.voucherCode ||
          `VALE-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;
        voucherData = {
          code,
          amount: creditAmount,
          customerName: input.customerName?.trim() || "Cliente Mostrador",
          customerDni: input.customerDni?.trim() || null,
        };

        const nextNumber = await getNextOfficialInvoiceNumber(tx);
        const voucherSale = await tx.sale.create({
          data: {
            invoiceNumber: nextNumber.invoiceNumber,
            ticketCode: code,
            channel: "MOSTRADOR",
            status: "COMPLETADA",
            subtotalGross: new Prisma.Decimal(0),
            discount: new Prisma.Decimal(0),
            total: new Prisma.Decimal(0),
            notes: `VALE DE COMPRA EMITIDO (${code}): Saldo a favor $ ${creditAmount.toFixed(
              2
            )} por cambio de producto (${returnVariant.product.name} por ${
              exchangeVariant.product.name
            }). Cliente: ${voucherData.customerName}. Sin vencimiento.`,
            cashierId: input.cashierId ?? null,
            cashShiftId: targetCashShiftId,
          },
        });
        saleId = voucherSale.id;
        invoiceNumber = nextNumber.invoiceNumber;
      } else if (input.settlementType === "CASH_REFUND") {
        const refundAmount = Math.abs(input.differenceAmount);
        if (targetCashShiftId) {
          await tx.cashMovement.create({
            data: {
              cashShiftId: targetCashShiftId,
              type: "GASTO_MENOR",
              amount: new Prisma.Decimal(refundAmount),
              reason: `Reintegro en efectivo por cambio de producto (${returnVariant.product.name} por ${exchangeVariant.product.name}). Motivo: ${input.reason}`,
              performedBy: input.cashierId ? "Cajero ID " + input.cashierId : "Cajero Mostrador",
            },
          });
        }
      }

      return {
        success: true,
        settlementType: input.settlementType,
        invoiceNumber,
        saleId,
        voucher: voucherData,
      };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/");
      revalidatePath("/pos");
    } catch {
      // Ignorado fuera del contexto de solicitud Next.js
    }

    const message =
      result.settlementType === "PAY_DIFFERENCE"
        ? `Cambio completado. Se cobró la diferencia de $ ${formatCurrency(
            Math.abs(input.differenceAmount)
          )} y se emitió el comprobante ${result.invoiceNumber || ""}.`
        : result.settlementType === "STORE_CREDIT_VOUCHER"
        ? `Cambio completado. Se generó el Vale de Compra ${
            result.voucher?.code || ""
          } por $ ${formatCurrency(result.voucher?.amount || 0)} sin vencimiento.`
        : result.settlementType === "CASH_REFUND"
        ? `Cambio completado. Se registró el reintegro de $ ${formatCurrency(
            Math.abs(input.differenceAmount)
          )} en la caja registradora.`
        : "Cambio mano a mano completado exitosamente.";

    return {
      ...result,
      message,
    };
  } catch (error: unknown) {
    console.error("Error al procesar cambio de producto en POS:", error);
    const msg =
      error instanceof Error ? error.message : "Error inesperado al procesar el cambio en POS";
    return { success: false, error: msg };
  }
}

/**
 * Carga Rápida de Producto para Casos de Emergencia (POS / Preventa Mostrador)
 * Permite dar de alta un producto no catalogado en stock, asignar stock inicial en salón
 * y retornarlo listo para agregarse inmediatamente a la preventa.
 */
export async function createQuickPosProduct(input: CreateQuickPosProductInput) {
  try {
    const validated = CreateQuickPosProductSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validar código de barras si se especificó
      if (validated.barcode && validated.barcode.trim()) {
        const barcodeTrimmed = validated.barcode.trim();
        const existingWithBarcode = await tx.productVariant.findFirst({
          where: { barcode: barcodeTrimmed },
          include: { product: { select: { name: true } } },
        });

        if (existingWithBarcode) {
          throw new Error(
            `El código de barras "${barcodeTrimmed}" ya está registrado en el producto "${existingWithBarcode.product.name}" (Talle ${existingWithBarcode.size}).`
          );
        }
      }

      // 2. Resolver o crear Disciplina
      const discName = (validated.disciplineName?.trim() || "Multideporte");
      const discSlug = discName.toLowerCase().replace(/[\s\W-]+/g, "-");
      let discipline = await tx.discipline.findFirst({
        where: {
          OR: [
            { name: { equals: discName, mode: "insensitive" } },
            { slug: { equals: discSlug, mode: "insensitive" } },
          ],
        },
      });
      if (!discipline) {
        discipline = await tx.discipline.create({
          data: { name: discName, slug: discSlug || "multideporte" },
        });
      }

      // 3. Resolver o crear Categoría
      const catName = (validated.categoryName?.trim() || "General");
      const catSlug = catName.toLowerCase().replace(/[\s\W-]+/g, "-");
      let category = await tx.category.findFirst({
        where: {
          OR: [
            { name: { equals: catName, mode: "insensitive" } },
            { slug: { equals: catSlug, mode: "insensitive" } },
          ],
        },
      });
      if (!category) {
        category = await tx.category.create({
          data: { name: catName, slug: catSlug || "general" },
        });
      }

      // 4. Resolver o crear Marca
      const brName = (validated.brandName?.trim() || "Genérica");
      const brSlug = brName.toLowerCase().replace(/[\s\W-]+/g, "-");
      let brand = await tx.brand.findFirst({
        where: {
          OR: [
            { name: { equals: brName, mode: "insensitive" } },
            { slug: { equals: brSlug, mode: "insensitive" } },
          ],
        },
      });
      if (!brand) {
        brand = await tx.brand.create({
          data: { name: brName, slug: brSlug || "generica" },
        });
      }

      // 5. Generar SKU único para la variante
      const cleanSize = validated.size.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      const generatedSku = `EMG-${Date.now().toString().slice(-6)}-${cleanSize || "U"}`;

      // 6. Crear Producto
      const product = await tx.product.create({
        data: {
          name: validated.name.trim(),
          price: new Prisma.Decimal(validated.price),
          costPrice: validated.costPrice ? new Prisma.Decimal(validated.costPrice) : null,
          disciplineId: discipline.id,
          categoryId: category.id,
          brandId: brand.id,
          active: true,
          gender: validated.gender ?? "UNISEX",
          description: "Carga rápida de emergencia desde mostrador",
          modelCode: `EMG-${Date.now().toString().slice(-6)}`,
        },
      });

      // 7. Crear Variante con stock en salón
      const variant = await tx.productVariant.create({
        data: {
          productId: product.id,
          size: validated.size.trim(),
          color: validated.color?.trim() || "Único",
          sku: generatedSku,
          barcode: validated.barcode?.trim() || null,
          stockStore: validated.initialStock || 1,
          stockWarehouse: 0,
          stockReserved: 0,
          minStoreStock: 1,
          minStock: 2,
        },
      });

      // 8. Crear Movimiento inicial de inventario
      await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: "INGRESO_INICIAL",
          quantity: validated.initialStock || 1,
          stockAfter: validated.initialStock || 1,
          location: "STORE",
          reason: "Carga rápida de emergencia desde Preventa Salón",
        },
      });

      function getDisciplineGradient(dName: string): string {
        const d = dName.toLowerCase();
        if (d.includes("nataci") || d.includes("acu")) return "from-cyan-500 to-blue-600";
        if (d.includes("vóley") || d.includes("voley")) return "from-amber-500 to-orange-600";
        if (d.includes("running") || d.includes("atlet")) return "from-emerald-500 to-teal-700";
        if (d.includes("fútbol") || d.includes("futbol")) return "from-green-600 to-emerald-800";
        if (d.includes("basquet") || d.includes("básquet")) return "from-orange-500 to-red-600";
        if (d.includes("pádel") || d.includes("padel") || d.includes("tenis")) return "from-lime-500 to-green-700";
        return "from-slate-700 to-slate-900";
      }

      const mappedProduct = {
        id: product.id,
        name: product.name,
        description: product.description || "",
        brand: brand.name,
        discipline: discipline.name,
        category: category.name,
        subcategory: category.name,
        modelCode: product.modelCode || generatedSku,
        sku: variant.sku,
        barcode: variant.barcode || "",
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        price: Number(product.price),
        stockLocal: variant.stockStore,
        stockWeb: 0,
        minStock: 2,
        minStoreStock: 1,
        active: true,
        updatedAt: new Date().toISOString(),
        gender: product.gender,
        iconBg: getDisciplineGradient(discipline.name),
        variants: [
          {
            id: variant.id,
            size: variant.size,
            color: variant.color,
            barcode: variant.barcode || "",
            sku: variant.sku,
            stockStore: variant.stockStore,
            stockWarehouse: 0,
            stockReserved: 0,
            minStoreStock: 1,
            minStock: 2,
            price: null,
          },
        ],
      };

      const mappedVariant = {
        id: variant.id,
        size: variant.size,
        color: variant.color,
        barcode: variant.barcode || "",
        sku: variant.sku,
        stockStore: variant.stockStore,
        stockWarehouse: 0,
        stockReserved: 0,
        minStoreStock: 1,
        minStock: 2,
        price: null,
      };

      return {
        product: mappedProduct,
        variant: mappedVariant,
      };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
      revalidatePath("/");
    } catch {
      // Ignorado fuera del contexto de solicitud
    }

    return {
      success: true,
      product: result.product,
      variant: result.variant,
      message: `Producto "${result.product.name}" cargado exitosamente.`,
    };
  } catch (error: unknown) {
    console.error("Error en createQuickPosProduct:", error);
    const msg =
      error instanceof Error ? error.message : "Error inesperado al crear el producto rápido";
    return { success: false, error: msg };
  }
}

