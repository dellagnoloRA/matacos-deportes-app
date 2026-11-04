import { prisma } from "@/lib/prisma";
import { companyConfig } from "@/config/company";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export interface CashShiftConsolidatedTotals {
  initialAmount: number;
  cashPaymentsTotal: number;
  debitPaymentsTotal: number;
  creditPaymentsTotal: number;
  transferPaymentsTotal: number;
  qrPaymentsTotal: number;
  salesCount: number;
  salesTotal: number;
  extraordinaryIncome: number;
  vaultWithdrawals: number;
  minorExpenses: number;
  auditAdjustments: number;
  totalIncomeMovements: number;
  totalExpenseMovements: number;
  expectedCash: number;
  expectedDebit: number;
  expectedCredit: number;
  expectedTransfer: number;
  expectedQr: number;
  currentAvailableCash: number;
}

export interface BlindAuditComparison {
  expectedCash: number;
  actualCash: number;
  differenceCash: number;
  isCashBalanced: boolean;
  expectedDebit: number;
  actualDebit: number;
  differenceDebit: number;
  expectedCredit: number;
  actualCredit: number;
  differenceCredit: number;
  expectedTransfer: number;
  actualTransfer: number;
  differenceTransfer: number;
  expectedQr: number;
  actualQr: number;
  differenceQr: number;
  hasSignificantDifference: boolean;
}

export interface CashShiftTicketReceipt {
  company: {
    name: string;
    tradeName: string;
    address: string;
    city: string;
    phone: string;
    cuit: string;
    ivaCondition: string;
  };
  shift: {
    id: string;
    terminalId: string;
    cashierName: string;
    status: string;
    openedAt: string;
    closedAt: string | null;
    initialAmountFormatted: string;
    notes: string | null;
  };
  summary: {
    salesCount: number;
    salesTotalFormatted: string;
    byPaymentMethod: Array<{
      method: string;
      label: string;
      expected: number;
      actual: number;
      difference: number;
      expectedFormatted: string;
      actualFormatted: string;
      differenceFormatted: string;
    }>;
    movements: Array<{
      type: string;
      reason: string;
      amountFormatted: string;
      performedBy: string;
      receiptNumber: string | null;
      time: string;
    }>;
    cashBalance: {
      initialFormatted: string;
      cashSalesFormatted: string;
      cashIncomeFormatted: string;
      cashExpensesFormatted: string;
      expectedCashFormatted: string;
      actualCashFormatted: string;
      differenceCashFormatted: string;
      statusLabel: "CUADRADO" | "SOBRANTE" | "FALTANTE";
    };
  };
}

/**
 * Normaliza nombres a un slug alfanumérico limpio
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

/**
 * Asegura la existencia de un usuario en PostgreSQL para asociarlo al turno
 */
export async function ensureUser(
  identifier: { userId?: string | null; userName?: string | null },
  tx?: Prisma.TransactionClient | typeof prisma
) {
  const db = tx || prisma;

  if (identifier.userId) {
    const existing = await db.user.findUnique({
      where: { id: identifier.userId },
    });
    if (existing) return existing;
  }

  const name = identifier.userName?.trim();
  if (!name) {
    throw new Error("Se debe proveer un ID de usuario o un nombre de cajero válido.");
  }

  // Buscar por nombre exacto o similar
  const existingByName = await db.user.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
    },
  });

  if (existingByName) {
    return existingByName;
  }

  // Crear usuario con rol CAJERO
  const slug = slugify(name);
  const email = `${slug || "cajero"}@matacos.local`;

  return await db.user.upsert({
    where: { email },
    update: { name, active: true },
    create: {
      name,
      email,
      password: "saavedra-caja",
      role: "CAJERO",
      active: true,
    },
  });
}

/**
 * Calcula los totales consolidados y saldo de efectivo esperado de un turno de caja
 */
