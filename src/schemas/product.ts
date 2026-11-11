import { z } from "zod";

/**
 * Clasificación por Género de Producto
 */
export const GenderEnum = z.enum(["HOMBRE", "MUJER", "NINO", "UNISEX"], {
  errorMap: () => ({ message: "El género debe ser HOMBRE, MUJER, NINO o UNISEX" }),
});
export type GenderType = z.infer<typeof GenderEnum>;

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
 * Esquema de validación para una Imagen de Producto (asociada opcionalmente a un Color)
 */
export const ProductImageSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().min(1, "La URL de la imagen es requerida"),
  color: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false),
  order: z.number().int().default(0),
});

/**
 * Esquema para CREAR un Producto completo con sus variantes e imágenes
 */
export const CreateProductSchema = z.object({
  name: z.string().min(3, "El nombre del producto debe tener al menos 3 caracteres"),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  modelCode: z.string().nullable().optional(),
  disciplineId: z.string().uuid("Debe seleccionar una disciplina válida"),
  costPrice: z
    .union([
      z
        .number({ invalid_type_error: "El precio de costo debe ser un número" })
        .min(0, "El precio de costo no puede ser negativo"),
      z.literal("").transform(() => null),
      z.null(),
      z.undefined(),
    ])
    .nullable()
    .optional(),
  price: z
    .number({ invalid_type_error: "El precio de venta debe ser un número" })
    .min(0, "El precio de venta no puede ser negativo"),
  categoryId: z.string().uuid("Debe seleccionar una categoría válida"),
  brandId: z.string().uuid("Debe seleccionar una marca válida"),
  gender: GenderEnum.optional().default("UNISEX"),
  active: z.boolean().default(true),
  webVisible: z.boolean().optional(),
  status: z.enum(["PUBLISHED", "HIDDEN", "DRAFT", "SCHEDULED"]).optional(),
  variants: z
    .array(ProductVariantSchema)
    .min(1, "El producto debe tener al menos una variante de talle/color"),
  images: z.array(ProductImageSchema).optional(),
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
export type ProductImageInput = z.infer<typeof ProductImageSchema>;
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
export type CreateProductInput = z.input<typeof CreateProductSchema>;
export type UpdateProductInput = z.input<typeof UpdateProductSchema>;

/**
 * Esquema para Carga Rápida de Emergencia desde POS / Preventa
 */
export const CreateQuickPosProductSchema = z.object({
  name: z.string().min(2, "El nombre del producto debe tener al menos 2 caracteres"),
  price: z.number().positive("El precio de venta debe ser mayor a 0"),
  costPrice: z.number().nullable().optional(),
  size: z.string().min(1, "El talle es obligatorio"),
  color: z.string().optional().default("Único"),
  barcode: z.string().nullable().optional(),
  disciplineName: z.string().optional().default("Multideporte"),
  categoryName: z.string().optional().default("General"),
  brandName: z.string().optional().default("Genérica"),
  gender: GenderEnum.optional().default("UNISEX"),
  initialStock: z.number().int().min(1).default(1),
});

export type CreateQuickPosProductInput = z.input<typeof CreateQuickPosProductSchema>;

// Re-exportar esquemas y tipos de actualización porcentual de precios
export * from "./priceUpdate";
