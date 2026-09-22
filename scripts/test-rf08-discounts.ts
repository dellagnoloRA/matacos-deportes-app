/**
 * Test de Validación y Consistencia de Descuentos Manuales en POS — RF-08
 * Requerimiento: BackEnd RF-08: Aplicación de Descuentos Manuales en Punto de Venta
 * 
 * Evalúa:
 * 1. Reglas de validación Zod (DiscountSchema): rechazo de negativos y > 100%.
 * 2. Descuento porcentual por ítem con redondeo a 2 decimales.
 * 3. Descuento fijo por ítem y salvaguarda contra precios negativos.
 * 4. Descuentos combinados (renglón + ticket global en cascada).
 * 5. Consistencia matemática determinista en múltiples ítems sin pérdida de precisión.
 */

import { calculateItemDiscount, calculateSaleTotals } from "../src/lib/discounts";
import { DiscountSchema } from "../src/schemas/sale";

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
console.log("🚀 EJECUTANDO BANCO DE PRUEBAS RF-08: MOTOR DE DESCUENTOS EN POS");
console.log("================================================================================\n");

// ==========================================
// 1. VALIDACIONES DE ESQUEMA ZOD (DiscountSchema)
// ==========================================
console.log("--- 1. Pruebas de Esquema Zod (DiscountSchema) ---");

// Caso 1.1: Descuento porcentual válido (15%)
const zodValidPercent = DiscountSchema.safeParse({ type: "PERCENTAGE", value: 15 });
assert(zodValidPercent.success, "Zod Schema", "Acepta porcentaje válido (15%)");

// Caso 1.2: Descuento porcentual al límite (100%)
const zodMaxPercent = DiscountSchema.safeParse({ type: "PERCENTAGE", value: 100 });
assert(zodMaxPercent.success, "Zod Schema", "Acepta porcentaje máximo del 100%");

// Caso 1.3: Descuento porcentual inválido (> 100%)
const zodOverPercent = DiscountSchema.safeParse({ type: "PERCENTAGE", value: 105 });
assert(!zodOverPercent.success, "Zod Schema", "Rechaza porcentaje mayor al 100% (>100%)");

// Caso 1.4: Descuento cero o negativo
const zodZero = DiscountSchema.safeParse({ type: "PERCENTAGE", value: 0 });
assert(!zodZero.success, "Zod Schema", "Rechaza valor 0 (debe ser estrictamente positivo)");

const zodNegative = DiscountSchema.safeParse({ type: "FIXED", value: -500 });
assert(!zodNegative.success, "Zod Schema", "Rechaza monto fijo negativo (-$500)");

// Caso 1.5: Descuento fijo válido
const zodValidFixed = DiscountSchema.safeParse({ type: "FIXED", value: 5000, reason: "Promoción contado" });
assert(zodValidFixed.success, "Zod Schema", "Acepta descuento fijo válido con motivo");


// ==========================================
// 2. DESCUENTO PORCENTUAL POR ÍTEM
// ==========================================
console.log("\n--- 2. Descuento Porcentual por Ítem ---");

// Caso 2.1: Producto $ 58.000 con 15% de descuento
// 58000 * 0.15 = 8700 de descuento unitario -> unitPrice = 49300
const item1 = calculateItemDiscount(58000, "PERCENTAGE", 15);
assert(item1.unitDiscount === 8700, "Porcentual Ítem", "Descuento unitario exacto ($ 8.700,00)");
assert(item1.unitPrice === 49300, "Porcentual Ítem", "Precio unitario resultante exacto ($ 49.300,00)");

// Caso 2.2: Redondeo de decimales raros (ej: $ 1.234,56 con 33.33% desc)
const itemOdd = calculateItemDiscount(1234.56, "PERCENTAGE", 33.33);
const expectedDiscount = Math.round((1234.56 * 33.33) / 100 * 100) / 100;
assert(itemOdd.unitDiscount === expectedDiscount, "Porcentual Ítem", "Redondeo preciso a 2 decimales");
assert(itemOdd.unitPrice === Math.round((1234.56 - expectedDiscount) * 100) / 100, "Porcentual Ítem", "Diferencia unitaria sin pérdida IEEE-754");


// ==========================================
// 3. DESCUENTO FIJO Y PROTECCIÓN CONTRA TOTALES NEGATIVOS
// ==========================================
console.log("\n--- 3. Descuento Fijo y Blindaje Anti-Negativos ---");

