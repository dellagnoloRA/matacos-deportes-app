"use server";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { resolveEffectiveProductPromo } from "@/server/services/landingService";
import {
  CheckVariantStockSchema,
  RelatedProductsSchema,
} from "@/schemas/ecommerce";
import type {
  PublicProductDetail,
  PublicVariantItem,
  PublicProductItem,
  PublicHighlightItem,
  PublicSizeGuide,
  PublicCareGuide,
  PublicCareInstruction,
  PublicDimensionsCm,
  ColorOption,
  SizeOption,
  VariantStockCheckResult,
} from "@/types/ecommerce";

function parseHighlights(raw: unknown): PublicHighlightItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: PublicHighlightItem[] = [];
  for (const item of raw) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const rec = item as Record<string, unknown>;
      const title = typeof rec.title === "string" ? rec.title.trim() : "";
      const text = typeof rec.text === "string" ? rec.text.trim() : "";
      if (title || text) {
        items.push({
          icon: typeof rec.icon === "string" && rec.icon.trim() ? rec.icon.trim() : "zap",
          title,
          text,
          isCustomIcon: typeof rec.isCustomIcon === "boolean" ? rec.isCustomIcon : undefined,
        });
      }
    }
  }
  return items.length > 0 ? items : null;
}

function parseSpecs(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = k.trim();
    if (!key || v === null || v === undefined) continue;
    const val = String(v).trim();
    if (val) result[key] = val;
  }
  return Object.keys(result).length > 0 ? result : null;
}

function parseDimensionsCm(raw: unknown): PublicDimensionsCm | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  const length = typeof rec.length === "number" ? rec.length : undefined;
  const width = typeof rec.width === "number" ? rec.width : undefined;
  const height = typeof rec.height === "number" ? rec.height : undefined;
  if (length === undefined && width === undefined && height === undefined) return null;
  return { length, width, height };
}

function parseSizeGuide(raw: {
  id: string;
  name: string;
  gender: string;
  type: string;
  unit: string;
  fitNote: string | null;
  columns: unknown;
  rows: unknown;
  guideImage: string | null;
} | null | undefined): PublicSizeGuide | null {
  if (!raw) return null;
  const columns = Array.isArray(raw.columns)
    ? raw.columns.filter((c): c is string => typeof c === "string")
    : [];
  const rows: Record<string, string>[] = Array.isArray(raw.rows)
    ? raw.rows
        .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object" && !Array.isArray(r)))
        .map((r) => {
          const cleanRow: Record<string, string> = {};
          for (const [k, v] of Object.entries(r)) {
            cleanRow[k] = v === null || v === undefined ? "" : String(v);
          }
          return cleanRow;
        })
    : [];
  return {
    id: raw.id,
    name: raw.name,
    gender: raw.gender,
    type: raw.type,
    unit: raw.unit,
    fitNote: raw.fitNote,
    columns,
    rows,
    guideImage: raw.guideImage,
  };
}

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

function parseCareGuide(raw: {
  id: string;
  name: string;
  type: string;
  summary: string | null;
  instructions: unknown;
  warning: string | null;
} | null | undefined): PublicCareGuide | null {
  if (!raw) return null;
  const instructions: PublicCareInstruction[] = Array.isArray(raw.instructions)
    ? raw.instructions.flatMap((entry) => {
        if (typeof entry === "string" && entry.trim()) {
          return [{ text: entry.trim() }];
        }
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const rec = entry as Record<string, unknown>;
          const text = typeof rec.text === "string" ? rec.text.trim() : "";
          if (text) {
            return [
              {
                icon: typeof rec.icon === "string" && rec.icon.trim() ? rec.icon.trim() : undefined,
                text,
              },
            ];
          }
        }
        return [];
      })
    : [];
  if (instructions.length === 0 && !raw.summary && !raw.warning) return null;
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    summary: raw.summary,
    instructions,
    warning: raw.warning,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_TRAILING_REGEX = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * Obtener detalle técnico completo de un producto para la Ficha PDP (RF-14)
 * Soporta tanto UUID directo como slugs compuestos con UUID o código de modelo.
 * Calcula stock real por variante sin ocultar variantes agotadas para consulta informativa.
 */
