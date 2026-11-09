"use client";

import React from "react";
import { CreditCard, QrCode, Landmark, Banknote } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentChannelMatrixItemDTO } from "@/schemas/analytics";

interface SalesChannelsMatrixProps {
  className?: string;
  channels?: PaymentChannelMatrixItemDTO[];
}

const DEFAULT_CHANNELS: PaymentChannelMatrixItemDTO[] = [
  {
    id: "tarjetas",
    methodKey: "tarjetas",
    name: "Tarjetas (Débito / Crédito)",
    amount: 0,
    formattedAmount: "$ 0,00",
    percentage: 0,
    transactionsCount: 0,
    activeCol: [0, 0, 0, 0, 0],
  },
  {
    id: "mercadopago",
    methodKey: "mercadopago",
    name: "Mercado Pago / QR",
    amount: 0,
    formattedAmount: "$ 0,00",
    percentage: 0,
    transactionsCount: 0,
    activeCol: [0, 0, 0, 0, 0],
  },
  {
    id: "transferencia",
    methodKey: "transferencia",
    name: "Transferencia bancaria",
    amount: 0,
    formattedAmount: "$ 0,00",
    percentage: 0,
    transactionsCount: 0,
    activeCol: [0, 0, 0, 0, 0],
  },
  {
    id: "efectivo",
    methodKey: "efectivo",
    name: "Efectivo en mostrador",
    amount: 0,
    formattedAmount: "$ 0,00",
    percentage: 0,
    transactionsCount: 0,
    activeCol: [0, 0, 0, 0, 0],
  },
];

function getMethodVisuals(methodKey: string) {
  switch (methodKey) {
    case "tarjetas":
      return {
        Icon: CreditCard,
        iconBg: "bg-slate-900 text-white",
        barColor: "bg-slate-900",
        badgeClass: "text-slate-800 bg-slate-200/80",
      };
    case "mercadopago":
      return {
        Icon: QrCode,
        iconBg: "bg-sky-600 text-white",
        barColor: "bg-sky-600",
        badgeClass: "text-sky-800 bg-sky-100",
      };
    case "transferencia":
      return {
        Icon: Landmark,
        iconBg: "bg-amber-500 text-white",
        barColor: "bg-amber-500",
        badgeClass: "text-amber-900 bg-amber-100",
      };
    default:
      return {
        Icon: Banknote,
        iconBg: "bg-emerald-600 text-white",
        barColor: "bg-emerald-600",
        badgeClass: "text-emerald-800 bg-emerald-100",
      };
  }
}

export function SalesChannelsMatrix({
  className = "",
  channels,
}: SalesChannelsMatrixProps) {
  const items = channels && channels.length > 0 ? channels : DEFAULT_CHANNELS;
  const totalAmount = items.reduce((acc, item) => acc + item.amount, 0);
  const totalTx = items.reduce((acc, item) => acc + item.transactionsCount, 0);

  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-md shadow-slate-900/5 border border-slate-300/80 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Medios de Pago y Recaudación
        </h3>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full">
          {totalTx} cobros
        </span>
      </div>

      <div className="space-y-3.5 my-auto">
        {items.map((ch) => {
          const { Icon, iconBg, barColor, badgeClass } = getMethodVisuals(
            ch.methodKey
          );
          const barWidth =
            ch.percentage > 0 ? Math.max(4, Math.min(100, ch.percentage)) : 0;

          return (
            <div
              key={ch.id}
              className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                      {ch.name}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 leading-tight mt-0.5">
                      {ch.transactionsCount}{" "}
                      {ch.transactionsCount === 1 ? "operación" : "operaciones"}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    {ch.formattedAmount}
                  </p>
                  <span
                    className={`inline-block text-[11px] font-extrabold px-1.5 py-0.2 rounded-md mt-0.5 ${badgeClass}`}
                  >
                    {ch.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Clean Progress Bar */}
              <div className="w-full h-2 bg-slate-200/90 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Total Reconciled */}
      <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-xs">
        <span className="font-bold text-slate-600">Total Conciliado:</span>
        <span className="text-sm font-black text-slate-900">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}
