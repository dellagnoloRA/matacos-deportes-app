"use client";

import React, { useState } from "react";
import type { LogisticsDistributionSliceDTO } from "@/schemas/analytics";

interface ProvinceTrafficChartProps {
  className?: string;
  data?: LogisticsDistributionSliceDTO[];
}

const DEFAULT_SLICES: LogisticsDistributionSliceDTO[] = [
  {
    id: "mostrador",
    province: "Mostrador Saavedra 241",
    count: 5,
    revenue: 340000,
    formattedRevenue: "$ 340.000,00",
    percentage: 55.6,
    color: "#10b981",
    dotClass: "bg-emerald-500",
  },
  {
    id: "cadeteria",
    province: "Cadetería Formosa",
    count: 2,
    revenue: 120000,
    formattedRevenue: "$ 120.000,00",
    percentage: 22.2,
    color: "#0f172a",
    dotClass: "bg-slate-900",
  },
  {
    id: "retiro",
    province: "Retiro en Tienda Web",
    count: 1,
    revenue: 68000,
    formattedRevenue: "$ 68.000,00",
    percentage: 11.1,
    color: "#0284c7",
    dotClass: "bg-sky-600",
  },
  {
    id: "nacional",
    province: "Correo Argentino (País)",
    count: 1,
    revenue: 145000,
    formattedRevenue: "$ 145.000,00",
    percentage: 11.1,
    color: "#f59e0b",
    dotClass: "bg-amber-500",
  },
];

export function ProvinceTrafficChart({
  className = "",
  data,
}: ProvinceTrafficChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const slices = data && data.length > 0 ? data : DEFAULT_SLICES;
  const totalOps = slices.reduce((acc, s) => acc + s.count, 0);

  // SVG Donut calculation
  const radius = 39;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-md shadow-slate-900/5 border border-slate-300/80 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Distribución Canal y Logística
        </h3>
        <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
          Modalidad
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 my-auto">
        {/* Donut Chart SVG */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {/* Base background track ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="14"
            />
            {slices.map((p, idx) => {
              if (p.percentage <= 0) return null;

              const activeSlicesCount = slices.filter((s) => s.percentage > 0).length;
              const strokeLength = (p.percentage / 100) * circumference;
              const gap = activeSlicesCount > 1 && p.percentage > 2 ? 3 : 0;
              const adjustedStroke = Math.max(0.5, strokeLength - gap);
              const strokeDasharray = `${adjustedStroke} ${circumference - adjustedStroke}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += strokeLength;

              const isHovered = hoveredIndex === idx;

              return (
                <circle
                  key={p.id}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={p.color}
                  strokeWidth={isHovered ? "16" : "14"}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap={activeSlicesCount > 1 ? "round" : "butt"}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="transition-all duration-200 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Center readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            {hoveredIndex !== null && slices[hoveredIndex] ? (
              <>
                <span className="text-sm font-black text-slate-900">
                  {slices[hoveredIndex].percentage}%
                </span>
                <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[78px]">
                  {slices[hoveredIndex].formattedRevenue}
                </span>
                <span className="text-[10px] font-semibold text-slate-600">
                  {slices[hoveredIndex].count} op.
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-black text-slate-900 leading-none">
                  {totalOps}
                </span>
                <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                  Operaciones
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Legend List */}
        <div className="flex-1 space-y-2.5 text-xs min-w-0">
          {slices.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={p.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${
                  isHovered
                    ? "bg-slate-100 font-bold"
                    : hoveredIndex !== null
                    ? "opacity-50"
                    : "hover:bg-slate-50"
                }`}
                title={`${p.province}: ${p.formattedRevenue} (${p.count} ventas)`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-3 h-3 rounded-full shrink-0 ${p.dotClass}`} />
                  <span className="text-slate-800 font-semibold text-xs sm:text-sm truncate">
                    {p.province}
                  </span>
                </div>
                <span className="text-slate-900 font-extrabold text-xs sm:text-sm shrink-0">
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
