import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { listActiveBannersService } from "@/server/services/bannerService";
import type {
  FeaturedDisciplineItem,
  FlagshipDisciplineKey,
  LandingDataResponse,
  LandingProductItem,
  PublicVariantItem,
} from "@/types/ecommerce";

const LANDING_SECTION_LIMIT = 8;

interface FlagshipSummarySqlRow {
  key: FlagshipDisciplineKey;
  entityId: string | null;
  entityImageUrl: string | null;
  count: number;
  sampleProductImageUrl: string | null;
}

interface OrderedProductIdRow {
  productId: string;
}

interface BestSellerProductIdRow {
  productId: string;
  unitsSold: number;
}

interface FlagshipDisciplineSpec {
  key: FlagshipDisciplineKey;
  displayName: string;
  canonicalSlug: string;
  subtitle: string;
  filterType: "discipline" | "category";
  linkUrl: string;
  fallbackImageUrl: string;
}

const FLAGSHIP_DISCIPLINES: readonly FlagshipDisciplineSpec[] = [
  {
    key: "natacion",
    displayName: "Natación",
    canonicalSlug: "natacion",
    subtitle: "Antiparras, mallas de competición y accesorios acuáticos",
    filterType: "discipline",
    linkUrl: "/catalogo?disciplineSlug=natacion",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "voley",
    displayName: "Vóley",
    canonicalSlug: "voley",
    subtitle: "Pelotas oficiales FIVB, rodilleras e indumentaria",
    filterType: "discipline",
    linkUrl: "/catalogo?disciplineSlug=voley",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "crocs",
    displayName: "Crocs / Urbano",
    canonicalSlug: "crocs",
    subtitle: "Línea oficial Crocs y confort urbano diario",
    filterType: "discipline",
    linkUrl: "/catalogo?disciplineSlug=crocs",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "fitness",
    displayName: "Gimnasio / Fitness",
    canonicalSlug: "fitness",
    subtitle: "Entrenamiento funcional, musculación y accesorios",
    filterType: "discipline",
    linkUrl: "/catalogo?disciplineSlug=fitness",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
  },
  {
    key: "calzado",
    displayName: "Calzado",
    canonicalSlug: "calzado",
    subtitle: "Zapatillas técnicas, running, cancha y tiempo libre",
    filterType: "category",
    linkUrl: "/catalogo?categorySlug=calzado",
    fallbackImageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
  },
];

const PUBLIC_LANDING_PRODUCT_SELECT =
  Prisma.validator<Prisma.ProductSelect>()({
    id: true,
    name: true,
    description: true,
    imageUrl: true,
    modelCode: true,
    price: true,
    gender: true,
    discountActive: true,
    discountPercentage: true,
    discountPrice: true,
    discountStartDate: true,
    discountEndDate: true,
    createdAt: true,
    category: {
      select: { id: true, name: true, slug: true },
    },
    brand: {
      select: { id: true, name: true, slug: true },
    },
    discipline: {
      select: { id: true, name: true, slug: true },
    },
    images: {
      orderBy: { order: "asc" },
      select: {
        id: true,
        url: true,
        color: true,
        isPrimary: true,
        order: true,
      },
    },
    variants: {
      orderBy: [{ size: "asc" }, { color: "asc" }],
      select: {
        id: true,
        size: true,
        color: true,
        sku: true,
        barcode: true,
        price: true,
        stockStore: true,
        stockWarehouse: true,
        stockReserved: true,
      },
    },
  });

type RawLandingProduct = Awaited<
  ReturnType<typeof queryRawLandingProductsByIds>
>[number];

async function queryRawLandingProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.product.findMany({
    where: {
      id: { in: ids },
      active: true,
    },
    select: PUBLIC_LANDING_PRODUCT_SELECT,
  });
}

function isUsableImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes("placeholder")) return false;
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  );
}

/**
 * Calcula si el descuento promocional de un producto está efectivamente vigente en `now`
 * y resuelve el precio promocional resultante y porcentaje equivalente.
 */