export async function calculateCashShiftTotals(
  shiftId: string,
  tx?: Prisma.TransactionClient | typeof prisma
): Promise<CashShiftConsolidatedTotals> {
  const db = tx || prisma;

  const shift = await db.cashShift.findUnique({
    where: { id: shiftId },
    include: {
      movements: true,
      sales: {
        where: { status: "COMPLETADA" },
        include: { payments: true },
      },
    },
  });

  if (!shift) {
    throw new Error(`Turno de caja ${shiftId} no encontrado`);
  }

  const initialAmount = Number(shift.initialAmount);

  // 1. Totalizar cobros por método de pago
  let cashPaymentsTotal = 0;
  let debitPaymentsTotal = 0;
  let creditPaymentsTotal = 0;
  let transferPaymentsTotal = 0;
  let qrPaymentsTotal = 0;
  let salesTotal = 0;

  for (const sale of shift.sales) {
    salesTotal += Number(sale.total);
    for (const payment of sale.payments) {
      const amount = Number(payment.amount);
      switch (payment.method) {
        case "EFECTIVO":
          cashPaymentsTotal += amount;
          break;
        case "DEBITO":
          debitPaymentsTotal += amount;
          break;
        case "CREDITO":
          creditPaymentsTotal += amount;
          break;
        case "TRANSFERENCIA":
          transferPaymentsTotal += amount;
          break;
        case "QR_MERCADOPAGO":
          qrPaymentsTotal += amount;
          break;
      }
    }
  }

  // 2. Totalizar movimientos intermedios de caja
  let extraordinaryIncome = 0;
  let vaultWithdrawals = 0;
  let minorExpenses = 0;
  let auditAdjustments = 0;

  for (const mov of shift.movements) {
    const amount = Number(mov.amount);
    switch (mov.type) {
      case "INGRESO_EXTRAORDINARIO":
        extraordinaryIncome += amount;
        break;
      case "RETIRO_CAJA_FUERTE":
        vaultWithdrawals += amount;
        break;
      case "GASTO_MENOR":
        minorExpenses += amount;
        break;
      case "AJUSTE_ARQUEO":
        auditAdjustments += amount;
        break;
    }
  }

  const totalIncomeMovements = extraordinaryIncome;
  const totalExpenseMovements = vaultWithdrawals + minorExpenses;

  // 3. Fórmula canónica del efectivo esperado en cajón:
  // Saldo Inicial + Ventas Efectivo + Ingresos Extraordinarios - Egresos
  const expectedCash = Math.round(
    (initialAmount + cashPaymentsTotal + totalIncomeMovements - totalExpenseMovements) * 100
  ) / 100;

  const currentAvailableCash = expectedCash;

  return {
    initialAmount,
    cashPaymentsTotal: Math.round(cashPaymentsTotal * 100) / 100,
    debitPaymentsTotal: Math.round(debitPaymentsTotal * 100) / 100,
    creditPaymentsTotal: Math.round(creditPaymentsTotal * 100) / 100,
    transferPaymentsTotal: Math.round(transferPaymentsTotal * 100) / 100,
    qrPaymentsTotal: Math.round(qrPaymentsTotal * 100) / 100,
    salesCount: shift.sales.length,
    salesTotal: Math.round(salesTotal * 100) / 100,
    extraordinaryIncome: Math.round(extraordinaryIncome * 100) / 100,
    vaultWithdrawals: Math.round(vaultWithdrawals * 100) / 100,
    minorExpenses: Math.round(minorExpenses * 100) / 100,
    auditAdjustments: Math.round(auditAdjustments * 100) / 100,
    totalIncomeMovements: Math.round(totalIncomeMovements * 100) / 100,
    totalExpenseMovements: Math.round(totalExpenseMovements * 100) / 100,
    expectedCash,
    expectedDebit: Math.round(debitPaymentsTotal * 100) / 100,
    expectedCredit: Math.round(creditPaymentsTotal * 100) / 100,
    expectedTransfer: Math.round(transferPaymentsTotal * 100) / 100,
    expectedQr: Math.round(qrPaymentsTotal * 100) / 100,
    currentAvailableCash,
  };
}

/**
 * Valida si un egreso no excede el efectivo disponible en caja
 */
