import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AdminReviewsFilterSchema,
  ModerateReviewSchema,
  RespondToReviewSchema,
  ReviewReportReasonSchema,
  StaffUserIdSchema,
} from "@/schemas/review";
import {
  formatArgentinaLongDate,
  recalculateProductAggregatesTx,
} from "@/server/services/reviewService";
import {
  USER_WITH_PERMISSIONS_INCLUDE,
  resolveUserEffectivePermissions,
} from "@/server/services/staffAuthService";
import {
  STORE_PUBLIC_SIGNATURE,
  type AdminReviewItem,
  type AdminReviewReportItem,
  type AdminReviewsCounters,
  type AdminReviewsListResponse,
  type AdminReviewTab,
  type FitFeedbackType,
  type ProductReviewAggregates,
  type ReviewReportReason,
  type ReviewStatusType,
  type StorePublicSignature,
} from "@/types/reviews";

export const REVIEWS_MODERATION_PERMISSION = "ecommerce.resenas";

export interface AdminStaffActorRecord {
  id: string;
  name: string;
  active: boolean;
  role: string | null;
  profileLevel: number;
  effectivePermissions: string[];
}

export interface StoredAdminReviewReportRecord {
  id: string;
  reason: string;
  comment: string | null;
  reporterName: string | null;
  createdAt: Date;
}

export interface StoredAdminReviewRecord {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  purchasedSize: string | null;
  fitFeedback: FitFeedbackType | null;
  isVerifiedPurchase: boolean;
  status: ReviewStatusType;
  moderationReason: string | null;
  reportsCount: number;
  helpfulVotes: number;
  reports: StoredAdminReviewReportRecord[];
  adminResponse: string | null;
  adminResponseAt: Date | null;
  adminResponderId: string | null;
  adminResponderName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type SaveAdminResponseOutcome =
  | {
      ok: true;
      reviewId: string;
      productId: string;
      adminResponse: string;
      adminResponseAt: Date;
      responderName: string | null;
    }
  | { ok: false; error: string };

export type ModerateReviewOutcome =
  | {
      ok: true;
      reviewId: string;
      productId: string;
      status: ReviewStatusType;
      moderationReason: string | null;
      reportsCount: number;
      aggregates: ProductReviewAggregates;
    }
  | { ok: false; error: string };

export interface AdminReviewQueryFilter {
  tab: AdminReviewTab;
  productId: string | null;
  search: string | null;
  page: number;
  pageSize: number;
}

export interface AdminReviewRepository {
  findStaffActor(userId: string): Promise<AdminStaffActorRecord | null>;
  queryAdminReviews(filter: AdminReviewQueryFilter): Promise<{
    items: StoredAdminReviewRecord[];
    totalFiltered: number;
    counters: AdminReviewsCounters;
  }>;
  saveAdminResponse(params: {
    reviewId: string;
    responderId: string;
    response: string;
  }): Promise<SaveAdminResponseOutcome>;
  updateReviewModeration(params: {
    reviewId: string;
    status: ReviewStatusType;
    reason: string | null;
  }): Promise<ModerateReviewOutcome>;
}

export interface ModerationAccessResult {
  authorized: boolean;
  actor?: AdminStaffActorRecord;
  error?: string;
}

export interface AdminReviewsListResult {
  success: boolean;
  data?: AdminReviewsListResponse;
  error?: string;
}

export interface RespondToReviewResult {
  success: boolean;
  data?: {
    reviewId: string;
    productId: string;
    adminResponse: string;
    adminResponseAt: string;
    adminResponseAtFormatted: string;
    responderName: string | null;
    publicSignature: StorePublicSignature;
  };
  error?: string;
}

export interface ModerateReviewResult {
  success: boolean;
  data?: {
    reviewId: string;
    productId: string;
    status: ReviewStatusType;
    moderationReason: string | null;
    reportsCount: number;
    aggregates: ProductReviewAggregates;
  };
  error?: string;
}

const PENDING_REPORTED_WHERE: Prisma.ProductReviewWhereInput = {
  status: { not: "OCULTA" },
  OR: [{ status: "EN_REVISION" }, { reportsCount: { gt: 0 } }],
};

const UNANSWERED_WHERE: Prisma.ProductReviewWhereInput = {
  status: "PUBLICADA",
  OR: [{ adminResponse: null }, { adminResponse: "" }],
};

const HIDDEN_WHERE: Prisma.ProductReviewWhereInput = {
  status: "OCULTA",
};

export const prismaAdminReviewRepository: AdminReviewRepository = {
  async findStaffActor(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: USER_WITH_PERMISSIONS_INCLUDE,
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      active: user.active,
      role: user.role ?? null,
      profileLevel: user.profile?.level ?? 0,
      effectivePermissions: resolveUserEffectivePermissions(user),
    };
  },

