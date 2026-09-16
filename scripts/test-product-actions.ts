import { createCategory, createBrand, createDiscipline } from "../src/server/actions/categoryActions";
import { createProduct, getProducts, toggleProductActive } from "../src/server/actions/productActions";
import { formatCurrency } from "../src/lib/utils";

async function runBackendVerification() {
  console.log("==================================================");
  console.log("🧪 INICIANDO VERIFICACIÓN DE SERVER ACTIONS BACKEND");
  console.log("==================================================\n");

  // 1. Crear Disciplina
  console.log("1. Creando disciplina de prueba 'Natación'...");
  let discRes = await createDiscipline({ name: "Natación" });
  if (!discRes.success) {
    // Si ya existe por el seed, obtenerla
    const { getDisciplines } = await import("../src/server/actions/categoryActions");
    const allDisc = await getDisciplines();
    discRes = { success: true, data: allDisc.data?.find((d: { slug: string }) => d.slug === "natacion") as any };
  }

  console.log(`✅ Disciplina: ${discRes.data!.name} (ID: ${discRes.data!.id})`);

  // 2. Crear Categoría
  console.log("\n2. Creando categoría de prueba 'Indumentaria Acuática'...");
  const catRes = await createCategory({ name: "Indumentaria Acuática" });
  console.log(`✅ Categoría: ${catRes.data?.name || "Existente"} (ID: ${catRes.data?.id})`);

  // 3. Crear Marca
  console.log("\n3. Creando marca de prueba 'Speedo Racing'...");
  const brandRes = await createBrand({ name: "Speedo Racing" });
  console.log(`✅ Marca: ${brandRes.data?.name || "Existente"} (ID: ${brandRes.data?.id})`);

  // 4. Crear Producto con Variantes y Stock Dual
  console.log("\n4. Creando producto de prueba con variantes duales...");
  const productInput = {
    name: "Malla de Competición Carbon Pro",
    description: "Malla de natación de alta tecnología para competencia",
    disciplineId: discRes.data!.id,
    costPrice: 45000,
    price: 85000,
    categoryId: catRes.data!.id,
    brandId: brandRes.data!.id,
    active: true,
    variants: [
      {
        size: "M",
        color: "Negro / Oro",
        sku: "ARE-CAR-M-NOG-TEST",
        barcode: "779900100101",
        stockStore: 5,
        stockWarehouse: 10,
        minStoreStock: 2,
        minStock: 3,
      },
      {
        size: "L",
        color: "Negro / Oro",
        sku: "ARE-CAR-L-NOG-TEST",
        barcode: "779900100102",
        stockStore: 3,
        stockWarehouse: 6,
        minStoreStock: 1,
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
    console.log(`   - Talle ${v.size} | Color ${v.color} | SKU: ${v.sku} | Salón: ${v.stockStore} | Depósito: ${v.stockWarehouse}`);
  });

  // 5. Búsqueda de Productos
  console.log("\n5. Probando búsqueda de productos con filtro '779900100101' (Barcode)...");
  const searchRes = await getProducts({ search: "779900100101" });
  if (searchRes.success && searchRes.data) {
    console.log(`✅ Productos encontrados: ${searchRes.data.length}`);
    searchRes.data.forEach((p) => {
      console.log(`   - [${p.brand.name}] ${p.name} | Cat: ${p.category.name} | Disc: ${p.discipline.name}`);
    });
  }

  // 6. Probar borrado lógico (Toggle Active)
  console.log("\n6. Probando toggle active (desactivar producto)...");
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
