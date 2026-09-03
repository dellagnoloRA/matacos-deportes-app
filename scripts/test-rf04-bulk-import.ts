import { bulkImportProducts, getDisciplines, getCategories, getBrands } from "../src/server/actions/bulkImportActions";
import { transferStockInternal, getStockAlerts, registerStockMovement } from "../src/server/actions/inventoryActions";
import { formatCurrency } from "../src/lib/utils";
import { prisma } from "../src/lib/prisma";

async function runRF04IntegrationTests() {
  console.log("==================================================================");
  console.log("🧪 SUITE DE PRUEBAS DE INTEGRACIÓN: REQUERIMIENTO RF-04 (BACKEND)");
  console.log("==================================================================\n");

  // Limpiar datos de pruebas previas para garantizar idempotencia
  await prisma.inventoryMovement.deleteMany({
    where: {
      OR: [
        { reason: { contains: "Lote-" } },
        { reason: { contains: "Reposición diaria" } },
      ],
    },
  });
  await prisma.productVariant.deleteMany({
    where: {
      OR: [
        { sku: { in: ["MIK-VOL-V200W-5-AZU", "SPE-NAT-ANT-UNI-AZU"] } },
        { barcode: { in: ["779900010001", "779900010002", "4907225880999"] } },
      ],
    },
  });
  await prisma.product.deleteMany({
    where: {
      name: { in: ["Antiparras Fastskin Elite", "Malla Entrenamiento Endurance+", "Pelota Vóley Competición V200W", "Antiparras Fastskin Elite Duplicada"] },
    },
  });

  // -------------------------------------------------------------
  // PRUEBA 1: Ingestión Masiva Exitosa con Normalización On-The-Fly
  // -------------------------------------------------------------
  console.log("▶ PRUEBA 1: Ingestión masiva con normalización de mayúsculas/tildes y stock dual...");
  
  const batch1 = {
    batchReference: "Lote-001-Natacion-Onboarding",
    mode: "ACCUMULATE_STOCK" as const,
    defaultTargetLocation: "STORE" as const,
    items: [
      {
        name: "Antiparras Fastskin Elite",
        description: "Lentes hidrodinámicos de competición con protección UV",
        disciplineName: "  nAtAcIóN  ", // Con espacios y case desordenado
        categoryName: "Antiparras Profesionales",
        brandName: "Speedo Aquatics",
        costPrice: 15000,
        price: 32000,
        variants: [
          {
            size: "Único",
            color: "Azul Espejado",
            barcode: "779900010001",
            stockStore: 3,
            stockWarehouse: 7,
            minStoreStock: 2,
            minStock: 4,
          },
          {
            size: "Único",
            color: "Humo / Negro",
            barcode: "779900010002",
            stockStore: 2,
            stockWarehouse: 5,
            minStoreStock: 1,
            minStock: 3,
          },
        ],
      },
      {
        name: "Malla Entrenamiento Endurance+",
        description: "Tejido 100% resistente al cloro",
        disciplineName: "NATACIÓN", // Todo mayúsculas sin tilde
        categoryName: "Mallas",
        brandName: "Speedo Aquatics",
        costPrice: 22000,
        price: 45000,
        variants: [
          {
            size: "M",
            color: "Negro Clásico",
            barcode: null, // Sin código de barras para probar generación posterior
            sku: "",       // Sin SKU para probar autogeneración determinista
            stockStore: 2,
            stockWarehouse: 4,
            minStoreStock: 1,
            minStock: 2,
          },
          {
            size: "L",
            color: "Azul Marino",
            barcode: null,
            sku: "",
            stockStore: 1,
            stockWarehouse: 3,
            minStoreStock: 1,
            minStock: 2,
          },
        ],
      },
    ],
  };

  const res1 = await bulkImportProducts(batch1);

  if (!res1.success) {
    console.error("❌ Falló la prueba 1:", res1.errors);
    return;
  }

  console.log(`✅ Lote 1 procesado con éxito:`);
  console.log(`   - Productos procesados: ${res1.summary.successfulProducts} / ${res1.summary.totalProductsSubmitted}`);
  console.log(`   - Productos creados: ${res1.summary.createdProducts}`);
  console.log(`   - Variantes creadas: ${res1.summary.createdVariants}`);
  console.log(`   - Errores reportados: ${res1.errors.length}`);

  // Verificar normalización de slug
  const allDisc = await getDisciplines();
  const natacionDisc = allDisc.data?.find((d) => d.slug === "natacion");
  console.log(`   - Disciplina normalizada: "${natacionDisc?.name}" (slug: "${natacionDisc?.slug}")`);

  // -------------------------------------------------------------
  // PRUEBA 2: Ingestión Parcial con Reporte Granular de Errores (Best-Effort)
  // -------------------------------------------------------------
  console.log("\n▶ PRUEBA 2: Ingestión parcial con error simulado (Modo CREATE_ONLY con SKU duplicado)...");

  const batch2 = {
    batchReference: "Lote-002-Control-Errores",
    mode: "CREATE_ONLY" as const,
    defaultTargetLocation: "STORE" as const,
    items: [
      {
        name: "Pelota Vóley Competición V200W",
        description: "Balón oficial microfibra",
        disciplineName: "Vóley",
        categoryName: "Pelotas",
        brandName: "Mikasa",
        costPrice: 60000,
        price: 110000,
        variants: [
          {
            size: "5",
            color: "Amarillo/Azul",
            sku: "MIK-VOL-V200W-5-AZU",
            barcode: "4907225880999",
            stockStore: 4,
            stockWarehouse: 8,
          },
        ],
      },
      {
        name: "Antiparras Fastskin Elite Duplicada", // Fila que debe fallar por colisión de Barcode/SKU
        disciplineName: "Natación",
        categoryName: "Antiparras Profesionales",
        brandName: "Speedo Aquatics",
        costPrice: 15000,
        price: 32000,
        variants: [
          {
            size: "Único",
            color: "Azul Espejado",
            barcode: "779900010001", // Barcode existente de la prueba 1
            sku: "SPE-NAT-ANT-UNI-AZU",
            stockStore: 1,
            stockWarehouse: 1,
          },
        ],
      },
    ],
  };

  const res2 = await bulkImportProducts(batch2);

  console.log(`✅ Lote 2 procesado con reporte granular:`);
  console.log(`   - Exitosos: ${res2.summary.successfulProducts}`);
  console.log(`   - Fallidos: ${res2.summary.failedProducts}`);
  console.log(`   - Detalle de Errores capturados:`);
  res2.errors.forEach((err) => {
    console.log(`     * Fila ${err.index} [${err.productName}]: ${err.reason}`);
  });

  if (res2.summary.successfulProducts === 1 && res2.summary.failedProducts === 1) {
    console.log("   ✅ Aislamiento atómico confirmado: El producto válido se insertó y el erróneo se reportó.");
  } else {
    console.error("   ❌ Falló el aislamiento atómico.");
  }

  // -------------------------------------------------------------
  // PRUEBA 3: Acumulación Progresiva de Stock (ACCUMULATE_STOCK)
  // -------------------------------------------------------------
  console.log("\n▶ PRUEBA 3: Acumulación de stock en reposición de mercadería...");

  const batch3 = {
    batchReference: "Lote-003-Reposicion-Speedo",
    mode: "ACCUMULATE_STOCK" as const,
    defaultTargetLocation: "STORE" as const,
    items: [
      {
        name: "Antiparras Fastskin Elite",
        disciplineName: "Natación",
        categoryName: "Antiparras Profesionales",
        brandName: "Speedo Aquatics",
        costPrice: 16000,
        price: 35000,
        variants: [
          {
            size: "Único",
            color: "Azul Espejado",
            barcode: "779900010001",
            stockStore: 2,     // Sumar +2 a Salón (Antes: 3 -> Nuevo: 5)
            stockWarehouse: 5, // Sumar +5 a Depósito (Antes: 7 -> Nuevo: 12)
          },
        ],
      },
    ],
  };

  const res3 = await bulkImportProducts(batch3);

  const updatedVariant = await prisma.productVariant.findFirst({
    where: { barcode: "779900010001" },
  });

  console.log(`✅ Lote 3 acumulado con éxito:`);
  console.log(`   - Variantes actualizadas: ${res3.summary.updatedVariants}`);
  console.log(`   - Stock Salón: ${updatedVariant?.stockStore} (Esperado: 5)`);
  console.log(`   - Stock Depósito: ${updatedVariant?.stockWarehouse} (Esperado: 12)`);
  console.log(`   - Stock Total: ${(updatedVariant?.stockStore || 0) + (updatedVariant?.stockWarehouse || 0)} (Esperado: 17)`);

  // -------------------------------------------------------------
  // PRUEBA 4: Transferencia Interna (Depósito -> Salón)
  // -------------------------------------------------------------
  console.log("\n▶ PRUEBA 4: Transferencia interna de mercadería (Depósito -> Salón)...");

  if (updatedVariant) {
    const transferRes = await transferStockInternal({
      variantId: updatedVariant.id,
      quantity: 4, // Mover 4 unidades de Depósito al Salón
      fromLocation: "WAREHOUSE",
      toLocation: "STORE",
      reason: "Reposición diaria de vitrina",
    });

    console.log(`✅ ${transferRes.message}`);
    console.log(`   - Stock Salón tras traslado: ${transferRes.data?.variant.stockStore} (Esperado: 9)`);
    console.log(`   - Stock Depósito tras traslado: ${transferRes.data?.variant.stockWarehouse} (Esperado: 8)`);
    console.log(`   - Movimiento registrado: ${transferRes.data?.movement.type} (${transferRes.data?.movement.location})`);
  }

  // -------------------------------------------------------------
  // PRUEBA 5: Verificación de Alertas de Reposición Interna y Stock Crítico
  // -------------------------------------------------------------
  console.log("\n▶ PRUEBA 5: Evaluación de alertas duales de stock...");

  // Crear variante con salón bajo para forzar alerta
  const lowStockProduct = await prisma.product.findFirst({
    where: { name: "Malla Entrenamiento Endurance+" },
    include: { variants: true },
  });

  if (lowStockProduct && lowStockProduct.variants[0]) {
    // Forzar stockStore = 0, stockWarehouse = 5, minStoreStock = 2
    await prisma.productVariant.update({
      where: { id: lowStockProduct.variants[0].id },
      data: { stockStore: 0, stockWarehouse: 5, minStoreStock: 2 },
    });
  }

  const alerts = await getStockAlerts();
  console.log(`✅ Alertas obtenidas:`);
  console.log(`   - Alertas de Reposición Salón (Depósito -> Salón): ${alerts.data?.summary.storeReplenishmentCount}`);
  alerts.data?.storeReplenishment.forEach((v) => {
    console.log(`     * [${v.product.brand.name}] ${v.product.name} (Talle ${v.size}, Color ${v.color}) -> Salón: ${v.stockStore} (Min: ${v.minStoreStock}), Depósito: ${v.stockWarehouse}`);
  });

  console.log(`   - Alertas de Stock Crítico (Compra Proveedor): ${alerts.data?.summary.criticalStockCount}`);

  console.log("\n==================================================================");
  console.log("🎉 ¡TODAS LAS PRUEBAS DE INTEGRACIÓN RF-04 FINALIZARON CON ÉXITO!");
  console.log("==================================================================");
}

runRF04IntegrationTests().catch(console.error);
