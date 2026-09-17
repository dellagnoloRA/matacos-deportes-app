"use server";

import { prisma } from "@/lib/prisma";
import {
  StockAlertsQuerySchema,
  StockAlertsQueryInput,
  ConfigureStockThresholdSchema,
  ConfigureStockThresholdInput,
  ConsolidatedStockAlertsResponse,
  ConsolidatedProductAlert,
  VariantStockAlertDetail,
  StockAlertLevel,
} from "@/schemas/stockAlerts";
import { Prisma } from "@prisma/client";

/**
 * Determina el nivel de alerta y acción requerida para una variante individual
 */
function evaluateVariantAlert(
  stockStore: number,
  stockWarehouse: number,
  minStock: number,
  minStoreStock: number
): { alertLevel: StockAlertLevel; actionRequired: string } {
  const stockTotal = stockStore + stockWarehouse;

  // 0. Variante en plantilla/catálogo pasivo sin existencias (minStock = 0)
  if (minStock === 0 && stockTotal === 0) {
    return {
      alertLevel: "NORMAL",
      actionRequired: "En catálogo. Sin umbral de compra requerido.",
    };
  }

  // 1. Totalmente agotado (solo si la variante tiene umbral de compra activo minStock > 0)
  if (stockTotal === 0 && minStock > 0) {
    return {
      alertLevel: "OUT_OF_STOCK",
      actionRequired: "Agotado total. Generar orden de compra inmediata a proveedor.",
    };
  }

  // 2. Salón vacío pero hay en depósito (Urgencia de mostrador)
  if (stockStore === 0 && stockWarehouse > 0) {
    return {
      alertLevel: "STORE_EMPTY_WAREHOUSE_AVAIL",
      actionRequired: `Mostrador sin stock. Reponer urgente ${Math.min(stockWarehouse, Math.max(minStoreStock * 2, 2))} unid. desde depósito.`,
    };
  }

  // 3. Stock total crítico por debajo del mínimo general
  if (minStock > 0 && stockTotal <= minStock) {
    const action =
      minStoreStock > 0 && stockStore <= minStoreStock && stockWarehouse > 0
        ? `Stock crítico (${stockTotal} unid.). Reponer mostrador desde depósito y solicitar compra a proveedor.`
        : `Stock crítico (${stockTotal} unid.). Solicitar compra a proveedor.`;
    return {
      alertLevel: "CRITICAL_LOW",
      actionRequired: action,
    };
  }

  // 4. Salón bajo pero depósito cuenta con unidades suficientes
  if (minStoreStock > 0 && stockStore <= minStoreStock && stockWarehouse > 0) {
    return {
      alertLevel: "STORE_REPLENISHMENT",
      actionRequired: `Reposición preventiva. Trasladar unidades de depósito a salón de ventas.`,
    };
  }

  return {
    alertLevel: "NORMAL",
    actionRequired: "Stock suficiente.",
  };
}

/**
 * Consulta optimizada y consolidada de productos con stock en alerta y agotados
 */
