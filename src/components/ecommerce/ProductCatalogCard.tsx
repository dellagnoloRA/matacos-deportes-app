"use client";

import React, { useState } from "react";
import { EcommerceProduct } from "./types";
import { Heart, ShoppingBag, Eye, Check, Truck, Store, Percent } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductCatalogCardProps {
  product: EcommerceProduct;
  onAddToCart?: (product: EcommerceProduct, selectedSize?: string) => void;
  onQuickView?: (product: EcommerceProduct) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

function MatacosProductPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 select-none bg-slate-50/60">
      <div className="w-16 h-16 rounded-full bg-emerald-50/90 border border-emerald-200/70 flex items-center justify-center shadow-2xs">
        <svg
          viewBox="0 0 60 60"
          className="w-9 h-9 text-[#00D615]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 40C18 32 38 30 38 22C38 16 30 15 24 19"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 41H42"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="text-center mt-1">
        <span className="block text-[11px] font-black uppercase tracking-wider text-slate-900">
          MATACOS DEPORTES
        </span>
        <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
          ARTÍCULO ORIGINAL
        </span>
      </div>
    </div>
  );
}

export function ProductCatalogCard({
  product,
  onAddToCart,
  onQuickView,
  isWishlisted = false,
  onToggleWishlist,
}: ProductCatalogCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatPrice = (amount: number) => {
    return formatCurrency(amount);
  };

  // Detectar si quedan últimas unidades (bajo stock)
  const isLowStock =
    (product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= 2) ||
    product.sizes?.some((s) => s.stock !== undefined && s.stock > 0 && s.stock <= 2);

  const lowStockCount =
    product.sizes?.find((s) => s.stock !== undefined && s.stock > 0 && s.stock <= 2)?.stock ||
    product.stockCount ||
    1;

  const hasImage = Boolean(product.image && product.image.trim() !== "" && !imageError);

  return (
    <article
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* 1. Contenedor de Imagen y Badges */}
      <div
        className="relative aspect-square w-full bg-slate-50/50 overflow-hidden cursor-pointer flex items-center justify-center border-b border-slate-100"
        onClick={() => onQuickView?.(product)}
      >
        {hasImage ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <MatacosProductPlaceholder />
        )}

        {/* Badge de Oferta / SALE (arriba a la izquierda) */}
        {product.isOffer && (
          <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs z-10">
            {product.offerTag || `SALE ${product.discountPercent || 15}% OFF`}
          </span>
        )}

        {/* Badge de ¡ÚLTIMAS X! (arriba a la derecha como en la imagen) */}
        {isLowStock && (
          <span className="absolute top-2.5 right-2.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-xs shadow-xs z-10">
            ¡ÚLTIMAS {lowStockCount}!
          </span>
        )}
      </div>

      {/* 2. Información del Producto (Estética exacta de la captura) */}
      <div className="p-4 flex flex-col grow justify-between gap-3 bg-white">
        <div className="space-y-1">
          {/* Fila de Marca: CROCS a la izquierda, CROCS en verde a la derecha */}
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="text-slate-400 font-semibold">
              {product.brand || "MATACOS"}
            </span>
            <span className="text-emerald-700 font-bold">
              {product.brand || "MATACOS"}
            </span>
          </div>

          {/* Nombre del Producto */}
          <h3
            onClick={() => onQuickView?.(product)}
            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1 cursor-pointer leading-snug pt-0.5"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Precio en verde vibrante */}
          <div className="pt-1.5">
            <span className="text-sm sm:text-base font-extrabold text-[#00a82d] tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* 3. Botón VER PRODUCTO */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onQuickView?.(product)}
            className="w-full py-2 px-3 rounded-lg border border-slate-700 hover:border-slate-950 text-slate-800 hover:text-white hover:bg-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 text-center cursor-pointer"
          >
            VER PRODUCTO
          </button>
        </div>
      </div>
    </article>
  );
}
