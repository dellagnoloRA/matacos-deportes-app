"use client";

import React from "react";
import { Wallet, PackageCheck, AlertTriangle } from "lucide-react";
import type { OperationalStatusCardDTO } from "@/schemas/analytics";

interface MarketingSeoCardProps {
  className?: string;
  status?: OperationalStatusCardDTO;
  onNavigateTab?: (tabId: string) => void;
}

const DEFAULT_STATUS: OperationalStatusCardDTO = {
  cashShift: {
    isOpen: false,
    cashierName: null,
    openedAtFormatted: null,
    expectedCash: 0,
    formattedExpectedCash: "$ 0,00",
    lastClosedDifference: 0,
    formattedLastDifference: "$ 0,00",
  },
  webOperations: {
    pendingPreparationCount: 0,
    pendingVerificationCount: 0,
    completedInPeriodCount: 0,
    activePromotionsCount: 0,
    criticalStockCount: 0,
  },
};

export function MarketingSeoCard({
  className = "",
  status,
  onNavigateTab,
}: MarketingSeoCardProps) {
  const op = status ?? DEFAULT_STATUS;
  const totalWebPending =
    op.webOperations.pendingPreparationCount +
    op.webOperations.pendingVerificationCount;

  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-md shadow-slate-900/5 border border-slate-300/80 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Estado Operativo (Caja y Web)
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            op.cashShift.isOpen
              ? "text-emerald-800 bg-emerald-100 border border-emerald-300"
              : "text-slate-700 bg-slate-100 border border-slate-300"
          }`}
        >
          {op.cashShift.isOpen ? "Caja Abierta" : "Caja Cerrada"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-auto">
        {/* Card 1: Estado de Caja Mostrador */}
        <div
          onClick={() => onNavigateTab?.("pos")}
          className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/90 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
          title="Ir al módulo de Punto de Venta y Caja"
        >
          <div className="flex items-center gap-2 text-slate-700 text-xs mb-1.5">
            <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold truncate">Efectivo en Cajón</span>
          </div>
          <div
            className="text-base sm:text-lg font-black text-slate-900 truncate"
            title={op.cashShift.formattedExpectedCash}
          >
            {op.cashShift.formattedExpectedCash}
          </div>
          <p className="text-xs font-medium text-slate-600 mt-1 truncate">
            {op.cashShift.isOpen
              ? `Cajero: ${op.cashShift.cashierName ?? "Activo"}`
              : `Últ. dif: ${op.cashShift.formattedLastDifference}`}
          </p>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`${
                op.cashShift.isOpen ? "bg-emerald-600" : "bg-slate-400"
              } h-full rounded-full transition-all`}
              style={{ width: op.cashShift.isOpen ? "100%" : "30%" }}
            />
          </div>
        </div>

        {/* Card 2: Despachos Web & Alertas de Stock */}
        <div
          onClick={() =>
            onNavigateTab?.(totalWebPending > 0 ? "ecommerce" : "inventario")
          }
          className="p-3.5 rounded-xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/90 hover:border-sky-300 transition-all cursor-pointer shadow-2xs"
          title="Ver órdenes web pendientes y alertas de inventario"
        >
          <div className="flex items-center gap-2 text-slate-700 text-xs mb-1.5">
            {totalWebPending > 0 ? (
              <PackageCheck className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="font-bold truncate">
              {totalWebPending > 0 ? "Pedidos por Gestionar" : "Stock Crítico"}
            </span>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 truncate">
            {totalWebPending > 0
              ? `${totalWebPending} pendiente(s)`
              : `${op.webOperations.criticalStockCount} alerta(s)`}
          </div>
          <p className="text-xs font-medium text-slate-600 mt-1 truncate">
            {totalWebPending > 0
              ? `${op.webOperations.pendingVerificationCount} por conciliar · ${op.webOperations.pendingPreparationCount} picking`
              : `${op.webOperations.activePromotionsCount} promo(s) activas`}
          </p>
          <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`${
                totalWebPending > 0 ? "bg-sky-600" : "bg-amber-500"
              } h-full rounded-full transition-all`}
              style={{
                width:
                  totalWebPending > 0
                    ? `${Math.min(100, totalWebPending * 25)}%`
                    : `${Math.min(100, Math.max(20, op.webOperations.criticalStockCount * 15))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
