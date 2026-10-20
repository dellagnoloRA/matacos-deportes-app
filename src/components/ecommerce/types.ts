export interface EcommerceProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  discipline?: string;
  disciplineSlug?: string;
  categorySlug?: string;
  brandSlug?: string;
  price: number;
  originalPrice?: number;
  isOffer?: boolean;
  offerTag?: string;
  image: string;
  images?: Array<{ id: string; url: string; color: string | null; isPrimary: boolean; order: number }>;
  description?: string;
  installments?: string;
  totalAvailableStock?: number;
  hasStock?: boolean;
  variants?: Array<{
    id: string;
    size: string;
    color: string;
    sku: string;
    barcode: string | null;
    price: number | null;
    availableStock: number;
    inStock: boolean;
  }>;
  modelCode?: string;
}

export interface EcommerceCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount?: number;
}

export interface EcommerceDiscipline {
  id: string;
  name: string;
  slug: string;
}
