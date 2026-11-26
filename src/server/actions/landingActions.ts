"use server";

import {
  getLandingPageData as baseGetLandingPageData,
  revalidateLandingPageData as baseRevalidateLandingPageData,
} from "@/server/actions/ecommerce/landingActions";
import type { GetLandingPageDataResult } from "@/types/ecommerce";
import type { LandingInvalidationSource } from "@/lib/landingCache";

export async function getLandingPageData(): Promise<GetLandingPageDataResult> {
  return baseGetLandingPageData();
}

export async function revalidateLandingPageData(
  source: LandingInvalidationSource = "manual"
) {
  return baseRevalidateLandingPageData(source);
}
