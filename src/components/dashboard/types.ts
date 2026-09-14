export interface KpiData {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  isFeatured?: boolean;
}

export interface ChartDataPoint {
  month: string;
  currentYear: number;
  lastYear: number;
}

export interface SalesChannelItem {
  id: string;
  name: string;
  level: number; // 1 to 5
}

export interface TrafficSource {
  source: string;
  visits: number;
  label: string;
  barColor: string;
}

export interface ProvinceTraffic {
  province: string;
  percentage: number;
  color: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  iconType: "bug" | "user" | "subscribe";
}

export interface ActivityItem {
  id: string;
  action: string;
  time: string;
  avatarBg: string;
  initials: string;
}

export interface ProviderContact {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  avatarBg: string;
  avatarImg?: string;
  initials: string;
}

// ==========================================
// Tipos para Detalle de Producto y Catálogo
// ==========================================

export interface SizeConversion {
  ar: string;
  us: string;
  eu: string;
  br: string;
  cm: string;
  note?: string;
}

export interface ProductVariantItem {
  id?: string;
  size: string;
  color: string;
  barcode: string;
  sku?: string;
  stockStore: number; // Salón Saavedra 241
  stockWarehouse: number; // Depósito Central Formosa
  price?: number | null; // Precio específico o diferencial si difiere del precio base
  receivedCount?: number;
  soldCountStore?: number;
  soldCountWeb?: number;
}

export interface DetailedProductItem {
  id: string;
  name: string;
  description: string;
  brand: string;
  discipline: string;
  category: string;
  subcategory?: string;
  sku: string;
  barcode: string;
  costPrice: number;
  price: number;
  stockLocal: number; // Suma store
  stockWeb: number; // Suma web/warehouse
  minStock: number;
  updatedAt: string;
  iconBg: string;
  imageUrl?: string;
  receivedTotal?: number;
  stockTransfer?: number;
  salesStoreTotal?: number;
  salesWebTotal?: number;
  variants: ProductVariantItem[];
  sizeConversions?: SizeConversion[];
}

export interface InventoryMovementItem {
  id: string;
  variantId: string;
  variantSize?: string;
  variantColor?: string;
  variantSku?: string;
  type: string;
  quantity: number;
  stockAfter: number;
  location: string | null;
  reason: string | null;
  createdAt: string | Date;
}

