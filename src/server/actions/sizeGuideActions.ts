"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface SizeGuideData {
  id?: string;
  name: string;
  brandId?: string | null;
  gender: string;
  type: string;
  unit: string;
  fitNote?: string | null;
  columns: string[];
  rows: Record<string, string>[];
  guideImage?: string | null;
}

const DEFAULT_TEMPLATES: SizeGuideData[] = [
  {
    name: "Calzado Deportivo Adulto (Estándar)",
    gender: "UNISEX",
    type: "CALZADO",
    unit: "cm",
    fitNote: "Calce regular estándar. Medí desde el talón hasta la punta del dedo más largo sobre una hoja de papel.",
    columns: ["Talle AR", "US", "UK", "EU", "Largo Pie (cm)"],
    rows: [
      { "Talle AR": "38", "US": "6.0", "UK": "5.5", "EU": "39", "Largo Pie (cm)": "24.5" },
      { "Talle AR": "39", "US": "7.0", "UK": "6.0", "EU": "40", "Largo Pie (cm)": "25.0" },
      { "Talle AR": "40", "US": "7.5", "UK": "6.5", "EU": "40.5", "Largo Pie (cm)": "25.5" },
      { "Talle AR": "41", "US": "8.5", "UK": "7.5", "EU": "42", "Largo Pie (cm)": "26.5" },
      { "Talle AR": "42", "US": "9.0", "UK": "8.0", "EU": "42.5", "Largo Pie (cm)": "27.0" },
      { "Talle AR": "43", "US": "10.0", "UK": "9.0", "EU": "44", "Largo Pie (cm)": "28.0" },
      { "Talle AR": "44", "US": "10.5", "UK": "9.5", "EU": "44.5", "Largo Pie (cm)": "28.5" },
      { "Talle AR": "45", "US": "11.5", "UK": "10.5", "EU": "45.5", "Largo Pie (cm)": "29.5" },
    ],
  },
  {
    name: "Remeras y Tops Deportivos",
    gender: "UNISEX",
    type: "PRENDA_SUPERIOR",
    unit: "cm",
    fitNote: "Corte semi-ajustado atlético. Si preferís calce más holgado, elegí un talle más.",
    columns: ["Talle", "Pecho (cm)", "Cintura (cm)", "Cadera (cm)", "Largo (cm)"],
    rows: [
      { "Talle": "S", "Pecho (cm)": "88-94", "Cintura (cm)": "76-82", "Cadera (cm)": "88-94", "Largo (cm)": "69" },
      { "Talle": "M", "Pecho (cm)": "95-102", "Cintura (cm)": "83-90", "Cadera (cm)": "95-102", "Largo (cm)": "71" },
      { "Talle": "L", "Pecho (cm)": "103-110", "Cintura (cm)": "91-98", "Cadera (cm)": "103-110", "Largo (cm)": "73" },
      { "Talle": "XL", "Pecho (cm)": "111-118", "Cintura (cm)": "99-106", "Cadera (cm)": "111-118", "Largo (cm)": "75" },
      { "Talle": "XXL", "Pecho (cm)": "119-126", "Cintura (cm)": "107-114", "Cadera (cm)": "119-126", "Largo (cm)": "77" },
    ],
  },
  {
    name: "Pantalones, Calzas y Shorts",
    gender: "UNISEX",
    type: "PRENDA_INFERIOR",
    unit: "cm",
    fitNote: "Cintura elástica con cordón de ajuste interior.",
    columns: ["Talle", "Cintura (cm)", "Cadera (cm)", "Largo Pierna (cm)"],
    rows: [
      { "Talle": "S", "Cintura (cm)": "76-82", "Cadera (cm)": "88-94", "Largo Pierna (cm)": "98" },
      { "Talle": "M", "Cintura (cm)": "83-90", "Cadera (cm)": "95-102", "Largo Pierna (cm)": "100" },
      { "Talle": "L", "Cintura (cm)": "91-98", "Cadera (cm)": "103-110", "Largo Pierna (cm)": "102" },
      { "Talle": "XL", "Cintura (cm)": "99-106", "Cadera (cm)": "111-118", "Largo Pierna (cm)": "104" },
      { "Talle": "XXL", "Cintura (cm)": "107-114", "Cadera (cm)": "119-126", "Largo Pierna (cm)": "106" },
    ],
  },
];

/**
 * Obtener todas las guías de talles de la base de datos (con auto-seed si está vacía)
 */
export async function getSizeGuides() {
  try {
    let guides = await prisma.sizeGuide.findMany({
      orderBy: { createdAt: "desc" },
      include: { brand: true },
    });

    if (guides.length === 0) {
      for (const tpl of DEFAULT_TEMPLATES) {
        await prisma.sizeGuide.create({
          data: {
            name: tpl.name,
            gender: tpl.gender,
            type: tpl.type,
            unit: tpl.unit,
            fitNote: tpl.fitNote,
            columns: tpl.columns,
            rows: tpl.rows,
          },
        });
      }

      guides = await prisma.sizeGuide.findMany({
        orderBy: { createdAt: "desc" },
        include: { brand: true },
      });
    }

    return {
      success: true,
      data: guides.map((g) => ({
        id: g.id,
        name: g.name,
        brandId: g.brandId,
        brandName: g.brand?.name || null,
        gender: g.gender,
        type: g.type,
        unit: g.unit,
        fitNote: g.fitNote,
        columns: (g.columns as string[]) || [],
        rows: (g.rows as Record<string, string>[]) || [],
        guideImage: g.guideImage,
      })),
    };
  } catch (error) {
    console.error("Error al obtener guías de talles:", error);
    return { success: false, error: "No se pudieron obtener las guías de talles" };
  }
}

/**
 * Crear una nueva guía de talles reutilizable
 */
export async function createSizeGuide(data: SizeGuideData) {
  try {
    const guide = await prisma.sizeGuide.create({
      data: {
        name: data.name.trim(),
        brandId: data.brandId || null,
        gender: data.gender || "UNISEX",
        type: data.type || "CALZADO",
        unit: data.unit || "cm",
        fitNote: data.fitNote?.trim() || null,
        columns: data.columns,
        rows: data.rows,
        guideImage: data.guideImage || null,
      },
    });

    revalidatePath("/admin");
    return { success: true, data: guide };
  } catch (error) {
    console.error("Error al crear guía de talles:", error);
    return { success: false, error: "Error al guardar la guía de talles en la base de datos" };
  }
}
