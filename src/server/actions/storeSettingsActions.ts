"use server";

import { prisma } from "@/lib/prisma";
import { StoreSettingSchema, type StoreSettingInput } from "@/schemas/settings";
import { sanitizeWhatsAppNumber } from "@/config/company";
import { revalidatePath } from "next/cache";

export interface StoreSettingsOutput {
  id: string;
  storeName: string;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  notificationsEmail?: string | null;
  storeAddress: string;
  storeCity: string;
  storePostalCode: string;
  businessHours: string;
  instagramHandle?: string | null;
  cadeteriaCost: number;
  updatedAt: Date;
}

const DEFAULT_SETTINGS = {
  id: "default",
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Matacos Deportes",
  whatsappNumber: process.env.COMPANY_WHATSAPP || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5493704000000",
  contactPhone: process.env.COMPANY_PHONE || "+54 370 4429999",
  contactEmail: process.env.COMPANY_EMAIL || "ventas@matacosdeportes.com",
  notificationsEmail: "notificaciones@matacosdeportes.com",
  storeAddress: process.env.COMPANY_ADDRESS || "Saavedra 241",
  storeCity: process.env.COMPANY_CITY || "Formosa Capital",
  storePostalCode: process.env.COMPANY_POSTAL_CODE || "3600",
  businessHours: "Lunes a Sábado de 08:30 a 12:30 y de 16:30 a 20:30 hs",
  instagramHandle: process.env.COMPANY_INSTAGRAM || "@matacosdeportes",
  cadeteriaCost: 2500,
};

/**
 * Obtiene la configuración comercial y canales de contacto vigentes
 * Prioriza la base de datos (PostgreSQL), inicializándola con defaults si es la primera lectura.
 */
export async function getStoreSettings(): Promise<{
  success: boolean;
  data: StoreSettingsOutput;
  error?: string;
}> {
  try {
    let settings = await prisma.storeSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return {
      success: true,
      data: {
        ...settings,
        cadeteriaCost: Number(settings.cadeteriaCost ?? 2500),
      },
    };
  } catch (error) {
    console.error("[StoreSettings] Error al obtener configuración:", error);
    // Fallback de contingencia en caso de error de conexión
    return {
      success: true,
      data: {
        ...DEFAULT_SETTINGS,
        updatedAt: new Date(),
      },
    };
  }
}

/**
 * Actualiza la configuración comercial y los canales de contacto (WhatsApp, email, dirección)
 * Valida estrictamente los datos con Zod y sanitiza el número para compatibilidad wa.me.
 */
export async function updateStoreSettings(input: StoreSettingInput): Promise<{
  success: boolean;
  data?: StoreSettingsOutput;
  error?: string;
}> {
  try {
    const validated = StoreSettingSchema.parse(input);

    const cleanWhatsapp = sanitizeWhatsAppNumber(validated.whatsappNumber);

    const updated = await prisma.storeSetting.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...validated,
        notificationsEmail: validated.notificationsEmail || null,
        instagramHandle: validated.instagramHandle || "",
        whatsappNumber: cleanWhatsapp,
      },
      update: {
        ...validated,
        notificationsEmail: validated.notificationsEmail || null,
        instagramHandle: validated.instagramHandle || "",
        whatsappNumber: cleanWhatsapp,
      },
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/(ecommerce)", "layout");
      revalidatePath("/admin", "layout");
    } catch {
      // Ignorar si se invoca fuera del contexto de petición HTTP de Next.js (ej: scripts o pruebas CLI)
    }

    return {
      success: true,
      data: {
        ...updated,
        cadeteriaCost: Number(updated.cadeteriaCost ?? 2500),
      },
    };
  } catch (error) {
    console.error("[StoreSettings] Error al actualizar configuración:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error al guardar la configuración comercial",
    };
  }
}
