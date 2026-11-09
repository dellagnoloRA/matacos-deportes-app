import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import type { Banner } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invalidateLandingCache } from "@/lib/landingCache";
import {
  CreateBannerSchema,
  UpdateBannerSchema,
  ReorderBannersSchema,
  type CreateBannerInput,
  type UpdateBannerInput,
  type BannerOrderItem,
} from "@/schemas/banner";

export type BannerValidityStatus =
  | "VIGENTE"
  | "INACTIVO"
  | "PROGRAMADO"
  | "EXPIRADO";

export interface SerializedBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileUrl: string | null;
  linkUrl: string | null;
  order: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  isCurrentlyVisible: boolean;
  validityStatus: BannerValidityStatus;
}

export interface BannerListResult {
  success: boolean;
  data?: SerializedBanner[];
  banners?: SerializedBanner[];
  error?: string;
}

export interface BannerSingleResult {
  success: boolean;
  data?: SerializedBanner;
  banner?: SerializedBanner;
  error?: string;
}

export interface BannerDeleteResult {
  success: boolean;
  deletedId?: string;
  error?: string;
}

const BannerIdSchema = z
  .string({ required_error: "El identificador del banner es obligatorio" })
  .trim()
  .uuid("El identificador del banner debe ser un UUID válido");

/**
 * Evalúa el estado de vigencia y visibilidad actual de un banner respecto a una fecha dada.
 */
export function resolveBannerValidityStatus(
  banner: Pick<Banner, "active" | "startDate" | "endDate">,
  now: Date = new Date()
): { isCurrentlyVisible: boolean; validityStatus: BannerValidityStatus } {
  if (!banner.active) {
    return { isCurrentlyVisible: false, validityStatus: "INACTIVO" };
  }

  const nowMs = now.getTime();

  if (banner.startDate && banner.startDate.getTime() > nowMs) {
    return { isCurrentlyVisible: false, validityStatus: "PROGRAMADO" };
  }

  if (banner.endDate && banner.endDate.getTime() < nowMs) {
    return { isCurrentlyVisible: false, validityStatus: "EXPIRADO" };
  }

  return { isCurrentlyVisible: true, validityStatus: "VIGENTE" };
}

/**
 * Serializa una entidad Prisma Banner a un DTO plano seguro para Client Components.
 */
export function serializeBanner(
  banner: Banner,
  now: Date = new Date()
): SerializedBanner {
  const { isCurrentlyVisible, validityStatus } = resolveBannerValidityStatus(
    banner,
    now
  );

  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    imageUrl: banner.imageUrl,
    mobileUrl: banner.mobileUrl,
    linkUrl: banner.linkUrl,
    order: banner.order,
    active: banner.active,
    startDate: banner.startDate ? banner.startDate.toISOString() : null,
    endDate: banner.endDate ? banner.endDate.toISOString() : null,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
    isCurrentlyVisible,
    validityStatus,
  };
}

/**
 * Revalida la caché de la Landing ('/' y etiqueta 'landing-data' de RF-28) y paneles relacionados de forma segura.
 * Ignora el error Invariant si se invoca desde scripts CLI fuera de un request HTTP de Next.js.
 */
export function safeRevalidateBannerPaths(): void {
  invalidateLandingCache("banner");
}

/**
 * Verifica estrictamente en PostgreSQL que el usuario actor exista, esté activo
 * y cuente con rol ADMIN (o perfil jerárquico Administrador / permiso ecommerce.banners).
 */