  async queryAdminReviews(filter) {
    const andConditions: Prisma.ProductReviewWhereInput[] = [];

    if (filter.tab === "PENDING_REPORTED") {
      andConditions.push(PENDING_REPORTED_WHERE);
    } else if (filter.tab === "UNANSWERED") {
      andConditions.push(UNANSWERED_WHERE);
    } else if (filter.tab === "HIDDEN") {
      andConditions.push(HIDDEN_WHERE);
    }

    if (filter.productId) {
      andConditions.push({ productId: filter.productId });
    }

    if (filter.search) {
      andConditions.push({
        OR: [
          { title: { contains: filter.search, mode: "insensitive" } },
          { comment: { contains: filter.search, mode: "insensitive" } },
          { product: { name: { contains: filter.search, mode: "insensitive" } } },
          { customer: { name: { contains: filter.search, mode: "insensitive" } } },
          { customer: { email: { contains: filter.search, mode: "insensitive" } } },
        ],
      });
    }

    const where: Prisma.ProductReviewWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const orderBy: Prisma.ProductReviewOrderByWithRelationInput[] =
      filter.tab === "PENDING_REPORTED"
        ? [{ reportsCount: "desc" }, { createdAt: "desc" }]
        : [{ createdAt: "desc" }];

    const [
      allCount,
      pendingOrReportedCount,
      unansweredCount,
      hiddenCount,
      totalFiltered,
      rows,
    ] = await Promise.all([
      prisma.productReview.count(),
      prisma.productReview.count({ where: PENDING_REPORTED_WHERE }),
      prisma.productReview.count({ where: UNANSWERED_WHERE }),
      prisma.productReview.count({ where: HIDDEN_WHERE }),
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({
        where,
        orderBy,
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
        include: {
          product: { select: { name: true, imageUrl: true } },
          customer: { select: { name: true, email: true } },
          adminResponder: { select: { name: true } },
          reports: {
            orderBy: { createdAt: "desc" },
            include: { reporter: { select: { name: true } } },
          },
        },
      }),
    ]);

    const items: StoredAdminReviewRecord[] = rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      productImageUrl: row.product.imageUrl,
      customerId: row.customerId,
      customerName: row.customer.name,
      customerEmail: row.customer.email,
      rating: row.rating,
      title: row.title,
      comment: row.comment,
      purchasedSize: row.purchasedSize,
      fitFeedback: row.fitFeedback,
      isVerifiedPurchase: row.isVerifiedPurchase,
      status: row.status,
      moderationReason: row.moderationReason,
      reportsCount: row.reportsCount,
      helpfulVotes: row.helpfulVotes,
      reports: row.reports.map((rep) => ({
        id: rep.id,
        reason: rep.reason,
        comment: rep.comment,
        reporterName: rep.reporter?.name ?? null,
        createdAt: rep.createdAt,
      })),
      adminResponse: row.adminResponse,
      adminResponseAt: row.adminResponseAt,
      adminResponderId: row.adminResponderId,
      adminResponderName: row.adminResponder?.name ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      items,
      totalFiltered,
      counters: {
        all: allCount,
        pendingOrReported: pendingOrReportedCount,
        unanswered: unansweredCount,
        hidden: hiddenCount,
      },
    };
  },

  async saveAdminResponse(params): Promise<SaveAdminResponseOutcome> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "ProductReview" WHERE "id" = ${params.reviewId} FOR UPDATE`;

      const existing = await tx.productReview.findUnique({
        where: { id: params.reviewId },
        select: { id: true, productId: true },
      });

      if (!existing) {
        return { ok: false, error: "La reseña indicada no existe." };
      }

      const now = new Date();
      const updated = await tx.productReview.update({
        where: { id: params.reviewId },
        data: {
          adminResponse: params.response,
          adminResponseAt: now,
          adminResponderId: params.responderId,
        },
        include: {
          adminResponder: { select: { name: true } },
        },
      });

      return {
        ok: true,
        reviewId: updated.id,
        productId: updated.productId,
        adminResponse: updated.adminResponse ?? params.response,
        adminResponseAt: updated.adminResponseAt ?? now,
        responderName: updated.adminResponder?.name ?? null,
      };
    });
  },

  async updateReviewModeration(params): Promise<ModerateReviewOutcome> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "ProductReview" WHERE "id" = ${params.reviewId} FOR UPDATE`;

      const existing = await tx.productReview.findUnique({
        where: { id: params.reviewId },
        select: { id: true, productId: true, moderationReason: true },
      });

      if (!existing) {
        return { ok: false, error: "La reseña indicada no existe." };
      }

      const nextReason =
        params.status === "PUBLICADA"
          ? null
          : params.reason ?? existing.moderationReason;

      const updated = await tx.productReview.update({
        where: { id: params.reviewId },
        data: {
          status: params.status,
          moderationReason: nextReason,
          ...(params.status === "PUBLICADA" ? { reportsCount: 0 } : {}),
        },
        select: {
          id: true,
          productId: true,
          status: true,
          moderationReason: true,
          reportsCount: true,
        },
      });

      const aggregates = await recalculateProductAggregatesTx(tx, existing.productId);
      return {
        ok: true,
        reviewId: updated.id,
        productId: updated.productId,
        status: updated.status,
        moderationReason: updated.moderationReason,
        reportsCount: updated.reportsCount,
        aggregates,
      };
    });
  },
};

