/**
 * Test de Validación y Consistencia para Emisión e Impresión de Tickets — RF-10
 * Requerimiento: BackEnd RF-10: Emisión e Impresión de Tickets de Venta (80mm ESC/POS)
 * 
 * Evalúa:
 * 1. Deducción matemática de Transparencia Fiscal (IVA 21% contenido, RG AFIP 5003).
 *    Verifica concordancia exacta con el ticket físico de muestra ($4.800,00 -> $833,06 de IVA).
 * 2. Generación del Hash criptográfico SHA-256 de seguridad e inviolabilidad.
 * 3. Ensamblado del Código QR interoperable oficial de AFIP (RG 4291 / 5048) en Base64.
 * 4. Formateo y zona horaria de Saavedra 241 (America/Argentina/Buenos_Aires).
 * 5. Consistencia del contrato ReceiptData y validación Zod estricta.
 */

import {
  calculateVatBreakdown,
  generateReceiptSecurityHash,
  generateAfipQrPayload,
  formatReceiptDateTime,
  buildReceiptPayloadFromSaleRecord,
  formatThermalPrice,
  formatTicketToPlainText,
} from "../src/server/services/receiptService";
import { ReceiptDataSchema } from "../src/schemas/receipt";
import { companyConfig } from "../src/config/company";

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details?: string) {
  results.push({
    suite,
    name,
    passed: condition,
    details: condition ? undefined : details,
  });
}

console.log("================================================================================");
console.log("🚀 EJECUTANDO BANCO DE PRUEBAS RF-10: EMISIÓN DE TICKETS Y FISCALIDAD");
console.log("================================================================================\n");

// ==========================================
// 1. MOTOR DE TRANSPARENCIA FISCAL (IVA 21%)
// ==========================================
console.log("--- 1. Pruebas de Transparencia Fiscal (RG AFIP 5003) ---");

// Caso 1.1: Validación con el ticket físico de Saavedra 241 (Foto: Total $4800,00 -> IVA $833,06)
const vatSample = calculateVatBreakdown(4800.0);
assert(
  vatSample.vatAmount === 833.06,
  "Transparencia Fiscal",
  "Calcula exactamente $833,06 de IVA contenido para el ticket de muestra de $4.800,00",
  `Esperado: 833.06, Obtenido: ${vatSample.vatAmount}`
);
assert(
  vatSample.netBaseAmount === 3966.94,
  "Transparencia Fiscal",
  "Calcula exactamente $3.966,94 de base imponible neta ($4800 / 1.21)",
  `Esperado: 3966.94, Obtenido: ${vatSample.netBaseAmount}`
);
assert(
  vatSample.formattedVatAmount.includes("833,06"),
  "Transparencia Fiscal",
  "Formatea correctamente el IVA en pesos argentinos ($ 833,06)",
  `Obtenido: ${vatSample.formattedVatAmount}`
);

// Caso 1.2: Venta de mayor porte ($104.400,00)
const vatLarge = calculateVatBreakdown(104400.0);
// 104400 / 1.21 = 86280.9917... -> 86280.99. IVA = 104400 - 86280.99 = 18119.01
assert(
  vatLarge.vatAmount === 18119.01,
  "Transparencia Fiscal",
  "Calcula correctamente el IVA contenido para venta mayor de $104.400,00 ($18.119,01)",
  `Esperado: 18119.01, Obtenido: ${vatLarge.vatAmount}`
);

// Caso 1.3: Venta en cero o importe negativo (salvaguarda)
const vatZero = calculateVatBreakdown(0);
assert(vatZero.vatAmount === 0 && vatZero.netBaseAmount === 0, "Transparencia Fiscal", "Maneja montos cero sin error");

// ==========================================
// 2. HASH CRIPTOGRÁFICO SHA-256 DE SEGURIDAD
// ==========================================
console.log("\n--- 2. Pruebas de Hash de Seguridad Criptográfico (SHA-256) ---");

