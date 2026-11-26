import type { z } from "zod";
import type {
  ReviewStatusSchema,
  FitFeedbackSchema,
  ReviewReportReasonSchema,
  ReviewSortSchema,
  AdminReviewTabSchema,
} from "@/schemas/review";

export type ReviewStatusType = z.infer<typeof ReviewStatusSchema>;

export type FitFeedbackType = z.infer<typeof FitFeedbackSchema>;

export type ReviewReportReason = z.infer<typeof ReviewReportReasonSchema>;

export type ReviewSortOption = z.infer<typeof ReviewSortSchema>;

export type AdminReviewTab = z.infer<typeof AdminReviewTabSchema>;

export const STORE_PUBLIC_SIGNATURE = "Matacos Deportes" as const;
export type StorePublicSignature = typeof STORE_PUBLIC_SIGNATURE;

export interface ProductReviewAggregates {
  ratingAverage: number | null;
  reviewsCount: number;
}

export interface PublicReviewAdminReply {
  authorName: StorePublicSignature;
  message: string;
  repliedAt: string;
  repliedAtFormatted: string;
}

export interface PublicReviewItem {
  id: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  purchasedSize: string | null;
  fitFeedback: FitFeedbackType | null;
  isVerifiedPurchase: boolean;
  authorDisplayName: string;
  helpfulVotes: number;
  createdAt: string;
  createdAtFormatted: string;
  adminReply: PublicReviewAdminReply | null;
}

export interface ProductReviewsSummary extends ProductReviewAggregates {
  starDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  fitSummary: {
    totalResponses: number;
    chicoCount: number;
    exactoCount: number;
    holgadoCount: number;
    chicoPct: number;
    exactoPct: number;
    holgadoPct: number;
  };
}

export interface PublicProductReviewsResponse {
  summary: ProductReviewsSummary;
  reviews: PublicReviewItem[];
}

export interface CustomerReviewContext {
  isAuthenticated: boolean;
  hasVerifiedPurchase: boolean;
  verifiedPurchasedSize: string | null;
  existingReview: {
    id: string;
    rating: number;
    title: string;
    comment: string;
    purchasedSize: string | null;
    fitFeedback: FitFeedbackType | null;
    status: ReviewStatusType;
  } | null;
}

export interface AdminReviewReportItem {
  id: string;
  reason: ReviewReportReason;
  comment: string | null;
  reporterName: string | null;
  createdAt: string;
  createdAtFormatted: string;
}

export interface AdminReviewItem {
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
  reports: AdminReviewReportItem[];
  adminResponse: string | null;
  adminResponseAt: string | null;
  adminResponseAtFormatted: string | null;
  adminResponderName: string | null;
  publicSignature: StorePublicSignature;
  createdAt: string;
  createdAtFormatted: string;
}

export interface AdminReviewsCounters {
  all: number;
  pendingOrReported: number;
  unanswered: number;
  hidden: number;
}

export interface AdminReviewsListResponse {
  items: AdminReviewItem[];
  counters: AdminReviewsCounters;
  totalFiltered: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
