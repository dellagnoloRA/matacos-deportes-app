"use server";

import { revalidatePath } from "next/cache";
import { getCustomerSession } from "@/lib/customerSession";
import { invalidateLandingCache } from "@/lib/landingCache";
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

export async function getProductReviewsAction(input: unknown): Promise<{
  success: boolean;
  data?: PublicProductReviewsResponse;
  error?: string;
}> {
  return getPublicProductReviews(input);
}

export async function getCustomerReviewContextAction(
  productId: string
): Promise<CustomerReviewContext> {
  const actor = await getCustomerSessionActor();
  return getCustomerReviewContext(actor, productId);
}

export async function createOrUpdateReviewAction(
  input: unknown
): Promise<CreateOrUpdateReviewResult> {
  const actor = await getCustomerSessionActor();
  const result = await createOrUpdateCustomerReview(actor, input);

  if (result.success && result.data) {
    invalidateProductReviewsCache(result.data.productId);
  }

  return result;
}

export async function reportReviewAction(input: unknown): Promise<{
  success: boolean;
  data?: {
    productId: string;
    reportsCount: number;
    status: ReviewStatusType;
    movedToModeration: boolean;
  };
  error?: string;
}> {
  const actor = await getCustomerSessionActor();
  const result = await reportCustomerReview(actor, input);

  if (result.success && result.data?.movedToModeration) {
    invalidateProductReviewsCache(result.data.productId);
  }

  return result;
}

export async function voteReviewHelpfulAction(reviewId: string): Promise<{
  success: boolean;
  data?: { productId: string; helpfulVotes: number };
  error?: string;
}> {
  const result = await voteReviewHelpful(reviewId);
  if (result.success && result.data) {
    try {
      revalidatePath(`/productos/${result.data.productId}`);
    } catch {
      // Silenciado en scripts CLI fuera del request lifecycle de Next.js
    }
  }
  return result;
}
