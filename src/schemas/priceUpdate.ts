import { z } from "zod";

export const RoundingPolicyEnum = z.enum([
  "NONE",
  "INTEGER",
  "NEAREST_10",
  "NEAREST_50",
  "NEAREST_100",
  "UP_10",
  "UP_50",
  "UP_100",
  "PSYCHOLOGICAL_90",
]);

export const TargetPriceFieldEnum = z.enum(["PRICE", "COST_PRICE", "BOTH"]);

/**
 * Filtros dinámicos para seleccionar el universo de productos a actualizar
 */
export const PriceUpdateFiltersSchema = z.object({
  productIds: z.array(z.string().uuid("ID de producto inválido")).optional(),
  categoryId: z.string().uuid("ID de categoría inválido").optional(),
  brandId: z.string().uuid("ID de marca inválido").optional(),
  disciplineId: z.string().uuid("ID de disciplina inválido").optional(),
  search: z.string().optional(),
  activeOnly: z.boolean().default(true),
});

/**
 * Esquema de validación para la actualización porcentual de precios
 */
export const BatchPriceUpdateSchema = z.object({
  percentage: z
    .number({ invalid_type_error: "El porcentaje debe ser un número" })
    .min(-99, "El porcentaje de descuento no puede ser menor a -99%")
    .max(1000, "El porcentaje de aumento no puede superar 1000%"),
  targetField: TargetPriceFieldEnum.default("PRICE"),
  roundingPolicy: RoundingPolicyEnum.default("NEAREST_10"),
  updateVariantPrices: z
    .boolean()
    .default(true)
    .describe("Si es true, actualiza también los precios específicos de las variantes que tengan precio propio"),
  filters: PriceUpdateFiltersSchema.optional(),
  reason: z
    .string()
    .min(3, "El motivo de la modificación debe tener al menos 3 caracteres (ej: 'Aumento Topper Sep 2026')")
    .optional(),
});

export type RoundingPolicy = z.infer<typeof RoundingPolicyEnum>;
export type TargetPriceField = z.infer<typeof TargetPriceFieldEnum>;
export type PriceUpdateFilters = z.infer<typeof PriceUpdateFiltersSchema>;
export type BatchPriceUpdateInput = z.infer<typeof BatchPriceUpdateSchema>;

/**
 * Detalle individual de la modificación de precio por producto para auditoría
 */
export interface ProductPriceChangeRecord {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  brand: string;
  discipline: string;
  oldCostPrice: number;
  newCostPrice: number;
  oldPrice: number;
  newPrice: number;
  priceDelta: number;
  effectivePercentage: number;
  variantsUpdatedCount: number;
}

/**
 * Resumen consolidado del resultado de la actualización de precios
 */
export interface BatchPriceUpdateResult {
  success: boolean;
  message: string;
  error?: string;
  timestamp: string;
  reason?: string;
  appliedSettings: {
    percentage: number;
    targetField: TargetPriceField;
    roundingPolicy: RoundingPolicy;
    updateVariantPrices: boolean;
  };
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
