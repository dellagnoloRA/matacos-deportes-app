import { prisma } from "../src/lib/prisma";
import {
  getProductDetail,
  checkVariantStock,
  getRelatedProducts,
} from "../src/server/actions/ecommerce/productDetailActions";
import { formatCurrency } from "../src/lib/utils";

async function runRf14Tests() {
  console.log("===============================================================");
  console.log("🧪 TEST SUITE: RF-14 Ficha de Detalle de Producto (PDP) y Stock");
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

  // 1. Obtener un producto real de la base de datos para pruebas
  const sampleProduct = await prisma.product.findFirst({
    where: { active: true, variants: { some: { stockStore: { gt: 0 } } } },
    include: { variants: true, brand: true, category: true, discipline: true },
  });

  if (!sampleProduct) {
    console.error("❌ No se encontró ningún producto activo con variantes en la base de datos.");
    process.exit(1);
  }

  console.log(`📦 Producto de prueba seleccionado: "${sampleProduct.name}" (ID: ${sampleProduct.id})`);
  console.log(`   Disciplina: ${sampleProduct.discipline.name} | Marca: ${sampleProduct.brand.name}\n`);

  // --------------------------------------------------------------------------
  // TEST 1: Consulta por UUID directo
  // --------------------------------------------------------------------------
  console.log("🔹 1. Server Action: getProductDetail(id)");
  const resById = await getProductDetail(sampleProduct.id);
  assert(resById.success, "getProductDetail() por ID responde con éxito");

  if (resById.success && resById.data) {
    const detail = resById.data;
    assert(detail.id === sampleProduct.id, "ID coincide con el producto solicitado");
    assert(detail.name === sampleProduct.name, `Nombre correcto: ${detail.name}`);
    assert(!("costPrice" in detail), "Seguridad: costPrice no está presente en el DTO público");
    assert(typeof detail.price === "number", `Precio base numérico: ${formatCurrency(detail.price)}`);
    assert(Array.isArray(detail.variants), `Variantes devueltas: ${detail.variants.length}`);
    assert(Array.isArray(detail.colorOptions), `Opciones de color generadas: ${detail.colorOptions.length}`);
    assert(Array.isArray(detail.sizeOptions), `Opciones de talle generadas: ${detail.sizeOptions.length}`);
    assert(
      ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].includes(detail.stockStatus),
      `Estado de stock válido: ${detail.stockStatus} (${detail.totalAvailableStock} un. totales)`
    );

    // Verificar cálculo de stock en variantes
    if (detail.variants.length > 0) {
      const v = detail.variants[0];
      assert(!("costPrice" in v), "Seguridad: variante no expone datos de costo");
      assert(
        typeof v.availableStock === "number" && typeof v.inStock === "boolean",
        `Variante ${v.size} / ${v.color}: ${v.availableStock} un. (inStock: ${v.inStock})`
      );
    }
  }

  // --------------------------------------------------------------------------
  // TEST 2: Consulta por Slug Compuesto SEO (nombre-del-producto-uuid)
  // --------------------------------------------------------------------------
  console.log("\n🔹 2. getProductDetail(slug_con_uuid)");
  const compositeSlug = `articulo-deportivo-test-${sampleProduct.id}`;
  const resBySlug = await getProductDetail(compositeSlug);
  assert(
    resBySlug.success && resBySlug.data?.id === sampleProduct.id,
    "Resuelve correctamente el producto desde un slug compuesto de URL"
  );

  // --------------------------------------------------------------------------
  // TEST 3: Verificación de Producto Inexistente
  // --------------------------------------------------------------------------
  console.log("\n🔹 3. getProductDetail() con ID inexistente");
  const notFound = await getProductDetail("00000000-0000-0000-0000-000000000000");
  assert(
    notFound.success === false && notFound.error !== undefined,
    "Retorna error controlado para producto no encontrado o inactivo"
  );

  // --------------------------------------------------------------------------
  // TEST 4: Verificación Atómica de Stock de Variante: checkVariantStock()
  // --------------------------------------------------------------------------
  console.log("\n🔹 4. Server Action: checkVariantStock(variantId)");
  const testVariant = sampleProduct.variants[0];
  const stockCheck = await checkVariantStock(testVariant.id);
  assert(stockCheck.success, "checkVariantStock() ejecutado con éxito");

  if (stockCheck.success && stockCheck.data) {
    const data = stockCheck.data;
    assert(data.variantId === testVariant.id, "ID de variante coincide");
    assert(data.productId === sampleProduct.id, "ID de producto padre coincide");
    assert(
      typeof data.availableStock === "number" && typeof data.isAvailable === "boolean",
      `Stock real verificado: ${data.availableStock} un. (isAvailable: ${data.isAvailable})`
    );
    assert(
      typeof data.price === "number" && data.price > 0,
      `Precio efectivo devuelto: ${formatCurrency(data.price)}`
    );
  }

  // Comprobar variante inexistente
  const invalidStockCheck = await checkVariantStock("00000000-0000-0000-0000-000000000000");
  assert(
    invalidStockCheck.success === false,
    "checkVariantStock() rechaza correctamente variante inexistente"
  );

  // --------------------------------------------------------------------------
  // TEST 5: Productos Relacionados: getRelatedProducts()
  // --------------------------------------------------------------------------
  console.log("\n🔹 5. Server Action: getRelatedProducts(productId, limit)");
  const relatedRes = await getRelatedProducts(sampleProduct.id, 4);
  assert(relatedRes.success, "getRelatedProducts() responde con éxito");

  if (relatedRes.success && relatedRes.data) {
    const list = relatedRes.data;
    assert(Array.isArray(list), `Retorna array de productos recomendados (encontrados: ${list.length})`);
    assert(list.length <= 4, "Respeta el límite solicitado (limit = 4)");

    const containsCurrent = list.some((p) => p.id === sampleProduct.id);
    assert(!containsCurrent, "Excluye el producto actual de las recomendaciones");

    if (list.length > 0) {
      const rel1 = list[0];
      assert(!("costPrice" in rel1), "Seguridad: producto relacionado no expone costo");
      assert(rel1.hasStock === true, `Producto relacionado "${rel1.name}" tiene stock activo`);
    }
  }

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

runRf14Tests().catch((err) => {
  console.error("Error fatal en pruebas RF-14:", err);
  process.exit(1);
});
