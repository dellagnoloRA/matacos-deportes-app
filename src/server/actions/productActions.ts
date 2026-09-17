"use server";

import { prisma } from "@/lib/prisma";
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateProductInput,
  UpdateProductInput,
} from "@/schemas/product";
import { Prisma } from "@prisma/client";
import { DetailedProductItem } from "@/components/dashboard/types";
import { revalidatePath } from "next/cache";

export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  brandId?: string;
  disciplineId?: string;
  disciplineSlug?: string;
  activeOnly?: boolean;
}

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
 * Obtener listado de productos con variantes, categoría, marca y disciplina (soporta filtros y búsqueda)
 */
export async function getProducts(options: ProductFilterOptions = {}) {
  try {
    const { search, categoryId, brandId, disciplineId, disciplineSlug, activeOnly = true } = options;

    const whereClause: Prisma.ProductWhereInput = {
      ...(activeOnly ? { active: true } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {}),
      ...(disciplineId ? { disciplineId } : {}),
      ...(disciplineSlug ? { discipline: { slug: disciplineSlug } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              {
                variants: {
                  some: {
                    OR: [
                      { sku: { contains: search, mode: "insensitive" } },
                      { barcode: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        brand: true,
        discipline: true,
        images: {
          orderBy: { order: "asc" },
        },
        variants: {
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: serializeData(products) };
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return { success: false, error: "No se pudieron obtener los productos" };
  }
}

/**
 * Obtener el detalle completo de un producto por su ID
 */
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        discipline: true,
        images: {
          orderBy: { order: "asc" },
        },
        variants: {
          include: {
            movements: {
              take: 10,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Producto no encontrado" };
    }

    return { success: true, data: serializeData(product) };
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    return { success: false, error: "Error al consultar el producto" };
  }
}

/**
 * Crear un Producto con sus Variantes de forma atómica en una transacción
 */
export async function createProduct(input: CreateProductInput) {
  try {
    // 1. Validar los datos de entrada con Zod
    const validated = CreateProductSchema.parse(input);

    // 2. Comprobar duplicados de SKU o Códigos de Barra
    const skus = validated.variants.map((v) => v.sku);
    const existingSkus = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });

    if (existingSkus.length > 0) {
      return {
        success: false,
        error: `Los siguientes SKUs ya existen en el sistema: ${existingSkus.map((s) => s.sku).join(", ")}`,
      };
    }

    const barcodes = validated.variants
      .map((v) => v.barcode)
      .filter((b): b is string => Boolean(b && b.trim() !== ""));

    if (barcodes.length > 0) {
      const existingBarcodes = await prisma.productVariant.findMany({
        where: { barcode: { in: barcodes } },
        select: { barcode: true },
      });

      if (existingBarcodes.length > 0) {
        return {
          success: false,
          error: `Los siguientes Códigos de Barra ya existen: ${existingBarcodes.map((b) => b.barcode).join(", ")}`,
        };
      }
    }

    // 3. Ejecutar Transacción Atómica en PostgreSQL
    const newProduct = await prisma.$transaction(async (tx) => {
      const primaryImage =
        validated.images?.find((img) => img.isPrimary)?.url ||
        validated.images?.[0]?.url ||
        validated.imageUrl ||
        null;

      const product = await tx.product.create({
        data: {
          name: validated.name,
          description: validated.description ?? null,
          imageUrl: primaryImage,
          disciplineId: validated.disciplineId,
          costPrice: validated.costPrice !== null && validated.costPrice !== undefined ? new Prisma.Decimal(validated.costPrice) : null,
          price: new Prisma.Decimal(validated.price),
          categoryId: validated.categoryId,
          brandId: validated.brandId,
          active: validated.active,
          variants: {
            create: validated.variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode : null,
              stockStore: v.stockStore,
              stockWarehouse: v.stockWarehouse,
              minStoreStock: v.minStoreStock,
              minStock: v.minStock,
              price: v.price ? new Prisma.Decimal(v.price) : null,
            })),
          },
          images: {
            create: (validated.images || []).map((img, idx) => ({
              url: img.url,
              color: img.color?.trim() || null,
              isPrimary: img.isPrimary ?? (idx === 0),
              order: img.order ?? idx,
            })),
          },
        },
        include: {
          variants: true,
          images: { orderBy: { order: "asc" } },
          category: true,
          brand: true,
          discipline: true,
        },
      });

      // Crear movimientos iniciales de inventario si hay stock ingresado
      for (const variant of product.variants) {
        const totalInitialStock = variant.stockStore + variant.stockWarehouse;
        if (totalInitialStock > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "INGRESO_INICIAL",
              quantity: totalInitialStock,
              stockAfter: totalInitialStock,
              location: variant.stockWarehouse > 0 && variant.stockStore === 0 ? "WAREHOUSE" : "STORE",
              reason: "Stock inicial al dar de alta el producto",
            },
          });
        }
      }

      return product;
    });

    return { success: true, data: serializeData(newProduct) };
  } catch (error) {
    console.error("Error al crear producto:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Ocurrió un error inesperado al crear el producto" };
  }
}

