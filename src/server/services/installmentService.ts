import { z } from "zod";
import type { InstallmentPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invalidateLandingCache } from "@/lib/landingCache";
import {
  CreateInstallmentPlanSchema,
  UpdateInstallmentPlanSchema,
  ReorderInstallmentPlansSchema,
  resolveCardBrandsForGroup,
  DEFAULT_MATACOS_INSTALLMENT_PLANS,
  type CardBrandCode,
  type CardGroup,
  type CreateInstallmentPlanInput,
  type UpdateInstallmentPlanInput,
  type InstallmentPlanOrderItem,
} from "@/schemas/installment";

export type InstallmentValidityStatus =
  | "VIGENTE"
  | "INACTIVO"
  | "PROGRAMADO"
  | "EXPIRADO";

export interface SerializedInstallmentPlan {
  id: string;
  name: string;
  description: string | null;
  cardGroup: CardGroup;
  cardBrands: CardBrandCode[];
  installments: number;
  isPlanZ: boolean;
  interestRate: number;
  minAmount: number;
  order: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  isCurrentlyVisible: boolean;
  validityStatus: InstallmentValidityStatus;
}

export interface InstallmentPlanListResult {
  success: boolean;
  data?: SerializedInstallmentPlan[];
  plans?: SerializedInstallmentPlan[];
  error?: string;
}

export interface InstallmentPlanSingleResult {
  success: boolean;
  data?: SerializedInstallmentPlan;
  plan?: SerializedInstallmentPlan;
  error?: string;
}

export interface InstallmentPlanDeleteResult {
  success: boolean;
  deletedId?: string;
  error?: string;
}

const InstallmentPlanIdSchema = z
  .string({ required_error: "El identificador del plan es obligatorio" })
  .trim()
  .uuid("El identificador del plan debe ser un UUID válido");

export function resolveInstallmentValidityStatus(
  plan: Pick<InstallmentPlan, "active" | "startDate" | "endDate">,
  now: Date = new Date()
): { isCurrentlyVisible: boolean; validityStatus: InstallmentValidityStatus } {
  if (!plan.active) {
    return { isCurrentlyVisible: false, validityStatus: "INACTIVO" };
  }

  const nowMs = now.getTime();

  if (plan.startDate && plan.startDate.getTime() > nowMs) {
    return { isCurrentlyVisible: false, validityStatus: "PROGRAMADO" };
  }

  if (plan.endDate && plan.endDate.getTime() < nowMs) {
    return { isCurrentlyVisible: false, validityStatus: "EXPIRADO" };
  }

  return { isCurrentlyVisible: true, validityStatus: "VIGENTE" };
}

export function serializeInstallmentPlan(
  plan: InstallmentPlan,
  now: Date = new Date()
): SerializedInstallmentPlan {
  const { isCurrentlyVisible, validityStatus } =
    resolveInstallmentValidityStatus(plan, now);

  const normalizedGroup: CardGroup =
    plan.cardGroup === "BANCARIZADAS" ||
    plan.cardGroup === "NARANJA_X" ||
    plan.cardGroup === "TODAS" ||
    plan.cardGroup === "ESPECIFICAS"
      ? plan.cardGroup
      : "BANCARIZADAS";

  const validBrands = (plan.cardBrands || []).filter(
    (b): b is CardBrandCode =>
      b === "VISA" || b === "MASTERCARD" || b === "CABAL" || b === "NARANJA_X"
  );

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    cardGroup: normalizedGroup,
    cardBrands:
      validBrands.length > 0
        ? validBrands
        : resolveCardBrandsForGroup(normalizedGroup),
    installments: plan.installments,
    isPlanZ: plan.isPlanZ,
    interestRate: Number(plan.interestRate),
    minAmount: Number(plan.minAmount),
    order: plan.order,
    active: plan.active,
    startDate: plan.startDate ? plan.startDate.toISOString() : null,
    endDate: plan.endDate ? plan.endDate.toISOString() : null,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    isCurrentlyVisible,
    validityStatus,
  };
}