const hash1 = generateReceiptSecurityHash({
  cuit: "27-18036080-3",
  pointOfSale: "00008",
  voucherNumber: "00026445",
  total: 4800.0,
  dateIso: "2026-09-22T10:34:01.000Z",
});

assert(
  /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(hash1),
  "Seguridad Hash",
  "Genera hash en formato estructurado de 16 caracteres (XXXX-XXXX-XXXX-XXXX)",
  `Hash generado: ${hash1}`
);

// Determinismo
const hash1Repeat = generateReceiptSecurityHash({
  cuit: "27-18036080-3",
  pointOfSale: "00008",
  voucherNumber: "00026445",
  total: 4800.0,
  dateIso: "2026-09-22T10:34:01.000Z",
});
assert(hash1 === hash1Repeat, "Seguridad Hash", "El hash es 100% determinista ante los mismos datos de entrada");

// Sensibilidad contra adulteraciones (cambio de $ 0,01 o un dígito)
const hashAltered = generateReceiptSecurityHash({
  cuit: "27-18036080-3",
  pointOfSale: "00008",
  voucherNumber: "00026445",
  total: 4800.01, // 1 centavo modificado
  dateIso: "2026-09-22T10:34:01.000Z",
});
assert(hash1 !== hashAltered, "Seguridad Hash", "Detecta alteraciones de importes produciendo un hash totalmente distinto");

// ==========================================
// 3. CÓDIGO QR INTEROPERABLE AFIP (RG 4291/5048)
// ==========================================
console.log("\n--- 3. Pruebas de Código QR Interoperable AFIP ---");

const qrData = generateAfipQrPayload({
  date: new Date("2026-09-22T13:34:01.000Z"),
  pointOfSale: 8,
  voucherTypeCode: 83,
  voucherNumber: 26445,
  total: 4800.0,
  securityHash: hash1,
});

assert(
  qrData.qrUrl.startsWith("https://www.afip.gob.ar/fe/qr/?p="),
  "QR AFIP",
  "La URL canónica cumple con el estándar de AFIP/ARCA (https://www.afip.gob.ar/fe/qr/?p=...)",
  `URL generada: ${qrData.qrUrl}`
);

// Decodificar Base64 y verificar campos obligatorios
const base64Part = qrData.qrUrl.split("?p=")[1];
const decodedJson = JSON.parse(Buffer.from(base64Part, "base64").toString("utf-8"));

assert(decodedJson.ver === 1, "QR AFIP", "Versión de especificación AFIP es 1");
assert(decodedJson.cuit === 27180360803, "QR AFIP", "CUIT emisor limpio coincide con Sandra Isabel Mujica (27180360803)");
assert(decodedJson.ptoVta === 8, "QR AFIP", "Punto de venta coincide con 8");
assert(decodedJson.tipoCmp === 83, "QR AFIP", "Tipo de comprobante es 83 (TIQUE)");
assert(decodedJson.nroCmp === 26445, "QR AFIP", "Número de comprobante es 26445");
assert(decodedJson.importe === 4800.0, "QR AFIP", "Importe coincide con 4800.00");
assert(decodedJson.moneda === "PES", "QR AFIP", "Moneda es PES (Pesos Argentinos)");

// ==========================================
// 4. FORMATEO DE FECHA Y HORA (ZONA LOCAL)
// ==========================================
console.log("\n--- 4. Pruebas de Formato de Fecha y Hora (America/Argentina/Buenos_Aires) ---");

const testDate = new Date("2026-09-22T13:34:01.000Z"); // 13:34 UTC = 10:34 en Formosa (UTC-3)
const formattedDt = formatReceiptDateTime(testDate);

assert(
  formattedDt.date === "22/09/2026",
  "Fecha/Hora",
  "Formatea la fecha como DD/MM/AAAA (22/09/2026)",
  `Obtenido: ${formattedDt.date}`
);
assert(
  formattedDt.time === "10:34:01",
  "Fecha/Hora",
  "Formatea la hora a la zona horaria de Formosa UTC-3 (10:34:01)",
  `Obtenido: ${formattedDt.time}`
);

