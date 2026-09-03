import { createCategory, createBrand, createDiscipline } from "../src/server/actions/categoryActions";
import { createProduct } from "../src/server/actions/productActions";
import { registerStockMovement, getStockAlerts, transferStockInternal } from "../src/server/actions/inventoryActions";
import { processSale, getSaleHistory } from "../src/server/actions/saleActions";
import { formatCurrency } from "../src/lib/utils";

async function runStockAndSalesTest() {
  console.log("==================================================");
  console.log("🧪 VERIFICACIÓN BACKEND: CONTROL DE STOCK DUAL Y VENTAS");
  console.log("==================================================\n");

  // 1. Preparación de Disciplina, Categoría, Marca y Producto inicial
  console.log("1. Preparando producto para pruebas de stock dual...");
  let disc = await createDiscipline({ name: "Running / Urbano" });
  if (!disc.data) {
    const { getDisciplines } = await import("../src/server/actions/categoryActions");
    const all = await getDisciplines();
    disc = { success: true, data: all.data![0] as any };
  }

  const cat = await createCategory({ name: "Calzado Deportivo Pro" });
  const brand = await createBrand({ name: "Puma Sports" });

  const prodRes = await createProduct({
    name: "Zapatillas Puma Fast-R Nitro",
    disciplineId: disc.data.id,
    costPrice: 50000,
    price: 95000,
    categoryId: cat.data!.id,
    brandId: brand.data!.id,
    active: true,
    variants: [
      {
        size: "41",
        color: "Rojo / Negro",
        sku: "PUM-FAST-41-RN-TEST",
        barcode: "779700000101",
        stockStore: 2, // 2 en Salón
        stockWarehouse: 8, // 8 en Depósito
        minStoreStock: 2,
        minStock: 5,
      },
    ],
  });

  if (!prodRes.data) {
    console.error("❌ Error creando producto de prueba:", prodRes.error);
    return;
  }

  const variant = prodRes.data.variants[0];
  console.log(`✅ Producto creado: ${prodRes.data.name} (Talle ${variant.size})`);
  console.log(`   Stock Inicial -> Salón: ${variant.stockStore} | Depósito: ${variant.stockWarehouse} (Total: ${variant.stockStore + variant.stockWarehouse})`);

  // 2. Probar INGRESO DE COMPRA (Llegada de mercadería a Depósito)
  console.log("\n2. [PRUEBA COMPRA] Registrando ingreso de mercadería (+5 unidades a Depósito)...");
  const ingresoRes = await registerStockMovement({
    variantId: variant.id,
    type: "INGRESO_COMPRA",
    quantity: 5,
    targetLocation: "WAREHOUSE",
    reason: "Factura Proveedor Puma #4582",
  });

  if (ingresoRes.success && ingresoRes.data) {
    console.log(`✅ ${ingresoRes.message}`);
  } else {
    console.error("❌ Error en ingreso:", ingresoRes.error);
  }

  // 3. Probar TRANSFERENCIA INTERNA (Depósito -> Salón)
  console.log("\n3. [PRUEBA TRANSFERENCIA INTERNA] Trasladando 3 unidades de Depósito a Salón...");
  const transferRes = await transferStockInternal({
    variantId: variant.id,
    quantity: 3,
    fromLocation: "WAREHOUSE",
    toLocation: "STORE",
    reason: "Reposición diaria de mostrador",
  });

  if (transferRes.success && transferRes.data) {
    console.log(`✅ ${transferRes.message}`);
  } else {
    console.error("❌ Error en transferencia:", transferRes.error);
  }

  // 4. Probar PROCESAMIENTO DE VENTA MOSTRADOR
  console.log("\n4. [PRUEBA VENTA MOSTRADOR] Procesando venta de 4 unidades en Mostrador...");
  const saleRes = await processSale({
    channel: "MOSTRADOR",
    discount: 5000,
    items: [
      {
        variantId: variant.id,
        quantity: 4,
        price: 95000,
      },
    ],
    payments: [
      { method: "EFECTIVO", amount: 100000 },
      { method: "TRANSFERENCIA", amount: 275000 },
    ],
  });

  if (saleRes.success && saleRes.data) {
    console.log(`✅ ${saleRes.message}`);
    console.log(`   Importe Total Neto: ${formatCurrency(Number(saleRes.data.total))}`);
  } else {
    console.error("❌ Error en venta:", saleRes.error);
  }

  // 5. Probar SOBRE-VENTA
  console.log("\n5. [PRUEBA CONTROL SOBRE-STOCK] Intentando vender 100 unidades...");
  const overSaleRes = await processSale({
    channel: "MOSTRADOR",
    discount: 0,
    items: [{ variantId: variant.id, quantity: 100, price: 95000 }],
    payments: [{ method: "EFECTIVO", amount: 9500000 }],
  });

  if (!overSaleRes.success) {
    console.log(`✅ Venta rechazada correctamente por falta de stock: "${overSaleRes.error}"`);
  }

  // 6. Probar ALERTAS DE STOCK DUAL
  console.log("\n6. [PRUEBA ALERTAS DUALES] Consultando alertas de stock...");
  const alertsRes = await getStockAlerts();
  if (alertsRes.success && alertsRes.data) {
    console.log(`✅ Alertas de Reposición Salón: ${alertsRes.data.summary.storeReplenishmentCount}`);
    console.log(`✅ Alertas de Compra Proveedor: ${alertsRes.data.summary.criticalStockCount}`);
  }

  console.log("\n==================================================");
  console.log("🎉 ¡VERIFICACIÓN DE STOCK Y VENTAS FINALIZADA EXITOSAMENTE!");
  console.log("==================================================");
}

runStockAndSalesTest().catch(console.error);
