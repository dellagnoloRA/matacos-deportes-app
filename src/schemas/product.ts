import { z } from "zod";

/**
 * Esquema de validación para Categorías
 */
export const CategorySchema = z.object({
  name: z.string().min(2, "El nombre de la categoría debe tener al menos 2 caracteres"),
  slug: z.string().min(2, "El slug es requerido").optional(),
});

/**
 * Esquema de validación para Marcas
 */
export const BrandSchema = z.object({
  name: z.string().min(2, "El nombre de la marca debe tener al menos 2 caracteres"),
});

/**
 * Esquema de validación para una Variante de Producto (Talle, Color, SKU, Barcode, Stock)
 */
export const ProductVariantSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1, "El talle es requerido (ej: 41, M, L, Único)"),
  color: z.string().min(1, "El color es requerido (ej: Negro, Azul, Multicolor)"),
  sku: z.string().min(3, "El SKU debe tener al menos 3 caracteres"),
  barcode: z.string().nullable().optional(),
  stockLocal: z
    .number({ invalid_type_error: "El stock local debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock local no puede ser negativo")
    .default(0),
  stockWeb: z
    .number({ invalid_type_error: "El stock web debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock web no puede ser negativo")
    .default(0),
  minStock: z
    .number({ invalid_type_error: "El stock mínimo debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "El stock mínimo no puede ser negativo")
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
  discipline: z.string().min(2, "La disciplina es requerida (ej: Natación, Vóley, Crocs)"),
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
export type CategoryInput = z.infer<typeof CategorySchema>;
export type BrandInput = z.infer<typeof BrandSchema>;
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
