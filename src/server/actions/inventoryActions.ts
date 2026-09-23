"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  InventoryMovementSchema,
  InventoryMovementInput,
  StockTransferSchema,
  StockTransferInput,
  SizeExchangeSchema,
  SizeExchangeInput,
} from "@/schemas/inventory";

/**
 * Convierte tipos Decimal y objetos no planos a tipos planos JSON seguros para Server Actions
 */
function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "object" && value !== null && typeof value.toNumber === "function") {
        return value.toNumber();
      }
      if (typeof value === "object" && value !== null && "d" in value && "e" in value && "s" in value) {
        return Number(value);
      }
      return value;
    })
  );
}

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
      include: { product: { include: { category: true } } },
    });

    if (!variant) {
      return { success: false, error: "La variante de producto no existe" };
    }

    const isStore = validated.targetLocation === "STORE";
    const currentTargetStock = isStore ? variant.stockStore : variant.stockWarehouse;

    // 3. Comprobar que no haya stock negativo en egresos (mermas o ventas)
    if (
      (validated.type === "AJUSTE_EGRESO" || validated.type === "VENTA_MOSTRADOR") &&
      currentTargetStock < validated.quantity
    ) {
      const locationLabel = isStore ? "Salón de Ventas" : "Depósito";
      const actionLabel = validated.type === "VENTA_MOSTRADOR" ? "la venta" : "el egreso";
      return {
        success: false,
        error: `No hay suficiente stock en ${locationLabel} para realizar ${actionLabel}. Disponible: ${currentTargetStock}, Solicitado: ${validated.quantity}`,
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
      } else if (validated.type === "AJUSTE_EGRESO" || validated.type === "VENTA_MOSTRADOR") {
        delta = -validated.quantity;
      }

      const newStockStore = isStore ? variant.stockStore + delta : variant.stockStore;
      const newStockWarehouse = !isStore ? variant.stockWarehouse + delta : variant.stockWarehouse;
      const totalStockAfter = newStockStore + newStockWarehouse;

      const isIngress = validated.type === "INGRESO_COMPRA" || validated.type === "AJUSTE_INGRESO";
      const shouldActivateThresholds = isIngress && variant.minStock === 0 && totalStockAfter > 0;

      const isAccessory = variant.product?.category?.name
        ? !variant.product.category.name.toLowerCase().includes("calzado")
        : false;

      const activatedMinStock = shouldActivateThresholds ? (isAccessory ? 1 : 2) : variant.minStock;
      const activatedMinStoreStock = shouldActivateThresholds ? (isAccessory ? 0 : 1) : variant.minStoreStock;

      // Actualizar la variante de producto
      const updatedVariant = await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stockStore: newStockStore,
          stockWarehouse: newStockWarehouse,
          minStock: activatedMinStock,
          minStoreStock: activatedMinStoreStock,
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
          reason:
            validated.reason?.trim() ||
            (validated.type === "VENTA_MOSTRADOR"
              ? "Venta directa en mostrador Saavedra 241"
              : `Movimiento manual: ${validated.type}`),
        },
      });

      return { variant: updatedVariant, movement };
    });

    revalidatePath("/admin");
    revalidatePath("/");

    const successMsg =
      validated.type === "VENTA_MOSTRADOR"
        ? `Venta registrada con éxito (-${validated.quantity} un.). Salón: ${result.variant.stockStore}, Depósito: ${result.variant.stockWarehouse}`
        : `Stock actualizado con éxito. Salón: ${result.variant.stockStore}, Depósito: ${result.variant.stockWarehouse}`;

    return {
      success: true,
      data: serializeData(result),
      message: successMsg,
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

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      success: true,
      data: serializeData(result),
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
 * Registrar un cambio de talle (Intercambio simultáneo de dos variantes de un producto)
 * Reingresa la variante devuelta por el cliente y descuenta la variante entregada en una única transacción atómica.
 */
export async function exchangeProductSize(input: SizeExchangeInput) {
  try {
    // 1. Validar la entrada con Zod
    const validated = SizeExchangeSchema.parse(input);

    // 2. Obtener ambas variantes
    const [returnVariant, exchangeVariant] = await Promise.all([
      prisma.productVariant.findUnique({
        where: { id: validated.returnVariantId },
        include: { product: true },
      }),
      prisma.productVariant.findUnique({
        where: { id: validated.exchangeVariantId },
        include: { product: true },
      }),
    ]);

    if (!returnVariant) {
      return { success: false, error: "La variante a reingresar (devuelta) no existe" };
    }

    if (!exchangeVariant) {
      return { success: false, error: "La variante a entregar no existe" };
    }

    const isStore = validated.targetLocation === "STORE";
    const locationLabel = isStore ? "Salón Saavedra 241" : "Depósito Central";
    const availableStock = isStore ? exchangeVariant.stockStore : exchangeVariant.stockWarehouse;

    // 3. Comprobar que haya stock suficiente para entregar el nuevo talle
    if (availableStock < validated.quantity) {
      return {
        success: false,
        error: `No hay suficiente stock en ${locationLabel} para entregar el Talle ${exchangeVariant.size}. Disponible: ${availableStock} un., Solicitado: ${validated.quantity} un.`,
      };
    }

    // 4. Ejecutar Transacción Atómica en PostgreSQL
    const result = await prisma.$transaction(async (tx) => {
      // Reingreso (+quantity)
      const newReturnStore = isStore ? returnVariant.stockStore + validated.quantity : returnVariant.stockStore;
      const newReturnWarehouse = !isStore ? returnVariant.stockWarehouse + validated.quantity : returnVariant.stockWarehouse;
      const totalReturnAfter = newReturnStore + newReturnWarehouse;

      const updatedReturnVariant = await tx.productVariant.update({
        where: { id: returnVariant.id },
        data: {
          stockStore: newReturnStore,
          stockWarehouse: newReturnWarehouse,
        },
      });

      const returnMovement = await tx.inventoryMovement.create({
        data: {
          variantId: returnVariant.id,
          type: "DEVOLUCION_CLIENTE",
          quantity: validated.quantity,
          stockAfter: totalReturnAfter,
          location: validated.targetLocation,
          reason: `Cambio de talle (Reingreso Talle ${returnVariant.size}): Se entrega Talle ${exchangeVariant.size}. Motivo: ${validated.reason}`,
        },
      });

      // Egreso (-quantity)
      const newExchangeStore = isStore ? exchangeVariant.stockStore - validated.quantity : exchangeVariant.stockStore;
      const newExchangeWarehouse = !isStore ? exchangeVariant.stockWarehouse - validated.quantity : exchangeVariant.stockWarehouse;
      const totalExchangeAfter = newExchangeStore + newExchangeWarehouse;

      const updatedExchangeVariant = await tx.productVariant.update({
        where: { id: exchangeVariant.id },
        data: {
          stockStore: newExchangeStore,
          stockWarehouse: newExchangeWarehouse,
        },
      });

      const exchangeMovement = await tx.inventoryMovement.create({
        data: {
          variantId: exchangeVariant.id,
          type: "AJUSTE_EGRESO",
          quantity: validated.quantity,
          stockAfter: totalExchangeAfter,
          location: validated.targetLocation,
          reason: `Cambio de talle (Egreso Talle ${exchangeVariant.size}): Por devolución de Talle ${returnVariant.size}. Motivo: ${validated.reason}`,
        },
      });

      return {
        returnVariant: updatedReturnVariant,
        exchangeVariant: updatedExchangeVariant,
        movements: [returnMovement, exchangeMovement],
      };
    });

    revalidatePath("/admin");
    revalidatePath("/");

    return {
      success: true,
      data: serializeData(result),
      message: `Cambio de talle completado. Reingresó Talle ${returnVariant.size} (+${validated.quantity}) y egresó Talle ${exchangeVariant.size} (-${validated.quantity}) en ${locationLabel}.`,
    };
  } catch (error) {
    console.error("Error en cambio de talle:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Ocurrió un error al procesar el cambio de talle" };
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
      data: serializeData({
        storeReplenishment,
        criticalStock,
        summary: {
          storeReplenishmentCount: storeReplenishment.length,
          criticalStockCount: criticalStock.length,
        },
      }),
    };
  } catch (error) {
    console.error("Error al obtener alertas de stock:", error);
    return { success: false, error: "No se pudieron obtener las alertas de stock" };
  }
}

