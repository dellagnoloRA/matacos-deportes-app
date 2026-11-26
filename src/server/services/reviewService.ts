import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CreateOrUpdateReviewSchema,
  GetProductReviewsQuerySchema,
  ProductIdSchema,
  ReportReviewSchema,
  ReviewIdSchema,
} from "@/schemas/review";
import { analyzeReviewText } from "@/lib/profanityFilter";
import {
  STORE_PUBLIC_SIGNATURE,
  type FitFeedbackType,
  type ProductReviewAggregates,
  type ReviewStatusType,
  type ReviewReportReason,
  type PublicProductReviewsResponse,
  type PublicReviewItem,
  type ProductReviewsSummary,
  type CustomerReviewContext,
} from "@/types/reviews";

export const AUTO_REVIEW_REPORTS_THRESHOLD = 3;

export interface CustomerSessionActor {
  customerId: string;
  name: string;
  email: string;
}

export interface StoredReviewRecord {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  title: string;
  comment: string;
  purchasedSize: string | null;
  fitFeedback: FitFeedbackType | null;
  isVerifiedPurchase: boolean;
  saleId: string | null;
  status: ReviewStatusType;
  moderationReason: string | null;
  adminResponse: string | null;
  adminResponseAt: Date | null;
  adminResponderId: string | null;
  reportsCount: number;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredReviewWithAuthor extends StoredReviewRecord {
  customerName: string;
}

export interface UpsertReviewParams {
  productId: string;
  customerId: string;
  rating: number;
  title: string;
  comment: string;
  purchasedSize: string | null;
  fitFeedback: FitFeedbackType | null;
  isVerifiedPurchase: boolean;
  saleId: string | null;
  status: ReviewStatusType;
  moderationReason: string | null;
}

export type UpsertReviewOutcome =
  | {
      ok: true;
      review: StoredReviewRecord;
      aggregates: ProductReviewAggregates;
      wasUpdated: boolean;
    }
  | { ok: false; error: string };

export interface CreateReportParams {
  reviewId: string;
  reporterId: string | null;
  reason: ReviewReportReason;
  comment: string | null;
  autoReviewThreshold: number;
}

export type CreateReportOutcome =
  | {
      ok: true;
      productId: string;
      reportsCount: number;
      status: ReviewStatusType;
      movedToModeration: boolean;
      aggregates: ProductReviewAggregates;
    }
  | { ok: false; error: string };

export interface ReviewRepository {
  productExists(productId: string): Promise<boolean>;
  findVerifiedPurchase(
    customerId: string,
    productId: string
  ): Promise<{ saleId: string; purchasedSize: string | null } | null>;
  findCustomerReview(
    customerId: string,
    productId: string
  ): Promise<StoredReviewRecord | null>;
  upsertReviewAndRecalculate(params: UpsertReviewParams): Promise<UpsertReviewOutcome>;
  listPublishedReviewsForProduct(
    productId: string
  ): Promise<StoredReviewWithAuthor[]>;
  findReviewById(reviewId: string): Promise<StoredReviewRecord | null>;
  createReportAndUpdateReview(params: CreateReportParams): Promise<CreateReportOutcome>;
  incrementHelpfulVotes(
    reviewId: string
  ): Promise<{ productId: string; helpfulVotes: number } | null>;
}

export interface CreateOrUpdateReviewResult {
  success: boolean;
  data?: {
    reviewId: string;
    productId: string;
    status: ReviewStatusType;
    isVerifiedPurchase: boolean;
    purchasedSize: string | null;
    ratingAverage: number | null;
    reviewsCount: number;
    wasUpdated: boolean;
  };
  error?: string;
}

function mapPrismaReviewRow(row: {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  title: string;
  comment: string;
  purchasedSize: string | null;
  fitFeedback: FitFeedbackType | null;
  isVerifiedPurchase: boolean;
  saleId: string | null;
  status: ReviewStatusType;
  moderationReason: string | null;
  adminResponse: string | null;
  adminResponseAt: Date | null;
  adminResponderId: string | null;
  reportsCount: number;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}): StoredReviewRecord {
  return {
    id: row.id,
    productId: row.productId,
    customerId: row.customerId,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    purchasedSize: row.purchasedSize,
    fitFeedback: row.fitFeedback,
    isVerifiedPurchase: row.isVerifiedPurchase,
    saleId: row.saleId,
    status: row.status,
    moderationReason: row.moderationReason,
    adminResponse: row.adminResponse,
    adminResponseAt: row.adminResponseAt,
    adminResponderId: row.adminResponderId,
    reportsCount: row.reportsCount,
    helpfulVotes: row.helpfulVotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function buildReviewWriteFields(
  params: UpsertReviewParams,
  effectiveStatus: ReviewStatusType,
  effectiveReason: string | null
) {
  return {
    rating: params.rating,
    title: params.title,
    comment: params.comment,
    purchasedSize: params.purchasedSize,
    fitFeedback: params.fitFeedback,
    isVerifiedPurchase: params.isVerifiedPurchase,
    saleId: params.saleId,
    status: effectiveStatus,
    moderationReason: effectiveReason,
  };
}

export async function recalculateProductAggregatesTx(
  tx: Prisma.TransactionClient,
  productId: string
): Promise<ProductReviewAggregates> {
  // Bloquear fila del producto para serializar recálculo de agregados ante concurrencia
  await tx.$executeRaw`SELECT 1 FROM "Product" WHERE "id" = ${productId} FOR UPDATE`;

  const agg = await tx.productReview.aggregate({
    where: { productId, status: "PUBLICADA" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const reviewsCount = agg._count._all;
  const ratingAverage =
    reviewsCount > 0 && agg._avg.rating !== null
      ? Math.round(agg._avg.rating * 100) / 100
      : null;

  await tx.product.update({
    where: { id: productId },
    data: {
      ratingAverage,
      reviewsCount,
    },
  });

  return { ratingAverage, reviewsCount };
}

export const prismaReviewRepository: ReviewRepository = {
  async productExists(productId) {
    const found = await prisma.product.findFirst({
      where: {
        id: productId,
        active: true,
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    return Boolean(found);
  },

  async findVerifiedPurchase(customerId, productId) {
    const sale = await prisma.sale.findFirst({
      where: {
        customerId,
        status: "COMPLETADA",
        items: {
          some: {
            variant: { productId },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        items: {
          where: { variant: { productId } },
          select: {
            variant: { select: { size: true } },
          },
          take: 1,
        },
      },
    });
    if (!sale) return null;
    return {
      saleId: sale.id,
      purchasedSize: sale.items[0]?.variant.size ?? null,
    };
  },

  async findCustomerReview(customerId, productId) {
    const row = await prisma.productReview.findUnique({
      where: { productId_customerId: { productId, customerId } },
    });
    return row ? mapPrismaReviewRow(row) : null;
  },

  async upsertReviewAndRecalculate(params): Promise<UpsertReviewOutcome> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.productReview.findUnique({
        where: {
          productId_customerId: {
            productId: params.productId,
            customerId: params.customerId,
          },
        },
      });

      if (existing) {
        await tx.$executeRaw`SELECT 1 FROM "ProductReview" WHERE "id" = ${existing.id} FOR UPDATE`;
      }

      if (existing && existing.status === "OCULTA") {
        return {
          ok: false,
          error:
            "Esta reseña fue moderada por el equipo de Matacos Deportes y no puede editarse.",
        };
      }

      // Evita que un autor saque su reseña de EN_REVISION si fue retenida por reportes comunitarios
      const lockedInReviewByReports =
        existing !== null &&
        existing.status === "EN_REVISION" &&
        existing.reportsCount >= AUTO_REVIEW_REPORTS_THRESHOLD;

      const effectiveStatus: ReviewStatusType = lockedInReviewByReports
        ? "EN_REVISION"
        : params.status;
      const effectiveReason = lockedInReviewByReports
        ? existing.moderationReason ??
          "Retenida automáticamente tras alcanzar 3 reportes de usuarios."
        : params.moderationReason;

      const sharedFields = buildReviewWriteFields(
        params,
        effectiveStatus,
        effectiveReason
      );

      const saved = await tx.productReview.upsert({
        where: {
          productId_customerId: {
            productId: params.productId,
            customerId: params.customerId,
          },
        },
        create: {
          productId: params.productId,
          customerId: params.customerId,
          ...sharedFields,
        },
        update: sharedFields,
      });

      const aggregates = await recalculateProductAggregatesTx(tx, params.productId);
      return {
        ok: true,
        review: mapPrismaReviewRow(saved),
        aggregates,
        wasUpdated: Boolean(existing),
      };
    });
  },

  async listPublishedReviewsForProduct(productId) {
    const rows = await prisma.productReview.findMany({
      where: { productId, status: "PUBLICADA" },
      include: {
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      ...mapPrismaReviewRow(row),
      customerName: row.customer.name,
    }));
  },

  async findReviewById(reviewId) {
    const row = await prisma.productReview.findUnique({
      where: { id: reviewId },
    });
    return row ? mapPrismaReviewRow(row) : null;
  },

  async createReportAndUpdateReview(params): Promise<CreateReportOutcome> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "ProductReview" WHERE "id" = ${params.reviewId} FOR UPDATE`;

      const review = await tx.productReview.findUnique({
        where: { id: params.reviewId },
        select: {
          id: true,
          productId: true,
          customerId: true,
          status: true,
        },
      });

      if (!review || review.status !== "PUBLICADA") {
        return {
          ok: false,
          error: "La reseña no está disponible o ya se encuentra bajo moderación.",
        };
      }

      if (params.reporterId && params.reporterId === review.customerId) {
        return {
          ok: false,
          error: "No podés reportar tu propia reseña.",
        };
      }

      if (params.reporterId) {
        const alreadyReported = await tx.reviewReport.findFirst({
          where: {
            reviewId: params.reviewId,
            reporterId: params.reporterId,
          },
          select: { id: true },
        });
        if (alreadyReported) {
          return {
            ok: false,
            error: "Ya reportaste esta reseña anteriormente.",
          };
        }
      }

      await tx.reviewReport.create({
        data: {
          reviewId: params.reviewId,
          reporterId: params.reporterId,
          reason: params.reason,
          comment: params.comment,
        },
      });

      const incremented = await tx.productReview.update({
        where: { id: params.reviewId },
        data: { reportsCount: { increment: 1 } },
        select: { id: true, productId: true, reportsCount: true, status: true },
      });

      const shouldMoveToReview =
        incremented.reportsCount >= params.autoReviewThreshold &&
        review.status === "PUBLICADA";
      const finalStatus: ReviewStatusType = shouldMoveToReview
        ? "EN_REVISION"
        : incremented.status;

      if (shouldMoveToReview) {
        await tx.productReview.update({
          where: { id: params.reviewId },
          data: {
            status: "EN_REVISION",
            moderationReason:
              "Retenida automáticamente tras alcanzar 3 reportes de usuarios.",
          },
        });
      }

      const aggregates = await recalculateProductAggregatesTx(tx, review.productId);
      return {
        ok: true,
        productId: review.productId,
        reportsCount: incremented.reportsCount,
        status: finalStatus,
        movedToModeration: shouldMoveToReview,
        aggregates,
      };
    });
  },

  async incrementHelpfulVotes(reviewId) {
    const updated = await prisma.productReview.update({
      where: { id: reviewId },
      data: { helpfulVotes: { increment: 1 } },
      select: { productId: true, helpfulVotes: true },
    });
    return { productId: updated.productId, helpfulVotes: updated.helpfulVotes };
  },
};

/**
 * Calcula promedio y total de reseñas considerando exclusivamente las PUBLICADAS.
 */
export function computeProductReviewAggregates(
  reviews: ReadonlyArray<{ rating: number; status: ReviewStatusType }>
): ProductReviewAggregates {
  const published = reviews.filter((r) => r.status === "PUBLICADA");
  if (published.length === 0) {
    return { ratingAverage: null, reviewsCount: 0 };
  }
  const sum = published.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / published.length) * 100) / 100;
  return { ratingAverage: average, reviewsCount: published.length };
}

/**
 * Crea o actualiza la reseña de un cliente autenticado para un producto.
 */
export async function createOrUpdateCustomerReview(
  customer: CustomerSessionActor | null,
  input: unknown,
  repo: ReviewRepository = prismaReviewRepository
): Promise<CreateOrUpdateReviewResult> {
  if (!customer || !customer.customerId) {
    return {
      success: false,
      error: "Iniciá sesión con tu cuenta de cliente para dejar una reseña.",
    };
  }

  const parsed = CreateOrUpdateReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de reseña inválidos.",
    };
  }

  const { productId, rating, title, comment, purchasedSize, fitFeedback } = parsed.data;

  const exists = await repo.productExists(productId);
  if (!exists) {
    return {
      success: false,
      error: "El producto indicado no existe o no está publicado.",
    };
  }

  const textAudit = analyzeReviewText(`${title} ${comment}`);
  if (textAudit.status === "BLOCKED") {
    return {
      success: false,
      error: "Por favor, utilizá un lenguaje adecuado para compartir tu experiencia.",
    };
  }

  const nextStatus: ReviewStatusType =
    textAudit.status === "REVIEW" ? "EN_REVISION" : "PUBLICADA";
  const moderationReason =
    textAudit.status === "REVIEW" ? textAudit.reasons.join(" ") : null;

  const verifiedPurchase = await repo.findVerifiedPurchase(customer.customerId, productId);
  const resolvedPurchasedSize = purchasedSize ?? verifiedPurchase?.purchasedSize ?? null;

  const outcome = await repo.upsertReviewAndRecalculate({
    productId,
    customerId: customer.customerId,
    rating,
    title,
    comment,
    purchasedSize: resolvedPurchasedSize,
    fitFeedback,
    isVerifiedPurchase: Boolean(verifiedPurchase),
    saleId: verifiedPurchase?.saleId ?? null,
    status: nextStatus,
    moderationReason,
  });

  if (!outcome.ok) {
    return {
      success: false,
      error: outcome.error,
    };
  }

  return {
    success: true,
    data: {
      reviewId: outcome.review.id,
      productId: outcome.review.productId,
      status: outcome.review.status,
      isVerifiedPurchase: outcome.review.isVerifiedPurchase,
      purchasedSize: outcome.review.purchasedSize,
      ratingAverage: outcome.aggregates.ratingAverage,
      reviewsCount: outcome.aggregates.reviewsCount,
      wasUpdated: outcome.wasUpdated,
    },
  };
}

export function formatArgentinaLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

/**
 * Formatea el nombre del autor para la vista pública (ej. "Juan Pérez" -> "Juan P.").
 */
export function formatReviewerDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Cliente";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

function buildReviewsSummary(
  publishedReviews: ReadonlyArray<StoredReviewWithAuthor>
): ProductReviewsSummary {
  const { ratingAverage, reviewsCount } = computeProductReviewAggregates(publishedReviews);
  const starDistribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let chicoCount = 0;
  let exactoCount = 0;
  let holgadoCount = 0;

  for (const r of publishedReviews) {
    if (r.rating >= 1 && r.rating <= 5) {
      const key = r.rating as 1 | 2 | 3 | 4 | 5;
      starDistribution[key] += 1;
    }
    if (r.fitFeedback === "CHICO") chicoCount += 1;
    else if (r.fitFeedback === "EXACTO") exactoCount += 1;
    else if (r.fitFeedback === "HOLGADO") holgadoCount += 1;
  }

  const totalResponses = chicoCount + exactoCount + holgadoCount;
  const pct = (count: number): number =>
    totalResponses === 0 ? 0 : Math.round((count / totalResponses) * 100);

  return {
    ratingAverage,
    reviewsCount,
    starDistribution,
    fitSummary: {
      totalResponses,
      chicoCount,
      exactoCount,
      holgadoCount,
      chicoPct: pct(chicoCount),
      exactoPct: pct(exactoCount),
      holgadoPct: pct(holgadoCount),
    },
  };
}

function mapToPublicReviewItem(r: StoredReviewWithAuthor): PublicReviewItem {
  const replyDate = r.adminResponseAt ?? r.updatedAt;
  return {
    id: r.id,
    productId: r.productId,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    purchasedSize: r.purchasedSize,
    fitFeedback: r.fitFeedback,
    isVerifiedPurchase: r.isVerifiedPurchase,
    authorDisplayName: formatReviewerDisplayName(r.customerName),
    helpfulVotes: r.helpfulVotes,
    createdAt: r.createdAt.toISOString(),
    createdAtFormatted: formatArgentinaLongDate(r.createdAt),
    adminReply:
      r.adminResponse && r.adminResponse.trim().length > 0
        ? {
            authorName: STORE_PUBLIC_SIGNATURE,
            message: r.adminResponse,
            repliedAt: replyDate.toISOString(),
            repliedAtFormatted: formatArgentinaLongDate(replyDate),
          }
        : null,
  };
}

/**
 * Obtiene las reseñas publicadas y métricas agregadas de un producto para el PDP público.
 */
export async function getPublicProductReviews(
  input: unknown,
  repo: ReviewRepository = prismaReviewRepository
): Promise<{
  success: boolean;
  data?: PublicProductReviewsResponse;
  error?: string;
}> {
  const parsed = GetProductReviewsQuerySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Parámetros de consulta inválidos.",
    };
  }

  const { productId, starFilter, onlyVerified, sort } = parsed.data;
  const published = await repo.listPublishedReviewsForProduct(productId);
  const summary = buildReviewsSummary(published);

  const filtered = published.filter((r) => {
    if (starFilter !== null && r.rating !== starFilter) return false;
    if (onlyVerified && !r.isVerifiedPurchase) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "rating_high") {
      return b.rating - a.rating || b.createdAt.getTime() - a.createdAt.getTime();
    }
    if (sort === "rating_low") {
      return a.rating - b.rating || b.createdAt.getTime() - a.createdAt.getTime();
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return {
    success: true,
    data: {
      summary,
      reviews: sorted.map(mapToPublicReviewItem),
    },
  };
}

/**
 * Obtiene el contexto del cliente autenticado para el formulario de reseña de un producto.
 */
export async function getCustomerReviewContext(
  customer: CustomerSessionActor | null,
  productId: unknown,
  repo: ReviewRepository = prismaReviewRepository
): Promise<CustomerReviewContext> {
  const parsedProductId = ProductIdSchema.safeParse(productId);
  if (!customer || !customer.customerId || !parsedProductId.success) {
    return {
      isAuthenticated: false,
      hasVerifiedPurchase: false,
      verifiedPurchasedSize: null,
      existingReview: null,
    };
  }

  const cleanProductId = parsedProductId.data;
  const [verifiedPurchase, existing] = await Promise.all([
    repo.findVerifiedPurchase(customer.customerId, cleanProductId),
    repo.findCustomerReview(customer.customerId, cleanProductId),
  ]);

  return {
    isAuthenticated: true,
    hasVerifiedPurchase: Boolean(verifiedPurchase),
    verifiedPurchasedSize: verifiedPurchase?.purchasedSize ?? null,
    existingReview: existing
      ? {
          id: existing.id,
          rating: existing.rating,
          title: existing.title,
          comment: existing.comment,
          purchasedSize: existing.purchasedSize,
          fitFeedback: existing.fitFeedback,
          status: existing.status,
        }
      : null,
  };
}

/**
 * Registra un reporte sobre una reseña publicada. Si alcanza el umbral configurado,
 * la mueve a estado EN_REVISION y recalcula los agregados del producto.
 */
export async function reportCustomerReview(
  reporter: CustomerSessionActor | null,
  input: unknown,
  repo: ReviewRepository = prismaReviewRepository
): Promise<{
  success: boolean;
  data?: {
    productId: string;
    reportsCount: number;
    status: ReviewStatusType;
    movedToModeration: boolean;
  };
  error?: string;
}> {
  const parsed = ReportReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos del reporte inválidos.",
    };
  }

  const { reviewId, reason, comment } = parsed.data;
  const reporterId = reporter?.customerId ?? null;

  const outcome = await repo.createReportAndUpdateReview({
    reviewId,
    reporterId,
    reason,
    comment,
    autoReviewThreshold: AUTO_REVIEW_REPORTS_THRESHOLD,
  });

  if (!outcome.ok) {
    return {
      success: false,
      error: outcome.error,
    };
  }

  return {
    success: true,
    data: {
      productId: outcome.productId,
      reportsCount: outcome.reportsCount,
      status: outcome.status,
      movedToModeration: outcome.movedToModeration,
    },
  };
}

/**
 * Incrementa el contador de votos útiles ("¿Te resultó útil?") sobre una reseña publicada.
 */
export async function voteReviewHelpful(
  reviewId: unknown,
  repo: ReviewRepository = prismaReviewRepository
): Promise<{
  success: boolean;
  data?: { productId: string; helpfulVotes: number };
  error?: string;
}> {
  const parsedId = ReviewIdSchema.safeParse(reviewId);
  if (!parsedId.success) {
    return {
      success: false,
      error: parsedId.error.issues[0]?.message || "Identificador de reseña inválido.",
    };
  }

  const cleanId = parsedId.data;
  const review = await repo.findReviewById(cleanId);
  if (!review || review.status !== "PUBLICADA") {
    return {
      success: false,
      error: "La reseña no se encuentra publicada.",
    };
  }

  const updated = await repo.incrementHelpfulVotes(cleanId);
  if (!updated) {
    return { success: false, error: "No se pudo registrar el voto." };
  }

  return {
    success: true,
    data: updated,
  };
}
