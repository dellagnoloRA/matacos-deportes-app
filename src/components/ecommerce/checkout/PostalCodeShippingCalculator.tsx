"use client";

import React, { useState, useTransition } from "react";
import { Truck, MapPin, Calculator, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  calculateShippingCostAction,
} from "@/server/actions/ecommerce/shippingActions";
import type {
  ShippingCalculationResult,
  ShippingRateOption,
} from "@/schemas/shipping";
import type { ShippingMethod } from "@/schemas/ecommerce";
import { formatCurrency } from "@/lib/utils";

export interface PostalCodeShippingCalculatorProps {
  initialPostalCode?: string;
  cartItems?: Array<{ variantId: string; quantity: number }>;
  selectedMethod?: ShippingMethod;
  onSelectOption?: (option: ShippingRateOption) => void;
  onShippingCalculated?: (result: ShippingCalculationResult) => void;
  className?: string;
}

export function PostalCodeShippingCalculator({
  initialPostalCode = "",
  cartItems = [],
  selectedMethod,
  onSelectOption,
  onShippingCalculated,
  className = "",
}: PostalCodeShippingCalculatorProps) {
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [calculationResult, setCalculationResult] =
    useState<ShippingCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCalculate = (e?: React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    const cleanCp = postalCode.replace(/\D/g, "");
    if (cleanCp.length !== 4) {
      setError("Ingresá un código postal argentino válido de 4 dígitos (ej: 3600).");
      return;
    }

    startTransition(async () => {
      try {
        const res = await calculateShippingCostAction({
          postalCode: cleanCp,
          method: selectedMethod || "RETIRO_LOCAL",
          items: cartItems.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        });

        if (!res.success) {
          setError(res.error || "No se pudo calcular el costo para ese código postal.");
          setCalculationResult(null);
          return;
        }

        setCalculationResult(res);
        if (onShippingCalculated) {
          onShippingCalculated(res);
        }
      } catch (err) {
        console.error("Error al cotizar envío por código postal:", err);
        setError("Error de conexión al cotizar el envío. Intentá nuevamente.");
      }
    });
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-[#00A811]" />
          <span>Calculador de Envíos por Código Postal</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Tarifas en vivo</span>
      </div>

      {/* Input de CP y Botón de Cálculo (Utiliza div para evitar anidamiento inválido de form en HTML) */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={postalCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setPostalCode(val);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCalculate(e);
              }
            }}
            placeholder="Ej: 3600 (Formosa)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-950 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          disabled={isPending || postalCode.length !== 4}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Cotizando...</span>
            </>
          ) : (
            <span>Calcular Envío</span>
          )}
        </button>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado Skeleton durante la cotización (Subtarea 3) */}
      {isPending && (
        <div className="space-y-2.5 pt-2 animate-pulse">
          <div className="h-14 bg-slate-200 rounded-xl w-full" />
          <div className="h-14 bg-slate-200 rounded-xl w-full" />
          <div className="h-14 bg-slate-200 rounded-xl w-full" />
        </div>
      )}

      {/* Resultados Cotizados */}
      {!isPending && calculationResult && calculationResult.options.length > 0 && (
        <div className="space-y-2 pt-1 animate-in fade-in">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Opciones de entrega para CP {calculationResult.postalCode || postalCode}:
          </span>

          <div className="space-y-2">
            {calculationResult.options.map((opt) => {
              const isSelected = selectedMethod === opt.method;
              return (
                <div
                  key={opt.method}
                  onClick={() => onSelectOption && onSelectOption(opt)}
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? "bg-white border-[#00A811] shadow-xs ring-1 ring-[#00A811]"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  } ${onSelectOption ? "cursor-pointer" : ""}`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{opt.name}</span>
                      {opt.isFree && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                          GRATIS
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{opt.deliveryEstimateText}</p>
                    {opt.notes && (
                      <p className="text-[10px] text-slate-400 italic">{opt.notes}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <span
                      className={`font-black text-xs sm:text-sm ${
                        opt.isFree ? "text-[#00A811]" : "text-slate-900"
                      }`}
                    >
                      {opt.isFree ? "GRATIS" : opt.priceFormatted}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
