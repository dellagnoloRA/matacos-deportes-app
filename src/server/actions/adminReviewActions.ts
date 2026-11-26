"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { invalidateLandingCache } from "@/lib/landingCache";
import type {
  AdminReviewsFilterPayload,
  ModerateReviewPayload,
  RespondToReviewPayload,
} from "@/schemas/review";
import {
  listAdminReviews,
  moderateCustomerReview,
  respondToCustomerReview,
  type AdminReviewsListResult,
  type ModerateReviewResult,
  type RespondToReviewResult,
} from "@/server/services/adminReviewService";

function invalidateReviewModerationCaches(productId: string): void {
  invalidateLandingCache("product");
  try {
    revalidatePath(`/productos/${productId}`);
    revalidatePath("/admin/resenas");
  } catch {
    // Silenciado en scripts CLI fuera del request lifecycle de Next.js
  }
}

export async function getAdminReviewsAction(
  input?: AdminReviewsFilterPayload
): Promise<AdminReviewsListResult> {
  const session = await getSession();
  return listAdminReviews(session?.userId ?? null, input ?? {});
}

export async function respondToReviewAction(
  input: RespondToReviewPayload
): Promise<RespondToReviewResult> {
  const session = await getSession();
  const result = await respondToCustomerReview(session?.userId ?? null, input);
  if (result.success && result.data) {
    invalidateReviewModerationCaches(result.data.productId);
  }
  return result;
}

export async function moderateReviewAction(
  input: ModerateReviewPayload
): Promise<ModerateReviewResult> {
  const session = await getSession();
  const result = await moderateCustomerReview(session?.userId ?? null, input);
  if (result.success && result.data) {
    invalidateReviewModerationCaches(result.data.productId);
  }
  return result;
}
