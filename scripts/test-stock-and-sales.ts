import { createCategory, createBrand } from "../src/server/actions/categoryActions";
import { createProduct } from "../src/server/actions/productActions";
import { registerStockMovement, getStockAlerts } from "../src/server/actions/inventoryActions";
import { processSale, getSaleHistory } from "../src/server/actions/saleActions";
import { formatCurrency } from "../src/lib/utils";

async function runStockAndSalesTest() {
  console.log("==================================================");
  console.log("🧪 VERIFICACIÓN BACKEND: CONTROL DE STOCK Y VENTAS");
  console.log("==================================================\n");

  // 1. Preparación de Categoría, Marca y Producto inicial
  console.log("1. Preparando producto para pruebas de stock...");
  const cat = await createCategory({ name: "Calzado Deportivo" });
  const brand = await createBrand({ name: "Puma" });

  if (!cat.data || !brand.data) {
    console.error("❌ Error creando datos base");
    return;
  }

  const prodRes = await createProduct({
    name: "Zapatillas Puma Fast-R",
    discipline: "Running",
    costPrice: 50000,
    price: 95000,
    categoryId: cat.data.id,
    brandId: brand.data.id,
    active: true,
    variants: [
      {
        size: "41",
        color: "Rojo / Negro",
        sku: "PUM-FAST-41-RN",
        barcode: "779700000101",
        stockLocal: 10, // Stock inicial = 10
        stockWeb: 0,
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
  console.log(`   Stock Local Inicial: ${variant.stockLocal}`);

  // 2. Probar INGRESO DE COMPRA (Llegada de mercadería)
  console.log("\n2. [PRUEBA COMPRA] Registrando ingreso de mercadería (+5 unidades)...");
  const ingresoRes = await registerStockMovement({
    variantId: variant.id,
    type: "INGRESO_COMPRA",
    quantity: 5,
    reason: "Factura Proveedor Puma #4582",
  });

  if (ingresoRes.success && ingresoRes.data) {
    console.log(`✅ ${ingresoRes.message}`);
  } else {
    console.error("❌ Error en ingreso:", ingresoRes.error);
  }

  // 3. Probar PROCESAMIENTO DE VENTA VÁLIDA (Descuento de stock en tiempo real)
  console.log("\n3. [PRUEBA VENTA VÁLIDA] Procesando venta de 3 unidades en Mostrador...");
  const saleRes = await processSale({
    channel: "MOSTRADOR",
    discount: 5000, // Descuento de $5.000
    items: [
      {
        variantId: variant.id,
        quantity: 3,
        price: 95000,
      },
    ],
    payments: [
      { method: "EFECTIVO", amount: 100000 },
      { method: "TRANSFERENCIA", amount: 180000 }, // Pago combinado
    ],
  });

  if (saleRes.success && saleRes.data) {
    console.log(`✅ ${saleRes.message}`);
    console.log(`   Importe Total Neto: ${formatCurrency(Number(saleRes.data.total))}`);
    console.log(`   Ítems vendidos: ${saleRes.data.items.length}`);
    console.log(`   Formas de Pago: ${saleRes.data.payments.map((p) => `${p.method}: ${formatCurrency(Number(p.amount))}`).join(" | ")}`);
  } else {
    console.error("❌ Error en procesamiento de venta:", saleRes.error);
  }

  // 4. Probar PROCESAMIENTO DE VENTA SOBRE-STOCK (Debe fallar sin alterar la BD)
  console.log("\n4. [PRUEBA CONTROL DE SOBRE-STOCK] Intentando vender 50 unidades (Stock disponible actual: 12)...");
  const overSaleRes = await processSale({
    channel: "MOSTRADOR",
    discount: 0,
    items: [
      {
        variantId: variant.id,
        quantity: 50,
        price: 95000,
      },
    ],
    payments: [{ method: "EFECTIVO", amount: 4750000 }],
  });

  if (!overSaleRes.success) {
    console.log(`✅ Venta rechazada correctamente por falta de stock: "${overSaleRes.error}"`);
  } else {
    console.error("❌ ERROR: El sistema permitió vender más stock del disponible");
  }

  // 5. Probar AJUSTE DE EGRESO DE STOCK (Rotura / Pérdida)
  console.log("\n5. [PRUEBA AJUSTE EGRESO] Registrando ajuste manual (-2 unidades por falla)...");
  const ajusteRes = await registerStockMovement({
    variantId: variant.id,
    type: "AJUSTE_EGRESO",
    quantity: 2,
    reason: "Caja dañada por humedad en depósito",
  });

  if (ajusteRes.success && ajusteRes.data) {
    console.log(`✅ ${ajusteRes.message}`);
  }

  // 6. Consultar Historial de Ventas
  console.log("\n6. Consultando historial de ventas desde PostgreSQL...");
  const historyRes = await getSaleHistory();
  if (historyRes.success && historyRes.data) {
    console.log(`✅ Ventas registradas en historial: ${historyRes.data.length}`);
  }

  console.log("\n==================================================");
  console.log("🎉 ¡VERIFICACIÓN DE STOCK Y VENTAS FINALIZADA EXITOSAMENTE!");
  console.log("==================================================");
}

runStockAndSalesTest().catch(console.error);