// ==========================================
// 5. CONTRATO INTEGRAL RECEIPTDATA Y VALIDACIÓN ZOD
// ==========================================
console.log("\n--- 5. Pruebas de Contrato Integral ReceiptData y Esquema Zod ---");

// Venta mock simulando respuesta de base de datos
const mockSale = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  invoiceNumber: "00008-00026445",
  ticketCode: "#042",
  customerName: "Juan Pérez",
  createdAt: testDate,
  subtotalGross: 5200.0,
  discount: 400.0,
  discountType: "FIXED",
  discountValue: 400.0,
  total: 4800.0,
  seller: { id: "u-seller-1", name: "Nahir Fornari", email: "nahir@matacos.com" },
  cashier: { id: "u-cashier-1", name: "Agustín Dellagnolo", email: "agustin@matacos.com" },
  items: [
    {
      variantId: "v-1",
      quantity: 1,
      originalPrice: 5200.0,
      discount: 400.0,
      discountType: "FIXED",
      discountValue: 400.0,
      unitPrice: 4800.0,
      subtotal: 4800.0,
      variant: {
        sku: "CROCS-CL-41-NEG",
        barcode: "7791234567890",
        size: "41",
        color: "Negro",
        product: {
          name: "Zapatillas Crocs Classic",
          brand: { name: "Crocs" },
        },
      },
    },
  ],
  payments: [
    {
      id: "pay-1",
      method: "EFECTIVO",
      amount: 4800.0,
      receivedAmount: 5000.0,
      change: 200.0,
      cardBrand: null,
      cardVoucher: null,
      installments: null,
      referenceCode: null,
    },
  ],
};

const receiptPayload = buildReceiptPayloadFromSaleRecord(mockSale);

// Validar que el schema Zod lo aprueba sin arrojar error
const parsedResult = ReceiptDataSchema.safeParse(receiptPayload);
assert(parsedResult.success, "Esquema Zod", "El payload generado pasa rigurosamente ReceiptDataSchema sin errores");

// Validar datos específicos del ticket
assert(
  receiptPayload.company.name === "MATACOS DEPORTES",
  "Contenido Ticket",
  "Contiene el nombre comercial MATACOS DEPORTES"
);
assert(
  receiptPayload.company.legalName === "MUJICA SANDRA ISABEL",
  "Contenido Ticket",
  "Contiene la Razón Social MUJICA SANDRA ISABEL"
);
assert(
  receiptPayload.sale.invoiceNumber === "00008-00026445",
  "Contenido Ticket",
  "Mantiene la numeración oficial 00008-00026445"
);
assert(
  receiptPayload.sale.customerName === "Juan Pérez",
  "Contenido Ticket",
  "Incluye el nombre de cliente personalizado especificado en preventa"
);
assert(
  receiptPayload.sale.sellerName === "Nahir Fornari",
  "Contenido Ticket",
  "Asigna el vendedor del salón (Nahir Fornari)"
);
assert(
  receiptPayload.sale.cashierName === "Agustín Dellagnolo",
  "Contenido Ticket",
  "Asigna el cajero de mostrador (Agustín Dellagnolo)"
);
assert(
  receiptPayload.items[0].fullDescription === "Crocs - Zapatillas Crocs Classic",
  "Contenido Ticket",
  "Desglosa Marca y Nombre del producto en el renglón"
);
assert(
  receiptPayload.items[0].variantDescription === "Talle: 41 | Color: Negro",
  "Contenido Ticket",
  "Detalla talle y color de la variante deportiva"
);
assert(
  receiptPayload.payments[0].formattedChange?.includes("200,00") ?? false,
  "Contenido Ticket",
  "Discrimina el vuelto entregado de $ 200,00"
);
assert(
  receiptPayload.footer.exchangePolicy.includes("Indispensable presentar este comprobante"),
  "Contenido Ticket",
  "Incluye la política de cambios oficial de Matacos Deportes"
);