export async function verifyAdminBannerAccess(actorUserId: string): Promise<{
  authorized: boolean;
  error?: string;
}> {
  if (!actorUserId || typeof actorUserId !== "string") {
    return {
      authorized: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: actorUserId },
    include: {
      profile: {
        include: {
          permissions: {
            include: { permission: true },
          },
          parentProfile: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.active) {
    return {
      authorized: false,
      error: "Acceso denegado: usuario inexistente o cuenta inactiva.",
    };
  }

  const effectivePermissions = new Set<string>();
  if (user.profile) {
    for (const pp of user.profile.permissions) {
      if (pp.permission?.code) {
        effectivePermissions.add(pp.permission.code);
      }
    }
    if (user.profile.parentProfile) {
      for (const pp of user.profile.parentProfile.permissions) {
        if (pp.permission?.code) {
          effectivePermissions.add(pp.permission.code);
        }
      }
    }
  }

  const isAdmin =
    user.role === "ADMIN" ||
    (user.profile?.level ?? 0) >= 100 ||
    effectivePermissions.has("ecommerce.banners");

  if (!isAdmin) {
    return {
      authorized: false,
      error:
        "Acceso denegado: se requiere rol ADMIN para administrar los banners promocionales.",
    };
  }

  return { authorized: true };
}

/**
 * Elimina de forma segura un archivo local en public/uploads/banners si ya no es referenciado.
 */
async function tryCleanupLocalBannerImage(
  assetUrl: string | null | undefined
): Promise<void> {
  if (!assetUrl || !assetUrl.startsWith("/uploads/banners/")) {
    return;
  }

  try {
    const remainingRefs = await prisma.banner.count({
      where: {
        OR: [{ imageUrl: assetUrl }, { mobileUrl: assetUrl }],
      },
    });

    if (remainingRefs > 0) {
      return;
    }

    const safeFilename = path.basename(assetUrl);
    if (!safeFilename) return;

    const fullPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "banners",
      safeFilename
    );
    await fs.unlink(fullPath);
  } catch {
    // No bloquear operación principal si el archivo físico no existe en disco
  }
}

/**
 * Consulta pública de banners activos y en ventana de fechas vigente, ordenados por `order asc`.
 */
export async function listActiveBannersService(
  referenceDate: Date = new Date()
): Promise<BannerListResult> {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        active: true,
        AND: [
          {
            OR: [{ startDate: null }, { startDate: { lte: referenceDate } }],
          },
          {
            OR: [{ endDate: null }, { endDate: { gte: referenceDate } }],
          },
        ],
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    const serialized = banners.map((b) => serializeBanner(b, referenceDate));
    return {
      success: true,
      data: serialized,
      banners: serialized,
    };
  } catch (error) {
    console.error("Error en listActiveBannersService:", error);
    return {
      success: false,
      error: "No se pudieron obtener los banners promocionales activos.",
    };
  }
}

/**
 * Consulta administrativa de todos los banners (activos, inactivos, programados y expirados).
 */
export async function listAllBannersAdminService(
  actorUserId: string
): Promise<BannerListResult> {
  try {
    const auth = await verifyAdminBannerAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const now = new Date();
    const banners = await prisma.banner.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    const serialized = banners.map((b) => serializeBanner(b, now));
    return {
      success: true,
      data: serialized,
      banners: serialized,
    };
  } catch (error) {
    console.error("Error en listAllBannersAdminService:", error);
    return {
      success: false,
      error: "Error al obtener el listado administrativo de banners.",
    };
  }
}

/**
 * Crea un nuevo banner promocional validando esquema Zod y permisos ADMIN.
 */
export async function createBannerService(
  actorUserId: string,
  rawInput: CreateBannerInput
): Promise<BannerSingleResult> {
  try {
    const auth = await verifyAdminBannerAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const parsed = CreateBannerSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Datos inválidos para crear el banner.",
      };
    }

    const data = parsed.data;

    // Si el llamador no especificó `order` explícitamente, asignarlo al final del carrusel
    let targetOrder = data.order;
    if (rawInput.order === undefined) {
      const aggregate = await prisma.banner.aggregate({
        _max: { order: true },
      });
      targetOrder =
        aggregate._max.order !== null ? aggregate._max.order + 1 : 0;
    }

    const created = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle ?? null,
        imageUrl: data.imageUrl,
        mobileUrl: data.mobileUrl ?? null,
        linkUrl: data.linkUrl ?? null,
        order: targetOrder,
        active: data.active,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
      },
    });

    safeRevalidateBannerPaths();

    const serialized = serializeBanner(created);
    return {
      success: true,
      data: serialized,
      banner: serialized,
    };
  } catch (error) {
    console.error("Error en createBannerService:", error);
    return {
      success: false,
      error: "Ocurrió un error al registrar el banner promocional.",
    };
  }
}

/**
 * Actualiza un banner existente validando coherencia de fechas y permisos ADMIN.
 */
