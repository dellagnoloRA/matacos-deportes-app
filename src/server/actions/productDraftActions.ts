"use server";

import { prisma } from "@/lib/prisma";
import { Gender, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { generateModelCode } from "@/lib/textUtils";

export interface WizardProductData {
  id?: string;
  draftId?: string;
  // Paso 1: Identificación
  name: string;
  skuModel: string;
  slug: string;
  brandId: string;
  gender: string;
  disciplineId: string;
  categoryId: string;
  subcategoryId?: string;
  tags: string[];

  // Paso 2: Fotos
  generalImages: { url: string; isPrimary: boolean; order: number; color?: string }[];
  colorImages: Record<string, string[]>;

  // Paso 3: Precios
  costPrice?: number | null;
  listPrice?: number | null;
  price: number;
  vatRate: number;
  installments: number;

  // Paso 4: Ficha Técnica
  shortDescription: string;
  description: string;
  highlights: { icon: string; title: string; text: string }[];
  specs: Record<string, string>;

  // Paso 5: Guía de Talles
  useSizeGuide: boolean;
  sizeGuideId?: string | null;

  // Paso 6: Variantes y Stock
  variants: {
    id?: string;
    size: string;
    color: string;
    colorHex?: string;
    sku: string;
    barcode?: string;
    price?: number | null;
    stockStore: number;
    stockWarehouse: number;
    minStoreStock: number;
    minStock: number;
  }[];

  // Paso 7: Envío y Publicación
  weightGrams?: number | null;
  dimensions?: { length?: number; width?: number; height?: number };
  metaTitle?: string;
  metaDescription?: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishedAt?: string | null;
}

/**
 * Autoguardado del borrador en PostgreSQL
 */
export async function autoSaveDraftToPostgres(data: WizardProductData, step: number) {
  try {
    let draft;
    if (data.draftId) {
      draft = await prisma.productDraft.upsert({
        where: { id: data.draftId },
        update: {
          name: data.name || "Borrador sin título",
          step,
          data: data as unknown as Prisma.InputJsonValue,
        },
        create: {
          id: data.draftId,
          name: data.name || "Borrador sin título",
          step,
          data: data as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      draft = await prisma.productDraft.create({
        data: {
          name: data.name || "Borrador sin título",
          step,
          data: data as unknown as Prisma.InputJsonValue,
        },
      });
    }

    return { success: true, draftId: draft.id, updatedAt: draft.updatedAt };
  } catch (error) {
    console.error("Error al autoguardar borrador en PostgreSQL:", error);
    return { success: false, error: "No se pudo autoguardar el borrador" };
  }
}

/**
 * Recuperar el último borrador guardado en PostgreSQL
 */
export async function getLatestDraftFromPostgres() {
  try {
    const draft = await prisma.productDraft.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!draft) return { success: true, draft: null };

    return {
      success: true,
      draft: {
        id: draft.id,
        name: draft.name,
        step: draft.step,
        data: draft.data as unknown as WizardProductData,
        updatedAt: draft.updatedAt,
      },
    };
  } catch (error) {
    console.error("Error al obtener borrador:", error);
    return { success: false, error: "No se pudo recuperar el borrador" };
  }
}

/**
 * Eliminar borrador
 */
export async function deleteProductDraft(id: string) {
  try {
    await prisma.productDraft.deleteMany({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error al descartar borrador:", error);
    return { success: false, error: "No se pudo descartar el borrador" };
  }
}

/**
 * Publicar el producto final desde el Wizard
 */
export async function publishProductFromWizard(data: WizardProductData) {
  try {
    // 1. Validaciones mínimas de integridad
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: "El nombre del producto debe tener al menos 3 caracteres." };
    }
    if (!data.brandId || !data.categoryId || !data.disciplineId) {
      return { success: false, error: "Debes seleccionar marca, categoría y disciplina." };
    }
    if (!data.variants || data.variants.length === 0) {
      return { success: false, error: "Debe existir al menos una variante de talle/color." };
    }

    // Comprobar SKUs duplicados
    const skus = data.variants.map((v) => v.sku);
    const existingSkus = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });

    if (existingSkus.length > 0) {
      return {
        success: false,
        error: `Los siguientes SKUs ya están en uso: ${existingSkus.map((s) => s.sku).join(", ")}`,
      };
    }

    // Comprobar Códigos de Barra duplicados
    const barcodes = data.variants
      .map((v) => v.barcode?.trim())
      .filter((b): b is string => Boolean(b));

    const duplicateBarcodesInPayload = barcodes.filter(
      (code, index) => barcodes.indexOf(code) !== index
    );
    if (duplicateBarcodesInPayload.length > 0) {
      return {
        success: false,
        error: `Hay códigos de barra repetidos entre las variantes: ${Array.from(new Set(duplicateBarcodesInPayload)).join(", ")}. Cada código debe ser único.`,
      };
    }

    if (barcodes.length > 0) {
      const existingBarcodes = await prisma.productVariant.findMany({
        where: { barcode: { in: barcodes } },
        select: { barcode: true },
      });
      if (existingBarcodes.length > 0) {
        return {
          success: false,
          error: `Los siguientes Códigos de Barra ya están registrados en el sistema: ${existingBarcodes.map((b) => b.barcode).join(", ")}`,
        };
      }
    }

    // 2. Transacción Atómica en PostgreSQL
    const created = await prisma.$transaction(async (tx) => {
      const [brand, category, discipline] = await Promise.all([
        tx.brand.findUnique({ where: { id: data.brandId } }),
        tx.category.findUnique({ where: { id: data.categoryId } }),
        tx.discipline.findUnique({ where: { id: data.disciplineId } }),
      ]);

      const canonicalModelCode =
        data.skuModel?.trim() ||
        generateModelCode({
          brand: brand?.name || "MAT",
          category: category?.name,
          discipline: discipline?.name,
          productName: data.name,
        });

      // Recopilar fotos
      const primaryUrl =
        data.generalImages.find((img) => img.isPrimary)?.url ||
        data.generalImages[0]?.url ||
        null;

      // Crear Producto
      const product = await tx.product.create({
        data: {
          name: data.name.trim(),
          slug: data.slug || undefined,
          description: data.description || null,
          shortDescription: data.shortDescription || null,
          imageUrl: primaryUrl,
          modelCode: canonicalModelCode,
          disciplineId: data.disciplineId,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId || null,
          brandId: data.brandId,
          costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : null,
          price: new Prisma.Decimal(data.price),
          listPrice: data.listPrice ? new Prisma.Decimal(data.listPrice) : null,
          vatRate: new Prisma.Decimal(data.vatRate || 21),
          installments: data.installments || 6,
          gender: (data.gender as Gender) || Gender.UNISEX,
          tags: data.tags || [],
          highlights: data.highlights ? (data.highlights as unknown as Prisma.InputJsonValue) : undefined,
          specs: data.specs ? (data.specs as unknown as Prisma.InputJsonValue) : undefined,
          sizeGuideId: data.useSizeGuide && data.sizeGuideId ? data.sizeGuideId : null,
          weightGrams: data.weightGrams || null,
          dimensionsCm: data.dimensions ? (data.dimensions as unknown as Prisma.InputJsonValue) : undefined,
          status: data.status,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
          active: true,
          variants: {
            create: data.variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode.trim() : null,
              stockStore: v.stockStore || 0,
              stockWarehouse: v.stockWarehouse || 0,
              minStoreStock: v.minStoreStock || 1,
              minStock: v.minStock || 2,
              price: v.price ? new Prisma.Decimal(v.price) : null,
            })),
          },
          images: {
            create: data.generalImages.map((img, idx) => ({
              url: img.url,
              color: img.color || null,
              isPrimary: img.isPrimary,
              order: img.order ?? idx,
            })),
          },
        },
        include: {
          variants: true,
        },
      });

      // Crear movimientos de inventario inicial si hay stock
      for (const variant of product.variants) {
        const total = variant.stockStore + variant.stockWarehouse;
        if (total > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "INGRESO_INICIAL",
              quantity: total,
              stockAfter: total,
              location: variant.stockWarehouse > 0 && variant.stockStore === 0 ? "WAREHOUSE" : "STORE",
              reason: "Stock inicial al crear producto vía Plantilla Back Office",
            },
          });
        }
      }

      // Si existía un borrador asociado, eliminarlo
      if (data.draftId) {
        await tx.productDraft.deleteMany({
          where: { id: data.draftId },
        });
      }

      return product;
    });

    revalidatePath("/admin");
    revalidatePath("/productos");

    return {
      success: true,
      productId: created.id,
    };
  } catch (error) {
    console.error("Error al publicar producto desde el Wizard:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al guardar el producto en PostgreSQL",
    };
  }
}
