"use client";

import React from "react";
import { TrendingUp, Search, Eye } from "lucide-react";

interface MarketingSeoCardProps {
  className?: string;
}

export function MarketingSeoCard({ className = "" }: MarketingSeoCardProps) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight">
          Marketing & SEO
        </h3>
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          +24.8%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 my-auto">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
            <Search className="w-3 h-3 text-sky-500" />
            <span>Impresiones</span>
          </div>
          <div className="text-sm font-bold text-slate-900">48.2K</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: "72%" }} />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
            <Eye className="w-3 h-3 text-emerald-500" />
            <span>Conversión</span>
          </div>
          <div className="text-sm font-bold text-slate-900">3.84%</div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "58%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
