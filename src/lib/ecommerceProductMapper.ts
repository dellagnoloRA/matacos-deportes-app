import type { PublicProductItem } from "@/types/ecommerce";
import type { EcommerceProduct } from "@/components/ecommerce/types";

/**
 * Convierte un PublicProductItem del backend en un EcommerceProduct listo para la UI.
 * Soporta de forma transparente descuentos promocionales activos (RF-27 / RF-28).
 */
export function mapPublicProductToEcommerce(
  item: PublicProductItem
): EcommerceProduct {
  const hasPromoDiscount =
    Boolean(item.discountActive) &&
    (
      (typeof item.originalPrice === "number" && item.originalPrice > item.price) ||
      (typeof item.effectivePrice === "number" && item.effectivePrice > 0 && item.effectivePrice < item.price)
    );

  const isVariantSpreadOffer = !hasPromoDiscount && item.maxPrice > item.price;
  const isOffer = hasPromoDiscount || isVariantSpreadOffer;

  const displayPrice = hasPromoDiscount
    ? (typeof item.effectivePrice === "number" && item.effectivePrice > 0 && item.effectivePrice < item.price ? item.effectivePrice : item.price)
    : item.price;
  const originalPrice = hasPromoDiscount
    ? (typeof item.originalPrice === "number" && item.originalPrice > displayPrice ? item.originalPrice : item.price)
    : isVariantSpreadOffer
      ? item.maxPrice
      : undefined;

  const offerTag = hasPromoDiscount
    ? item.discountPercentage && item.discountPercentage > 0
      ? `${Math.round(item.discountPercentage)}% OFF`
      : "OFERTA"
    : isVariantSpreadOffer
      ? "OFERTA"
      : undefined;

  // Priorizar imagen primaria o primera de la galería o imageUrl directo
  const primaryImage =
    item.images.find((img) => img.isPrimary)?.url ||
    item.images[0]?.url ||
    item.imageUrl ||
    "/placeholder-product.svg";

  return {
    id: item.id,
    name: item.name,
    brand: item.brand.name,
    brandSlug: item.brand.slug,
    category: item.category.name,
    categorySlug: item.category.slug,
    discipline: item.discipline?.name,
    disciplineSlug: item.discipline?.slug,
    price: displayPrice,
    originalPrice,
    isOffer,
    offerTag,
    image: primaryImage,
    images: item.images,
    description: item.description || undefined,
    installments:
      displayPrice >= 80000
        ? "3 cuotas s/interés · 4 en Naranja X"
        : displayPrice >= 30000
        ? "3 cuotas sin interés · Plan Z"
        : "Plan Z s/interés · 3 cuotas desde $30.000",
    totalAvailableStock: item.totalAvailableStock,
    hasStock: item.hasStock,
    variants: item.variants,
    modelCode: item.modelCode || undefined,
  };
}
