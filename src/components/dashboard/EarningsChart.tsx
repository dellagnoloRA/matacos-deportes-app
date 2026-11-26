"use client";

import React, { useState, useRef, useEffect } from "react";
import { Package, TrendingUp, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  EarningsChartPointDTO,
  TopProductRankingDTO,
} from "@/schemas/analytics";

interface EarningsChartProps {
  className?: string;
  series?: EarningsChartPointDTO[];
  topProducts?: TopProductRankingDTO[];
  periodLabel?: string;
  comparisonLabel?: string;
  canViewFinancials?: boolean;
}

const DEFAULT_SERIES: EarningsChartPointDTO[] = [
  { label: "Sem 1", currentRevenue: 120000, previousRevenue: 70000, currentProfit: 48000, storeRevenue: 85000, webRevenue: 35000 },
  { label: "Sem 2", currentRevenue: 155000, previousRevenue: 128000, currentProfit: 62000, storeRevenue: 105000, webRevenue: 50000 },
  { label: "Sem 3", currentRevenue: 132000, previousRevenue: 165000, currentProfit: 51000, storeRevenue: 92000, webRevenue: 40000 },
  { label: "Sem 4", currentRevenue: 178000, previousRevenue: 110000, currentProfit: 74000, storeRevenue: 118000, webRevenue: 60000 },
  { label: "Sem 5", currentRevenue: 215000, previousRevenue: 185000, currentProfit: 89000, storeRevenue: 145000, webRevenue: 70000 },
];

function getCubicBezierPath(
  points: { x: number; y: number }[],
  baselineY: number,
  topY: number
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const segMinY = Math.max(topY, Math.min(p1.y, p2.y));
    const segMaxY = Math.min(baselineY, Math.max(p1.y, p2.y));

    const cp1x = p1.x + (p2.x - p0.x) / 5;
    const rawCp1y = p1.y + (p2.y - p0.y) / 5;
    const cp1y = Math.min(segMaxY, Math.max(segMinY, rawCp1y));

    const cp2x = p2.x - (p3.x - p1.x) / 5;
    const rawCp2y = p2.y - (p3.y - p1.y) / 5;
    const cp2y = Math.min(segMaxY, Math.max(segMinY, rawCp2y));

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function formatCompactArs(val: number): string {
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `$${Math.round(val / 1_000)}K`;
  }
  return `$${Math.round(val)}`;
}

