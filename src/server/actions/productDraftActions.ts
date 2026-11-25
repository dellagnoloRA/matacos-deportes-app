"use server";

import { prisma } from "@/lib/prisma";
import { Gender, Prisma } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { generateModelCode } from "@/lib/textUtils";
import { invalidateLandingCache } from "@/lib/landingCache";

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

  // Paso 5: Guía de Talles y Cuidados
  useSizeGuide: boolean;
  sizeGuideId?: string | null;
  useCareGuide: boolean;
  careGuideId?: string | null;

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
          careGuideId: data.useCareGuide && data.careGuideId ? data.careGuideId : null,
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

    invalidateLandingCache("product");
    revalidateTag("ecommerce-catalog");
    revalidateTag("catalog-facets");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/productos", "layout");
    revalidatePath(`/productos/${created.id}`);

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

function convertPlainTextToHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }
  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\r?\n\r?\n/)
    .map((para) => `<p>${para.replace(/\r?\n/g, "<br />")}</p>`)
    .join("");
}

/**
 * Cargar un producto existente de PostgreSQL en formato WizardProductData para edición web
 */
export async function getProductForWizardEdit(productId: string): Promise<{
  success: boolean;
  data?: WizardProductData;
  error?: string;
}> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { order: "asc" } },
        variants: { orderBy: [{ size: "asc" }, { color: "asc" }] },
      },
    });

    if (!product) {
      return { success: false, error: "Producto no encontrado" };
    }

    const rawHighlights = Array.isArray(product.highlights)
      ? product.highlights.flatMap((h) => {
          if (!h || typeof h !== "object" || Array.isArray(h)) return [];
          const rec = h as Record<string, unknown>;
          return [
            {
              icon: typeof rec.icon === "string" ? rec.icon : "zap",
              title: typeof rec.title === "string" ? rec.title : "",
              text: typeof rec.text === "string" ? rec.text : "",
              isCustomIcon: typeof rec.isCustomIcon === "boolean" ? rec.isCustomIcon : undefined,
            },
          ];
        })
      : [];

    const rawSpecs =
      product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
        ? Object.fromEntries(
            Object.entries(product.specs as Record<string, unknown>)
              .filter(([, v]) => v !== null && v !== undefined)
              .map(([k, v]) => [k, String(v)])
          )
        : {};

    const rawDims =
      product.dimensionsCm &&
      typeof product.dimensionsCm === "object" &&
      !Array.isArray(product.dimensionsCm)
        ? (product.dimensionsCm as { length?: number; width?: number; height?: number })
        : undefined;

    const wizardImages =
      product.images.length > 0
        ? product.images.map((img, idx) => ({
            url: img.url,
            isPrimary: img.isPrimary ?? idx === 0,
            order: img.order ?? idx,
            color: img.color || undefined,
          }))
        : product.imageUrl
        ? [{ url: product.imageUrl, isPrimary: true, order: 0 }]
        : [];

    const statusNormalized: "DRAFT" | "PUBLISHED" | "SCHEDULED" =
      product.status === "DRAFT" || product.status === "SCHEDULED"
        ? product.status
        : "PUBLISHED";

    const formState: WizardProductData = {
      id: product.id,
      name: product.name,
      skuModel: product.modelCode || "",
      slug: product.slug || "",
      brandId: product.brandId,
      gender: product.gender,
      disciplineId: product.disciplineId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId || "",
      tags: product.tags || [],

      generalImages: wizardImages,
      colorImages: {},

      costPrice: product.costPrice !== null ? Number(product.costPrice) : null,
      listPrice: product.listPrice !== null ? Number(product.listPrice) : null,
      price: Number(product.price),
      vatRate: Number(product.vatRate || 21),
      installments: product.installments || 6,

      shortDescription: product.shortDescription || "",
      description: product.description ? convertPlainTextToHtml(product.description) : "",
      highlights: rawHighlights,
      specs: rawSpecs,

      useSizeGuide: Boolean(product.sizeGuideId),
      sizeGuideId: product.sizeGuideId || null,
      useCareGuide: Boolean(product.careGuideId),
      careGuideId: product.careGuideId || null,

      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        barcode: v.barcode || "",
        price: v.price !== null ? Number(v.price) : null,
        stockStore: v.stockStore,
        stockWarehouse: v.stockWarehouse,
        minStoreStock: v.minStoreStock,
        minStock: v.minStock,
      })),

      weightGrams: product.weightGrams ?? null,
      dimensions: rawDims,
      metaTitle: product.metaTitle || "",
      metaDescription: product.metaDescription || "",
      status: statusNormalized,
      publishedAt: product.publishedAt ? product.publishedAt.toISOString() : null,
    };

    return { success: true, data: formState };
  } catch (error) {
    console.error("Error al cargar producto para edición en Wizard:", error);
    return { success: false, error: "No se pudo cargar el producto para edición" };
  }
}

