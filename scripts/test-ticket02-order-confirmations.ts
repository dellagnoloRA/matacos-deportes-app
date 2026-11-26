import { prisma } from "../src/lib/prisma";
import { createGuestOrder } from "../src/server/actions/ecommerce/checkoutActions";
import { processMercadoPagoPayment } from "../src/server/actions/ecommerce/mercadopagoActions";
import {
  sendOrderConfirmationEmail,
  sendOrderRefundNotificationEmail,
  sendOrderShippingUpdateEmail,
} from "../src/lib/emailService";
import {
  formatOrderWhatsAppUrl,
  buildWhatsAppChatUrl,
  formatCheckoutContingencyWhatsAppUrl,
} from "../src/lib/whatsapp";
import { Payment } from "../src/lib/mercadopago";
import { companyConfig } from "../src/config/company";

async function runTicket02Tests() {
  console.log("================================================================================");
  console.log("🧪 TEST SUITE: TICKET 02 — CONFIRMACIONES DE COMPRA (EMAIL Y WHATSAPP)");
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

  // 0. Obtener variante con existencias
  const sampleVariant = await prisma.productVariant.findFirst({
    where: {
      product: { active: true },
      stockStore: { gte: 5 },
    },
    include: { product: true },
  });

  if (!sampleVariant) {
    console.error("❌ No se encontró variante disponible con stockStore >= 5");
    process.exit(1);
  }

  const createdSaleIds: string[] = [];
  const originalPaymentGet = Payment.prototype.get;

  try {
    // --------------------------------------------------------------------------
    // TEST 1: Generación y Validación de Enlaces Contextuales de WhatsApp
    // --------------------------------------------------------------------------
    console.log("🔹 1. Verificación de Enlaces Contextuales de WhatsApp (RF-18 / Resultado)");

    const orderWaUrl = formatOrderWhatsAppUrl({
      orderCode: "WEB-2026-0042",
      status: "COMPLETADA",
      customerName: "Nahir Agustín Fornari",
      total: 45000,
    });

    assert(
      orderWaUrl.startsWith(`https://wa.me/${companyConfig.whatsappNumber}`),
      `Enlace de WhatsApp inicia con el número oficial sanitizado (${companyConfig.whatsappNumber})`
    );
    assert(
      orderWaUrl.includes(encodeURIComponent("WEB-2026-0042")),
      "Enlace codifica el código de orden de forma segura en la URL"
    );
    assert(
      orderWaUrl.includes(encodeURIComponent("Completado")),
      "Enlace incluye el estado formateado legible para el personal de Saavedra 241"
    );

    const helpWaUrl = buildWhatsAppChatUrl(
      companyConfig.whatsappNumber,
      "Hola Matacos Deportes! Tengo una consulta sobre mi pedido WEB-2026-0042."
    );
    assert(
      helpWaUrl.includes(encodeURIComponent("Hola Matacos Deportes!")),
      "Enlace de ayuda genera URI válida con mensaje de soporte"
    );

    // --------------------------------------------------------------------------
    // TEST 2: Envío de Correo de Confirmación de Compra (EmailService)
    // --------------------------------------------------------------------------
    console.log("\n🔹 2. Despacho y Formato del Correo de Confirmación de Pedido");

    const emailResult = await sendOrderConfirmationEmail({
      to: "comprador.test@gmail.com",
      customerName: "Nahir Agustín Fornari",
      orderCode: "WEB-2026-0042",
      shippingMethod: "CADETERIA_FORMOSA",
      shippingAddress: "Av. 25 de Mayo 450",
      shippingCity: "Formosa",
      total: 45000,
      items: [
        {
          productName: sampleVariant.product.name,
          size: sampleVariant.size,
          color: sampleVariant.color,
          quantity: 1,
          subtotal: 45000,
        },
      ],
    });

    assert(emailResult.sent, "EmailService procesó el despacho exitosamente");
    assert(
      emailResult.subject.includes("WEB-2026-0042"),
      `Asunto del correo incluye código de pedido: "${emailResult.subject}"`
    );
    assert(
      emailResult.previewUrl.includes("WEB-2026-0042"),
      `Enlace de seguimiento web generado en preview: ${emailResult.previewUrl}`
    );

    // --------------------------------------------------------------------------
    // TEST 3: Envío de Correo de Reembolso Automático (EmailService)
    // --------------------------------------------------------------------------
    console.log("\n🔹 3. Despacho de Correo de Reembolso por Expiración (Fail-Safe)");

    const refundEmailResult = await sendOrderRefundNotificationEmail({
      to: "comprador.reembolso@gmail.com",
      customerName: "Cliente Afectado",
      orderCode: "WEB-2026-0099",
      total: 32000,
      paymentId: "888777666",
    });

    assert(refundEmailResult.sent, "Email de reembolso procesado con éxito");
    assert(
      refundEmailResult.subject.toLowerCase().includes("reembolso") && refundEmailResult.subject.includes("WEB-2026-0099"),
      "Asunto del email detalla aviso de reembolso para la orden"
    );

    // --------------------------------------------------------------------------
    // TEST 4: Integración End-to-End: Webhook de Pago Aprobado dispara confirmación
    // --------------------------------------------------------------------------
    console.log("\n🔹 4. Integración E2E: Webhook de Mercado Pago y Notificación de Compra");

    const orderRes = await createGuestOrder({
      customerName: "Lourdes Bordón",
      customerDni: "42.993.948",
      customerEmail: "lourdes.test@matacosdeportes.com",
      customerPhone: "3704112233",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: sampleVariant.id, quantity: 1 }],
    });

    assert(orderRes.success && Boolean(orderRes.data), "Orden web creada con email del comprador");
    const saleId = orderRes.data!.saleId;
    const orderCodeCreated = orderRes.data!.orderCode;
    createdSaleIds.push(saleId);

    // Mockeamos Payment.get de Mercado Pago
    Payment.prototype.get = async function ({ id }: { id: string }) {
      return {
        id: Number(id),
        status: "approved",
        external_reference: saleId,
        transaction_amount: 25000,
        payment_method_id: "visa",
        installments: 1,
      } as any;
    };

    const webhookRes = await processMercadoPagoPayment("555444333");
    assert(webhookRes.success, "Webhook de Mercado Pago procesó la orden aprobada");
    assert(webhookRes.status === "approved", "Estado del webhook confirmado como approved");

    const updatedSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { payments: true },
    });

    assert(updatedSale?.status === "COMPLETADA", "Venta en base de datos transicionó a COMPLETADA");
    assert(updatedSale?.payments.length === 1, "Se registró el comprobante de pago en SalePayment");

  } finally {
    // Restaurar mock
    Payment.prototype.get = originalPaymentGet;

    // Limpieza de datos en BD
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

runTicket02Tests()
  .catch((e) => {
    console.error("❌ Error no controlado en pruebas:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
