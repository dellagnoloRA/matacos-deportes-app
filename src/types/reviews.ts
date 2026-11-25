import type { z } from "zod";
import type {
  ReviewStatusSchema,
  FitFeedbackSchema,
  ReviewReportReasonSchema,
  ReviewSortSchema,
} from "@/schemas/review";

export type ReviewStatusType = z.infer<typeof ReviewStatusSchema>;

export type FitFeedbackType = z.infer<typeof FitFeedbackSchema>;

export type ReviewReportReason = z.infer<typeof ReviewReportReasonSchema>;

export type ReviewSortOption = z.infer<typeof ReviewSortSchema>;

export interface ProductReviewAggregates {
  ratingAverage: number | null;
  reviewsCount: number;
}

export interface PublicReviewAdminReply {
  authorName: "Matacos Deportes";
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
