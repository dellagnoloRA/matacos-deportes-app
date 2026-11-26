"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Building2,
  ArrowLeft,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  Lock,
  MessageCircle,
  FileUp,
  Store,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { MercadoPagoButton } from "@/components/ecommerce/checkout/MercadoPagoButton";
import { formatCurrency } from "@/lib/utils";
import { buildWhatsAppChatUrl } from "@/lib/whatsapp";
import { companyConfig } from "@/config/company";
import { uploadBankTransferReceipt } from "@/server/actions/ecommerce/bankTransferActions";

export interface WebOrderPaymentDetails {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingMethod: string;
  shippingAddress?: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  items: Array<{
    id: string;
    productName: string;
    size?: string | null;
    color?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
}

interface PaymentMethodSelectionViewProps {
  order: WebOrderPaymentDetails;
}

export function PaymentMethodSelectionView({
  order,
}: PaymentMethodSelectionViewProps) {
  const [selectedMethod, setSelectedMethod] = useState<"MERCADO_PAGO" | "TRANSFERENCIA">(
    "MERCADO_PAGO"
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const bankDetails = {
    bank: "Banco de Formosa / Macro",
    cbu: "0110599520000001234567",
    alias: "MATACOS.DEPORTES.OFICIAL",
    cuit: "30-71234567-8",
    holder: "Matacos Deportes S.R.L.",
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleReceiptUpload = async (e?: React.SyntheticEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!receiptFile) return;

    setUploadingReceipt(true);
    setReceiptError(null);

    try {
      const formData = new FormData();
      formData.append("file", receiptFile);
      formData.append("orderId", order.id);

      const res = await uploadBankTransferReceipt(formData);
      if (res.success) {
        setReceiptUploaded(true);
      } else {
        setReceiptError(res.error || "No se pudo subir el comprobante");
      }
    } catch {
      setReceiptError("Error al procesar el archivo del comprobante");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const whatsappTransferUrl = buildWhatsAppChatUrl(
    companyConfig.whatsappNumber,
    `Hola Matacos Deportes! Realicé la transferencia para el pedido *${order.orderCode}* por *${formatCurrency(order.total)}*. Adjunto comprobante:`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb / Volver */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </Link>
      </div>

      {/* Header del Pago */}
      <div className="bg-[#041c16] text-white p-6 sm:p-8 rounded-3xl border border-emerald-950 relative overflow-hidden space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00D615]">
            PASO FINAL DE TU COMPRA • RESERVA ACTIVA
          </span>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-white font-bold">
            Orden: #{order.orderCode}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight uppercase">
          Elegí tu Método de Pago
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Tu stock se encuentra apartado por <strong>15 minutos</strong>. Completá el pago para confirmar tu compra y despachar tus artículos.
        </p>
      </div>

      {/* Grid: Métodos de Pago a la izquierda / Resumen a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Métodos de Pago (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Pestañas de Selección */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMethod("MERCADO_PAGO")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedMethod === "MERCADO_PAGO"
                  ? "bg-sky-50/50 border-[#009EE3] ring-2 ring-[#009EE3]/40 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-6 flex items-center">
                  <img
                    src="/images/mercadopago-logo.png"
                    alt="Mercado Pago"
                    className="h-5 w-auto object-contain"
                  />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  HASTA 6 CUOTAS
                </span>
              </div>
              <div>
                <span className="block font-black text-xs sm:text-sm text-slate-900 uppercase">
                  Mercado Pago
                </span>
                <span className="text-[11px] text-slate-500">
                  Crédito, débito y dinero en cuenta
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("TRANSFERENCIA")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedMethod === "TRANSFERENCIA"
                  ? "bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600/40 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Building2
                  className={`w-5 h-5 ${
                    selectedMethod === "TRANSFERENCIA"
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  DIRECTO CBU/ALIAS
                </span>
              </div>
              <div>
                <span className="block font-black text-xs sm:text-sm text-slate-900 uppercase">
                  Transferencia
                </span>
                <span className="text-[11px] text-slate-500">
                  Home banking o billetera
                </span>
              </div>
            </button>
          </div>

          {/* Contenido según Método Seleccionado */}
          {selectedMethod === "MERCADO_PAGO" ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                  Mercado Pago
                </h3>
                <p className="text-xs text-slate-500">
                  Aboná de forma segura con tarjetas de crédito, débito o dinero disponible en tu cuenta de Mercado Pago.
                </p>
              </div>

              {/* Botón Oficial de Mercado Pago */}
              <MercadoPagoButton
                orderIdOrCode={order.id}
                amount={order.total}
              />

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 block">
                  Promociones bancarias vigentes:
                </span>
                <p>
                  Tarjetas Visa, Mastercard, American Express y Cabal en 3 y 6 cuotas fijas o con promociones de tu banco.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-sm sm:text-base uppercase tracking-tight">
                  Datos de la Cuenta Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Transferí el monto exacto de <strong>{formatCurrency(order.total)}</strong> a la siguiente cuenta bancaria:
                </p>
              </div>

              {/* Datos Bancarios con Botón de Copiado */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Banco & Entidad
                  </span>
                  <span className="font-bold text-slate-800">{bankDetails.bank}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      CBU (22 dígitos)
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                      {bankDetails.cbu}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankDetails.cbu, "cbu")}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-1 font-bold cursor-pointer"
                  >
                    {copiedField === "cbu" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Alias
                    </span>
                    <span className="font-mono font-black text-emerald-800 text-xs sm:text-sm">
                      {bankDetails.alias}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankDetails.alias, "alias")}
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-1 font-bold cursor-pointer"
                  >
                    {copiedField === "alias" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Titular & CUIT
                  </span>
                  <span className="text-slate-700">
                    {bankDetails.holder} — CUIT: {bankDetails.cuit}
                  </span>
                </div>
              </div>

              {/* Subida de Comprobante o WhatsApp */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-900 uppercase block">
                  Envío del Comprobante:
                </span>

                {receiptUploaded ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#00A811] shrink-0" />
                    <div>
                      <strong className="block">¡Comprobante adjuntado con éxito!</strong>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Nuestro equipo de Saavedra 241 validará el ingreso y te notificará por email y WhatsApp cuando el pedido esté listo.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={handleReceiptUpload}
                        disabled={!receiptFile || uploadingReceipt}
                        className="px-4 py-2 rounded-xl bg-[#00D615] hover:bg-[#00ba13] disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer"
                      >
                        {uploadingReceipt ? "Subiendo..." : "Subir Comprobante"}
                      </button>
                    </div>

                    {receiptError && (
                      <p className="text-xs text-red-600 font-semibold">{receiptError}</p>
                    )}
                  </div>
                )}

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-400">o envialo directamente por WhatsApp</span>
                  <div className="pt-2">
                    <a
                      href={whatsappTransferUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Notificar Transferencia por WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Resumen de la Orden (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">
              Detalle del Pedido
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              #{order.orderCode}
            </span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1 text-xs">
            {order.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                    {i.productName}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {i.size ? `Talle: ${i.size}` : ""} {i.color ? `• ${i.color}` : ""} • Cant: {i.quantity}
                  </span>
                </div>
                <span className="font-bold text-slate-900 shrink-0">
                  {formatCurrency(i.unitPrice * i.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Envío ({order.shippingMethod}):</span>
              <span className="font-bold text-slate-900">
                {order.shippingCost === 0 ? "GRATIS" : formatCurrency(order.shippingCost)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-slate-950">
              <span className="font-bold uppercase tracking-wide">Total a Pagar:</span>
              <span className="text-2xl font-black text-slate-950 font-mono">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00A811] shrink-0" />
            <span>Tus prendas están reservadas mientras realizás el pago.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
