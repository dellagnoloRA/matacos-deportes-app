"use server";

import { prisma } from "@/lib/prisma";
import {
  CatalogFilterSchema,
  CatalogFilterInput,
  PredictiveSearchSchema,
} from "@/schemas/ecommerce";
import type {
  PublicProductItem,
  PublicVariantItem,
  PublicCatalogResponse,
  PredictiveSearchItem,
  CatalogFacetsResponse,
  CatalogFacetOption,
} from "@/types/ecommerce";
import { Prisma, Gender } from "@prisma/client";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { invalidateLandingCache } from "@/lib/landingCache";
import { resolveEffectiveProductPromo } from "@/server/services/landingService";
import { formatCurrency } from "@/lib/utils";

/**
 * Serializador seguro para Client Components (convierte Decimals de Prisma a numbers nativos)
 */
function serialize<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "object" && value !== null && typeof value.toNumber === "function") {
        return value.toNumber();
      }
      if (typeof value === "object" && value !== null && "d" in value && "e" in value && "s" in value) {
        return Number(value);
      }
      return value;
    })
  );
}

/**
 * Consulta de Catálogo Público con Paginación, Filtros y Ordenamiento (RF-13)
 * Filtra estrictamente artículos activos con existencia física disponible.
 * Protege información confidencial (costPrice no se incluye en la consulta).
 */
