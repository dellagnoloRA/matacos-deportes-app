"use client";

import React, { useState } from "react";
import type { DisciplineSalesBarDTO } from "@/schemas/analytics";

interface WebTrafficChartProps {
  className?: string;
  data?: DisciplineSalesBarDTO[];
}

const DEFAULT_DISCIPLINES: DisciplineSalesBarDTO[] = [
  {
    disciplineId: "natacion",
    source: "Natación",
    fullName: "Natación",
    revenue: 160000,
    formattedRevenue: "$ 160.000,00",
    unitsSold: 3,
    color: "bg-slate-900 hover:bg-slate-800",
  },
  {
    disciplineId: "voley",
    source: "Vóley",
    fullName: "Vóley",
    revenue: 145000,
    formattedRevenue: "$ 145.000,00",
    unitsSold: 1,
    color: "bg-emerald-600 hover:bg-emerald-500",
  },
  {
    disciplineId: "crocs",
    source: "Crocs",
    fullName: "Crocs",
    revenue: 116000,
    formattedRevenue: "$ 116.000,00",
    unitsSold: 2,
    color: "bg-emerald-600 hover:bg-emerald-500",
  },
  {
    disciplineId: "indumentaria",
    source: "Indumentaria",
    fullName: "Indumentaria",
    revenue: 68000,
    formattedRevenue: "$ 68.000,00",
    unitsSold: 1,
    color: "bg-emerald-600 hover:bg-emerald-500",
  },
  {
    disciplineId: "fitness",
    source: "Fitness",
    fullName: "Fitness & Entrenamiento",
    revenue: 49000,
    formattedRevenue: "$ 49.000,00",
    unitsSold: 1,
    color: "bg-emerald-600 hover:bg-emerald-500",
  },
];

function formatCompactArs(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`;
  return `$${Math.round(val)}`;
}

export function WebTrafficChart({ className = "", data }: WebTrafficChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const items = data && data.length > 0 ? data : DEFAULT_DISCIPLINES;

  const rawMax = Math.max(10000, ...items.map((i) => i.revenue));
  const stepUnit = Math.ceil(rawMax / 3 / 5000) * 5000 || 10000;
  const maxRevenue = stepUnit * 3;

  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-md shadow-slate-900/5 border border-slate-300/80 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Ventas por Disciplina
        </h3>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
          Rotación por rubro
        </span>
      </div>

      <div className="relative flex items-end justify-between pt-3 pb-1">
        {/* Y-Axis scale on left */}
        <div className="flex flex-col justify-between h-44 text-xs font-semibold text-slate-600 font-sans pr-3 select-none pb-6">
          <span>{formatCompactArs(maxRevenue)}</span>
          <span>{formatCompactArs(stepUnit * 2)}</span>
          <span>{formatCompactArs(stepUnit)}</span>
          <span>$0</span>
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex items-end justify-around h-44 border-b border-slate-300 pb-2 relative">
          {/* Horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-dashed border-slate-200 w-full" />
            <div className="border-b border-slate-300 w-full" />
          </div>

          {items.map((item, idx) => {
            const heightPercent = Math.max(
              10,
              Math.min(100, (item.revenue / maxRevenue) * 100)
            );
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.disciplineId}
                className="flex flex-col items-center gap-2 group relative z-10"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-11 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-lg pointer-events-none whitespace-nowrap z-20 text-center border border-slate-700">
                    <div>{item.formattedRevenue}</div>
                    <div className="text-[11px] text-emerald-300 font-semibold">
                      {item.unitsSold} un. ({item.fullName})
                    </div>
                  </div>
                )}

                {/* Vertical Bar */}
                <div className="h-36 flex items-end justify-center w-9 cursor-pointer">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-6 rounded-xl transition-all duration-300 ${item.color} ${
                      isHovered ? "scale-105 shadow-md ring-2 ring-emerald-400/50" : ""
                    }`}
                  />
                </div>

                {/* Bottom Source Label */}
                <span
                  className={`text-xs font-semibold transition-colors truncate max-w-[74px] ${
                    isHovered ? "text-slate-950 font-extrabold" : "text-slate-700"
                  }`}
                  title={item.fullName}
                >
                  {item.source}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