export function safeRevalidateInstallmentPaths(): void {
  invalidateLandingCache("banner");
}

export async function verifyAdminInstallmentAccess(
  actorUserId: string
): Promise<{
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
    effectivePermissions.has("ecommerce.banners") ||
    effectivePermissions.has("ecommerce.cuotas");

  if (!isAdmin) {
    return {
      authorized: false,
      error:
        "Acceso denegado: se requiere rol ADMIN para administrar los planes de cuotas.",
    };
  }

  return { authorized: true };
}

/**
 * Si la tabla de planes de cuotas está completamente vacía, siembra automáticamente
 * los planes comerciales oficiales vigentes de Matacos Deportes.
 */
export async function ensureDefaultInstallmentPlansSeeded(): Promise<void> {
  try {
    const count = await prisma.installmentPlan.count();
    if (count > 0) return;

    await prisma.$transaction(
      DEFAULT_MATACOS_INSTALLMENT_PLANS.map((plan) =>
        prisma.installmentPlan.create({
          data: {
            name: plan.name,
            description: plan.description,
            cardGroup: plan.cardGroup,
            cardBrands: plan.cardBrands,
            installments: plan.installments,
            isPlanZ: plan.isPlanZ,
            interestRate: plan.interestRate,
            minAmount: plan.minAmount,
            order: plan.order,
            active: plan.active,
          },
        })
      )
    );
  } catch (err) {
    console.warn("Aviso al sembrar planes de cuotas iniciales:", err);
  }
}

/**
 * Consulta pública de planes de cuotas activos y en ventana de fechas vigente,
 * ordenados por `order asc` y luego por cantidad de cuotas.
 */
export async function listActiveInstallmentPlansService(
  referenceDate: Date = new Date()
): Promise<InstallmentPlanListResult> {
  try {
    await ensureDefaultInstallmentPlansSeeded();

    const plans = await prisma.installmentPlan.findMany({
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
      orderBy: [{ order: "asc" }, { installments: "asc" }, { createdAt: "asc" }],
    });

    const serialized = plans.map((p) =>
      serializeInstallmentPlan(p, referenceDate)
    );
    return {
      success: true,
      data: serialized,
      plans: serialized,
    };
  } catch (error) {
    console.error("Error en listActiveInstallmentPlansService:", error);
    // Fallback en memoria a los planes por defecto si ocurre un error de conexión
    const nowIso = new Date().toISOString();
    const fallback: SerializedInstallmentPlan[] =
      DEFAULT_MATACOS_INSTALLMENT_PLANS.map((p, idx) => ({
        id: `default-plan-${idx + 1}`,
        name: p.name,
        description: p.description,
        cardGroup: p.cardGroup,
        cardBrands: p.cardBrands,
        installments: p.installments,
        isPlanZ: p.isPlanZ,
        interestRate: p.interestRate,
        minAmount: p.minAmount,
        order: p.order,
        active: p.active,
        startDate: null,
        endDate: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        isCurrentlyVisible: true,
        validityStatus: "VIGENTE",
      }));

    return {
      success: true,
      data: fallback,
      plans: fallback,
    };
  }
}

/**
 * Consulta administrativa de todos los planes de cuotas.
 */
export async function listAllInstallmentPlansAdminService(
  actorUserId: string
): Promise<InstallmentPlanListResult> {
  try {
    const auth = await verifyAdminInstallmentAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    await ensureDefaultInstallmentPlansSeeded();

    const now = new Date();
    const plans = await prisma.installmentPlan.findMany({
      orderBy: [{ order: "asc" }, { installments: "asc" }, { createdAt: "asc" }],
    });

    const serialized = plans.map((p) => serializeInstallmentPlan(p, now));
    return {
      success: true,
      data: serialized,
      plans: serialized,
    };
  } catch (error) {
    console.error("Error en listAllInstallmentPlansAdminService:", error);
    return {
      success: false,
      error: "Error al obtener el listado administrativo de planes de cuotas.",
    };
  }
}

