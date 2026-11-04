"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
  Printer,
  ShoppingBag,
  MapPin,
  Truck,
  Building2,
  Calendar,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

interface OrderDetailViewProps {
  order: {
    id: string;
    orderCode: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    isExpired: boolean;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerDni: string;
    shippingMethod: string;
    shippingCost: number;
    shippingAddress: string | null;
    shippingCity: string | null;
    shippingPostalCode: string | null;
    subtotal: number;
    total: number;
    items: Array<{
      id: string;
      variantId: string;
      productName: string;
      size: string;
      color: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      imageUrl?: string | null;
    }>;
    whatsappContingencyUrl: string;
  };
  simulatedSuccess?: boolean;
}

export function OrderDetailView({ order, simulatedSuccess = false }: OrderDetailViewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Countdown timer for 15-minute stock reservation
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    const exp = new Date(order.expiresAt).getTime();
    return Math.max(0, exp - Date.now());
  });

  useEffect(() => {
    if (order.status !== "PENDIENTE_PAGO" || timeLeftMs <= 0) return;

    const timer = setInterval(() => {
      const exp = new Date(order.expiresAt).getTime();
      const remaining = Math.max(0, exp - Date.now());
      setTimeLeftMs(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [order.expiresAt, order.status, timeLeftMs]);

  const minutesRemaining = Math.floor(timeLeftMs / 60000);
  const secondsRemaining = Math.floor((timeLeftMs % 60000) / 1000);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getShippingLabel = (method: string) => {
    switch (method) {
      case "RETIRO_LOCAL":
        return "Retiro gratis en Saavedra 241, Formosa";
      case "CADETERIA_FORMOSA":
        return "Cadetería en Formosa Capital";
      case "CORREO_ARGENTINO":
        return "Correo Argentino a todo el país";
      default:
        return method;
    }
  };

  const isPending = order.status === "PENDIENTE_PAGO" && !simulatedSuccess;
  const isCompleted = order.status === "COMPLETADA" || simulatedSuccess;
  const isCancelled = order.status === "CANCELADA" || (isPending && timeLeftMs <= 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header */}
      <EcommerceHeader />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Status Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? "bg-[#00D615]/20 text-[#00A811]"
                    : isCancelled
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-7 h-7 text-[#00A811]" />
                ) : isCancelled ? (
                  <AlertCircle className="w-7 h-7 text-red-600" />
                ) : (
                  <Clock className="w-7 h-7 text-amber-600" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Orden Oficial
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-950 font-mono">
                    {order.orderCode}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                  {isCompleted
                    ? "¡Pago Confirmado y Orden Recibida!"
                    : isCancelled
                    ? "Orden Expirada o Cancelada"
                    : "¡Orden Generada con Éxito!"}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {isCompleted
                    ? "Estamos preparando tu pedido en Saavedra 241, Formosa."
                    : isCancelled
                    ? "El stock reservado fue restituido. Podés volver a crear el pedido desde el catálogo."
                    : "Completá el pago antes de que expire la reserva de stock."}
                </p>
              </div>
            </div>

            {/* Quick Actions (Print / WhatsApp) */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => window.print()}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                title="Imprimir Comprobante"
              >
                <Printer className="w-4 h-4" />
              </button>
              <a
                href={order.whatsappContingencyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Avisar por WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Reservation Countdown Alert (if pending) */}
          {isPending && !isCancelled && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-950">
                    Stock reservado en Saavedra 241 (RF-15)
                  </h3>
                  <p className="text-[11px] text-amber-850">
                    Tenés tiempo para abonar antes de la liberación automática.
                  </p>
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-center shrink-0">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">
                  Tiempo Restante
                </span>
                <span className="text-base sm:text-lg font-black text-amber-700 font-mono">
                  {String(minutesRemaining).padStart(2, "0")}:
                  {String(secondsRemaining).padStart(2, "0")}
                </span>
              </div>
            </div>
          )}

          {/* Payment instructions (Bank details to transfer) */}
          {isPending && !isCancelled && (
            <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                <Building2 className="w-4 h-4 text-[#00A811]" />
                <span>Instrucciones de Transferencia Bancaria Directa</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Banco</span>
                  <strong className="text-slate-900">Banco Formosa / Macro</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Titular</span>
                  <strong className="text-slate-900">MUJICA SANDRA ISABEL</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">CUIT</span>
                  <strong className="text-slate-900">27-18036080-3</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Importe a Transferir</span>
                  <strong className="text-emerald-700 text-sm font-black">
                    {formatCurrency(order.total)}
                  </strong>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Alias</span>
                    <strong className="text-slate-900 font-mono text-sm">MATACOS.DEPORTES</strong>
                  </div>
                  <button
                    onClick={() => copyToClipboard("MATACOS.DEPORTES", "alias")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer self-start sm:self-center"
                  >
                    {copiedKey === "alias" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Alias</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">CBU</span>
                    <strong className="text-slate-900 font-mono text-xs sm:text-sm break-all">
                      0110248430024812345678
                    </strong>
                  </div>
                  <button
                    onClick={() => copyToClipboard("0110248430024812345678", "cbu")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer self-start sm:self-center"
                  >
                    {copiedKey === "cbu" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar CBU</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                <span>
                  Una vez transferido, enviá tu comprobante por WhatsApp al{" "}
                  <strong>+54 9 370 4000000</strong> mencionando la orden{" "}
                  <strong>{order.orderCode}</strong> para que empapemos tu paquete al instante.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Customer & Shipping Summary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Datos de Envío y Contacto
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block">Comprador:</span>
                <strong className="text-slate-800">{order.customerName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">DNI / CUIT:</span>
                <span className="text-slate-700 font-mono">{order.customerDni}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contacto:</span>
                <span className="text-slate-700">
                  {order.customerEmail} • {order.customerPhone}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">Modalidad de entrega:</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {order.shippingMethod === "RETIRO_LOCAL" ? (
                    <MapPin className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <Truck className="w-4 h-4 text-slate-700" />
                  )}
                  <strong className="text-slate-800">
                    {getShippingLabel(order.shippingMethod)}
                  </strong>
                </div>
                {order.shippingAddress && (
                  <p className="text-[11px] text-slate-600 mt-1">
                    {order.shippingAddress}, {order.shippingCity || "Formosa"}{" "}
                    {order.shippingPostalCode ? `(CP ${order.shippingPostalCode})` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Totals Summary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Detalle de Facturación
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal de Artículos</span>
                <span className="font-semibold text-slate-800">
                  {formatCurrency(order.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Costo de Envío</span>
                <span
                  className={`font-semibold ${
                    order.shippingCost === 0 ? "text-emerald-700 font-bold" : "text-slate-800"
                  }`}
                >
                  {order.shippingCost === 0 ? "Gratis" : formatCurrency(order.shippingCost)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-slate-950 pt-3 border-t border-slate-200">
                <span>Total de la Orden</span>
                <span className="text-xl text-[#00A811]">{formatCurrency(order.total)}</span>
              </div>
              <div className="pt-2 text-[11px] text-slate-400">
                <p>Fecha: {new Date(order.createdAt).toLocaleString("es-AR")}</p>
                <p>Comprobante oficial válido para retiro en Saavedra 241.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Artículos Incluidos ({order.items.reduce((s, i) => s + i.quantity, 0)})
          </h3>

          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={item.imageUrl || "/placeholder-product.svg"}
                      alt={item.productName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.productName}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                      {item.size && <span>Talle: {item.size}</span>}
                      {item.color && <span>• Color: {item.color}</span>}
                      {item.sku && <span className="font-mono text-[10px]">({item.sku})</span>}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {item.quantity} un. × {formatCurrency(item.unitPrice)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Back to Catalog CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <span>Seguir Comprando en el Catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* 3. Footer */}
      <EcommerceFooter />
    </div>
  );
}