/**
 * Verifica que el usuario del staff exista, esté activo y cuente con
 * rol ADMIN, nivel >= 100 o permiso dedicado `ecommerce.resenas` (directo o heredado).
 */
export async function verifyReviewsModerationAccess(
  actorUserId: unknown,
  repo: AdminReviewRepository = prismaAdminReviewRepository
): Promise<ModerationAccessResult> {
  const parsedId = StaffUserIdSchema.safeParse(actorUserId);
  if (!parsedId.success) {
    return {
      authorized: false,
      error: "Acceso denegado: debes iniciar sesión con una cuenta de personal.",
    };
  }

  const actor = await repo.findStaffActor(parsedId.data);
  if (!actor || !actor.active) {
    return {
      authorized: false,
      error: "Acceso denegado: usuario inexistente o cuenta inactiva.",
    };
  }

  const canModerate =
    actor.role === "ADMIN" ||
    actor.profileLevel >= 100 ||
    actor.effectivePermissions.includes(REVIEWS_MODERATION_PERMISSION);

  if (!canModerate) {
    return {
      authorized: false,
      error:
        "Acceso denegado: se requiere el permiso 'ecommerce.resenas' para moderar o responder reseñas.",
    };
  }

  return { authorized: true, actor };
}

function normalizeReportReason(rawReason: string): ReviewReportReason {
  const parsed = ReviewReportReasonSchema.safeParse(rawReason);
  return parsed.success ? parsed.data : "OTRO";
}

function mapAdminReportItem(
  rep: StoredAdminReviewReportRecord
): AdminReviewReportItem {
  return {
    id: rep.id,
    reason: normalizeReportReason(rep.reason),
    comment: rep.comment,
    reporterName: rep.reporterName,
    createdAt: rep.createdAt.toISOString(),
    createdAtFormatted: formatArgentinaLongDate(rep.createdAt),
  };
}

