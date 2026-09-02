"use server";

import { prisma } from "@/lib/prisma";
import { CategorySchema, BrandSchema, CategoryInput, BrandInput } from "@/schemas/product";

/**
 * Obtener todas las categorías ordenadas alfabéticamente
 */
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return { success: false, error: "No se pudieron cargar las categorías" };
  }
}

/**
 * Obtener todas las marcas ordenadas alfabéticamente
 */
export async function getBrands() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: brands };
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return { success: false, error: "No se pudieron cargar las marcas" };
  }
}

/**
 * Crear una nueva categoría
 */
export async function createCategory(input: CategoryInput) {
  try {
    const validated = CategorySchema.parse(input);
    const slug = validated.slug || validated.name.toLowerCase().trim().replace(/\s+/g, "-");

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: { equals: validated.name, mode: "insensitive" } }, { slug }],
      },
    });

    if (existingCategory) {
      return { success: false, error: "Ya existe una categoría con ese nombre o slug" };
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        slug,
      },
    });

    return { success: true, data: category };
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return { success: false, error: "Error al validar o crear la categoría" };
  }
}

/**
 * Crear una nueva marca
 */
export async function createBrand(input: BrandInput) {
  try {
    const validated = BrandSchema.parse(input);

    const existingBrand = await prisma.brand.findFirst({
      where: { name: { equals: validated.name, mode: "insensitive" } },
    });

    if (existingBrand) {
      return { success: false, error: "Ya existe una marca con ese nombre" };
    }

    const brand = await prisma.brand.create({
      data: {
        name: validated.name,
      },
    });

    return { success: true, data: brand };
  } catch (error) {
    console.error("Error al crear marca:", error);
    return { success: false, error: "Error al validar o crear la marca" };
  }
}
