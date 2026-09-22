"use server";

import { prisma } from "@/lib/prisma";
import {
  CreatePendingSaleSchema,
  CreatePendingSaleInput,
  UpdatePendingSaleSchema,
  UpdatePendingSaleInput,
} from "@/schemas/sale";
import {
  calculateSaleTotals,
  RawSaleItemInput,
  DiscountConfig,
} from "@/lib/discounts";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
    const variants = await prisma.productVariant.findMany({
      where: {
        product: { active: true },
        OR: [
          { barcode: q },
          { sku: q },
          { product: { name: { contains: q, mode: "insensitive" } } },
          { product: { brand: { name: { contains: q, mode: "insensitive" } } } },
          { color: { contains: q, mode: "insensitive" } },
          { size: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: [{ stockStore: "desc" }],
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
          },
        },
      },
    });

    const items = variants.map((v) => {
      const effectivePrice = Number(v.price ?? v.product.price);
      const stockAvailable = Math.max(0, v.stockStore - v.stockReserved);
      return {
        variantId: v.id,
        productId: v.product.id,
        name: v.product.name,
        brand: v.product.brand.name,
        category: v.product.category.name,
        size: v.size,
        color: v.color,
        barcode: v.barcode,
        sku: v.sku,
        price: effectivePrice,
        stockStore: v.stockStore,
        stockWarehouse: v.stockWarehouse,
        stockReserved: v.stockReserved,
        stockAvailable,
        imageUrl: v.product.imageUrl,
      };
    });

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

    return { success: true, data: serializeData(result) };
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
        validated.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          originalPrice: i.originalPrice,
          discountType: i.discountType,
          discountValue: i.discountValue,
        })),
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

      return {
        saleId: updated.id,
        ticketCode: updated.ticketCode,
        customerName: updated.customerName,
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
      // Ignored outside Next.js request context
    }

    return { success: true, data: serializeData(result) };
  } catch (error: any) {
    console.error("Error en updatePendingSale:", error);
    return { success: false, error: error.message || "Error al modificar la preventa" };
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
                product: {
                  select: {
                    id: true,
                    name: true,
                    brand: { select: { name: true } },
                    category: { select: { name: true } },
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
