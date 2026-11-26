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

export const AdminReviewTabSchema = z.enum([
  "ALL",
  "PENDING_REPORTED",
  "UNANSWERED",
  "HIDDEN",
]);

export const ProductIdSchema = z.string().trim().min(1, "El producto es obligatorio.");

export const ReviewIdSchema = z
  .string()
  .trim()
  .min(1, "Identificador de reseña inválido.");

export const StaffUserIdSchema = z
  .string()
  .trim()
  .min(1, "Sesión de usuario inválida.");

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

export type CreateOrUpdateReviewPayload = z.input<typeof CreateOrUpdateReviewSchema>;
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

export type GetProductReviewsQueryPayload = z.input<typeof GetProductReviewsQuerySchema>;
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

export type ReportReviewPayload = z.input<typeof ReportReviewSchema>;
export type ReportReviewInput = z.infer<typeof ReportReviewSchema>;

export const AdminReviewsFilterSchema = z.object({
  tab: AdminReviewTabSchema.optional().default("ALL"),
  productId: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  search: z
    .string()
    .trim()
    .max(120, "La búsqueda no puede superar los 120 caracteres.")
    .nullish()
    .transform((v) => (v && v.length > 0 ? v : null)),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(50).optional().default(20),
});

export type AdminReviewsFilterPayload = z.input<typeof AdminReviewsFilterSchema>;
export type AdminReviewsFilterInput = z.infer<typeof AdminReviewsFilterSchema>;

export const RespondToReviewSchema = z.object({
  reviewId: ReviewIdSchema,
  response: z
    .string()
    .trim()
    .min(5, "La respuesta oficial debe tener al menos 5 caracteres.")
    .max(1500, "La respuesta oficial no puede superar los 1500 caracteres."),
});

export type RespondToReviewPayload = z.input<typeof RespondToReviewSchema>;
export type RespondToReviewInput = z.infer<typeof RespondToReviewSchema>;

export const ModerateReviewSchema = z
  .object({
    reviewId: ReviewIdSchema,
    status: ReviewStatusSchema,
    reason: z
      .string()
      .trim()
      .max(400, "El motivo de moderación no puede superar los 400 caracteres.")
      .nullish()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .superRefine((data, ctx) => {
    if (data.status === "OCULTA" && (!data.reason || data.reason.length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message:
          "Indicá un motivo de moderación (mínimo 3 caracteres) para ocultar la reseña.",
      });
    }
  });

export type ModerateReviewPayload = z.input<typeof ModerateReviewSchema>;
export type ModerateReviewInput = z.infer<typeof ModerateReviewSchema>;
