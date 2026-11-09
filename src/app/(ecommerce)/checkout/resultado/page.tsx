import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ShoppingBag,
  Store,
  ShieldCheck,
  MessageCircle,
  Truck,
} from "lucide-react";
import { ClearCartOnSuccess } from "./ClearCartOnSuccess";
import { processMercadoPagoPayment } from "@/server/actions/ecommerce/mercadopagoActions";
import { formatOrderWhatsAppUrl, buildWhatsAppChatUrl } from "@/lib/whatsapp";
import { companyConfig } from "@/config/company";

export const metadata: Metadata = {
  title: "Resultado de tu Compra — Matacos Deportes",
  description: "Estado de tu compra web en Matacos Deportes Saavedra 241.",
};

interface ResultadoPageProps {
  searchParams: Promise<{
    orderCode?: string;
    status?: string;
    collection_status?: string;
    payment_id?: string;
    collection_id?: string;
    external_reference?: string;
    preference_id?: string;
  }>;
}

export default async function CheckoutResultadoPage({
  searchParams,
}: ResultadoPageProps) {
  const params = await searchParams;

  const rawStatus = (
    params.status ||
    params.collection_status ||
    "pending"
  ).toLowerCase();

  const orderCode = params.orderCode || params.external_reference || "WEB-ORDEN";
  const paymentId = params.payment_id || params.collection_id;

  // En entorno local (o si el webhook aún no llegó), procesamos el pago de inmediato
  if (paymentId) {
    try {
      await processMercadoPagoPayment(paymentId);
    } catch (err) {
      console.warn("[Checkout Resultado] Aviso al procesar pago en retorno:", err);
    }
  }

  const isApproved = rawStatus === "approved" || rawStatus === "success";
  const isFailure =
    rawStatus === "failure" ||
    rawStatus === "rejected" ||
    rawStatus === "cancelled";

  const whatsappSuccessUrl = formatOrderWhatsAppUrl({
    orderCode,
    status: "COMPLETADA",
  });

  const whatsappHelpUrl = buildWhatsAppChatUrl(
    companyConfig.whatsappNumber,
    `Hola Matacos Deportes! Quiero consultar por el pago de mi pedido *${orderCode}*.`
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <ClearCartOnSuccess isApproved={isApproved} />
      {/* Header simple */}
      <header className="bg-slate-950 text-white border-b border-slate-800 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-wider text-white">
              MATACOS
            </span>
            <span className="text-[#00D615] font-black text-lg tracking-wider">
              DEPORTES
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Store className="w-4 h-4 text-[#00D615]" />
            <span>Saavedra 241, Formosa Capital</span>
          </div>
        </div>
      </header>

      {/* Contenedor Central */}
      <main className="max-w-md w-full mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
          {/* Caso 1: Aprobado */}
          {isApproved && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                ¡Pago Aprobado con Éxito!
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                Tu compra fue acreditada y confirmada. Te enviamos el resumen de compra y seguimiento a tu correo. Ya comenzamos a preparar tu pedido en nuestro local de Saavedra 241.
              </p>

              <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Código de Pedido:</span>
                  <strong className="text-slate-900 font-bold">{orderCode}</strong>
                </div>
                {paymentId && (
                  <div className="flex justify-between text-slate-500">
                    <span>Transacción Mercado Pago:</span>
                    <span className="text-slate-800 font-mono font-medium">
                      #{paymentId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Estado:</span>
                  <span className="text-emerald-700 font-black uppercase text-[11px] bg-emerald-100 px-2 py-0.5 rounded-full">
                    Acreditado
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <a
                  href={whatsappSuccessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all text-center"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Avisar / Coordinar por WhatsApp</span>
                </a>

                <Link
                  href={`/seguimiento?codigo=${encodeURIComponent(orderCode)}`}
                  className="w-full py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
                >
                  <Truck className="w-4 h-4 text-[#00D615]" />
                  <span>Ver Estado del Envío</span>
                </Link>

                <Link
                  href="/catalogo"
                  className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Seguir Comprando</span>
                </Link>
              </div>
            </div>
          )}

          {/* Caso 2: Rechazado / Fallido */}
          {isFailure && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in-75 duration-300">
                <XCircle className="w-9 h-9" />
              </div>

              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                No pudimos procesar tu pago
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                La entidad bancaria o Mercado Pago no autorizó la operación. No te
                preocupes, ningún importe fue descontado.
              </p>

              <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Referencia:</span>
                  <strong className="text-slate-900 font-bold">{orderCode}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estado:</span>
                  <span className="text-red-700 font-black uppercase text-[11px] bg-red-100 px-2 py-0.5 rounded-full">
                    Rechazado
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/checkout"
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
                >
                  <span>Reintentar con otro medio</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={whatsappHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Consultar Asistencia por WhatsApp</span>
                </a>

                <Link
                  href="/"
                  className="block text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          )}

          {/* Caso 3: Pendiente / In Process */}
          {!isApproved && !isFailure && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in-75 duration-300">
                <Clock className="w-9 h-9" />
              </div>

              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Pago Pendiente de Acreditación
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed">
                Estamos esperando la confirmación de acreditación de Mercado
                Pago (o el pago de tu cupón en Pago Fácil / Rapipago).
              </p>

              <div className="my-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Pedido:</span>
                  <strong className="text-slate-900 font-bold">{orderCode}</strong>
                </div>
                {paymentId && (
                  <div className="flex justify-between text-slate-500">
                    <span>ID Transacción:</span>
                    <span className="text-slate-800 font-mono font-medium">
                      #{paymentId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Estado:</span>
                  <span className="text-amber-700 font-black uppercase text-[11px] bg-amber-100 px-2 py-0.5 rounded-full">
                    Pendiente
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <Link
                  href={`/seguimiento?codigo=${encodeURIComponent(orderCode)}`}
                  className="w-full py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
                >
                  <span>Ver Estado del Envío</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={whatsappHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>Consultar por WhatsApp</span>
                </a>

                <Link
                  href="/catalogo"
                  className="block text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
                >
                  Volver al Catálogo
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer simple */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Matacos Deportes — Venta Oficial Online</span>
        </div>
        <p>Saavedra 241, Formosa Capital, Argentina.</p>
      </footer>
    </div>
  );
}
