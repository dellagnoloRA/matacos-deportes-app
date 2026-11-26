"use server";

import { prisma } from "@/lib/prisma";
import {
  BatchPriceUpdateSchema,
  BatchPriceUpdateInput,
  BatchPriceUpdateResult,
  ProductPriceChangeRecord,
  PriceUpdateFilters,
} from "@/schemas/priceUpdate";
import { calculateNewPrice } from "@/lib/priceCalculator";
import { Prisma } from "@prisma/client";
import { invalidateLandingCache } from "@/lib/landingCache";

/**
 * Serializa objetos de Prisma (incluyendo Decimals y Dates) para consumo seguro en Client Components
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
 * Construye la cláusula where dinámica de Prisma a partir de los filtros dinámicos recibidos
 */
function buildWhereClause(filters?: PriceUpdateFilters): Prisma.ProductWhereInput {
  if (!filters) {
    return { active: true };
  }

  const { productIds, categoryId, brandId, disciplineId, search, activeOnly = true } = filters;

  const where: Prisma.ProductWhereInput = {
    ...(activeOnly ? { active: true } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),
    ...(disciplineId ? { disciplineId } : {}),
    ...(productIds && productIds.length > 0 ? { id: { in: productIds } } : {}),
    ...(search && search.trim() !== ""
      ? {
          OR: [
            { name: { contains: search.trim(), mode: "insensitive" } },
            { description: { contains: search.trim(), mode: "insensitive" } },
            {
              variants: {
                some: {
                  OR: [
                    { sku: { contains: search.trim(), mode: "insensitive" } },
                    { barcode: { contains: search.trim(), mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  return where;
}

/**
 * Previsualiza el impacto de la actualización porcentual sin modificar la base de datos (Simulación matemática)
 */
export async function previewBatchPriceUpdate(
  input: BatchPriceUpdateInput
): Promise<BatchPriceUpdateResult> {
  const timestamp = new Date().toISOString();

  try {
    const validated = BatchPriceUpdateSchema.parse(input);
    const whereClause = buildWhereClause(validated.filters);

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        brand: true,
        discipline: true,
        variants: true,
      },
      orderBy: { name: "asc" },
    });

    const auditLog: ProductPriceChangeRecord[] = [];
    let updatedVariantsCount = 0;
    let totalOldPriceSum = 0;
    let totalNewPriceSum = 0;

    for (const prod of products) {
      const currentPrice = Number(prod.price);
      const currentCost = prod.costPrice !== null && prod.costPrice !== undefined ? Number(prod.costPrice) : 0;

      let calculatedPrice = currentPrice;
      let calculatedCost = currentCost;

      if (validated.targetField === "PRICE" || validated.targetField === "BOTH") {
        calculatedPrice = calculateNewPrice(currentPrice, validated.percentage, validated.roundingPolicy).finalPrice;
      }

      if ((validated.targetField === "COST_PRICE" || validated.targetField === "BOTH") && prod.costPrice !== null && prod.costPrice !== undefined) {
        calculatedCost = calculateNewPrice(currentCost, validated.percentage, validated.roundingPolicy).finalPrice;
      }

      let variantCount = 0;
      if (validated.updateVariantPrices) {
        for (const v of prod.variants) {
          if (v.price !== null) {
            variantCount++;
          }
        }
      }

      const delta = Math.round((calculatedPrice - currentPrice) * 100) / 100;
      const effPct =
        currentPrice > 0 ? Math.round(((calculatedPrice - currentPrice) / currentPrice) * 10000) / 100 : 0;

      totalOldPriceSum += currentPrice;
      totalNewPriceSum += calculatedPrice;
      updatedVariantsCount += variantCount;

      auditLog.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.variants[0]?.sku || "S/D",
        category: prod.category.name,
        brand: prod.brand.name,
        discipline: prod.discipline.name,
        oldCostPrice: currentCost,
        newCostPrice: calculatedCost,
        oldPrice: currentPrice,
        newPrice: calculatedPrice,
        priceDelta: delta,
        effectivePercentage: effPct,
        variantsUpdatedCount: variantCount,
      });
    }

    const totalDeltaSum = Math.round((totalNewPriceSum - totalOldPriceSum) * 100) / 100;

    return serializeData({
      success: true,
      message: `Simulación exitosa: ${products.length} productos analizados con porcentaje de ${validated.percentage}%`,
      timestamp,
      reason: validated.reason,
      appliedSettings: {
        percentage: validated.percentage,
        targetField: validated.targetField,
        roundingPolicy: validated.roundingPolicy,
        updateVariantPrices: validated.updateVariantPrices,
      },
      summary: {
        matchedProductsCount: products.length,
        updatedProductsCount: products.length,
        updatedVariantsCount,
        totalOldPriceSum: Math.round(totalOldPriceSum * 100) / 100,
        totalNewPriceSum: Math.round(totalNewPriceSum * 100) / 100,
        totalDeltaSum,
      },
      auditLog,
    });
  } catch (error) {
    console.error("Error en previewBatchPriceUpdate:", error);
    return {
      success: false,
      message: "Error al simular la actualización de precios",
      error: error instanceof Error ? error.message : "Error desconocido",
      timestamp,
      appliedSettings: {
        percentage: input?.percentage || 0,
        targetField: input?.targetField || "PRICE",
        roundingPolicy: input?.roundingPolicy || "NEAREST_10",
        updateVariantPrices: Boolean(input?.updateVariantPrices),
      },
      summary: {
        matchedProductsCount: 0,
        updatedProductsCount: 0,
        updatedVariantsCount: 0,
        totalOldPriceSum: 0,
        totalNewPriceSum: 0,
        totalDeltaSum: 0,
      },
      auditLog: [],
    };
  }
}

/**
 * Ejecuta de manera atómica (prisma.$transaction) la actualización porcentual de precios
 * y genera un registro de auditoría completo con el histórico de cambios.
 */
export async function updatePricesByPercentage(
  input: BatchPriceUpdateInput
): Promise<BatchPriceUpdateResult> {
  const timestamp = new Date().toISOString();

  try {
    // 1. Validar parámetros con Zod
    const validated = BatchPriceUpdateSchema.parse(input);
    const whereClause = buildWhereClause(validated.filters);

    // 2. Ejecutar transacción atómica
    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: whereClause,
        include: {
          category: true,
          brand: true,
          discipline: true,
          variants: true,
        },
      });

      if (products.length === 0) {
        return {
          productsUpdated: 0,
          variantsUpdated: 0,
          totalOldSum: 0,
          totalNewSum: 0,
          audit: [] as ProductPriceChangeRecord[],
        };
      }

      const audit: ProductPriceChangeRecord[] = [];
      let totalVariantsUpdated = 0;
      let totalOldSum = 0;
      let totalNewSum = 0;

      for (const prod of products) {
        const oldPrice = Number(prod.price);
        const oldCost = prod.costPrice !== null && prod.costPrice !== undefined ? Number(prod.costPrice) : 0;

        let newPrice = oldPrice;
        let newCost = oldCost;

        const updateData: Prisma.ProductUpdateInput = {};

        if (validated.targetField === "PRICE" || validated.targetField === "BOTH") {
          newPrice = calculateNewPrice(oldPrice, validated.percentage, validated.roundingPolicy).finalPrice;
          updateData.price = new Prisma.Decimal(newPrice);
        }

        if ((validated.targetField === "COST_PRICE" || validated.targetField === "BOTH") && prod.costPrice !== null && prod.costPrice !== undefined) {
          newCost = calculateNewPrice(oldCost, validated.percentage, validated.roundingPolicy).finalPrice;
          updateData.costPrice = new Prisma.Decimal(newCost);
        }

        // Actualizar el producto padre en PostgreSQL
        await tx.product.update({
          where: { id: prod.id },
          data: updateData,
        });

        // Actualizar variantes si tienen un precio diferencial asignado
        let prodVariantsUpdated = 0;
        if (validated.updateVariantPrices) {
          for (const variant of prod.variants) {
            if (variant.price !== null) {
              const oldVarPrice = Number(variant.price);
              const newVarPrice = calculateNewPrice(
                oldVarPrice,
                validated.percentage,
                validated.roundingPolicy
              ).finalPrice;

              await tx.productVariant.update({
                where: { id: variant.id },
                data: {
                  price: new Prisma.Decimal(newVarPrice),
                },
              });

              prodVariantsUpdated++;
            }
          }
        }

        totalVariantsUpdated += prodVariantsUpdated;
        totalOldSum += oldPrice;
        totalNewSum += newPrice;

        const delta = Math.round((newPrice - oldPrice) * 100) / 100;
        const effPct = oldPrice > 0 ? Math.round(((newPrice - oldPrice) / oldPrice) * 10000) / 100 : 0;

        audit.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.variants[0]?.sku || "S/D",
          category: prod.category.name,
          brand: prod.brand.name,
          discipline: prod.discipline.name,
          oldCostPrice: oldCost,
          newCostPrice: newCost,
          oldPrice,
          newPrice,
          priceDelta: delta,
          effectivePercentage: effPct,
          variantsUpdatedCount: prodVariantsUpdated,
        });
      }

      return {
        productsUpdated: products.length,
        variantsUpdated: totalVariantsUpdated,
        totalOldSum,
        totalNewSum,
        audit,
      };
    });

    const totalDeltaSum = Math.round((result.totalNewSum - result.totalOldSum) * 100) / 100;
    invalidateLandingCache("discount");

    return serializeData({
      success: true,
      message: `Se actualizaron exitosamente los precios de ${result.productsUpdated} productos y ${result.variantsUpdated} variantes (${validated.percentage > 0 ? "+" : ""}${validated.percentage}%)`,
      timestamp,
      reason: validated.reason,
      appliedSettings: {
        percentage: validated.percentage,
        targetField: validated.targetField,
        roundingPolicy: validated.roundingPolicy,
        updateVariantPrices: validated.updateVariantPrices,
      },
      summary: {
        matchedProductsCount: result.productsUpdated,
        updatedProductsCount: result.productsUpdated,
        updatedVariantsCount: result.variantsUpdated,
        totalOldPriceSum: Math.round(result.totalOldSum * 100) / 100,
        totalNewPriceSum: Math.round(result.totalNewSum * 100) / 100,
        totalDeltaSum,
      },
      auditLog: result.audit,
    });
  } catch (error) {
    console.error("Error al actualizar precios masivamente:", error);
    return {
      success: false,
      message: "Error al actualizar los precios en la base de datos",
      error: error instanceof Error ? error.message : "Error inesperado",
      timestamp,
      appliedSettings: {
        percentage: input?.percentage || 0,
        targetField: input?.targetField || "PRICE",
        roundingPolicy: input?.roundingPolicy || "NEAREST_10",
        updateVariantPrices: Boolean(input?.updateVariantPrices),
      },
      summary: {
        matchedProductsCount: 0,
        updatedProductsCount: 0,
        updatedVariantsCount: 0,
        totalOldPriceSum: 0,
        totalNewPriceSum: 0,
        totalDeltaSum: 0,
      },
      auditLog: [],
    };
  }
}
