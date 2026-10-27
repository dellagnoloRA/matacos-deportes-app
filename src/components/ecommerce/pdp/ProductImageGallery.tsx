"use client";

import React, { useState } from "react";
import type { PublicImageItem } from "@/types/ecommerce";

interface ProductImageGalleryProps {
  productName: string;
  defaultImageUrl: string | null;
  images: PublicImageItem[];
  isOffer?: boolean;
  offerTag?: string;
}

export function ProductImageGallery({
  productName,
  defaultImageUrl,
  images,
  isOffer,
  offerTag = "OFERTA",
}: ProductImageGalleryProps) {
  // Build a list of available images
  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (images && images.length > 0) {
      images.forEach((img) => {
        if (img.url && !list.includes(img.url)) list.push(img.url);
      });
    }
    if (defaultImageUrl && !list.includes(defaultImageUrl)) {
      list.unshift(defaultImageUrl);
    }
    if (list.length === 0) {
      list.push("/placeholder-product.svg");
    }
    return list;
  }, [images, defaultImageUrl]);

  const [selectedImage, setSelectedImage] = useState<string>(allImages[0]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Main Image Frame */}
      <div className="relative w-full aspect-square bg-white rounded-3xl border border-slate-200/80 p-6 flex items-center justify-center overflow-hidden shadow-2xs group">
        {isOffer && (
          <span className="absolute top-4 left-4 z-10 bg-[#c2f25b] text-slate-950 font-black text-xs tracking-wider uppercase px-3 py-1 rounded-md shadow-xs">
            {offerTag}
          </span>
        )}

        <img
          src={selectedImage}
          alt={productName}
          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-product.svg";
          }}
        />
      </div>

      {/* Thumbnails Row */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {allImages.map((url, idx) => {
            const isSelected = selectedImage === url;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(url)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border p-1.5 shrink-0 overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#00D615] ring-2 ring-[#00D615]/30 shadow-xs"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <img
                  src={url}
                  alt={`${productName} vista ${idx + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