export function resolveEffectiveProductPromo(
  product: {
    price: unknown;
    discountActive: boolean;
    discountPercentage: unknown;
    discountPrice: unknown;
    discountStartDate: Date | null;
    discountEndDate: Date | null;
  },
  now: Date
): {
  isPromoActive: boolean;
  basePrice: number;
  effectivePrice: number;
  discountPercentage: number | null;
  discountPrice: number | null;
} {
  const basePrice = Number(product.price);
  const rawPct =
    product.discountPercentage !== null &&
    product.discountPercentage !== undefined
      ? Number(product.discountPercentage)
      : null;
  const rawDiscountPrice =
    product.discountPrice !== null && product.discountPrice !== undefined
      ? Number(product.discountPrice)
      : null;

  if (!product.discountActive) {
    return {
      isPromoActive: false,
      basePrice,
      effectivePrice: basePrice,
      discountPercentage: null,
      discountPrice: null,
    };
  }

  const nowMs = now.getTime();
  if (
    product.discountStartDate &&
    product.discountStartDate.getTime() > nowMs
  ) {
    return {
      isPromoActive: false,
      basePrice,
      effectivePrice: basePrice,
      discountPercentage: null,
      discountPrice: null,
    };
  }

  if (product.discountEndDate && product.discountEndDate.getTime() < nowMs) {
    return {
      isPromoActive: false,
      basePrice,
      effectivePrice: basePrice,
      discountPercentage: null,
      discountPrice: null,
    };
  }

  // Caso 1: Tiene precio promocional fijo explícito menor al precio base
  if (
    rawDiscountPrice !== null &&
    rawDiscountPrice > 0 &&
    rawDiscountPrice < basePrice
  ) {
    const computedPct =
      rawPct !== null && rawPct > 0
        ? rawPct
        : Math.round(((basePrice - rawDiscountPrice) / basePrice) * 10000) /
          100;

    return {
      isPromoActive: true,
      basePrice,
      effectivePrice: Math.round(rawDiscountPrice * 100) / 100,
      discountPercentage: computedPct,
      discountPrice: Math.round(rawDiscountPrice * 100) / 100,
    };
  }

  // Caso 2: Tiene porcentaje de descuento válido (0 < pct < 100)
  if (rawPct !== null && rawPct > 0 && rawPct < 100) {
    const computedPrice =
      Math.round(basePrice * (1 - rawPct / 100) * 100) / 100;
    return {
      isPromoActive: true,
      basePrice,
      effectivePrice: computedPrice,
      discountPercentage: rawPct,
      discountPrice: computedPrice,
    };
  }

  // Caso 3: `discountActive: true` activado como destacado promocional sin rebaja explícita aún
  return {
    isPromoActive: true,
    basePrice,
    effectivePrice: basePrice,
    discountPercentage: rawPct,
    discountPrice: rawDiscountPrice,
  };
}

function mapRawToLandingProductItem(
  p: RawLandingProduct,
  now: Date,
  unitsSold: number = 0
): LandingProductItem {
  const promo = resolveEffectiveProductPromo(p, now);
  const basePrice = promo.basePrice;

  let minVariantPrice = promo.effectivePrice;
  let maxVariantPrice = basePrice;
  let totalStock = 0;

  const variantsDto: PublicVariantItem[] = p.variants.map((v) => {
    const netStock = Math.max(
      0,
      v.stockStore + v.stockWarehouse - v.stockReserved
    );
    totalStock += netStock;

    const rawVarPrice = v.price !== null ? Number(v.price) : null;
    const compareVarPrice = rawVarPrice !== null ? rawVarPrice : basePrice;
    if (compareVarPrice < minVariantPrice) minVariantPrice = compareVarPrice;
    if (compareVarPrice > maxVariantPrice) maxVariantPrice = compareVarPrice;

    return {
      id: v.id,
      size: v.size,
      color: v.color,
      sku: v.sku,
      barcode: v.barcode,
      price: rawVarPrice,
      availableStock: netStock,
      inStock: netStock > 0,
    };
  });

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    modelCode: p.modelCode,
    price: basePrice,
    gender: p.gender,
    category: p.category,
    brand: p.brand,
    discipline: p.discipline,
    images: p.images,
    variants: variantsDto,
    totalAvailableStock: totalStock,
    hasStock: totalStock > 0,
    minPrice: minVariantPrice,
    maxPrice: maxVariantPrice,
    createdAt: p.createdAt.toISOString(),
    discountActive: promo.isPromoActive,
    discountPercentage: promo.discountPercentage,
    discountPrice: promo.discountPrice,
    discountStartDate: p.discountStartDate
      ? p.discountStartDate.toISOString()
      : null,
    discountEndDate: p.discountEndDate ? p.discountEndDate.toISOString() : null,
    effectivePrice: promo.effectivePrice,
    formattedPrice: formatCurrency(basePrice),
    formattedEffectivePrice: formatCurrency(promo.effectivePrice),
    unitsSold,
  };
}

