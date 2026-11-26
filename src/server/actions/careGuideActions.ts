"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CareIconKey =
  | "wash_cold"
  | "no_bleach"
  | "tumble_low"
  | "no_dry_clean"
  | "iron_low"
  | "hand_wash"
  | "shade_dry"
  | "wipe_clean"
  | "rinse_cold"
  | "no_heat";

export interface CareInstructionItem {
  icon?: CareIconKey | string;
  text: string;
}

export interface CareGuideData {
  id?: string;
  name: string;
  type: string;
  summary?: string | null;
  instructions: CareInstructionItem[];
  warning?: string | null;
}

const DEFAULT_CARE_TEMPLATES: CareGuideData[] = [
  {
    name: "Indumentaria Deportiva y Dry-Fit",
    type: "INDUMENTARIA",
    summary:
      "Cuidados recomendados para prendas técnicas de poliéster, elastano o algodón deportivo.",
    instructions: [
      { icon: "wash_cold", text: "Lavar a máquina con agua fría (máximo 30°C) y del revés." },
      { icon: "no_bleach", text: "No usar blanqueador, lavandina ni quitamanchas agresivos." },
      { icon: "no_dry_clean", text: "No lavar en seco ni usar suavizante textil (tapa los poros transpirables)." },
      { icon: "iron_low", text: "Planchar a temperatura baja evitando estampas termoselladas o logos." },
      { icon: "tumble_low", text: "Secar a la sombra o en secadora a temperatura mínima." },
    ],
    warning: "Retirar rápidamente del lavarropas al finalizar el ciclo para evitar arrugas permanentes.",
  },
  {
    name: "Natación y Mallas Anti-cloro",
    type: "NATACION",
    summary:
      "Mantenimiento específico para trajes de baño de competición, entrenamiento y fibras resistentes al cloro.",
    instructions: [
      { icon: "rinse_cold", text: "Enjuagar inmediatamente con agua fría limpia al salir de la pileta." },
      { icon: "hand_wash", text: "Lavar a mano con jabón neutro sin retorcer la prenda." },
      { icon: "no_bleach", text: "No usar detergentes fuertes, suavizantes ni lavandina." },
      { icon: "shade_dry", text: "Secar extendida a la sombra; nunca colgar al sol directo ni sobre radiadores." },
    ],
    warning: "No dejar el traje de baño húmedo enrollado en la toalla o mochila por tiempo prolongado.",
  },
  {
    name: "Calzado Deportivo y Running",
    type: "CALZADO",
    summary:
      "Limpieza segura para zapatillas de malla transpirable, sintéticos y suelas con amortiguación.",
    instructions: [
      { icon: "wipe_clean", text: "Limpiar con paño húmedo o cepillo de cerdas suaves y jabón neutro." },
      { icon: "no_bleach", text: "No sumergir en lavarropas ni usar solventes o blanqueadores." },
      { icon: "shade_dry", text: "Retirar las plantillas y secar al aire libre en lugar ventilado y a la sombra." },
    ],
    warning: "Evitar secar cerca de estufas o al sol fuerte para no dañar los adhesivos ni la espuma de la mediasuela.",
  },
  {
    name: "Crocs y Compuesto Croslite™",
    type: "CROCS",
    summary:
      "Cuidado específico para zuecos, sandalias y calzado fabricado en resina Croslite™.",
    instructions: [
      { icon: "wipe_clean", text: "Lavar únicamente con agua fría o tibia y jabón neutro usando un paño suave." },
      { icon: "no_heat", text: "No exponer al sol directo prolongado, dentro del auto cerrado ni fuentes de calor." },
      { icon: "shade_dry", text: "Dejar escurrir y secar naturalmente a la sombra." },
    ],
    warning: "Las temperaturas elevadas pueden encoger o deformar el material Croslite™.",
  },
  {
    name: "Equipamiento, Pelotas y Accesorios",
    type: "ACCESORIO",
    summary:
      "Recomendaciones generales para antiparras, pelotas, colchonetas, mochilas y accesorios de entrenamiento.",
    instructions: [
      { icon: "wipe_clean", text: "Limpiar la superficie con un paño limpio ligeramente húmedo tras cada uso." },
      { icon: "shade_dry", text: "Dejar secar por completo antes de guardar para prevenir humedad y olores." },
      { icon: "no_heat", text: "Almacenar en ambiente fresco y seco, lejos de la luz solar directa." },
    ],
    warning: "En antiparras de natación, no frotar el interior del lente para no remover el tratamiento antivaho.",
  },
];

function parseInstructions(raw: unknown): CareInstructionItem[] {
  if (!Array.isArray(raw)) return [];
  const items: CareInstructionItem[] = [];
  for (const entry of raw) {
    if (typeof entry === "string" && entry.trim()) {
      items.push({ text: entry.trim() });
    } else if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const rec = entry as Record<string, unknown>;
      const text = typeof rec.text === "string" ? rec.text.trim() : "";
      if (text) {
        items.push({
          icon: typeof rec.icon === "string" ? rec.icon.trim() : undefined,
          text,
        });
      }
    }
  }
  return items;
}

/**
 * Obtener todas las guías de cuidado de la base de datos (con auto-seed si está vacía)
 */
export async function getCareGuides() {
  try {
    let guides = await prisma.careGuide.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (guides.length === 0) {
      for (const tpl of DEFAULT_CARE_TEMPLATES) {
        await prisma.careGuide.create({
          data: {
            name: tpl.name,
            type: tpl.type,
            summary: tpl.summary || null,
            instructions: tpl.instructions as unknown as object,
            warning: tpl.warning || null,
          },
        });
      }

      guides = await prisma.careGuide.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return {
      success: true,
      data: guides.map((g) => ({
        id: g.id,
        name: g.name,
        type: g.type,
        summary: g.summary,
        instructions: parseInstructions(g.instructions),
        warning: g.warning,
      })),
    };
  } catch (error) {
    console.error("Error al obtener guías de cuidado:", error);
    return { success: false, error: "No se pudieron obtener las guías de cuidado" };
  }
}

/**
 * Crear una nueva guía de cuidados reutilizable
 */
export async function createCareGuide(data: CareGuideData) {
  try {
    const cleanInstructions = data.instructions
      .map((i) => ({
        icon: i.icon?.trim() || undefined,
        text: i.text.trim(),
      }))
      .filter((i) => i.text.length > 0);

    if (!data.name.trim() || cleanInstructions.length === 0) {
      return {
        success: false,
        error: "Debes indicar un nombre y al menos una instrucción de cuidado.",
      };
    }

    const guide = await prisma.careGuide.create({
      data: {
        name: data.name.trim(),
        type: data.type || "INDUMENTARIA",
        summary: data.summary?.trim() || null,
        instructions: cleanInstructions as unknown as object,
        warning: data.warning?.trim() || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/productos", "layout");
    return {
      success: true,
      data: {
        id: guide.id,
        name: guide.name,
        type: guide.type,
        summary: guide.summary,
        instructions: parseInstructions(guide.instructions),
        warning: guide.warning,
      },
    };
  } catch (error) {
    console.error("Error al crear guía de cuidado:", error);
    return { success: false, error: "Error al guardar la guía de cuidado en la base de datos" };
  }
}