function mapAdminReviewItem(r: StoredAdminReviewRecord): AdminReviewItem {
  return {
    id: r.id,
    productId: r.productId,
    productName: r.productName,
    productImageUrl: r.productImageUrl,
    customerId: r.customerId,
    customerName: r.customerName,
    customerEmail: r.customerEmail,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    purchasedSize: r.purchasedSize,
    fitFeedback: r.fitFeedback,
    isVerifiedPurchase: r.isVerifiedPurchase,
    status: r.status,
    moderationReason: r.moderationReason,
    reportsCount: r.reportsCount,
    helpfulVotes: r.helpfulVotes,
    reports: r.reports.map(mapAdminReportItem),
    adminResponse: r.adminResponse,
    adminResponseAt: r.adminResponseAt ? r.adminResponseAt.toISOString() : null,
    adminResponseAtFormatted: r.adminResponseAt
      ? formatArgentinaLongDate(r.adminResponseAt)
      : null,
    adminResponderName: r.adminResponderName,
    publicSignature: STORE_PUBLIC_SIGNATURE,
    createdAt: r.createdAt.toISOString(),
    createdAtFormatted: formatArgentinaLongDate(r.createdAt),
  };
}

/**
 * Lista reseñas para el panel de moderación /admin/resenas aplicando RBAC,
 * pestañas, búsqueda, paginación y contadores globales.
 */
export async function listAdminReviews(
  actorUserId: unknown,
  input: unknown = {},
  repo: AdminReviewRepository = prismaAdminReviewRepository
): Promise<AdminReviewsListResult> {
  const access = await verifyReviewsModerationAccess(actorUserId, repo);
  if (!access.authorized) {
    return { success: false, error: access.error };
  }

  const parsed = AdminReviewsFilterSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Filtros de búsqueda inválidos.",
    };
  }

  const filter = parsed.data;
  const { items, totalFiltered, counters } = await repo.queryAdminReviews(filter);
  const totalPages = Math.max(1, Math.ceil(totalFiltered / filter.pageSize));

  return {
    success: true,
    data: {
      items: items.map(mapAdminReviewItem),
      counters,
      totalFiltered,
      page: filter.page,
      pageSize: filter.pageSize,
      totalPages,
    },
  };
}

/**
 * Registra o actualiza la respuesta oficial de la tienda sobre una reseña.
 * Guarda el `adminResponderId` para auditoría interna y expone siempre firma "Matacos Deportes".
 */
export async function respondToCustomerReview(
  actorUserId: unknown,
  input: unknown,
  repo: AdminReviewRepository = prismaAdminReviewRepository
): Promise<RespondToReviewResult> {
  const access = await verifyReviewsModerationAccess(actorUserId, repo);
  if (!access.authorized || !access.actor) {
    return { success: false, error: access.error };
  }

  const parsed = RespondToReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de respuesta inválidos.",
    };
  }

  const outcome = await repo.saveAdminResponse({
    reviewId: parsed.data.reviewId,
    responderId: access.actor.id,
    response: parsed.data.response,
  });

  if (!outcome.ok) {
    return { success: false, error: outcome.error };
  }

  return {
    success: true,
    data: {
      reviewId: outcome.reviewId,
      productId: outcome.productId,
      adminResponse: outcome.adminResponse,
      adminResponseAt: outcome.adminResponseAt.toISOString(),
      adminResponseAtFormatted: formatArgentinaLongDate(outcome.adminResponseAt),
      responderName: outcome.responderName,
      publicSignature: STORE_PUBLIC_SIGNATURE,
    },
  };
}

/**
 * Cambia el estado de moderación de una reseña (OCULTA, PUBLICADA o EN_REVISION)
 * y recalcula atómicamente los promedios del producto.
 */
export async function moderateCustomerReview(
  actorUserId: unknown,
  input: unknown,
  repo: AdminReviewRepository = prismaAdminReviewRepository
): Promise<ModerateReviewResult> {
  const access = await verifyReviewsModerationAccess(actorUserId, repo);
  if (!access.authorized) {
    return { success: false, error: access.error };
  }

  const parsed = ModerateReviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Datos de moderación inválidos.",
    };
  }

  const outcome = await repo.updateReviewModeration({
    reviewId: parsed.data.reviewId,
    status: parsed.data.status,
    reason: parsed.data.reason,
  });

  if (!outcome.ok) {
    return { success: false, error: outcome.error };
  }

  return {
    success: true,
    data: {
      reviewId: outcome.reviewId,
      productId: outcome.productId,
      status: outcome.status,
      moderationReason: outcome.moderationReason,
      reportsCount: outcome.reportsCount,
      aggregates: outcome.aggregates,
    },
  };
}