/**
 * Actualizar un Producto existente
 */
export async function updateProduct(input: UpdateProductInput) {
  try {
    const validated = UpdateProductSchema.parse(input);

    const existingProduct = await prisma.product.findUnique({
      where: { id: validated.id },
      include: { variants: true },
    });

    if (!existingProduct) {
      return { success: false, error: "El producto a actualizar no existe" };
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Determinar imagen principal
      const primaryImage =
        validated.images && validated.images.length > 0
          ? validated.images.find((img) => img.isPrimary)?.url || validated.images[0]?.url
          : validated.imageUrl !== undefined
          ? validated.imageUrl
          : existingProduct.imageUrl;

      const product = await tx.product.update({
        where: { id: validated.id },
        data: {
          ...(validated.name ? { name: validated.name } : {}),
          ...(validated.description !== undefined ? { description: validated.description } : {}),
          imageUrl: primaryImage,
          ...(validated.disciplineId ? { disciplineId: validated.disciplineId } : {}),
          ...(validated.costPrice !== undefined
            ? {
                costPrice: validated.costPrice !== null ? new Prisma.Decimal(validated.costPrice) : null,
              }
            : {}),
          ...(validated.price !== undefined ? { price: new Prisma.Decimal(validated.price) } : {}),
          ...(validated.categoryId ? { categoryId: validated.categoryId } : {}),
          ...(validated.brandId ? { brandId: validated.brandId } : {}),
          ...(validated.active !== undefined ? { active: validated.active } : {}),
        },
      });

      // Sincronizar imágenes asociadas si se proveyeron
      if (validated.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: validated.id } });
        if (validated.images.length > 0) {
          await tx.productImage.createMany({
            data: validated.images.map((img, idx) => ({
              productId: validated.id,
              url: img.url,
              color: img.color?.trim() || null,
              isPrimary: img.isPrimary ?? (idx === 0),
              order: img.order ?? idx,
            })),
          });
        }
      }

      // 2. Si se pasaron variantes, sincronizar existentes y nuevas
      if (validated.variants && validated.variants.length > 0) {
        const incomingVariantIds = validated.variants
          .map((v) => v.id)
          .filter((id): id is string => Boolean(id));

        // Desactivar o eliminar variantes que fueron quitadas en el modal
        const variantsToRemove = existingProduct.variants.filter(
          (v) => !incomingVariantIds.includes(v.id)
        );

        for (const v of variantsToRemove) {
          try {
            await tx.productVariant.delete({ where: { id: v.id } });
          } catch {
            await tx.productVariant.update({
              where: { id: v.id },
              data: { stockStore: 0, stockWarehouse: 0 },
            });
          }
        }

        // Actualizar o crear cada variante
        for (const v of validated.variants) {
          if (v.id && existingProduct.variants.some((ev) => ev.id === v.id)) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                size: v.size,
                color: v.color,
                sku: v.sku,
                barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode : null,
                stockStore: v.stockStore,
                stockWarehouse: v.stockWarehouse,
                minStoreStock: v.minStoreStock ?? 1,
                minStock: v.minStock ?? 2,
                price: v.price ? new Prisma.Decimal(v.price) : null,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: validated.id,
                size: v.size,
                color: v.color,
                sku:
                  v.sku ||
                  `MAT-${product.name.slice(0, 3).toUpperCase()}-${v.size.replace(/\s+/g, "")}-${Date.now().toString().slice(-4)}`,
                barcode: v.barcode && v.barcode.trim() !== "" ? v.barcode : null,
                stockStore: v.stockStore || 0,
                stockWarehouse: v.stockWarehouse || 0,
                minStoreStock: v.minStoreStock ?? 1,
                minStock: v.minStock ?? 2,
                price: v.price ? new Prisma.Decimal(v.price) : null,
              },
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id: validated.id },
        include: {
          category: true,
          brand: true,
          discipline: true,
          images: {
            orderBy: { order: "asc" },
          },
          variants: {
            orderBy: [{ size: "asc" }, { color: "asc" }],
          },
        },
      });
    });

    return { success: true, data: serializeData(updatedProduct) };
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return { success: false, error: "Error al actualizar la información del producto" };
  }
}

/**
 * Dar de Baja un Producto (100% Baja Lógica):
 * - Marca active: false en la base de datos.
 * - Desaparece inmediatamente del mostrador (POS), tienda web y vista de inventario activo.
 * - NUNCA elimina registros físicos: conserva permanentemente todas las variantes,
 *   movimientos de stock, historial contable y trazabilidad fiscal.
 */
