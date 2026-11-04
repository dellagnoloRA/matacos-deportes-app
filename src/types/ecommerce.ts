/**
 * DTOs Públicos y Contratos de Datos para el E-commerce de Matacos Deportes (RF-13)
 * Diseñados estrictamente sin datos sensibles internos (sin precios de costo ni proveedores).
 */

/**
 * Tiempo máximo de reserva de stock en pasarela de pago para órdenes web impagas (15 minutos según Hoja de Riesgo R-01 / RF-15)
 */
export const WEB_ORDER_RESERVATION_MINUTES = 15;

export interface PublicVariantItem {
  id: string;
  size: string;
  color: string;
  sku: string;
  barcode: string | null;
  price: number | null; // Precio diferencial si difiere del base
  availableStock: number; // Existencias netas: (stockStore + stockWarehouse) - stockReserved
  inStock: boolean;
}

export interface PublicImageItem {
  id: string;
  url: string;
  color: string | null;
  isPrimary: boolean;
  order: number;
}

export interface PublicProductItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  modelCode: string | null;
  price: number; // Precio base en ARS
  gender: "HOMBRE" | "MUJER" | "NINO" | "UNISEX";
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  discipline: {
    id: string;
    name: string;
    slug: string;
  };
  images: PublicImageItem[];
  variants: PublicVariantItem[];
  totalAvailableStock: number;
  hasStock: boolean;
  minPrice: number;
  maxPrice: number;
  createdAt: string;
}

export interface CatalogPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PublicCatalogResponse {
  products: PublicProductItem[];
  pagination: CatalogPagination;
}

export interface PredictiveSearchItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  modelCode: string | null;
  brandName: string;
  categoryName: string;
  disciplineSlug: string;
  availableStock: number;
}

export interface CatalogFacetOption {
  name: string;
  slug: string;
  count: number;
}

export interface CatalogFacetsResponse {
  disciplines: CatalogFacetOption[];
  categories: CatalogFacetOption[];
  brands: CatalogFacetOption[];
  genders: { gender: "HOMBRE" | "MUJER" | "NINO" | "UNISEX"; label: string; count: number }[];
  sizes: { size: string; count: number }[];
  priceRange: { min: number; max: number };
}

/**
 * Tipos específicos para la Ficha de Detalle de Producto (PDP - RF-14)
 */

export interface ColorOption {
  color: string;
  inStock: boolean;
  imageUrl?: string | null;
}

export interface SizeOption {
  size: string;
  inStock: boolean;
  availableStock: number;
}

export type ProductStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface PublicProductDetail extends PublicProductItem {
  colorOptions: ColorOption[];
  sizeOptions: SizeOption[];
  isLowStock: boolean;
  stockStatus: ProductStockStatus;
}

export interface VariantStockCheckResult {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  color: string;
  availableStock: number;
  isAvailable: boolean;
  isLowStock: boolean;
  price: number;
}
