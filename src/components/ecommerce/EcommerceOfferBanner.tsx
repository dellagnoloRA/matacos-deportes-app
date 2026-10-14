"use client";

import React from "react";
import { ArrowRight, Tag, Truck } from "lucide-react";

interface EcommerceOfferBannerProps {
  onViewOffersClick?: () => void;
}

export function EcommerceOfferBanner({ onViewOffersClick }: EcommerceOfferBannerProps) {
  return (
    <section id="ofertas" className="w-full bg-[#06241d] text-white py-12 sm:py-16 relative overflow-hidden">
      {/* Decorative subtle background accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#00D615]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#00D615]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Content */}
          <div className="max-w-2xl space-y-4">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#00D615] drop-shadow-xs">
              OPORTUNIDADES PARA MOVERTE
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tight text-white uppercase">
              OFERTAS
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-xl">
              Descubrí productos seleccionados a precios de muestra especiales.
              Encontrá tu próximo favorito.
            </p>

            {/* Benefit Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 bg-[#0a382c] border border-emerald-500/40 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-inner">
                <Tag className="w-3.5 h-3.5 text-[#00D615]" />
                <span>Hasta 40% OFF</span>
              </div>

              <div className="inline-flex items-center gap-2 bg-[#0a382c] border border-emerald-500/40 text-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-inner">
                <Truck className="w-3.5 h-3.5 text-[#00D615]" />
                <span>Envío gratis</span>
              </div>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0 flex items-center">
            <a
              href="#productos"
              onClick={onViewOffersClick}
              className="inline-flex items-center justify-center gap-3 bg-[#00D615] hover:bg-[#00b812] active:scale-95 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg shadow-[#00D615]/20 hover:shadow-[#00D615]/40 transition-all duration-200"
            >
              <span>VER OFERTAS</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
