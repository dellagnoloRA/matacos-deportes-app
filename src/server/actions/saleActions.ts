"use server";

import { prisma } from "@/lib/prisma";
import { CreateSaleSchema, CreateSaleInput } from "@/schemas/sale";
import { Prisma, PaymentMethod } from "@prisma/client";

export interface SaleHistoryFilterOptions {
  startDate?: Date | string;
  endDate?: Date | string;
  limit?: number;
}

/**
 * Procesar y registrar una Venta en Mostrador o Web de forma 100% atómica
 * Descuenta prioritariamente de Salón y, si es necesario, de Depósito.
 */
export async function processSale(input: CreateSaleInput) {
  try {
    // 1. Validar el payload de la venta con Zod
    const validated = CreateSaleSchema.parse(input);

    // 2. Ejecutar Transacción Atómica en PostgreSQL
    const saleResult = await prisma.$transaction(async (tx) => {
      // a. Verificar stock disponible para todas las variantes solicitadas
      const variantIds = validated.items.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      const variantMap = new Map(variants.map((v) => [v.id, v]));

      for (const item of validated.items) {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          throw new Error(`Variante no encontrada ID: ${item.variantId}`);
        }
        const totalAvailable = (variant.stockStore + variant.stockWarehouse) - variant.stockReserved;
        if (totalAvailable < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${variant.product.name}" (Talle ${variant.size}, Color ${variant.color}). Disponible: ${totalAvailable}, Requerido: ${item.quantity}`
          );
        }
      }

      // b. Calcular totales de la venta
      const grossTotal = validated.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      const netTotal = Math.max(0, grossTotal - validated.discount);

      // Generar número de comprobante único para mostrador
      const invoiceNumber = `TKT-${Date.now().toString().slice(-8)}`;

      // c. Crear el registro principal de la Venta (Sale)
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          userId: validated.userId ?? null,
          total: new Prisma.Decimal(netTotal),
          discount: new Prisma.Decimal(validated.discount),
          channel: validated.channel || "MOSTRADOR",
          status: "COMPLETADA",
        },
      });

      // d. Procesar cada ítem: descontar stock de salón/depósito y registrar auditoría
      for (const item of validated.items) {
        const variant = variantMap.get(item.variantId)!;
        const qtyToDeduct = item.quantity;

        let deductFromStore = 0;
        let deductFromWarehouse = 0;

        if (validated.channel === "WEB") {
          // Venta Web: Descuenta prioritariamente de Depósito para no desabastecer exhibición
          deductFromWarehouse = Math.min(variant.stockWarehouse, qtyToDeduct);
          deductFromStore = qtyToDeduct - deductFromWarehouse;
        } else {
          // Venta Mostrador (POS): Descuenta prioritariamente de Salón
          deductFromStore = Math.min(variant.stockStore, qtyToDeduct);
          deductFromWarehouse = qtyToDeduct - deductFromStore;
        }

        const newStockStore = variant.stockStore - deductFromStore;
        const newStockWarehouse = variant.stockWarehouse - deductFromWarehouse;
        const totalStockAfter = newStockStore + newStockWarehouse;
        const itemSubtotal = item.quantity * item.price;

        // Actualizar stock de la variante
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stockStore: newStockStore,
            stockWarehouse: newStockWarehouse,
          },
        });

        // Crear ítem de venta
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            variantId: variant.id,
            quantity: item.quantity,
            price: new Prisma.Decimal(item.price),
            subtotal: new Prisma.Decimal(itemSubtotal),
          },
        });

        // Determinar ubicación de extracción para auditoría
        let location = "STORE";
        if (deductFromWarehouse > 0 && deductFromStore === 0) {
          location = "WAREHOUSE";
        } else if (deductFromWarehouse > 0 && deductFromStore > 0) {
          location = "SPLIT";
        }

        // Auditoría de movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            variantId: variant.id,
            type: validated.channel === "WEB" ? "VENTA_WEB" : "VENTA_MOSTRADOR",
            quantity: item.quantity,
            stockAfter: totalStockAfter,
            location,
            reason: `Venta ${validated.channel || "MOSTRADOR"} ${invoiceNumber} (Salón: -${deductFromStore}, Depósito: -${deductFromWarehouse})`,
          },
        });
      }

      // e. Registrar los pagos asociados
      for (const payment of validated.payments) {
        await tx.salePayment.create({
          data: {
            saleId: sale.id,
            method: payment.method as PaymentMethod,
            amount: new Prisma.Decimal(payment.amount),
          },
        });
      }

      // Retornar la venta completa con relaciones
      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
          payments: true,
        },
      });
    });

    return {
      success: true,
      data: saleResult,
      message: `Venta ${saleResult?.invoiceNumber} procesada con éxito`,
    };
  } catch (error) {
    console.error("Error al procesar la venta:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "No se pudo procesar la venta" };
  }
}

/**
 * Obtener historial de ventas registradas
 */
export async function getSaleHistory(options: SaleHistoryFilterOptions = {}) {
  try {
    const { startDate, endDate, limit = 50 } = options;

    const sales = await prisma.sale.findMany({
      where: {
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { success: true, data: sales };
  } catch (error) {
    console.error("Error al consultar historial de ventas:", error);
    return { success: false, error: "No se pudo obtener el historial de ventas" };
  }
}