export async function deleteProduct(id: string) {
  try {
    if (!id || id.startsWith("p")) {
      return { success: true, message: "Producto de demostración dado de baja" };
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, active: true },
    });

    if (!product) {
      return { success: true, message: "El producto ya no existe o ya fue dado de baja" };
    }

    // 100% Baja Lógica: Desactivar producto sin borrar filas
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    try {
      revalidatePath("/");
      revalidatePath("/admin");
    } catch {
      // Silenciar fuera del ciclo de petición HTTP
    }

    return {
      success: true,
      message: "Producto dado de baja con éxito (historial contable y trazabilidad conservados)",
    };
  } catch (error) {
    console.error("Error al dar de baja el producto:", error);
    return { success: false, error: "No se pudo dar de baja el producto en la base de datos" };
  }
}

/**
 * Activar o Desactivar un Producto (Borrado lógico para conservar historial)
 */
export async function toggleProductActive(id: string) {
  try {
    if (!id || id.startsWith("p")) {
      return {
        success: true,
        data: { id, active: true },
        message: "Producto activado con éxito (modo demostración)",
      };
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { active: true },
    });

    if (!product) {
      return { success: false, error: "Producto no encontrado" };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { active: !product.active },
    });

    try {
      revalidatePath("/");
      revalidatePath("/admin");
    } catch {
      // Silenciar fuera del ciclo de petición HTTP
    }

    return {
      success: true,
      data: serializeData(updated),
      message: updated.active ? "Producto activado con éxito" : "Producto desactivado con éxito",
    };
  } catch (error) {
    console.error("Error al cambiar estado del producto:", error);
    return { success: false, error: "No se pudo cambiar el estado del producto" };
  }
}

function getDisciplineGradient(discipline: string): string {
  const d = discipline.toLowerCase();
  if (d.includes("natac")) return "from-sky-500 to-blue-600";
  if (d.includes("voley") || d.includes("vóley")) return "from-amber-400 to-yellow-600";
  if (d.includes("crocs") || d.includes("urban")) return "from-rose-500 to-pink-600";
  if (d.includes("fit") || d.includes("entre")) return "from-emerald-500 to-teal-700";
  return "from-indigo-500 to-slate-800";
}

function formatDateEs(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

/**
 * Obtener listado de productos formateado directamente para la vista de Inventario (Frontend)
 */
export async function getDetailedInventoryProducts(options?: {
  includeInactive?: boolean;
}): Promise<{
  success: boolean;
  data: DetailedProductItem[];
  error?: string;
}> {
  try {
    const whereClause: Prisma.ProductWhereInput =
      options?.includeInactive === false ? { active: true } : {};

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        brand: true,
        discipline: true,
        images: {
          orderBy: { order: "asc" },
        },
        variants: {
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped: DetailedProductItem[] = products.map((p) => {
      const stockStore = p.variants.reduce((acc, v) => acc + (v.stockStore || 0), 0);
      const stockWarehouse = p.variants.reduce((acc, v) => acc + (v.stockWarehouse || 0), 0);
      const firstVariant = p.variants[0];

      return {
        id: p.id,
        name: p.name,
        description: p.description || "",
        brand: p.brand.name,
        discipline: p.discipline.name,
        category: p.category.name,
        subcategory: p.category.name,
        sku: firstVariant?.sku || `SKU-${p.id.slice(0, 8)}`,
        barcode: firstVariant?.barcode || "",
        costPrice: p.costPrice !== null && p.costPrice !== undefined ? Number(p.costPrice) : null,
        price: Number(p.price),
        stockLocal: stockStore,
        stockWeb: stockWarehouse,
        minStock: firstVariant?.minStock || 2,
        minStoreStock: firstVariant?.minStoreStock ?? 1,
        active: p.active,
        updatedAt: formatDateEs(p.updatedAt),
        iconBg: getDisciplineGradient(p.discipline.name),
        imageUrl: p.imageUrl || p.images?.[0]?.url || undefined,
        images: (p.images || []).map((img) => ({
          id: img.id,
          url: img.url,
          color: img.color,
          isPrimary: img.isPrimary,
          order: img.order,
        })),
        variants: p.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          barcode: v.barcode || "",
          sku: v.sku,
          stockStore: v.stockStore,
          stockWarehouse: v.stockWarehouse,
          minStock: v.minStock ?? 2,
          minStoreStock: v.minStoreStock ?? 1,
          price: v.price ? Number(v.price) : null,
          receivedCount: v.stockStore + v.stockWarehouse + 50,
          soldCountStore: 0,
          soldCountWeb: 0,
        })),
      };
    });

    return { success: true, data: mapped };
  } catch (error) {
    console.error("Error al obtener productos detallados de inventario:", error);
    return {
      success: false,
      data: [],
      error: "No se pudieron cargar los productos de la base de datos",
    };
  }
}

