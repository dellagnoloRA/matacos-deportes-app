"use client";

import React, { useState } from "react";

interface WebTrafficChartProps {
  className?: string;
}

const TRAFFIC_DATA = [
  { source: "Google", visits: 22000, color: "bg-emerald-500 hover:bg-emerald-400" },
  { source: "Whatsapp", visits: 28000, color: "bg-emerald-500 hover:bg-emerald-400" },
  { source: "Instagram", visits: 21000, color: "bg-neutral-900 hover:bg-neutral-800" },
  { source: "Facebook", visits: 29000, color: "bg-emerald-500 hover:bg-emerald-400" },
  { source: "Otro", visits: 12000, color: "bg-slate-300 hover:bg-slate-400" },
];

export function WebTrafficChart({ className = "" }: WebTrafficChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxVisits = 32000;

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between ${className}`}
    >
      <h3 className="text-xs font-bold text-slate-900 tracking-tight mb-4">
        Tráfico de la Página Web
      </h3>

      <div className="relative flex items-end justify-between pt-4 pb-2">
        {/* Y-Axis scale on left */}
        <div className="flex flex-col justify-between h-40 text-[10px] text-slate-400 font-sans pr-3 select-none pb-5">
          <span>30K</span>
          <span>20K</span>
          <span>10K</span>
          <span>0</span>
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex items-end justify-around h-40 border-b border-slate-100 pb-2 relative">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
            <div className="border-b border-slate-100/70 w-full" />
            <div className="border-b border-slate-100/70 w-full" />
            <div className="border-b border-slate-100/70 w-full" />
            <div className="border-b border-slate-100/70 w-full" />
          </div>

          {TRAFFIC_DATA.map((item, idx) => {
            const heightPercent = (item.visits / maxVisits) * 100;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.source}
                className="flex flex-col items-center gap-2 group relative z-10"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-7 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20">
                    {item.visits.toLocaleString("es-AR")} visitas
                  </div>
                )}

                {/* Vertical Pill Bar */}
                <div className="h-36 flex items-end justify-center w-6">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-4 rounded-full transition-all duration-300 ${item.color} ${
                      isHovered ? "scale-105 shadow-sm" : ""
                    }`}
                  />
                </div>

                {/* Bottom Source Label */}
                <span
                  className={`text-[10.5px] font-medium transition-colors ${
                    isHovered ? "text-slate-900 font-bold" : "text-slate-500"
                  }`}
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