// Caso 3.1: Descuento fijo normal ($ 5.000 sobre $ 58.000)
const itemFixed = calculateItemDiscount(58000, "FIXED", 5000);
assert(itemFixed.unitDiscount === 5000, "Fijo Ítem", "Descuento fijo asignado ($ 5.000,00)");
assert(itemFixed.unitPrice === 53000, "Fijo Ítem", "Precio final tras descuento fijo ($ 53.000,00)");

// Caso 3.2: Intento de descuento fijo mayor al precio ($ 70.000 sobre $ 58.000)
const itemCapped = calculateItemDiscount(58000, "FIXED", 70000);
assert(itemCapped.unitDiscount === 58000, "Anti-Negativos", "El descuento se acota al precio del producto ($ 58.000)");
assert(itemCapped.unitPrice === 0, "Anti-Negativos", "El precio unitario no es negativo (queda en $ 0,00)");


// ==========================================
// 4. RECÁLCULO GLOBAL DE VENTA Y DESCUENTOS COMBINADOS
// ==========================================
console.log("\n--- 4. Recálculo Global de Venta y Descuento en Cascada ---");

// Escenario de prueba documentado en QA de RF-08:
// Ítem 1: 2 unidades de $ 20.000 con 10% desc
//   - unitDiscount: $ 2.000 -> unitPrice: $ 18.000 -> subtotal: $ 36.000
// Ítem 2: 1 unidad de $ 40.000 con $ 5.000 desc fijo
//   - unitDiscount: $ 5.000 -> unitPrice: $ 35.000 -> subtotal: $ 35.000
// Subtotal ítems = $ 36.000 + $ 35.000 = $ 71.000,00
// Descuento Global: 10% sobre los $ 71.000,00 remanentes = $ 7.100,00
// Total Neto a Cobrar = $ 71.000 - $ 7.100 = $ 63.900,00
const saleCalculation = calculateSaleTotals(
  [
    {
      variantId: "var-1",
      quantity: 2,
      originalPrice: 20000,
      discountType: "PERCENTAGE",
      discountValue: 10,
    },
    {
      variantId: "var-2",
      quantity: 1,
      originalPrice: 40000,
      discountType: "FIXED",
      discountValue: 5000,
    },
  ],
  {
    type: "PERCENTAGE",
    value: 10,
  }
);

assert(saleCalculation.subtotalGross === 80000, "Venta Combinada", "Subtotal bruto sin descuentos ($ 80.000,00)");
assert(saleCalculation.totalItemDiscounts === 9000, "Venta Combinada", "Suma de descuentos por ítem ($ 9.000,00)");
assert(saleCalculation.subtotalAfterItems === 71000, "Venta Combinada", "Subtotal remanente antes de descuento global ($ 71.000,00)");
assert(saleCalculation.globalDiscountAmount === 7100, "Venta Combinada", "Descuento global del 10% sobre remanente ($ 7.100,00)");
assert(saleCalculation.totalDiscount === 16100, "Venta Combinada", "Descuento total acumulado ($ 16.100,00)");
assert(saleCalculation.totalNet === 63900, "Venta Combinada", "Total neto final a cobrar ($ 63.900,00)");

// Caso 4.2: Descuento global fijo exorbitante ($ 100.000 sobre ticket de $ 71.000)
const saleExorbitantGlobal = calculateSaleTotals(
  [
    {
      variantId: "var-1",
      quantity: 1,
      originalPrice: 71000,
    },
  ],
  {
    type: "FIXED",
    value: 100000,
  }
);
assert(saleExorbitantGlobal.globalDiscountAmount === 71000, "Anti-Negativos Global", "Descuento global acotado al total remanente");
assert(saleExorbitantGlobal.totalNet === 0, "Anti-Negativos Global", "Total neto protegido en $ 0,00, nunca negativo");


// ==========================================
// RESUMEN Y REPORTE
// ==========================================
console.log("\n================================================================================");
console.log("📊 RESULTADOS DEL TEST DE CONSISTENCIA RF-08");
console.log("================================================================================");

let allPassed = true;
for (const res of results) {
  const symbol = res.passed ? "✅ PASS" : "❌ FAIL";
  console.log(`[${symbol}] [${res.suite}] ${res.name}${res.details ? ` -> ${res.details}` : ""}`);
  if (!res.passed) allPassed = false;
}

console.log("\n--------------------------------------------------------------------------------");
if (allPassed) {
  console.log(`🎉 TODOS LOS CASOS DE PRUEBA PASARON EXITOSAMENTE (${results.length}/${results.length})`);
  console.log("El motor determinista de descuentos cumple con todas las especificaciones de RF-08.");
} else {
  console.error("❌ FALLARON ALGUNOS CASOS DE PRUEBA.");
  process.exit(1);
}
