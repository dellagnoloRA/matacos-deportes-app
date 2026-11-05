export interface ProductSizeOption {
  size: string;
  inStock: boolean;
  stock?: number;
}

export interface ProductColorOption {
  name: string;
  hex?: string;
}

export interface EcommerceProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  discipline?: string;
  price: number;
  originalPrice?: number;
  isOffer?: boolean;
  offerTag?: string;
  image: string;
  images?: string[];
  secondaryImage?: string;
  description?: string;
  highlights?: { icon: string; title: string; text: string }[];
  specs?: Record<string, string>;
  installments?: string;
  sizes?: ProductSizeOption[];
  colors?: string[];
  gender?: "Hombre" | "Mujer" | "Unisex" | "Niños";
  inStock?: boolean;
  stockCount?: number;
  freeShipping?: boolean;
  storePickup?: boolean;
  cashTransferDiscountPercent?: number; // ej: 10%
  discountPercent?: number; // ej: 15%
  isNew?: boolean;
  rating?: number;
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
