"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";
import type { FeaturedDisciplineItem } from "@/types/ecommerce";

interface FeaturedDisciplinesGridProps {
  disciplines?: FeaturedDisciplineItem[];
}

const FALLBACK_DISCIPLINES: FeaturedDisciplineItem[] = [
  {
    id: "disc-natacion",
    key: "natacion",
    name: "Natación",
    slug: "natacion",
    subtitle: "Antiparras de competición, mallas Speedo y accesorios acuáticos",
    imageUrl:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80",
    linkUrl: "/catalogo?disciplineSlug=natacion",
    filterType: "discipline",
    availableProductsCount: 18,
  },
  {
    id: "disc-voley",
    key: "voley",
    name: "Vóley Profesional",
    slug: "voley",
    subtitle: "Pelotas oficiales Mikasa FIVB, rodilleras pro e indumentaria de juego",
    imageUrl:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=80",
    linkUrl: "/catalogo?disciplineSlug=voley",
    filterType: "discipline",
    availableProductsCount: 14,
  },
  {
    id: "disc-crocs",
    key: "crocs",
    name: "Crocs Oficial",
    slug: "crocs",
    subtitle: "Línea oficial de clogs, sandalias y slides con confort ergonómico",
    imageUrl:
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=900&q=80",
    linkUrl: "/catalogo?disciplineSlug=crocs",
    filterType: "discipline",
    availableProductsCount: 16,
  },
  {
    id: "disc-fitness",
    key: "fitness",
    name: "Fitness & Gimnasio",
    slug: "fitness",
    subtitle: "Equipamiento para entrenamiento funcional, fuerza y accesorios",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
    linkUrl: "/catalogo?disciplineSlug=fitness",
    filterType: "discipline",
    availableProductsCount: 22,
  },
];

export function FeaturedDisciplinesGrid({
  disciplines = FALLBACK_DISCIPLINES,
}: FeaturedDisciplinesGridProps) {
  const source = disciplines && disciplines.length > 0 ? disciplines : FALLBACK_DISCIPLINES;
  // Matacos no vende calzado deportivo, solo Crocs: filtrar cualquier entrada de calzado
  const items = source.filter(
    (d) =>
      d.key !== "calzado" &&
      d.slug !== "calzado" &&
      !d.name.toLowerCase().includes("calzado")
  );

  return (
    <section
      id="disciplinas"
      aria-label="Disciplinas insignia y especialidades"
      className="w-full py-14 sm:py-20 bg-slate-900 text-white relative overflow-hidden"
    >
      {/* Background decorative glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#00D615]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-[#00D615]">
              <Trophy className="w-3.5 h-3.5 text-[#00D615]" />
              <span>NUESTRAS ESPECIALIDADES</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight uppercase">
              Comprá por Disciplina
            </h2>
          </div>

          <Link
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-[#00D615] transition-colors self-start sm:self-auto"
          >
            <span>Ver todo el catálogo</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Flagship Disciplines Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((disc) => (
            <Link
              key={disc.id || disc.slug}
              href={disc.linkUrl}
              className="group relative h-80 sm:h-96 rounded-3xl overflow-hidden border border-slate-800 hover:border-[#00D615] transition-all duration-300 shadow-lg flex flex-col justify-end p-5 select-none"
            >
              {/* Background Image with Zoom */}
              <img
                src={disc.imageUrl}
                alt={disc.name}
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
              />

              {/* Dark Vignette Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-transparent group-hover:via-slate-950/40 transition-colors" />

              {/* Card Content */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-xs text-[#00D615] border border-emerald-500/30">
                    {disc.availableProductsCount > 0
                      ? `${disc.availableProductsCount} artículos`
                      : "Disponible"}
                  </span>

                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-xs text-white group-hover:bg-[#00D615] group-hover:text-slate-950 flex items-center justify-center transition-all duration-200 shadow-xs">
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white group-hover:text-[#00D615] transition-colors leading-tight">
                    {disc.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-normal line-clamp-2 mt-1 leading-relaxed">
                    {disc.subtitle}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-[#c2f25b] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Explorar colección</span>
                  <span>&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
