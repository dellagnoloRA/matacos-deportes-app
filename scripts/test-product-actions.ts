import { createCategory, createBrand } from "../src/server/actions/categoryActions";
import { createProduct, getProducts, toggleProductActive } from "../src/server/actions/productActions";
import { formatCurrency } from "../src/lib/utils";

async function runBackendVerification() {
  console.log("==================================================");
  console.log("🧪 INICIANDO VERIFICACIÓN DE SERVER ACTIONS BACKEND");
  console.log("==================================================\n");

  // 1. Crear Categoría
  console.log("1. Creando categoría de prueba 'Natación y Accesorios'...");
  const catRes = await createCategory({ name: "Natación y Accesorios" });
  if (!catRes.success || !catRes.data) {
    console.error("❌ Error al crear categoría:", catRes.error);
    return;
  }
  console.log(`✅ Categoría creada: ${catRes.data.name} (ID: ${catRes.data.id})`);

  // 2. Crear Marca
  console.log("\n2. Creando marca de prueba 'Arena'...");
  const brandRes = await createBrand({ name: "Arena" });
  if (!brandRes.success || !brandRes.data) {
    console.error("❌ Error al crear marca:", brandRes.error);
    return;
  }
  console.log(`✅ Marca creada: ${brandRes.data.name} (ID: ${brandRes.data.id})`);

  // 3. Crear Producto con Variantes
  console.log("\n3. Creando producto de prueba con variantes...");
  const productInput = {
    name: "Malla de Competición Carbon Pro",
    description: "Malla de natación de alta tecnología para competencia",
    discipline: "Natación",
    costPrice: 45000,
    price: 85000,
    categoryId: catRes.data.id,
    brandId: brandRes.data.id,
    active: true,
    variants: [
      {
        size: "M",
        color: "Negro / Oro",
        sku: "ARE-CAR-M-NOG",
        barcode: "779900100101",
        stockLocal: 5,
        stockWeb: 2,
        minStock: 2,
      },
      {
        size: "L",
        color: "Negro / Oro",
        sku: "ARE-CAR-L-NOG",
        barcode: "779900100102",
        stockLocal: 3,
        stockWeb: 1,
        minStock: 2,
      },
    ],
  };

  const prodRes = await createProduct(productInput);
  if (!prodRes.success || !prodRes.data) {
    console.error("❌ Error al crear producto:", prodRes.error);
    return;
  }

  const createdProd = prodRes.data;
  console.log(`✅ Producto creado: "${createdProd.name}"`);
  console.log(`   Precio de Venta: ${formatCurrency(Number(createdProd.price))}`);
  console.log(`   Variantes asociadas: ${createdProd.variants.length}`);
  createdProd.variants.forEach((v) => {
    console.log(`   - Talle ${v.size} | Color ${v.color} | SKU: ${v.sku} | Barcode: ${v.barcode} | Stock Local: ${v.stockLocal} | Stock Web: ${v.stockWeb}`);
  });

  // 4. Búsqueda de Productos por Código de Barras / SKU / Texto
  console.log("\n4. Probando búsqueda de productos con filtro '779900100101' (Barcode)...");
  const searchRes = await getProducts({ search: "779900100101" });
  if (searchRes.success && searchRes.data) {
    console.log(`✅ Productos encontrados: ${searchRes.data.length}`);
    searchRes.data.forEach((p) => {
      console.log(`   - [${p.brand.name}] ${p.name} | Cat: ${p.category.name}`);
    });
  }

  // 5. Probar borrado lógico (Toggle Active)
  console.log("\n5. Probando toggle active (desactivar producto)...");
  const toggleRes = await toggleProductActive(createdProd.id);
  if (toggleRes.success && toggleRes.data) {
    console.log(`✅ Estado actualizado: ${toggleRes.message}`);
    console.log(`   active = ${toggleRes.data.active}`);
  }

  // Reactivar el producto
  await toggleProductActive(createdProd.id);

  console.log("\n==================================================");
  console.log("🎉 ¡VERIFICACIÓN BACKEND COMPLETADA EXITOSAMENTE!");
  console.log("==================================================");
}

runBackendVerification().catch(console.error);