/**
 * Crea un nuevo plan de cuotas validando esquema Zod y permisos ADMIN.
 */
export async function createInstallmentPlanService(
  actorUserId: string,
  rawInput: CreateInstallmentPlanInput
): Promise<InstallmentPlanSingleResult> {
  try {
    const auth = await verifyAdminInstallmentAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const parsed = CreateInstallmentPlanSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Datos inválidos para crear el plan de cuotas.",
      };
    }

    const data = parsed.data;

    let targetOrder = data.order;
    if (rawInput.order === undefined) {
      const aggregate = await prisma.installmentPlan.aggregate({
        _max: { order: true },
      });
      targetOrder =
        aggregate._max.order !== null ? aggregate._max.order + 1 : 0;
    }

    const created = await prisma.installmentPlan.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        cardGroup: data.cardGroup,
        cardBrands: data.cardBrands,
        installments: data.installments,
        isPlanZ: data.isPlanZ,
        interestRate: data.interestRate,
        minAmount: data.minAmount,
        order: targetOrder,
        active: data.active,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
      },
    });

    safeRevalidateInstallmentPaths();

    const serialized = serializeInstallmentPlan(created);
    return {
      success: true,
      data: serialized,
      plan: serialized,
    };
  } catch (error) {
    console.error("Error en createInstallmentPlanService:", error);
    return {
      success: false,
      error: "Ocurrió un error al registrar el plan de cuotas.",
    };
  }
}

/**
 * Actualiza un plan de cuotas existente.
 */
export async function updateInstallmentPlanService(
  actorUserId: string,
  rawInput: UpdateInstallmentPlanInput
): Promise<InstallmentPlanSingleResult> {
  try {
    const auth = await verifyAdminInstallmentAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const parsed = UpdateInstallmentPlanSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Datos inválidos para actualizar el plan de cuotas.",
      };
    }

    const data = parsed.data;
    const existing = await prisma.installmentPlan.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return {
        success: false,
        error: "El plan de cuotas que intentas modificar no existe.",
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

    const effectiveCardGroup: CardGroup =
      data.cardGroup !== undefined
        ? data.cardGroup
        : (existing.cardGroup as CardGroup);

    const effectiveCardBrands =
      data.cardGroup !== undefined || data.cardBrands !== undefined
        ? resolveCardBrandsForGroup(
            effectiveCardGroup,
            data.cardBrands ?? (existing.cardBrands as CardBrandCode[])
          )
        : undefined;

    const updated = await prisma.installmentPlan.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.cardGroup !== undefined ? { cardGroup: data.cardGroup } : {}),
        ...(effectiveCardBrands !== undefined
          ? { cardBrands: effectiveCardBrands }
          : {}),
        ...(data.installments !== undefined
          ? { installments: data.installments }
          : {}),
        ...(data.isPlanZ !== undefined ? { isPlanZ: data.isPlanZ } : {}),
        ...(data.interestRate !== undefined
          ? { interestRate: data.interestRate }
          : {}),
        ...(data.minAmount !== undefined ? { minAmount: data.minAmount } : {}),
        ...(data.order !== undefined ? { order: data.order } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      },
    });

    safeRevalidateInstallmentPaths();

    const serialized = serializeInstallmentPlan(updated);
    return {
      success: true,
      data: serialized,
      plan: serialized,
    };
  } catch (error) {
    console.error("Error en updateInstallmentPlanService:", error);
    return {
      success: false,
      error: "Ocurrió un error al actualizar el plan de cuotas.",
    };
  }
}

/**
 * Elimina un plan de cuotas por ID.
 */
