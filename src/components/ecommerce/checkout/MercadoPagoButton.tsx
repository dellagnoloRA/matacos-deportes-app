"use client";

import React, { useState, useTransition } from "react";
import { Loader2, Lock, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { createMercadoPagoPreference } from "@/server/actions/ecommerce/mercadopagoActions";

export interface MercadoPagoButtonProps {
  orderIdOrCode: string;
  amount?: number;
  disabled?: boolean;
  onBeforeRedirect?: () => void;
  className?: string;
}

export function MercadoPagoButton({
  orderIdOrCode,
  amount,
  disabled = false,
  onBeforeRedirect,
  className = "",
}: MercadoPagoButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handlePayWithMercadoPago = () => {
    if (disabled || isPending || isRedirecting) return;
    setError(null);

    if (onBeforeRedirect) {
      onBeforeRedirect();
    }

    startTransition(async () => {
      try {
        const res = await createMercadoPagoPreference(orderIdOrCode);

        if (!res.success || !res.data) {
          setError(
            res.error ||
              "No pudimos conectar con Mercado Pago en este momento. Verificá tu pedido o intentá nuevamente."
          );
          return;
        }

        const targetUrl = res.data.initPoint || res.data.sandboxInitPoint;

        if (!targetUrl) {
          setError("No se obtuvo un enlace de pago válido desde Mercado Pago.");
          return;
        }

        setIsRedirecting(true);
        // Redirección segura a la pasarela oficial de Mercado Pago
        window.location.href = targetUrl;
      } catch (err) {
        console.error("Error al generar preferencia de Mercado Pago:", err);
        setError("Ocurrió un error inesperado al conectar con Mercado Pago.");
      }
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Botón Oficial de Mercado Pago */}
      <button
        type="button"
        onClick={handlePayWithMercadoPago}
        disabled={disabled || isPending || isRedirecting}
        className="w-full relative overflow-hidden group flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#009EE3] hover:bg-[#0086c3] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed text-white shadow-md shadow-[#009EE3]/25 hover:shadow-lg hover:shadow-[#009EE3]/35 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-3 text-left">
          {/* Isotipo Oficial MP */}
          <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/images/mercadopago-logo.png"
              alt="Mercado Pago"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <span className="block font-black text-sm sm:text-base tracking-wide uppercase">
              {isRedirecting
                ? "Redirigiendo a Mercado Pago..."
                : isPending
                ? "Generando enlace de pago..."
                : "Pagar con Mercado Pago"}
            </span>
            <span className="block text-[11px] sm:text-xs text-white/90 font-medium">
              Checkout Pro • Tarjetas de crédito, débito o dinero en cuenta
            </span>
          </div>
        </div>

        <div className="shrink-0 ml-3">
          {isPending || isRedirecting ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
          )}
        </div>
      </button>

      {/* Banner de Feedback visual durante la redirección (Subtarea 3) */}
      {(isPending || isRedirecting) && (
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2.5 animate-in fade-in">
          <Loader2 className="w-4 h-4 text-[#009EE3] animate-spin shrink-0" />
          <p className="leading-relaxed">
            <strong>Redirigiendo de forma segura a Mercado Pago...</strong> No cierres esta ventana mientras preparamos tu sesión de pago.
          </p>
        </div>
      )}

      {/* Alerta de Error */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">No pudimos iniciar el pago:</span>
            <p className="text-red-700 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Sellos de Seguridad de Mercado Pago */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#009EE3]" />
          <span>Pago 100% protegido por Mercado Pago</span>
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00A811]" />
          <span>Hasta 6 cuotas con tarjetas seleccionadas</span>
        </span>
      </div>
    </div>
  );
}
