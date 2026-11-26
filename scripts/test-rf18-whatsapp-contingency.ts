/**
 * Suite de Pruebas Automatizadas de Backend: RF-18
 * Botón Contextual de WhatsApp, Asistencia Comercial y Contingencia (local físico, Formosa)
 *
 * Ejecución: pnpm tsx scripts/test-rf18-whatsapp-contingency.ts
 */

import {
  companyConfig,
  sanitizeWhatsAppNumber,
  COMPANY_COUNTRY_CODE,
  COMPANY_MOBILE_PREFIX,
  COMPANY_AREA_CODE,
  DEFAULT_WHATSAPP_NUMBER,
} from "../src/config/company";
import {
  formatProductWhatsAppUrl,
  formatOrderWhatsAppUrl,
  formatCheckoutContingencyWhatsAppUrl,
  formatOrderStatusLabel,
  buildWhatsAppChatUrl,
} from "../src/lib/whatsapp";
import {
  getOrderWhatsAppInquiryUrlAction,
  getProductWhatsAppInquiryUrlAction,
} from "../src/server/actions/ecommerce/whatsappActions";
import { prisma } from "../src/lib/prisma";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log(" MATACOS DEPORTES — TEST SUITE RF-18: WHATSAPP ASISTENCIA");
  console.log("========================================================\n");

  // --------------------------------------------------------------------------
  // GRUPO 1: Configuración institucional en src/config/company.ts
  // --------------------------------------------------------------------------
  console.log("--- 1. Configuración Institucional y Sanitización Telefónica ---");

  assert(COMPANY_COUNTRY_CODE === "54", "Código de país oficial es 54 (Argentina)");
  assert(COMPANY_MOBILE_PREFIX === "9", "Prefijo móvil para WhatsApp es 9");
  assert(COMPANY_AREA_CODE === "370", "Código de área oficial es 370 (Formosa)");
  assert(
    DEFAULT_WHATSAPP_NUMBER === "5493704000000",
    "Número por defecto es 5493704000000"
  );
  assert(
    companyConfig.whatsappNumber.startsWith("549370"),
    `Número de WhatsApp configurado en companyConfig inicia con 549370 (${companyConfig.whatsappNumber})`
  );
  assert(
    companyConfig.cleanWhatsappNumber === companyConfig.whatsappNumber,
    "cleanWhatsappNumber coincide con whatsappNumber numérico"
  );
  assert(
    companyConfig.cleanPhone.length >= 10,
    `cleanPhone contiene los dígitos telefónicos (${companyConfig.cleanPhone})`
  );

  // Sanitización de números
  assert(
    sanitizeWhatsAppNumber("+54 9 370 4000000") === "5493704000000",
    "Sanitiza formato con símbolos '+54 9 370 4000000' -> 5493704000000"
  );
  assert(
    sanitizeWhatsAppNumber("3704258963") === "5493704258963",
    "Agrega prefijo país 549 a número local con código de área Formosa (3704258963)"
  );
  assert(
    sanitizeWhatsAppNumber("543704258963") === "5493704258963",
    "Inserta prefijo móvil 9 a formato sin el 9 (543704258963 -> 5493704258963)"
  );
  assert(
    sanitizeWhatsAppNumber(null) === "5493704000000",
    "Fallback a DEFAULT_WHATSAPP_NUMBER ante null"
  );
  assert(
    sanitizeWhatsAppNumber("") === "5493704000000",
    "Fallback a DEFAULT_WHATSAPP_NUMBER ante string vacío"
  );

  // --------------------------------------------------------------------------
  // GRUPO 2: Función helper formatProductWhatsAppUrl(params)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Helper formatProductWhatsAppUrl (Objetivo 2) ---");

  // 2.1 y 2.2: Título, talle, color y precio formateado con formatCurrency
  const urlCompleta = formatProductWhatsAppUrl({
    productName: "Zapatillas Asics Gel-Rocket 11",
    size: "42",
    color: "Azul / Blanco",
    price: 135000,
    productUrl: "https://matacosdeportes.com.ar/producto/asics-gel-rocket-11",
  });

  assert(urlCompleta.startsWith("https://wa.me/549370"), "La URL inicia con https://wa.me/549370...");
  
  const decodedText = decodeURIComponent(urlCompleta.split("?text=")[1] || "");
  assert(
    decodedText.includes("Zapatillas Asics Gel-Rocket 11"),
    "El mensaje incluye el nombre del producto"
  );
  assert(
    decodedText.includes("Talle: 42, Color: Azul / Blanco"),
    "El mensaje incluye la especificación de talle y color"
  );
  assert(
    decodedText.includes("135.000,00"),
    "El mensaje incluye el precio formateado en ARS ($ 135.000,00)"
  );
  assert(
    decodedText.includes("https://matacosdeportes.com.ar/producto/asics-gel-rocket-11"),
    "El mensaje incluye la URL del producto"
  );

  // 2.2: Estructura sin precio (solo talle, color y URL según especificación literal)
  const urlSinPrecio = formatProductWhatsAppUrl({
    productName: "Pelota Vóley Mikasa V200W",
    size: "5",
    color: "Amarillo/Azul",
    productUrl: "https://matacosdeportes.com.ar/producto/mikasa-v200w",
  });
  const decodedSinPrecio = decodeURIComponent(urlSinPrecio.split("?text=")[1] || "");
  assert(
    decodedSinPrecio ===
      "Hola Matacos Deportes! Quiero consultar por Pelota Vóley Mikasa V200W (Talle: 5, Color: Amarillo/Azul). https://matacosdeportes.com.ar/producto/mikasa-v200w",
    `Estructura exacta: "Hola Matacos Deportes! Quiero consultar por Pelota Vóley Mikasa V200W (Talle: 5, Color: Amarillo/Azul). [URL]"`
  );

  // Soporte de alias (title, talle, url)
  const urlConAlias = formatProductWhatsAppUrl({
    title: "Camiseta Oficial Formosa Vóley",
    talle: "L",
    color: "Negro",
    url: "https://matacosdeportes.com.ar/producto/camiseta-formosa",
  });
  const decodedConAlias = decodeURIComponent(urlConAlias.split("?text=")[1] || "");
  assert(
    decodedConAlias.includes("Camiseta Oficial Formosa Vóley (Talle: L, Color: Negro)"),
    "Admite alias title y talle transparentemente"
  );

  // 2.3: Codificación segura previniendo inyecciones de caracteres o símbolos especiales
  const urlCaracteresEspeciales = formatProductWhatsAppUrl({
    productName: "Remera Térmica & Lycra + Protección UV (100% Algodón)",
    size: "M",
    color: "Rojo/Ñandú",
    price: 45999.5,
  });
  assert(
    !urlCaracteresEspeciales.includes(" "),
    "No contiene espacios en blanco sin codificar en la URL"
  );
  assert(
    !urlCaracteresEspeciales.includes("ñ") && !urlCaracteresEspeciales.includes("ó"),
    "Caracteres diacríticos (ñ, ó, &) están codificados con encodeURIComponent"
  );
  const decodedEspeciales = decodeURIComponent(
    urlCaracteresEspeciales.split("?text=")[1] || ""
  );
  assert(
    decodedEspeciales.includes("Remera Térmica & Lycra + Protección UV (100% Algodón)"),
    "La decodificación restituye fielmente los caracteres especiales"
  );

  // --------------------------------------------------------------------------
  // GRUPO 3: Helper formatOrderWhatsAppUrl y Contingencia Checkout (R-04)
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Helper de Consulta de Pedidos y Contingencia Checkout ---");

  // Mapeo de estados legibles
  assert(
    formatOrderStatusLabel("PENDIENTE_PAGO") === "Pendiente de pago",
    "PENDIENTE_PAGO -> Pendiente de pago"
  );
  assert(
    formatOrderStatusLabel("LISTO_RETIRO") === "Listo para retirar en local físico",
    "LISTO_RETIRO -> Listo para retirar en local físico"
  );
  assert(
    formatOrderStatusLabel("EN_CAMINO") === "En camino",
    "EN_CAMINO -> En camino"
  );

  const orderUrl = formatOrderWhatsAppUrl({
    orderCode: "WEB-2026-0042",
    status: "EN_CAMINO",
    customerName: "Eugenia González",
    total: 89500,
    shippingTrackingCode: "CA-370-987654",
  });
  const decodedOrder = decodeURIComponent(orderUrl.split("?text=")[1] || "");
  assert(
    decodedOrder.includes("*WEB-2026-0042*"),
    "Incluye código de orden en negrita para WhatsApp (*WEB-2026-0042*)"
  );
  assert(
    decodedOrder.includes("a nombre de Eugenia González"),
    "Incluye nombre de cliente"
  );
  assert(
    decodedOrder.includes("(Estado: En camino)"),
    "Incluye estado amigable formateado"
  );
  assert(
    decodedOrder.includes("CA-370-987654"),
    "Incluye código de seguimiento logístico"
  );

  // Contingencia Checkout (R-04)
  const contingencyUrl = formatCheckoutContingencyWhatsAppUrl({
    orderCode: "WEB-2026-0105",
    customerName: "Nahir Fornari",
    customerDni: "38999888",
    total: 75000,
    items: [
      { productName: "Rodillera Vóley", size: "M", color: "Negro", quantity: 2 },
      { productName: "Medias Deportivas", size: "Único", color: "Blanco", quantity: 3 },
    ],
  });
  const decodedContingency = decodeURIComponent(contingencyUrl.split("?text=")[1] || "");
  assert(
    decodedContingency.includes("¡Hola Matacos Deportes! Generé el pedido web *WEB-2026-0105*"),
    "Mensaje de contingencia con saludo y código de orden oficial"
  );
  assert(
    decodedContingency.includes("Nahir Fornari (DNI 38999888)"),
    "Incluye nombre y DNI del titular para validación rápida en mostrador"
  );
  assert(
    decodedContingency.includes("2x Rodillera Vóley (M/Negro)"),
    "Detalle de cantidades y variantes en contingencia"
  );

  // --------------------------------------------------------------------------
  // GRUPO 4: Server Actions (Objetivo 3)
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Server Actions de Consulta (Objetivo 3) ---");

  // Test de Server Action con orden inexistente (fallback gracioso con código provisto)
  const actionFallbackResult = await getOrderWhatsAppInquiryUrlAction("WEB-2026-9999");
  assert(
    actionFallbackResult.success === true,
    "Server Action responde exitosamente ante código de consulta no persistido"
  );
  assert(
    actionFallbackResult.url?.includes("WEB-2026-9999"),
    "La URL generada por la Server Action incluye el código provisto"
  );

  // Test de Server Action de Producto
  const productActionResult = await getProductWhatsAppInquiryUrlAction({
    productName: "Botines Papi Fútbol Penalty",
    size: "41",
    color: "Negro/Dorado",
    price: 92000,
  });
  assert(
    productActionResult.success === true,
    "getProductWhatsAppInquiryUrlAction retorna success: true"
  );
  assert(
    productActionResult.url?.includes("Penalty"),
    "La URL del Server Action de producto contiene el nombre del producto"
  );

  // Test con orden real persistida en base de datos PostgreSQL
  const existingSale = await prisma.sale.findFirst({
    where: { channel: "WEB" },
    select: { id: true, invoiceNumber: true, ticketCode: true },
  });

  if (existingSale) {
    const saleIdentifier = existingSale.invoiceNumber || existingSale.ticketCode || existingSale.id;
    const actionDbResult = await getOrderWhatsAppInquiryUrlAction(saleIdentifier);
    assert(
      actionDbResult.success === true,
      `Server Action recupera venta real de DB (${saleIdentifier})`
    );
    assert(
      actionDbResult.url?.includes("wa.me/549370"),
      "Server Action genera enlace wa.me para la venta de DB"
    );
  } else {
    console.log("  ℹ No se encontraron ventas WEB en DB local para probar consulta directa; prueba omitida.");
  }

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  console.log("\n========================================================");
  console.log(` RESULTADOS RF-18: ${passed} PASARON | ${failed} FALLARON`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Error fatal ejecutando pruebas RF-18:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
