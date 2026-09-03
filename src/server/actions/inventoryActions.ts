"use server";

import { prisma } from "@/lib/prisma";
import {
  InventoryMovementSchema,
  InventoryMovementInput,
  StockTransferSchema,
  StockTransferInput,
} from "@/schemas/inventory";

/**
 * Registrar un movimiento manual de stock (Ingreso por compra, Ajustes o Devoluciones)
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

    const isStore = validated.targetLocation === "STORE";
    const currentTargetStock = isStore ? variant.stockStore : variant.stockWarehouse;

    // 3. Comprobar que no haya stock negativo en egresos
    if (validated.type === "AJUSTE_EGRESO" && currentTargetStock < validated.quantity) {
      const locationLabel = isStore ? "Salón de Ventas" : "Depósito";
      return {
        success: false,
        error: `No hay suficiente stock en ${locationLabel} para realizar el egreso. Disponible: ${currentTargetStock}, Solicitado: ${validated.quantity}`,
      };
    }

    // 4. Ejecutar Transacción Atómica en PostgreSQL
    const result = await prisma.$transaction(async (tx) => {
      let delta = 0;
      if (
        validated.type === "INGRESO_COMPRA" ||
        validated.type === "AJUSTE_INGRESO" ||
        validated.type === "DEVOLUCION_CLIENTE" ||
        validated.type === "ANULACION_VENTA"
      ) {
        delta = validated.quantity;
      } else if (validated.type === "AJUSTE_EGRESO") {
        delta = -validated.quantity;
      }

      const newStockStore = isStore ? variant.stockStore + delta : variant.stockStore;
      const newStockWarehouse = !isStore ? variant.stockWarehouse + delta : variant.stockWarehouse;
      const totalStockAfter = newStockStore + newStockWarehouse;

      // Actualizar la variante de producto
      const updatedVariant = await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stockStore: newStockStore,
          stockWarehouse: newStockWarehouse,
        },
      });

      // Crear el movimiento auditado de inventario
      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: validated.type,
          quantity: validated.quantity,
          stockAfter: totalStockAfter,
          location: validated.targetLocation,
          reason: validated.reason ?? `Movimiento manual: ${validated.type}`,
        },
      });

      return { variant: updatedVariant, movement };
    });

    return {
      success: true,
      data: result,
      message: `Stock actualizado con éxito. Salón: ${result.variant.stockStore}, Depósito: ${result.variant.stockWarehouse}`,
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
 * Traslado Interno de Stock: Reposición de Depósito hacia Salón de Ventas
 */
export async function transferStockInternal(input: StockTransferInput) {
  try {
    const validated = StockTransferSchema.parse(input);

    const variant = await prisma.productVariant.findUnique({
      where: { id: validated.variantId },
      include: { product: true },
    });

    if (!variant) {
      return { success: false, error: "La variante de producto no existe" };
    }

    if (variant.stockWarehouse < validated.quantity) {
      return {
        success: false,
        error: `Stock insuficiente en depósito para transferir. Disponible en depósito: ${variant.stockWarehouse}, Solicitado: ${validated.quantity}`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const newWarehouse = variant.stockWarehouse - validated.quantity;
      const newStore = variant.stockStore + validated.quantity;
      const totalStockAfter = newStore + newWarehouse;

      const updatedVariant = await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stockWarehouse: newWarehouse,
          stockStore: newStore,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: variant.id,
          type: "TRANSFERENCIA_INTERNA",
          quantity: validated.quantity,
          stockAfter: totalStockAfter,
          location: "WAREHOUSE_TO_STORE",
          reason: validated.reason ?? `Reposición interna: ${validated.quantity} unid. de Depósito a Salón`,
        },
      });

      return { variant: updatedVariant, movement };
    });

    return {
      success: true,
      data: result,
      message: `Transferencia completada. Nuevo stock en Salón: ${result.variant.stockStore}, en Depósito: ${result.variant.stockWarehouse}`,
    };
  } catch (error) {
    console.error("Error en transferencia interna:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Ocurrió un error al realizar la transferencia interna" };
  }
}

/**
 * Obtener listado de alertas de stock desglosadas por tipo:
 * 1. storeReplenishment: Salón necesita reposición (stockStore <= minStoreStock y hay en depósito)
 * 2. criticalStock: Stock total crítico para compras (total <= minStock)
 */
export async function getStockAlerts() {
  try {
    const allVariants = await prisma.productVariant.findMany({
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            discipline: true,
          },
        },
      },
      orderBy: [{ stockStore: "asc" }, { stockWarehouse: "asc" }],
    });

    // 1. Alerta de Reposición Interna (Depósito -> Salón)
    const storeReplenishment = allVariants.filter(
      (v) => v.stockStore <= v.minStoreStock && v.stockWarehouse > 0
    );

    // 2. Alerta de Compra a Proveedor (Stock Total Crítico)
    const criticalStock = allVariants.filter(
      (v) => v.stockStore + v.stockWarehouse <= v.minStock
    );

    return {
      success: true,
      data: {
        storeReplenishment,
        criticalStock,
        summary: {
          storeReplenishmentCount: storeReplenishment.length,
          criticalStockCount: criticalStock.length,
        },
      },
    };
  } catch (error) {
    console.error("Error al obtener alertas de stock:", error);
    return { success: false, error: "No se pudieron obtener las alertas de stock" };
  }
}
