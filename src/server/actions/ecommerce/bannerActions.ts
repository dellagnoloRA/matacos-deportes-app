"use server";

import type {
  CreateBannerInput,
  UpdateBannerInput,
} from "@/schemas/banner";
import {
  getActiveBanners as baseGetActiveBanners,
  getAllBannersAdmin as baseGetAllBannersAdmin,
  createBanner as baseCreateBanner,
  updateBanner as baseUpdateBanner,
  deleteBanner as baseDeleteBanner,
  reorderBanners as baseReorderBanners,
  type SerializedBanner,
  type BannerValidityStatus,
  type BannerListResult,
  type BannerSingleResult,
  type BannerDeleteResult,
} from "@/server/actions/bannerActions";

export type {
  SerializedBanner,
  BannerValidityStatus,
  BannerListResult,
  BannerSingleResult,
  BannerDeleteResult,
};

export async function getActiveBanners(): Promise<BannerListResult> {
  return baseGetActiveBanners();
}

export async function getAllBannersAdmin(): Promise<BannerListResult> {
  return baseGetAllBannersAdmin();
}

export async function createBanner(
  input: CreateBannerInput
): Promise<BannerSingleResult> {
  return baseCreateBanner(input);
}

export async function updateBanner(
  input: UpdateBannerInput
): Promise<BannerSingleResult>;
export async function updateBanner(
  id: string,
  data: Omit<UpdateBannerInput, "id">
): Promise<BannerSingleResult>;
export async function updateBanner(
  inputOrId: UpdateBannerInput | string,
  maybeData?: Omit<UpdateBannerInput, "id">
): Promise<BannerSingleResult> {
  if (typeof inputOrId === "string") {
    return baseUpdateBanner(inputOrId, maybeData ?? {});
  }
  return baseUpdateBanner(inputOrId);
}

export async function deleteBanner(id: string): Promise<BannerDeleteResult> {
  return baseDeleteBanner(id);
}

export async function reorderBanners(
  items: { id: string; order: number }[]
): Promise<BannerListResult> {
  return baseReorderBanners(items);
}
