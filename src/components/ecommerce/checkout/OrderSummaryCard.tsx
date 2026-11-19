"use client";

import React from "react";
import Image from "next/image";
import {
  ShoppingBag,
  ShieldCheck,
  Lock,
  Truck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ShippingMethod } from "@/schemas/ecommerce";

export interface OrderSummaryItem {
  id: string;
  name: string;
  brand?: string;
  size?: string;
  color?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderSummaryCardProps {
  items: OrderSummaryItem[];
  shippingMethod: ShippingMethod;
  shippingCost: number;
  subtotal: number;
  discountAmount?: number;
  isSticky?: boolean;
  className?: string;
}

export function OrderSummaryCard({
  items,
  shippingMethod,
  shippingCost,
  subtotal,
  discountAmount = 0,
  isSticky = true,
  className = "",
}: OrderSummaryCardProps) {
  const isFreeShipping = shippingMethod === "RETIRO_LOCAL" || shippingCost === 0;
  const effectiveShippingCost = isFreeShipping ? 0 : shippingCost;
  const total = Math.max(0, subtotal - discountAmount + effectiveShippingCost);

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5 ${
        isSticky ? "lg:sticky lg:top-24" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#00A811]" />
          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Resumen de tu Compra
          </h3>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {items.reduce((acc, i) => acc + i.quantity, 0)} {items.length === 1 ? "artículo" : "artículos"}
        </span>
      </div>

      {/* Lista compacta de artículos */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="font-bold text-slate-900 truncate block">
                {item.name}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                {item.size && <span>Talle: {item.size}</span>}
                {item.color && <span>• {item.color}</span>}
                <span>• Cant: {item.quantity}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-bold text-slate-900 block">
                {formatCurrency(item.price * item.quantity)}
              </span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-[10px] text-slate-400 line-through block">
                  {formatCurrency(item.originalPrice * item.quantity)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desglose de Importes y Recálculo Automático (Subtarea 4) */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>Subtotal artículos:</span>
          <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-emerald-700 font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ahorro en promociones:</span>
            </span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-600">
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span>Costo de envío:</span>
          </span>
          <span
            className={`font-black ${
              isFreeShipping ? "text-[#00A811]" : "text-slate-900"
            }`}
          >
            {isFreeShipping ? "GRATIS" : formatCurrency(effectiveShippingCost)}
          </span>
        </div>

        {/* Total Final */}
        <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between text-slate-950">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              Total Final
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              IVA e impuestos incluidos
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-tight">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Garantías y sellos de seguridad */}
      <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#00A811] shrink-0" />
          <span>Garantía oficial y cambio directo en Saavedra 241</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Cobro 100% seguro con cifrado SSL</span>
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Derecho de arrepentimiento oficial (Ley 24.240)</span>
        </div>
      </div>
    </div>
  );
}