export function validateCashWithdrawal(currentAvailableCash: number, requestedAmount: number) {
  if (requestedAmount <= 0) {
    throw new Error("El monto del movimiento debe ser superior a $ 0,00.");
  }
  // Tolerancia de 0.05 para redondeo de centavos
  if (requestedAmount > currentAvailableCash + 0.05) {
    throw new Error(
      `Fondo insuficiente en caja: El egreso solicitado (${formatCurrency(
        requestedAmount
      )}) supera el efectivo físico disponible en el cajón (${formatCurrency(
        currentAvailableCash
      )}).`
    );
  }
}

/**
 * Umbral canónico de tolerancia en Pesos Argentinos (ARS) para arqueo ciego.
 * Si el desvío absoluto en efectivo (|actualCash - expectedCash|) supera este valor,
 * el sistema exige obligatoriamente una nota justificativa para cerrar la caja.
 */
export const CASH_AUDIT_TOLERANCE_THRESHOLD = 5000;

/**
 * Compara los valores reales declarados en el arqueo ciego contra los esperados
 */
export function compareBlindAudit(
  expected: CashShiftConsolidatedTotals,
  actual: {
    actualCash: number;
    actualDebit?: number | null;
    actualCredit?: number | null;
    actualTransfer?: number | null;
    actualQr?: number | null;
  }
): BlindAuditComparison {
  const actualCash = actual.actualCash;
  const differenceCash = Math.round((actualCash - expected.expectedCash) * 100) / 100;
  const isCashBalanced = Math.abs(differenceCash) <= 0.05;

  const actualDebit = actual.actualDebit ?? expected.expectedDebit;
  const differenceDebit = Math.round((actualDebit - expected.expectedDebit) * 100) / 100;

  const actualCredit = actual.actualCredit ?? expected.expectedCredit;
  const differenceCredit = Math.round((actualCredit - expected.expectedCredit) * 100) / 100;

  const actualTransfer = actual.actualTransfer ?? expected.expectedTransfer;
  const differenceTransfer = Math.round((actualTransfer - expected.expectedTransfer) * 100) / 100;

  const actualQr = actual.actualQr ?? expected.expectedQr;
  const differenceQr = Math.round((actualQr - expected.expectedQr) * 100) / 100;

  // Umbral de tolerancia de $ 5.000,00 para justificación obligatoria
  const hasSignificantDifference = Math.abs(differenceCash) > CASH_AUDIT_TOLERANCE_THRESHOLD;

  return {
    expectedCash: expected.expectedCash,
    actualCash,
    differenceCash,
    isCashBalanced,
    expectedDebit: expected.expectedDebit,
    actualDebit,
    differenceDebit,
    expectedCredit: expected.expectedCredit,
    actualCredit,
    differenceCredit,
    expectedTransfer: expected.expectedTransfer,
    actualTransfer,
    differenceTransfer,
    expectedQr: expected.expectedQr,
    actualQr,
    differenceQr,
    hasSignificantDifference,
  };
}

/**
 * Genera el payload estructurado para ticket de arqueo térmico de 80mm
 */
