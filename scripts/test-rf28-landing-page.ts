import bcrypt from "bcryptjs";
import { performance } from "perf_hooks";
import { prisma } from "../src/lib/prisma";
import {
  getLandingPageData,
  revalidateLandingPageData,
} from "../src/server/actions/ecommerce/landingActions";
import { fetchLandingPageDataUncached } from "../src/server/services/landingService";
import {
  createBannerService,
  deleteBannerService,
} from "../src/server/services/bannerService";
import {
  LANDING_CACHE_TAG,
  LANDING_CACHE_TTL_SECONDS,
  getLandingCacheGeneration,
  invalidateLandingCache,
} from "../src/lib/landingCache";
import { mapPublicProductToEcommerce } from "../src/lib/ecommerceProductMapper";

async function runRf28LandingPageTests() {
  console.log("=================================================================");
  console.log("🧪 SUITE DE PRUEBAS RF-28: LANDING PAGE DE ALTO RENDIMIENTO");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) {
        console.error(`   Detalle: ${detail}`);
      }
      failed++;
    }
  }

  const createdSaleIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdBannerIds: string[] = [];
  const createdTempUserIds: string[] = [];
  const tag = `RF28_${Date.now()}`;

  try {
    // 0. Preparar actor ADMIN temporal y taxonomía existente
    const passwordHash = await bcrypt.hash("AdminRf28Test!", 8);
    const tempAdmin = await prisma.user.create({
      data: {
        name: "Admin Test RF28",
        username: `admin_rf28_${Date.now()}`,
        email: `admin.rf28.${Date.now()}@matacos.local`,
        password: passwordHash,
        role: "ADMIN",
        active: true,
      },
    });
    createdTempUserIds.push(tempAdmin.id);

    const natacionDiscipline = await prisma.discipline.findFirst({
      where: { slug: "natacion" },
    });
    const anyCategory = await prisma.category.findFirst({
      where: { slug: "calzado" },
    }) || (await prisma.category.findFirst());
    const anyBrand = await prisma.brand.findFirst();

    if (!natacionDiscipline || !anyCategory || !anyBrand) {
      throw new Error(
        "Faltan datos maestros base (Discipline/Category/Brand). Ejecutá pnpm db:seed."
      );
    }

    // =========================================================================
    // 1. CONTRATO DE DATOS Y TIEMPO DE RESPUESTA < 150ms (Tareas 1, 2 y 3)
    // =========================================================================
    console.log("--- 1. Contrato LandingDataResponse, Concurrencia y SLA (< 150ms) ---");

    assert(
      LANDING_CACHE_TAG === "landing-data" && LANDING_CACHE_TTL_SECONDS === 300,
      "Configuración de caché exporta tag 'landing-data' y TTL de 300 segundos"
    );

    // Calentamiento inicial del pool concurrente de conexiones Prisma (simula servidor Next.js activo)
    await Promise.all(
      Array.from({ length: 5 }, () => prisma.$queryRaw`SELECT 1`)
    );
    invalidateLandingCache("manual");

    const coldStart = performance.now();
    const coldData = await fetchLandingPageDataUncached();
    const coldMs = performance.now() - coldStart;

    assert(
      Array.isArray(coldData.banners) &&
        Array.isArray(coldData.featuredDisciplines) &&
        Array.isArray(coldData.newArrivals) &&
        Array.isArray(coldData.bestSellers) &&
        Array.isArray(coldData.promoProducts),
      "LandingDataResponse contiene banners, featuredDisciplines, newArrivals, bestSellers y promoProducts"
    );

    assert(
      coldMs < 150,
      `Ejecución concurrente Promise.all (sin caché) cumple SLA < 150ms (${coldMs.toFixed(2)} ms)`,
      `Duración medida: ${coldMs.toFixed(2)} ms`
    );

    // Primera llamada a Server Action puebla caché; segunda llamada mide hit de caché
    await getLandingPageData();
    const warmStart = performance.now();
    const warmRes = await getLandingPageData();
    const warmMs = performance.now() - warmStart;

    assert(
      warmRes.success && Boolean(warmRes.data) && warmMs < 150,
      `getLandingPageData() desde caché responde en < 150ms (${warmMs.toFixed(2)} ms)`
    );

    // Verificar confidencialidad: ningún producto expone costPrice
    const allExposedProducts = [
      ...coldData.newArrivals,
      ...coldData.bestSellers,
      ...coldData.promoProducts,
    ];
    const leaksCostPrice = allExposedProducts.some(
      (item) => "costPrice" in (item as unknown as Record<string, unknown>)
    );
    assert(
      !leaksCostPrice,
      "Confidencialidad verificada: ningún producto en LandingDataResponse expone costPrice"
    );

    // =========================================================================
    // 2. DISCIPLINAS INSIGNIA CON CONTEO DE DISPONIBILIDAD (Tarea 2.2)
    // =========================================================================
    console.log("\n--- 2. Disciplinas Insignia (featuredDisciplines) ---");

    const expectedKeys = ["natacion", "voley", "crocs", "fitness", "calzado"];
    const returnedKeys = coldData.featuredDisciplines.map((d) => d.key);
    assert(
      expectedKeys.every((k, idx) => returnedKeys[idx] === k),
      "featuredDisciplines expone las 5 disciplinas insignia en orden canónico (Natación, Vóley, Crocs, Fitness, Calzado)"
    );

    const allDisciplinesValid = coldData.featuredDisciplines.every(
      (d) =>
        Boolean(d.imageUrl) &&
        Boolean(d.linkUrl) &&
        typeof d.availableProductsCount === "number" &&
        d.availableProductsCount >= 0
    );
    assert(
      allDisciplinesValid,
      "Cada disciplina insignia posee imagen representativa, enlace al catálogo y total de artículos disponibles"
    );

    const initialNatacionCount =
      coldData.featuredDisciplines.find((d) => d.key === "natacion")
        ?.availableProductsCount ?? 0;

    // =========================================================================
    // 3. NOVEDADES, STOCK NETO, MÁS VENDIDOS Y PROMOS (Tareas 2.3, 2.4 y 2.5)
    // =========================================================================
    console.log("\n--- 3. Novedades, Más Vendidos (SaleItem) y Descuentos Activos (RF-27) ---");

    // Crear Producto A: Activo, con stock neto disponible y descuento vigente del 25%
    const prodActivePromo = await prisma.product.create({
      data: {
        name: `${tag} Antiparras Pro Promo`,
        description: "Producto de prueba para RF-28",
        price: 80000,
        costPrice: 40000,
        active: true,
        discountActive: true,
        discountPercentage: 25,
        disciplineId: natacionDiscipline.id,
        categoryId: anyCategory.id,
        brandId: anyBrand.id,
        variants: {
          create: [
            {
              size: "Único",
              color: "Negro",
              sku: `SKU-${tag}-PROMO`,
              stockStore: 5,
              stockWarehouse: 5,
              stockReserved: 2, // Stock neto = 8 (> 0)
            },
          ],
        },
      },
      include: { variants: true },
    });
    createdProductIds.push(prodActivePromo.id);

    // Crear Producto B: Activo pero con 100% de su stock comprometido (stockReserved = stockStore + stockWarehouse) -> NO debe aparecer
    const prodZeroNetStock = await prisma.product.create({
      data: {
        name: `${tag} Producto Reservado Sin Stock Neto`,
        price: 50000,
        active: true,
        discountActive: true,
        discountPercentage: 30,
        disciplineId: natacionDiscipline.id,
        categoryId: anyCategory.id,
        brandId: anyBrand.id,
        variants: {
          create: [
            {
              size: "M",
              color: "Azul",
              sku: `SKU-${tag}-NOSTOCK`,
              stockStore: 2,
              stockWarehouse: 0,
              stockReserved: 2, // Stock neto = 0
            },
          ],
        },
      },
    });
    createdProductIds.push(prodZeroNetStock.id);

    // Crear Producto C: Descuento vencido ayer -> NO debe aparecer en promoProducts
    const prodExpiredPromo = await prisma.product.create({
      data: {
        name: `${tag} Producto Promo Expirada`,
        price: 60000,
        active: true,
        discountActive: true,
        discountPercentage: 20,
        discountEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        disciplineId: natacionDiscipline.id,
        categoryId: anyCategory.id,
        brandId: anyBrand.id,
        variants: {
          create: [
            {
              size: "L",
              color: "Rojo",
              sku: `SKU-${tag}-EXPIRED`,
              stockStore: 4,
              stockWarehouse: 0,
              stockReserved: 0,
            },
          ],
        },
      },
      include: { variants: true },
    });
    createdProductIds.push(prodExpiredPromo.id);

    // Registrar una venta COMPLETADA masiva (950 unidades) sobre Producto A para verificar ranking en bestSellers
    const promoVariantId = prodActivePromo.variants[0]!.id;
    const completedSale = await prisma.sale.create({
      data: {
        ticketCode: `TCK-${tag}-OK`,
        channel: "WEB",
        status: "COMPLETADA",
        subtotalGross: 76000000,
        total: 76000000,
        items: {
          create: [
            {
              variantId: promoVariantId,
              quantity: 950,
              originalPrice: 80000,
              unitPrice: 80000,
              price: 80000,
              subtotal: 76000000,
            },
          ],
        },
      },
    });
    createdSaleIds.push(completedSale.id);

    // Registrar una venta CANCELADA enorme (5000 unidades) sobre Producto C -> NO debe inflar bestSellers
    const expiredPromoVariantId = prodExpiredPromo.variants[0]!.id;
    const cancelledSale = await prisma.sale.create({
      data: {
        ticketCode: `TCK-${tag}-CANCEL`,
        channel: "WEB",
        status: "CANCELADA",
        subtotalGross: 300000000,
        total: 300000000,
        items: {
          create: [
            {
              variantId: expiredPromoVariantId,
              quantity: 5000,
              originalPrice: 60000,
              unitPrice: 60000,
              price: 60000,
              subtotal: 300000000,
            },
          ],
        },
      },
    });
    createdSaleIds.push(cancelledSale.id);

    // Invalidar caché por actualización de descuentos/productos (Tarea 4)
    const genBeforeDiscountInvalidate = getLandingCacheGeneration();
    const invRes = await revalidateLandingPageData("discount");
    const genAfterDiscountInvalidate = getLandingCacheGeneration();

    assert(
      invRes.success &&
        invRes.tag === "landing-data" &&
        genAfterDiscountInvalidate > genBeforeDiscountInvalidate,
      "revalidateLandingPageData('discount') invalida inmediatamente la caché 'landing-data'"
    );

    const refreshedRes = await getLandingPageData();
    const data = refreshedRes.data!;

    assert(
      data.newArrivals.length <= 8 &&
        data.bestSellers.length <= 8 &&
        data.promoProducts.length <= 8,
      "newArrivals, bestSellers y promoProducts respetan el tope máximo de 8 artículos cada uno"
    );

    const updatedNatacionCount =
      data.featuredDisciplines.find((d) => d.key === "natacion")
        ?.availableProductsCount ?? 0;
    assert(
      updatedNatacionCount === initialNatacionCount + 2,
      "Conteo de Natación suma exactamente los 2 productos nuevos con stock neto > 0 y excluye el reservado sin stock neto"
    );

    assert(
      !data.newArrivals.some((p) => p.id === prodZeroNetStock.id) &&
        !data.promoProducts.some((p) => p.id === prodZeroNetStock.id),
      "Producto con stock neto 0 (reservado en su totalidad) queda excluido de todas las vitrinas"
    );

    assert(
      data.newArrivals.some((p) => p.id === prodActivePromo.id),
      "Últimos productos ingresados (newArrivals) incluye los ingresos recientes activos con stock"
    );

    assert(
      data.bestSellers[0]?.id === prodActivePromo.id &&
        data.bestSellers[0]?.unitsSold === 950 &&
        !data.bestSellers.some(
          (p) => p.id === prodExpiredPromo.id && p.unitsSold >= 5000
        ),
      "bestSellers posiciona #1 al artículo con más unidades en SaleItem COMPLETADA e ignora ventas CANCELADA"
    );

    const foundPromo = data.promoProducts.find(
      (p) => p.id === prodActivePromo.id
    );
    const foundExpiredInPromo = data.promoProducts.some(
      (p) => p.id === prodExpiredPromo.id
    );

    assert(
      Boolean(foundPromo) &&
        foundPromo?.discountActive === true &&
        foundPromo?.price === 80000 &&
        foundPromo?.effectivePrice === 60000 &&
        !foundExpiredInPromo,
      "promoProducts incluye artículos con discountActive=true vigentes ($80.000 -> $60.000) y excluye promos vencidas"
    );

    if (foundPromo) {
      const uiMapped = mapPublicProductToEcommerce(foundPromo);
      assert(
        uiMapped.isOffer === true &&
          uiMapped.price === 60000 &&
          uiMapped.originalPrice === 80000 &&
          uiMapped.offerTag === "25% OFF",
        "mapPublicProductToEcommerce proyecta descuento RF-27/RF-28 a EcommerceProduct sin romper tarjetas UI existentes"
      );
    }

    // =========================================================================
    // 4. INVALIDACIÓN AUTOMÁTICA AL MODIFICAR BANNERS RF-26 (Tarea 4)
    // =========================================================================
    console.log("\n--- 4. Integración Automática con Banners (RF-26 -> Invalidación RF-28) ---");

    const genBeforeBanner = getLandingCacheGeneration();
    const bannerCreateRes = await createBannerService(tempAdmin.id, {
      title: `${tag} Banner Hero`,
      subtitle: "Descuentos exclusivos web",
      imageUrl: "https://cdn.matacos.com.ar/banners/rf28-test.webp",
      linkUrl: "/catalogo",
      order: 0,
      active: true,
    });
    if (bannerCreateRes.data) {
      createdBannerIds.push(bannerCreateRes.data.id);
    }
    const genAfterBannerCreate = getLandingCacheGeneration();

    assert(
      bannerCreateRes.success && genAfterBannerCreate > genBeforeBanner,
      "Crear un banner en RF-26 dispara automáticamente invalidateLandingCache('banner')"
    );

    const landingWithBanner = await getLandingPageData();
    assert(
      Boolean(
        landingWithBanner.data?.banners.some(
          (b) => b.id === bannerCreateRes.data?.id
        )
      ),
      "getLandingPageData() refleja inmediatamente el nuevo banner activo sin esperar expiración de TTL"
    );

    if (bannerCreateRes.data) {
      const genBeforeDelete = getLandingCacheGeneration();
      await deleteBannerService(tempAdmin.id, bannerCreateRes.data.id);
      const genAfterDelete = getLandingCacheGeneration();
      const landingAfterDelete = await getLandingPageData();

      assert(
        genAfterDelete > genBeforeDelete &&
          !landingAfterDelete.data?.banners.some(
            (b) => b.id === bannerCreateRes.data?.id
          ),
        "Eliminar un banner en RF-26 invalida automáticamente la caché y lo retira de getLandingPageData()"
      );
    }

    console.log("\n=================================================================");
    console.log(`📊 RESULTADOS RF-28: ${passed} aprobadas, ${failed} fallidas.`);
    console.log("=================================================================\n");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Error fatal ejecutando suite RF-28:", error);
    process.exitCode = 1;
  } finally {
    if (createdSaleIds.length > 0) {
      await prisma.sale.deleteMany({
        where: { id: { in: createdSaleIds } },
      });
    }
    if (createdProductIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      });
    }
    if (createdBannerIds.length > 0) {
      await prisma.banner.deleteMany({
        where: { id: { in: createdBannerIds } },
      });
    }
    if (createdTempUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdTempUserIds } },
      });
    }
    invalidateLandingCache("manual");
    await prisma.$disconnect();
  }
}

runRf28LandingPageTests();
