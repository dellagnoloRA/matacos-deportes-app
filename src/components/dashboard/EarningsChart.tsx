"use client";

import React, { useState } from "react";
import { ChartDataPoint } from "./types";

interface EarningsChartProps {
  className?: string;
}

const EARNINGS_DATA: ChartDataPoint[] = [
  { month: "Enero", currentYear: 12000, lastYear: 7000 },
  { month: "Febrero", currentYear: 15500, lastYear: 12800 },
  { month: "Marzo", currentYear: 13200, lastYear: 16500 },
  { month: "Abril", currentYear: 17800, lastYear: 11000 },
  { month: "Mayo", currentYear: 26900, lastYear: 18500 },
  { month: "Junio", currentYear: 21500, lastYear: 23200 },
  { month: "Julio", currentYear: 24800, lastYear: 28400 },
];

const BEST_SELLERS_DATA: ChartDataPoint[] = [
  { month: "Enero", currentYear: 18000, lastYear: 9000 },
  { month: "Febrero", currentYear: 22000, lastYear: 14000 },
  { month: "Marzo", currentYear: 19500, lastYear: 17000 },
  { month: "Abril", currentYear: 24000, lastYear: 15000 },
  { month: "Mayo", currentYear: 29000, lastYear: 20000 },
  { month: "Junio", currentYear: 26000, lastYear: 24000 },
  { month: "Julio", currentYear: 28500, lastYear: 27000 },
];

const STATUS_DATA: ChartDataPoint[] = [
  { month: "Enero", currentYear: 10000, lastYear: 8000 },
  { month: "Febrero", currentYear: 14000, lastYear: 11000 },
  { month: "Marzo", currentYear: 16000, lastYear: 15000 },
  { month: "Abril", currentYear: 15000, lastYear: 13000 },
  { month: "Mayo", currentYear: 22000, lastYear: 17000 },
  { month: "Junio", currentYear: 19000, lastYear: 21000 },
  { month: "Julio", currentYear: 23000, lastYear: 25000 },
];

function getCubicBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 5;
    const cp1y = p1.y + (p2.y - p0.y) / 5;
    const cp2x = p2.x - (p3.x - p1.x) / 5;
    const cp2y = p2.y - (p3.y - p1.y) / 5;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function EarningsChart({ className = "" }: EarningsChartProps) {
  const [activeTab, setActiveTab] = useState<"earnings" | "bestsellers" | "status">("earnings");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeDataset =
    activeTab === "earnings"
      ? EARNINGS_DATA
      : activeTab === "bestsellers"
      ? BEST_SELLERS_DATA
      : STATUS_DATA;

  // Chart dimensions
  const width = 600;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = 30000;

  const getX = (index: number) => paddingLeft + (index / (activeDataset.length - 1)) * chartWidth;
  const getY = (val: number) => paddingTop + chartHeight - (val / maxValue) * chartHeight;

  const currentYearPoints = activeDataset.map((d, i) => ({
    x: getX(i),
    y: getY(d.currentYear),
  }));

  const lastYearPoints = activeDataset.map((d, i) => ({
    x: getX(i),
    y: getY(d.lastYear),
  }));

  const currentYearPath = getCubicBezierPath(currentYearPoints);
  const lastYearPath = getCubicBezierPath(lastYearPoints);

  const yLabels = [
    { label: "30K", val: 30000 },
    { label: "20K", val: 20000 },
    { label: "10K", val: 10000 },
    { label: "0", val: 0 },
  ];

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between ${className}`}
    >
      {/* Header with Tabs on the left and Legend on the right */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100/80">
        {/* Left Tabs */}
        <div className="flex items-center gap-5 text-xs">
          <button
            onClick={() => setActiveTab("earnings")}
            className={`font-semibold transition-colors relative py-1 ${
              activeTab === "earnings"
                ? "text-slate-900 after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Total de Ganancias
          </button>
          <button
            onClick={() => setActiveTab("bestsellers")}
            className={`font-medium transition-colors relative py-1 ${
              activeTab === "bestsellers"
                ? "text-slate-900 font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Productos más vendidos
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`font-medium transition-colors relative py-1 ${
              activeTab === "status"
                ? "text-slate-900 font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Operating Status
          </button>
        </div>

        {/* Right Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-sky-400 bg-sky-100" />
            <span className="text-slate-500 text-[11px]">Año pasado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span className="text-slate-800 text-[11px] font-semibold">Año Actual</span>
          </div>
        </div>
      </div>

      {/* SVG Responsive Line Chart */}
      <div className="relative w-full pt-4 h-60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
        >
          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yLabels.map((item) => {
            const y = getY(item.val);
            return (
              <g key={item.val}>
                <text
                  x={paddingLeft - 12}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] font-sans"
                >
                  {item.label}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray={item.val === 0 ? "none" : "2 2"}
                />
              </g>
            );
          })}

          {/* Last Year Dashed Spline Curve */}
          <path
            d={lastYearPath}
            fill="none"
            stroke="#93c5fd"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="transition-all duration-300"
          />

          {/* Current Year Solid Spline Curve */}
          <path
            d={currentYearPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Interactive Hover Vertical Bars and Points */}
          {activeDataset.map((d, i) => {
            const x = getX(i);
            const yCurrent = getY(d.currentYear);
            const yLast = getY(d.lastYear);
            const isHovered = hoveredIndex === i;

            return (
              <g key={d.month} className="cursor-pointer">
                {/* Invisible hover hotspot */}
                <rect
                  x={x - 25}
                  y={paddingTop}
                  width={50}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* X-Axis Month Label */}
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered ? "fill-slate-900 font-bold" : "fill-slate-400"
                  }`}
                >
                  {d.month}
                </text>

                {/* Vertical guide on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={height - paddingBottom}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Points */}
                {isHovered && (
                  <>
                    <circle
                      cx={x}
                      cy={yLast}
                      r={4}
                      fill="#93c5fd"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                    <circle
                      cx={x}
                      cy={yCurrent}
                      r={5}
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="drop-shadow-sm"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute -top-3 pointer-events-none bg-slate-900/90 backdrop-blur-xs text-white text-[11px] py-1.5 px-3 rounded-lg shadow-xl border border-slate-700/60 transform -translate-x-1/2 transition-all flex flex-col gap-0.5 z-20"
            style={{
              left: `${(getX(hoveredIndex) / width) * 100}%`,
            }}
          >
            <span className="font-semibold text-slate-300 border-b border-slate-700 pb-0.5 mb-0.5">
              {activeDataset[hoveredIndex].month}
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 text-[10px]">Año Actual:</span>
              <span className="font-bold text-white">
                ${activeDataset[hoveredIndex].currentYear.toLocaleString("es-AR")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sky-300 text-[10px]">Año Pasado:</span>
              <span className="font-semibold text-sky-200">
                ${activeDataset[hoveredIndex].lastYear.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