export async function generateCashShiftReceiptPayload(
  shiftId: string,
  tx?: Prisma.TransactionClient | typeof prisma
): Promise<CashShiftTicketReceipt> {
  const db = tx || prisma;

  const shift = await db.cashShift.findUnique({
    where: { id: shiftId },
    include: {
      user: true,
      movements: { orderBy: { createdAt: "asc" } },
      sales: {
        where: { status: "COMPLETADA" },
        include: { payments: true },
      },
    },
  });

  if (!shift) {
    throw new Error(`Turno de caja ${shiftId} no encontrado para generar comprobante.`);
  }

  const totals = await calculateCashShiftTotals(shiftId, db);

  const actualCash = shift.actualCash !== null ? Number(shift.actualCash) : totals.expectedCash;
  const actualDebit = shift.actualDebit !== null ? Number(shift.actualDebit) : totals.expectedDebit;
  const actualCredit = shift.actualCredit !== null ? Number(shift.actualCredit) : totals.expectedCredit;
  const actualTransfer =
    shift.actualTransfer !== null ? Number(shift.actualTransfer) : totals.expectedTransfer;
  const actualQr = shift.actualQr !== null ? Number(shift.actualQr) : totals.expectedQr;

  const diffCash = shift.differenceCash !== null ? Number(shift.differenceCash) : actualCash - totals.expectedCash;

  let statusLabel: "CUADRADO" | "SOBRANTE" | "FALTANTE" = "CUADRADO";
  if (diffCash > 0.05) statusLabel = "SOBRANTE";
  else if (diffCash < -0.05) statusLabel = "FALTANTE";

  return {
    company: {
      name: companyConfig.legalName,
      tradeName: companyConfig.name,
      address: companyConfig.address,
      city: `${companyConfig.city} (CP ${companyConfig.postalCode})`,
      phone: companyConfig.phone,
      cuit: companyConfig.cuit,
      ivaCondition: companyConfig.vatCondition,
    },
    shift: {
      id: shift.id,
      terminalId: shift.terminalId,
      cashierName: shift.user?.name || "Cajero Mostrador",
      status: shift.status,
      openedAt: formatDate(shift.openedAt),
      closedAt: shift.closedAt ? formatDate(shift.closedAt) : null,
      initialAmountFormatted: formatCurrency(totals.initialAmount),
      notes: shift.notes,
    },
    summary: {
      salesCount: totals.salesCount,
      salesTotalFormatted: formatCurrency(totals.salesTotal),
      byPaymentMethod: [
        {
          method: "EFECTIVO",
          label: "Efectivo en Ventas",
          expected: totals.cashPaymentsTotal,
          actual: actualCash,
          difference: diffCash,
          expectedFormatted: formatCurrency(totals.cashPaymentsTotal),
          actualFormatted: formatCurrency(actualCash),
          differenceFormatted: formatCurrency(diffCash),
        },
        {
          method: "DEBITO",
          label: "Tarjeta Débito (Posnet)",
          expected: totals.expectedDebit,
          actual: actualDebit,
          difference: Math.round((actualDebit - totals.expectedDebit) * 100) / 100,
          expectedFormatted: formatCurrency(totals.expectedDebit),
          actualFormatted: formatCurrency(actualDebit),
          differenceFormatted: formatCurrency(actualDebit - totals.expectedDebit),
        },
        {
          method: "CREDITO",
          label: "Tarjeta Crédito (Posnet)",
          expected: totals.expectedCredit,
          actual: actualCredit,
          difference: Math.round((actualCredit - totals.expectedCredit) * 100) / 100,
          expectedFormatted: formatCurrency(totals.expectedCredit),
          actualFormatted: formatCurrency(actualCredit),
          differenceFormatted: formatCurrency(actualCredit - totals.expectedCredit),
        },
        {
          method: "TRANSFERENCIA",
          label: "Transferencias Bancarias",
          expected: totals.expectedTransfer,
          actual: actualTransfer,
          difference: Math.round((actualTransfer - totals.expectedTransfer) * 100) / 100,
          expectedFormatted: formatCurrency(totals.expectedTransfer),
          actualFormatted: formatCurrency(actualTransfer),
          differenceFormatted: formatCurrency(actualTransfer - totals.expectedTransfer),
        },
        {
          method: "QR_MERCADOPAGO",
          label: "QR Mercado Pago",
          expected: totals.expectedQr,
          actual: actualQr,
          difference: Math.round((actualQr - totals.expectedQr) * 100) / 100,
          expectedFormatted: formatCurrency(totals.expectedQr),
          actualFormatted: formatCurrency(actualQr),
          differenceFormatted: formatCurrency(actualQr - totals.expectedQr),
        },
      ],
      movements: shift.movements.map((m) => ({
        type: m.type,
        reason: m.reason,
        amountFormatted: formatCurrency(Number(m.amount)),
        performedBy: m.performedBy,
        receiptNumber: m.receiptNumber,
        time: formatDate(m.createdAt),
      })),
      cashBalance: {
        initialFormatted: formatCurrency(totals.initialAmount),
        cashSalesFormatted: formatCurrency(totals.cashPaymentsTotal),
        cashIncomeFormatted: formatCurrency(totals.totalIncomeMovements),
        cashExpensesFormatted: formatCurrency(totals.totalExpenseMovements),
        expectedCashFormatted: formatCurrency(totals.expectedCash),
        actualCashFormatted: formatCurrency(actualCash),
        differenceCashFormatted: formatCurrency(diffCash),
        statusLabel,
      },
    },
  };
}
