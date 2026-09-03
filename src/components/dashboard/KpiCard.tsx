"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { KpiData } from "./types";

interface KpiCardProps {
  data: KpiData;
}

export function KpiCard({ data }: KpiCardProps) {
  if (data.isFeatured) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-neutral-950 p-5 text-white shadow-md border border-neutral-900 transition-transform duration-200 hover:scale-[1.01]">
        {/* Radiant Emerald Radial Glow in background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 45% 45%, rgba(34, 197, 94, 0.55) 0%, rgba(16, 185, 129, 0.25) 40%, rgba(0, 0, 0, 0.95) 80%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
          <span className="text-xs font-medium text-slate-200/90 tracking-wide">
            {data.title}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {data.value}
            </span>
            <div className="flex items-center gap-0.5 text-xs font-semibold text-lime-400 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-lime-500/30">
              <span>{data.change}</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 transition-transform duration-200 hover:scale-[1.01] hover:shadow-sm">
      <div className="flex flex-col justify-between h-full space-y-4">
        <span className="text-xs font-medium text-slate-500 tracking-wide">
          {data.title}
        </span>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {data.value}
          </span>
          <div
            className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              data.isPositive
                ? "text-emerald-600 bg-emerald-50 border border-emerald-200/60"
                : "text-rose-500 bg-rose-50 border border-rose-200/60"
            }`}
          >
            <span>{data.change}</span>
            {data.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