/**
 * Obtener historial de movimientos de inventario de un producto (para trazabilidad y auditoría)
 */
export async function getProductMovements(productId: string) {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        variant: {
          productId,
        },
      },
      include: {
        variant: {
          select: {
            id: true,
            size: true,
            color: true,
            sku: true,
            barcode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    const serialized = movements.map((m) => ({
      id: m.id,
      variantId: m.variantId,
      variantSize: m.variant.size,
      variantColor: m.variant.color,
      variantSku: m.variant.sku,
      variantBarcode: m.variant.barcode,
      type: m.type,
      quantity: m.quantity,
      stockAfter: m.stockAfter,
      location: m.location,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error("Error al obtener movimientos de inventario:", error);
    return {
      success: false,
      error: "No se pudo cargar el historial de movimientos de stock",
    };
  }
}

/**
 * Obtener historial y trazabilidad de movimientos de una variante específica (RF-03 / CU-INV-07)
 */
export async function getVariantMovementHistory(variantId: string) {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        variantId,
      },
      include: {
        variant: {
          select: {
            id: true,
            size: true,
            color: true,
            sku: true,
            barcode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    const serialized = movements.map((m) => ({
      id: m.id,
      variantId: m.variantId,
      variantSize: m.variant.size,
      variantColor: m.variant.color,
      variantSku: m.variant.sku,
      variantBarcode: m.variant.barcode,
      type: m.type,
      quantity: m.quantity,
      stockAfter: m.stockAfter,
      location: m.location,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error("Error al obtener movimientos de la variante:", error);
    return {
      success: false,
      error: "No se pudo cargar el historial de movimientos de la variante",
    };
  }
}

export interface GetStockMovementsFilter {
  type?: string;
  location?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  take?: number;
  skip?: number;
}

/**
 * Obtener todos los movimientos de stock del sistema con filtros avanzados y auditoría (RF-03 / CU-INV-07)
 */
export async function getAllInventoryMovements(filter?: GetStockMovementsFilter) {
  try {
    const where: any = {};

    if (filter?.type && filter.type !== "ALL") {
      where.type = filter.type;
    }

    if (filter?.location && filter.location !== "ALL") {
      where.location = filter.location;
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.createdAt.lte = new Date(filter.endDate);
      }
    }

    if (filter?.search && filter.search.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { variant: { product: { name: { contains: q, mode: "insensitive" } } } },
        { variant: { product: { brand: { name: { contains: q, mode: "insensitive" } } } } },
        { variant: { sku: { contains: q, mode: "insensitive" } } },
        { variant: { barcode: { contains: q, mode: "insensitive" } } },
        { reason: { contains: q, mode: "insensitive" } },
      ];
    }

    const totalCount = await prisma.inventoryMovement.count({ where });
    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        variant: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
                discipline: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: filter?.take ?? 300,
      skip: filter?.skip ?? 0,
    });

    const serialized = movements.map((m) => ({
      id: m.id,
      variantId: m.variantId,
      type: m.type,
      quantity: m.quantity,
      stockAfter: m.stockAfter,
      location: m.location,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
      variant: {
        id: m.variant.id,
        size: m.variant.size,
        color: m.variant.color,
        sku: m.variant.sku,
        barcode: m.variant.barcode,
        stockStore: m.variant.stockStore,
        stockWarehouse: m.variant.stockWarehouse,
      },
      product: m.variant.product
        ? {
            id: m.variant.product.id,
            name: m.variant.product.name,
            brand: m.variant.product.brand?.name || "Sin marca",
            category: m.variant.product.category?.name || "General",
            discipline: m.variant.product.discipline?.name || null,
            code: m.variant.product.modelCode || null,
            imageUrl: m.variant.product.imageUrl || null,
          }
        : null,
    }));

    return {
      success: true,
      data: serialized,
      totalCount,
    };
  } catch (error) {
    console.error("Error al obtener todos los movimientos de stock:", error);
    return {
      success: false,
      error: "No se pudo cargar el historial general de movimientos de stock",
    };
  }
}

