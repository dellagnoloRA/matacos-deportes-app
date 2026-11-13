export interface SizeGuideItem {
  id: string;
  name: string;
  brandId?: string | null;
  brandName?: string | null;
  gender: string;
  type: string;
  unit: string;
  fitNote?: string | null;
  columns: string[];
  rows: Record<string, string>[];
  guideImage?: string | null;
}

export interface ProductVariantItem {
  id?: string;
  size: string;
  color: string;
  colorHex?: string;
  sku: string;
  barcode?: string;
  price?: number | null;
  stockStore: number;
  stockWarehouse: number;
  minStoreStock: number;
  minStock: number;
}

export interface HighlightItem {
  icon: string;
  title: string;
  text: string;
  isCustomIcon?: boolean;
}

export interface WizardFormState {
  id?: string;
  draftId?: string;

  // Paso 1: Identificación
  name: string;
  skuModel: string;
  slug: string;
  brandId: string;
  gender: string;
  disciplineId: string;
  categoryId: string;
  subcategoryId?: string;
  tags: string[];

  // Paso 2: Fotos
  generalImages: { url: string; isPrimary: boolean; order: number; color?: string }[];
  colorImages: Record<string, string[]>;

  // Paso 3: Precios
  costPrice?: number | null;
  listPrice?: number | null;
  price: number;
  vatRate: number;
  installments: number;

  // Paso 4: Ficha Técnica
  shortDescription: string;
  description: string;
  highlights: HighlightItem[];
  specs: Record<string, string>;

  // Paso 5: Guía de Talles
  useSizeGuide: boolean;
  sizeGuideId?: string | null;

  // Paso 6: Variantes y Stock
  variants: ProductVariantItem[];

  // Paso 7: Envío y Publicación
  weightGrams?: number | null;
  dimensions?: { length?: number; width?: number; height?: number };
  metaTitle?: string;
  metaDescription?: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  publishedAt?: string | null;
}

export type StepStatus = "pending" | "current" | "complete" | "error";

export interface StepDefinition {
  id: number;
  key: string;
  title: string;
  subtitle: string;
}
