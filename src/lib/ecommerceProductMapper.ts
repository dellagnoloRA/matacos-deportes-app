import type { PublicProductItem } from "@/types/ecommerce";
import type { EcommerceProduct } from "@/components/ecommerce/types";

/**
 * Convierte un PublicProductItem del backend en un EcommerceProduct listo para la UI
 */
export function mapPublicProductToEcommerce(item: PublicProductItem): EcommerceProduct {
  const isOffer = item.maxPrice > item.price;
  const originalPrice = isOffer ? item.maxPrice : undefined;

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
    price: item.price,
    originalPrice,
    isOffer,
    offerTag: isOffer ? "OFERTA" : undefined,
    image: primaryImage,
    images: item.images,
    description: item.description || undefined,
    installments: "3 y 6 cuotas sin interés",
    totalAvailableStock: item.totalAvailableStock,
    hasStock: item.hasStock,
    variants: item.variants,
    modelCode: item.modelCode || undefined,
  };
}