/**
 * 2.2: Obtiene las 5 disciplinas insignia de Matacos Deportes en una única consulta CTE SQL
 * con conteo exacto de artículos activos con stock neto disponible e imagen representativa.
 */
async function fetchFeaturedDisciplinesSection(): Promise<
  FeaturedDisciplineItem[]
> {
  const summaryRows = await prisma.$queryRaw<FlagshipSummarySqlRow[]>`
    WITH active_products AS (
      SELECT
        p.id,
        p."imageUrl" AS "productImageUrl",
        d.slug AS "disciplineSlug",
        c.slug AS "categorySlug",
        b.slug AS "brandSlug",
        (
          SELECT pi.url
          FROM "ProductImage" pi
          WHERE pi."productId" = p.id
          ORDER BY pi."isPrimary" DESC, pi."order" ASC
          LIMIT 1
        ) AS "primaryImageUrl"
      FROM "Product" p
      INNER JOIN "Discipline" d ON d.id = p."disciplineId"
      INNER JOIN "Category" c ON c.id = p."categoryId"
      INNER JOIN "Brand" b ON b.id = p."brandId"
      WHERE p.active = true
        AND EXISTS (
          SELECT 1
          FROM "ProductVariant" pv
          WHERE pv."productId" = p.id
            AND (pv."stockStore" + pv."stockWarehouse" - pv."stockReserved") > 0
        )
    )
    SELECT
      'natacion'::text AS "key",
      (SELECT id FROM "Discipline" WHERE slug = 'natacion' LIMIT 1) AS "entityId",
      (SELECT "imageUrl" FROM "Discipline" WHERE slug = 'natacion' LIMIT 1) AS "entityImageUrl",
      COUNT(*)::int AS "count",
      MAX(COALESCE("primaryImageUrl", "productImageUrl")) AS "sampleProductImageUrl"
    FROM active_products
    WHERE "disciplineSlug" = 'natacion'
    UNION ALL
    SELECT
      'voley'::text AS "key",
      (SELECT id FROM "Discipline" WHERE slug = 'voley' LIMIT 1) AS "entityId",
      (SELECT "imageUrl" FROM "Discipline" WHERE slug = 'voley' LIMIT 1) AS "entityImageUrl",
      COUNT(*)::int AS "count",
      MAX(COALESCE("primaryImageUrl", "productImageUrl")) AS "sampleProductImageUrl"
    FROM active_products
    WHERE "disciplineSlug" = 'voley'
    UNION ALL
    SELECT
      'crocs'::text AS "key",
      (SELECT id FROM "Discipline" WHERE slug = 'crocs' LIMIT 1) AS "entityId",
      (SELECT "imageUrl" FROM "Discipline" WHERE slug = 'crocs' LIMIT 1) AS "entityImageUrl",
      COUNT(*)::int AS "count",
      MAX(COALESCE("primaryImageUrl", "productImageUrl")) AS "sampleProductImageUrl"
    FROM active_products
    WHERE "disciplineSlug" IN ('crocs', 'running-urbano') OR "brandSlug" = 'crocs'
    UNION ALL
    SELECT
      'fitness'::text AS "key",
      (SELECT id FROM "Discipline" WHERE slug = 'fitness' LIMIT 1) AS "entityId",
      (SELECT "imageUrl" FROM "Discipline" WHERE slug = 'fitness' LIMIT 1) AS "entityImageUrl",
      COUNT(*)::int AS "count",
      MAX(COALESCE("primaryImageUrl", "productImageUrl")) AS "sampleProductImageUrl"
    FROM active_products
    WHERE "disciplineSlug" IN ('fitness', 'gimnasio')
    UNION ALL
    SELECT
      'calzado'::text AS "key",
      COALESCE(
        (SELECT id FROM "Discipline" WHERE slug = 'calzado' LIMIT 1),
        (SELECT id FROM "Category" WHERE slug = 'calzado' LIMIT 1)
      ) AS "entityId",
      (SELECT "imageUrl" FROM "Discipline" WHERE slug = 'calzado' LIMIT 1) AS "entityImageUrl",
      COUNT(*)::int AS "count",
      MAX(COALESCE("primaryImageUrl", "productImageUrl")) AS "sampleProductImageUrl"
    FROM active_products
    WHERE "disciplineSlug" = 'calzado' OR "categorySlug" IN ('calzado', 'calzado-deportivo-pro', 'botines')
  `;

  const byKey = new Map(summaryRows.map((r) => [r.key, r]));

  return FLAGSHIP_DISCIPLINES.map((spec) => {
    const row = byKey.get(spec.key);
    const resolvedId = row?.entityId || `flagship-${spec.key}`;

    let resolvedImage = spec.fallbackImageUrl;
    if (isUsableImageUrl(row?.entityImageUrl)) {
      resolvedImage = row.entityImageUrl;
    } else if (isUsableImageUrl(row?.sampleProductImageUrl)) {
      resolvedImage = row.sampleProductImageUrl;
    }

    return {
      id: resolvedId,
      key: spec.key,
      name: spec.displayName,
      slug: spec.canonicalSlug,
      subtitle: spec.subtitle,
      imageUrl: resolvedImage,
      linkUrl: spec.linkUrl,
      filterType: spec.filterType,
      availableProductsCount: Number(row?.count) || 0,
    };
  });
}

