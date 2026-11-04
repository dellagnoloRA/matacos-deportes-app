"use server";

import { getSession } from "@/lib/session";
import { invalidateLandingCache } from "@/lib/landingCache";
import type {
  CreateBannerInput,
  UpdateBannerInput,
} from "@/schemas/banner";
import {
  listActiveBannersService,
  listAllBannersAdminService,
  createBannerService,
  updateBannerService,
  deleteBannerService,
  reorderBannersService,
  type BannerListResult,
  type BannerSingleResult,
  type BannerDeleteResult,
} from "@/server/services/bannerService";

function revalidateLandingCache(): void {
  invalidateLandingCache("banner");
}

async function resolveAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Tarea 5 (RF-26): Server Action pública que retorna los banners activos (`active: true`)
 * dentro de su ventana de vigencia (`startDate` / `endDate`), ordenados por `order asc`.
 */
export async function getActiveBanners(): Promise<BannerListResult> {
  return listActiveBannersService();
}

/**
 * Tarea 6 (RF-26): Server Action protegida (rol ADMIN) para obtener todos los banners
 * registrados en el sistema (vigentes, inactivos, programados y expirados).
 */
export async function getAllBannersAdmin(): Promise<BannerListResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  return listAllBannersAdminService(userId);
}

/**
 * Tarea 6 y 8 (RF-26): Server Action protegida (rol ADMIN) para registrar un nuevo banner
 * y revalidar la caché de la Landing (`/`).
 */
export async function createBanner(
  input: CreateBannerInput
): Promise<BannerSingleResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const result = await createBannerService(userId, input);
  if (result.success) {
    revalidateLandingCache();
  }
  return result;
}

/**
 * Tarea 6 y 8 (RF-26): Server Action protegida (rol ADMIN) para actualizar un banner existente
 * y revalidar la caché de la Landing (`/`).
 * Soporta tanto `updateBanner({ id, ... })` como `updateBanner(id, { ... })`.
 */
export async function updateBanner(
  input: UpdateBannerInput
): Promise<BannerSingleResult>;
export async function updateBanner(
  id: string,
  data: Omit<UpdateBannerInput, "id">
): Promise<BannerSingleResult>;
export async function updateBanner(
  inputOrId: UpdateBannerInput | string,
  maybeData?: Omit<UpdateBannerInput, "id">
): Promise<BannerSingleResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const normalizedInput: UpdateBannerInput =
    typeof inputOrId === "string"
      ? { ...(maybeData ?? {}), id: inputOrId }
      : inputOrId;

  const result = await updateBannerService(userId, normalizedInput);
  if (result.success) {
    revalidateLandingCache();
  }
  return result;
}

/**
 * Tarea 6 y 8 (RF-26): Server Action protegida (rol ADMIN) para eliminar un banner
 * y revalidar la caché de la Landing (`/`).
 */
export async function deleteBanner(id: string): Promise<BannerDeleteResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const result = await deleteBannerService(userId, id);
  if (result.success) {
    revalidateLandingCache();
  }
  return result;
}

/**
 * Tarea 7 y 8 (RF-26): Server Action protegida (rol ADMIN) para reordenar banners
 * de forma atómica en una transacción Prisma y revalidar la caché de la Landing (`/`).
 */
export async function reorderBanners(
  items: { id: string; order: number }[]
): Promise<BannerListResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const result = await reorderBannersService(userId, items);
  if (result.success) {
    revalidateLandingCache();
  }
  return result;
}
