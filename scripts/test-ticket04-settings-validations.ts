/**
 * ============================================================================
 * TEST SUITE: TICKET 04 - CONFIGURACIÓN DINÁMICA Y VALIDACIONES ESTRICTAS ZOD
 * ============================================================================
 * Ejecución: pnpm tsx scripts/test-ticket04-settings-validations.ts
 */

import {
  StrictEmailSchema,
  StrictPhoneSchema,
  StrictDniSchema,
  StoreSettingSchema,
} from "../src/schemas/settings";
import { GuestCheckoutSchema } from "../src/schemas/ecommerce";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../src/server/actions/storeSettingsActions";
import { getDynamicWhatsAppUrl, buildWhatsAppChatUrl } from "../src/lib/whatsapp";
import { sendOrderConfirmationEmail } from "../src/lib/emailService";
import { prisma } from "../src/lib/prisma";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedCount++;
  }
}

async function runTicket04TestSuite() {
  console.log("\n========================================================");
  console.log("🧪 INICIANDO TEST SUITE: TICKET 04 - CONFIGURACIÓN Y VALIDACIONES");
  console.log("========================================================\n");

  // --------------------------------------------------------------------------
  // GRUPO 1: VALIDACIÓN ESTRICTA DE CORREOS ELECTRÓNICOS
  // --------------------------------------------------------------------------
  console.log("--- 1. Validación de Correos Electrónicos (StrictEmailSchema) ---");

  const validEmails = [
    "ventas@matacosdeportes.com",
    "cliente.prueba@gmail.com.ar",
    "juan_perez+ecommerce@dominio.org",
    "contacto@sub.dominio.gob.ar",
  ];
  for (const email of validEmails) {
    const result = StrictEmailSchema.safeParse(email);
    assert(result.success, `Email válido aceptado: "${email}"`);
  }

  const invalidEmails = [
    "sin-arroba.com",
    "usuario@",
    "@dominio.com",
    "usuario@dominio", // Sin TLD
    "usuario@dominio.c", // TLD de solo 1 caracter
    "usuario @dominio.com", // Espacio intermedio
    "",
  ];
  for (const email of invalidEmails) {
    const result = StrictEmailSchema.safeParse(email);
    assert(!result.success, `Email inválido rechazado: "${email}"`);
  }

  // --------------------------------------------------------------------------
  // GRUPO 2: VALIDACIÓN ESTRICTA DE TELÉFONOS Y WHATSAPP (10 a 13 DÍGITOS)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Validación de Teléfonos (StrictPhoneSchema - 10 a 13 dígitos) ---");

  const validPhones = [
    "3704123456", // 10 dígitos (Formosa)
    "5493704123456", // 13 dígitos (WhatsApp internacional)
    "+54 9 370 412-3456", // Con formato y símbolos
    "(0370) 4123456", // Con paréntesis y código de área
    "11 4000 1234", // 10 dígitos CABA
  ];
  for (const phone of validPhones) {
    const result = StrictPhoneSchema.safeParse(phone);
    assert(result.success, `Teléfono válido aceptado: "${phone}"`);
  }

  const invalidPhones = [
    "1234567", // 7 dígitos (demasiado corto)
    "370412345", // 9 dígitos (incompleto)
    "549370412345678", // 15 dígitos (demasiado largo)
    "telefono-invalido", // Solo letras
    "3704-abc-456", // 7 dígitos netos con letras
    "",
  ];
  for (const phone of invalidPhones) {
    const result = StrictPhoneSchema.safeParse(phone);
    assert(!result.success, `Teléfono inválido rechazado: "${phone}"`);
  }

  // --------------------------------------------------------------------------
  // GRUPO 3: VALIDACIÓN ESTRICTA DE DNI / CUIT (7 a 11 DÍGITOS)
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Validación de DNI / CUIT (StrictDniSchema - 7 a 11 dígitos) ---");

  const validDnis = [
    "38123456", // 8 dígitos (DNI común)
    "7123456", // 7 dígitos (DNI mayor)
    "20-38123456-7", // 11 dígitos (CUIT formateado)
    "27401234562", // 11 dígitos (CUIT continuo)
  ];
  for (const dni of validDnis) {
    const result = StrictDniSchema.safeParse(dni);
    assert(result.success, `DNI/CUIT válido aceptado: "${dni}"`);
  }

  const invalidDnis = [
    "12345", // 5 dígitos (demasiado corto)
    "123456789012", // 12 dígitos (demasiado largo)
    "dni-invalido", // Solo letras
    "",
  ];
  for (const dni of invalidDnis) {
    const result = StrictDniSchema.safeParse(dni);
    assert(!result.success, `DNI/CUIT inválido rechazado: "${dni}"`);
  }

  // --------------------------------------------------------------------------
  // GRUPO 4: INTEGRACIÓN EN GUEST CHECKOUT SCHEMA
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Validación en GuestCheckoutSchema ---");

  const validGuestPayload = {
    customerName: "Juan Carlos Gómez",
    customerDni: "38.123.456",
    customerEmail: "juan.gomez@gmail.com",
    customerPhone: "3704-556677",
    shippingMethod: "RETIRO_LOCAL",
    shippingAddress: null,
    items: [
      {
        variantId: "a0000000-0000-0000-0000-000000000001",
        quantity: 1,
        expectedUnitPrice: 45000,
      },
    ],
  };

  const checkoutResult = GuestCheckoutSchema.safeParse(validGuestPayload);
  assert(checkoutResult.success, "Payload de Guest Checkout con datos válidos pasa sin errores");

  const invalidEmailPayload = {
    ...validGuestPayload,
    customerEmail: "correo-sin-tld@gmail",
  };
  const invalidEmailRes = GuestCheckoutSchema.safeParse(invalidEmailPayload);
  assert(!invalidEmailRes.success, "Guest Checkout rechaza correo sin TLD válido");

  const invalidPhonePayload = {
    ...validGuestPayload,
    customerPhone: "12345", // Menos de 10 dígitos
  };
  const invalidPhoneRes = GuestCheckoutSchema.safeParse(invalidPhonePayload);
  assert(!invalidPhoneRes.success, "Guest Checkout rechaza teléfono de menos de 10 dígitos");

  const invalidDniPayload = {
    ...validGuestPayload,
    customerDni: "123", // Menos de 7 dígitos
  };
  const invalidDniRes = GuestCheckoutSchema.safeParse(invalidDniPayload);
  assert(!invalidDniRes.success, "Guest Checkout rechaza DNI incompleto (< 7 dígitos)");

  // --------------------------------------------------------------------------
  // GRUPO 5: PERSISTENCIA EN BASE DE DATOS (StoreSetting)
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Persistencia y Server Actions de StoreSetting ---");

  // Lectura inicial
  const initialSettingsRes = await getStoreSettings();
  assert(initialSettingsRes.success, "getStoreSettings() responde con éxito");
  assert(Boolean(initialSettingsRes.data.id === "default"), "ID de configuración es 'default'");

  // Actualización con nuevos datos dinámicos
  const updatePayload = {
    storeName: "Matacos Deportes Oficial",
    whatsappNumber: "+54 9 370 499-8877", // Formateado con símbolos
    contactPhone: "+54 370 4429999",
    contactEmail: "contacto@matacosdeportes.com",
    notificationsEmail: "alertas@matacosdeportes.com",
    storeAddress: "Saavedra 241",
    storeCity: "Formosa Capital",
    storePostalCode: "3600",
    businessHours: "Lunes a Viernes de 08:00 a 20:00 hs",
    instagramHandle: "@matacos.deportes",
  };

  const updateRes = await updateStoreSettings(updatePayload);
  assert(updateRes.success, "updateStoreSettings() actualiza registro con éxito");
  assert(
    updateRes.data?.whatsappNumber === "5493704998877",
    "Número de WhatsApp fue sanitizado y guardado en formato internacional neto (5493704998877)"
  );
  assert(
    updateRes.data?.storeName === "Matacos Deportes Oficial",
    "Nombre de la tienda actualizado a 'Matacos Deportes Oficial'"
  );

  // Verificación en PostgreSQL directa
  const dbRecord = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });
  assert(
    dbRecord?.contactEmail === "contacto@matacosdeportes.com",
    "PostgreSQL persistió correctamente el nuevo correo de contacto"
  );

  // --------------------------------------------------------------------------
  // GRUPO 6: PROPAGACIÓN DINÁMICA A WHATSAPP Y CORREO
  // --------------------------------------------------------------------------
  console.log("\n--- 6. Propagación Dinámica a Canales de Contacto ---");

  // WhatsApp dinámico
  const dynamicWaUrl = await getDynamicWhatsAppUrl("Consulta de prueba");
  assert(
    dynamicWaUrl.includes("5493704998877"),
    `Enlace wa.me generado adopta dinámicamente el nuevo número de la BD: "${dynamicWaUrl}"`
  );

  // Email de confirmación usando nuevo remitente y nombre
  const emailRes = await sendOrderConfirmationEmail({
    to: "comprador@gmail.com",
    customerName: "Carlos Pérez",
    orderCode: "WEB-2026-TEST",
    shippingMethod: "Retiro en local",
    shippingAddress: "Saavedra 241",
    shippingCity: "Formosa",
    total: 35000,
    items: [
      {
        productName: "Botines Nike Phantom",
        size: "42",
        color: "Negro",
        quantity: 1,
        subtotal: 35000,
      },
    ],
  });
  assert(emailRes.sent, "Email de confirmación generado con éxito");
  assert(
    emailRes.subject.includes("Matacos Deportes Oficial"),
    `El asunto del correo incluye el nombre comercial actualizado dinámicamente: "${emailRes.subject}"`
  );

  // Restaurar configuración a estándar de Saavedra 241
  await updateStoreSettings({
    storeName: "Matacos Deportes",
    whatsappNumber: "5493704000000",
    contactPhone: "+54 370 4429999",
    contactEmail: "ventas@matacosdeportes.com",
    notificationsEmail: "notificaciones@matacosdeportes.com",
    storeAddress: "Saavedra 241",
    storeCity: "Formosa Capital",
    storePostalCode: "3600",
    businessHours: "Lunes a Sábado de 08:30 a 12:30 y de 16:30 a 20:30 hs",
    instagramHandle: "@matacosdeportes",
  });

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  console.log("\n========================================================");
  console.log(`📊 RESULTADO FINAL: ${passedCount} PASSED / ${failedCount} FAILED`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTicket04TestSuite()
  .catch((err) => {
    console.error("FATAL ERROR EN SUITE:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
