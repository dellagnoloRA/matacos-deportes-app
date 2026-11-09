/**
 * Suite de Pruebas Automatizadas: RF-27 Descuentos Promocionales y Salvaguarda de Costos
 * Ejecutable vía tsx: pnpm exec tsx scripts/test-rf27-promotional-discounts.ts
 */

import { prisma } from "../src/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  setProductDiscount,
  applyCategoryDiscount,
  previewCategoryDiscount,
  removeCategoryDiscount,
  getPromoCampaigns,
} from "../src/server/actions/ecommerce/promotionActions";
import { ProductDiscountSchema, CategoryDiscountSchema } from "../src/schemas/productDiscount";
import { getPublicCatalog } from "../src/server/actions/ecommerce/catalogActions";
import { getProductDetail } from "../src/server/actions/ecommerce/productDetailActions";
import { createGuestOrder } from "../src/server/actions/ecommerce/checkoutActions";
import { searchPosProducts, createPendingSale } from "../src/server/actions/posSaleActions";

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

  // Limpiar productos y ventas de prueba previos si existen
  const existingTestProducts = await prisma.product.findMany({
    where: { name: { startsWith: "TEST-PROMO-" } },
    select: { id: true, variants: { select: { id: true } } },
  });
  const existingTestVariantIds = existingTestProducts.flatMap((p) => p.variants.map((v) => v.id));
  if (existingTestVariantIds.length > 0) {
    const saleItems = await prisma.saleItem.findMany({
      where: { variantId: { in: existingTestVariantIds } },
      select: { saleId: true },
    });
    const saleIds = Array.from(new Set(saleItems.map((si) => si.saleId)));
    await prisma.saleItem.deleteMany({ where: { variantId: { in: existingTestVariantIds } } });
    if (saleIds.length > 0) {
      await prisma.sale.deleteMany({ where: { id: { in: saleIds } } });
    }
    await prisma.productVariant.deleteMany({ where: { id: { in: existingTestVariantIds } } });
  }
  await prisma.product.deleteMany({
    where: { name: { startsWith: "TEST-PROMO-" } },
  });

  // 1. Validación de Esquema Zod (ProductDiscountSchema)
  console.log("\n[1/10] Probando esquemas Zod de validación...");
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
  console.log("\n[2/10] Probando asignación individual de descuento con margen positivo...");
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
  console.log("\n[3/10] Probando rechazo de oferta que quiebra el costo de reposición...");
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
  console.log("\n[4/10] Probando producto con costo no informado (costPrice = null)...");
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
  console.log("\n[5/10] Probando programación temporal a futuro (status = PROGRAMADA)...");
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

  // 6. Previsualización de descuento masivo (previewCategoryDiscount)
  console.log("\n[6/10] Probando previsualización de descuento masivo (previewCategoryDiscount)...");
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

  const previewRes = await previewCategoryDiscount({
    categoryId: category.id,
    discountPercentage: 30,
    allowBelowCost: false,
  });

  assert(previewRes.success, "previewCategoryDiscount responde con éxito");
  assert((previewRes.data?.willApplyCount ?? 0) >= 1, "Previsualiza productos que se aplicarán");
  assert((previewRes.data?.willSkipCount ?? 0) >= 1, "Previsualiza productos que se omitirán por costo");
  assert(
    previewRes.data?.skippedProducts.some((p) => p.productId === productBulkFail.id) === true,
    "El producto quebrado aparece en la lista previa de omitidos"
  );

  // 7. Aplicación de descuento masivo por Categoría con reporte discriminado 2B
  console.log("\n[7/10] Probando aplicación de descuento masivo por Categoría (Reporte 2B)...");
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

  // 8. Descuento masivo por Disciplina deportiva
  console.log("\n[8/10] Probando descuento masivo filtrado por Disciplina...");
  const resBulkDiscipline = await applyCategoryDiscount({
    disciplineId: discipline.id,
    discountPercentage: 25,
    allowBelowCost: false,
  });
  assert(resBulkDiscipline.success, "applyCategoryDiscount opera por disciplineId correctamente");

  // 9. Reversión masiva atómica por Rubro
  console.log("\n[9/10] Probando reversión masiva de ofertas (removeCategoryDiscount)...");
  const resRevert = await removeCategoryDiscount({
    categoryId: category.id,
  });

  assert(resRevert.success, "removeCategoryDiscount ejecutado con éxito");
  assert((resRevert.count ?? 0) >= 1, "Registra la cantidad de productos restablecidos");

  const revertedProduct = await prisma.product.findUnique({ where: { id: productBulkOk.id } });
  assert(revertedProduct?.discountActive === false, "discountActive restablecido a false");
  assert(revertedProduct?.discountPercentage === null, "discountPercentage limpiado a null");
  assert(revertedProduct?.discountPrice === null, "discountPrice limpiado a null");

  // 10. Consumo en Catálogo Público y Ficha PDP (Precio tachado y cálculo en vivo)
  console.log("\n[10/13] Probando consumo en Catálogo Web y PDP con precio tachado...");

  // Crear variante con stock para productA
  const variantA = await prisma.productVariant.create({
    data: {
      productId: productA.id,
      size: "M",
      color: "Azul",
      sku: "TEST-PROMO-A-M",
      barcode: "779999900001",
      stockStore: 10,
      stockWarehouse: 5,
    },
  });
  
  // Asignar 20% OFF a productA ($100.000 -> $80.000)
  await setProductDiscount(productA.id, {
    discountPercentage: 20,
    discountActive: true,
  });

  const catalogRes = await getPublicCatalog({
    categorySlug: category.slug,
    limit: 10,
  });
  assert(catalogRes.success, "getPublicCatalog responde exitosamente");
  const foundInCatalog = catalogRes.data?.products.find((p) => p.id === productA.id);
  assert(Boolean(foundInCatalog), "Producto con oferta aparece en el catálogo");
  assert(foundInCatalog?.price === 80000, "Catálogo expone precio de oferta ($ 80.000,00)");
  assert(foundInCatalog?.originalPrice === 100000, "Catálogo expone precio regular tachado ($ 100.000,00)");
  assert(foundInCatalog?.discountActive === true, "Catálogo expone discountActive = true");
  assert(foundInCatalog?.discountPercentage === 20, "Catálogo expone discountPercentage = 20");

  const pdpRes = await getProductDetail(productA.id);
  assert(pdpRes.success, "getProductDetail responde exitosamente");
  assert(pdpRes.data?.price === 80000, "PDP expone precio de oferta ($ 80.000,00)");
  assert(pdpRes.data?.originalPrice === 100000, "PDP expone originalPrice para tachar");
  assert(pdpRes.data?.discountActive === true, "PDP expone bandera promocional activa");

  // 11. Checkout Web: Inmutabilidad en Reserva Web (15 min) e imputación contable en SaleItem
  console.log("\n[11/13] Probando creación de orden web con congelamiento de oferta y SaleItem...");
  
