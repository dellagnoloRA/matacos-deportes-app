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
 * Convierte datos a tipos planos JSON seguros para Server Actions
 */
function serializeData<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return Number(value);
      }
      return value;
    })
  );
}

// Catálogos base de contingencia para Matacos Deportes
const FALLBACK_DISCIPLINES = [
  { id: "4c6104ed-ce52-4e40-9faf-3a0d63bc38d1", name: "Natación", slug: "natacion" },
  { id: "8299b5d3-1b9e-4cf0-b844-99c0197dc795", name: "Vóley", slug: "voley" },
  { id: "17a3731d-3c7f-440b-86d2-29200a3e492b", name: "Crocs", slug: "crocs" },
  { id: "5b5221f3-50bb-42c1-8828-a8d367271a11", name: "Fitness y Entrenamiento", slug: "fitness" },
  { id: "886a12ef-c7b0-46a9-98ec-c982aefd3be8", name: "Indumentaria", slug: "indumentaria" },
  { id: "694188c6-c3af-44a8-8c29-1c54ab0c41d3", name: "Running / Urbano", slug: "running-urbano" },
];

const FALLBACK_CATEGORIES = [
  { id: "6e433d59-c835-46bb-a1ff-349de1273efb", name: "Accesorios", slug: "accesorios" },
  { id: "9fcbeccd-19ef-4f0c-85f6-cd330fc8802e", name: "Antiparras", slug: "antiparras" },
  { id: "c18c6b05-ac11-47b1-9cdf-fff98fa3809c", name: "Calzado", slug: "calzado" },
  { id: "28137e9f-4a96-4477-b493-a15ca7b115e7", name: "Calzado Deportivo Pro", slug: "calzado-deportivo-pro" },
  { id: "f434a595-61d3-4262-bc35-d2f535b2eea1", name: "Indumentaria Acuática", slug: "indumentaria-acuatica" },
  { id: "75137a7f-1707-4044-abd1-f02ba12e56c3", name: "Mallas", slug: "mallas" },
  { id: "013582b2-9c8e-4b12-96ba-59e14ce5d64a", name: "Pelotas", slug: "pelotas" },
];

const FALLBACK_BRANDS = [
  { id: "147dd489-f612-4ea7-810f-4a113bf9f4dd", name: "Arena", slug: "arena" },
  { id: "7a0dbba7-81cc-44cc-93b0-03d720e1b791", name: "Asics", slug: "asics" },
  { id: "f9ce76a2-d5fd-4395-831f-a55b381c768b", name: "Crocs", slug: "crocs" },
  { id: "1ce1acea-2db2-49d3-b8d0-db8d8d3e7538", name: "Matacos", slug: "matacos" },
  { id: "232be347-cd60-4ab9-afb6-fb3446fe84b2", name: "Mikasa", slug: "mikasa" },
  { id: "df203559-e8bd-44b3-9dff-f9960ede4603", name: "Puma Sports", slug: "puma-sports" },
  { id: "af670b4e-9274-4fe7-bd9c-68684a310a44", name: "Speedo", slug: "speedo" },
  { id: "cc4e9b61-9e99-41bd-aade-b651004f31c8", name: "Topper", slug: "topper" },
  { id: "5df93ed1-3c34-4614-b129-e2f583c56159", name: "Wilson", slug: "wilson" },
];

/**
 * Obtener todas las disciplinas ordenadas alfabéticamente
 */
export async function getDisciplines() {
  try {
    const disciplines = await prisma.discipline.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    if (disciplines && disciplines.length > 0) {
      return { success: true, data: serializeData(disciplines) };
    }
    return { success: true, data: FALLBACK_DISCIPLINES };
  } catch (error) {
    console.error("Error al obtener disciplinas:", error);
    return { success: true, data: FALLBACK_DISCIPLINES };
  }
}

/**
 * Obtener todas las categorías ordenadas alfabéticamente
 */
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    if (categories && categories.length > 0) {
      return { success: true, data: serializeData(categories) };
    }
    return { success: true, data: FALLBACK_CATEGORIES };
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return { success: true, data: FALLBACK_CATEGORIES };
  }
}

/**
 * Obtener todas las marcas ordenadas alfabéticamente
 */
export async function getBrands() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    if (brands && brands.length > 0) {
      return { success: true, data: serializeData(brands) };
    }
    return { success: true, data: FALLBACK_BRANDS };
  } catch (error) {
    console.error("Error al obtener marcas:", error);
    return { success: true, data: FALLBACK_BRANDS };
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

    return { success: true, data: serializeData(discipline) };
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

    return { success: true, data: serializeData(category) };
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

    return { success: true, data: serializeData(brand) };
  } catch (error) {
    console.error("Error al crear marca:", error);
    return { success: false, error: "Error al validar o crear la marca" };
  }
}
