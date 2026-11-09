import { prisma } from "../src/lib/prisma";
import crypto from "crypto";
import {
  createMercadoPagoPreference,
  processMercadoPagoPayment,
} from "../src/server/actions/ecommerce/mercadopagoActions";
import { createGuestOrder } from "../src/server/actions/ecommerce/checkoutActions";
import { verifyWebhookSignature, Payment } from "../src/lib/mercadopago";

async function runRf16Tests() {
  console.log("================================================================================");
  console.log("🧪 TEST SUITE: RF-16 PASARELA MERCADO PAGO CHECKOUT PRO Y WEBHOOKS ATÓMICOS");
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

  // 0. Obtener variante disponible para pruebas
  const sampleVariant = await prisma.productVariant.findFirst({
    where: {
      product: { active: true },
      stockStore: { gte: 5 },
    },
    include: { product: true },
  });

  if (!sampleVariant) {
    console.error("❌ No se encontró ninguna variante activa con stockStore >= 5.");
    process.exit(1);
  }

  console.log(`📦 Variante para pruebas: ${sampleVariant.product.name} (Talle ${sampleVariant.size} - ${sampleVariant.color})`);
  console.log(`   Stock Salón: ${sampleVariant.stockStore} | Stock Reservado: ${sampleVariant.stockReserved}\n`);

  const createdSaleIds: string[] = [];

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Creación de Preferencia oficial en Mercado Pago (API Real Sandbox)
    // --------------------------------------------------------------------------
    console.log("🔹 1. Generación de Preferencia Checkout Pro (Server Action)");

    const orderRes = await createGuestOrder({
      customerName: "Nahir Agustín Fornari",
      customerDni: "38.123.456",
      customerEmail: "nahir.test@matacosdeportes.com",
      customerPhone: "3704556677",
      shippingMethod: "CADETERIA_FORMOSA",
      shippingAddress: "Av. 25 de Mayo 450",
      shippingCity: "Formosa",
      shippingPostalCode: "3600",
      items: [{ variantId: sampleVariant.id, quantity: 1 }],
    });

    assert(Boolean(orderRes.success && orderRes.data?.saleId), "Creación de Orden previa para pasarela");
    const saleId1 = orderRes.data!.saleId;
    createdSaleIds.push(saleId1);

    const prefRes = await createMercadoPagoPreference(saleId1);
    assert(prefRes.success === true, "Llamada exitosa a createMercadoPagoPreference");
    assert(Boolean(prefRes.data?.preferenceId), `Preferencia generada con ID: ${prefRes.data?.preferenceId}`);
    assert(
      Boolean(prefRes.data?.initPoint && prefRes.data.initPoint.includes("mercadopago.com")),
      "URL de redirección Checkout Pro generada (init_point)"
    );
    assert(
      Boolean(prefRes.data?.sandboxInitPoint && prefRes.data.sandboxInitPoint.includes("sandbox")),
      "URL Sandbox Checkout Pro generada (sandbox_init_point)"
    );

    // --------------------------------------------------------------------------
    // TEST 2: Validación y Rechazo de Orden inexistente o inválida
    // --------------------------------------------------------------------------
    console.log("\n🔹 2. Validación de Orden Inválida en createMercadoPagoPreference");

    const invalidPref = await createMercadoPagoPreference("uuid-inexistente-12345");
    assert(invalidPref.success === false, "Rechazo adecuado de orden inexistente");

    // --------------------------------------------------------------------------
    // TEST 3: Verificación Criptográfica de Firmas Webhook (HMAC SHA-256)
    // --------------------------------------------------------------------------
    console.log("\n🔹 3. Validación de Firmas HMAC en verifyWebhookSignature");

    const secret = "test_secret_for_hmac_validation_matacos_2026";
    process.env.MERCADOPAGO_WEBHOOK_SECRET = secret;

    const dataId = "9988776655";
    const xRequestId = "req-uuid-test-123";
    const ts = String(Math.floor(Date.now()));
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const computedHash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
    const validXSignature = `ts=${ts},v1=${computedHash}`;

    const isValidSig = verifyWebhookSignature({
      xSignature: validXSignature,
      xRequestId,
      dataId,
    });
    assert(isValidSig === true, "Validación exitosa de firma legítima con secreto y timestamp");

    const isTampered = verifyWebhookSignature({
      xSignature: `ts=${ts},v1=hash_falso_manipulado_1234567890abcdef`,
      xRequestId,
      dataId,
    });
    assert(isTampered === false, "Rechazo estricto de firma manipulada");

    // --------------------------------------------------------------------------
    // TEST 4: Procesamiento Atómico de Pago Aprobado
    // --------------------------------------------------------------------------
    console.log("\n🔹 4. Procesamiento Atómico de Pago Aprobado (approved)");

    const initialVariantState = await prisma.productVariant.findUniqueOrThrow({
      where: { id: sampleVariant.id },
    });

    const mockPaymentId = `TEST_PAY_${Date.now()}`;
    const originalGet = Payment.prototype.get;

    // Simular respuesta del SDK de Mercado Pago para el pago aprobado
    Payment.prototype.get = async function ({ id }: { id: string | number }) {
      return {
        id: mockPaymentId,
        status: "approved",
        external_reference: saleId1,
        transaction_amount: 15000,
        payment_method_id: "visa",
        installments: 3,
      } as any;
    };

    const processApproved = await processMercadoPagoPayment(mockPaymentId);
    assert(processApproved.success === true, "processMercadoPagoPayment ejecutado con éxito");
    assert(processApproved.status === "approved", "Estado devuelto es 'approved'");

    const saleAfterApproved = await prisma.sale.findUniqueOrThrow({
      where: { id: saleId1 },
      include: { payments: true },
    });

    assert(saleAfterApproved.status === "COMPLETADA", "Venta transicionó a COMPLETADA");
    assert(saleAfterApproved.payments.length === 1, "Registro de pago insertado en SalePayment");
    assert(
      saleAfterApproved.payments[0].method === "MERCADOPAGO_ONLINE",
      "Método de pago registrado como MERCADOPAGO_ONLINE"
    );
    assert(
      saleAfterApproved.payments[0].referenceCode === mockPaymentId,
      "Código de referencia de MP almacenado correctamente"
    );

    const variantAfterApproved = await prisma.productVariant.findUniqueOrThrow({
      where: { id: sampleVariant.id },
    });

    assert(
      variantAfterApproved.stockReserved === initialVariantState.stockReserved - 1,
      `stockReserved decrementado correctamente (${variantAfterApproved.stockReserved})`
    );
    const totalPhysicalBefore = initialVariantState.stockStore + initialVariantState.stockWarehouse;
    const totalPhysicalAfter = variantAfterApproved.stockStore + variantAfterApproved.stockWarehouse;
    assert(
      totalPhysicalAfter === totalPhysicalBefore - 1,
      `Stock físico total (Depósito + Salón) decrementado correctamente (${totalPhysicalAfter} vs ${totalPhysicalBefore - 1})`
    );

    const auditMovement = await prisma.inventoryMovement.findFirst({
      where: {
        variantId: sampleVariant.id,
        type: "VENTA_WEB",
        reason: { contains: mockPaymentId },
      },
    });

    assert(Boolean(auditMovement), "Movimiento de inventario auditado en InventoryMovement con tipo VENTA_WEB");

    // --------------------------------------------------------------------------
    // TEST 5: Control de Idempotencia ante Reintentos de Webhook
    // --------------------------------------------------------------------------
    console.log("\n🔹 5. Control de Idempotencia (Notificaciones Duplicadas)");

    const duplicateProcess = await processMercadoPagoPayment(mockPaymentId);
    assert(duplicateProcess.success === true, "Llamada duplicada respondida con éxito (HTTP 200)");
    assert(duplicateProcess.alreadyProcessed === true, "Detector de idempotencia activado (alreadyProcessed: true)");

    const paymentsCount = await prisma.salePayment.count({
      where: { referenceCode: mockPaymentId },
    });
    assert(paymentsCount === 1, "No se crearon pagos duplicados en la base de datos");

    const variantAfterDuplicate = await prisma.productVariant.findUniqueOrThrow({
      where: { id: sampleVariant.id },
    });
    assert(
      variantAfterDuplicate.stockStore === variantAfterApproved.stockStore,
      "El stock físico NO se descontó una segunda vez"
    );

    // --------------------------------------------------------------------------
    // TEST 6: Procesamiento de Pago Rechazado / Cancelado
    // --------------------------------------------------------------------------
    console.log("\n🔹 6. Procesamiento de Pago Rechazado (rejected) y Restitución de Stock");

    const orderRes2 = await createGuestOrder({
      customerName: "Lourdes Bordón Sbardella",
      customerDni: "39.876.543",
      customerEmail: "lourdes.test@matacosdeportes.com",
      customerPhone: "3704998877",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: sampleVariant.id, quantity: 1 }],
    });

    const saleId2 = orderRes2.data!.saleId;
    createdSaleIds.push(saleId2);

    const variantStateBeforeReject = await prisma.productVariant.findUniqueOrThrow({
      where: { id: sampleVariant.id },
    });

    const mockRejectedId = `TEST_REJECT_${Date.now()}`;
    Payment.prototype.get = async function ({ id }: { id: string | number }) {
      return {
        id: mockRejectedId,
        status: "rejected",
        external_reference: saleId2,
        transaction_amount: 15000,
      } as any;
    };

    const processRejected = await processMercadoPagoPayment(mockRejectedId);
    assert(processRejected.success === true, "Pago rechazado procesado con éxito");
    assert(processRejected.status === "rejected", "Estado informado como rejected");

    const saleAfterReject = await prisma.sale.findUniqueOrThrow({
      where: { id: saleId2 },
    });
    assert(saleAfterReject.status === "CANCELADA", "La venta transicionó a CANCELADA");

    const variantStateAfterReject = await prisma.productVariant.findUniqueOrThrow({
      where: { id: sampleVariant.id },
    });
    assert(
      variantStateAfterReject.stockReserved === variantStateBeforeReject.stockReserved - 1,
      "stockReserved fue restituido inmediatamente al stock disponible"
    );
    assert(
      variantStateAfterReject.stockStore === variantStateBeforeReject.stockStore,
      "El stock físico permanece intacto tras el rechazo"
    );

    // Restaurar método original
    Payment.prototype.get = originalGet;
  } catch (err) {
    console.error("💥 Error fatal durante la suite de pruebas:", err);
    failed++;
  } finally {
    // --------------------------------------------------------------------------
    // Limpieza de registros temporales de prueba
    // --------------------------------------------------------------------------
    console.log("\n🧹 Limpiando registros de prueba generados...");
    for (const saleId of createdSaleIds) {
      await prisma.inventoryMovement.deleteMany({
        where: { reason: { contains: saleId } },
      }).catch(() => {});
      await prisma.salePayment.deleteMany({
        where: { saleId },
      }).catch(() => {});
      await prisma.saleItem.deleteMany({
        where: { saleId },
      }).catch(() => {});
      await prisma.sale.delete({
        where: { id: saleId },
      }).catch(() => {});
    }
  }

  console.log("\n================================================================================");
  console.log(`📊 RESULTADOS RF-16: ${passed} Pasados | ${failed} Fallidos`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRf16Tests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
