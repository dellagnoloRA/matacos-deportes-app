import { z } from "zod";

export const ReviewStatusSchema = z.enum(["PUBLICADA", "OCULTA", "EN_REVISION"]);

export const FitFeedbackSchema = z.enum(["CHICO", "EXACTO", "HOLGADO"]);

export const ReviewReportReasonSchema = z.enum([
  "SPAM",
  "LENGUAJE_INAPROPIADO",
  "INFORMACION_FALSA",
  "DATOS_PERSONALES",
  "OTRO",
]);

export const ReviewSortSchema = z.enum(["recent", "rating_high", "rating_low"]);

export const ProductIdSchema = z.string().trim().min(1, "El producto es obligatorio.");

export const ReviewIdSchema = z
  .string()
  .trim()
  .min(1, "Identificador de reseña inválido.");

export const CreateOrUpdateReviewSchema = z.object({
  productId: ProductIdSchema,
  rating: z
    .number()
    .int("La calificación debe ser un número entero.")
    .min(1, "La calificación mínima es 1 estrella.")
    .max(5, "La calificación máxima es 5 estrellas."),
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres.")
    .max(120, "El título no puede superar los 120 caracteres."),
  comment: z
    .string()
    .trim()
    .min(10, "Contanos un poco más en tu reseña (mínimo 10 caracteres).")
    .max(1500, "El comentario no puede superar los 1500 caracteres."),
  purchasedSize: z
    .string()
    .trim()
    .max(30, "El talle no puede superar los 30 caracteres.")
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  fitFeedback: FitFeedbackSchema.nullish().transform((v) => v ?? null),
});

export type CreateOrUpdateReviewInput = z.infer<typeof CreateOrUpdateReviewSchema>;

export const GetProductReviewsQuerySchema = z.object({
  productId: ProductIdSchema,
  starFilter: z
    .number()
    .int()
    .min(1)
    .max(5)
    .nullish()
    .transform((v) => v ?? null),
  onlyVerified: z.boolean().optional().default(false),
  sort: ReviewSortSchema.optional().default("recent"),
});

export type GetProductReviewsQueryInput = z.infer<typeof GetProductReviewsQuerySchema>;

export const ReportReviewSchema = z.object({
  reviewId: ReviewIdSchema,
  reason: ReviewReportReasonSchema,
  comment: z
    .string()
    .trim()
    .max(400, "El detalle del reporte no puede superar los 400 caracteres.")
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ReportReviewInput = z.infer<typeof ReportReviewSchema>;
