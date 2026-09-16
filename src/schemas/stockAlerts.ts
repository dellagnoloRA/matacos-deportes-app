import { z } from "zod";

export const StockAlertLevelEnum = z.enum([
  "OUT_OF_STOCK",                  // Stock total = 0 (Totalmente agotado)
  "CRITICAL_LOW",                  // Stock total <= minStock (Alerta de compra a proveedor)
  "STORE_EMPTY_WAREHOUSE_AVAIL",   // Salón = 0 pero hay en depósito (Reposición urgente a mostrador)
  "STORE_REPLENISHMENT",           // Salón <= minStoreStock y hay en depósito (Reposición preventiva)
  "NORMAL",                        // Stock óptimo
]);

export const StockAlertFilterEnum = z.enum([
  "ALL",                           // Todas las variantes en cualquier nivel de alerta
  "OUT_OF_STOCK",                  // Solo productos/variantes con stock total = 0
  "CRITICAL_LOW",                  // Solo productos/variantes con stock total <= minStock
  "STORE_REPLENISHMENT",           // Solo variantes que requieran reposición interna a salón
]);

/**
 * Filtros dinámicos para la consulta de alertas de stock
 */
export const StockAlertsQuerySchema = z.object({
  filter: StockAlertFilterEnum.default("ALL"),
  categoryId: z.string().uuid("ID de categoría inválido").optional(),
  brandId: z.string().uuid("ID de marca inválido").optional(),
  disciplineId: z.string().uuid("ID de disciplina inválido").optional(),
  search: z.string().optional(),
});

/**
 * Esquema para configurar masiva o individualmente los umbrales de stock mínimo
 */
export const ConfigureStockThresholdSchema = z.object({
  scope: z.enum(["CATEGORY", "PRODUCT", "VARIANT"], {
    errorMap: () => ({ message: "El alcance debe ser CATEGORY, PRODUCT o VARIANT" }),
  }),
  targetId: z.string().uuid("ID del objetivo inválido"),
  minStock: z
    .number({ invalid_type_error: "El stock mínimo debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock mínimo no puede ser negativo")
    .optional(),
  minStoreStock: z
    .number({ invalid_type_error: "El stock mínimo de salón debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock mínimo de salón no puede ser negativo")
    .optional(),
}).refine(
  (data) => data.minStock !== undefined || data.minStoreStock !== undefined,
  {
    message: "Debe proveer al menos minStock o minStoreStock para actualizar",
  }
);

export type StockAlertLevel = z.infer<typeof StockAlertLevelEnum>;
export type StockAlertFilter = z.infer<typeof StockAlertFilterEnum>;
export type StockAlertsQueryInput = z.infer<typeof StockAlertsQuerySchema>;
export type ConfigureStockThresholdInput = z.infer<typeof ConfigureStockThresholdSchema>;

/**
 * Detalle individual de una variante en alerta
 */
export interface VariantStockAlertDetail {
  variantId: string;
  sku: string;
  size: string;
  color: string;
  barcode: string | null;
  stockStore: number;
  stockWarehouse: number;
  stockTotal: number;
  minStock: number;
  minStoreStock: number;
  alertLevel: StockAlertLevel;
  actionRequired: string; // Mensaje operativo humano para mostrador o compras
}

/**
 * Producto consolidado con sus variantes en alerta
 */
export interface ConsolidatedProductAlert {
  productId: string;
  productName: string;
  category: string;
  brand: string;
  discipline: string;
  totalStoreStock: number;
  totalWarehouseStock: number;
  totalStock: number;
  highestAlert: StockAlertLevel;
  totalVariantsCount: number;
  outOfStockVariantsCount: number;
  criticalLowVariantsCount: number;
  replenishmentVariantsCount: number;
  affectedVariants: VariantStockAlertDetail[];
}

/**
 * Respuesta consolidada del endpoint/acción de alertas
 */
export interface ConsolidatedStockAlertsResponse {
  success: boolean;
  timestamp: string;
  summary: {
    totalProductsInAlert: number;
    totalVariantsInAlert: number;
    outOfStockCount: number;
    criticalLowCount: number;
    storeReplenishmentCount: number;
  };
  products: ConsolidatedProductAlert[];
}
