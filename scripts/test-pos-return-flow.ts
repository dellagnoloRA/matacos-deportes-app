import { prisma } from "../src/lib/prisma";
import {
  createPendingExchangeSale,
  completePendingSale,
  getPendingSales,
} from "../src/server/actions/posSaleActions";
import { parseExchangeDetails } from "../src/components/dashboard/PosTransactionHistoryView";
import { openCashShift, getCurrentCashShift } from "../src/server/actions/cashShiftActions";

async function testPosReturnFlow() {
  console.log("================================================================================");
  console.log("🧪 TEST INTEGRAL: FLUJO DE DEVOLUCIÓN Y CAMBIO EN PREVENTA (SALÓN -> CAJA)");
  console.log("================================================================================");

  // 1. Obtener dos variantes de prueba
  const variants = await prisma.productVariant.findMany({
    where: {
      stockStore: { gt: 1 },
      product: { active: true },
    },
    include: { product: true },
    take: 2,
  });

  if (variants.length < 2) {
    console.error("❌ Se necesitan al menos 2 variantes activas para probar el flujo.");
    process.exit(1);
  }

  const [returnVariant, exchangeVariant] = variants;
  console.log(`\n1. Prenda a devolver: ${returnVariant.product.name} (Talle ${returnVariant.size})`);
  console.log(`   - Stock inicial en salón: ${returnVariant.stockStore}`);
  console.log(`2. Prenda de cambio (para test 2): ${exchangeVariant.product.name} (Talle ${exchangeVariant.size})`);
  console.log(`   - Stock inicial en salón: ${exchangeVariant.stockStore}`);

  // Asegurar turno de caja abierto para cobrar/procesar en Caja
  const currentShiftRes = await getCurrentCashShift("TERMINAL_2_CAJA");
  let shiftId: string;
  if (!currentShiftRes.activeShift) {
    console.log("\nAbriendo turno de caja en TERMINAL_2_CAJA...");
    const openRes = await openCashShift({
      terminalId: "TERMINAL_2_CAJA",
      initialAmount: 10000,
      userName: "Cajero Test",
    });
    if (!openRes.success || !openRes.data) {
      console.error("❌ No se pudo abrir turno de caja:", openRes.error);
      process.exit(1);
    }
    shiftId = (openRes.data as any).id;
  } else {
    shiftId = (currentShiftRes.activeShift as any).id;
  }
  console.log(`Turno de caja activo: ${shiftId}`);

  // --------------------------------------------------------------------------
  // PARTE A: DEVOLUCIÓN PURA (operationType: "RETURN", sin exchangeVariantId)
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("CASO 1: DEVOLUCIÓN DE PRENDA EN SALÓN (SIN PRENDA DE CAMBIO REQUERIDA)");
  console.log("--------------------------------------------------------------------------------");

  const initialReturnStock = returnVariant.stockStore;

  const returnPayload = {
    operationType: "RETURN" as const,
    returnVariantId: returnVariant.id,
    quantity: 1,
    reason: "Prenda con falla de costura de fábrica",
    customerName: "Juan Pérez Devolución",
  };

  const createReturnRes = await createPendingExchangeSale(returnPayload);
  if (!createReturnRes.success || !createReturnRes.data) {
    console.error("❌ Error al crear preventa de devolución:", createReturnRes.error);
    process.exit(1);
  }

  const returnSale = createReturnRes.data as any;
  console.log("✅ Preventa de devolución generada exitosamente:");
  console.log(`   - ID: ${returnSale.saleId}`);
  console.log(`   - Ticket: ${returnSale.ticketCode}`);
  console.log(`   - Total a cobrar: $ ${returnSale.totalNet} (Esperado: 0)`);
  console.log(`   - Monto a reintegrar: $ ${returnSale.subtotalGross}`);
  console.log(`   - Notas: ${returnSale.notes}`);

  if (returnSale.totalNet !== 0) {
    console.error(`❌ El totalNet de la devolución debió ser 0, pero fue ${returnSale.totalNet}`);
    process.exit(1);
  }

  // Validar parseExchangeDetails
  const parsedReturn = parseExchangeDetails(returnSale.notes);
  console.log("\nVerificando parseExchangeDetails para devolución:");
  console.log(`   - isReturn: ${parsedReturn?.isReturn}`);
  console.log(`   - reason: ${parsedReturn?.reason}`);
  console.log(`   - returnedItem: ${parsedReturn?.returnedItem}`);
  console.log(`   - financialSummary: ${parsedReturn?.financialSummary}`);

  if (!parsedReturn?.isReturn) {
    console.error("❌ parseExchangeDetails no reconoció la devolución.");
    process.exit(1);
  }

  // Verificar presencia en getPendingSales
  const pendingRes = await getPendingSales();
  const foundDevTicket = pendingRes.data?.find((s: any) => s.id === returnSale.saleId);
  if (!foundDevTicket) {
    console.error("❌ El ticket de devolución no apareció en getPendingSales.");
    process.exit(1);
  }
  console.log(`✅ Ticket ${foundDevTicket.ticketCode} visible en Caja Mostrador como preventa pendiente.`);

  // Completar devolución en Caja
  console.log("\nConfirmando devolución en Caja Mostrador (reingreso de prenda y reintegro)...");
  const completeReturnRes = await completePendingSale({
    saleId: returnSale.saleId,
    cashShiftId: shiftId,
    terminalId: "TERMINAL_2_CAJA",
    payments: [{ method: "EFECTIVO", amount: 0 }],
  });

  if (!completeReturnRes.success || !completeReturnRes.data) {
    console.error("❌ Error al completar devolución:", completeReturnRes.error);
    process.exit(1);
  }

  console.log(`✅ Devolución completada. Comprobante: ${(completeReturnRes.data as any).invoiceNumber}`);

  // Verificar que el stock en salón subió en 1
  const updatedReturnVariant = await prisma.productVariant.findUnique({
    where: { id: returnVariant.id },
  });
  console.log(`   - Stock previo en salón: ${initialReturnStock}`);
  console.log(`   - Stock actual en salón: ${updatedReturnVariant?.stockStore} (Esperado: ${initialReturnStock + 1})`);

  if (updatedReturnVariant?.stockStore !== initialReturnStock + 1) {
    console.error("❌ El stock en salón de la prenda devuelta no se incrementó.");
    process.exit(1);
  }

  // Verificar movimiento de inventario DEVOLUCION_CLIENTE
  const inventoryMovement = await prisma.inventoryMovement.findFirst({
    where: {
      variantId: returnVariant.id,
      type: "DEVOLUCION_CLIENTE",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!inventoryMovement) {
    console.error("❌ No se encontró el movimiento de auditoría DEVOLUCION_CLIENTE.");
    process.exit(1);
  }
  console.log(`✅ Movimiento de inventario auditado: "${inventoryMovement.reason}"`);

  // --------------------------------------------------------------------------
  // PARTE B: CAMBIO DE PRENDA TRADICIONAL (operationType: "EXCHANGE")
  // --------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("CASO 2: CAMBIO DE PRENDA EN SALÓN (ENTREGA DE NUEVO ARTÍCULO)");
  console.log("--------------------------------------------------------------------------------");

  const initialExStock = exchangeVariant.stockStore;
  const initialExReserved = exchangeVariant.stockReserved;

  const exchangePayload = {
    operationType: "EXCHANGE" as const,
    returnVariantId: returnVariant.id,
    exchangeVariantId: exchangeVariant.id,
    quantity: 1,
    reason: "Cambio de talle / color a pedido del cliente",
    customerName: "María López Cambio",
  };

  const createExchangeRes = await createPendingExchangeSale(exchangePayload);
  if (!createExchangeRes.success || !createExchangeRes.data) {
    console.error("❌ Error al crear preventa de cambio:", createExchangeRes.error);
    process.exit(1);
  }

  const exchangeSale = createExchangeRes.data as any;
  console.log("✅ Preventa de cambio generada:");
  console.log(`   - Ticket: ${exchangeSale.ticketCode}`);
  console.log(`   - Diferencia a cobrar: $ ${exchangeSale.totalNet}`);

  // Verificar que la prenda entregada se reservó preventivamente
  const exVariantAfterReserve = await prisma.productVariant.findUnique({
    where: { id: exchangeVariant.id },
  });
  console.log(`   - Stock reservado de prenda nueva: ${exVariantAfterReserve?.stockReserved} (Esperado: ${initialExReserved + 1})`);
  if (exVariantAfterReserve?.stockReserved !== initialExReserved + 1) {
    console.error("❌ La prenda entregada no reservó stock.");
    process.exit(1);
  }

  // Completar cambio en Caja
  const completeExchangeRes = await completePendingSale({
    saleId: exchangeSale.saleId,
    cashShiftId: shiftId,
    terminalId: "TERMINAL_2_CAJA",
    payments: [{ method: "EFECTIVO", amount: exchangeSale.totalNet }],
  });

  if (!completeExchangeRes.success) {
    console.error("❌ Error al completar cambio en caja:", completeExchangeRes.error);
    process.exit(1);
  }
  console.log(`✅ Cambio completado en caja exitosamente.`);

  console.log("\n================================================================================");
  console.log("🎉 TODOS LOS CASOS DE TEST PASARON SATISFACTORIAMENTE (100% OK)");
  console.log("================================================================================");
}

testPosReturnFlow()
  .catch((err) => {
    console.error("Error fatal en test:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
