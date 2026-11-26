"use server";

import { prisma } from "@/lib/prisma";
import {
  OpenCashShiftSchema,
  OpenCashShiftInput,
  CreateCashMovementSchema,
  CreateCashMovementInput,
  CloseCashShiftSchema,
  CloseCashShiftInput,
  ListCashShiftsSchema,
  ListCashShiftsInput,
} from "@/schemas/cashShift";
import {
  ensureUser,
  calculateCashShiftTotals,
  validateCashWithdrawal,
  compareBlindAudit,
  generateCashShiftReceiptPayload,
  CASH_AUDIT_TOLERANCE_THRESHOLD,
} from "@/server/services/cashShiftService";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hasPermission } from "./authActions";

function serializeData<T>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "object" && typeof obj.toNumber === "function") {
    return obj.toNumber() as unknown as T;
  }
  if (typeof obj === "object" && "d" in obj && "e" in obj && "s" in obj) {
    return Number(obj) as unknown as T;
  }
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeData(item)) as any;
  }
  if (typeof obj === "object") {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = serializeData(obj[key]);
    }
    return res;
  }
  return obj;
}

/**
 * Abre un nuevo turno de caja (Fondo Inicial)
 */
export async function openCashShift(input: OpenCashShiftInput) {
  try {
    const validated = OpenCashShiftSchema.parse(input);

    const shift = await prisma.$transaction(async (tx) => {
      // 1. Validar que no haya un turno ABIERTO en esa misma terminal
      const activeShift = await tx.cashShift.findFirst({
        where: {
          terminalId: validated.terminalId,
          status: "ABIERTA",
        },
      });

      if (activeShift) {
        throw new Error(
          `Ya existe un turno de caja abierto en la terminal "${validated.terminalId}". Debe cerrarlo antes de iniciar una nueva apertura.`
        );
      }

      // 2. Resolver o asegurar el usuario cajero en PostgreSQL
      const user = await ensureUser(
        { userId: validated.userId, userName: validated.userName },
        tx
      );

      // 3. Crear el turno de caja
      const newShift = await tx.cashShift.create({
        data: {
          terminalId: validated.terminalId,
          userId: user.id,
          initialAmount: new Prisma.Decimal(validated.initialAmount),
          status: "ABIERTA",
          notes: validated.notes ?? null,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return newShift;
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignored outside request context
    }

    return {
      success: true,
      data: serializeData(shift),
      message: `Turno de caja abierto correctamente en ${shift.terminalId} con un fondo inicial de $ ${Number(
        shift.initialAmount
      ).toFixed(2)}.`,
    };
  } catch (error: any) {
    console.error("Error en openCashShift:", error);
    return {
      success: false,
      error: error.message || "Error al abrir el turno de caja",
    };
  }
}

/**
 * Consulta el turno de caja actualmente activo en una terminal específica
 */
export async function getCurrentCashShift(terminalId: string) {
  try {
    const shift = await prisma.cashShift.findFirst({
      where: {
        terminalId,
        status: "ABIERTA",
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        movements: { orderBy: { createdAt: "desc" } },
        _count: {
          select: { sales: true, movements: true },
        },
      },
      orderBy: { openedAt: "desc" },
    });

    if (!shift) {
      return { success: true, activeShift: null };
    }

    const totals = await calculateCashShiftTotals(shift.id);

    return {
      success: true,
      activeShift: serializeData(shift),
      totals,
    };
  } catch (error: any) {
    console.error("Error en getCurrentCashShift:", error);
    return {
      success: false,
      error: error.message || "Error al consultar turno de caja",
    };
  }
}

/**
 * Registra un movimiento intermedio de caja (egreso o ingreso extraordinario)
 */
export async function registerCashMovement(input: CreateCashMovementInput) {
  try {
    const validated = CreateCashMovementSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const shift = await tx.cashShift.findUnique({
        where: { id: validated.cashShiftId },
      });

      if (!shift) {
        throw new Error("Turno de caja no encontrado.");
      }

      if (shift.status !== "ABIERTA") {
        throw new Error("No se pueden registrar movimientos en un turno de caja cerrado.");
      }

      // 1. Si es egreso o retiro, validar que no exceda el efectivo disponible
      if (
        validated.type === "RETIRO_CAJA_FUERTE" ||
        validated.type === "GASTO_MENOR"
      ) {
        const totals = await calculateCashShiftTotals(shift.id, tx);
        validateCashWithdrawal(totals.currentAvailableCash, validated.amount);
      }

      // 2. Crear el movimiento
      const movement = await tx.cashMovement.create({
        data: {
          cashShiftId: validated.cashShiftId,
          type: validated.type,
          amount: new Prisma.Decimal(validated.amount),
          reason: validated.reason.trim(),
          receiptNumber: validated.receiptNumber?.trim() || null,
          performedBy: validated.performedBy.trim(),
        },
      });

      const updatedTotals = await calculateCashShiftTotals(shift.id, tx);

      return { movement, updatedTotals };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignored outside request context
    }

    return {
      success: true,
      data: serializeData(result.movement),
      currentAvailableCash: result.updatedTotals.currentAvailableCash,
      message: `Movimiento de caja registrado exitosamente (${result.movement.type}): $ ${Number(
        result.movement.amount
      ).toFixed(2)}.`,
    };
  } catch (error: any) {
    console.error("Error en registerCashMovement:", error);
    return {
      success: false,
      error: error.message || "Error al registrar movimiento de caja",
    };
  }
}

/**
 * Cierre y Arqueo Ciego de Turno de Caja (RF-11)
 */
export async function closeCashShift(input: CloseCashShiftInput) {
  try {
    const validated = CloseCashShiftSchema.parse(input);

    const result = await prisma.$transaction(async (tx) => {
      const shift = await tx.cashShift.findUnique({
        where: { id: validated.cashShiftId },
        include: { user: true },
      });

      if (!shift) {
        throw new Error("Turno de caja no encontrado.");
      }

      if (shift.status !== "ABIERTA") {
        throw new Error("El turno de caja especificado ya se encuentra cerrado.");
      }

      // 1. Calcular totales esperados del sistema
      const expectedTotals = await calculateCashShiftTotals(shift.id, tx);

      // 2. Realizar comparación de arqueo ciego
      const comparison = compareBlindAudit(expectedTotals, validated);

      // 3. Validar observación obligatoria si hay desvío significativo (> CASH_AUDIT_TOLERANCE_THRESHOLD)
      if (comparison.hasSignificantDifference && !validated.notes?.trim()) {
        const sign = comparison.differenceCash > 0 ? "sobrante" : "faltante";
        throw new Error(
          `Existe una diferencia de ${sign} de $ ${Math.abs(
            comparison.differenceCash
          ).toFixed(2)} (superior al límite de tolerancia de $ ${CASH_AUDIT_TOLERANCE_THRESHOLD.toLocaleString(
            "es-AR"
          )},00). Es obligatorio ingresar una justificación u observación para asentar el cierre.`
        );
      }

      // 4. Cerrar turno en la base de datos
      const closedShift = await tx.cashShift.update({
        where: { id: shift.id },
        data: {
          status: "CERRADA",
          closedAt: new Date(),
          expectedCash: new Prisma.Decimal(comparison.expectedCash),
          expectedDebit: new Prisma.Decimal(comparison.expectedDebit),
          expectedCredit: new Prisma.Decimal(comparison.expectedCredit),
          expectedTransfer: new Prisma.Decimal(comparison.expectedTransfer),
          expectedQr: new Prisma.Decimal(comparison.expectedQr),
          actualCash: new Prisma.Decimal(comparison.actualCash),
          actualDebit: new Prisma.Decimal(comparison.actualDebit),
          actualCredit: new Prisma.Decimal(comparison.actualCredit),
          actualTransfer: new Prisma.Decimal(comparison.actualTransfer),
          actualQr: new Prisma.Decimal(comparison.actualQr),
          differenceCash: new Prisma.Decimal(comparison.differenceCash),
          notes: validated.notes?.trim() || null,
        },
        include: {
          user: true,
          movements: true,
          sales: { where: { status: "COMPLETADA" }, include: { payments: true } },
        },
      });

      // 5. Generar comprobante estructurado de cierre en 80mm
      const receiptPayload = await generateCashShiftReceiptPayload(shift.id, tx);

      return { closedShift, comparison, receiptPayload };
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/pos");
    } catch {
      // Ignored outside request context
    }

    return {
      success: true,
      data: serializeData(result.closedShift),
      comparison: result.comparison,
      receipt: result.receiptPayload,
      message: `Turno de caja cerrado exitosamente en ${result.closedShift.terminalId}. ${
        result.comparison.isCashBalanced
          ? "Caja cuadrada exactamente."
          : `Diferencia de efectivo: $ ${result.comparison.differenceCash.toFixed(2)}.`
      }`,
    };
  } catch (error: any) {
    console.error("Error en closeCashShift:", error);
    return {
      success: false,
      error: error.message || "Error al cerrar el turno de caja",
    };
  }
}

/**
 * Obtiene el resumen detallado y auditado de un turno de caja específico
 */
export async function getCashShiftSummary(shiftId: string) {
  try {
    const shift = await prisma.cashShift.findUnique({
      where: { id: shiftId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        movements: { orderBy: { createdAt: "desc" } },
        sales: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            ticketCode: true,
            customerName: true,
            total: true,
            createdAt: true,
            payments: {
              select: { method: true, amount: true, receivedAmount: true, change: true },
            },
          },
        },
      },
    });

    if (!shift) {
      return { success: false, error: "Turno no encontrado" };
    }

    const totals = await calculateCashShiftTotals(shift.id);
    const receipt = await generateCashShiftReceiptPayload(shift.id);

    return {
      success: true,
      data: serializeData(shift),
      totals,
      receipt,
    };
  } catch (error: any) {
    console.error("Error en getCashShiftSummary:", error);
    return {
      success: false,
      error: error.message || "Error al obtener resumen de turno",
    };
  }
}

/**
 * Lista turnos de caja para el historial de auditoría
 */
export async function listCashShifts(input?: ListCashShiftsInput) {
  try {
    const canAudit = await hasPermission("caja.auditoria_historial");
    if (!canAudit) {
      return {
        success: false,
        error: "No tienes permisos para consultar la auditoría e historial de cajas (caja.auditoria_historial)",
        data: [],
        totalCount: 0,
      };
    }

    const validated = ListCashShiftsSchema.parse(input ?? {});

    const where: Prisma.CashShiftWhereInput = {};
    if (validated.terminalId) where.terminalId = validated.terminalId;
    if (validated.status) where.status = validated.status;

    const [shifts, totalCount] = await Promise.all([
      prisma.cashShift.findMany({
        where,
        orderBy: { openedAt: "desc" },
        take: validated.limit,
        skip: validated.offset,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { sales: true, movements: true } },
        },
      }),
      prisma.cashShift.count({ where }),
    ]);

    return {
      success: true,
      items: serializeData(shifts),
      totalCount,
      limit: validated.limit,
      offset: validated.offset,
    };
  } catch (error: any) {
    console.error("Error en listCashShifts:", error);
    return {
      success: false,
      error: error.message || "Error al listar turnos de caja",
    };
  }
}

/**
 * Retorna los cajeros disponibles o miembros del equipo para selección ágil en la UI
 */
export async function getCashiersList() {
  try {
    const existingUsers = await prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });

    const defaultNames = [
      "Cajero 1",
      "Cajero Mostrador",
    ];

    return {
      success: true,
      users: serializeData(existingUsers),
      defaultNames,
    };
  } catch (error: any) {
    console.error("Error en getCashiersList:", error);
    return {
      success: false,
      users: [],
      defaultNames: ["Cajero Mostrador 1", "Cajero Mostrador 2"],
    };
  }
}
