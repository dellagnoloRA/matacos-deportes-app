import { prisma } from "../src/lib/prisma";
import { createGuestOrder, releaseExpiredWebOrders } from "../src/server/actions/ecommerce/checkoutActions";
import { createMercadoPagoPreference, processMercadoPagoPayment } from "../src/server/actions/ecommerce/mercadopagoActions";
import { WEB_ORDER_RESERVATION_MINUTES } from "../src/types/ecommerce";
import { Payment, PaymentRefund } from "../src/lib/mercadopago";

async function runTicket01Tests() {
  console.log("================================================================================");
  console.log("🧪 TEST SUITE: TICKET 01 — EXPIRACIÓN DE RESERVAS, CRON Y SALVAGUARDA DE PAGO");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Detalle: ${detail}`);
      failed++;
    }
  }

  // 0. Buscar variante con stock disponible para las pruebas
  const testVariant = await prisma.productVariant.findFirst({
    where: {
      product: { active: true },
      stockStore: { gte: 10 },
    },
    include: { product: true },
  });

  if (!testVariant) {
    console.error("❌ Se requiere al menos una variante activa con stockStore >= 10");
    process.exit(1);
  }

  console.log(`📦 Variante para pruebas: ${testVariant.product.name} (Talle ${testVariant.size})`);
  console.log(`   Stock Inicial: Salón=${testVariant.stockStore}, Reservado=${testVariant.stockReserved}\n`);

  const createdSaleIds: string[] = [];
  const originalPaymentGet = Payment.prototype.get;
  const originalRefundTotal = PaymentRefund.prototype.total;

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Creación de Orden Web con reservedUntil (TTL de 15 minutos)
    // --------------------------------------------------------------------------
    console.log("🔹 1. Creación de Orden Web y asignación de TTL");

    const initialReserved = testVariant.stockReserved;

    const orderRes = await createGuestOrder({
      customerName: "Ricardo Dellagnolo",
      customerDni: "45.817.894",
      customerEmail: "ricardo.test@matacosdeportes.com",
      customerPhone: "3704223344",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: testVariant.id, quantity: 2 }],
    });

    assert(orderRes.success && Boolean(orderRes.data), "Orden web creada exitosamente");
    const orderCode = orderRes.data!.orderCode;
    const saleId = orderRes.data!.saleId;
    createdSaleIds.push(saleId);

    const saleInDb = await prisma.sale.findUnique({
      where: { id: saleId },
    });

    assert(Boolean(saleInDb?.reservedUntil), "La orden cuenta con campo reservedUntil persistido");
    if (saleInDb?.reservedUntil) {
      const diffMinutes = (saleInDb.reservedUntil.getTime() - saleInDb.createdAt.getTime()) / (60 * 1000);
      assert(
        Math.abs(diffMinutes - WEB_ORDER_RESERVATION_MINUTES) < 0.1,
        `reservedUntil refleja exactamente ${WEB_ORDER_RESERVATION_MINUTES} minutos (+/- 6s)`
      );
    }

    const updatedVariant1 = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    assert(
      (updatedVariant1?.stockReserved || 0) === initialReserved + 2,
      `stockReserved se incrementó en +2 (Esperado: ${initialReserved + 2}, Obtenido: ${updatedVariant1?.stockReserved})`
    );

    // --------------------------------------------------------------------------
    // TEST 2: Expiración preventiva en Preferencia de Mercado Pago
    // --------------------------------------------------------------------------
    console.log("\n🔹 2. Configuración de Expiración Preventiva en Mercado Pago");

    const prefRes = await createMercadoPagoPreference(orderCode);
    assert(prefRes.success && Boolean(prefRes.data), "Preferencia de Mercado Pago creada con éxito");

    if (prefRes.data) {
      assert(
        Boolean(prefRes.data.expiresAt),
        `Preferencia devuelve expiresAt en ISO 8601: ${prefRes.data.expiresAt}`
      );
    }

    // --------------------------------------------------------------------------
    // TEST 3: Cron de Liberación — Órdenes no vencidas NO deben liberarse
    // --------------------------------------------------------------------------
    console.log("\n🔹 3. Verificación de No-Liberación prematura por Cron");

    const prematureCron = await releaseExpiredWebOrders(WEB_ORDER_RESERVATION_MINUTES);
    assert(prematureCron.success, "Ejecución de releaseExpiredWebOrders exitosa");

    const saleStillPending = await prisma.sale.findUnique({ where: { id: saleId } });
    assert(
      saleStillPending?.status === "PENDIENTE_PAGO",
      "La orden reciente permanece PENDIENTE_PAGO (no expirada)"
    );

    // --------------------------------------------------------------------------
    // TEST 4: Cron de Liberación — Órdenes vencidas se cancelan y devuelven stock
    // --------------------------------------------------------------------------
    console.log("\n🔹 4. Expiración real y liberación atómica de stock");

    // Simulamos que pasaron los 15 minutos modificando reservedUntil al pasado
    const pastDate = new Date(Date.now() - 20 * 60 * 1000);
    await prisma.sale.update({
      where: { id: saleId },
      data: {
        createdAt: pastDate,
        reservedUntil: pastDate,
      },
    });

    const cronRelease = await releaseExpiredWebOrders(WEB_ORDER_RESERVATION_MINUTES);
    assert(cronRelease.success, "Cron de liberación ejecutado con éxito");
    assert(
      (cronRelease.data?.releasedOrdersCount || 0) >= 1,
      `Al menos 1 orden fue liberada (Liberadas: ${cronRelease.data?.releasedOrdersCount})`
    );
    assert(
      cronRelease.data?.releasedOrderCodes.includes(orderCode) ?? false,
      `La orden ${orderCode} fue identificada y cancelada por el cron`
    );

    const saleExpired = await prisma.sale.findUnique({ where: { id: saleId } });
    assert(saleExpired?.status === "CANCELADA", "Estado de la orden transicionó a CANCELADA");
    assert(
      saleExpired?.notes?.includes("AUTO-EXPIRACIÓN") ?? false,
      "Notas registran la auditoría de auto-expiración"
    );

    const variantAfterRelease = await prisma.productVariant.findUnique({
      where: { id: testVariant.id },
    });
    assert(
      (variantAfterRelease?.stockReserved || 0) === initialReserved,
      `stockReserved retornó al valor inicial (Esperado: ${initialReserved}, Obtenido: ${variantAfterRelease?.stockReserved})`
    );

    const movement = await prisma.inventoryMovement.findFirst({
      where: {
        variantId: testVariant.id,
        type: "RESERVA_EXPIRADA",
      },
      orderBy: { createdAt: "desc" },
    });
    assert(Boolean(movement), "Se generó registro auditable InventoryMovement con tipo RESERVA_EXPIRADA");

    // --------------------------------------------------------------------------
    // TEST 5: Pago Tardío de Orden Cancelada con Stock Físico Disponible (Rescate)
    // --------------------------------------------------------------------------
    console.log("\n🔹 5. Pago tardío post-expiración con stock físico disponible (Rescate)");

    // Creamos mock para Payment.get
    Payment.prototype.get = async function ({ id }: { id: string }) {
      return {
        id: Number(id),
        status: "approved",
        external_reference: saleId,
        transaction_amount: 10000,
        payment_method_id: "visa",
        installments: 1,
      } as any;
    };

    const rescueResult = await processMercadoPagoPayment("99990001");
    assert(rescueResult.success, "Procesamiento de webhook post-expiración completado");
    assert(rescueResult.status === "approved", "Orden rescatada exitosamente con estado approved");

    const saleRescued = await prisma.sale.findUnique({ where: { id: saleId } });
    assert(saleRescued?.status === "COMPLETADA", "Estado final de la orden rescatada es COMPLETADA");
    assert(
      saleRescued?.notes?.includes("RESCATE DE ORDEN") ?? false,
      "Auditoría registra nota de rescate por stock remanente"
    );

    // --------------------------------------------------------------------------
    // TEST 6: Salvaguarda Reactiva — Pago Tardío SIN Stock Físico (Fail-Safe & Refund)
    // --------------------------------------------------------------------------
    console.log("\n🔹 6. Salvaguarda Reactiva: Pago tardío post-expiración SIN stock físico (Refund)");

    // Creamos una segunda orden con variante agotada físicamente
    const zeroStockOrderRes = await createGuestOrder({
      customerName: "Cliente Afectado",
      customerDni: "30.999.888",
      customerEmail: "cliente.sin.stock@matacosdeportes.com",
      customerPhone: "3704998877",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: testVariant.id, quantity: 1 }],
    });

    const zeroSaleId = zeroStockOrderRes.data!.saleId;
    createdSaleIds.push(zeroSaleId);

    // Cancelamos la orden simulando expiración
    await prisma.sale.update({
      where: { id: zeroSaleId },
      data: { status: "CANCELADA", notes: "[AUTO-EXPIRACIÓN] Reserva vencida" },
    });
    // Liberamos el stockReserved
    await prisma.productVariant.update({
      where: { id: testVariant.id },
      data: { stockReserved: { decrement: 1 } },
    });

    // Simulamos que el salón vendió TODO el stock físico remanente (stockStore = 0, stockWarehouse = 0)
    const prevStockStore = (await prisma.productVariant.findUnique({ where: { id: testVariant.id } }))?.stockStore || 0;
    await prisma.productVariant.update({
      where: { id: testVariant.id },
      data: { stockStore: 0, stockWarehouse: 0 },
    });

    // Mockeamos Payment.get para el pago tardío
    Payment.prototype.get = async function ({ id }: { id: string }) {
      return {
        id: Number(id),
        status: "approved",
        external_reference: zeroSaleId,
        transaction_amount: 15000,
        payment_method_id: "master",
        installments: 1,
      } as any;
    };

    // Mockeamos PaymentRefund.total para validar que el SDK fue invocado
    let refundCalled = false;
    let refundedPaymentId: string | null = null;
    PaymentRefund.prototype.total = async function ({ payment_id }: { payment_id: string | number }) {
      refundCalled = true;
      refundedPaymentId = String(payment_id);
      return { id: 123456, status: "approved" } as any;
    };

    const failSafeResult = await processMercadoPagoPayment("99990002");

    assert(
      failSafeResult.status === "refunded_due_to_stock_shortage",
      "Webhook detectó sobreventa tardía y activó status refunded_due_to_stock_shortage"
    );
    assert(refundCalled, "SDK PaymentRefund.total() fue invocado automáticamente");
    assert(refundedPaymentId === "99990002", "Reembolso emitido para el ID de pago correcto (99990002)");

    const zeroSaleAfter = await prisma.sale.findUnique({ where: { id: zeroSaleId } });
    assert(zeroSaleAfter?.status === "CANCELADA", "La orden permanece como CANCELADA (no se comprometió el inventario)");
    assert(
      zeroSaleAfter?.notes?.includes("FAIL-SAFE REEMBOLSO") ?? false,
      "Notas registran la emisión del reembolso automático por sobreventa"
    );

    // Restaurar stock original de la variante para no alterar el seed
    await prisma.productVariant.update({
      where: { id: testVariant.id },
      data: { stockStore: prevStockStore },
    });

  } finally {
    // Restaurar mocks originales
    Payment.prototype.get = originalPaymentGet;
    PaymentRefund.prototype.total = originalRefundTotal;

    // Limpieza de datos de prueba
    console.log("\n🧹 Limpieza de registros de prueba en BD...");
    for (const sid of createdSaleIds) {
      await prisma.salePayment.deleteMany({ where: { saleId: sid } }).catch(() => {});
      await prisma.saleItem.deleteMany({ where: { saleId: sid } }).catch(() => {});
      await prisma.sale.delete({ where: { id: sid } }).catch(() => {});
    }
    console.log("   Limpieza completada.");
  }

  console.log("\n================================================================================");
  console.log(`📊 RESULTADOS: ${passed} pasados, ${failed} fallidos`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTicket01Tests()
  .catch((e) => {
    console.error("❌ Error no controlado durante la ejecución de pruebas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
