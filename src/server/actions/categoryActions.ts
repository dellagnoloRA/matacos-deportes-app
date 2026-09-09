"use server";

import { prisma } from "@/lib/prisma";
import {
  CategorySchema,
  BrandSchema,
  DisciplineSchema,
  ColorSchema,
  CategoryInput,
  BrandInput,
  DisciplineInput,
  ColorInput,
} from "@/schemas/product";
import { slugify, toCanonicalTitle } from "@/lib/textUtils";
import fs from "fs";
import path from "path";

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

// Ruta al archivo de almacenamiento de paleta de colores de catálogo
const COLOR_PALETTE_PATH = path.join(process.cwd(), "src/data/colorPalette.json");

function readColorPalette(): Array<{ id: string; name: string; hexCode: string }> {
  try {
    if (fs.existsSync(COLOR_PALETTE_PATH)) {
      const raw = fs.readFileSync(COLOR_PALETTE_PATH, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error al leer colorPalette.json:", err);
  }
  return [
    { id: "color-negro", name: "Negro", hexCode: "#0f172a" },
    { id: "color-blanco", name: "Blanco", hexCode: "#ffffff" },
    { id: "color-azul", name: "Azul", hexCode: "#1d4ed8" },
    { id: "color-rojo", name: "Rojo", hexCode: "#dc2626" },
  ];
}

function saveColorPalette(colors: Array<{ id: string; name: string; hexCode: string }>) {
  try {
    const dir = path.dirname(COLOR_PALETTE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(COLOR_PALETTE_PATH, JSON.stringify(colors, null, 2), "utf8");
  } catch (err) {
    console.error("Error al guardar colorPalette.json:", err);
  }
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

// =========================================================================
// 1. DISCIPLINAS (CRUD)
// =========================================================================

export async function getDisciplines() {
  try {
    const disciplines = await prisma.discipline.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
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

export async function getDisciplinesWithStats() {
  try {
    const disciplines = await prisma.discipline.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return { success: true, data: serializeData(disciplines) };
  } catch (error) {
    console.error("Error al obtener disciplinas con estadísticas:", error);
    return {
      success: true,
      data: FALLBACK_DISCIPLINES.map((d) => ({ ...d, _count: { products: 0 } })),
    };
  }
}

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
      data: { name: canonicalName, slug },
    });

    return { success: true, data: serializeData(discipline) };
  } catch (error) {
    console.error("Error al crear disciplina:", error);
    return { success: false, error: "Error al validar o crear la disciplina" };
  }
}

export async function updateDiscipline(id: string, input: DisciplineInput) {
  try {
    const validated = DisciplineSchema.parse(input);
    const slug = validated.slug || slugify(validated.name);
    const canonicalName = toCanonicalTitle(validated.name);

    const existing = await prisma.discipline.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [{ name: { equals: canonicalName, mode: "insensitive" } }, { slug }],
          },
        ],
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe otra disciplina con ese nombre o slug" };
    }

    const updated = await prisma.discipline.update({
      where: { id },
      data: { name: canonicalName, slug },
    });

    return { success: true, data: serializeData(updated) };
  } catch (error) {
    console.error("Error al actualizar disciplina:", error);
    return { success: false, error: "Error al actualizar la disciplina" };
  }
}

export async function deleteDiscipline(id: string) {
  try {
    const productCount = await prisma.product.count({
      where: { disciplineId: id },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: tiene ${productCount} producto(s) asociado(s). Reasigne o elimine los productos primero.`,
      };
    }

    await prisma.discipline.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar disciplina:", error);
    return { success: false, error: "Error al eliminar la disciplina" };
  }
}

// =========================================================================
// 2. CATEGORÍAS (CRUD)
// =========================================================================

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
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

export async function getCategoriesWithStats() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return { success: true, data: serializeData(categories) };
  } catch (error) {
    console.error("Error al obtener categorías con estadísticas:", error);
    return {
      success: true,
      data: FALLBACK_CATEGORIES.map((c) => ({ ...c, _count: { products: 0 } })),
    };
  }
}

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
      data: { name: canonicalName, slug },
    });

    return { success: true, data: serializeData(category) };
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return { success: false, error: "Error al validar o crear la categoría" };
  }
}

export async function updateCategory(id: string, input: CategoryInput) {
  try {
    const validated = CategorySchema.parse(input);
    const slug = validated.slug || slugify(validated.name);
    const canonicalName = toCanonicalTitle(validated.name);

    const existing = await prisma.category.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [{ name: { equals: canonicalName, mode: "insensitive" } }, { slug }],
          },
        ],
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe otra categoría con ese nombre o slug" };
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name: canonicalName, slug },
    });

    return { success: true, data: serializeData(updated) };
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return { success: false, error: "Error al actualizar la categoría" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: tiene ${productCount} producto(s) asociado(s). Reasigne o elimine los productos primero.`,
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return { success: false, error: "Error al eliminar la categoría" };
  }
}

// =========================================================================
// 3. MARCAS (CRUD)
// =========================================================================

export async function getBrands() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
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

export async function getBrandsWithStats() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return { success: true, data: serializeData(brands) };
  } catch (error) {
    console.error("Error al obtener marcas con estadísticas:", error);
    return {
      success: true,
      data: FALLBACK_BRANDS.map((b) => ({ ...b, _count: { products: 0 } })),
    };
  }
}

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
      data: { name: canonicalName, slug },
    });

    return { success: true, data: serializeData(brand) };
  } catch (error) {
    console.error("Error al crear marca:", error);
    return { success: false, error: "Error al validar o crear la marca" };
  }
}