export function EarningsChart({
  className = "",
  series,
  topProducts = [],
  periodLabel = "Período actual",
  comparisonLabel = "Período anterior",
  canViewFinancials = true,
}: EarningsChartProps) {
  const [activeTab, setActiveTab] = useState<"earnings" | "channels" | "bestsellers">("earnings");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 760, height: 270 });

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = Math.round(el.clientWidth);
      const h = Math.round(el.clientHeight);
      if (w > 100 && h > 100) {
        setDimensions((prev) =>
          Math.abs(prev.width - w) > 2 || Math.abs(prev.height - h) > 2
            ? { width: w, height: h }
            : prev
        );
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(el);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [activeTab]);

  const activeDataset = series && series.length > 0 ? series : DEFAULT_SERIES;

  // Dynamic chart dimensions adapted 1:1 to the wrapper container
  const width = dimensions.width;
  const height = dimensions.height;
  const paddingLeft = 54;
  const paddingRight = 18;
  const paddingTop = 16;
  const paddingBottom = 32;

  const chartWidth = Math.max(100, width - paddingLeft - paddingRight);
  const chartHeight = Math.max(80, height - paddingTop - paddingBottom);
  const baselineY = paddingTop + chartHeight;

  const rawMax = Math.max(
    10000,
    ...activeDataset.flatMap((d) =>
      activeTab === "channels"
        ? [d.storeRevenue, d.webRevenue]
        : [d.currentRevenue, d.previousRevenue, d.currentProfit]
    )
  );
  const stepUnit = Math.ceil(rawMax / 3 / 5000) * 5000 || 10000;
  const maxValue = stepUnit * 3;

  const count = Math.max(2, activeDataset.length);
  const getX = (index: number) => paddingLeft + (index / (count - 1)) * chartWidth;
  const getY = (val: number) =>
    paddingTop + chartHeight - (Math.min(maxValue, Math.max(0, val)) / maxValue) * chartHeight;

  const primaryPoints = activeDataset.map((d, i) => ({
    x: getX(i),
    y: getY(activeTab === "channels" ? d.storeRevenue : d.currentRevenue),
  }));

  const secondaryPoints = activeDataset.map((d, i) => ({
    x: getX(i),
    y: getY(activeTab === "channels" ? d.webRevenue : d.previousRevenue),
  }));

  const primaryPath = getCubicBezierPath(primaryPoints, baselineY, paddingTop);
  const secondaryPath = getCubicBezierPath(secondaryPoints, baselineY, paddingTop);

  const primaryAreaPath =
    primaryPoints.length > 1
      ? `${primaryPath} L ${primaryPoints[primaryPoints.length - 1].x} ${baselineY} L ${primaryPoints[0].x} ${baselineY} Z`
      : "";

  const yLabels = [
    { label: formatCompactArs(maxValue), val: maxValue },
    { label: formatCompactArs(stepUnit * 2), val: stepUnit * 2 },
    { label: formatCompactArs(stepUnit), val: stepUnit },
    { label: "$0", val: 0 },
  ];

  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-md shadow-slate-900/5 border border-slate-300/80 flex flex-col ${className}`}
    >
      {/* Header with Segmented Tabs on the left and Legend on the right */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 shrink-0">
        {/* Segmented Control Tabs */}
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("earnings")}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "earnings"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Ingresos y Ganancias
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "channels"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Mostrador vs. Web
          </button>
          <button
            onClick={() => setActiveTab("bestsellers")}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "bestsellers"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            Top Productos
          </button>
        </div>

        {/* Right Legend */}
        {activeTab !== "bestsellers" && (
          <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-sky-600 bg-sky-100" />
              <span className="text-slate-600">
                {activeTab === "channels" ? "Tienda Web" : comparisonLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
              <span className="text-slate-900 font-bold">
                {activeTab === "channels" ? "Mostrador Saavedra 241" : periodLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "bestsellers" ? (
        <div className="pt-4 flex-1 min-h-[260px] overflow-y-auto pr-1">
          {topProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
              <Package className="w-8 h-8 mb-2 stroke-[1.5] text-slate-400" />
              <p className="text-sm font-bold text-slate-700">
                Sin ventas registradas en este período
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Las operaciones completadas aparecerán en este ranking.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((prod, idx) => (
                <div
                  key={prod.productId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/90 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {prod.name}
                      </p>
                      <p className="text-xs text-slate-600 truncate mt-0.5">
                        {prod.brand} · {prod.discipline} ·{" "}
                        <span className="font-bold text-slate-800">
                          {prod.unitsSold} un. vendidas
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">
                      {prod.formattedRevenue}
                    </p>
                    {canViewFinancials ? (
                      <p className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1 mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>
                          Ganancia: {prod.formattedProfit} ({prod.marginPercent}%)
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        <Lock className="w-3 h-3" />
                        <span>Margen restringido</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Full-Size Responsive SVG Line Chart */
        <div
          ref={chartContainerRef}
          className="relative flex-1 w-full h-[265px] min-h-[250px] mt-3"
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 w-full h-full block overflow-visible select-none"
          >
            <defs>
              <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yLabels.map((item) => {
              const y = getY(item.val);
              return (
                <g key={item.val}>
                  <text
                    x={paddingLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-600 text-xs font-semibold font-sans"
                  >
                    {item.label}
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke={item.val === 0 ? "#94a3b8" : "#cbd5e1"}
                    strokeWidth={item.val === 0 ? "1.5" : "1"}
                    strokeDasharray={item.val === 0 ? "none" : "4 4"}
                  />
                </g>
              );
            })}

            {/* Area under Primary Curve */}
            {primaryAreaPath && (
              <path d={primaryAreaPath} fill="url(#primaryAreaGrad)" />
            )}

            {/* Secondary Dashed Spline Curve */}
            <path
              d={secondaryPath}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              className="transition-all duration-300"
            />

            {/* Primary Solid Spline Curve */}
            <path
              d={primaryPath}
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              className="transition-all duration-300"
            />

            {/* Interactive Hover Points & X-Axis Labels */}
            {activeDataset.map((d, i) => {
              const x = getX(i);
              const yPrimary = primaryPoints[i].y;
              const ySecondary = secondaryPoints[i].y;
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={d.label}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible hover column */}
                  <rect
                    x={x - chartWidth / count / 2}
                    y={paddingTop}
                    width={chartWidth / count}
                    height={chartHeight}
                    fill="transparent"
                  />

                  {/* Vertical Guide Line on Hover */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + chartHeight}
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Visible Dots on Primary Curve + Emphasized on Hover */}
                  <circle
                    cx={x}
                    cy={yPrimary}
                    r={isHovered ? "6" : "4"}
                    className="fill-emerald-600 stroke-white stroke-2 transition-all"
                  />

                  {isHovered && (
                    <circle
                      cx={x}
                      cy={ySecondary}
                      r="5"
                      className="fill-sky-600 stroke-white stroke-2"
                    />
                  )}

                  {/* X-Axis Month/Day Label */}
                  <text
                    x={x}
                    y={height - 6}
                    textAnchor="middle"
                    className={`text-xs font-sans transition-colors ${
                      isHovered
                        ? "fill-slate-950 font-extrabold"
                        : "fill-slate-600 font-semibold"
                    }`}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip on Hover */}
          {hoveredIndex !== null && activeDataset[hoveredIndex] && (
            <div className="absolute top-3 right-4 bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-xl pointer-events-none flex flex-col gap-1.5 border border-slate-700 z-20">
              <span className="font-extrabold text-slate-200 border-b border-slate-700 pb-1">
                {activeDataset[hoveredIndex].label}
              </span>
              {activeTab === "channels" ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-emerald-400 font-semibold">Mostrador:</span>
                    <span className="font-bold">
                      {formatCurrency(activeDataset[hoveredIndex].storeRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sky-300 font-semibold">Tienda Web:</span>
                    <span className="font-bold">
                      {formatCurrency(activeDataset[hoveredIndex].webRevenue)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white font-semibold">{periodLabel}:</span>
                    <span className="font-bold">
                      {formatCurrency(activeDataset[hoveredIndex].currentRevenue)}
                    </span>
                  </div>
                  {canViewFinancials && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-emerald-400 font-semibold">Ganancia Bruta:</span>
                      <span className="font-bold text-emerald-300">
                        {formatCurrency(activeDataset[hoveredIndex].currentProfit)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sky-300 font-semibold">{comparisonLabel}:</span>
                    <span className="font-bold">
                      {formatCurrency(activeDataset[hoveredIndex].previousRevenue)}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