export async function updateBannerService(
  actorUserId: string,
  rawInput: UpdateBannerInput
): Promise<BannerSingleResult> {
  try {
    const auth = await verifyAdminBannerAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const parsed = UpdateBannerSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Datos inválidos para actualizar el banner.",
      };
    }

    const data = parsed.data;
    const existing = await prisma.banner.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return {
        success: false,
        error: "El banner que intentas modificar no existe.",
      };
    }

    const effectiveStartDate =
      data.startDate !== undefined ? data.startDate : existing.startDate;
    const effectiveEndDate =
      data.endDate !== undefined ? data.endDate : existing.endDate;

    if (
      effectiveStartDate instanceof Date &&
      effectiveEndDate instanceof Date &&
      effectiveEndDate.getTime() < effectiveStartDate.getTime()
    ) {
      return {
        success: false,
        error:
          "La fecha de fin de vigencia debe ser posterior o igual a la fecha de inicio.",
      };
    }

    const previousImageUrl = existing.imageUrl;
    const previousMobileUrl = existing.mobileUrl;

    const updated = await prisma.banner.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.mobileUrl !== undefined ? { mobileUrl: data.mobileUrl } : {}),
        ...(data.linkUrl !== undefined ? { linkUrl: data.linkUrl } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      },
    });

    if (data.imageUrl !== undefined && data.imageUrl !== previousImageUrl) {
      await tryCleanupLocalBannerImage(previousImageUrl);
    }
    if (data.mobileUrl !== undefined && data.mobileUrl !== previousMobileUrl) {
      await tryCleanupLocalBannerImage(previousMobileUrl);
    }

    safeRevalidateBannerPaths();

    const serialized = serializeBanner(updated);
    return {
      success: true,
      data: serialized,
      banner: serialized,
    };
  } catch (error) {
    console.error("Error en updateBannerService:", error);
    return {
      success: false,
      error: "Ocurrió un error al actualizar el banner promocional.",
    };
  }
}

/**
 * Elimina un banner promocional por ID y limpia su imagen local huérfana si corresponde.
 */
export async function deleteBannerService(
  actorUserId: string,
  rawId: string
): Promise<BannerDeleteResult> {
  try {
    const auth = await verifyAdminBannerAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const parsedId = BannerIdSchema.safeParse(rawId);
    if (!parsedId.success) {
      return {
        success: false,
        error:
          parsedId.error.errors[0]?.message ||
          "Identificador de banner inválido.",
      };
    }

    const existing = await prisma.banner.findUnique({
      where: { id: parsedId.data },
    });

    if (!existing) {
      return {
        success: false,
        error: "El banner que intentas eliminar no existe.",
      };
    }

    await prisma.banner.delete({
      where: { id: parsedId.data },
    });

    await tryCleanupLocalBannerImage(existing.imageUrl);
    await tryCleanupLocalBannerImage(existing.mobileUrl);

    safeRevalidateBannerPaths();

    return {
      success: true,
      deletedId: parsedId.data,
    };
  } catch (error) {
    console.error("Error en deleteBannerService:", error);
    return {
      success: false,
      error: "Ocurrió un error al eliminar el banner promocional.",
    };
  }
}

/**
 * Reordena múltiples banners de manera atómica dentro de una transacción Prisma (prisma.$transaction).
 */
export async function reorderBannersService(
  actorUserId: string,
  rawItems: BannerOrderItem[]
): Promise<BannerListResult> {
  try {
    const auth = await verifyAdminBannerAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const parsed = ReorderBannersSchema.safeParse(rawItems);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Lista de posiciones inválida para reordenar banners.",
      };
    }

    const items = parsed.data;
    const requestedIds = items.map((item) => item.id);

    const updatedBanners = await prisma.$transaction(async (tx) => {
      const found = await tx.banner.findMany({
        where: { id: { in: requestedIds } },
        select: { id: true },
      });

      if (found.length !== requestedIds.length) {
        throw new Error("BANNER_NOT_FOUND_IN_REORDER");
      }

      for (const item of items) {
        await tx.banner.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      return tx.banner.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });
    });

    safeRevalidateBannerPaths();

    const now = new Date();
    const serialized = updatedBanners.map((b) => serializeBanner(b, now));
    return {
      success: true,
      data: serialized,
      banners: serialized,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "BANNER_NOT_FOUND_IN_REORDER"
    ) {
      return {
        success: false,
        error:
          "Uno o más banners enviados para reordenar no existen en la base de datos.",
      };
    }

    console.error("Error en reorderBannersService:", error);
    return {
      success: false,
      error: "Ocurrió un error al reordenar los banners promocionales.",
    };
  }
}