/**
 * Actualizar ficha web completa desde el Wizard (aislando stock de variantes existentes)
 */
export async function updateProductFromWizard(productId: string, data: WizardProductData) {
  try {
    if (!productId) {
      return { success: false, error: "ID de producto no provisto." };
    }
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: "El nombre del producto debe tener al menos 3 caracteres." };
    }
    if (!data.brandId || !data.categoryId || !data.disciplineId) {
      return { success: false, error: "Debes seleccionar marca, categoría y disciplina." };
    }
    if (!data.variants || data.variants.length === 0) {
      return { success: false, error: "Debe existir al menos una variante de talle/color." };
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });

    if (!existingProduct) {
      return { success: false, error: "El producto a editar no existe." };
    }

    // Validar SKUs duplicados fuera de este producto
    const skus = data.variants.map((v) => v.sku.trim()).filter(Boolean);
    const duplicateSkuInPayload = skus.filter((s, idx) => skus.indexOf(s) !== idx);
    if (duplicateSkuInPayload.length > 0) {
      return {
        success: false,
        error: `Hay SKUs repetidos en el formulario: ${Array.from(new Set(duplicateSkuInPayload)).join(", ")}`,
      };
    }
    const existingSkus = await prisma.productVariant.findMany({
      where: { sku: { in: skus }, productId: { not: productId } },
      select: { sku: true },
    });
    if (existingSkus.length > 0) {
      return {
        success: false,
        error: `Los siguientes SKUs ya pertenecen a otro producto: ${existingSkus.map((s) => s.sku).join(", ")}`,
      };
    }

    // Validar códigos de barra duplicados
    const barcodes = data.variants
      .map((v) => v.barcode?.trim())
      .filter((b): b is string => Boolean(b));
    const duplicateBarcodesInPayload = barcodes.filter((b, idx) => barcodes.indexOf(b) !== idx);
    if (duplicateBarcodesInPayload.length > 0) {
      return {
        success: false,
        error: `Hay códigos de barra repetidos entre las variantes: ${Array.from(new Set(duplicateBarcodesInPayload)).join(", ")}`,
      };
    }
    if (barcodes.length > 0) {
      const existingBarcodes = await prisma.productVariant.findMany({
        where: { barcode: { in: barcodes }, productId: { not: productId } },
        select: { barcode: true },
      });
      if (existingBarcodes.length > 0) {
        return {
          success: false,
          error: `Los siguientes Códigos de Barra ya están registrados en otro producto: ${existingBarcodes.map((b) => b.barcode).join(", ")}`,
        };
      }
    }

    await prisma.$transaction(async (tx) => {
      const [brand, category, discipline] = await Promise.all([
        tx.brand.findUnique({ where: { id: data.brandId } }),
        tx.category.findUnique({ where: { id: data.categoryId } }),
        tx.discipline.findUnique({ where: { id: data.disciplineId } }),
      ]);

      const canonicalModelCode =
        data.skuModel?.trim() ||
        existingProduct.modelCode ||
        generateModelCode({
          brand: brand?.name || "MAT",
          category: category?.name,
          discipline: discipline?.name,
          productName: data.name,
        });

      const primaryUrl =
        data.generalImages.find((img) => img.isPrimary)?.url ||
        data.generalImages[0]?.url ||
        existingProduct.imageUrl ||
        null;

      const cleanSpecs = Object.fromEntries(
        Object.entries(data.specs || {}).filter(([k, v]) => k.trim() !== "" && v.trim() !== "")
      );

      await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name.trim(),
          slug: data.slug?.trim() ? data.slug.trim() : existingProduct.slug,
          description: data.description?.trim() ? data.description : null,
          shortDescription: data.shortDescription?.trim() || null,
          imageUrl: primaryUrl,
          modelCode: canonicalModelCode,
          disciplineId: data.disciplineId,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId || null,
          brandId: data.brandId,
          costPrice: data.costPrice !== null && data.costPrice !== undefined ? new Prisma.Decimal(data.costPrice) : null,
          price: new Prisma.Decimal(data.price),
          listPrice: data.listPrice ? new Prisma.Decimal(data.listPrice) : null,
          vatRate: new Prisma.Decimal(data.vatRate || 21),
          installments: data.installments || 6,
          gender: (data.gender as Gender) || Gender.UNISEX,
          tags: data.tags || [],
          highlights:
            data.highlights && data.highlights.length > 0
              ? (data.highlights as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          specs:
            Object.keys(cleanSpecs).length > 0
              ? (cleanSpecs as unknown as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          sizeGuideId: data.useSizeGuide && data.sizeGuideId ? data.sizeGuideId : null,
          careGuideId: data.useCareGuide && data.careGuideId ? data.careGuideId : null,
          weightGrams: data.weightGrams ?? null,
          dimensionsCm: data.dimensions
            ? (data.dimensions as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          status: data.status,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : existingProduct.publishedAt,
          metaTitle: data.metaTitle?.trim() || null,
          metaDescription: data.metaDescription?.trim() || null,
        },
      });

      // Sincronizar imágenes
      await tx.productImage.deleteMany({ where: { productId } });
      if (data.generalImages.length > 0) {
        await tx.productImage.createMany({
          data: data.generalImages.map((img, idx) => ({
            productId,
            url: img.url,
            color: img.color || null,
            isPrimary: img.isPrimary,
            order: img.order ?? idx,
          })),
        });
      }

      // Sincronizar variantes AISLANDO stockStore / stockWarehouse de variantes existentes
      const incomingIds = data.variants
        .map((v) => v.id)
        .filter((id): id is string => Boolean(id));

      const toRemove = existingProduct.variants.filter((ev) => !incomingIds.includes(ev.id));
      for (const rem of toRemove) {
        try {
          await tx.productVariant.delete({ where: { id: rem.id } });
        } catch {
          // Conservar variante si posee historial comercial / movimientos
        }
      }

      for (const v of data.variants) {
        const existingMatch = v.id ? existingProduct.variants.find((ev) => ev.id === v.id) : null;
        if (existingMatch) {
          // NUNCA sobrescribir stockStore ni stockWarehouse aquí para evitar condiciones de carrera con POS/Web
          await tx.productVariant.update({
            where: { id: existingMatch.id },
            data: {
              size: v.size.trim(),
              color: v.color.trim(),
              sku: v.sku.trim(),
              barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode.trim() : null,
              minStoreStock: v.minStoreStock ?? 1,
              minStock: v.minStock ?? 2,
              price: v.price ? new Prisma.Decimal(v.price) : null,
            },
          });
        } else {
          const createdVar = await tx.productVariant.create({
            data: {
              productId,
              size: v.size.trim(),
              color: v.color.trim(),
              sku: v.sku.trim(),
              barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode.trim() : null,
              stockStore: v.stockStore || 0,
              stockWarehouse: v.stockWarehouse || 0,
              minStoreStock: v.minStoreStock ?? 1,
              minStock: v.minStock ?? 2,
              price: v.price ? new Prisma.Decimal(v.price) : null,
            },
          });

          const total = createdVar.stockStore + createdVar.stockWarehouse;
          if (total > 0) {
            await tx.inventoryMovement.create({
              data: {
                variantId: createdVar.id,
                type: "INGRESO_INICIAL",
                quantity: total,
                stockAfter: total,
                location: createdVar.stockWarehouse > 0 && createdVar.stockStore === 0 ? "WAREHOUSE" : "STORE",
                reason: "Stock inicial al agregar variante en Edición Web",
              },
            });
          }
        }
      }
    });

    invalidateLandingCache("product");
    revalidateTag("ecommerce-catalog");
    revalidateTag("catalog-facets");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/productos", "layout");
    revalidatePath(`/productos/${productId}`);

    return { success: true, productId };
  } catch (error) {
    console.error("Error al actualizar ficha web desde el Wizard:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al actualizar el producto en PostgreSQL",
    };
  }
}
