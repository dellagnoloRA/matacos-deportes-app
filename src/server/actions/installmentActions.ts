"use server";

import { getSession } from "@/lib/session";
import { invalidateLandingCache } from "@/lib/landingCache";
import type {
  CreateInstallmentPlanInput,
  UpdateInstallmentPlanInput,
} from "@/schemas/installment";
import {
  listActiveInstallmentPlansService,
  listAllInstallmentPlansAdminService,
  createInstallmentPlanService,
  updateInstallmentPlanService,
  deleteInstallmentPlanService,
  reorderInstallmentPlansService,
  restoreDefaultInstallmentPlansService,
  type InstallmentPlanListResult,
  type InstallmentPlanSingleResult,
  type InstallmentPlanDeleteResult,
} from "@/server/services/installmentService";

function revalidateCache(): void {
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
 * Server Action pública que retorna los planes de cuotas activos (`active: true`)
 * dentro de su ventana de vigencia (`startDate` / `endDate`), ordenados por `order asc`.
 * Utilizada en Checkout Web, Ficha de Producto (PDP), Catálogo y Caja POS.
 */
export async function getActiveInstallmentPlans(): Promise<InstallmentPlanListResult> {
  return listActiveInstallmentPlansService();
}

/**
 * Server Action protegida (rol ADMIN) para obtener todos los planes de cuotas
 * registrados en el sistema (vigentes, inactivos, programados y expirados).
 */
export async function getAllInstallmentPlansAdmin(): Promise<InstallmentPlanListResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  return listAllInstallmentPlansAdminService(userId);
}

/**
 * Server Action protegida (rol ADMIN) para registrar un nuevo plan de cuotas.
 */
export async function createInstallmentPlan(
  input: CreateInstallmentPlanInput
): Promise<InstallmentPlanSingleResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const result = await createInstallmentPlanService(userId, input);
  if (result.success) {
    revalidateCache();
  }
  return result;
}

/**
 * Server Action protegida (rol ADMIN) para actualizar un plan de cuotas existente.
 */
export async function updateInstallmentPlan(
  input: UpdateInstallmentPlanInput
): Promise<InstallmentPlanSingleResult>;
export async function updateInstallmentPlan(
  id: string,
  data: Omit<UpdateInstallmentPlanInput, "id">
): Promise<InstallmentPlanSingleResult>;
export async function updateInstallmentPlan(
  inputOrId: UpdateInstallmentPlanInput | string,
  maybeData?: Omit<UpdateInstallmentPlanInput, "id">
): Promise<InstallmentPlanSingleResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const normalizedInput: UpdateInstallmentPlanInput =
    typeof inputOrId === "string"
      ? { ...(maybeData ?? {}), id: inputOrId }
      : inputOrId;

  const result = await updateInstallmentPlanService(userId, normalizedInput);
  if (result.success) {
    revalidateCache();
  }
  return result;
}

/**
 * Server Action protegida (rol ADMIN) para eliminar un plan de cuotas.
 */
export async function deleteInstallmentPlan(
  id: string
): Promise<InstallmentPlanDeleteResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const result = await deleteInstallmentPlanService(userId, id);
  if (result.success) {
    revalidateCache();
  }
  return result;
}

/**
 * Server Action protegida (rol ADMIN) para reordenar planes de cuotas atómicamente.
 */
export async function reorderInstallmentPlans(
  items: { id: string; order: number }[]
): Promise<InstallmentPlanListResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const result = await reorderInstallmentPlansService(userId, items);
  if (result.success) {
    revalidateCache();
  }
  return result;
}

/**
 * Server Action protegida (rol ADMIN) para restaurar los planes comerciales base de Matacos Deportes.
 */
export async function restoreDefaultInstallmentPlans(): Promise<InstallmentPlanListResult> {
  const userId = await resolveAuthenticatedUserId();
  if (!userId) {
    return {
      success: false,
      error: "Acceso denegado: debes iniciar sesión como Administrador.",
    };
  }

  const result = await restoreDefaultInstallmentPlansService(userId);
  if (result.success) {
    revalidateCache();
  }
  return result;
}