// Variante ya creada arriba

  const webOrderRes = await createGuestOrder({
    customerName: "Cliente Test Descuentos",
    customerDni: "35123456",
    customerEmail: "testpromo@matacos.com",
    customerPhone: "3704123456",
    shippingMethod: "RETIRO_LOCAL",
    items: [
      {
        variantId: variantA.id,
        quantity: 1,
      },
    ],
  });

  assert(webOrderRes.success, "createGuestOrder crea la orden exitosamente");
  const orderId = webOrderRes.data?.saleId;
  assert(Boolean(orderId), "Se genera el saleId correspondiente");

  const createdSale = await prisma.sale.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });

  assert(Number(createdSale.subtotalGross) === 100000, "Subtotal bruto congelado en $ 100.000,00");
  assert(Number(createdSale.discount) === 20000, "Descuento total congelado en $ 20.000,00");
  assert(Number(createdSale.total) === 80000, "Total neto a pagar congelado en $ 80.000,00");
  assert(Boolean(createdSale.reservedUntil), "La orden cuenta con reservedUntil para 15 min TTL");

  const saleItem = createdSale.items[0];
  assert(Boolean(saleItem), "La orden contiene el ítem de venta");
  assert(Number(saleItem.originalPrice) === 100000, "SaleItem.originalPrice almacena $ 100.000,00");
  assert(Number(saleItem.discount) === 20000, "SaleItem.discount almacena $ 20.000,00");
  assert(Number(saleItem.unitPrice) === 80000, "SaleItem.unitPrice almacena $ 80.000,00");

  // Desactivar oferta del producto en DB para verificar inmutabilidad de la orden reservada
  await prisma.product.update({
    where: { id: productA.id },
    data: { discountActive: false },
  });

  const saleAfterExpiry = await prisma.sale.findUniqueOrThrow({
    where: { id: orderId },
  });
  assert(
    Number(saleAfterExpiry.total) === 80000,
    "La orden preliminar preserva inmutablemente su precio de $ 80.000,00 aunque la oferta haya terminado"
  );

  // 12. Mostrador Saavedra 241: Escaneo con precio promocional y descuentos en cascada (RF-27 + RF-08)
  console.log("\n[12/13] Probando liquidación sucesiva en Mostrador (RF-27 + RF-08)...");

  // Reactivar oferta al 20%
  await setProductDiscount(productA.id, {
    discountPercentage: 20,
    discountActive: true,
  });

  const posSearchRes = await searchPosProducts(variantA.barcode || "TEST-PROMO-Producto-A");
  assert(posSearchRes.success, "searchPosProducts responde con éxito");
  const posItem = posSearchRes.items?.find((it) => it.productId === productA.id);
  assert(Boolean(posItem), "searchPosProducts encuentra el producto");
  assert(posItem?.price === 80000, "Mostrador toma el precio promocional $ 80.000,00 como precio base");
  assert(posItem?.originalPrice === 100000, "Mostrador preserva originalPrice $ 100.000,00 para referencia");

  // Crear Preventa con 10% adicional por pago en efectivo en mostrador (cascada)
  const pendingSaleRes = await createPendingSale({
    customerName: "Cliente Mostrador Cascada",
    items: [
      {
        variantId: variantA.id,
        quantity: 1,
        originalPrice: posItem!.price, // $80.000 precio promocional base
        discountType: "PERCENTAGE",
        discountValue: 10, // 10% OFF manual en mostrador
        unitPrice: 72000,
      },
    ],
  });

  assert(pendingSaleRes.success, "createPendingSale crea la preventa en cascada con éxito");
  const posSaleId = pendingSaleRes.data?.saleId;
  const posSaleRecord = await prisma.sale.findUniqueOrThrow({
    where: { id: posSaleId },
    include: { items: true },
  });

  assert(Number(posSaleRecord.subtotalGross) === 80000, "Subtotal mostrador base $ 80.000,00");
  assert(Number(posSaleRecord.discount) === 8000, "Descuento manual 10% = $ 8.000,00");
  assert(Number(posSaleRecord.total) === 72000, "Total neto en mostrador $ 72.000,00 (cascada RF-27 + RF-08)");

  const posSaleItem = posSaleRecord.items[0];
  assert(Number(posSaleItem.originalPrice) === 80000, "SaleItem mostrador originalPrice = $ 80.000,00");
  assert(Number(posSaleItem.discount) === 8000, "SaleItem mostrador discount = $ 8.000,00");
  assert(Number(posSaleItem.unitPrice) === 72000, "SaleItem mostrador unitPrice = $ 72.000,00");

  // 13. Limpieza final de datos de prueba
  console.log("\n[13/13] Limpieza de entorno de pruebas...");
  // Eliminar ventas y reservas de prueba
  if (orderId) {
    await prisma.saleItem.deleteMany({ where: { saleId: orderId } });
    await prisma.sale.delete({ where: { id: orderId } });
  }
  if (posSaleId) {
    await prisma.saleItem.deleteMany({ where: { saleId: posSaleId } });
    await prisma.sale.delete({ where: { id: posSaleId } });
  }
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
