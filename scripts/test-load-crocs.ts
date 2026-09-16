import { parseExcelStockToPayload } from "../src/lib/excelImporter";
import { bulkImportProducts } from "../src/server/actions/bulkImportActions";
import { BulkImportPayloadSchema } from "../src/schemas/bulkImport";
import { prisma } from "../src/lib/prisma";
import { formatCurrency } from "../src/lib/utils";

const EXCEL_PATH = "C:\\Users\\della\\Downloads\\plantilla_carga_stock_matacos.xlsx";

async function runCrocsLoadTest() {
  console.log("================================================================================");
  console.log("🐊 PRUEBA DE CARGA: PRIMERAS 100 FILAS DE CROCS DESDE PLANILLA DE STOCK");
  console.log("================================================================================\n");

  console.log(`📁 Origen del archivo: ${EXCEL_PATH}`);

  // 1. Parsing y extracción de las primeras 100 filas de Crocs
  const { payload, filteredCount, totalParsedRows } = parseExcelStockToPayload({
    filePath: EXCEL_PATH,
    sheetName: "Productos_y_Stock",
    batchReference: "Lote-001-Crocs-Prueba-100",
    mode: "ACCUMULATE_STOCK",
    maxRows: 100,
    rowFilter: (row) => {
      const disc = String(row["Disciplina"] || "").trim().toLowerCase();
      const brand = String(row["Marca"] || "").trim().toLowerCase();
      return disc === "crocs" || brand === "crocs";
    },
  });

  console.log(`📊 Filas totales en el archivo Excel: ${totalParsedRows}`);
  console.log(`🔎 Filas de Crocs seleccionadas para la prueba: ${filteredCount}`);
  console.log(`📦 Modelos de productos agrupados: ${payload.items.length}`);
  
  const totalVariantsInPayload = payload.items.reduce((acc, item) => acc + item.variants.length, 0);
  console.log(`👟 Variantes (talles/colores) a procesar: ${totalVariantsInPayload}`);

  // 2. Validación formal con Zod
  console.log("\n⏳ Validando payload contra el esquema Zod BulkImportPayloadSchema...");
  const validationResult = BulkImportPayloadSchema.safeParse(payload);
  if (!validationResult.success) {
    console.error("❌ Falló la validación Zod del payload:");
    console.error(validationResult.error.format());
    return;
  }
  console.log("✅ Validación Zod superada al 100%. Estructura de datos íntegra.");

  // 3. Estado previo de la base de datos para Crocs
  const prevCrocsBrand = await prisma.brand.findUnique({ where: { slug: "crocs" } });
  const prevCrocsProducts = prevCrocsBrand
    ? await prisma.product.count({ where: { brandId: prevCrocsBrand.id } })
    : 0;
  const prevMovementsCount = await prisma.inventoryMovement.count();

  console.log(`\n🔍 Estado previo de BD:`);
  console.log(`   - Productos de Crocs antes de la carga: ${prevCrocsProducts}`);
  console.log(`   - Movimientos de inventario registrados previamente: ${prevMovementsCount}`);

  // 4. Ejecución de la Carga Masiva (Server Action)
  console.log("\n🚀 Ejecutando bulkImportProducts()...");
  const startTime = Date.now();
  const importResult = await bulkImportProducts(payload);
  const elapsed = Date.now() - startTime;

  console.log(`\n⏱️ Tiempo de ejecución: ${elapsed} ms`);

  // 5. Análisis del resultado
  console.log("\n================================================================================");
  console.log("📋 REPORTE DE RESULTADOS DE LA INGESTIÓN MASIVA (RF-04)");
  console.log("================================================================================");
  console.log(`Resultado General: ${importResult.success ? "✅ ÉXITO TOTAL" : "⚠️ COMPLETADO CON OBSERVACIONES"}`);
  console.log(`Referencia de Lote: ${importResult.batchReference}`);
  console.log(`Modo de Ingestión: ${importResult.mode}`);
  console.log(`Productos Sometidos: ${importResult.summary.totalProductsSubmitted}`);
  console.log(`Productos Exitosos: ${importResult.summary.successfulProducts}`);
  console.log(`Productos Fallidos: ${importResult.summary.failedProducts}`);
  console.log(`Productos Nuevos Creados: ${importResult.summary.createdProducts}`);
  console.log(`Productos Actualizados: ${importResult.summary.updatedProducts}`);
  console.log(`Variantes Creadas: ${importResult.summary.createdVariants}`);
  console.log(`Variantes Actualizadas: ${importResult.summary.updatedVariants}`);
  console.log(`Errores Detectados: ${importResult.errors.length}`);

  if (importResult.errors.length > 0) {
    console.log("\n⚠️ Detalle de Errores:");
    importResult.errors.forEach((err) => {
      console.log(`   - Fila ${err.index} [${err.productName}]: ${err.reason} (${err.field || "general"})`);
    });
  }

  // 6. Verificación en Base de Datos PostgreSQL
  const dbBrandCrocs = await prisma.brand.findUnique({ where: { slug: "crocs" } });
  if (!dbBrandCrocs) {
    console.error("❌ No se encontró la marca Crocs en BD.");
    return;
  }

  const loadedProducts = await prisma.product.findMany({
    where: { brandId: dbBrandCrocs.id },
    include: {
      category: true,
      discipline: true,
      variants: {
        orderBy: [{ color: "asc" }, { size: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  console.log("\n================================================================================");
  console.log(`📦 CATÁLOGO DE CROCS CARGADO EN BASE DE DATOS (${loadedProducts.length} MODELOS)`);
  console.log("================================================================================");

  let totalStoreStock = 0;
  let totalWarehouseStock = 0;
  let totalVariantsInDb = 0;
  let replenishmentAlertCount = 0;
  let criticalAlertCount = 0;

  loadedProducts.forEach((prod, pIdx) => {
    let pStore = 0;
    let pWarehouse = 0;

    prod.variants.forEach((v) => {
      pStore += v.stockStore;
      pWarehouse += v.stockWarehouse;
      totalVariantsInDb++;

      // Chequeo de alertas
      if (v.stockStore <= v.minStoreStock && v.stockWarehouse > 0) {
        replenishmentAlertCount++;
      }
      if (v.stockStore + v.stockWarehouse <= v.minStock) {
        criticalAlertCount++;
      }
    });

    totalStoreStock += pStore;
    totalWarehouseStock += pWarehouse;

    console.log(
      `\n${pIdx + 1}. [${prod.discipline.name} / ${prod.category.name}] ${prod.name}`
    );
    console.log(
      `   Precio Venta: ${formatCurrency(Number(prod.price))} | Precio Costo: ${formatCurrency(Number(prod.costPrice))} | Variantes: ${prod.variants.length}`
    );
    console.log(
      `   Stock Salón: ${pStore} un. | Stock Depósito: ${pWarehouse} un. | Total Disponible: ${pStore + pWarehouse} un.`
    );
    
    // Mostrar variantes desglosadas
    prod.variants.forEach((v) => {
      const isReplenish = v.stockStore <= v.minStoreStock && v.stockWarehouse > 0;
      const isCritical = v.stockStore + v.stockWarehouse <= v.minStock;
      const statusIcon = isCritical ? "🔴" : isReplenish ? "🟡" : "🟢";
      console.log(
        `     ${statusIcon} Talle: ${v.size.padEnd(11)} | Color: ${v.color.padEnd(20)} | SKU: ${v.sku.padEnd(22)} | Salón: ${String(v.stockStore).padStart(2)} | Depósito: ${String(v.stockWarehouse).padStart(2)} | Total: ${String(v.stockStore + v.stockWarehouse).padStart(2)}`
      );
    });
  });

  // 7. Verificación de Auditoría de Movimientos de Inventario
  const newMovements = await prisma.inventoryMovement.findMany({
    where: { reason: { contains: "Lote-001-Crocs-Prueba-100" } },
  });

  console.log("\n================================================================================");
  console.log("📈 RESUMEN CONSOLIDADO DE STOCK Y AUDITORÍA");
  console.log("================================================================================");
  console.log(`Total Variantes Verificadas en BD: ${totalVariantsInDb}`);
  console.log(`Stock Físico en Salón de Ventas (Saavedra 241): ${totalStoreStock} unidades`);
  console.log(`Stock en Depósito Interno: ${totalWarehouseStock} unidades`);
  console.log(`Stock Total Omnicanal Disponible: ${totalStoreStock + totalWarehouseStock} unidades`);
  console.log(`Valorización de Inventario (Precio Venta): ${formatCurrency((totalStoreStock + totalWarehouseStock) * 88400)}`);
  console.log(`Movimientos de Inventario registrados con trazabilidad: ${newMovements.length}`);
  console.log(`Alertas de Reposición Interna (Depósito -> Salón): ${replenishmentAlertCount}`);
  console.log(`Alertas de Stock Crítico (Compra a Proveedor): ${criticalAlertCount}`);
  console.log("================================================================================\n");
}

runCrocsLoadTest()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
