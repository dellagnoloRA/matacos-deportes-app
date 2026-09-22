"use server";

import { prisma } from "@/lib/prisma";
import {
  BulkImportPayloadSchema,
  BulkImportPayloadInput,
  BulkImportResult,
  BulkImportError,
} from "@/schemas/bulkImport";
import { slugify, toCanonicalTitle, generateDeterministicSku, generateModelCode, isDefectiveFormulaSku } from "@/lib/textUtils";
import { Prisma } from "@prisma/client";

/**
 * Helper interno para resolver o crear una entidad por slug en una transacción
 */
async function resolveEntityBySlug<T extends { id: string; name: string; slug: string }>(
  delegate: {
    findUnique: (args: { where: { slug: string } }) => Promise<T | null>;
    create: (args: { data: { name: string; slug: string } }) => Promise<T>;
  },
  rawName: string
): Promise<T> {
  const slug = slugify(rawName);
  const existing = await delegate.findUnique({ where: { slug } });
  if (existing) {
    return existing;
  }
  return await delegate.create({
    data: {
      name: toCanonicalTitle(rawName),
      slug,
    },
  });
}

/**
 * Server Action para Ingestión Masiva y Carga Progresiva de Catálogo y Stock (RF-04)
 * Ejecuta transacciones atómicas independientes por producto (Best-Effort) con reporte granular.
 */