export async function deleteInstallmentPlanService(
  actorUserId: string,
  rawId: string
): Promise<InstallmentPlanDeleteResult> {
  try {
    const auth = await verifyAdminInstallmentAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const parsedId = InstallmentPlanIdSchema.safeParse(rawId);
    if (!parsedId.success) {
      return {
        success: false,
        error:
          parsedId.error.errors[0]?.message ||
          "Identificador de plan de cuotas inválido.",
      };
    }

    const existing = await prisma.installmentPlan.findUnique({
      where: { id: parsedId.data },
    });

    if (!existing) {
      return {
        success: false,
        error: "El plan de cuotas que intentas eliminar no existe.",
      };
    }

    await prisma.installmentPlan.delete({
      where: { id: parsedId.data },
    });

    safeRevalidateInstallmentPaths();

    return {
      success: true,
      deletedId: parsedId.data,
    };
  } catch (error) {
    console.error("Error en deleteInstallmentPlanService:", error);
    return {
      success: false,
      error: "Ocurrió un error al eliminar el plan de cuotas.",
    };
  }
}

/**
 * Reordena múltiples planes de cuotas de forma atómica bajo transacción Prisma.
 */
export async function reorderInstallmentPlansService(
  actorUserId: string,
  rawItems: InstallmentPlanOrderItem[]
): Promise<InstallmentPlanListResult> {
  try {
    const auth = await verifyAdminInstallmentAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const parsed = ReorderInstallmentPlansSchema.safeParse(rawItems);
    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.errors[0]?.message ||
          "Lista de posiciones inválida para reordenar planes.",
      };
    }

    const items = parsed.data;
    const requestedIds = items.map((item) => item.id);

    const updatedPlans = await prisma.$transaction(async (tx) => {
      const found = await tx.installmentPlan.findMany({
        where: { id: { in: requestedIds } },
        select: { id: true },
      });

      if (found.length !== requestedIds.length) {
        throw new Error("PLAN_NOT_FOUND_IN_REORDER");
      }

      for (const item of items) {
        await tx.installmentPlan.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }

      return tx.installmentPlan.findMany({
        orderBy: [{ order: "asc" }, { installments: "asc" }, { createdAt: "asc" }],
      });
    });

    safeRevalidateInstallmentPaths();

    const now = new Date();
    const serialized = updatedPlans.map((p) =>
      serializeInstallmentPlan(p, now)
    );
    return {
      success: true,
      data: serialized,
      plans: serialized,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PLAN_NOT_FOUND_IN_REORDER"
    ) {
      return {
        success: false,
        error:
          "Uno o más planes enviados para reordenar no existen en la base de datos.",
      };
    }

    console.error("Error en reorderInstallmentPlansService:", error);
    return {
      success: false,
      error: "Ocurrió un error al reordenar los planes de cuotas.",
    };
  }
}

/**
 * Restaura o agrega los planes comerciales por defecto de Matacos Deportes.
 */
export async function restoreDefaultInstallmentPlansService(
  actorUserId: string
): Promise<InstallmentPlanListResult> {
  try {
    const auth = await verifyAdminInstallmentAccess(actorUserId);
    if (!auth.authorized) {
      return { success: false, error: auth.error };
    }

    const updatedPlans = await prisma.$transaction(async (tx) => {
      await tx.installmentPlan.deleteMany({});

      for (const plan of DEFAULT_MATACOS_INSTALLMENT_PLANS) {
        await tx.installmentPlan.create({
          data: {
            name: plan.name,
            description: plan.description,
            cardGroup: plan.cardGroup,
            cardBrands: plan.cardBrands,
            installments: plan.installments,
            isPlanZ: plan.isPlanZ,
            interestRate: plan.interestRate,
            minAmount: plan.minAmount,
            order: plan.order,
            active: plan.active,
          },
        });
      }

      return tx.installmentPlan.findMany({
        orderBy: [{ order: "asc" }, { installments: "asc" }],
      });
    });

    safeRevalidateInstallmentPaths();

    const now = new Date();
    const serialized = updatedPlans.map((p) =>
      serializeInstallmentPlan(p, now)
    );
    return {
      success: true,
      data: serialized,
      plans: serialized,
    };
  } catch (error) {
    console.error("Error en restoreDefaultInstallmentPlansService:", error);
    return {
      success: false,
      error: "Ocurrió un error al restaurar los planes de cuotas por defecto.",
    };
  }
}