export async function updateBrand(id: string, input: BrandInput) {
  try {
    const validated = BrandSchema.parse(input);
    const slug = validated.slug || slugify(validated.name);
    const canonicalName = toCanonicalTitle(validated.name);

    const existing = await prisma.brand.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [{ name: { equals: canonicalName, mode: "insensitive" } }, { slug }],
          },
        ],
      },
    });

    if (existing) {
      return { success: false, error: "Ya existe otra marca con ese nombre o slug" };
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: { name: canonicalName, slug },
    });

    return { success: true, data: serializeData(updated) };
  } catch (error) {
    console.error("Error al actualizar marca:", error);
    return { success: false, error: "Error al actualizar la marca" };
  }
}

export async function deleteBrand(id: string) {
  try {
    const productCount = await prisma.product.count({
      where: { brandId: id },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: tiene ${productCount} producto(s) asociado(s). Reasigne o elimine los productos primero.`,
      };
    }

    await prisma.brand.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar marca:", error);
    return { success: false, error: "Error al eliminar la marca" };
  }
}

// =========================================================================
// 4. COLORES (ATRIBUTO DE VARIANTES EN BD)
// =========================================================================

export async function getColorsWithStats() {
  try {
    const palette = readColorPalette();

    // Obtener los colores reales en uso en ProductVariant de la BD
    const dbColors = await prisma.productVariant.groupBy({
      by: ["color"],
      _count: {
        _all: true,
      },
    });

    const countMap = new Map<string, number>();
    for (const item of dbColors) {
      if (item.color) {
        countMap.set(item.color.trim().toLowerCase(), item._count._all);
      }
    }

    // Unir los de la paleta con los de la base de datos
    const result = palette.map((c) => {
      const count = countMap.get(c.name.trim().toLowerCase()) || 0;
      return {
        id: c.id,
        name: c.name,
        hexCode: c.hexCode || "#10b981",
        _count: { variants: count },
      };
    });

    // Agregar colores de la BD que no estuvieran en la paleta inicial
    const existingNames = new Set(palette.map((c) => c.name.trim().toLowerCase()));
    for (const item of dbColors) {
      const trimmed = item.color ? item.color.trim() : "";
      if (trimmed && !existingNames.has(trimmed.toLowerCase())) {
        result.push({
          id: `color-${slugify(trimmed)}`,
          name: trimmed,
          hexCode: "#64748b",
          _count: { variants: item._count._all },
        });
      }
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    return { success: true, data: serializeData(result) };
  } catch (error) {
    console.error("Error al obtener colores con estadísticas:", error);
    const palette = readColorPalette();
    return {
      success: true,
      data: palette.map((c) => ({ ...c, _count: { variants: 0 } })),
    };
  }
}

export async function createColor(input: ColorInput) {
  try {
    const validated = ColorSchema.parse(input);
    const canonicalName = toCanonicalTitle(validated.name);
    const palette = readColorPalette();

    const exists = palette.some(
      (c) => c.name.toLowerCase() === canonicalName.toLowerCase()
    );
    if (exists) {
      return { success: false, error: "Ya existe un color registrado con ese nombre" };
    }

    const newColor = {
      id: `color-${slugify(canonicalName)}-${Date.now()}`,
      name: canonicalName,
      hexCode: validated.hexCode || "#10b981",
    };

    palette.push(newColor);
    saveColorPalette(palette);

    return { success: true, data: serializeData(newColor) };
  } catch (error) {
    console.error("Error al crear color:", error);
    return { success: false, error: "Error al validar o crear el color" };
  }
}

export async function updateColor(id: string, input: ColorInput) {
  try {
    const validated = ColorSchema.parse(input);
    const canonicalName = toCanonicalTitle(validated.name);
    const palette = readColorPalette();

    const colorIdx = palette.findIndex((c) => c.id === id);
    if (colorIdx === -1) {
      return { success: false, error: "Color no encontrado" };
    }

    const oldName = palette[colorIdx].name;

    // Verificar colisión con otro color
    const duplicate = palette.some(
      (c, idx) => idx !== colorIdx && c.name.toLowerCase() === canonicalName.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: "Ya existe otro color con ese nombre" };
    }

    palette[colorIdx] = {
      ...palette[colorIdx],
      name: canonicalName,
      hexCode: validated.hexCode || palette[colorIdx].hexCode,
    };
    saveColorPalette(palette);

    // Si cambió el nombre, actualizar en cascada en las variantes de la base de datos
    if (oldName !== canonicalName) {
      await prisma.productVariant.updateMany({
        where: { color: oldName },
        data: { color: canonicalName },
      });
    }

    return { success: true, data: serializeData(palette[colorIdx]) };
  } catch (error) {
    console.error("Error al actualizar color:", error);
    return { success: false, error: "Error al actualizar el color" };
  }
}

export async function deleteColor(id: string) {
  try {
    const palette = readColorPalette();
    const colorItem = palette.find((c) => c.id === id);

    if (!colorItem) {
      return { success: false, error: "Color no encontrado" };
    }

    // Verificar si hay variantes que usan este color
    const variantsCount = await prisma.productVariant.count({
      where: { color: colorItem.name },
    });

    if (variantsCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar: hay ${variantsCount} variante(s) de productos con el color "${colorItem.name}". Modifíquelas antes de eliminarlo.`,
      };
    }

    const filtered = palette.filter((c) => c.id !== id);
    saveColorPalette(filtered);

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar color:", error);
    return { success: false, error: "Error al eliminar el color" };
  }
}
