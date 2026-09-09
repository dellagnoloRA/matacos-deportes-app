import { calculateNewPrice, applyRoundingPolicy, RoundingPolicy } from "../src/lib/priceCalculator";
import { BatchPriceUpdateSchema } from "../src/schemas/priceUpdate";
import { formatCurrency } from "../src/lib/utils";

/**
 * Suite de pruebas y verificación matemática para la Actualización Porcentual de Precios (RF)
 */
function runPriceMathVerification() {
  console.log("================================================================");
  console.log("🧪 VERIFICACIÓN MATEMÁTICA: ACTUALIZACIÓN PORCENTUAL DE PRECIOS");
  console.log("================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
    }
  }

  // -------------------------------------------------------------
  // 1. Pruebas de Políticas de Redondeo
  // -------------------------------------------------------------
  console.log("1. Verificando Políticas de Redondeo para Evitar Decimales Extraños...");

  // $ 45.150 con +15% de aumento da raw 51.922,50
  const basePrice = 45150;
  const pct15 = 15;

  const resNone = calculateNewPrice(basePrice, pct15, "NONE");
  assert(resNone.finalPrice === 51922.5, "Política 'NONE' conserva 2 decimales", `Got ${resNone.finalPrice}`);

  const resInt = calculateNewPrice(basePrice, pct15, "INTEGER");
  assert(resInt.finalPrice === 51923, "Política 'INTEGER' redondea al entero más próximo (51923)", `Got ${resInt.finalPrice}`);

  const resNear10 = calculateNewPrice(basePrice, pct15, "NEAREST_10");
  assert(resNear10.finalPrice === 51920, "Política 'NEAREST_10' redondea a múltiplo de 10 (51920)", `Got ${resNear10.finalPrice}`);

  const resUp10 = calculateNewPrice(basePrice, pct15, "UP_10");
  assert(resUp10.finalPrice === 51930, "Política 'UP_10' redondea hacia arriba al múltiplo de 10 (51930)", `Got ${resUp10.finalPrice}`);

  const resNear50 = calculateNewPrice(basePrice, pct15, "NEAREST_50");
  assert(resNear50.finalPrice === 51900 || resNear50.finalPrice === 51950, "Política 'NEAREST_50' es múltiplo de 50", `Got ${resNear50.finalPrice}`);

  const resNear100 = calculateNewPrice(basePrice, pct15, "NEAREST_100");
  assert(resNear100.finalPrice === 51900, "Política 'NEAREST_100' redondea al múltiplo de 100 más cercano (51900)", `Got ${resNear100.finalPrice}`);

  const resUp100 = calculateNewPrice(basePrice, pct15, "UP_100");
  assert(resUp100.finalPrice === 52000, "Política 'UP_100' redondea hacia arriba al múltiplo de 100 (52000)", `Got ${resUp100.finalPrice}`);

  const resPsych = calculateNewPrice(basePrice, pct15, "PSYCHOLOGICAL_90");
  assert(resPsych.finalPrice % 100 === 90, "Política 'PSYCHOLOGICAL_90' termina en 90 ($ 51.890)", `Got ${resPsych.finalPrice}`);

  // -------------------------------------------------------------
  // 2. Pruebas de Exactitud Aritmética y Precisión
  // -------------------------------------------------------------
  console.log("\n2. Verificando Exactitud Matemática en Aumentos y Descuentos...");

  // Caso: Aumento de 10% exacto sobre $ 100.000
  const res10 = calculateNewPrice(100000, 10, "NEAREST_10");
  assert(res10.finalPrice === 110000, "10% de $ 100.000 = $ 110.000", `Got ${res10.finalPrice}`);
  assert(res10.delta === 10000, "Delta exacto = $ 10.000", `Got ${res10.delta}`);
  assert(res10.effectivePercentage === 10, "Porcentaje efectivo = 10%", `Got ${res10.effectivePercentage}%`);

  // Caso: Descuento comercial (-20%) sobre $ 50.000
  const resDiscount = calculateNewPrice(50000, -20, "NEAREST_10");
  assert(resDiscount.finalPrice === 40000, "-20% de $ 50.000 = $ 40.000", `Got ${resDiscount.finalPrice}`);
  assert(resDiscount.delta === -10000, "Delta exacto de descuento = -$ 10.000", `Got ${resDiscount.delta}`);

  // Caso: Precio 0
  const resZero = calculateNewPrice(0, 15, "NEAREST_10");
  assert(resZero.finalPrice === 0 && resZero.delta === 0, "Precio $ 0 se mantiene en $ 0", `Got ${resZero.finalPrice}`);

  // -------------------------------------------------------------
  // 3. Simulación sobre un Conjunto de Productos
  // -------------------------------------------------------------
  console.log("\n3. Verificando Aumento sobre Conjunto de Productos (Batch Simulation)...");

  const sampleProducts = [
    { name: "Antiparras Cobra Ultra", brand: "Arena", price: 68000, cost: 42000 },
    { name: "Pelota Vóley V200W", brand: "Mikasa", price: 145000, cost: 98000 },
    { name: "Zapatillas Gel-Rocket 11", brand: "Asics", price: 120000, cost: 78000 },
    { name: "Crocs Classic Clog", brand: "Crocs", price: 58000, cost: 34000 },
    { name: "Malla Fastskin LZR", brand: "Speedo", price: 92000, cost: 59000 },
    { name: "Zapatillas Gondor II", brand: "Topper", price: 68000, cost: 38000 },
  ];

  const aumentoPct = 12.5; // +12.5% de aumento general
  const policy: RoundingPolicy = "NEAREST_50";

  let sumOld = 0;
  let sumNew = 0;
  let sumDeltas = 0;

  console.log(`\n  Aplicando +${aumentoPct}% con política '${policy}' a ${sampleProducts.length} productos:`);
  console.log("  ----------------------------------------------------------------------------------");

  for (const prod of sampleProducts) {
    const calc = calculateNewPrice(prod.price, aumentoPct, policy);
    sumOld += prod.price;
    sumNew += calc.finalPrice;
    sumDeltas += calc.delta;

    console.log(
      `  • ${prod.name.padEnd(28)} | Anterior: ${formatCurrency(prod.price).padStart(14)} | Nuevo: ${formatCurrency(calc.finalPrice).padStart(14)} | Dif: +${formatCurrency(calc.delta).padStart(12)} (Efectivo: ${calc.effectivePercentage}%)`
    );

    // Comprobación de que no queden decimales raros (múltiplo de 50)
    assert(calc.finalPrice % 50 === 0, `${prod.name} es múltiplo exacto de $ 50`, `Got ${calc.finalPrice}`);
  }

  // Verificación de integridad matemática de la suma de deltas
  const expectedDeltaSum = Math.round((sumNew - sumOld) * 100) / 100;
  assert(
    Math.round(sumDeltas * 100) / 100 === expectedDeltaSum,
    `Consistencia de deltas: Suma de deltas (${sumDeltas}) === Sum(Nuevos) - Sum(Anteriores) (${expectedDeltaSum})`
  );

  console.log("  ----------------------------------------------------------------------------------");
  console.log(`  TOTAL ANTERIOR: ${formatCurrency(sumOld)}`);
  console.log(`  TOTAL NUEVO:    ${formatCurrency(sumNew)}`);
  console.log(`  DELTA TOTAL:    +${formatCurrency(sumDeltas)}`);

  // -------------------------------------------------------------
  // 4. Verificación de Esquema Zod (Validación de Parámetros)
  // -------------------------------------------------------------
  console.log("\n4. Verificando Esquemas Zod y Límites de Seguridad...");

  // Válido
  const validZod = BatchPriceUpdateSchema.safeParse({
    percentage: 15.5,
    targetField: "PRICE",
    roundingPolicy: "NEAREST_100",
    updateVariantPrices: true,
    reason: "Aumento de lista Topper Sep 2026",
  });
  assert(validZod.success, "Payload válido con +15.5% y NEAREST_100 es aceptado por Zod");

  // Inválido: Descuento excesivo (> 99%)
  const invalidDiscount = BatchPriceUpdateSchema.safeParse({
    percentage: -120,
    targetField: "PRICE",
  });
  assert(!invalidDiscount.success, "Porcentaje menor a -99% es rechazado por Zod");

  // Inválido: Aumento absurdo (> 1000%)
  const invalidAumento = BatchPriceUpdateSchema.safeParse({
    percentage: 1500,
    targetField: "PRICE",
  });
  assert(!invalidAumento.success, "Porcentaje mayor a 1000% es rechazado por Zod");

  // -------------------------------------------------------------
  // Resumen Final
  // -------------------------------------------------------------
  console.log("\n================================================================");
  console.log(`🏁 RESULTADO: ${passedTests}/${totalTests} PRUEBAS SUPERADAS EXITOSAMENTE`);
  console.log("================================================================\n");

  if (passedTests === totalTests) {
    console.log("🎉 Todas las reglas de cálculo matemático y políticas de redondeo funcionan con exactitud.");
  } else {
    process.exit(1);
  }
}

runPriceMathVerification();
