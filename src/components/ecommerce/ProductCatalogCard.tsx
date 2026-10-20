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

export function ProductCatalogCard({
  product,
  onAddToCart,
  onQuickView,
  isWishlisted = false,
  onToggleWishlist,
}: ProductCatalogCardProps) {
  // Talle seleccionado por defecto: el primer talle con stock disponible
  const initialAvailableSize = product.sizes?.find((s) => s.inStock)?.size;
  const [selectedSize, setSelectedSize] = useState<string | undefined>(initialAvailableSize);
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [localWishlist, setLocalWishlist] = useState(isWishlisted);

  const formatPrice = (amount: number) => {
    return formatCurrency(amount).replace(/,00$/, "");
  };

  // Calcular precio con descuento por transferencia (ej: 10% menos)
  const discountTransferPercent = product.cashTransferDiscountPercent || 10;
  const transferPrice = Math.round(product.price * (1 - discountTransferPercent / 100));

  // Cuotas estimadas (6 cuotas)
  const quotaAmount = Math.round(product.price / 6);

  const handleSizeClick = (e: React.MouseEvent, size: string, inStock: boolean) => {
    e.stopPropagation();
    if (!inStock) return;
    setSelectedSize(size);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product, selectedSize);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2200);
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalWishlist(!localWishlist);
    onToggleWishlist?.(product.id);
  };

  return (
    <article
      className="group relative flex flex-col bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Contenedor de Imagen y Badges */}
      <div className="relative aspect-4/5 w-full bg-slate-50 overflow-hidden cursor-pointer" onClick={() => onQuickView?.(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges superiores (Descuento o Nuevo) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start z-10">
          {product.isOffer && (
            <span className="bg-red-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs flex items-center gap-1">
              {product.offerTag || `SALE ${product.discountPercent || 15}% OFF`}
            </span>
          )}
          {product.isNew && !product.isOffer && (
            <span className="bg-[#06241d] text-[#c2f25b] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
              NUEVO
            </span>
          )}
        </div>

        {/* Botón de Favoritos (Corazón) */}
        <button
          onClick={handleHeartClick}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 ${
            localWishlist
              ? "bg-rose-50 text-rose-600 shadow-sm"
              : "bg-white/90 text-slate-600 hover:text-rose-600 hover:bg-white shadow-xs backdrop-blur-xs"
          }`}
          aria-label={localWishlist ? "Quitar de favoritos" : "Guardar en favoritos"}
          title={localWishlist ? "Quitar de favoritos" : "Guardar en favoritos"}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              localWishlist ? "fill-rose-600 scale-110" : ""
            }`}
          />
        </button>

        {/* Botón flotante de Vista Rápida en hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickView?.(product);
          }}
          className={`absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transition-all duration-200 backdrop-blur-xs z-10 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Vista rápida</span>
        </button>
      </div>

      {/* 2. Selector de Talles directo en la Card (Referencia Imagen 1) */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-100/80">
          {product.sizes.map((s) => {
            const isSelected = selectedSize === s.size;
            const inStock = s.inStock;

            return (
              <button
                key={s.size}
                type="button"
                disabled={!inStock}
                onClick={(e) => handleSizeClick(e, s.size, inStock)}
                className={`min-w-7 h-7 px-1.5 rounded text-[11px] font-bold tracking-tight border flex items-center justify-center transition-all select-none relative ${
                  !inStock
                    ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed overflow-hidden"
                    : isSelected
                    ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-950 cursor-pointer"
                }`}
                title={!inStock ? `Talle ${s.size} sin stock` : `Talle ${s.size}`}
              >
                <span>{s.size}</span>
                {/* Diagonal tachada si no hay stock (como en la Imagen 1) */}
                {!inStock && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-[120%] h-[1px] bg-slate-300 -rotate-45" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Información del Producto */}
      <div className="p-3.5 flex flex-col grow justify-between gap-3">
        <div className="space-y-1">
          {/* Marca / Categoría */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-slate-600">
            <span>{product.brand}</span>
            {product.discipline && (
              <span className="text-[10px] text-slate-600 lowercase bg-slate-100 px-1.5 py-0.5 rounded">
                {product.discipline}
              </span>
            )}
          </div>

          {/* Nombre */}
          <h3
            onClick={() => onQuickView?.(product)}
            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 cursor-pointer leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Precios y Cuotas */}
          <div className="pt-1 space-y-0.5">
            {/* Precio tachado original si hay oferta */}
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                {product.discountPercent && (
                  <span className="text-[10px] font-bold text-red-600">
                    {product.discountPercent}% OFF
                  </span>
                )}
              </div>
            )}

            {/* Precio Principal */}
            <div className="text-base sm:text-lg font-black text-slate-950 tracking-tight">
              {formatPrice(product.price)}
            </div>

            {/* Cuotas sin interés */}
            <div className="text-[11px] font-semibold text-slate-600">
              6 cuotas de{" "}
              <strong className="text-slate-900 font-bold">
                {formatPrice(quotaAmount)}
              </strong>
            </div>

            {/* Precio especial por Transferencia / Efectivo (Estilo Imagen 1 y Matacos) */}
            <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 pt-0.5">
              <span>{formatPrice(transferPrice)}</span>
              <span className="text-[10px] font-normal text-emerald-800">
                con Transferencia ({discountTransferPercent}% OFF)
              </span>
            </div>
          </div>

          {/* Badges de Entrega y Stock (Referencia Dexter / Imagen 2) */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-slate-600">
            {product.freeShipping && (
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <Truck className="w-3 h-3 text-emerald-800" />
                <span>Envío Gratis</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              <Store className="w-3 h-3 text-emerald-800" />
              <span>Retiro en Saavedra 241</span>
            </span>
          </div>
        </div>

        {/* 4. Botón de Agregar al Carrito */}
        <div className="pt-2">
          <button
            onClick={handleAdd}
            disabled={product.inStock === false}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
              addedAnimation
                ? "bg-emerald-600 text-white"
                : product.inStock === false
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-[#06241d] text-white hover:shadow"
            }`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>¡Agregado al Carrito!</span>
              </>
            ) : product.inStock === false ? (
              <span>Sin Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-[#00D615]" />
                <span>
                  Agregar {selectedSize ? `(Talle ${selectedSize})` : ""}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
