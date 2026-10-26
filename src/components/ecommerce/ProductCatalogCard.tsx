"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EcommerceProduct } from "./types";
import { Heart, Flame } from "lucide-react";
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
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 select-none bg-slate-100/60">
      <div className="w-14 h-14 rounded-full bg-emerald-50/90 border border-emerald-200/70 flex items-center justify-center shadow-2xs">
        <svg
          viewBox="0 0 60 60"
          className="w-8 h-8 text-[#00D615]"
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
        <span className="block text-[10px] font-black uppercase tracking-wider text-slate-900">
          MATACOS DEPORTES
        </span>
        <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
          ARTÍCULO ORIGINAL
        </span>
      </div>
    </div>
  );
}

const COLOR_HEX_MAP: Record<string, string> = {
  negro: "#111827",
  blanco: "#F8FAFC",
  gris: "#94A3B8",
  azul: "#2563EB",
  marino: "#1E3A8A",
  rojo: "#DC2626",
  verde: "#16A34A",
  amarillo: "#EAB308",
  naranja: "#EA580C",
  rosa: "#F472B6",
  violeta: "#8B5CF6",
  celeste: "#38BDF8",
  "celeste y blanco": "#38BDF8",
  marron: "#78350F",
  beige: "#D4B996",
};

export function ProductCatalogCard({
  product,
  onAddToCart,
  onQuickView,
  isWishlisted = false,
  onToggleWishlist,
}: ProductCatalogCardProps) {
  const [imageError, setImageError] = useState(false);

  // Detectar si quedan últimas unidades (bajo stock <= 3)
  const isLowStock =
    (product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= 3) ||
    product.sizes?.some((s) => s.stock !== undefined && s.stock > 0 && s.stock <= 3);

  // Detección de oferta y precio anterior
  const hasOffer = Boolean(
    product.isOffer ||
    (product.originalPrice && product.originalPrice > product.price) ||
    (product.discountPercent && product.discountPercent > 0)
  );

  const originalPrice = product.originalPrice && product.originalPrice > product.price
    ? product.originalPrice
    : hasOffer
    ? Math.round(product.price * (1 + (product.discountPercent || 15) / 100))
    : undefined;

  const discountPercent =
    product.discountPercent ||
    (originalPrice ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 15);

  // Cuotas: 3 cuotas sin interés
  const installmentCount = 3;
  const router = useRouter();
  const installmentAmount = Math.round(product.price / installmentCount);

  const hasImage = Boolean(product.image && product.image.trim() !== "" && !imageError);

  const handleCardClick = () => {
    router.push(`/productos/${product.id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex flex-col bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer select-none overflow-hidden h-full"
    >
      {/* 1. Contenedor de Imagen (borde a borde en la parte superior, idéntico al diseño de referencia) */}
      <div className="relative aspect-[4/5] sm:aspect-square md:aspect-[4/5] w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100">
        {hasImage ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            loading="lazy"
          />
        ) : (
          <MatacosProductPlaceholder />
        )}

        {/* Badges en la parte inferior izquierda de la imagen (Colores o ¡ÚLTIMA!) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
          {isLowStock ? (
            <div className="flex items-center gap-1 bg-[#ff5722] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
              <Flame className="w-3 h-3 fill-white text-white shrink-0" />
              <span>¡ÚLTIMA!</span>
            </div>
          ) : product.colors && product.colors.length > 0 ? (
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-1.5 py-1 rounded-full shadow-xs">
              {product.colors.slice(0, 3).map((col, idx) => {
                const key = col.toLowerCase().trim();
                const hex = COLOR_HEX_MAP[key] || "#94a3b8";
                return (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 rounded-full border border-white/70 shadow-2xs shrink-0"
                    style={{ backgroundColor: hex }}
                    title={col}
                  />
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Botón de Favorito / Wishlist (arriba a la derecha) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(product.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-slate-500 hover:text-red-500 border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all z-10 cursor-pointer"
          title={isWishlisted ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isWishlisted
                ? "fill-red-500 text-red-500"
                : "text-slate-500 hover:text-red-500"
            }`}
          />
        </button>
      </div>

      {/* 2. Cuerpo de Información */}
      <div className="p-3 sm:p-3.5 flex flex-col grow justify-between bg-white">
        <div>
          {/* Nombre / Título del Producto con espaciado ajustado */}
          <h3
            className="text-sm sm:text-[15px] font-normal text-slate-800 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Marca (sin check y pegada al título) */}
          <div className="mt-0.5">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate block">
              {product.brand}
            </span>
          </div>

          {/* Rating con estrella azul */}
          <div className="flex items-center gap-1 text-[11px] text-[#3483fa] mt-0.5">
            <span className="text-xs">★</span>
            <span className="font-semibold text-slate-700">
              {product.rating ? product.rating.toFixed(1) : "4.8"}
            </span>
          </div>

          {/* Precio: Anterior tachado si hay oferta */}
          <div className="mt-1.5">
            {hasOffer && originalPrice && (
              <div className="text-[11px] sm:text-xs text-slate-400 line-through leading-none">
                {formatCurrency(originalPrice)}
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base sm:text-lg font-normal text-slate-900 tracking-tight">
                {formatCurrency(product.price)}
              </span>
              {hasOffer && (
                <span className="text-[10px] sm:text-[11px] font-bold text-[#00a650] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/50">
                  {discountPercent}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Cuotas sin interés en verde */}
          <div className="text-[11px] sm:text-xs font-medium text-[#00a650] leading-tight mt-0.5">
            Mismo precio {installmentCount} cuotas de {formatCurrency(installmentAmount)}
          </div>

          {/* Envíos a todo el país */}
          <div className="text-[11px] sm:text-xs font-medium text-[#00a650] mt-0.5">
            Envíos a todo el país
          </div>
        </div>
      </div>
    </article>
  );
}