export async function bulkImportProducts(input: BulkImportPayloadInput): Promise<BulkImportResult> {
  // 1. Validar el payload global con Zod
  const parsed = BulkImportPayloadSchema.safeParse(input);
  if (!parsed.success) {
    const zodErrors: BulkImportError[] = parsed.error.issues.map((issue, idx) => ({
      index: idx,
      productName: "Payload Global",
      field: issue.path.join("."),
      reason: issue.message,
    }));

    return {
      success: false,
      batchReference: input?.batchReference || "Lote sin referencia",
      mode: input?.mode || "ACCUMULATE_STOCK",
      summary: {
        totalProductsSubmitted: input?.items?.length || 0,
        successfulProducts: 0,
        failedProducts: input?.items?.length || 0,
        createdProducts: 0,
        updatedProducts: 0,
        createdVariants: 0,
        updatedVariants: 0,
      },
      errors: zodErrors,
    };
  }

  const { batchReference, mode, items } = parsed.data;

  const result: BulkImportResult = {
    success: true,
    batchReference,
    mode,
    summary: {
      totalProductsSubmitted: items.length,
      successfulProducts: 0,
      failedProducts: 0,
      createdProducts: 0,
      updatedProducts: 0,
      createdVariants: 0,
      updatedVariants: 0,
    },
    errors: [],
  };

  // 2. Procesar cada producto de forma atómica e independiente
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    try {
      await prisma.$transaction(async (tx) => {
        // A. Resolver entidades relacionadas (Disciplina, Categoría, Marca) on-the-fly
        const discipline = await resolveEntityBySlug(tx.discipline, item.disciplineName);
        const category = await resolveEntityBySlug(tx.category, item.categoryName);
        const brand = await resolveEntityBySlug(tx.brand, item.brandName);

        // B. Buscar si el producto ya existe (por Nombre y Marca)
        const existingProduct = await tx.product.findFirst({
          where: {
            name: { equals: item.name.trim(), mode: "insensitive" },
            brandId: brand.id,
          },
          include: { variants: true },
        });

        let targetProductId: string;
        let isNewProduct = false;

        const canonicalModelCode = generateModelCode({
          brand: brand.name,
          category: category.name,
          discipline: discipline.name,
          productName: item.name,
        });

        if (!existingProduct) {
          // Crear Producto padre
          const newProduct = await tx.product.create({
            data: {
              name: toCanonicalTitle(item.name.replace(/\s*-\s*$/, "")),
              description: item.description?.trim() || null,
              modelCode: canonicalModelCode,
              disciplineId: discipline.id,
              categoryId: category.id,
              brandId: brand.id,
              costPrice: item.costPrice !== null && item.costPrice !== undefined ? new Prisma.Decimal(item.costPrice) : null,
              price: new Prisma.Decimal(item.price),
              active: true,
            },
          });
          targetProductId = newProduct.id;
          isNewProduct = true;
          result.summary.createdProducts++;
        } else {
          targetProductId = existingProduct.id;
          // Si el modo es OVERWRITE, actualizar datos y precios del producto padre
          if (mode === "OVERWRITE") {
            await tx.product.update({
              where: { id: existingProduct.id },
              data: {
                disciplineId: discipline.id,
                categoryId: category.id,
                modelCode: existingProduct.modelCode || canonicalModelCode,
                costPrice: item.costPrice !== null && item.costPrice !== undefined ? new Prisma.Decimal(item.costPrice) : null,
                price: new Prisma.Decimal(item.price),
                description: item.description?.trim() !== undefined ? item.description?.trim() : existingProduct.description,
              },
            });
          }
          result.summary.updatedProducts++;
        }

        // C. Procesar las variantes del producto
        for (const v of item.variants) {
          // Generar SKU determinista si viene vacío o si proviene de una fórmula defectuosa/genérica de Excel
          const finalSku = v.sku && v.sku.trim() !== "" && !isDefectiveFormulaSku(v.sku)
            ? v.sku.trim().toUpperCase()
            : generateDeterministicSku({
                brand: brand.name,
                category: category.name,
                discipline: discipline.name,
                productName: item.name,
                size: v.size,
                color: v.color,
              });

          const finalBarcode = v.barcode && v.barcode.trim() !== "" ? v.barcode.trim() : null;

          // Buscar si la variante ya existe (por SKU o Barcode)
          const existingVariant = await tx.productVariant.findFirst({
            where: {
              OR: [
                { sku: finalSku },
                ...(finalBarcode ? [{ barcode: finalBarcode }] : []),
                {
                  productId: targetProductId,
                  size: { equals: v.size.trim(), mode: "insensitive" },
                  color: { equals: v.color.trim(), mode: "insensitive" },
                },
              ],
            },
          });

          if (existingVariant) {
            // Salvaguarda de integridad: una variante no puede pertenecer a dos productos distintos
            if (existingVariant.productId !== targetProductId) {
              throw new Error(
                `Colisión de SKU: El código '${finalSku}' ya está asignado a otro producto en la base de datos y no puede reasignarse a '${item.name}'.`
              );
            }

            if (mode === "CREATE_ONLY") {
              throw new Error(`La variante con SKU '${finalSku}' ya existe en el sistema`);
            }

            if (mode === "ACCUMULATE_STOCK") {
              const newStore = existingVariant.stockStore + v.stockStore;
              const newWarehouse = existingVariant.stockWarehouse + v.stockWarehouse;
              const totalAfter = newStore + newWarehouse;
              const addedTotal = v.stockStore + v.stockWarehouse;

              const updated = await tx.productVariant.update({
                where: { id: existingVariant.id },
                data: {
                  stockStore: newStore,
                  stockWarehouse: newWarehouse,
                  minStoreStock: v.minStoreStock !== undefined ? v.minStoreStock : existingVariant.minStoreStock,
                  minStock: v.minStock !== undefined ? v.minStock : existingVariant.minStock,
                  price: v.price ? new Prisma.Decimal(v.price) : existingVariant.price,
                },
              });

              if (addedTotal > 0) {
                await tx.inventoryMovement.create({
                  data: {
                    variantId: updated.id,
                    type: "INGRESO_COMPRA",
                    quantity: addedTotal,
                    stockAfter: totalAfter,
                    location: v.stockWarehouse > 0 && v.stockStore === 0 ? "WAREHOUSE" : "STORE",
                    reason: `Lote ${batchReference} (Acumulación)`,
                  },
                });
              }

              result.summary.updatedVariants++;
            } else if (mode === "OVERWRITE") {
              const totalAfter = v.stockStore + v.stockWarehouse;

              const updated = await tx.productVariant.update({
                where: { id: existingVariant.id },
                data: {
                  stockStore: v.stockStore,
                  stockWarehouse: v.stockWarehouse,
                  minStoreStock: v.minStoreStock,
                  minStock: v.minStock,
                  price: v.price ? new Prisma.Decimal(v.price) : existingVariant.price,
                },
              });

              await tx.inventoryMovement.create({
                data: {
                  variantId: updated.id,
                  type: "AJUSTE_INGRESO",
                  quantity: totalAfter,
                  stockAfter: totalAfter,
                  location: "STORE",
                  reason: `Lote ${batchReference} (Sobreescritura)`,
                },
              });

              result.summary.updatedVariants++;
            }
          } else {
            // Crear nueva variante
            const totalInitialStock = v.stockStore + v.stockWarehouse;

            const newVariant = await tx.productVariant.create({
              data: {
                productId: targetProductId,
                size: v.size.trim(),
                color: toCanonicalTitle(v.color),
                sku: finalSku,
                barcode: finalBarcode,
                stockStore: v.stockStore,
                stockWarehouse: v.stockWarehouse,
                minStoreStock: v.minStoreStock,
                minStock: v.minStock,
                price: v.price ? new Prisma.Decimal(v.price) : null,
              },
            });

            if (totalInitialStock > 0) {
              await tx.inventoryMovement.create({
                data: {
                  variantId: newVariant.id,
                  type: isNewProduct ? "INGRESO_INICIAL" : "INGRESO_COMPRA",
                  quantity: totalInitialStock,
                  stockAfter: totalInitialStock,
                  location: v.stockWarehouse > 0 && v.stockStore === 0 ? "WAREHOUSE" : "STORE",
                  reason: `Lote ${batchReference} (Alta inicial)`,
                },
              });
            }

            result.summary.createdVariants++;
          }
        }
      });

      result.summary.successfulProducts++;
    } catch (error) {
      result.summary.failedProducts++;
      const errorMessage = error instanceof Error ? error.message : "Error inesperado al procesar el producto";
      result.errors.push({
        index: i + 1,
        productName: item.name,
        reason: errorMessage,
      });
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Consultas auxiliares de catálogo para autocompletado y dropdowns
 */
export async function getDisciplines() {
  try {
    const data = await prisma.discipline.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error al obtener disciplinas:", error);
    return { success: false, error: "No se pudieron obtener las disciplinas" };
  }
}

export async function getCategories() {
  try {
    const data = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return { success: false, error: "No se pudieron obtener las categorías" };
  }
}

export async function getBrands() {
  try {
    const data = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return { success: false, error: "No se pudieron obtener las marcas" };
  }
}
