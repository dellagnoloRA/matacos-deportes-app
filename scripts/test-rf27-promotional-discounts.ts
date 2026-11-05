/**
 * Suite de Pruebas Automatizadas: RF-27 Descuentos Promocionales y Salvaguarda de Costos
 * Ejecutable vía tsx: pnpm exec tsx scripts/test-rf27-promotional-discounts.ts
 */

import { prisma } from "../src/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  setProductDiscount,
  applyCategoryDiscount,
  removeCategoryDiscount,
  getPromoCampaigns,
} from "../src/server/actions/ecommerce/promotionActions";
import { ProductDiscountSchema, CategoryDiscountSchema } from "../src/schemas/productDiscount";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    throw new Error(`Assert failed: ${message}`);
  }
  console.log(`   ✅ ${message}`);
}

async function runTests() {
  console.log("================================================================================");
  console.log("🧪 INICIANDO SUITE DE PRUEBAS RF-27: DESCUENTOS PROMOCIONALES Y SALVAGUARDA");
  console.log("================================================================================");

  // Asegurar entidades de prueba (Categoría, Disciplina, Marca)
  const category = await prisma.category.upsert({
    where: { slug: "test-promo-category" },
    update: {},
    create: {
      name: "Categoría Test Promociones",
      slug: "test-promo-category",
    },
  });

  const discipline = await prisma.discipline.upsert({
    where: { slug: "test-promo-discipline" },
    update: {},
    create: {
      name: "Disciplina Test Promociones",
      slug: "test-promo-discipline",
    },
  });

  const brand = await prisma.brand.upsert({
    where: { slug: "test-promo-brand" },
    update: {},
    create: {
      name: "Marca Test Promociones",
      slug: "test-promo-brand",
    },
  });

  // Limpiar productos de prueba previos si existen
  await prisma.product.deleteMany({
    where: {
      name: { startsWith: "TEST-PROMO-" },
    },
  });

  // 1. Validación de Esquema Zod (ProductDiscountSchema)
  console.log("\n[1/8] Probando esquemas Zod de validación...");
  const validZod = ProductDiscountSchema.safeParse({
    discountPercentage: 25.5,
    discountActive: true,
  });
  assert(validZod.success, "Esquema acepta porcentaje con decimales (25.5%)");

  const invalidZodMin = ProductDiscountSchema.safeParse({
    discountPercentage: 0,
  });
  assert(!invalidZodMin.success, "Esquema rechaza porcentaje menor a 1%");

  const invalidZodMax = ProductDiscountSchema.safeParse({
    discountPercentage: 95,
  });
  assert(!invalidZodMax.success, "Esquema rechaza porcentaje mayor a 90%");

  const invalidZodDates = ProductDiscountSchema.safeParse({
    discountPercentage: 20,
    discountStartDate: new Date("2026-12-01T10:00:00Z"),
    discountEndDate: new Date("2026-11-01T10:00:00Z"),
  });
  assert(!invalidZodDates.success, "Esquema rechaza fecha de inicio posterior a la fecha de fin");

  // 2. Creación de producto de prueba y asignación válida de descuento individual
  console.log("\n[2/8] Probando asignación individual de descuento con margen positivo...");
  const productA = await prisma.product.create({
    data: {
      name: "TEST-PROMO-Producto-A",
      modelCode: "PROMO-A01",
      price: new Prisma.Decimal(100000), // $100.000
      costPrice: new Prisma.Decimal(50000), // Costo $50.000
      categoryId: category.id,
      disciplineId: discipline.id,
      brandId: brand.id,
      active: true,
    },
  });

  const resPromoA = await setProductDiscount(productA.id, {
    discountPercentage: 20, // 20% OFF -> $80.000 (superior al costo de $50.000)
    discountActive: true,
  });

  assert(resPromoA.success, "setProductDiscount responde con éxito para 20% OFF");
  assert(resPromoA.data?.discountPrice === 80000, "discountPrice calculado exactamente en $ 80.000,00");
  assert(resPromoA.data?.isBelowCost === false, "isBelowCost es false (margen protegido)");

  const dbProductA = await prisma.product.findUnique({ where: { id: productA.id } });
  assert(Number(dbProductA?.discountPrice) === 80000, "Persistencia en Postgres confirmada ($ 80.000,00)");
  assert(dbProductA?.discountActive === true, "discountActive confirmado en true");

  // 3. Salvaguarda de Costo de Reposición (Rechazo estricto sin forzado)
  console.log("\n[3/8] Probando rechazo de oferta que quiebra el costo de reposición...");
  const resBelowCostBlocked = await setProductDiscount(productA.id, {
    discountPercentage: 60, // 60% OFF de $100.000 -> $40.000 (INFERIOR al costo de $50.000)
    discountActive: true,
    allowBelowCost: false,
  });

  assert(!resBelowCostBlocked.success, "setProductDiscount bloquea la operación si el precio < costPrice");
  assert(
    resBelowCostBlocked.code === "DISCOUNT_BELOW_COST",
    "Código de error específico DISCOUNT_BELOW_COST recibido"
  );

  // 4. Tolerancia para productos sin costo de reposición (costPrice: null)
  console.log("\n[4/8] Probando producto con costo no informado (costPrice = null)...");
  const productNoCost = await prisma.product.create({
    data: {
      name: "TEST-PROMO-Sin-Costo",
      modelCode: "PROMO-NC01",
      price: new Prisma.Decimal(40000),
      costPrice: null, // Costo nulo
      categoryId: category.id,
      disciplineId: discipline.id,
      brandId: brand.id,
      active: true,
    },
  });

  const resNoCost = await setProductDiscount(productNoCost.id, {
    discountPercentage: 30, // 30% OFF -> $28.000
    discountActive: true,
  });

  assert(resNoCost.success, "setProductDiscount acepta descuento sin error cuando costPrice es null");
  assert(resNoCost.data?.discountPrice === 28000, "discountPrice calculado en $ 28.000,00");

  // 5. Ventana de vigencia temporal (Programada a futuro vs Activa)
  console.log("\n[5/8] Probando programación temporal a futuro (status = PROGRAMADA)...");
  const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Dentro de 7 días
  const futureEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const resScheduled = await setProductDiscount(productA.id, {
    discountPercentage: 15,
    discountStartDate: futureStart,
    discountEndDate: futureEnd,
    discountActive: true,
  });

  assert(resScheduled.success, "setProductDiscount programa oferta futura exitosamente");

  const campaigns = await getPromoCampaigns("scheduled");
  const foundScheduled = campaigns.data?.find((c) => c.id === productA.id);
  assert(Boolean(foundScheduled), "getPromoCampaigns('scheduled') incluye la oferta programada");
  assert(foundScheduled?.status === "PROGRAMADA", "Estado reportado exactamente como 'PROGRAMADA'");

  // 6. Descuento masivo por Categoría con reporte discriminado (Estrategia 2B)
  console.log("\n[6/8] Probando descuento masivo por Categoría con reporte 2B...");
  // Crear producto que soportará el descuento
  const productBulkOk = await prisma.product.create({
    data: {
      name: "TEST-PROMO-Bulk-OK",
      modelCode: "PROMO-BOK",
      price: new Prisma.Decimal(200000), // $200.000
      costPrice: new Prisma.Decimal(100000), // Costo $100.000
      categoryId: category.id,
      disciplineId: discipline.id,
      brandId: brand.id,
      active: true,
    },
  });

  // Crear producto cuyo margen quebrará
  const productBulkFail = await prisma.product.create({
    data: {
      name: "TEST-PROMO-Bulk-Fail",
      modelCode: "PROMO-BFAIL",
      price: new Prisma.Decimal(100000), // $100.000
      costPrice: new Prisma.Decimal(80000), // Costo $80.000 (al 30% queda en $70.000 < $80.000)
      categoryId: category.id,
      disciplineId: discipline.id,
      brandId: brand.id,
      active: true,
    },
  });

  const resBulk = await applyCategoryDiscount({
    categoryId: category.id,
    discountPercentage: 30, // 30% OFF
    allowBelowCost: false,
  });

  assert(resBulk.success, "applyCategoryDiscount responde exitosamente");
  assert((resBulk.data?.appliedCount ?? 0) >= 1, "Aplica el descuento a los productos válidos");
  assert((resBulk.data?.skippedCount ?? 0) >= 1, "Reporta productos omitidos por resguardo de costo");

  const skipped = resBulk.data?.skippedProducts.find((p) => p.productId === productBulkFail.id);
  assert(Boolean(skipped), "El producto con margen quebrado aparece en la lista de omitidos");
  assert(
    skipped?.costPrice === 80000 && skipped?.attemptedDiscountPrice === 70000,
    "Reporte 2B detalla precio de costo y precio de oferta intentado"
  );

  // 7. Reversión masiva atómica
  console.log("\n[7/8] Probando reversión masiva de ofertas por categoría...");
  const resRevert = await removeCategoryDiscount({
    categoryId: category.id,
  });

  assert(resRevert.success, "removeCategoryDiscount ejecutado con éxito");
  assert((resRevert.count ?? 0) >= 1, "Registra la cantidad de productos restablecidos");

  const revertedProduct = await prisma.product.findUnique({ where: { id: productBulkOk.id } });
  assert(revertedProduct?.discountActive === false, "discountActive restablecido a false");
  assert(revertedProduct?.discountPercentage === null, "discountPercentage limpiado a null");
  assert(revertedProduct?.discountPrice === null, "discountPrice limpiado a null");

  // 8. Limpieza final de datos de prueba
  console.log("\n[8/8] Limpieza de entorno de pruebas...");
  await prisma.product.deleteMany({
    where: {
      name: { startsWith: "TEST-PROMO-" },
    },
  });
  console.log("   ✅ Productos de prueba eliminados correctamente.");

  console.log("\n================================================================================");
  console.log("🎉 TODAS LAS PRUEBAS DE LA SUITE RF-27 COMPLETADAS CON ÉXITO");
  console.log("================================================================================\n");
}

runTests()
  .catch((e) => {
    console.error("Error fatal en suite de pruebas RF-27:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