export async function getProductDetail(
  identifier: string
): Promise<{ success: boolean; data?: PublicProductDetail; error?: string }> {
  try {
    const raw = identifier.trim();
    if (!raw) {
      return { success: false, error: "Identificador de producto no provisto" };
    }

    // 1. Resolver el ID del producto (UUID directo, extraído de slug o búsqueda por modelCode)
    let productId: string | null = null;
    let modelCodeCandidate: string | null = null;

    if (UUID_REGEX.test(raw)) {
      productId = raw;
    } else {
      const match = raw.match(UUID_TRAILING_REGEX);
      if (match) {
        productId = match[1];
      } else {
        modelCodeCandidate = raw;
      }
    }

    // 2. Consulta a PostgreSQL con Prisma (Zero-Leakage: sin costPrice)
    const product = await prisma.product.findFirst({
      where: {
        active: true,
        status: "PUBLISHED",
        ...(productId
          ? { id: productId }
          : modelCodeCandidate
          ? {
              OR: [
                { modelCode: { equals: modelCodeCandidate, mode: "insensitive" } },
                { id: modelCodeCandidate },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        shortDescription: true,
        highlights: true,
        specs: true,
        weightGrams: true,
        dimensionsCm: true,
        sizeGuideId: true,
        sizeGuide: {
          select: {
            id: true,
            name: true,
            gender: true,
            type: true,
            unit: true,
            fitNote: true,
            columns: true,
            rows: true,
            guideImage: true,
          },
        },
        careGuideId: true,
        careGuide: {
          select: {
            id: true,
            name: true,
            type: true,
            summary: true,
            instructions: true,
            warning: true,
          },
        },
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
    });

    if (!product) {
      return { success: false, error: "Producto no encontrado o inactivo" };
    }

    const now = new Date();
    const promo = resolveEffectiveProductPromo(product, now);
    const basePrice = promo.basePrice;
    const effectiveProductPrice = promo.effectivePrice;
    let minVariantPrice = effectiveProductPrice;
    let maxVariantPrice = effectiveProductPrice;
    let totalStock = 0;

    // 3. Mapear variantes calculando stock real: (Salón + Depósito) - Reservado
    const variantsDto: PublicVariantItem[] = product.variants.map((v) => {
      const netStock = Math.max(
        0,
        v.stockStore + v.stockWarehouse - v.stockReserved
      );
      totalStock += netStock;

      const rawVariantPrice = v.price !== null ? Number(v.price) : null;
      const hasSpecificVariantPrice =
        rawVariantPrice !== null && Math.abs(rawVariantPrice - basePrice) > 0.01;

      // Base de lista de esta variante
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
        // No ocultamos variantes agotadas; se marca isAvailable: false
        inStock: netStock > 0,
      };
    });

    // 4. Armar matrices de opciones de color y talle para la interfaz de selección
    const colorMap = new Map<string, { inStock: boolean; imageUrl?: string | null }>();
    const sizeMap = new Map<string, { inStock: boolean; totalStock: number }>();

    for (const v of variantsDto) {
      const c = v.color.trim();
      const s = v.size.trim();

      // Colores
      const existingColor = colorMap.get(c);
      const isColorInStock = v.inStock || (existingColor?.inStock ?? false);
      const colorImage =
        product.images.find(
          (img) => img.color && img.color.toLowerCase() === c.toLowerCase()
        )?.url || null;

      colorMap.set(c, { inStock: isColorInStock, imageUrl: colorImage });

      // Talles
      const existingSize = sizeMap.get(s);
      sizeMap.set(s, {
        inStock: v.inStock || (existingSize?.inStock ?? false),
        totalStock: (existingSize?.totalStock ?? 0) + v.availableStock,
      });
    }

    const colorOptions: ColorOption[] = Array.from(colorMap.entries()).map(
      ([color, info]) => ({
        color,
        inStock: info.inStock,
        imageUrl: info.imageUrl,
      })
    );

    const sizeOptions: SizeOption[] = Array.from(sizeMap.entries())
      .map(([size, info]) => ({
        size,
        inStock: info.inStock,
        availableStock: info.totalStock,
      }))
      .sort((a, b) => {
        const numA = parseFloat(a.size);
        const numB = parseFloat(b.size);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.size.localeCompare(b.size);
      });

    const isLowStock = totalStock > 0 && totalStock <= 3;
    const stockStatus =
      totalStock > 3 ? "IN_STOCK" : totalStock > 0 ? "LOW_STOCK" : "OUT_OF_STOCK";

    const detail: PublicProductDetail = {
      id: product.id,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      highlights: parseHighlights(product.highlights),
      specs: parseSpecs(product.specs),
      sizeGuideId: product.sizeGuideId,
      sizeGuide: parseSizeGuide(product.sizeGuide),
      careGuideId: product.careGuideId,
      careGuide: parseCareGuide(product.careGuide),
      weightGrams: product.weightGrams,
      dimensionsCm: parseDimensionsCm(product.dimensionsCm),
      imageUrl: product.imageUrl,
      modelCode: product.modelCode,
      price: promo.isPromoActive ? effectiveProductPrice : basePrice,
      originalPrice: promo.isPromoActive ? basePrice : undefined,
      gender: product.gender,
      category: product.category,
      brand: product.brand,
      discipline: product.discipline,
      images: product.images,
      variants: variantsDto,
      colorOptions,
      sizeOptions,
      totalAvailableStock: totalStock,
      hasStock: totalStock > 0,
      isLowStock,
      stockStatus,
      minPrice: minVariantPrice,
      maxPrice: maxVariantPrice,
      createdAt: product.createdAt.toISOString(),
      discountActive: promo.isPromoActive,
      discountPercentage: promo.discountPercentage,
      discountPrice: promo.discountPrice,
      discountStartDate: product.discountStartDate ? product.discountStartDate.toISOString() : null,
      discountEndDate: product.discountEndDate ? product.discountEndDate.toISOString() : null,
      effectivePrice: effectiveProductPrice,
      formattedPrice: formatCurrency(basePrice),
      formattedEffectivePrice: formatCurrency(effectiveProductPrice),
    };

    return { success: true, data: serialize(detail) };
  } catch (error) {
    console.error("Error en getProductDetail:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al consultar la ficha del producto" };
  }
}

/**
 * Consulta atómica y ligera de existencias para una variante específica (RF-14)
 * Ejecutada en milisegundos cuando el usuario cambia de talle/color o agrega al carrito.
 */
export async function checkVariantStock(
  variantId: string
): Promise<{ success: boolean; data?: VariantStockCheckResult; error?: string }> {
  try {
    const validated = CheckVariantStockSchema.parse({ variantId });

    const variant = await prisma.productVariant.findUnique({
      where: { id: validated.variantId },
      select: {
        id: true,
        size: true,
        color: true,
        price: true,
        stockStore: true,
        stockWarehouse: true,
        stockReserved: true,
        productId: true,
        product: {
          select: {
            active: true,
            status: true,
            name: true,
            price: true,
            discountActive: true,
            discountPercentage: true,
            discountPrice: true,
            discountStartDate: true,
            discountEndDate: true,
          },
        },
      },
    });

    if (!variant || !variant.product.active || variant.product.status !== "PUBLISHED") {
      return {
        success: false,
        error: "La variante seleccionada no está disponible o el producto fue desactivado",
      };
    }

    const availableStock = Math.max(
      0,
      variant.stockStore + variant.stockWarehouse - variant.stockReserved
    );
    const isAvailable = availableStock > 0;
    const isLowStock = availableStock > 0 && availableStock <= 3;

    const now = new Date();
    const promo = resolveEffectiveProductPromo(variant.product, now);
    const basePrice = promo.basePrice;
    const rawVariantPrice = variant.price !== null ? Number(variant.price) : null;
    const hasSpecificVariantPrice =
      rawVariantPrice !== null && Math.abs(rawVariantPrice - basePrice) > 0.01;
    const variantBase = hasSpecificVariantPrice ? rawVariantPrice : basePrice;

    let variantEffective = variantBase;
    if (promo.isPromoActive && promo.discountPercentage) {
      const vDiscount = Math.round(((variantBase * promo.discountPercentage) / 100) * 100) / 100;
      variantEffective = Math.max(0, Math.round((variantBase - vDiscount) * 100) / 100);
    }
    const effectivePrice = promo.isPromoActive ? variantEffective : variantBase;

    const result: VariantStockCheckResult = {
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      size: variant.size,
      color: variant.color,
      availableStock,
      isAvailable,
      isLowStock,
      price: effectivePrice,
    };

    return { success: true, data: serialize(result) };
  } catch (error) {
    console.error("Error en checkVariantStock:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al verificar stock de la variante" };
  }
}

/**
 * Obtener productos relacionados para la sección de recomendaciones (RF-14)
 * Prioriza artículos activos y con stock de la misma disciplina o categoría.
 */
export async function getRelatedProducts(
  productId: string,
  limit = 4
): Promise<{ success: boolean; data?: PublicProductItem[]; error?: string }> {
  try {
    const parsed = RelatedProductsSchema.safeParse({ productId, limit });
    if (!parsed.success) {
      return {
        success: false,
        data: [],
        error: parsed.error.issues[0]?.message || "ID de producto inválido",
      };
    }
    const validated = parsed.data;

    // 1. Obtener disciplina y categoría del producto de referencia
    const currentProduct = await prisma.product.findUnique({
      where: { id: validated.productId },
      select: { disciplineId: true, categoryId: true },
    });

    if (!currentProduct) {
      return { success: true, data: [] };
    }

    // 2. Buscar artículos afines con stock positivo excluyendo el actual
    const relatedRaw = await prisma.product.findMany({
      where: {
        active: true,
        status: "PUBLISHED",
        id: { not: validated.productId },
        OR: [
          { disciplineId: currentProduct.disciplineId },
          { categoryId: currentProduct.categoryId },
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
        description: true,
        shortDescription: true,
        highlights: true,
        specs: true,
        weightGrams: true,
        dimensionsCm: true,
        sizeGuideId: true,
        sizeGuide: {
          select: {
            id: true,
            name: true,
            gender: true,
            type: true,
            unit: true,
            fitNote: true,
            columns: true,
            rows: true,
            guideImage: true,
          },
        },
        careGuideId: true,
        careGuide: {
          select: {
            id: true,
            name: true,
            type: true,
            summary: true,
            instructions: true,
            warning: true,
          },
        },
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
    });

    // 3. Mapeo al estándar DTO público
    const now = new Date();
    const relatedProducts: PublicProductItem[] = relatedRaw.map((p) => {
      const promo = resolveEffectiveProductPromo(p, now);
      const basePrice = promo.basePrice;
      const effectiveProductPrice = promo.effectivePrice;
      let minVariantPrice = effectiveProductPrice;
      let maxVariantPrice = effectiveProductPrice;
      let totalStock = 0;

      const variantsDto: PublicVariantItem[] = p.variants.map((v) => {
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
        discountActive: promo.isPromoActive,
        discountPercentage: promo.discountPercentage,
        discountPrice: promo.discountPrice,
        discountStartDate: p.discountStartDate ? p.discountStartDate.toISOString() : null,
        discountEndDate: p.discountEndDate ? p.discountEndDate.toISOString() : null,
        effectivePrice: effectiveProductPrice,
        formattedPrice: formatCurrency(basePrice),
        formattedEffectivePrice: formatCurrency(effectiveProductPrice),
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
      };
    });

    return { success: true, data: serialize(relatedProducts) };
  } catch (error) {
    console.error("Error en getRelatedProducts:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al obtener productos relacionados" };
  }
}