// Caso de cliente no especificado (fallback a "CONSUMIDOR FINAL")
const mockSaleAnon = {
  ...mockSale,
  customerName: null,
};
const receiptAnon = buildReceiptPayloadFromSaleRecord(mockSaleAnon);
assert(
  receiptAnon.sale.customerName === "CONSUMIDOR FINAL",
  "Contenido Ticket",
  "Aplica fallback a CONSUMIDOR FINAL cuando no se ingresa nombre de cliente"
);

// ==========================================
// 6. FORMATEO TÉRMICO Y FIDELIDAD CON TICKET FÍSICO (MATACOS DEPORTES)
// ==========================================
console.log("\n--- 6. Pruebas de Formato Térmico y Fidelidad Visual con el Ticket Físico ---");

// Test formato de precio térmico ($4800,00)
assert(
  formatThermalPrice(4800) === "$4800,00",
  "Formato Térmico",
  "Formatea $4800 como '$4800,00' sin espacios intermedios y con coma",
  `Obtenido: ${formatThermalPrice(4800)}`
);
assert(
  formatThermalPrice(833.06) === "$833,06",
  "Formato Térmico",
  "Formatea el IVA $833.06 como '$833,06'",
  `Obtenido: ${formatThermalPrice(833.06)}`
);

// Generar ticket idéntico a la foto de Saavedra 241
const photoSaleMock = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  invoiceNumber: "00008-00026445",
  ticketCode: "#042",
  customerName: null,
  createdAt: new Date("2026-09-22T13:34:01.000Z"),
  subtotalGross: 4800.0,
  discount: 0.0,
  total: 4800.0,
  seller: { id: "seller-1", name: "Nahir Fornari", email: "nahir@matacos.com" },
  cashier: { id: "cashier-1", name: "Agustín Dellagnolo", email: "agustin@matacos.com", code: "CAJERO01" },
  items: [
    {
      variantId: "acc-1",
      quantity: 1,
      originalPrice: 4800.0,
      discount: 0.0,
      unitPrice: 4800.0,
      subtotal: 4800.0,
      variant: {
        sku: "CAN-DRB-01",
        barcode: "7791234567890",
        size: "M",
        color: "Negro",
        product: { name: "CANILLERAS DEPORTIVAS PRO", brand: { name: "DRB" } },
      },
    },
  ],
  payments: [
    {
      id: "pay-1",
      method: "EFECTIVO",
      amount: 4800.0,
      receivedAmount: 4800.0,
      change: 0.0,
    },
  ],
};

const photoReceiptPayload = buildReceiptPayloadFromSaleRecord(photoSaleMock);
const printedText = formatTicketToPlainText(photoReceiptPayload, 40);

