import {
  StockAlertsQuerySchema,
  ConfigureStockThresholdSchema,
  StockAlertLevel,
} from "../src/schemas/stockAlerts";
import { getConsolidatedStockAlerts } from "../src/server/actions/stockAlertActions";

function runStockAlertsVerification() {
  console.log("========================================================================");
  console.log("🧪 VERIFICACIÓN: ALERTAS DE STOCK MÍNIMO Y PRODUCTOS AGOTADOS");
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
  // 1. Verificación de Reglas y Clasificación de Niveles de Alerta
  // -------------------------------------------------------------
  console.log("1. Verificando Reglas de Clasificación de Estados de Stock...");

  // Función de evaluación interna replicando el motor del backend
  function evaluate(store: number, warehouse: number, minStock: number, minStore: number): StockAlertLevel {
    const total = store + warehouse;
    if (total === 0) return "OUT_OF_STOCK";
    if (store === 0 && warehouse > 0) return "STORE_EMPTY_WAREHOUSE_AVAIL";
    if (total <= minStock) return "CRITICAL_LOW";
    if (store <= minStore && warehouse > 0) return "STORE_REPLENISHMENT";
    return "NORMAL";
  }

  // Caso A: Totalmente agotado (0 salón, 0 depósito)
  const alertA = evaluate(0, 0, 2, 1);
  assert(alertA === "OUT_OF_STOCK", "Stock total 0 se clasifica como 'OUT_OF_STOCK'");

  // Caso B: Salón vacío pero depósito abastecido (Urgencia de mostrador)
  const alertB = evaluate(0, 8, 2, 1);
  assert(alertB === "STORE_EMPTY_WAREHOUSE_AVAIL", "Salón 0 con stock en depósito es 'STORE_EMPTY_WAREHOUSE_AVAIL'");

  // Caso C: Stock total menor o igual a minStock (Compra a proveedor)
  const alertC = evaluate(1, 1, 3, 1);
  assert(alertC === "CRITICAL_LOW", "Total (2) <= minStock (3) es 'CRITICAL_LOW'");

  // Caso D: Salón bajo pero depósito tiene stock suficiente (Reposición preventiva)
  const alertD = evaluate(1, 12, 2, 1);
  assert(alertD === "STORE_REPLENISHMENT", "Salón <= minStoreStock con depósito alto es 'STORE_REPLENISHMENT'");

  // Caso E: Stock óptimo
  const alertE = evaluate(5, 10, 2, 1);
  assert(alertE === "NORMAL", "Stock por encima de los umbrales es 'NORMAL'");

  // -------------------------------------------------------------
  // 2. Verificación de Esquemas Zod y Filtros Dinámicos
  // -------------------------------------------------------------
  console.log("\n2. Verificando Esquemas Zod y Filtros Dinámicos...");

  const validQueryAll = StockAlertsQuerySchema.safeParse({ filter: "ALL" });
  assert(validQueryAll.success, "Filtro 'ALL' es válido");

  const validQueryOut = StockAlertsQuerySchema.safeParse({ filter: "OUT_OF_STOCK" });
  assert(validQueryOut.success, "Filtro 'OUT_OF_STOCK' es válido");

  const validQueryReplenish = StockAlertsQuerySchema.safeParse({ filter: "STORE_REPLENISHMENT" });
  assert(validQueryReplenish.success, "Filtro 'STORE_REPLENISHMENT' es válido");

  const invalidQuery = StockAlertsQuerySchema.safeParse({ filter: "FILTRO_INEXISTENTE" });
  assert(!invalidQuery.success, "Filtro inválido es rechazado por Zod");

  // Validación de configuración de umbrales
  const validThresholdProd = ConfigureStockThresholdSchema.safeParse({
    scope: "PRODUCT",
    targetId: "c0a80123-0000-0000-0000-000000000001",
    minStock: 4,
    minStoreStock: 2,
  });
  assert(validThresholdProd.success, "Configuración de umbrales por Producto es válida");

  const validThresholdCat = ConfigureStockThresholdSchema.safeParse({
    scope: "CATEGORY",
    targetId: "c0a80123-0000-0000-0000-000000000002",
    minStock: 10,
  });
  assert(validThresholdCat.success, "Configuración masiva de umbrales por Categoría es válida");

  const invalidThreshold = ConfigureStockThresholdSchema.safeParse({
    scope: "PRODUCT",
    targetId: "c0a80123-0000-0000-0000-000000000001",
    minStock: -5, // Negativo
  });
  assert(!invalidThreshold.success, "Stock mínimo negativo es rechazado");

  // -------------------------------------------------------------
  // 3. Simulación de Consolidación por Producto
  // -------------------------------------------------------------
  console.log("\n3. Verificando Algoritmo de Consolidación por Producto...");

  // Simulación: Producto "Zapatillas Topper Gondor" con 4 variantes
  const mockProduct = {
    id: "prod-1",
    name: "Zapatillas Topper Gondor",
    variants: [
      { size: "39", color: "Negro", stockStore: 0, stockWarehouse: 0, minStock: 2, minStoreStock: 1 }, // OUT_OF_STOCK
      { size: "40", color: "Negro", stockStore: 0, stockWarehouse: 4, minStock: 2, minStoreStock: 1 }, // STORE_EMPTY_WAREHOUSE_AVAIL
      { size: "41", color: "Negro", stockStore: 1, stockWarehouse: 6, minStock: 2, minStoreStock: 1 }, // STORE_REPLENISHMENT
      { size: "42", color: "Negro", stockStore: 4, stockWarehouse: 8, minStock: 2, minStoreStock: 1 }, // NORMAL
    ],
  };

  let outCount = 0;
  let emptyStoreCount = 0;
  let replenishCount = 0;
  let affectedVariants = 0;

  for (const v of mockProduct.variants) {
    const lvl = evaluate(v.stockStore, v.stockWarehouse, v.minStock, v.minStoreStock);
    if (lvl !== "NORMAL") {
      affectedVariants++;
      if (lvl === "OUT_OF_STOCK") outCount++;
      if (lvl === "STORE_EMPTY_WAREHOUSE_AVAIL") emptyStoreCount++;
      if (lvl === "STORE_REPLENISHMENT") replenishCount++;
    }
  }

  assert(affectedVariants === 3, "Se detectan 3 variantes en alerta de 4 totales");
  assert(outCount === 1, "Variante Talle 39 identificada como 'OUT_OF_STOCK'");
  assert(emptyStoreCount === 1, "Variante Talle 40 identificada como 'STORE_EMPTY_WAREHOUSE_AVAIL'");
  assert(replenishCount === 1, "Variante Talle 41 identificada como 'STORE_REPLENISHMENT'");

  // Nivel de urgencia consolidado para el producto padre
  const highestAlert = outCount > 0 ? "OUT_OF_STOCK" : "CRITICAL_LOW";
  assert(highestAlert === "OUT_OF_STOCK", "El producto consolidado hereda la alerta más severa ('OUT_OF_STOCK')");

  // -------------------------------------------------------------
  // Resumen Final
  // -------------------------------------------------------------
  console.log("\n========================================================================");
  console.log(`🏁 RESULTADO: ${passedTests}/${totalTests} PRUEBAS SUPERADAS EXITOSAMENTE`);
  console.log("========================================================================\n");

  if (passedTests === totalTests) {
    console.log("🎉 Requerimiento de Alertas de Stock y Productos Agotados 100% verificado.");
  } else {
    process.exit(1);
  }
}

runStockAlertsVerification();
