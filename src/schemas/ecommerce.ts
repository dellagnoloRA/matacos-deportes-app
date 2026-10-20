import { z } from "zod";

/**
 * Criterios de ordenamiento para el catálogo público
 */
export const CatalogSortEnum = z.enum(
  ["price_asc", "price_desc", "newest", "name_asc"],
  {
    errorMap: () => ({ message: "Criterio de ordenamiento inválido" }),
  }
);
export type CatalogSort = z.infer<typeof CatalogSortEnum>;

/**
 * Esquema Zod de Validación para Filtros de Catálogo Público (RF-13)
 * Coacciona query params de URL a tipos nativos y valida coherencia comercial.
 */
export const CatalogFilterSchema = z
  .object({
    disciplineSlug: z.string().trim().optional(),
    categorySlug: z.string().trim().optional(),
    brandSlug: z.string().trim().optional(),
    size: z.string().trim().optional(),
    color: z.string().trim().optional(),
    minPrice: z
      .coerce
      .number({ invalid_type_error: "El precio mínimo debe ser un número" })
      .min(0, "El precio mínimo no puede ser negativo")
      .optional(),
    maxPrice: z
      .coerce
      .number({ invalid_type_error: "El precio máximo debe ser un número" })
      .min(0, "El precio máximo debe ser mayor a 0")
      .optional(),
    search: z.string().trim().optional(),
    sort: CatalogSortEnum.default("newest"),
    page: z
      .coerce
      .number({ invalid_type_error: "La página debe ser un número" })
      .int()
      .min(1, "La página mínima es 1")
      .default(1),
    limit: z
      .coerce
      .number({ invalid_type_error: "El límite debe ser un número" })
      .int()
      .min(1)
      .max(48, "El límite máximo por página es de 48 artículos")
      .default(12),
  })
  .refine(
    (data) => {
      if (
        data.minPrice !== undefined &&
        data.maxPrice !== undefined &&
        data.minPrice > data.maxPrice
      ) {
        return false;
      }
      return true;
    },
    {
      message: "El precio mínimo no puede ser mayor al precio máximo",
      path: ["minPrice"],
    }
  );

export type CatalogFilterInput = z.input<typeof CatalogFilterSchema>;
export type CatalogFilterOutput = z.output<typeof CatalogFilterSchema>;

/**
 * Esquema de consulta rápida predictiva
 */
export const PredictiveSearchSchema = z.object({
  query: z.string().trim().min(2, "La búsqueda debe tener al menos 2 caracteres"),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export type PredictiveSearchInput = z.infer<typeof PredictiveSearchSchema>;

/**
 * Esquema de validación para verificación atómica de stock de variante (RF-14)
 */
export const CheckVariantStockSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
});
export type CheckVariantStockInput = z.infer<typeof CheckVariantStockSchema>;

/**
 * Esquema de validación para productos relacionados (RF-14)
 */
export const RelatedProductsSchema = z.object({
  productId: z.string().uuid("ID de producto inválido"),
  limit: z.coerce.number().int().min(1).max(12).default(4),
});
export type RelatedProductsInput = z.infer<typeof RelatedProductsSchema>;