/**
 * 2.3: IDs de los últimos 8 productos ingresados (`createdAt desc`, activos y con stock neto disponible > 0).
 */
async function fetchNewArrivalIds(): Promise<string[]> {
  const rows = await prisma.$queryRaw<OrderedProductIdRow[]>`
    SELECT p.id AS "productId"
    FROM "Product" p
    WHERE p.active = true
      AND EXISTS (
        SELECT 1
        FROM "ProductVariant" pv
        WHERE pv."productId" = p.id
          AND (pv."stockStore" + pv."stockWarehouse" - pv."stockReserved") > 0
      )
    ORDER BY p."createdAt" DESC, p.id ASC
    LIMIT ${LANDING_SECTION_LIMIT}
  `;

  return rows.map((r) => r.productId);
}

/**
 * 2.4: IDs y unidades vendidas de los 8 artículos más vendidos basados en `SaleItem` (`COMPLETADA`).
 */
async function fetchBestSellerIds(): Promise<{
  orderedIds: string[];
  unitsMap: Map<string, number>;
}> {
  const rows = await prisma.$queryRaw<BestSellerProductIdRow[]>`
    SELECT
      p.id AS "productId",
      COALESCE(sales_agg."unitsSold", 0)::int AS "unitsSold"
    FROM "Product" p
    LEFT JOIN (
      SELECT
        pv."productId",
        SUM(si.quantity)::int AS "unitsSold",
        COUNT(DISTINCT si."saleId")::int AS "ordersCount"
      FROM "SaleItem" si
      INNER JOIN "Sale" s ON s.id = si."saleId" AND s.status = 'COMPLETADA'
      INNER JOIN "ProductVariant" pv ON pv.id = si."variantId"
      GROUP BY pv."productId"
    ) sales_agg ON sales_agg."productId" = p.id
    WHERE p.active = true
      AND EXISTS (
        SELECT 1
        FROM "ProductVariant" pv2
        WHERE pv2."productId" = p.id
          AND (pv2."stockStore" + pv2."stockWarehouse" - pv2."stockReserved") > 0
      )
    ORDER BY
      COALESCE(sales_agg."unitsSold", 0) DESC,
      COALESCE(sales_agg."ordersCount", 0) DESC,
      p."createdAt" DESC
    LIMIT ${LANDING_SECTION_LIMIT}
  `;

  const unitsMap = new Map<string, number>(
    rows.map((r) => [r.productId, Number(r.unitsSold) || 0])
  );

  return {
    orderedIds: rows.map((r) => r.productId),
    unitsMap,
  };
}

