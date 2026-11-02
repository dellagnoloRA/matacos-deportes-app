"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MessageCircle,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import {
  trackPublicWebOrderAction,
  type CustomerOrderDetailDTO,
} from "@/server/actions/ecommerce/customerActions";
import { formatCurrency } from "@/lib/utils";

interface OrderTrackingViewProps {
  initialCode?: string;
  initialVerification?: string;
}

export function OrderTrackingView({
  initialCode = "",
  initialVerification = "",
}: OrderTrackingViewProps) {
  const [orderCode, setOrderCode] = useState(initialCode);
  const [verification, setVerification] = useState(initialVerification);
  const [order, setOrder] = useState<CustomerOrderDetailDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const performLookup = (codeVal: string, verifVal: string) => {
    setError(null);
    startTransition(async () => {
      const res = await trackPublicWebOrderAction({
        orderCode: codeVal.trim(),
        verification: verifVal.trim(),
      });
      if (!res.success || !res.data) {
        setOrder(null);
        setError(
          res.error ||
            "No encontramos un pedido que coincida con esos datos. Revisá el código y el DNI o correo."
        );
        return;
      }
      setOrder(res.data);
    });
  };

  useEffect(() => {
    if (initialCode.trim() && initialVerification.trim()) {
      performLookup(initialCode, initialVerification);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(orderCode, verification);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <EcommerceHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00A811]">
              CENTRO DE SEGUIMIENTO WEB
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight">
              Consultar Estado de Pedido
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Ingresá tu código de compra (ej. <strong>WEB-2026-0001</strong>) junto con el DNI o correo electrónico del comprador.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Código de Orden *
              </label>
              <input
                type="text"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                placeholder="WEB-2026-0001"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm uppercase font-semibold focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                DNI o Correo del Comprador *
              </label>
              <input
                type="text"
                value={verification}
                onChange={(e) => setVerification(e.target.value)}
                placeholder="Ej: 38999111 o tu@correo.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 h-[42px] cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-center gap-2.5 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Resultado del Pedido */}
        {order && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 bg-[#06241d] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Package className="w-5 h-5 text-[#00D615]" />
                  <h2 className="text-lg font-black">{order.orderCode}</h2>
                  {order.status === "PENDIENTE_PAGO" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                      <Clock className="w-3 h-3" />
                      Pendiente de pago
                    </span>
                  )}
                  {order.status === "COMPLETADA" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00D615] text-slate-950">
                      <CheckCircle2 className="w-3 h-3" />
                      Pago confirmado
                    </span>
                  )}
                  {order.status === "CANCELADA" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500 text-white">
                      <XCircle className="w-3 h-3" />
                      Cancelada
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-100/80">
                  Fecha: {order.createdAtFormatted} • Comprador:{" "}
                  {order.customerName}
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                  Total
                </span>
                <span className="text-xl font-black text-[#00D615]">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Estado Logístico */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  {order.shippingMethod === "RETIRO_LOCAL" ? (
                    <MapPin className="w-5 h-5 text-[#00A811] shrink-0 mt-0.5" />
                  ) : (
                    <Truck className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-slate-900">
                      Estado logístico: {order.shippingStatus.replace(/_/g, " ")}
                    </p>
                    <p className="text-slate-600">
                      {order.shippingAddress}
                      {order.shippingCity ? `, ${order.shippingCity}` : ""}
                    </p>
                    {order.shippingTrackingCode && (
                      <p className="font-bold text-emerald-700 pt-1">
                        Código de seguimiento: {order.shippingTrackingCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === "PENDIENTE_PAGO" &&
                    (order.customerDni || order.customerEmail) && (
                      <Link
                        href={`/checkout?orden=${encodeURIComponent(
                          order.orderCode
                        )}&verificacion=${encodeURIComponent(
                          order.customerDni || order.customerEmail || ""
                        )}`}
                        className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-[#00D615]" />
                        <span>Pagar Pedido Ahora</span>
                      </Link>
                    )}
                  {order.correoArgentinoTrackingUrl && (
                    <a
                      href={order.correoArgentinoTrackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-bold text-xs inline-flex items-center gap-1.5"
                    >
                      <span>Seguir en Correo Argentino</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <a
                    href={order.whatsappSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Consultar por WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Artículos */}
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center shrink-0">
                        <img
                          src={item.imageUrl || "/placeholder-product.svg"}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/productos/${item.productId}`}
                          className="font-bold text-slate-900 hover:text-[#00A811]"
                        >
                          {item.quantity}x {item.productName}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          {item.brandName} • Talle {item.size} • {item.color}
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <EcommerceFooter />
    </div>
  );
}