assert(printedText.includes("M A T A C O S"), "Fidelidad Ticket Físico", "Contiene encabezado 'M A T A C O S'");
assert(printedText.includes("D E P O R T E S"), "Fidelidad Ticket Físico", "Contiene encabezado 'D E P O R T E S'");
assert(printedText.includes("MUJICA SANDRA ISABEL"), "Fidelidad Ticket Físico", "Contiene titular 'MUJICA SANDRA ISABEL'");
assert(printedText.includes("CUIT Nro.: 27-18036080-3"), "Fidelidad Ticket Físico", "Contiene CUIT oficial '27-18036080-3'");
assert(printedText.includes("Ing. Brutos 01-2718036080-3"), "Fidelidad Ticket Físico", "Contiene Ing. Brutos '01-2718036080-3'");
assert(printedText.includes("Dirección: SAAVEDRA 241"), "Fidelidad Ticket Físico", "Contiene Dirección 'SAAVEDRA 241'");
assert(printedText.includes("FORMOSA - CAPITAL"), "Fidelidad Ticket Físico", "Contiene localidad 'FORMOSA - CAPITAL'");
assert(printedText.includes("C.P.3600"), "Fidelidad Ticket Físico", "Contiene código postal 'C.P.3600'");
assert(printedText.includes("Inicio de Actividades: 25/07/2007"), "Fidelidad Ticket Físico", "Contiene inicio de actividades '25/07/2007'");
assert(printedText.includes("IVA RESPONSABLE INSCRIPTO"), "Fidelidad Ticket Físico", "Contiene condición IVA 'IVA RESPONSABLE INSCRIPTO'");
assert(printedText.includes("A CONSUMIDOR FINAL"), "Fidelidad Ticket Físico", "Contiene destinatario 'A CONSUMIDOR FINAL'");
assert(printedText.includes("Cód. 083 - TIQUE"), "Fidelidad Ticket Físico", "Contiene comprobante 'Cód. 083 - TIQUE'");
assert(printedText.includes("P.V. Nro. 00008 - Nro. T. 00026445"), "Fidelidad Ticket Físico", "Contiene punto de venta y número correlativo '00008 - 00026445'");
assert(printedText.includes("Fecha 22/09/2026") && printedText.includes("Hora 10:34:01"), "Fidelidad Ticket Físico", "Contiene Fecha '22/09/2026' y Hora '10:34:01'");
assert(printedText.includes("CANILLERAS DEPORTIVAS PRO") && printedText.includes("$4800,00"), "Fidelidad Ticket Físico", "Renglón de ítem 'CANILLERAS DEPORTIVAS PRO' con precio '$4800,00'");
assert(printedText.includes("TOTAL") && printedText.includes("$4800,00"), "Fidelidad Ticket Físico", "Renglón 'TOTAL' con precio '$4800,00'");
assert(printedText.includes("RECIBI(MOS)") && printedText.includes("EFECTIVO"), "Fidelidad Ticket Físico", "Sección de pagos con 'RECIBI(MOS)' y 'EFECTIVO'");
assert(printedText.includes("TRANSPARENCIA FISCAL"), "Fidelidad Ticket Físico", "Contiene acápite 'TRANSPARENCIA FISCAL'");
assert(printedText.includes("IVA contenido:") && printedText.includes("$833,06"), "Fidelidad Ticket Físico", "Contiene 'IVA contenido:' con '$833,06'");
assert(printedText.includes("CAJERO01"), "Fidelidad Ticket Físico", "Contiene código de cajero 'CAJERO01'");
assert(printedText.includes("CF SESHRA000022252") && printedText.includes("V: 1.02"), "Fidelidad Ticket Físico", "Pie fiscal contiene 'CF SESHRA000022252' y 'V: 1.02'");

// Verificar ancho térmico: ninguna línea supera 40 caracteres (ancho físico comandera)
const linesExceedingWidth = printedText.split("\n").filter((l) => l.length > 40);
assert(
  linesExceedingWidth.length === 0,
  "Ancho Físico Comandera",
  "Todas las líneas cumplen con el ancho estándar de 40 columnas de la comandera de 80mm",
  linesExceedingWidth.length > 0 ? `Líneas excedidas: ${linesExceedingWidth.join(" | ")}` : undefined
);

// ==========================================
// RESUMEN CONSOLIDADO
// ==========================================
console.log("\n================================================================================");
console.log("📊 RESUMEN DE PRUEBAS RF-10");
console.log("================================================================================");

const passedCount = results.filter((r) => r.passed).length;
const failedCount = results.filter((r) => !r.passed).length;

results.forEach((r, idx) => {
  const badge = r.passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${idx + 1}. [${badge}] ${r.suite.padEnd(22)} | ${r.name}`);
  if (!r.passed && r.details) {
    console.log(`     ⚠️ Detalle: ${r.details}`);
  }
});

console.log("--------------------------------------------------------------------------------");
console.log(`Total Pruebas: ${results.length} | Aprobadas: ${passedCount} | Fallidas: ${failedCount}`);
console.log("================================================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("🎉 TODAS LAS PRUEBAS DE BACKEND DEL RF-10 SE EJECUTARON EXITOSAMENTE.\n");
}