async function fetchPublicCatalogRaw(
  rawFilters: CatalogFilterInput
): Promise<{ success: boolean; data?: PublicCatalogResponse; error?: string }> {
  try {
    const validated = CatalogFilterSchema.parse(rawFilters);
    const {
      disciplineSlug,
      categorySlug,
      brandSlug,
      gender,
      size,
      color,
      ofertas,
      minPrice,
      maxPrice,
      search,
      sort,
      page,
      limit,
    } = validated;

    // 1. Construcción dinámica de la cláusula where
    const andFilters: Prisma.ProductWhereInput[] = [];

    if (disciplineSlug) {
      andFilters.push({
        OR: [
          { discipline: { slug: { equals: disciplineSlug, mode: "insensitive" } } },
          { discipline: { name: { equals: disciplineSlug, mode: "insensitive" } } },
          { disciplineId: disciplineSlug },
        ],
      });
    }

    if (categorySlug) {
      andFilters.push({
        OR: [
          { category: { slug: { equals: categorySlug, mode: "insensitive" } } },
          { category: { name: { equals: categorySlug, mode: "insensitive" } } },
          { categoryId: categorySlug },
          { discipline: { slug: { equals: categorySlug, mode: "insensitive" } } },
          { discipline: { name: { equals: categorySlug, mode: "insensitive" } } },
          { disciplineId: categorySlug },
        ],
      });
    }

    if (brandSlug) {
      andFilters.push({
        OR: [
          { brand: { slug: { equals: brandSlug, mode: "insensitive" } } },
          { brand: { name: { equals: brandSlug, mode: "insensitive" } } },
          { brandId: brandSlug },
        ],
      });
    }

    if (search) {
      andFilters.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { modelCode: { contains: search, mode: "insensitive" } },
          { brand: { name: { contains: search, mode: "insensitive" } } },
          { category: { name: { contains: search, mode: "insensitive" } } },
          { discipline: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    const whereConditions: Prisma.ProductWhereInput = {
      active: true,
      status: "PUBLISHED",
      ...(andFilters.length > 0 ? { AND: andFilters } : {}),
      ...(gender
        ? gender === "UNISEX"
          ? { gender: "UNISEX" }
          : { gender: { in: [gender, "UNISEX"] } }
        : {}),
      ...(ofertas
        ? {
            discountActive: true,
            AND: [
              {
                OR: [
                  { discountStartDate: null },
                  { discountStartDate: { lte: new Date() } },
                ],
              },
              {
                OR: [
                  { discountEndDate: null },
                  { discountEndDate: { gte: new Date() } },
                ],
              },
            ],
          }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      // Filtro de variantes activas con stock físico positivo
      variants: {
        some: {
          AND: [
            size ? { size: { equals: size, mode: "insensitive" } } : {},
            color ? { color: { equals: color, mode: "insensitive" } } : {},
            {
              OR: [
                { stockStore: { gt: 0 } },
                { stockWarehouse: { gt: 0 } },
              ],
            },
          ],
        },
      },
    };

    // 2. Ordenamiento configurable
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { price: "desc" };
    } else if (sort === "name_asc") {
      orderBy = { name: "asc" };
    } else if (sort === "newest") {
      orderBy = { createdAt: "desc" };
    }

    // 3. Paginación
    const skip = (page - 1) * limit;
    const take = limit;

    // 4. Ejecución atómica de conteo total y recuperación de página
    const [totalItems, productsRaw] = await prisma.$transaction([
      prisma.product.count({ where: whereConditions }),
      prisma.product.findMany({
        where: whereConditions,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          modelCode: true,
          price: true,
          gender: true,
          createdAt: true,
          discountActive: true,
          discountPercentage: true,
          discountPrice: true,
          discountStartDate: true,
          discountEndDate: true,
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
        },
      }),
    ]);

    // 5. Mapeo a DTOs públicos calculando disponibilidad real por variante
    const now = new Date();
    const mappedProducts: PublicProductItem[] = productsRaw.map((p) => {
      const promo = resolveEffectiveProductPromo(p, now);
      const basePrice = promo.basePrice;
      const effectiveProductPrice = promo.effectivePrice;
      let minVariantPrice = effectiveProductPrice;
      let maxVariantPrice = effectiveProductPrice;
      let totalStock = 0;

      const variantsDto: PublicVariantItem[] = p.variants.map((v) => {
        // Disponibilidad neta = (Salón + Depósito) - Comprometido
        const netStock = Math.max(
          0,
          v.stockStore + v.stockWarehouse - v.stockReserved
        );
        totalStock += netStock;

        const rawVariantPrice = v.price !== null ? Number(v.price) : null;
        const hasSpecificVariantPrice =
          rawVariantPrice !== null && Math.abs(rawVariantPrice - basePrice) > 0.01;

        const variantBase = hasSpecificVariantPrice ? rawVariantPrice : basePrice;
        let variantEffective = variantBase;
        if (promo.isPromoActive && promo.discountPercentage) {
          const vDiscount = Math.round(((variantBase * promo.discountPercentage) / 100) * 100) / 100;
          variantEffective = Math.max(0, Math.round((variantBase - vDiscount) * 100) / 100);
        }

        if (variantEffective < minVariantPrice) minVariantPrice = variantEffective;
        if (variantEffective > maxVariantPrice) maxVariantPrice = variantEffective;

        const resolvedVariantPrice = promo.isPromoActive
          ? variantEffective
          : hasSpecificVariantPrice
          ? variantBase
          : null;

        const resolvedVariantOriginalPrice = promo.isPromoActive
          ? variantBase
          : hasSpecificVariantPrice
          ? variantBase
          : undefined;

        return {
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          barcode: v.barcode,
          price: resolvedVariantPrice,
          originalPrice: resolvedVariantOriginalPrice,
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
        price: promo.isPromoActive ? effectiveProductPrice : basePrice,
        originalPrice: promo.isPromoActive ? basePrice : undefined,
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
        discountStartDate: p.discountStartDate ? p.discountStartDate.toISOString() : null,
        discountEndDate: p.discountEndDate ? p.discountEndDate.toISOString() : null,
        effectivePrice: effectiveProductPrice,
        formattedPrice: formatCurrency(basePrice),
        formattedEffectivePrice: formatCurrency(effectiveProductPrice),
      };
    });

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const response: PublicCatalogResponse = {
      products: mappedProducts,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    return { success: true, data: serialize(response) };
  } catch (error) {
    console.error("Error en getPublicCatalog:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al consultar el catálogo público" };
  }
}

export async function getPublicCatalog(filters: CatalogFilterInput = {}) {
  return fetchPublicCatalogRaw(filters);
}

/**
 * Búsqueda Predictiva Rápida para el Autocomplete del Navbar (RF-13)
 * Diseñada para respuestas en menos de 50ms con coincidencia parcial de texto.
 */
export async function getPredictiveSearch(
  query: string,
  limit: number = 8
): Promise<{ success: boolean; data?: PredictiveSearchItem[]; error?: string }> {
  try {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return { success: true, data: [] };
    }

    const validated = PredictiveSearchSchema.parse({ query: trimmed, limit });

    const products = await prisma.product.findMany({
      where: {
        active: true,
        status: "PUBLISHED",
        OR: [
          { name: { contains: validated.query, mode: "insensitive" } },
          { modelCode: { contains: validated.query, mode: "insensitive" } },
          { brand: { name: { contains: validated.query, mode: "insensitive" } } },
          { category: { name: { contains: validated.query, mode: "insensitive" } } },
        ],
        variants: {
          some: {
            OR: [
              { stockStore: { gt: 0 } },
              { stockWarehouse: { gt: 0 } },
            ],
          },
        },
      },
      take: validated.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        modelCode: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        discipline: { select: { slug: true } },
        variants: {
          select: {
            stockStore: true,
            stockWarehouse: true,
            stockReserved: true,
          },
        },
      },
    });

    const searchResults: PredictiveSearchItem[] = products.map((p) => {
      const totalStock = p.variants.reduce(
        (acc, v) =>
          acc + Math.max(0, v.stockStore + v.stockWarehouse - v.stockReserved),
        0
      );

      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        imageUrl: p.imageUrl,
        modelCode: p.modelCode,
        brandName: p.brand.name,
        categoryName: p.category.name,
        disciplineSlug: p.discipline.slug,
        availableStock: totalStock,
      };
    });

    return { success: true, data: serialize(searchResults) };
  } catch (error) {
    console.error("Error en getPredictiveSearch:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error en la búsqueda predictiva" };
  }
}

/**
 * Consulta de Facetas y Filtros Dinámicos con Disponibilidad Real (RF-13)
 * Devuelve opciones de disciplinas, categorías, marcas y talles con stock para la barra lateral.
 */
async function fetchCatalogFacetsRaw(
  filters?: Partial<CatalogFilterInput>
): Promise<{
  success: boolean;
  data?: CatalogFacetsResponse;
  error?: string;
}> {
  try {
    // 1. Obtener disciplinas con productos activos y con stock
    const disciplines = await prisma.discipline.findMany({
      where: {
        products: {
          some: {
            active: true,
            status: "PUBLISHED",
            variants: {
              some: {
                OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                active: true,
                status: "PUBLISHED",
                variants: {
                  some: {
                    OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // 2. Obtener categorías con productos activos y con stock
    const categories = await prisma.category.findMany({
      where: {
        products: {
          some: {
            active: true,
            status: "PUBLISHED",
            variants: {
              some: {
                OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                active: true,
                status: "PUBLISHED",
                variants: {
                  some: {
                    OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // 3. Obtener marcas con productos activos y con stock
    const brands = await prisma.brand.findMany({
      where: {
        products: {
          some: {
            active: true,
            status: "PUBLISHED",
            variants: {
              some: {
                OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                active: true,
                status: "PUBLISHED",
                variants: {
                  some: {
                    OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // 4. Obtener talles disponibles en stock (contextual a la disciplina, categoría o búsqueda activa)
    const sizeProductAndFilters: Prisma.ProductWhereInput[] = [];

    if (filters?.disciplineSlug) {
      sizeProductAndFilters.push({
        OR: [
          { discipline: { slug: { equals: filters.disciplineSlug, mode: "insensitive" } } },
          { discipline: { name: { equals: filters.disciplineSlug, mode: "insensitive" } } },
          { disciplineId: filters.disciplineSlug },
        ],
      });
    }

    if (filters?.categorySlug) {
      sizeProductAndFilters.push({
        OR: [
          { category: { slug: { equals: filters.categorySlug, mode: "insensitive" } } },
          { category: { name: { equals: filters.categorySlug, mode: "insensitive" } } },
          { categoryId: filters.categorySlug },
          { discipline: { slug: { equals: filters.categorySlug, mode: "insensitive" } } },
          { discipline: { name: { equals: filters.categorySlug, mode: "insensitive" } } },
          { disciplineId: filters.categorySlug },
        ],
      });
    }

    if (filters?.brandSlug) {
      sizeProductAndFilters.push({
        OR: [
          { brand: { slug: { equals: filters.brandSlug, mode: "insensitive" } } },
          { brand: { name: { equals: filters.brandSlug, mode: "insensitive" } } },
          { brandId: filters.brandSlug },
        ],
      });
    }

    if (filters?.search) {
      sizeProductAndFilters.push({
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { modelCode: { contains: filters.search, mode: "insensitive" } },
          { brand: { name: { contains: filters.search, mode: "insensitive" } } },
          { category: { name: { contains: filters.search, mode: "insensitive" } } },
          { discipline: { name: { contains: filters.search, mode: "insensitive" } } },
        ],
      });
    }

    if (filters?.gender) {
      const g = filters.gender as Gender;
      if (g === "UNISEX") {
        sizeProductAndFilters.push({ gender: "UNISEX" });
      } else if (g === "HOMBRE" || g === "MUJER" || g === "NINO") {
        sizeProductAndFilters.push({ gender: { in: [g, "UNISEX"] } });
      }
    }

    if (filters?.ofertas) {
      sizeProductAndFilters.push({
        discountActive: true,
        AND: [
          {
            OR: [
              { discountStartDate: null },
              { discountStartDate: { lte: new Date() } },
            ],
          },
          {
            OR: [
              { discountEndDate: null },
              { discountEndDate: { gte: new Date() } },
            ],
          },
        ],
      });
    }

    const sizeProductWhere: Prisma.ProductWhereInput = {
      active: true,
      status: "PUBLISHED",
      ...(sizeProductAndFilters.length > 0 ? { AND: sizeProductAndFilters } : {}),
    };

    const activeVariants = await prisma.productVariant.findMany({
      where: {
        product: sizeProductWhere,
        OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
      },
      select: {
        size: true,
        stockStore: true,
        stockWarehouse: true,
        stockReserved: true,
      },
    });

    const sizeCountMap = new Map<string, number>();
    for (const v of activeVariants) {
      const netStock = v.stockStore + v.stockWarehouse - v.stockReserved;
      if (netStock > 0 && v.size) {
        const sizeTrim = v.size.trim();
        sizeCountMap.set(sizeTrim, (sizeCountMap.get(sizeTrim) || 0) + 1);
      }
    }

    const sortedSizes = Array.from(sizeCountMap.entries())
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => {
        // Orden numérico si son números (calzado), alfabético si son letras (talles ropa)
        const numA = parseFloat(a.size);
        const numB = parseFloat(b.size);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.size.localeCompare(b.size);
      });

    // 5. Rango de precios global del catálogo activo
    const priceAggregate = await prisma.product.aggregate({
      where: {
        active: true,
        status: "PUBLISHED",
        variants: {
          some: {
            OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
          },
        },
      },
      _min: { price: true },
      _max: { price: true },
    });

        // 6. Conteo por género
    const genderCounts = await prisma.product.groupBy({
      by: ["gender"],
      where: {
        active: true,
        status: "PUBLISHED",
        variants: {
          some: {
            OR: [{ stockStore: { gt: 0 } }, { stockWarehouse: { gt: 0 } }],
          },
        },
      },
      _count: { _all: true },
    });

    const genderLabels: Record<string, string> = {
      HOMBRE: "Hombre",
      MUJER: "Mujer",
      NINO: "Niños",
      UNISEX: "Unisex",
    };

    const unisexCount =
      genderCounts.find((gc) => gc.gender === "UNISEX")?._count._all || 0;

    const gendersFacet = (["HOMBRE", "MUJER", "NINO", "UNISEX"] as const).map((g) => {
      const found = genderCounts.find((gc) => gc.gender === g);
      const exactCount = found ? found._count._all : 0;
      return {
        gender: g,
        label: genderLabels[g] || g,
        count: g === "UNISEX" ? exactCount : exactCount + unisexCount,
      };
    });

    const response: CatalogFacetsResponse = {
      disciplines: disciplines.map((d) => ({
        name: d.name,
        slug: d.slug,
        count: d._count.products,
      })),
      categories: categories.map((c) => ({
        name: c.name,
        slug: c.slug,
        count: c._count.products,
      })),
      brands: brands.map((b) => ({
        name: b.name,
        slug: b.slug,
        count: b._count.products,
      })),
      genders: gendersFacet,
      sizes: sortedSizes,
      priceRange: {
        min: priceAggregate._min.price ? Number(priceAggregate._min.price) : 0,
        max: priceAggregate._max.price ? Number(priceAggregate._max.price) : 100000,
      },
    };

    return { success: true, data: serialize(response) };
  } catch (error) {
    console.error("Error en getCatalogFacets:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al consultar facetas del catálogo" };
  }
}

/**
 * Consulta de facetas envuelta en caché de Next.js (unstable_cache)
 * Etiqueta: 'ecommerce-catalog' | Revalidación automática: 60s
 */
const getCachedCatalogFacets = unstable_cache(
  fetchCatalogFacetsRaw,
  ["ecommerce-catalog-facets"],
  {
    tags: ["ecommerce-catalog", "catalog-facets"],
    revalidate: 60,
  }
);

export async function getCatalogFacets(
  filters?: Partial<CatalogFilterInput>
) {
  const hasContext = Boolean(
    filters?.disciplineSlug ||
      filters?.categorySlug ||
      filters?.brandSlug ||
      filters?.search ||
      filters?.gender ||
      filters?.ofertas
  );

  if (hasContext) {
    return await fetchCatalogFacetsRaw(filters);
  }

  try {
    return await getCachedCatalogFacets();
  } catch {
    // Fallback cuando se ejecuta fuera del contexto de Next.js (ej: scripts tsx, CLI o testing)
    return await fetchCatalogFacetsRaw();
  }
}

/**
 * Revalida la caché del catálogo público on-demand
 * Invocar cuando se editen productos, precios o movimientos de stock en el panel o POS
 */
export async function revalidateEcommerceCatalogCache() {
  try {
    invalidateLandingCache("product");
    revalidateTag("ecommerce-catalog");
    revalidateTag("catalog-facets");
    revalidatePath("/catalogo");
    revalidatePath("/productos");
    revalidatePath("/");
    return { success: true };
  } catch {
    // Silenciado fuera del ciclo de petición HTTP de Next.js (ej: scripts tsx o CLI)
    return { success: true, warning: "Revalidación omitida fuera del contexto de Next.js" };
  }
}
