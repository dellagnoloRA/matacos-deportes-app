"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/customerSession";
import { invalidateLandingCache } from "@/lib/landingCache";
import type {
  CreateOrUpdateReviewPayload,
  GetProductReviewsQueryPayload,
  ReportReviewPayload,
} from "@/schemas/review";
import {
  createOrUpdateCustomerReview,
  getCustomerReviewContext,
  getPublicProductReviews,
  reportCustomerReview,
  voteReviewHelpful,
  type CreateOrUpdateReviewResult,
  type CustomerSessionActor,
} from "@/server/services/reviewService";
import type {
  CustomerReviewContext,
  PublicProductReviewsResponse,
  ReviewStatusType,
} from "@/types/reviews";

async function getCustomerSessionActor(): Promise<CustomerSessionActor | null> {
  const session = await getCustomerSession();
  if (!session) return null;
  return {
    customerId: session.customerId,
    name: session.name,
    email: session.email,
  };
}

function invalidateProductReviewsCache(productId: string): void {
  invalidateLandingCache("product");
  try {
    revalidatePath(`/productos/${productId}`);
  } catch {
    // Silenciado en scripts CLI fuera del request lifecycle de Next.js
  }
}

export async function getProductReviewsAction(
  input: GetProductReviewsQueryPayload
): Promise<{
  success: boolean;
  data?: PublicProductReviewsResponse;
  error?: string;
}> {
  try {
    return await getPublicProductReviews(input);
  } catch (error) {
    console.error("Error al consultar reseñas del producto:", error);
    return {
      success: false,
      error: "No pudimos cargar las reseñas en este momento.",
    };
  }
}

export async function getCustomerReviewContextAction(
  productId: string
): Promise<CustomerReviewContext> {
  try {
    const actor = await getCustomerSessionActor();
    return await getCustomerReviewContext(actor, productId);
  } catch (error) {
    console.error("Error al consultar contexto de reseña del cliente:", error);
    return {
      isAuthenticated: false,
      hasVerifiedPurchase: false,
      verifiedPurchasedSize: null,
      existingReview: null,
    };
  }
}

export async function createOrUpdateReviewAction(
  input: CreateOrUpdateReviewPayload
): Promise<CreateOrUpdateReviewResult> {
  try {
    const actor = await getCustomerSessionActor();
    const result = await createOrUpdateCustomerReview(actor, input);

    if (result.success && result.data) {
      invalidateProductReviewsCache(result.data.productId);
    }

    return result;
  } catch (error) {
    console.error("Error al guardar reseña de cliente:", error);
    return {
      success: false,
      error: "No pudimos guardar tu reseña en este momento. Intentá nuevamente.",
    };
  }
}

export async function reportReviewAction(
  input: ReportReviewPayload
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
  try {
    const actor = await getCustomerSessionActor();
    const result = await reportCustomerReview(actor, input);

    if (result.success && result.data?.movedToModeration) {
      invalidateProductReviewsCache(result.data.productId);
    }

    return result;
  } catch (error) {
    console.error("Error al reportar reseña:", error);
    return {
      success: false,
      error: "No pudimos registrar tu reporte en este momento.",
    };
  }
}

export async function voteReviewHelpfulAction(reviewId: string): Promise<{
  success: boolean;
  data?: { productId: string; helpfulVotes: number };
  error?: string;
}> {
  try {
    const result = await voteReviewHelpful(reviewId);
    if (result.success && result.data) {
      try {
        revalidatePath(`/productos/${result.data.productId}`);
      } catch {
        // Silenciado en scripts CLI fuera del request lifecycle de Next.js
      }
    }
    return result;
  } catch (error) {
    console.error("Error al votar reseña útil:", error);
    return {
      success: false,
      error: "No pudimos registrar tu voto en este momento.",
    };
  }
}
