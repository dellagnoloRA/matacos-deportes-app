"use client";

import React, { useState } from "react";

interface ProvinceTrafficChartProps {
  className?: string;
}

interface SliceData {
  province: string;
  percentage: number;
  color: string;
  dotClass: string;
}

const PROVINCES: SliceData[] = [
  { province: "Formosa", percentage: 52.1, color: "#22c55e", dotClass: "bg-emerald-500" },
  { province: "Buenos Aires", percentage: 22.8, color: "#1e293b", dotClass: "bg-slate-800" },
  { province: "Santiago del Estero", percentage: 13.9, color: "#64748b", dotClass: "bg-slate-500" },
  { province: "Tierra del Fuego", percentage: 11.2, color: "#cbd5e1", dotClass: "bg-slate-300" },
];

export function ProvinceTrafficChart({ className = "" }: ProvinceTrafficChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Donut calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.32
  let accumulatedOffset = 0;

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between ${className}`}
    >
      <h3 className="text-xs font-bold text-slate-900 tracking-tight mb-3">
        Tráfico por provincia
      </h3>

      <div className="flex items-center justify-between gap-4 my-auto">
        {/* Donut Chart SVG */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {PROVINCES.map((p, idx) => {
              const strokeLength = (p.percentage / 100) * circumference;
              const gap = 2; // slight gap between segments
              const adjustedStroke = Math.max(0, strokeLength - gap);
              const strokeDasharray = `${adjustedStroke} ${circumference - adjustedStroke}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += strokeLength;

              const isHovered = hoveredIndex === idx;

              return (
                <circle
                  key={p.province}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={p.color}
                  strokeWidth={isHovered ? "17" : "14"}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>

          {/* Center Cutout text / badge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] font-bold text-slate-800">
              {hoveredIndex !== null
                ? `${PROVINCES[hoveredIndex].percentage}%`
                : "100%"}
            </span>
            <span className="text-[9px] text-slate-400">
              {hoveredIndex !== null
                ? PROVINCES[hoveredIndex].province.split(" ")[0]
                : "Total"}
            </span>
          </div>
        </div>

        {/* Legend List on Right */}
        <div className="flex-1 space-y-2 text-xs">
          {PROVINCES.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={p.province}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between gap-2 px-1.5 py-0.5 rounded-md cursor-pointer transition-colors ${
                  isHovered ? "bg-slate-100 font-semibold" : "text-slate-600"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${p.dotClass}`} />
                  <span className="truncate text-[11px]">{p.province}</span>
                </div>
                <span className="font-semibold text-slate-900 text-[11px] shrink-0">
                  {p.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