export async function getConsolidatedStockAlerts(
  input?: StockAlertsQueryInput
): Promise<ConsolidatedStockAlertsResponse> {
  const timestamp = new Date().toISOString();

  try {
    const validated = StockAlertsQuerySchema.parse(input || {});

    // Construcción de cláusula where dinámica
    const whereClause: Prisma.ProductWhereInput = {
      active: true,
      ...(validated.categoryId ? { categoryId: validated.categoryId } : {}),
      ...(validated.brandId ? { brandId: validated.brandId } : {}),
      ...(validated.disciplineId ? { disciplineId: validated.disciplineId } : {}),
      ...(validated.search && validated.search.trim() !== ""
        ? {
            OR: [
              { name: { contains: validated.search.trim(), mode: "insensitive" } },
              {
                variants: {
                  some: {
                    OR: [
                      { sku: { contains: validated.search.trim(), mode: "insensitive" } },
                      { barcode: { contains: validated.search.trim(), mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    // Consulta optimizada a PostgreSQL trayendo las relaciones necesarias
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        brand: true,
        discipline: true,
        variants: {
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
      },
      orderBy: { name: "asc" },
    });

    const consolidatedProducts: ConsolidatedProductAlert[] = [];

    let totalOutOfStockCount = 0;
    let totalCriticalLowCount = 0;
    let totalReplenishmentCount = 0;
    let totalVariantsInAlert = 0;

    for (const prod of products) {
      let prodStoreStock = 0;
      let prodWarehouseStock = 0;
      let prodOutOfStock = 0;
      let prodCriticalLow = 0;
      let prodReplenishment = 0;

      const affectedVariants: VariantStockAlertDetail[] = [];

      for (const v of prod.variants) {
        prodStoreStock += v.stockStore;
        prodWarehouseStock += v.stockWarehouse;

        const { alertLevel, actionRequired } = evaluateVariantAlert(
          v.stockStore,
          v.stockWarehouse,
          v.minStock,
          v.minStoreStock
        );

        if (alertLevel !== "NORMAL") {
          totalVariantsInAlert++;

          if (alertLevel === "OUT_OF_STOCK") {
            prodOutOfStock++;
            totalOutOfStockCount++;
          } else if (alertLevel === "CRITICAL_LOW") {
            prodCriticalLow++;
            totalCriticalLowCount++;
          } else {
            prodReplenishment++;
            totalReplenishmentCount++;
          }

          affectedVariants.push({
            variantId: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            barcode: v.barcode,
            stockStore: v.stockStore,
            stockWarehouse: v.stockWarehouse,
            stockTotal: v.stockStore + v.stockWarehouse,
            minStock: v.minStock,
            minStoreStock: v.minStoreStock,
            alertLevel,
            actionRequired,
          });
        }
      }

      // Si el producto tiene al menos una variante en alerta, evaluamos su inclusión según el filtro
      if (affectedVariants.length > 0) {
        let highestAlert: StockAlertLevel = "NORMAL";
        if (prodOutOfStock > 0) {
          highestAlert = "OUT_OF_STOCK";
        } else if (prodCriticalLow > 0) {
          highestAlert = "CRITICAL_LOW";
        } else if (affectedVariants.some((a) => a.alertLevel === "STORE_EMPTY_WAREHOUSE_AVAIL")) {
          highestAlert = "STORE_EMPTY_WAREHOUSE_AVAIL";
        } else {
          highestAlert = "STORE_REPLENISHMENT";
        }

        // Filtrado dinámico según solicitud
        let matchesFilter = true;
        if (validated.filter === "OUT_OF_STOCK") {
          matchesFilter = prodOutOfStock > 0;
        } else if (validated.filter === "CRITICAL_LOW") {
          matchesFilter = prodCriticalLow > 0 || prodOutOfStock > 0;
        } else if (validated.filter === "STORE_REPLENISHMENT") {
          matchesFilter = prodReplenishment > 0;
        }

        if (matchesFilter) {
          consolidatedProducts.push({
            productId: prod.id,
            productName: prod.name,
            category: prod.category.name,
            brand: prod.brand.name,
            discipline: prod.discipline.name,
            totalStoreStock: prodStoreStock,
            totalWarehouseStock: prodWarehouseStock,
            totalStock: prodStoreStock + prodWarehouseStock,
            highestAlert,
            totalVariantsCount: prod.variants.length,
            outOfStockVariantsCount: prodOutOfStock,
            criticalLowVariantsCount: prodCriticalLow,
            replenishmentVariantsCount: prodReplenishment,
            affectedVariants,
          });
        }
      }
    }

    // Ordenar productos por nivel de criticidad (Primero agotados, luego críticos, luego reposición)
    const alertOrder: Record<StockAlertLevel, number> = {
      OUT_OF_STOCK: 1,
      STORE_EMPTY_WAREHOUSE_AVAIL: 2,
      CRITICAL_LOW: 3,
      STORE_REPLENISHMENT: 4,
      NORMAL: 5,
    };

    consolidatedProducts.sort((a, b) => alertOrder[a.highestAlert] - alertOrder[b.highestAlert]);

    return {
      success: true,
      timestamp,
      summary: {
        totalProductsInAlert: consolidatedProducts.length,
        totalVariantsInAlert,
        outOfStockCount: totalOutOfStockCount,
        criticalLowCount: totalCriticalLowCount,
        storeReplenishmentCount: totalReplenishmentCount,
      },
      products: consolidatedProducts,
    };
  } catch (error) {
    console.error("Error al obtener alertas consolidadas de stock:", error);
    return {
      success: false,
      timestamp,
      summary: {
        totalProductsInAlert: 0,
        totalVariantsInAlert: 0,
        outOfStockCount: 0,
        criticalLowCount: 0,
        storeReplenishmentCount: 0,
      },
      products: [],
    };
  }
}

/**
 * Configurar los umbrales de stock mínimo de forma masiva o individual
 * Permite ajustar umbrales por Categoría completa, por Producto o por Variante puntual.
 */
export async function configureStockThresholds(
  input: ConfigureStockThresholdInput
): Promise<{
  success: boolean;
  message: string;
  updatedCount: number;
  error?: string;
}> {
  try {
    const validated = ConfigureStockThresholdSchema.parse(input);
    const updateData: Prisma.ProductVariantUpdateManyMutationInput = {};

    if (validated.minStock !== undefined) {
      updateData.minStock = validated.minStock;
    }
    if (validated.minStoreStock !== undefined) {
      updateData.minStoreStock = validated.minStoreStock;
    }

    let updatedCount = 0;

    if (validated.scope === "CATEGORY") {
      // Buscar todos los productos de la categoría
      const category = await prisma.category.findUnique({
        where: { id: validated.targetId },
        select: { name: true },
      });

      if (!category) {
        return { success: false, message: "La categoría especificada no existe", updatedCount: 0 };
      }

      const res = await prisma.productVariant.updateMany({
        where: {
          product: {
            categoryId: validated.targetId,
          },
        },
        data: updateData,
      });
      updatedCount = res.count;

      return {
        success: true,
        message: `Se actualizaron los umbrales de stock en ${updatedCount} variantes para la categoría "${category.name}".`,
        updatedCount,
      };
    } else if (validated.scope === "PRODUCT") {
      const product = await prisma.product.findUnique({
        where: { id: validated.targetId },
        select: { name: true },
      });

      if (!product) {
        return { success: false, message: "El producto especificado no existe", updatedCount: 0 };
      }

      const res = await prisma.productVariant.updateMany({
        where: { productId: validated.targetId },
        data: updateData,
      });
      updatedCount = res.count;

      return {
        success: true,
        message: `Se actualizaron los umbrales de stock en ${updatedCount} variantes del producto "${product.name}".`,
        updatedCount,
      };
    } else {
      // Scope VARIANT
      const variant = await prisma.productVariant.findUnique({
        where: { id: validated.targetId },
        include: { product: true },
      });

      if (!variant) {
        return { success: false, message: "La variante especificada no existe", updatedCount: 0 };
      }

      await prisma.productVariant.update({
        where: { id: validated.targetId },
        data: updateData,
      });

      return {
        success: true,
        message: `Se actualizó el umbral de stock para "${variant.product.name}" (Talle ${variant.size}, Color ${variant.color}).`,
        updatedCount: 1,
      };
    }
  } catch (error) {
    console.error("Error al configurar umbrales de stock:", error);
    return {
      success: false,
      message: "Error al actualizar los umbrales de stock",
      error: error instanceof Error ? error.message : "Error inesperado",
      updatedCount: 0,
    };
  }
}
