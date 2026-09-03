"use server";

import { prisma } from "@/lib/prisma";
import {
  CategorySchema,
  BrandSchema,
  DisciplineSchema,
  CategoryInput,
  BrandInput,
  DisciplineInput,
} from "@/schemas/product";
import { slugify, toCanonicalTitle } from "@/lib/textUtils";

/**
 * Obtener todas las disciplinas ordenadas alfabéticamente
 */
export async function getDisciplines() {
  try {
    const disciplines = await prisma.discipline.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return { success: true, data: disciplines };
  } catch (error) {
    console.error("Error al obtener disciplinas:", error);
    return { success: false, error: "No se pudieron cargar las disciplinas" };
  }
}

/**
 * Obtener todas las categorías ordenadas alfabéticamente
 */
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
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
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return { success: true, data: brands };
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return { success: false, error: "No se pudieron cargar las marcas" };
  }
}

/**
 * Crear una nueva disciplina
 */
export async function createDiscipline(input: DisciplineInput) {
  try {
    const validated = DisciplineSchema.parse(input);
    const slug = validated.slug || slugify(validated.name);
    const canonicalName = toCanonicalTitle(validated.name);

    const existingDiscipline = await prisma.discipline.findFirst({
      where: {
        OR: [{ name: { equals: canonicalName, mode: "insensitive" } }, { slug }],
      },
    });

    if (existingDiscipline) {
      return { success: false, error: "Ya existe una disciplina con ese nombre o slug" };
    }

    const discipline = await prisma.discipline.create({
      data: {
        name: canonicalName,
        slug,
      },
    });

    return { success: true, data: discipline };
  } catch (error) {
    console.error("Error al crear disciplina:", error);
    return { success: false, error: "Error al validar o crear la disciplina" };
  }
}

/**
 * Crear una nueva categoría
 */
export async function createCategory(input: CategoryInput) {
  try {
    const validated = CategorySchema.parse(input);
    const slug = validated.slug || slugify(validated.name);
    const canonicalName = toCanonicalTitle(validated.name);

    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: { equals: canonicalName, mode: "insensitive" } }, { slug }],
      },
    });

    if (existingCategory) {
      return { success: false, error: "Ya existe una categoría con ese nombre o slug" };
    }

    const category = await prisma.category.create({
      data: {
        name: canonicalName,
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
    const slug = validated.slug || slugify(validated.name);
    const canonicalName = toCanonicalTitle(validated.name);

    const existingBrand = await prisma.brand.findFirst({
      where: {
        OR: [{ name: { equals: canonicalName, mode: "insensitive" } }, { slug }],
      },
    });

    if (existingBrand) {
      return { success: false, error: "Ya existe una marca con ese nombre o slug" };
    }

    const brand = await prisma.brand.create({
      data: {
        name: canonicalName,
        slug,
      },
    });

    return { success: true, data: brand };
  } catch (error) {
    console.error("Error al crear marca:", error);
    return { success: false, error: "Error al validar o crear la marca" };
  }
}
