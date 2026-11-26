"use client";

import React from "react";
import { EcommerceDiscipline } from "./types";
import { MOCK_DISCIPLINES } from "./mockData";
import { ArrowUpRight } from "lucide-react";

interface DisciplineGridProps {
  disciplines?: EcommerceDiscipline[];
  selectedDiscipline?: string;
  onSelectDiscipline?: (slug: string) => void;
}

export function DisciplineGrid({
  disciplines = MOCK_DISCIPLINES,
  selectedDiscipline,
  onSelectDiscipline,
}: DisciplineGridProps) {
  return (
    <section id="disciplinas" className="w-full py-12 sm:py-16 bg-[#f4f7f4] border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00A811]">
            EN MOVIMIENTO
          </span>
          <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-slate-950 uppercase">
            COMPRÁ POR DISCIPLINA
          </h2>
        </div>

        {/* 8 Disciplines Grid (4 cols on desktop, 2 on tablet/mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {disciplines.map((disc) => {
            const isSelected = selectedDiscipline === disc.slug;
            return (
              <button
                key={disc.id}
                onClick={() => onSelectDiscipline?.(disc.slug)}
                className={`group flex items-center justify-between p-4 rounded-xl border bg-white transition-all duration-200 text-left shadow-2xs hover:shadow-md ${
                  isSelected
                    ? "border-[#00D615] ring-2 ring-[#00D615]/30 bg-emerald-50/40"
                    : "border-slate-200/90 hover:border-slate-400"
                }`}
              >
                <span className="text-sm font-bold text-slate-800 group-hover:text-slate-950 transition-colors">
                  {disc.name}
                </span>
                <ArrowUpRight
                  className={`w-4 h-4 text-[#00A811] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ${
                    isSelected ? "text-[#00D615]" : ""
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
