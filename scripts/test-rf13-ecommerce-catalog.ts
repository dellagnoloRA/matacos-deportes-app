import {
  CatalogFilterSchema,
  PredictiveSearchSchema,
} from "../src/schemas/ecommerce";
import {
  getPublicCatalog,
  getPredictiveSearch,
  getCatalogFacets,
  revalidateEcommerceCatalogCache,
} from "../src/server/actions/ecommerce/catalogActions";
import { formatCurrency } from "../src/lib/utils";

async function runRf13Tests() {
  console.log("===============================================================");
  console.log("🧪 TEST SUITE: RF-13 Catálogo Digital y Búsqueda Predictiva");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Detalle: ${detail}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Esquema Zod CatalogFilterSchema
  // --------------------------------------------------------------------------
  console.log("🔹 1. Validación de Esquemas Zod (CatalogFilterSchema)");
  try {
    const valid = CatalogFilterSchema.parse({
      disciplineSlug: "natacion",
      minPrice: "5000",
      maxPrice: "45000",
      sort: "price_asc",
      page: "2",
      limit: "12",
    });
    assert(
      valid.minPrice === 5000 &&
        valid.maxPrice === 45000 &&
        valid.page === 2 &&
        valid.limit === 12 &&
        valid.sort === "price_asc",
      "Coerción de query params a tipos nativos exitosa"
    );
  } catch (e: any) {
    assert(false, "Fallo en parseo de filtros válidos", e.message);
  }

  try {
    CatalogFilterSchema.parse({ minPrice: 50000, maxPrice: 10000 });
    assert(false, "Debe rechazar minPrice > maxPrice");
  } catch {
    assert(true, "Rechaza correctamente minPrice > maxPrice");
  }

  try {
    CatalogFilterSchema.parse({ minPrice: -500 });
    assert(false, "Debe rechazar minPrice negativo");
  } catch {
    assert(true, "Rechaza correctamente minPrice negativo");
  }

  try {
    const validGender = CatalogFilterSchema.parse({ gender: "mujer" });
    assert(validGender.gender === "MUJER", "Coerción y normalización de género 'mujer' -> 'MUJER' exitosa");
  } catch (e: any) {
    assert(false, "Fallo en parseo de género válido", e.message);
  }

  try {
    CatalogFilterSchema.parse({ gender: "invalido" });
    assert(false, "Debe rechazar género inválido");
  } catch {
    assert(true, "Rechaza correctamente género inválido");
  }

  // --------------------------------------------------------------------------
  // TEST 2: Consulta de Catálogo Público con Paginación
  // --------------------------------------------------------------------------
  console.log("\n🔹 2. Server Action: getPublicCatalog()");
  const catalogRes = await getPublicCatalog({ page: 1, limit: 6 });
  assert(catalogRes.success, "Ejecución exitosa de getPublicCatalog()");

  if (catalogRes.success && catalogRes.data) {
    const { products, pagination } = catalogRes.data;
    assert(Array.isArray(products), "Retorna lista de productos");
    assert(pagination.totalItems >= 0, `Conteo total de artículos: ${pagination.totalItems}`);
    assert(pagination.limit === 6, "Aplica límite solicitado (take: 6)");

    if (products.length > 0) {
      const first = products[0];
      assert(
        !("costPrice" in first),
        "Seguridad: costPrice no está expuesto en los productos devueltos"
      );
      assert(
        first.hasStock === true && first.totalAvailableStock > 0,
        `Filtrado estricto: producto "${first.name}" tiene stock disponible (${first.totalAvailableStock} un.)`
      );
      assert(
        typeof first.price === "number" && first.price > 0,
        `Precio base válido: ${formatCurrency(first.price)}`
      );
      assert(
        Array.isArray(first.variants) && first.variants.length > 0,
        `Incluye variantes públicas con talle y color (${first.variants.length} variantes)`
      );
    }
  }

  // --------------------------------------------------------------------------
  // TEST 3: Ordenamiento de Catálogo por Precio
  // --------------------------------------------------------------------------
  console.log("\n🔹 3. Ordenamiento por Precio (price_asc / price_desc)");
  const ascRes = await getPublicCatalog({ sort: "price_asc", limit: 4 });
  if (ascRes.success && ascRes.data && ascRes.data.products.length >= 2) {
    const p1 = ascRes.data.products[0].price;
    const p2 = ascRes.data.products[1].price;
    assert(p1 <= p2, `Orden ascendente verificado: ${formatCurrency(p1)} <= ${formatCurrency(p2)}`);
  } else {
    console.log("  ⚠️ [SKIP] No hay suficientes productos para comparar orden ascendente");
  }

  const descRes = await getPublicCatalog({ sort: "price_desc", limit: 4 });
  if (descRes.success && descRes.data && descRes.data.products.length >= 2) {
    const p1 = descRes.data.products[0].price;
    const p2 = descRes.data.products[1].price;
    assert(p1 >= p2, `Orden descendente verificado: ${formatCurrency(p1)} >= ${formatCurrency(p2)}`);
  } else {
    console.log("  ⚠️ [SKIP] No hay suficientes productos para comparar orden descendente");
  }

  // --------------------------------------------------------------------------
  // TEST 4: Búsqueda Predictiva Rápida (Navbar Autocomplete)
  // --------------------------------------------------------------------------
  console.log("\n🔹 4. Server Action: getPredictiveSearch()");
  const shortSearch = await getPredictiveSearch("a");
  assert(
    shortSearch.success && shortSearch.data?.length === 0,
    "Búsqueda con < 2 caracteres retorna array vacío inmediato sin tocar BD"
  );

  const realSearch = await getPredictiveSearch("croc", 6);
  assert(realSearch.success, "Búsqueda predictiva con texto real ejecutada con éxito");
  if (realSearch.success && realSearch.data) {
    console.log(`     Encontrados ${realSearch.data.length} resultados predictivos para 'croc'`);
    if (realSearch.data.length > 0) {
      const item = realSearch.data[0];
      assert(
        !("costPrice" in item),
        "Seguridad: item predictivo no expone datos de costo"
      );
      assert(
        item.availableStock > 0,
        `Resultado en stock: ${item.name} (${formatCurrency(item.price)})`
      );
    }
  }

  // --------------------------------------------------------------------------
  // TEST 5: Facetas y Contadores Dinámicos (Filtros Laterales)
  // --------------------------------------------------------------------------
  console.log("\n🔹 5. Server Action: getCatalogFacets()");
  const facetsRes = await getCatalogFacets();
  assert(facetsRes.success, "Ejecución de getCatalogFacets() exitosa");

  if (facetsRes.success && facetsRes.data) {
    const { disciplines, categories, brands, sizes, priceRange } = facetsRes.data;
    assert(Array.isArray(disciplines), `Disciplinas con stock detectadas: ${disciplines.length}`);
    assert(Array.isArray(categories), `Categorías con stock detectadas: ${categories.length}`);
    assert(Array.isArray(brands), `Marcas con stock detectadas: ${brands.length}`);
    assert(Array.isArray(sizes), `Talles únicos en inventario: ${sizes.length}`);
    assert(
      priceRange.min >= 0 && priceRange.max >= priceRange.min,
      `Rango global de precios: ${formatCurrency(priceRange.min)} - ${formatCurrency(priceRange.max)}`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 6: Revalidación de Caché
  // --------------------------------------------------------------------------
  console.log("\n🔹 6. Revalidación de Caché (revalidateEcommerceCatalogCache)");
  const revalRes = await revalidateEcommerceCatalogCache();
  assert(revalRes.success, "Invocación de revalidateEcommerceCatalogCache() exitosa");

  // --------------------------------------------------------------------------
  // RESUMEN FINAL
  // --------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log(`📊 RESULTADOS: ${passed} pasados, ${failed} fallidos`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRf13Tests().catch((err) => {
  console.error("Error fatal en suite de pruebas:", err);
  process.exit(1);
});
