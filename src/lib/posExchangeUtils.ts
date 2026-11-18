import { normalizeSearch } from "@/lib/utils";
import type {
  DetailedProductItem,
  ProductVariantItem,
} from "@/components/dashboard/types";
import { sortVariantsNaturally } from "@/components/dashboard/VariantSelectorModal";

export interface ColorOptionSummary {
  color: string;
  count: number;
  availableStock: number;
}

export interface ProductSearchResult {
  product: DetailedProductItem;
  matchedVariant?: ProductVariantItem;
}

export function getAvailableStoreStock(variant: ProductVariantItem): number {
  return Math.max(0, variant.stockStore - (variant.stockReserved || 0));
}

export function getAvailableColors(
  variants: ProductVariantItem[],
  excludedVariantId?: string
): ColorOptionSummary[] {
  const map = new Map<string, ColorOptionSummary>();

  for (const variant of variants) {
    const rawColor = (variant.color || "").trim();
    if (!rawColor) continue;

    const key = rawColor.toLowerCase();
    const existing = map.get(key) || {
      color: rawColor,
      count: 0,
      availableStock: 0,
    };

    if (variant.id !== excludedVariantId) {
      existing.count += 1;
      existing.availableStock += getAvailableStoreStock(variant);
    }

    map.set(key, existing);
  }

  return Array.from(map.values());
}

/**
 * Determina el color por defecto para evitar listar todas las variantes juntas.
 * Prioriza el color indicado (por ejemplo, el de la prenda devuelta), luego un color
 * mencionado en la búsqueda y finalmente el primer color con stock disponible en salón.
 */
export function resolveDefaultColor(
  variants: ProductVariantItem[],
  preferredColor?: string | null,
  queryHint?: string,
  excludedVariantId?: string
): string {
  const colors = getAvailableColors(variants, excludedVariantId);
  if (colors.length === 0) return "ALL";

  const preferred = (preferredColor || "").trim().toLowerCase();
  if (preferred) {
    const exact = colors.find((c) => c.color.toLowerCase() === preferred);
    if (exact) return exact.color;
  }

  if (queryHint?.trim()) {
    const normHint = normalizeSearch(queryHint);
    const tokens = normHint.split(/\s+/).filter(Boolean);
    const fromHint = colors.find((c) => {
      const normColor = normalizeSearch(c.color);
      return tokens.some(
        (t) => normColor.includes(t) || normHint.includes(normColor)
      );
    });
    if (fromHint) return fromHint.color;
  }

  const withStock = colors.find((c) => c.availableStock > 0 && c.count > 0);
  if (withStock) return withStock.color;

  const withVariants = colors.find((c) => c.count > 0);
  return withVariants?.color || colors[0].color;
}

export function findExactVariantByCode(
  products: DetailedProductItem[],
  rawCode: string,
  allowSku = false
): { product: DetailedProductItem; variant: ProductVariantItem } | null {
  const q = rawCode.trim().toLowerCase();
  if (!q) return null;

  for (const prod of products) {
    const byBarcode = prod.variants.find(
      (v) => v.barcode && v.barcode.trim().toLowerCase() === q
    );
    if (byBarcode) return { product: prod, variant: byBarcode };
  }

  if (allowSku) {
    for (const prod of products) {
      const bySku = prod.variants.find(
        (v) => v.sku && v.sku.trim().toLowerCase() === q
      );
      if (bySku) return { product: prod, variant: bySku };
    }
  }

  return null;
}

export function searchProductsByQuery(
  products: DetailedProductItem[],
  rawQuery: string,
  limit = 10
): ProductSearchResult[] {
  const normQuery = normalizeSearch(rawQuery);
  if (!normQuery) return [];

  const rawLower = rawQuery.trim().toLowerCase();
  const tokens = normQuery.split(/\s+/).filter(Boolean);
  const termNoSpaces = normQuery.replace(/\s+/g, "");

  const results: ProductSearchResult[] = [];

  for (const prod of products) {
    const productFields = [
      prod.name,
      prod.brand,
      prod.category,
      prod.discipline || "",
      prod.modelCode || "",
      prod.sku || "",
      prod.barcode || "",
    ].map(normalizeSearch);

    const matchedVariant = prod.variants.find((v) => {
      const vb = (v.barcode || "").trim().toLowerCase();
      const vs = (v.sku || "").trim().toLowerCase();
      return (vb && vb.includes(rawLower)) || (vs && vs.includes(rawLower));
    });

    const variantFields = prod.variants.flatMap((v) =>
      [v.size, v.color, v.sku || "", v.barcode || ""].map(normalizeSearch)
    );

    const allFields = [...productFields, ...variantFields];
    const allText = allFields.join(" ");
    const allTextNoSpaces = allText.replace(/\s+/g, "");

    const matchesAllTokens = tokens.every(
      (token) =>
        allFields.some((f) => f.includes(token)) || allText.includes(token)
    );
    const matchesNoSpaces =
      termNoSpaces.length > 0 && allTextNoSpaces.includes(termNoSpaces);

    if (matchesAllTokens || matchesNoSpaces) {
      results.push({ product: prod, matchedVariant });
      if (results.length >= limit) break;
    }
  }

  return results;
}

export interface FilterExchangeVariantsOptions {
  variants: ProductVariantItem[];
  colorFilter: string;
  variantSearch: string;
  mode: "return" | "exchange";
  stockFilter?: "ALL" | "IN_STOCK";
  excludedVariantId?: string;
}

export function filterExchangeVariants({
  variants,
  colorFilter,
  variantSearch,
  mode,
  stockFilter = "ALL",
  excludedVariantId,
}: FilterExchangeVariantsOptions): ProductVariantItem[] {
  const sorted = sortVariantsNaturally(variants);
  const normQuery = normalizeSearch(variantSearch);
  const rawQueryLower = variantSearch.trim().toLowerCase();

  return sorted.filter((v) => {
    if (excludedVariantId && v.id === excludedVariantId) {
      return false;
    }

    if (
      colorFilter !== "ALL" &&
      (v.color || "").trim().toLowerCase() !== colorFilter.trim().toLowerCase()
    ) {
      return false;
    }

    if (mode === "exchange" && stockFilter === "IN_STOCK") {
      if (getAvailableStoreStock(v) <= 0) return false;
    }

    if (normQuery) {
      const sizeMatch = normalizeSearch(v.size).includes(normQuery);
      const colorMatch = normalizeSearch(v.color || "").includes(normQuery);
      const barcodeMatch = (v.barcode || "")
        .toLowerCase()
        .includes(rawQueryLower);
      const skuMatch = (v.sku || "").toLowerCase().includes(rawQueryLower);
      if (!sizeMatch && !colorMatch && !barcodeMatch && !skuMatch) {
        return false;
      }
    }

    return true;
  });
}
