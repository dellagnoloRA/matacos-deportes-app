import { z } from "zod";

/**
 * Modos de ingestión para la carga masiva
 */
export const BulkImportModeEnum = z.enum([
  "CREATE_ONLY",      // Rechaza si el producto/variante ya existe
  "ACCUMULATE_STOCK", // Suma el stock ingresado al stock existente (default para reposiciones)
  "OVERWRITE",        // Sobreescribe precios y actualiza datos
]);

export type BulkImportMode = z.infer<typeof BulkImportModeEnum>;

/**
 * Esquema de validación para una Variante individual dentro del lote
 */
export const BulkVariantItemSchema = z.object({
  size: z.string().min(1, "El talle es requerido (ej: 41, M, L, Único, 2kg)"),
  color: z.string().min(1, "El color es requerido (ej: Negro, Azul, Multicolor)"),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  stockStore: z
    .number({ invalid_type_error: "El stock en salón debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock en salón no puede ser negativo")
    .optional()
    .default(0),
  stockWarehouse: z
    .number({ invalid_type_error: "El stock en depósito debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock en depósito no puede ser negativo")
    .optional()
    .default(0),
  minStoreStock: z
    .number({ invalid_type_error: "El stock mínimo en salón debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock mínimo en salón no puede ser negativo")
    .optional()
    .default(1),
  minStock: z
    .number({ invalid_type_error: "El stock mínimo total debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock mínimo total no puede ser negativo")
    .optional()
    .default(2),
  price: z
    .number({ invalid_type_error: "El precio de la variante debe ser un número" })
    .positive("El precio debe ser positivo")
    .optional()
    .nullable(),
});

/**
 * Esquema de validación para un Producto con su array de Variantes dentro del lote
 */
export const BulkProductItemSchema = z.object({
  name: z.string().min(3, "El nombre del producto debe tener al menos 3 caracteres"),
  description: z.string().optional().nullable(),
  disciplineName: z.string().min(2, "La disciplina es requerida (ej: Natación, Vóley, Crocs, Fitness)"),
  brandName: z.string().min(2, "El nombre de la marca es requerido (ej: Speedo, Arena, Wilson)"),
  categoryName: z.string().min(2, "El nombre de la categoría es requerido (ej: Antiparras, Mallas, Pelotas)"),
  costPrice: z
    .number({ invalid_type_error: "El precio de costo debe ser un número" })
    .min(0, "El precio de costo no puede ser negativo"),
  price: z
    .number({ invalid_type_error: "El precio de venta debe ser un número" })
    .min(0, "El precio de venta no puede ser negativo"),
  variants: z
    .array(BulkVariantItemSchema)
    .min(1, "El producto debe tener al menos una variante de talle/color"),
});

/**
 * Esquema para el Payload completo de Ingestión Masiva (Bulk Import)
 */
export const BulkImportPayloadSchema = z.object({
  batchReference: z
    .string()
    .min(3, "Debe especificar una referencia o identificador para el lote (ej: 'Lote Inicial Calzado' o 'Factura Wilson #1234')"),
  mode: BulkImportModeEnum.default("ACCUMULATE_STOCK"),
  defaultTargetLocation: z.enum(["STORE", "WAREHOUSE"]).default("STORE"),
  items: z
    .array(BulkProductItemSchema)
    .min(1, "El lote debe contener al menos un producto para procesar"),
});

/**
 * Esquema para filas planas (estilo hoja de cálculo Excel/CSV) antes de ser agrupadas
 */
export const FlatImportRowSchema = z.object({
  discipline: z.string().min(2, "La disciplina es requerida"),
  category: z.string().min(2, "La categoría es requerida"),
  brand: z.string().min(2, "La marca es requerida"),
  productName: z.string().min(3, "El nombre del producto es requerido"),
  description: z.string().optional().nullable(),
  size: z.string().min(1, "El talle es requerido"),
  color: z.string().min(1, "El color es requerido"),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  stockStore: z.number().int().min(0).default(0),
  stockWarehouse: z.number().int().min(0).default(0),
  minStoreStock: z.number().int().min(0).default(1),
  minStock: z.number().int().min(0).default(2),
  costPrice: z.number().min(0, "El precio de costo no puede ser negativo"),
  price: z.number().min(0, "El precio de venta no puede ser negativo"),
});

/**
 * Interfaces TypeScript inferidas para el Backend (utilizando z.input para permitir omitir defaults)
 */
export type BulkVariantItemInput = z.input<typeof BulkVariantItemSchema>;
export type BulkProductItemInput = z.input<typeof BulkProductItemSchema>;
export type BulkImportPayloadInput = z.input<typeof BulkImportPayloadSchema>;
export type FlatImportRowInput = z.input<typeof FlatImportRowSchema>;

/**
 * Estructuras de respuesta para el reporte granular de importación
 */
export interface BulkImportError {
  index: number;
  productName: string;
  sku?: string;
  barcode?: string;
  field?: string;
  reason: string;
}

export interface BulkImportResult {
  success: boolean;
  batchReference: string;
  mode: BulkImportMode;
  summary: {
    totalProductsSubmitted: number;
    successfulProducts: number;
    failedProducts: number;
    createdProducts: number;
    updatedProducts: number;
    createdVariants: number;
    updatedVariants: number;
  };
  errors: BulkImportError[];
}
