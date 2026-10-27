"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  Zap,
  MessageCircle,
  MapPin,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PublicVariantItem } from "@/types/ecommerce";

interface ProductActionBoxProps {
  productName: string;
  price: number;
  selectedVariant: PublicVariantItem | null;
  selectedColor: string | null;
  selectedSize: string | null;
  onAddToCart: (quantity: number) => void;
  onBuyNow: (quantity: number) => void;
}

export function ProductActionBox({
  productName,
  price,
  selectedVariant,
  selectedColor,
  selectedSize,
  onAddToCart,
  onBuyNow,
}: ProductActionBoxProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const availableStock = selectedVariant ? selectedVariant.availableStock : 0;
  const isAvailable = selectedVariant ? selectedVariant.inStock && availableStock > 0 : false;
  const effectivePrice = selectedVariant?.price ? selectedVariant.price : price;

  const handleQtyChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > availableStock) return availableStock;
      return next;
    });
  };

  const handleAdd = () => {
    if (!isAvailable) return;
    setIsAdding(true);
    onAddToCart(quantity);
    setTimeout(() => setIsAdding(false), 800);
  };

  const handleBuy = () => {
    if (!isAvailable) return;
    onBuyNow(quantity);
  };

  // RF-18: Pre-build contextual WhatsApp inquiry link
  const currentUrl = typeof window !== "undefined" ? window.location.href : "https://matacosdeportes.com.ar";
  const waText = encodeURIComponent(
    `¡Hola Matacos Deportes! Quiero consultar por ${productName} (Talle: ${
      selectedSize || "A consultar"
    }, Color: ${selectedColor || "A consultar"}) por ${formatCurrency(
      effectivePrice
    )}. Visto en la tienda: ${currentUrl}`
  );
  const waUrl = `https://wa.me/5493704000000?text=${waText}`;

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100">
      {/* 1. Stock Status Badge */}
      <div>
        {selectedVariant ? (
          isAvailable ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00D615] animate-ping" />
              <span>
                {availableStock <= 3
                  ? `¡Últimas ${availableStock} unidades disponibles en Saavedra 241!`
                  : `Stock disponible: ${availableStock} unidades en el local`}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Agotado temporalmente en este talle y color</span>
            </div>
          )
        ) : (
          <p className="text-xs text-slate-500 font-medium italic">
            Seleccioná un talle y color para ver existencias exactas.
          </p>
        )}
      </div>

      {/* 2. Quantity & Action Buttons */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Quantity selector */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              disabled={!isAvailable || quantity <= 1}
              className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-extrabold text-sm text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              disabled={!isAvailable || quantity >= availableStock}
              className="p-2 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!isAvailable}
            className="flex-1 py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isAdding ? (
              <>
                <Check className="w-4 h-4 text-[#00D615]" />
                <span>¡Agregado!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar al carrito</span>
              </>
            )}
          </button>
        </div>

        {/* Buy Now Button */}
        <button
          type="button"
          onClick={handleBuy}
          disabled={!isAvailable}
          className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 active:scale-98 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>COMPRAR AHORA</span>
        </button>

        {/* RF-18: WhatsApp Direct Assistance Button */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl border border-emerald-600/40 text-emerald-800 hover:bg-emerald-50/80 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>Consultar por WhatsApp con un vendedor</span>
        </a>
      </div>

      {/* 3. In-store & Delivery Information */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs text-slate-700">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900">Retiro GRATIS en el local</p>
            <p className="text-[11px] text-slate-500">
              Saavedra 241, Formosa Capital • Listo en menos de 1 hora
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
          <Truck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900">Opciones de entrega a domicilio</p>
            <p className="text-[11px] text-slate-500">
              Cadetería en Formosa ($ 2.500) • Correo Argentino a todo el país ($ 7.500)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900">Garantía oficial y cambio en el local</p>
            <p className="text-[11px] text-slate-500">
              Productos 100% originales con respaldo de Matacos Deportes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

