"use client";

import React from "react";

interface SalesChannelsMatrixProps {
  className?: string;
}

const CHANNELS = [
  { id: "tarjetas", name: "Tarjetas", activeCol: [0, 0, 0, 1, 0] },
  { id: "billeteras", name: "Billetera virtuales", activeCol: [0, 1, 1, 0, 0] },
  { id: "transferencia", name: "Transferencia bancaria", activeCol: [0, 0, 1, 0, 0] },
  { id: "efectivo", name: "Efectivo", activeCol: [0, 1, 1, 1, 0] },
];

export function SalesChannelsMatrix({ className = "" }: SalesChannelsMatrixProps) {
  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-xs border border-slate-200/70 flex flex-col justify-between ${className}`}
    >
      <h3 className="text-xs font-bold text-slate-900 tracking-tight mb-3">
        Canales de venta
      </h3>

      <div className="space-y-4 my-auto">
        {CHANNELS.map((ch) => (
          <div key={ch.id} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-700 font-medium text-[11.5px] whitespace-nowrap min-w-[110px]">
              {ch.name}
            </span>

            {/* Matrix Grid Visualization */}
            <div className="relative w-36 h-7 flex items-center justify-center">
              {/* Pink grid background pattern */}
              <div
                className="absolute inset-0 rounded-md border border-rose-200/70 bg-rose-50/40"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(244, 63, 94, 0.2) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(244, 63, 94, 0.2) 1px, transparent 1px)
                  `,
                  backgroundSize: "8px 8px",
                }}
              />

              {/* Black indicator pill/dots */}
              <div className="relative z-10 w-full flex items-center justify-around px-2">
                {ch.activeCol.map((isActive, idx) => (
                  <div key={idx} className="flex items-center justify-center">
                    {isActive ? (
                      <div className="w-4 h-2.5 rounded-full bg-slate-950 shadow-xs ring-1 ring-slate-800 transition-transform duration-200 hover:scale-125" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300/40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
