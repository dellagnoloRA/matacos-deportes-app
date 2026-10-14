"use client";

import React from "react";
import { EcommerceCategory } from "./types";
import { MOCK_CATEGORIES } from "./mockData";
import { ArrowRight } from "lucide-react";

interface CategoryGridProps {
  categories?: EcommerceCategory[];
  onSelectCategory?: (slug: string) => void;
}

export function CategoryGrid({
  categories = MOCK_CATEGORIES,
  onSelectCategory,
}: CategoryGridProps) {
  return (
    <section className="w-full py-12 sm:py-16 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00A811]">
            ENCONTRÁ TU EQUIPO
          </span>
          <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-slate-950 uppercase">
            EXPLORÁ POR CATEGORÍA
          </h2>
        </div>

        {/* Categories Grid / Horizontal Scroll */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.slug)}
              className="group flex flex-col items-center bg-white rounded-2xl p-2.5 border border-slate-200/80 hover:border-[#00D615] shadow-xs hover:shadow-lg transition-all duration-300 text-left overflow-hidden cursor-pointer"
            >
              {/* Image Frame with Rounded Corners */}
              <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-100 relative mb-3">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Title */}
              <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#00A811] transition-colors text-center pb-1">
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Action Button: VER MÁS */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => onSelectCategory?.("todas")}
            className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider px-8 py-3 rounded-lg shadow-sm hover:shadow transition-all duration-200"
          >
            <span>VER MÁS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
