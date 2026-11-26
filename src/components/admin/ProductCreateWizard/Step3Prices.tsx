"use client";

import React from "react";
import { WizardFormState } from "./types";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Percent, Calculator, Sparkles, CreditCard, Tag } from "lucide-react";

interface Step3Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
}

export const Step3Prices: React.FC<Step3Props> = ({ form, updateForm }) => {
  const salePrice = Number(form.price) || 0;
  const listPrice = Number(form.listPrice) || 0;
  const costPrice = Number(form.costPrice) || 0;
  const vatRate = Number(form.vatRate) || 21;
  const installments = Number(form.installments) || 6;

  // Cálculos automáticos
  const discountPercent =
    listPrice > salePrice && listPrice > 0
      ? Math.round(((listPrice - salePrice) / listPrice) * 100)
      : 0;

  const grossProfit = costPrice > 0 && salePrice > costPrice ? salePrice - costPrice : 0;
  const estimatedMargin =
    costPrice > 0 && salePrice > 0 ? Math.round(((salePrice - costPrice) / salePrice) * 100) : 0;

  const netPrice = salePrice > 0 ? salePrice / (1 + vatRate / 100) : 0;
  const installmentAmount = salePrice > 0 ? Math.round(salePrice / installments) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">3. Precios, Cuotas e Impuestos</h2>
        <p className="text-xs text-slate-500">
          Configura los valores monetarios de venta, costos internos y esquema de financiación.
        </p>
      </div>

      {/* Grid Principal de Precios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Precio de Venta (Obligatorio) */}
        <div className="space-y-1.5 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
          <label className="block text-xs font-extrabold text-emerald-950">
            Precio de Venta Final <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
              $
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={form.price || ""}
              onChange={(e) => updateForm({ price: parseFloat(e.target.value) || 0 })}
              className="w-full h-11 pl-7 pr-3 rounded-lg border border-emerald-300 text-sm font-extrabold text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs"
              min={0}
              step="any"
            />
          </div>
          <span className="text-[11px] text-emerald-800 font-medium block">
            Importe a cobrar en mostrador y web.
          </span>
        </div>

        {/* Precio de Lista (Tachado) */}
        <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-800">
            Precio de Lista (Tachado)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              $
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={form.listPrice || ""}
              onChange={(e) => updateForm({ listPrice: parseFloat(e.target.value) || null })}
              className="w-full h-11 pl-7 pr-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              min={0}
              step="any"
            />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Para mostrar descuento.</span>
            {discountPercent > 0 && (
              <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Precio de Costo (Opcional interno) */}
        <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-800">
            Precio de Costo (Proveedor)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
              $
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={form.costPrice || ""}
              onChange={(e) => updateForm({ costPrice: parseFloat(e.target.value) || null })}
              className="w-full h-11 pl-7 pr-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              min={0}
              step="any"
            />
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Uso interno (no visible).</span>
            {estimatedMargin > 0 && (
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Margen {estimatedMargin}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tarjeta de Métricas y Cálculos Automáticos */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
          <Calculator className="w-4 h-4" />
          <span>Desglose Impositivo y Financiación Automática</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Base Imponible (Sin IVA)
            </span>
            <span className="text-base font-extrabold text-white">
              {formatCurrency(netPrice)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              IVA Discriminado ({vatRate}%)
            </span>
            <span className="text-base font-extrabold text-slate-200">
              {formatCurrency(salePrice - netPrice)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Ganancia Bruta Est.
            </span>
            <span className="text-base font-extrabold text-emerald-400">
              {grossProfit > 0 ? formatCurrency(grossProfit) : "-"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Cuota Mensual ({installments}x)
            </span>
            <span className="text-base font-extrabold text-white">
              {installmentAmount > 0 ? formatCurrency(installmentAmount) : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Configuración de IVA y Cuotas sin Interés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Alícuota de IVA Editable */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">
            Tasa de IVA Aplicable <span className="text-red-500">*</span>
          </label>
          <select
            value={form.vatRate}
            onChange={(e) => updateForm({ vatRate: parseFloat(e.target.value) || 21 })}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="21">21.0% (Tasa Estándar Argentina)</option>
            <option value="10.5">10.5% (Tasa Reducida Bienes de Capital)</option>
            <option value="0">0.0% (Exento / No Gravado)</option>
          </select>
          <span className="text-[10px] text-slate-400 block">
            Utilizado para facturación fiscal ARCA/AFIP y mostrar precio neto.
          </span>
        </div>

        {/* Cuotas sin Interés */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">
            Cuotas sin Interés (Planes Ahora / Bancarios) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 3, 6, 9, 12].map((num) => {
              const isSelected = form.installments === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateForm({ installments: num })}
                  className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-950 text-white shadow-xs scale-102"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {num}x
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-slate-400 block">
            Se muestra en la píldora verde destacada de la ficha de producto.
          </span>
        </div>
      </div>
    </div>
  );
};
