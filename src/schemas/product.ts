import { z } from "zod";

/**
 * Esquema de validación para Disciplinas
 */
export const DisciplineSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "El nombre de la disciplina debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug es requerido").optional(),
});

/**
 * Esquema de validación para Categorías
 */
export const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "El nombre de la categoría debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug es requerido").optional(),
});

/**
 * Esquema de validación para Marcas
 */
export const BrandSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "El nombre de la marca debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug es requerido").optional(),
});

/**
 * Esquema de validación para una Variante de Producto con stock dual
 */
export const ProductVariantSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1, "El talle es requerido (ej: 41, M, L, Único, 2kg)"),
  color: z.string().min(1, "El color es requerido (ej: Negro, Azul, Multicolor)"),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres"),
  barcode: z.string().nullable().optional(),
  stockStore: z
    .number({ invalid_type_error: "El stock en salón debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock en salón no puede ser negativo")
    .default(0),
  stockWarehouse: z
    .number({ invalid_type_error: "El stock en depósito debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock en depósito no puede ser negativo")
    .default(0),
  minStoreStock: z
    .number({ invalid_type_error: "El stock mínimo en salón debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock mínimo en salón no puede ser negativo")
    .default(1),
  minStock: z
    .number({ invalid_type_error: "El stock mínimo total debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock mínimo total no puede ser negativo")
    .default(2),
  price: z
    .number({ invalid_type_error: "El precio de la variante debe ser un número" })
    .positive("El precio debe ser un número positivo")
    .nullable()
    .optional(),
});

/**
 * Esquema para CREAR un Producto completo con sus variantes
 */
export const CreateProductSchema = z.object({
  name: z.string().min(3, "El nombre del producto debe tener al menos 3 caracteres"),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  disciplineId: z.string().uuid("Debe seleccionar una disciplina válida"),
  costPrice: z
    .number({ invalid_type_error: "El precio de costo debe ser un número" })
    .min(0, "El precio de costo no puede ser negativo"),
  price: z
    .number({ invalid_type_error: "El precio de venta debe ser un número" })
    .min(0, "El precio de venta no puede ser negativo"),
  categoryId: z.string().uuid("Debe seleccionar una categoría válida"),
  brandId: z.string().uuid("Debe seleccionar una marca válida"),
  active: z.boolean().default(true),
  variants: z
    .array(ProductVariantSchema)
    .min(1, "El producto debe tener al menos una variante de talle/color"),
});

/**
 * Esquema para ACTUALIZAR un Producto
 */
export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().uuid("ID de producto inválido"),
});

/**
 * Tipos TypeScript inferidos automáticamente desde Zod
 */
export type DisciplineInput = z.infer<typeof DisciplineSchema>;
export type CategoryInput = z.infer<typeof CategorySchema>;
export type BrandInput = z.infer<typeof BrandSchema>;
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

// Re-exportar esquemas y tipos de actualización porcentual de precios
export * from "./priceUpdate";
