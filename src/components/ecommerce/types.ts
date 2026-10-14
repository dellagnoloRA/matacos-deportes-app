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
  description?: string;
  installments?: string;
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
