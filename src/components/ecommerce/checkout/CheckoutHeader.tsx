"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Lock } from "lucide-react";

export function CheckoutHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
      {/* 1. Main Bar: Logo on Left, Compra Segura on Right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Official Matacos Deportes Logo */}
        <Link
          href="/"
          className="flex items-center group"
          title="Matacos Deportes - Saavedra 241, Formosa"
        >
          <img
            src="/matacos-deportes-logo.png"
            alt="Matacos Deportes"
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
          />
        </Link>

        {/* Right: Compra Segura badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-950 text-xs sm:text-sm font-bold shadow-2xs">
          <Lock className="w-4 h-4 text-[#00A811]" />
          <span className="tracking-tight">Compra 100% Segura</span>
        </div>
      </div>

      {/* 2. Sub-Bar directly below: Volver Button + Migas de Pan */}
      <div className="bg-slate-50/90 border-t border-slate-100 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-200/70 cursor-pointer"
            title="Volver al paso anterior"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
            <span>Volver</span>
          </button>

          <span className="text-slate-300">|</span>

          {/* Migas de Pan */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Inicio
            </Link>
            <span className="text-slate-400">/</span>
            <Link href="/catalogo" className="hover:text-slate-900 transition-colors">
              Catálogo
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-950 font-bold">Finalizar Compra</span>
          </nav>
        </div>
      </div>
    </header>
  );
}
