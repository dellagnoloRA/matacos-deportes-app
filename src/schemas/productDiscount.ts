import { z } from "zod";

/**
 * Esquema de validación para Descuento Promocional Individual (RF-27)
 */
export const ProductDiscountSchema = z
  .object({
    productId: z.string().uuid("ID de producto inválido").optional(),
    discountPercentage: z
      .number({
        required_error: "El porcentaje de descuento es obligatorio",
        invalid_type_error: "El porcentaje de descuento debe ser un número",
      })
      .min(1, "El porcentaje de descuento mínimo es 1%")
      .max(90, "El porcentaje de descuento no puede superar el 90%")
      .transform((val) => Math.round(val * 100) / 100),
    discountStartDate: z
      .union([z.string().datetime({ offset: true }), z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    discountEndDate: z
      .union([z.string().datetime({ offset: true }), z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    discountActive: z.boolean().default(true),
    allowBelowCost: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.discountStartDate && data.discountEndDate) {
        return data.discountStartDate.getTime() <= data.discountEndDate.getTime();
      }
      return true;
    },
    {
      message: "La fecha de inicio de la promoción no puede ser posterior a la fecha de fin",
      path: ["discountEndDate"],
    }
  );

export type ProductDiscountInput = z.infer<typeof ProductDiscountSchema>;

/**
 * Esquema de validación para Descuento Masivo por Rubro o Disciplina (RF-27)
 */
export const CategoryDiscountSchema = z
  .object({
    categoryId: z.string().uuid("ID de categoría inválido").optional().nullable(),
    disciplineId: z.string().uuid("ID de disciplina inválido").optional().nullable(),
    discountPercentage: z
      .number({
        required_error: "El porcentaje de descuento es obligatorio",
        invalid_type_error: "El porcentaje de descuento debe ser un número",
      })
      .min(1, "El porcentaje de descuento mínimo es 1%")
      .max(90, "El porcentaje de descuento no puede superar el 90%")
      .transform((val) => Math.round(val * 100) / 100),
    discountStartDate: z
      .union([z.string().datetime({ offset: true }), z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    discountEndDate: z
      .union([z.string().datetime({ offset: true }), z.string(), z.date()])
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    allowBelowCost: z.boolean().default(false),
  })
  .refine(
    (data) => Boolean(data.categoryId || data.disciplineId),
    {
      message: "Debe especificar al menos una Categoría o una Disciplina deportiva",
      path: ["categoryId"],
    }
  )
  .refine(
    (data) => {
      if (data.discountStartDate && data.discountEndDate) {
        return data.discountStartDate.getTime() <= data.discountEndDate.getTime();
      }
      return true;
    },
    {
      message: "La fecha de inicio de la promoción no puede ser posterior a la fecha de fin",
      path: ["discountEndDate"],
    }
  );

export type CategoryDiscountInput = z.infer<typeof CategoryDiscountSchema>;

/**
 * Esquema de validación para Reversión Masiva de Ofertas
 */
export const RemoveCategoryDiscountSchema = z
  .object({
    categoryId: z.string().uuid("ID de categoría inválido").optional().nullable(),
    disciplineId: z.string().uuid("ID de disciplina inválido").optional().nullable(),
  })
  .refine(
    (data) => Boolean(data.categoryId || data.disciplineId),
    {
      message: "Debe especificar al menos una Categoría o una Disciplina para revertir ofertas",
      path: ["categoryId"],
    }
  );

export type RemoveCategoryDiscountInput = z.infer<typeof RemoveCategoryDiscountSchema>;
