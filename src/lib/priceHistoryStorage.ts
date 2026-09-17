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
 * Verifica si un identificador de producto corresponde a un mock o dato de prueba inexistente en la BD
 */
function isMockProductId(productId: string): boolean {
  if (!productId) return true;
  return (
    /^p\d+$/i.test(productId) ||
    productId.startsWith("demo-") ||
    productId.startsWith("mock-") ||
    productId.startsWith("sample-")
  );
}

/**
 * Obtiene todos los lotes históricos de ajustes de precios guardados en el navegador
 */
export function getPriceHistoryBatches(): PriceHistoryBatch[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filtrar y remover registros de demostración hardcodeados o que contengan productos mock inexistentes
      const cleaned = parsed.filter((b: PriceHistoryBatch) => {
        if (!b || typeof b !== "object" || typeof b.id !== "string") return false;
        if (b.id.startsWith("batch-demo-")) return false;

        // Si el lote contiene productos mock (ej: "p1", "p2", etc.), eliminarlo
        if (Array.isArray(b.auditLog) && b.auditLog.length > 0) {
          const hasMock = b.auditLog.some((p) => isMockProductId(p.productId));
          if (hasMock) return false;
        }

        return true;
      });

      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    }
    return [];
  } catch (err) {
    console.warn("Error al leer historial de precios de localStorage:", err);
    return [];
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
 * Elimina un lote específico del historial de precios por su ID
 */
export function deletePriceHistoryBatch(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const updated = parsed.filter((b: PriceHistoryBatch) => b && b.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Error al eliminar lote del historial de precios:", err);
  }
}

/**
 * Limpia por completo el historial de precios en el navegador
 */
export function clearPriceHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error al limpiar historial de precios:", err);
  }
}

