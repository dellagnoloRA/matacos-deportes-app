import { z } from "zod";

/**
 * Valida que una cadena sea una URL absoluta segura (http/https)
 * o una ruta interna de la aplicación que comience con "/" (ej. "/uploads/banners/..." o "/catalogo").
 */
function isValidMediaOrRouteUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    // Evitar protocol-relative URLs maliciosas como "//evil.com"
    return !trimmed.startsWith("//");
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normaliza cadenas opcionales: convierte "" o espacios en blanco a `null`,
 * preservando `undefined` para actualizaciones parciales.
 */
const optionalNullableText = (maxLength: number, maxErrorMessage: string) =>
  z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      if (typeof val === "string" && val.trim() === "") return null;
      return val;
    },
    z.string().trim().max(maxLength, maxErrorMessage).nullable().optional()
  );

/**
 * Normaliza URLs/rutas opcionales: convierte "" a `null`, preservando `undefined`.
 */
const optionalNullableUrl = (invalidMessage: string) =>
  z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      if (typeof val === "string" && val.trim() === "") return null;
      return val;
    },
    z
      .string()
      .trim()
      .refine(isValidMediaOrRouteUrl, { message: invalidMessage })
      .nullable()
      .optional()
  );

/**
 * Normaliza fechas opcionales:
 * - `undefined` se preserva como `undefined`
 * - `null` o `""` se convierte en `null` (sin fecha límite)
 * - `Date` o string ISO se convierte en instancia `Date` validada
 */
const optionalNullableDate = (invalidMessage: string) =>
  z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      if (typeof val === "string" && val.trim() === "") return null;
      if (val instanceof Date) return val;
      if (typeof val === "string" || typeof val === "number") {
        return new Date(val);
      }
      return val;
    },
    z
      .date({
        invalid_type_error: invalidMessage,
      })
      .refine((date) => !Number.isNaN(date.getTime()), {
        message: invalidMessage,
      })
      .nullable()
      .optional()
  );

const BaseBannerFields = {
  title: z
    .string({ required_error: "El título del banner es obligatorio" })
    .trim()
    .min(1, "El título del banner es obligatorio")
    .max(150, "El título no puede superar los 150 caracteres"),
  subtitle: optionalNullableText(
    300,
    "El subtítulo no puede superar los 300 caracteres"
  ),
  imageUrl: z
    .string({ required_error: "La imagen principal del banner es obligatoria" })
    .trim()
    .min(1, "La imagen principal del banner es obligatoria")
    .refine(isValidMediaOrRouteUrl, {
      message:
        "La URL de la imagen principal debe ser una URL válida (http/https) o una ruta local (/uploads/...)",
    }),
  mobileUrl: optionalNullableUrl(
    "La URL de la imagen móvil debe ser una URL válida (http/https) o una ruta local (/uploads/...)"
  ),
  linkUrl: optionalNullableUrl(
    "El enlace de destino debe ser una URL válida (http/https) o una ruta interna (/...)"
  ),
  order: z.coerce
    .number({ invalid_type_error: "El orden debe ser un número" })
    .int("El orden debe ser un número entero")
    .min(0, "El orden no puede ser negativo")
    .default(0),
  active: z.boolean().default(true),
  startDate: optionalNullableDate("La fecha de inicio de vigencia no es válida"),
  endDate: optionalNullableDate("La fecha de fin de vigencia no es válida"),
};

/**
 * Esquema de validación para crear un nuevo Banner promocional (RF-26)
 */
export const CreateBannerSchema = z
  .object(BaseBannerFields)
  .superRefine((data, ctx) => {
    if (
      data.startDate instanceof Date &&
      data.endDate instanceof Date &&
      data.endDate.getTime() < data.startDate.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La fecha de fin de vigencia debe ser posterior o igual a la fecha de inicio",
        path: ["endDate"],
      });
    }
  });

export type CreateBannerInput = z.input<typeof CreateBannerSchema>;
export type CreateBannerOutput = z.output<typeof CreateBannerSchema>;

/**
 * Esquema de validación para actualizar un Banner existente (RF-26)
 */
export const UpdateBannerSchema = z
  .object({
    id: z
      .string({ required_error: "El identificador del banner es obligatorio" })
      .trim()
      .uuid("El identificador del banner debe ser un UUID válido"),
    title: BaseBannerFields.title.optional(),
    subtitle: BaseBannerFields.subtitle,
    imageUrl: BaseBannerFields.imageUrl.optional(),
    mobileUrl: BaseBannerFields.mobileUrl,
    linkUrl: BaseBannerFields.linkUrl,
    order: z.coerce
      .number({ invalid_type_error: "El orden debe ser un número" })
      .int("El orden debe ser un número entero")
      .min(0, "El orden no puede ser negativo")
      .optional(),
    active: z.boolean().optional(),
    startDate: BaseBannerFields.startDate,
    endDate: BaseBannerFields.endDate,
  })
  .superRefine((data, ctx) => {
    if (
      data.startDate instanceof Date &&
      data.endDate instanceof Date &&
      data.endDate.getTime() < data.startDate.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La fecha de fin de vigencia debe ser posterior o igual a la fecha de inicio",
        path: ["endDate"],
      });
    }
  });

export type UpdateBannerInput = z.input<typeof UpdateBannerSchema>;
export type UpdateBannerOutput = z.output<typeof UpdateBannerSchema>;

/**
 * Esquema individual de posición para reordenamiento de Banners (RF-26)
 */
export const BannerOrderItemSchema = z.object({
  id: z
    .string({ required_error: "El identificador del banner es obligatorio" })
    .trim()
    .uuid("Cada banner debe tener un identificador UUID válido"),
  order: z
    .number({
      required_error: "La posición de orden es obligatoria",
      invalid_type_error: "La posición de orden debe ser numérica",
    })
    .int("La posición de orden debe ser un número entero")
    .min(0, "La posición de orden no puede ser negativa"),
});

export type BannerOrderItem = z.infer<typeof BannerOrderItemSchema>;

/**
 * Esquema de validación para reordenar múltiples Banners atómicamente (RF-26)
 */
export const ReorderBannersSchema = z
  .array(BannerOrderItemSchema)
  .min(1, "Debe proporcionar al menos un banner para reordenar")
  .superRefine((items, ctx) => {
    const seenIds = new Set<string>();
    items.forEach((item, index) => {
      if (seenIds.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El banner con ID "${item.id}" está duplicado en la solicitud de reordenamiento`,
          path: [index, "id"],
        });
      }
      seenIds.add(item.id);
    });
  });

export type ReorderBannersInput = z.infer<typeof ReorderBannersSchema>;
