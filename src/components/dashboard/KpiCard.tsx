"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Lock } from "lucide-react";
import { KpiData } from "./types";

interface KpiCardProps {
  data: KpiData;
}

export function KpiCard({ data }: KpiCardProps) {
  const isLongCurrency = data.value.length > 12;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 text-slate-900 shadow-md shadow-slate-900/5 border border-slate-300/80 transition-all duration-300 hover:bg-neutral-950 hover:border-emerald-500/40 hover:shadow-xl hover:-translate-y-0.5 cursor-default">
      {/* Radiant Emerald Radial Glow on Hover (el color especial ahora actúa como hover en todas las tarjetas) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(circle at 45% 45%, rgba(34, 197, 94, 0.55) 0%, rgba(16, 185, 129, 0.25) 40%, rgba(0, 0, 0, 0.95) 80%)",
        }}
      />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-slate-700 group-hover:text-slate-100 tracking-tight transition-colors">
            {data.title}
          </span>

          {data.isRestricted ? (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shrink-0 group-hover:bg-amber-500/20 group-hover:text-amber-300 group-hover:border-amber-400/40 transition-colors">
              <Lock className="w-3.5 h-3.5" />
              <span>RBAC</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 transition-colors ${
                data.isPositive
                  ? "text-emerald-800 bg-emerald-100/90 border-emerald-300 group-hover:text-lime-400 group-hover:bg-black/45 group-hover:border-lime-500/40"
                  : "text-rose-700 bg-rose-100/90 border-rose-300 group-hover:text-rose-300 group-hover:bg-black/45 group-hover:border-rose-400/40"
              }`}
            >
              <span>{data.change}</span>
              {data.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </div>
          )}
        </div>

        <div>
          <span
            className={`${
              data.isRestricted
                ? "text-2xl text-slate-400 group-hover:text-slate-300"
                : isLongCurrency
                ? "text-2xl xl:text-[26px] text-slate-900 group-hover:text-white"
                : "text-2xl sm:text-3xl text-slate-900 group-hover:text-white"
            } font-black tracking-tight block truncate transition-colors`}
            title={data.value}
          >
            {data.value}
          </span>
          {data.subtitle && (
            <p
              className="text-xs text-slate-600 group-hover:text-emerald-200/90 font-semibold mt-1.5 truncate transition-colors"
              title={data.subtitle}
            >
              {data.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
