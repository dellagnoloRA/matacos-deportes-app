import {
  calculateEan13CheckDigit,
  validateEan13,
  generateEan13FromSequence,
  generateBatchEan13,
  GS1_INTERNAL_PREFIX,
} from "../src/lib/barcodeGenerator";
import {
  GenerateBarcodesSchema,
  AssignBarcodeToVariantSchema,
  PrintLabelsPayloadSchema,
} from "../src/schemas/barcode";
import { formatCurrency } from "../src/lib/utils";

/**
 * Suite de Pruebas de Validación y Ausencia de Colisiones para RF-05
 */
function runBarcodeVerificationSuite() {
  console.log("========================================================================");
  console.log("🧪 VERIFICACIÓN RF-05: GENERADOR DE CÓDIGOS DE BARRA EAN-13 Y ETIQUETAS");
  console.log("========================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  // -------------------------------------------------------------
  // 1. Análisis y Verificación del Algoritmo GS1 Módulo 10
  // -------------------------------------------------------------
  console.log("1. Verificando Algoritmo Oficial GS1 Módulo 10...");

  // Caso estándar internacional conocido: Stabilo Boss '400638133393' -> Dígito esperado = 1
  const stabCheck = calculateEan13CheckDigit("400638133393");
  assert(stabCheck === 1, "Cálculo con código internacional conocido (400638133393 -> 1)", `Got ${stabCheck}`);
  assert(validateEan13("4006381333931") === true, "Validación completa de EAN-13 válido (4006381333931)");

  // Detección de código adulterado (cambio en un solo dígito debe invalidar el checksum)
  assert(validateEan13("4006381333932") === false, "Rechazo de código con dígito verificador adulterado (...2)");
  assert(validateEan13("4006381333901") === false, "Rechazo de código con cuerpo modificado");
  assert(validateEan13("12345") === false, "Rechazo de código con longitud insuficiente");
  assert(validateEan13("400638133393A") === false, "Rechazo de código con caracteres no numéricos");

  // Código interno con prefijo 200: '200000000001'
  const internalCheck = calculateEan13CheckDigit("200000000001");
  const internalCode = `200000000001${internalCheck}`;
  assert(validateEan13(internalCode) === true, `Generación y validación de código interno inicial: ${internalCode}`);

  // -------------------------------------------------------------
  // 2. Generación Masiva de 500 Códigos y Prueba de Colisiones
  // -------------------------------------------------------------
  console.log("\n2. Generando 500 Códigos Correlativos Continuos (Prueba de Colisiones)...");

  const BATCH_SIZE = 500;
  const START_SEQUENCE = 1;
  const barcodes500 = generateBatchEan13(START_SEQUENCE, BATCH_SIZE, GS1_INTERNAL_PREFIX);

  assert(barcodes500.length === BATCH_SIZE, `Se generó un array de exactamente ${BATCH_SIZE} códigos`);

  // Comprobar ausencia de duplicados utilizando un Set
  const uniqueSet = new Set(barcodes500);
  assert(
    uniqueSet.size === BATCH_SIZE,
    `AUSENCIA TOTAL DE COLISIONES: ${uniqueSet.size}/${BATCH_SIZE} códigos son estrictamente únicos`,
    `Colisiones detectadas: ${BATCH_SIZE - uniqueSet.size}`
  );

  // Validar matemáticamente que el 100% de los 500 códigos cumpla EAN-13
  let allValid = true;
  let invalidIdx = -1;
  for (let i = 0; i < barcodes500.length; i++) {
    if (!validateEan13(barcodes500[i])) {
      allValid = false;
      invalidIdx = i;
      break;
    }
  }
  assert(allValid, `El 100% (500/500) de los códigos generados posee un checksum Módulo 10 válido`, `Fallo en índice ${invalidIdx}`);

  // Muestra de códigos generados
  console.log("\n  Muestra de los primeros 5 y últimos 3 códigos generados:");
  for (let i = 0; i < 5; i++) {
    console.log(`   [Secuencia #${(START_SEQUENCE + i).toString().padStart(3, "0")}] -> ${barcodes500[i]}`);
  }
  console.log("   ...");
  for (let i = BATCH_SIZE - 3; i < BATCH_SIZE; i++) {
    console.log(`   [Secuencia #${(START_SEQUENCE + i).toString().padStart(3, "0")}] -> ${barcodes500[i]}`);
  }

  // -------------------------------------------------------------
  // 3. Continuidad entre Lotes (Generar 500 códigos adicionales)
  // -------------------------------------------------------------
  console.log("\n3. Verificando Continuidad sin Solapamiento entre Lotes Consecutivos...");

  const nextBatch500 = generateBatchEan13(501, 500, GS1_INTERNAL_PREFIX);
  const combinedSet = new Set([...barcodes500, ...nextBatch500]);

  assert(
    combinedSet.size === 1000,
    `Cero solapamiento entre lotes consecutivos: 1000/1000 códigos únicos (Lote 1: 1-500, Lote 2: 501-1000)`
  );

  // -------------------------------------------------------------
  // 4. Validación de Esquemas Zod y Datos de Etiqueta Térmica
  // -------------------------------------------------------------
  console.log("\n4. Verificando Esquemas Zod y Formato de Etiquetas Térmicas...");

  const validGenSchema = GenerateBarcodesSchema.safeParse({ count: 500, prefix: "200" });
  assert(validGenSchema.success, "Esquema GenerateBarcodesSchema acepta lote de 500 códigos");

  const invalidGenSchema = GenerateBarcodesSchema.safeParse({ count: 5000 }); // Excede max 1000
  assert(!invalidGenSchema.success, "Esquema GenerateBarcodesSchema rechaza lote superior a 1000");

  const validAssign = AssignBarcodeToVariantSchema.safeParse({
    variantId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    customBarcode: barcodes500[0],
  });
  assert(validAssign.success, "Esquema AssignBarcodeToVariantSchema acepta código EAN-13 válido");

  const printPayload = PrintLabelsPayloadSchema.safeParse({
    items: [
      { variantId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", copies: 3 },
    ],
  });
  assert(printPayload.success, "Esquema PrintLabelsPayloadSchema valida ítems y copias");

  // Formateo de precio para etiqueta
  const samplePrice = 68000;
  const formattedPrice = formatCurrency(samplePrice);
  assert(formattedPrice.includes("68.000"), `Formato de precio para etiqueta en ARS: "${formattedPrice}"`);

  // -------------------------------------------------------------
  // Resumen Final
  // -------------------------------------------------------------
  console.log("\n========================================================================");
  console.log(`🏁 RESULTADO: ${passedTests}/${totalTests} PRUEBAS SUPERADAS EXITOSAMENTE`);
  console.log("========================================================================\n");

  if (passedTests === totalTests) {
    console.log("🎉 RF-05 cumplido: 500 códigos correlativos generados sin una sola colisión.");
  } else {
    process.exit(1);
  }
}

runBarcodeVerificationSuite();
