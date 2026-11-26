"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTaxonomies() {
  try {
    const [categories, brands, disciplines] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          subcategories: {
            orderBy: { name: "asc" },
          },
        },
      }),
      prisma.brand.findMany({ orderBy: { name: "asc" } }),
      prisma.discipline.findMany({ orderBy: { name: "asc" } }),
    ]);

    return {
      success: true,
      data: {
        categories,
        brands,
        disciplines,
      },
    };
  } catch (error) {
    console.error("Error al obtener taxonomías:", error);
    return {
      success: false,
      error: "No se pudieron obtener las categorías, marcas y disciplinas.",
    };
  }
}

export async function createQuickBrand(name: string) {
  try {
    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name: cleanName },
      create: { name: cleanName, slug },
    });

    revalidatePath("/admin");
    return { success: true, data: brand };
  } catch (error) {
    console.error("Error al crear marca:", error);
    return { success: false, error: "No se pudo crear la marca" };
  }
}

export async function createQuickCategory(name: string) {
  try {
    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: cleanName },
      create: { name: cleanName, slug },
    });

    revalidatePath("/admin");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return { success: false, error: "No se pudo crear la categoría" };
  }
}

export async function createQuickSubcategory(categoryId: string, name: string) {
  try {
    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const subcategory = await prisma.subcategory.upsert({
      where: {
        categoryId_slug: {
          categoryId,
          slug,
        },
      },
      update: { name: cleanName },
      create: { categoryId, name: cleanName, slug },
    });

    revalidatePath("/admin");
    return { success: true, data: subcategory };
  } catch (error) {
    console.error("Error al crear subcategoría:", error);
    return { success: false, error: "No se pudo crear la subcategoría" };
  }
}

export async function createQuickDiscipline(name: string) {
  try {
    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const discipline = await prisma.discipline.upsert({
      where: { slug },
      update: { name: cleanName },
      create: { name: cleanName, slug },
    });

    revalidatePath("/admin");
    return { success: true, data: discipline };
  } catch (error) {
    console.error("Error al crear disciplina:", error);
    return { success: false, error: "No se pudo crear la disciplina" };
  }
}
