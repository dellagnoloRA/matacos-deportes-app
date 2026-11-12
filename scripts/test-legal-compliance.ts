import { prisma } from "../src/lib/prisma";
import { createGuestOrder } from "../src/server/actions/ecommerce/checkoutActions";
import { registerCustomerAction } from "../src/server/actions/ecommerce/customerActions";
import {
  submitRevocationRequestAction,
  getRevocationStatusAction,
} from "../src/server/actions/ecommerce/legalActions";

async function runLegalComplianceTests() {
  console.log("=====================================================================");
  console.log("🧪 TEST SUITE: Cumplimiento Legal, Consentimiento y Arrepentimiento");
  console.log("=====================================================================\n");

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

  const testSuffix = Date.now().toString().slice(-6);
  const testEmailGuest = `legal.guest.${testSuffix}@matacos.test`;
  const testEmailCustomer = `legal.customer.${testSuffix}@matacos.test`;

  const createdCustomerIds: string[] = [];
  const createdSaleIds: string[] = [];
  const createdRevocationIds: string[] = [];

  // Buscar una variante con stock disponible para la orden de prueba
  const variant = await prisma.productVariant.findFirst({
    where: {
      stockStore: { gte: 2 },
      product: { active: true },
    },
    include: {
      product: true,
    },
  });

  if (!variant) {
    console.error("❌ No se encontró una variante con stock suficiente para pruebas.");
    process.exit(1);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Guest Checkout rechaza la orden si falta aceptar Términos y Condiciones
    // -------------------------------------------------------------------------
    console.log("1. Validando rechazo de Guest Checkout sin Términos y Condiciones...");
    // @ts-expect-error probando rechazo de validación
    const resNoTerms = await createGuestOrder({
      customerName: "Juan Test",
      customerDni: "38111222",
      customerEmail: testEmailGuest,
      customerPhone: "3704112233",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: variant.id, quantity: 1, expectedUnitPrice: 1000 }],
      acceptedTerms: false,
      acceptedPrivacy: true,
    });

    assert(
      !resNoTerms.success,
      "Guest Checkout rechaza la orden si acceptedTerms es false"
    );

    // -------------------------------------------------------------------------
    // TEST 2: Guest Checkout rechaza la orden si falta aceptar Políticas de Privacidad
    // -------------------------------------------------------------------------
    console.log("2. Validando rechazo de Guest Checkout sin Políticas de Privacidad...");
    // @ts-expect-error probando rechazo de validación
    const resNoPrivacy = await createGuestOrder({
      customerName: "Juan Test",
      customerDni: "38111222",
      customerEmail: testEmailGuest,
      customerPhone: "3704112233",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: variant.id, quantity: 1, expectedUnitPrice: 1000 }],
      acceptedTerms: true,
      acceptedPrivacy: false,
    });

    assert(
      !resNoPrivacy.success,
      "Guest Checkout rechaza la orden si acceptedPrivacy es false"
    );

    // -------------------------------------------------------------------------
    // TEST 3: Guest Checkout exitoso con ambos checkboxes y registro en LegalConsentLog
    // -------------------------------------------------------------------------
    console.log("3. Ejecutando Guest Checkout con ambos consentimientos aceptados...");
    const resOrderOk = await createGuestOrder({
      customerName: "Juan Test Legal",
      customerDni: "38111222",
      customerEmail: testEmailGuest,
      customerPhone: "3704112233",
      shippingMethod: "RETIRO_LOCAL",
      items: [{ variantId: variant.id, quantity: 1, expectedUnitPrice: 1000 }],
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    assert(
      resOrderOk.success && Boolean(resOrderOk.data?.saleId),
      "Guest Checkout se crea exitosamente con ambos consentimientos",
      resOrderOk.error
    );

    let createdSaleId = "";
    let orderCode = "";
    if (resOrderOk.data) {
      createdSaleId = resOrderOk.data.saleId;
      orderCode = resOrderOk.data.orderCode;
      createdSaleIds.push(createdSaleId);

      // Verificar que se haya insertado el registro inmutable en LegalConsentLog
      const consentLog = await prisma.legalConsentLog.findFirst({
        where: {
          saleId: createdSaleId,
          formType: "GUEST_CHECKOUT",
        },
      });

      assert(
        Boolean(consentLog && consentLog.acceptedTerms && consentLog.acceptedPrivacy),
        "Se persistió el consentimiento inmutable en LegalConsentLog con formType GUEST_CHECKOUT",
        `ID de log: ${consentLog?.id}`
      );

      assert(
        Boolean(consentLog?.ipAddress && consentLog?.userAgent),
        "LegalConsentLog contiene IP y User-Agent auditables",
        `IP: ${consentLog?.ipAddress}, UA: ${consentLog?.userAgent}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Registro de Cliente rechaza si falta algún checkbox
    // -------------------------------------------------------------------------
    console.log("4. Validando rechazo de Registro de Cliente sin consentimientos...");
    // @ts-expect-error probando rechazo
    const resRegFail = await registerCustomerAction({
      name: "Cliente Test",
      email: testEmailCustomer,
      password: "password123",
      acceptedTerms: true,
      acceptedPrivacy: false,
    });

    assert(
      !resRegFail.success,
      "registerCustomerAction rechaza registro si falta acceptedPrivacy"
    );

    // -------------------------------------------------------------------------
    // TEST 5: Registro de Cliente exitoso genera perfil y LegalConsentLog
    // -------------------------------------------------------------------------
    console.log("5. Registrando cliente con ambos consentimientos válidos...");
    const resRegOk = await registerCustomerAction({
      name: "Cliente Test Legal",
      email: testEmailCustomer,
      password: "password123",
      phone: "3704998877",
      dni: "39123456",
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    assert(
      resRegOk.success && Boolean(resRegOk.data?.customer.id),
      "Cliente registrado exitosamente",
      resRegOk.error
    );

    if (resRegOk.data) {
      createdCustomerIds.push(resRegOk.data.customer.id);

      const customerConsent = await prisma.legalConsentLog.findFirst({
        where: {
          customerId: resRegOk.data.customer.id,
          formType: "CUSTOMER_REGISTER",
        },
      });

      assert(
        Boolean(customerConsent && customerConsent.acceptedTerms && customerConsent.acceptedPrivacy),
        "Se persistió el consentimiento inmutable en LegalConsentLog con formType CUSTOMER_REGISTER",
        `ID de log: ${customerConsent?.id}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: Botón de Arrepentimiento valida orden y plazo legal de 10 días
    // -------------------------------------------------------------------------
    console.log("6. Solicitando revocación / arrepentimiento para la orden web...");
    const resRevocation = await submitRevocationRequestAction({
      orderCode,
      customerEmail: testEmailGuest,
      customerPhone: "3704112233",
      reason: "No me gustó el talle elegido",
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    assert(
      resRevocation.success && Boolean(resRevocation.data?.revocationCode.startsWith("REV-")),
      "Solicitud de arrepentimiento emitida con código REV-XXXXXX dentro de los 10 días",
      resRevocation.error
    );

    if (resRevocation.data) {
      const revCode = resRevocation.data.revocationCode;

      const revRecord = await prisma.revocationRequest.findUnique({
        where: { code: revCode },
      });

      if (revRecord) {
        createdRevocationIds.push(revRecord.id);
      }

      assert(
        Boolean(revRecord && revRecord.status === "PENDIENTE_REVISION"),
        "El trámite se registró en base de datos en estado PENDIENTE_REVISION"
      );

      // Verificar que se haya registrado el consentimiento del trámite
      const revConsent = await prisma.legalConsentLog.findFirst({
        where: {
          saleId: createdSaleId,
          formType: "REVOCATION_REQUEST",
        },
      });

      assert(
        Boolean(revConsent),
        "Se persistió el consentimiento inmutable del trámite de revocación"
      );

      // -----------------------------------------------------------------------
      // TEST 7: Consulta de Estado de Trámite de Revocación
      // -----------------------------------------------------------------------
      console.log("7. Consultando estado del trámite recién generado...");
      const queryRes = await getRevocationStatusAction(revCode, testEmailGuest);

      assert(
        queryRes.success && queryRes.data?.code === revCode,
        "getRevocationStatusAction devuelve los datos y estado del trámite",
        queryRes.error
      );
    }

    // -------------------------------------------------------------------------
    // TEST 8: Rechazo de arrepentimiento con orden inexistente
    // -------------------------------------------------------------------------
    console.log("8. Validando rechazo con orden inexistente...");
    const resRevFake = await submitRevocationRequestAction({
      orderCode: "WEB-9999-9999",
      customerEmail: testEmailGuest,
      acceptedTerms: true,
      acceptedPrivacy: true,
    });

    assert(
      !resRevFake.success,
      "submitRevocationRequestAction rechaza orden inexistente"
    );
  } catch (err) {
    console.error("Error catastrófico en suite de pruebas:", err);
    failed++;
  } finally {
    // Limpieza de datos de prueba
    console.log("\n🧹 Limpiando registros temporales de prueba...");
    if (createdRevocationIds.length > 0) {
      await prisma.revocationRequest.deleteMany({
        where: { id: { in: createdRevocationIds } },
      });
    }

    if (createdSaleIds.length > 0) {
      await prisma.legalConsentLog.deleteMany({
        where: { saleId: { in: createdSaleIds } },
      });
      await prisma.saleItem.deleteMany({
        where: { saleId: { in: createdSaleIds } },
      });
      await prisma.sale.deleteMany({
        where: { id: { in: createdSaleIds } },
      });
    }

    if (createdCustomerIds.length > 0) {
      await prisma.legalConsentLog.deleteMany({
        where: { customerId: { in: createdCustomerIds } },
      });
      await prisma.customer.deleteMany({
        where: { id: { in: createdCustomerIds } },
      });
    }

    console.log("Limpieza finalizada.");
  }

  console.log("\n=====================================================================");
  console.log(`🏁 RESULTADO FINAL: ${passed} pasadas, ${failed} falladas`);
  console.log("=====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runLegalComplianceTests().then(() => process.exit(0));
