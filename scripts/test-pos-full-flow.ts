import { prisma } from "../src/lib/prisma";
import {
  createPendingSale,
  getPendingSales,
  completePendingSale,
  cancelPendingSale,
  searchPosProducts,
} from "../src/server/actions/posSaleActions";

async function testPosLifecycle() {
  console.log("================================================================================");
  console.log("🚀 TEST DE INTEGRACIÓN: FLUJO COMPLETO POS PREVENTA Y COBRO (TERMINAL 1 Y 2)");
  console.log("================================================================================");

  // 1. Buscar una variante con stock disponible en salón
  const variant = await prisma.productVariant.findFirst({
    where: {
      stockStore: { gt: 2 },
      product: { active: true },
    },
    include: { product: true },
  });

  if (!variant) {
    console.error("❌ No se encontró una variante con stockStore > 2 para la prueba.");
    process.exit(1);
  }

  console.log(`\n1. Variante seleccionada para prueba:`);
  console.log(`   - Producto: ${variant.product.name}`);
  console.log(`   - Talle: ${variant.size} | Color: ${variant.color}`);
  console.log(`   - Stock Salón inicial: ${variant.stockStore}`);
  console.log(`   - Stock Reservado inicial: ${variant.stockReserved}`);

  const initialStockStore = variant.stockStore;
  const initialStockReserved = variant.stockReserved;
  const unitPrice = Number(variant.price ?? variant.product.price);

  // 2. Crear Preventa en Salón (Terminal 1) con 1 unidad y 10% de descuento
  console.log(`\n2. Creando Preventa en Salón (Terminal 1)...`);
  const createRes = await createPendingSale({
    customerName: "Cliente Prueba POS",
    notes: "Preventa Salón 1 test",
    items: [
      {
        variantId: variant.id,
        quantity: 1,
        originalPrice: unitPrice,
        unitPrice: Math.round(unitPrice * 0.9 * 100) / 100,
        discountAmount: Math.round(unitPrice * 0.1 * 100) / 100,
        discountType: "PERCENTAGE",
        discountValue: 10,
      },
    ],
  });

  if (!createRes.success || !createRes.data) {
    console.error("❌ Error al crear preventa:", createRes.error);
    process.exit(1);
  }

  const saleData = createRes.data as any;
  console.log(`   ✅ Preventa generada:`);
  console.log(`      - ID: ${saleData.saleId}`);
  console.log(`      - Ticket: ${saleData.ticketCode}`);
  console.log(`      - Total Neto: $ ${saleData.totalNet}`);

  // 3. Verificar que stockReserved aumentó en 1 y stockStore no cambió todavía
  const variantAfterReserve = await prisma.productVariant.findUnique({
    where: { id: variant.id },
  });
  if (!variantAfterReserve) throw new Error("Variante no encontrada");

  console.log(`\n3. Verificando bloqueo atómico de stock:`);
  console.log(`   - Stock Salón actual: ${variantAfterReserve.stockStore} (esperado: ${initialStockStore})`);
  console.log(`   - Stock Reservado actual: ${variantAfterReserve.stockReserved} (esperado: ${initialStockReserved + 1})`);

  if (variantAfterReserve.stockReserved !== initialStockReserved + 1) {
    console.error("❌ Falló la reserva de stock preventivo.");
    process.exit(1);
  }
  console.log("   ✅ Reserva de stock verificada correctamente.");

  // 4. Verificar que aparece en getPendingSales() para la Terminal 2 (Caja)
  console.log(`\n4. Consultando preventas pendientes en Caja Mostrador...`);
  const pendingRes = await getPendingSales();
  if (!pendingRes.success || !pendingRes.data) {
    console.error("❌ Error al consultar preventas pendientes:", pendingRes.error);
    process.exit(1);
  }

  const pendingList = pendingRes.data as any[];
  const foundTicket = pendingList.find((s) => s.id === saleData.saleId);
  if (!foundTicket) {
    console.error(`❌ La preventa ${saleData.ticketCode} no figura en la lista de caja.`);
    process.exit(1);
  }
  console.log(`   ✅ Preventa ${foundTicket.ticketCode} recibida en Caja Mostrador.`);

  // 5. Cobrar la preventa en Caja (Terminal 2) con Efectivo y vuelto
  console.log(`\n5. Cobrando la preventa en Caja Mostrador (Terminal 2)...`);
  const totalToPay = Number(foundTicket.total);
  const paidCash = Math.ceil(totalToPay / 1000) * 1000; // redondear hacia arriba para calcular vuelto

  const completeRes = await completePendingSale({
    saleId: saleData.saleId,
    payments: [
      {
        method: "EFECTIVO",
        amount: totalToPay,
        receivedAmount: paidCash,
      },
    ],
  });

  if (!completeRes.success || !completeRes.data) {
    console.error("❌ Error al cobrar preventa:", completeRes.error);
    process.exit(1);
  }

  const completedData = completeRes.data as any;
  console.log(`   ✅ Venta cobrada con éxito:`);
  console.log(`      - Comprobante: ${completedData.invoiceNumber}`);
  console.log(`      - Estado: ${completedData.status}`);
  console.log(`      - Vuelto calculado: $ ${(paidCash - totalToPay).toFixed(2)}`);

  // 6. Verificar que stockStore se decrementó, stockReserved se liberó, y se registró InventoryMovement
  const variantFinal = await prisma.productVariant.findUnique({
    where: { id: variant.id },
  });
  if (!variantFinal) throw new Error("Variante no encontrada");

  console.log(`\n6. Verificando impacto definitivo en inventario:`);
  console.log(`   - Stock Salón final: ${variantFinal.stockStore} (esperado: ${initialStockStore - 1})`);
  console.log(`   - Stock Reservado final: ${variantFinal.stockReserved} (esperado: ${initialStockReserved})`);

  if (variantFinal.stockStore !== initialStockStore - 1 || variantFinal.stockReserved !== initialStockReserved) {
    console.error("❌ Error en la baja definitiva de stock.");
    process.exit(1);
  }

  const movement = await prisma.inventoryMovement.findFirst({
    where: {
      variantId: variant.id,
      type: "VENTA_MOSTRADOR",
      reason: { contains: completedData.invoiceNumber },
    },
  });

  if (!movement) {
    console.error("❌ No se encontró el movimiento de auditoría en InventoryMovement.");
    process.exit(1);
  }
  console.log(`   ✅ Movimiento de inventario auditado: "${movement.reason}" (-${movement.quantity} un.)`);

  console.log("\n================================================================================");
  console.log("🎉 FLUJO COMPLETO POS PROBADO CON ÉXITO AL 100%");
  console.log("================================================================================");
}

testPosLifecycle()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
