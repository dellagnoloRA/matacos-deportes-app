"use server";

import { prisma } from "@/lib/prisma";
import {
  CreateProductSchema,
  UpdateProductSchema,
  CreateProductInput,
  UpdateProductInput,
} from "@/schemas/product";
import { Prisma } from "@prisma/client";

export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  brandId?: string;
  discipline?: string;
  activeOnly?: boolean;
}

/**
 * Obtener listado de productos con variantes, categoría y marca (soporta filtros y búsqueda)
 */
export async function getProducts(options: ProductFilterOptions = {}) {
  try {
    const { search, categoryId, brandId, discipline, activeOnly = true } = options;

    const whereClause: Prisma.ProductWhereInput = {
      ...(activeOnly ? { active: true } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {}),
      ...(discipline ? { discipline: { equals: discipline, mode: "insensitive" } } : {}),
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
        variants: {
          orderBy: [{ size: "asc" }, { color: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: products };
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

    return { success: true, data: product };
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
      const product = await tx.product.create({
        data: {
          name: validated.name,
          description: validated.description ?? null,
          discipline: validated.discipline,
          costPrice: new Prisma.Decimal(validated.costPrice),
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
              stockLocal: v.stockLocal,
              stockWeb: v.stockWeb,
              minStock: v.minStock,
              price: v.price ? new Prisma.Decimal(v.price) : null,
            })),
          },
        },
        include: {
          variants: true,
          category: true,
          brand: true,
        },
      });

      // Crear movimientos iniciales de inventario si hay stock ingresado
      for (const variant of product.variants) {
        const totalInitialStock = variant.stockLocal + variant.stockWeb;
        if (totalInitialStock > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "INGRESO_INICIAL",
              quantity: totalInitialStock,
              stockAfter: totalInitialStock,
              reason: "Stock inicial al dar de alta el producto",
            },
          });
        }
      }

      return product;
    });

    return { success: true, data: newProduct };
  } catch (error) {
    console.error("Error al crear producto:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Ocurrió un error inesperado al crear el producto" };
  }
}

/**
 * Actualizar un Producto existente y sus variantes
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
      // Actualizar datos base del producto
      const product = await tx.product.update({
        where: { id: validated.id },
        data: {
          ...(validated.name ? { name: validated.name } : {}),
          ...(validated.description !== undefined ? { description: validated.description } : {}),
          ...(validated.discipline ? { discipline: validated.discipline } : {}),
          ...(validated.costPrice !== undefined ? { costPrice: new Prisma.Decimal(validated.costPrice) } : {}),
          ...(validated.price !== undefined ? { price: new Prisma.Decimal(validated.price) } : {}),
          ...(validated.categoryId ? { categoryId: validated.categoryId } : {}),
          ...(validated.brandId ? { brandId: validated.brandId } : {}),
          ...(validated.active !== undefined ? { active: validated.active } : {}),
        },
        include: {
          category: true,
          brand: true,
          variants: true,
        },
      });

      return product;
    });

    return { success: true, data: updatedProduct };
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return { success: false, error: "Error al actualizar la información del producto" };
  }
}

/**
 * Activar o Desactivar un Producto (Borrado lógico para conservar historial)
 */
export async function toggleProductActive(id: string) {
  try {
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

    return {
      success: true,
      data: updated,
      message: updated.active ? "Producto activado con éxito" : "Producto desactivado con éxito",
    };
  } catch (error) {
    console.error("Error al cambiar estado del producto:", error);
    return { success: false, error: "No se pudo cambiar el estado del producto" };
  }
}
