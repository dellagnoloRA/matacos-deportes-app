"use client";

import React from "react";
import { Ruler, Check } from "lucide-react";
import type { ColorOption, SizeOption, PublicVariantItem } from "@/types/ecommerce";

interface ProductVariantSelectorProps {
  colorOptions: ColorOption[];
  sizeOptions: SizeOption[];
  variants: PublicVariantItem[];
  selectedColor: string | null;
  selectedSize: string | null;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: string) => void;
  onOpenSizeGuide: () => void;
}

export function ProductVariantSelector({
  colorOptions,
  sizeOptions,
  variants,
  selectedColor,
  selectedSize,
  onSelectColor,
  onSelectSize,
  onOpenSizeGuide,
}: ProductVariantSelectorProps) {
  // Check if a specific (color, size) combo is in stock
  const isComboAvailable = (color: string | null, size: string | null) => {
    if (!color || !size) return true;
    const match = variants.find(
      (v) =>
        v.color.trim().toLowerCase() === color.trim().toLowerCase() &&
        v.size.trim().toLowerCase() === size.trim().toLowerCase()
    );
    return match ? match.inStock && match.availableStock > 0 : false;
  };

  return (
    <div className="space-y-6">
      {/* 1. Color Selector */}
      {colorOptions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">
              Color:{" "}
              <strong className="text-slate-900 font-extrabold">
                {selectedColor || "Seleccioná un color"}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {colorOptions.map((c) => {
              const isSelected = selectedColor === c.color;
              return (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => onSelectColor(c.color)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "border-[#00D615] bg-emerald-50/60 text-slate-950 ring-2 ring-[#00D615]/30 shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#00A811]" />}
                  <span>{c.color}</span>
                  {!c.inStock && (
                    <span className="text-[10px] text-slate-400 font-medium">(Agotado)</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Size Selector */}
      {sizeOptions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider">
              Talle:{" "}
              <strong className="text-slate-900 font-extrabold">
                {selectedSize || "Seleccioná tu talle"}
              </strong>
            </span>

            <button
              type="button"
              onClick={onOpenSizeGuide}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00A811] hover:underline cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Guía de talles</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {sizeOptions.map((s) => {
              const isSelected = selectedSize === s.size;
              const hasStock = isComboAvailable(selectedColor, s.size);

              return (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => onSelectSize(s.size)}
                  className={`min-w-11 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-slate-950 text-white border-slate-950 shadow-xs font-black"
                      : hasStock
                      ? "bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                      : "bg-slate-100 text-slate-400 border-slate-200 opacity-60 line-through"
                  }`}
                  title={
                    hasStock
                      ? `${s.size} (Disponible)`
                      : `${s.size} (Sin stock en esta combinación)`
                  }
                >
                  <span>{s.size}</span>
                  {s.availableStock > 0 && s.availableStock <= 3 && (
                    <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

