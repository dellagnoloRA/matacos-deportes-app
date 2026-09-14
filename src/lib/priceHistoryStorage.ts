import {
  ProductPriceChangeRecord,
  TargetPriceField,
  RoundingPolicy,
} from "@/schemas/priceUpdate";

export interface PriceHistoryBatch {
  id: string;
  timestamp: string;
  formattedDate: string;
  percentage: number;
  targetField: TargetPriceField;
  roundingPolicy: RoundingPolicy;
  scopeType: "ALL" | "DISCIPLINE" | "BRAND" | "SELECTED";
  scopeLabel: string;
  disciplineName?: string;
  brandName?: string;
  reason?: string;
  summary: {
    matchedProductsCount: number;
    updatedProductsCount: number;
    updatedVariantsCount: number;
    totalOldPriceSum: number;
    totalNewPriceSum: number;
    totalDeltaSum: number;
  };
  auditLog: ProductPriceChangeRecord[];
}

const STORAGE_KEY = "matacos_price_history_batches_v1";

/**
 * Registros iniciales realistas para demostración y consulta inmediata en el mostrador
 */
const INITIAL_SAMPLE_BATCHES: PriceHistoryBatch[] = [
  {
    id: "batch-demo-3",
    timestamp: "2026-09-14T09:20:00.000Z",
    formattedDate: "14 Sep 2026 • 09:20 hs",
    percentage: 15,
    targetField: "PRICE",
    roundingPolicy: "NEAREST_50",
    scopeType: "BRAND",
    scopeLabel: "Marca: Arena",
    brandName: "Arena",
    disciplineName: "Natación",
    reason: "Aumento oficial lista Arena Primavera 2026",
    summary: {
      matchedProductsCount: 3,
      updatedProductsCount: 3,
      updatedVariantsCount: 8,
      totalOldPriceSum: 168000,
      totalNewPriceSum: 193200,
      totalDeltaSum: 25200,
    },
    auditLog: [
      {
        productId: "p1",
        productName: "Antiparras Cobra Ultra Mirror",
        sku: "NAT-ARE-001",
        category: "Accesorios Natación",
        brand: "Arena",
        discipline: "Natación",
        oldCostPrice: 42000,
        newCostPrice: 42000,
        oldPrice: 68000,
        newPrice: 78200,
        priceDelta: 10200,
        effectivePercentage: 15,
        variantsUpdatedCount: 5,
      },
      {
        productId: "p5",
        productName: "Gorro Silicona Classic Arena",
        sku: "NAT-ARE-005",
        category: "Gorros Natación",
        brand: "Arena",
        discipline: "Natación",
        oldCostPrice: 12000,
        newCostPrice: 12000,
        oldPrice: 18000,
        newPrice: 20700,
        priceDelta: 2700,
        effectivePercentage: 15,
        variantsUpdatedCount: 2,
      },
      {
        productId: "p6",
        productName: "Malla Fastskin Natación Arena Pro",
        sku: "NAT-ARE-006",
        category: "Mallas de Competición",
        brand: "Arena",
        discipline: "Natación",
        oldCostPrice: 52000,
        newCostPrice: 52000,
        oldPrice: 82000,
        newPrice: 94300,
        priceDelta: 12300,
        effectivePercentage: 15,
        variantsUpdatedCount: 1,
      },
    ],
  },
  {
    id: "batch-demo-2",
    timestamp: "2026-09-08T15:45:00.000Z",
    formattedDate: "08 Sep 2026 • 15:45 hs",
    percentage: 12.5,
    targetField: "BOTH",
    roundingPolicy: "NEAREST_100",
    scopeType: "DISCIPLINE",
    scopeLabel: "Disciplina: Vóley",
    disciplineName: "Vóley",
    reason: "Ajuste bimestral insumos vóley e importación",
    summary: {
      matchedProductsCount: 2,
      updatedProductsCount: 2,
      updatedVariantsCount: 6,
      totalOldPriceSum: 265000,
      totalNewPriceSum: 298100,
      totalDeltaSum: 33100,
    },
    auditLog: [
      {
        productId: "p2",
        productName: "Pelota Vóley V200W Oficial FIVB",
        sku: "VOL-MIK-200",
        category: "Balones",
        brand: "Mikasa",
        discipline: "Vóley",
        oldCostPrice: 98000,
        newCostPrice: 110300,
        oldPrice: 145000,
        newPrice: 163100,
        priceDelta: 18100,
        effectivePercentage: 12.48,
        variantsUpdatedCount: 1,
      },
      {
        productId: "p3",
        productName: "Zapatillas Gel-Rocket 11 Indoor",
        sku: "CAL-ASI-011",
        category: "Calzado",
        brand: "Asics",
        discipline: "Vóley",
        oldCostPrice: 78000,
        newCostPrice: 87800,
        oldPrice: 120000,
        newPrice: 135000,
        priceDelta: 15000,
        effectivePercentage: 12.5,
        variantsUpdatedCount: 5,
      },
    ],
  },
  {
    id: "batch-demo-1",
    timestamp: "2026-09-01T10:00:00.000Z",
    formattedDate: "01 Sep 2026 • 10:00 hs",
    percentage: 8,
    targetField: "PRICE",
    roundingPolicy: "PSYCHOLOGICAL_90",
    scopeType: "ALL",
    scopeLabel: "Todo el Catálogo Activo",
    reason: "Ajuste inflacionario general mensual",
    summary: {
      matchedProductsCount: 4,
      updatedProductsCount: 4,
      updatedVariantsCount: 16,
      totalOldPriceSum: 391000,
      totalNewPriceSum: 422260,
      totalDeltaSum: 31260,
    },
    auditLog: [
      {
        productId: "p1",
        productName: "Antiparras Cobra Ultra Mirror",
        sku: "NAT-ARE-001",
        category: "Accesorios Natación",
        brand: "Arena",
        discipline: "Natación",
        oldCostPrice: 42000,
        newCostPrice: 42000,
        oldPrice: 63000,
        newPrice: 67990,
        priceDelta: 4990,
        effectivePercentage: 7.92,
        variantsUpdatedCount: 5,
      },
      {
        productId: "p4",
        productName: "Crocs Classic Clog Unisex",
        sku: "CRC-BLK-041",
        category: "Calzado Urbano",
        brand: "Crocs",
        discipline: "Crocs / Urbano",
        oldCostPrice: 34000,
        newCostPrice: 34000,
        oldPrice: 53700,
        newPrice: 57990,
        priceDelta: 4290,
        effectivePercentage: 7.99,
        variantsUpdatedCount: 10,
      },
    ],
  },
];

/**
 * Obtiene todos los lotes históricos de ajustes de precios guardados en el navegador
 */
export function getPriceHistoryBatches(): PriceHistoryBatch[] {
  if (typeof window === "undefined") {
    return INITIAL_SAMPLE_BATCHES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Inicializar con las muestras demo para tener datos inmediatos
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_BATCHES));
      return INITIAL_SAMPLE_BATCHES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_SAMPLE_BATCHES;
  } catch (err) {
    console.warn("Error al leer historial de precios de localStorage:", err);
    return INITIAL_SAMPLE_BATCHES;
  }
}

/**
 * Guarda un nuevo lote de ajuste de precios al inicio del historial
 */
export function savePriceHistoryBatch(batch: PriceHistoryBatch): void {
  if (typeof window === "undefined") return;

  try {
    const current = getPriceHistoryBatches();
    const updated = [batch, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error al guardar lote en historial de precios:", err);
  }
}

/**
 * Limpia el historial de precios en el navegador
 */
export function clearPriceHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error al limpiar historial de precios:", err);
  }
}

