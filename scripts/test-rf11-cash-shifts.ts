/**
 * Banco de Pruebas Automatizadas de Backend: RF-11 (Apertura, Arqueo y Cierre de Caja)
 * Ejecutar con: pnpm tsx scripts/test-rf11-cash-shifts.ts
 */

import { prisma } from "../src/lib/prisma";
import {
  openCashShift,
  getCurrentCashShift,
  registerCashMovement,
  closeCashShift,
  getCashShiftSummary,
  listCashShifts,
  getCashiersList,
} from "../src/server/actions/cashShiftActions";
import {
  createPendingSale,
  completePendingSale,
  createDirectSale,
} from "../src/server/actions/posSaleActions";

const TERMINAL_TEST = "TERMINAL_TEST_RF11";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, errorDetail?: any) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (errorDetail) console.error("     Detalle:", errorDetail);
    failedTests++;
  }
}

async function cleanTestEnvironment() {
  // Eliminar turnos y ventas asociadas a la terminal de prueba
  const shifts = await prisma.cashShift.findMany({
    where: { terminalId: TERMINAL_TEST },
    select: { id: true },
  });

  const shiftIds = shifts.map((s) => s.id);
  if (shiftIds.length > 0) {
    await prisma.cashMovement.deleteMany({
      where: { cashShiftId: { in: shiftIds } },
    });
    await prisma.salePayment.deleteMany({
      where: { sale: { cashShiftId: { in: shiftIds } } },
    });
    await prisma.saleItem.deleteMany({
      where: { sale: { cashShiftId: { in: shiftIds } } },
    });
    await prisma.sale.deleteMany({
      where: { cashShiftId: { in: shiftIds } },
    });
    await prisma.cashShift.deleteMany({
      where: { id: { in: shiftIds } },
    });
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  INICIANDO SUITE DE PRUEBAS RF-11: CONTROL DE CAJA");
  console.log("=======================================================\n");

  await cleanTestEnvironment();

  // Obtener una variante de producto real para las pruebas de venta
  let variant = await prisma.productVariant.findFirst({
    where: { stockStore: { gte: 2 } },
    include: { product: true },
  });

  if (!variant) {
    const anyVariant = await prisma.productVariant.findFirst({ include: { product: true } });
    if (!anyVariant) {
      throw new Error(
        "No hay variantes con stock disponible para ejecutar las pruebas. Ejecute 'pnpm db:seed' primero."
      );
    }
    variant = await prisma.productVariant.update({
      where: { id: anyVariant.id },
      data: { stockStore: 50 },
      include: { product: true },
    });
  } else {
    // Asegurar stock para que la prueba se pueda ejecutar repetidamente
    variant = await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stockStore: { increment: 20 } },
      include: { product: true },
    });
  }

  const unitPrice = Number(variant.price ?? variant.product.price);

  // -------------------------------------------------------------------
  // TEST 1: Apertura de Turno con Fondo Inicial y Auto-resolución de Cajero
  // -------------------------------------------------------------------
  console.log("1. Apertura de Turno de Caja (Fondo Inicial)");
  const openRes = await openCashShift({
    terminalId: TERMINAL_TEST,
    userName: "Cajero 1",
    initialAmount: 15000, // $ 15.000,00 de fondo de cambio
    notes: "Apertura turno mañana Saavedra 241",
  });

  assert(openRes.success, "Apertura de turno exitosa", openRes.error);
  assert(
    openRes.data?.status === "ABIERTA",
    "Estado de caja inicial es ABIERTA"
  );
  assert(
    Number(openRes.data?.initialAmount) === 15000,
    "Fondo inicial registrado correctamente ($ 15.000,00)"
  );
  assert(
    openRes.data?.user?.name === "Cajero 1",
    "Cajero asignado y auditado nominalmente: Cajero 1"
  );

  const activeShiftId = openRes.data?.id!;

  // -------------------------------------------------------------------
  // TEST 2: Bloqueo de Concurrencia (No permitir 2 turnos abiertos en misma terminal)
  // -------------------------------------------------------------------
  console.log("\n2. Bloqueo de Apertura Concurrente en la misma Terminal");
  const concurrentOpenRes = await openCashShift({
    terminalId: TERMINAL_TEST,
    userName: "Cajero Mostrador",
    initialAmount: 20000,
  });

  assert(
    !concurrentOpenRes.success,
    "Rechazo de apertura concurrente en terminal ya abierta"
  );
  assert(
    concurrentOpenRes.error?.includes("Ya existe un turno de caja abierto"),
    "Mensaje de error claro de concurrencia de caja"
  );

  // -------------------------------------------------------------------
  // TEST 3: Consulta de Turno Activo y Efectivo Disponible Inicial
  // -------------------------------------------------------------------
  console.log("\n3. Consulta de Turno Activo (getCurrentCashShift)");
  const currentShiftRes = await getCurrentCashShift(TERMINAL_TEST);

  assert(currentShiftRes.success, "Consulta de turno exitosa");
  assert(
    currentShiftRes.activeShift?.id === activeShiftId,
    "ID de turno activo coincide"
  );
  assert(
    currentShiftRes.totals?.expectedCash === 15000,
    "Efectivo disponible inicial es exactamente el fondo de cambio ($ 15.000,00)"
  );

  // -------------------------------------------------------------------
  // TEST 4: Bloqueo Estricto de Cobro en Terminal sin Caja Abierta
  // -------------------------------------------------------------------
  console.log("\n4. Bloqueo Estricto de Cobro sin Turno de Caja");
  const unopenTerminalSaleRes = await createDirectSale({
    terminalId: "TERMINAL_INEXISTENTE_CERRADA",
    customerName: "Cliente Sin Caja",
    items: [
      {
        variantId: variant.id,
        quantity: 1,
        price: unitPrice,
        discount: 0,
      },
    ],
    payments: [{ method: "EFECTIVO", amount: unitPrice }],
  });

  assert(
    !unopenTerminalSaleRes.success,
    "Cobro rechazado cuando no hay caja abierta en la terminal"
  );
  assert(
    unopenTerminalSaleRes.error?.includes("La caja se encuentra cerrada"),
    "Mensaje claro exigiendo abrir caja antes de cobrar"
  );

  // -------------------------------------------------------------------
  // TEST 5: Cobro en Mostrador Asociado al Turno Activo (Ventas Multimétodo)
  // -------------------------------------------------------------------
  console.log("\n5. Procesamiento de Ventas Imputadas al Turno");

  // Venta 1: Directa en mostrador 100% Efectivo ($ 20.000)
  const cashSaleAmount = 20000;
  const directSaleRes = await createDirectSale({
    terminalId: TERMINAL_TEST,
    cashShiftId: activeShiftId,
    customerName: "Juan Pérez (Efectivo)",
    items: [
      {
        variantId: variant.id,
        quantity: 1,
        price: cashSaleAmount,
        discount: 0,
      },
    ],
    payments: [
      {
        method: "EFECTIVO",
        amount: cashSaleAmount,
        receivedAmount: 20000,
      },
    ],
  });

  assert(directSaleRes.success, "Venta directa en efectivo procesada", directSaleRes.error);
  assert(
    directSaleRes.data?.cashShiftId === activeShiftId,
    "Venta imputada correctamente a cashShiftId"
  );

  // Venta 2: Preventa de Salón cobrada en caja con Débito y QR Mercado Pago ($ 30.000 + $ 15.000 = $ 45.000)
  const pendingSaleRes = await createPendingSale({
    sellerId: null,
    customerName: "Cliente Preventa Salón",
    items: [
      {
        variantId: variant.id,
        quantity: 1,
        originalPrice: 45000,
        unitPrice: 45000,
        discountAmount: 0,
      },
    ],
  });

  assert(pendingSaleRes.success, "Preventa en salón creada", pendingSaleRes.error);

  const completeRes = await completePendingSale({
    saleId: pendingSaleRes.data?.saleId!,
    terminalId: TERMINAL_TEST,
    cashShiftId: activeShiftId,
    payments: [
      { method: "DEBITO", amount: 30000, cardBrand: "Visa Débito", cardVoucher: "V-9901" },
      { method: "QR_MERCADOPAGO", amount: 15000, referenceCode: "MP-TR-8812" },
    ],
  });

  assert(completeRes.success, "Preventa cobrada con Débito y QR", completeRes.error);

  // -------------------------------------------------------------------
  // TEST 6: Movimientos Intermedios de Caja (Ingresos y Egresos con Validación)
  // -------------------------------------------------------------------
  console.log("\n6. Movimientos Intermedios de Caja (CashMovement)");

  // 6.1 Ingreso Extraordinario: Aporte extra de cambio de $ 10.000
  const incomeRes = await registerCashMovement({
    cashShiftId: activeShiftId,
    type: "INGRESO_EXTRAORDINARIO",
    amount: 10000,
    reason: "Aporte extra de cambio por dueña",
    performedBy: "Sandra Mujica",
  });

  assert(incomeRes.success, "Ingreso extraordinario registrado ($ 10.000,00)", incomeRes.error);

  // 6.2 Intento de Egreso que supera el saldo en caja (Debe fallar)
  // Efectivo en caja actual: 15.000 (inicial) + 20.000 (venta) + 10.000 (ingreso) = 45.000
  const invalidExpenseRes = await registerCashMovement({
    cashShiftId: activeShiftId,
    type: "GASTO_MENOR",
    amount: 90000, // $ 90.000 supera los $ 45.000 en cajón
    reason: "Retiro excesivo imposible",
    performedBy: "Cajero 1",
  });

  assert(
    !invalidExpenseRes.success,
    "Rechazo de egreso que supera el efectivo físico disponible en cajón"
  );
  assert(
    invalidExpenseRes.error?.includes("Fondo insuficiente en caja"),
    "Mensaje claro de fondo insuficiente"
  );

  // 6.3 Egreso Válido: Pago de flete por $ 5.000 con comprobante
  const validExpenseRes = await registerCashMovement({
    cashShiftId: activeShiftId,
    type: "GASTO_MENOR",
    amount: 5000,
    reason: "Pago de flete encomienda Topper",
    receiptNumber: "FAC-B-0001-00049281",
    performedBy: "Cajero 1",
  });

  assert(validExpenseRes.success, "Egreso válido registrado ($ 5.000,00 flete)", validExpenseRes.error);

  // -------------------------------------------------------------------
  // TEST 7: Consolidación Matemática del Cuaderno de Caja
  // -------------------------------------------------------------------
  console.log("\n7. Consolidación Matemática de Totales Esperados");
  const summaryRes = await getCashShiftSummary(activeShiftId);

  assert(summaryRes.success, "Resumen de turno obtenido exitosamente");
  const totals = summaryRes.totals!;

  // initial (15.000) + cashSales (20.000) + extraIncome (10.000) - expense (5.000) = 40.000
  assert(totals.initialAmount === 15000, "Fondo inicial: $ 15.000,00");
  assert(totals.cashPaymentsTotal === 20000, "Ventas Efectivo: $ 20.000,00");
  assert(totals.debitPaymentsTotal === 30000, "Ventas Débito: $ 30.000,00");
  assert(totals.qrPaymentsTotal === 15000, "Ventas QR Mercado Pago: $ 15.000,00");
  assert(totals.extraordinaryIncome === 10000, "Ingresos Extraordinarios: $ 10.000,00");
  assert(totals.minorExpenses === 5000, "Egresos Menores: $ 5.000,00");
  assert(
    totals.expectedCash === 40000,
    `Efectivo Esperado consolidado exacto: $ 40.000,00 (Actual: $ ${totals.expectedCash})`
  );

  // -------------------------------------------------------------------
  // TEST 8: Arqueo Ciego ("Blind Audit") y Umbral de Justificación
  // -------------------------------------------------------------------
  console.log("\n8. Cierre de Turno y Arqueo Ciego");

  // 8.1 Intento de cierre con desvío > $500 SIN justificación (Debe exigir notas)
  const blindWithoutNotesRes = await closeCashShift({
    cashShiftId: activeShiftId,
    actualCash: 38000, // Faltante de $ 2.000 ($40.000 esperado vs $38.000 contado)
    actualDebit: 30000,
    actualCredit: 0,
    actualTransfer: 0,
    actualQr: 15000,
    notes: "", // Vacío
  });

  assert(
    !blindWithoutNotesRes.success,
    "Rechazo de cierre con diferencia > $500 sin justificación"
  );
  assert(
    blindWithoutNotesRes.error?.includes("Es obligatorio ingresar una justificación"),
    "Validación de campo notas obligatorio ante desvíos"
  );

  // 8.2 Cierre exitoso con arqueo ciego y justificación asentada
  const closeRes = await closeCashShift({
    cashShiftId: activeShiftId,
    actualCash: 39500, // Faltante de $ 500
    actualDebit: 30000,
    actualCredit: 0,
    actualTransfer: 0,
    actualQr: 15000,
    notes: "Diferencia de $ 500 atribuible a cambio de monedas y redondeo en mostrador",
  });

  assert(closeRes.success, "Cierre de turno y arqueo ciego exitoso", closeRes.error);
  assert(closeRes.data?.status === "CERRADA", "Estado del turno actualizado a CERRADA");
  assert(
    Number(closeRes.data?.differenceCash) === -500,
    "Diferencia de caja registrada con precisión: -$ 500,00 (Faltante)"
  );

  // -------------------------------------------------------------------
  // TEST 9: Inmutabilidad de Turno Cerrado
  // -------------------------------------------------------------------
  console.log("\n9. Inmutabilidad de Turno Cerrado");
  const postCloseMovement = await registerCashMovement({
    cashShiftId: activeShiftId,
    type: "GASTO_MENOR",
    amount: 1000,
    reason: "Gasto posterior no permitido",
    performedBy: "Cajero 1",
  });

  assert(
    !postCloseMovement.success,
    "Rechazo de nuevos movimientos en un turno ya cerrado"
  );

  // -------------------------------------------------------------------
  // TEST 10: Emisión de Tique Térmico de Arqueo en 80mm
  // -------------------------------------------------------------------
  console.log("\n10. Comprobante de Arqueo de Caja (80mm)");
  const receipt = closeRes.receipt!;

  assert(Boolean(receipt), "Comprobante de cierre generado");
  assert(
    receipt.company.tradeName === "MATACOS DEPORTES",
    "Comprobante incluye datos oficiales de la empresa"
  );
  assert(
    receipt.shift.cashierName === "Cajero 1",
    "Comprobante audita el nombre del cajero"
  );
  assert(
    receipt.summary.cashBalance.statusLabel === "FALTANTE",
    "Etiqueta de balance físico: FALTANTE"
  );
  assert(
    receipt.summary.byPaymentMethod.length >= 5,
    "Desglose por todos los medios de pago incluido"
  );

  // Limpieza final
  await cleanTestEnvironment();

  console.log("\n=======================================================");
  console.log(`  RESULTADOS: ${passedTests} PASADAS, ${failedTests} FALLADAS`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Error catastrófico en suite de pruebas RF-11:", err);
  process.exit(1);
});