/**
 * 2.5: IDs de los 8 artículos con descuento promocional activo (`discountActive: true` y vigencia válida).
 */
async function fetchPromoProductIds(now: Date): Promise<string[]> {
  const rows = await prisma.$queryRaw<OrderedProductIdRow[]>`
    SELECT p.id AS "productId"
    FROM "Product" p
    WHERE p.active = true
      AND p."discountActive" = true
      AND (p."discountStartDate" IS NULL OR p."discountStartDate" <= ${now})
      AND (p."discountEndDate" IS NULL OR p."discountEndDate" >= ${now})
      AND EXISTS (
        SELECT 1
        FROM "ProductVariant" pv
        WHERE pv."productId" = p.id
          AND (pv."stockStore" + pv."stockWarehouse" - pv."stockReserved") > 0
      )
    ORDER BY
      p."discountPercentage" DESC NULLS LAST,
      p."updatedAt" DESC,
      p."createdAt" DESC
    LIMIT ${LANDING_SECTION_LIMIT}
  `;

  return rows.map((r) => r.productId);
}

/**
 * Tarea 2 (RF-28): Ejecuta en paralelo mediante `Promise.all` las 5 consultas troncales
 * de la Landing Page de Matacos Deportes e hidrata los productos en un único batch SQL.
 */
export async function fetchLandingPageDataUncached(
  referenceDate: Date = new Date()
): Promise<LandingDataResponse> {
  const [
    bannersResult,
    featuredDisciplines,
    newArrivalIds,
    bestSellerResult,
    promoProductIds,
  ] = await Promise.all([
    listActiveBannersService(referenceDate),
    fetchFeaturedDisciplinesSection(),
    fetchNewArrivalIds(),
    fetchBestSellerIds(),
    fetchPromoProductIds(referenceDate),
  ]);

  const uniqueProductIds = Array.from(
    new Set([
      ...newArrivalIds,
      ...bestSellerResult.orderedIds,
      ...promoProductIds,
    ])
  );

  const rawProducts = await queryRawLandingProductsByIds(uniqueProductIds);
  const rawProductMap = new Map<string, RawLandingProduct>(
    rawProducts.map((p) => [p.id, p])
  );

  const buildOrderedList = (
    ids: string[],
    unitsMap?: ReadonlyMap<string, number>
  ): LandingProductItem[] => {
    const items: LandingProductItem[] = [];
    for (const id of ids) {
      const raw = rawProductMap.get(id);
      if (!raw) continue;
      const mapped = mapRawToLandingProductItem(
        raw,
        referenceDate,
        unitsMap?.get(id) ?? bestSellerResult.unitsMap.get(id) ?? 0
      );
      if (mapped.hasStock) {
        items.push(mapped);
      }
    }
    return items;
  };

  return {
    banners:
      bannersResult.success && bannersResult.data ? bannersResult.data : [],
    featuredDisciplines,
    newArrivals: buildOrderedList(newArrivalIds),
    bestSellers: buildOrderedList(
      bestSellerResult.orderedIds,
      bestSellerResult.unitsMap
    ),
    promoProducts: buildOrderedList(promoProductIds),
    generatedAt: referenceDate.toISOString(),
  };
}
