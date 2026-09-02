"use server";

import { prisma } from "@/lib/prisma";
import { InventoryMovementSchema, InventoryMovementInput } from "@/schemas/inventory";

/**
 * Registrar un movimiento manual de stock (Ingreso por compra o Ajustes de inventario)
 */
export async function registerStockMovement(input: InventoryMovementInput) {
  try {
    // 1. Validar la entrada con Zod
    const validated = InventoryMovementSchema.parse(input);

    // 2. Obtener la variante objetivo
    const variant = await prisma.productVariant.findUnique({
      where: { id: validated.variantId },
      include: { product: true },
    });

    if (!variant) {
      return { success: false, error: "La variante de producto no existe" };
    }

    // 3. Comprobar que no haya stock negativo en egresos
    if (validated.type === "AJUSTE_EGRESO" && variant.stockLocal < validated.quantity) {
      return {
        success: false,
        error: `No hay suficiente stock local para realizar el ajuste. Disponible: ${variant.stockLocal}, Solicitado a egresar: ${validated.quantity}`,
      };
    }

    // 4. Ejecutar Transacción Atómica en PostgreSQL
    const result = await prisma.$transaction(async (tx) => {
      let delta = 0;
      if (validated.type === "INGRESO_COMPRA" || validated.type === "AJUSTE_INGRESO") {
        delta = validated.quantity;
      } else if (validated.type === "AJUSTE_EGRESO") {
        delta = -validated.quantity;
      }

      const newStockLocal = variant.stockLocal + delta;

      // Actualizar la variante de producto
      const updatedVariant = await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stockLocal: newStockLocal,
        },
      });

      // Crear el movimiento auditado de inventario
      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: validated.type,
          quantity: validated.quantity,
          stockAfter: newStockLocal,
          reason: validated.reason ?? `Movimiento manual: ${validated.type}`,
        },
      });

      return { variant: updatedVariant, movement };
    });

    return {
      success: true,
      data: result,
      message: `Stock actualizado con éxito. Nuevo stock local: ${result.variant.stockLocal}`,
    };
  } catch (error) {
    console.error("Error al registrar movimiento de inventario:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Ocurrió un error al actualizar el stock" };
  }
}

/**
 * Obtener listado de variantes con alerta de stock crítico (stockLocal <= minStock)
 */
export async function getStockAlerts() {
  try {
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stockLocal: {
          lte: prisma.productVariant.fields.minStock,
        },
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          },
        },
      },
      orderBy: { stockLocal: "asc" },
    });

    return { success: true, data: lowStockVariants };
  } catch (error) {
    console.error("Error al obtener alertas de stock:", error);
    return { success: false, error: "No se pudieron obtener las alertas de stock" };
  }
}
