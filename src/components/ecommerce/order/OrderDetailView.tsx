"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  XCircle,
  Loader2,
  FileUp,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { cancelGuestOrder } from "@/server/actions/ecommerce/checkoutActions";
import { submitTransferProof } from "@/server/actions/ecommerce/bankTransferActions";
import { useCartStore } from "@/store/cartStore";

interface OrderDetailViewProps {
  order: {
    id: string;
    orderCode: string;
    status: string;
    notes?: string | null;
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
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Status local state to allow reactive updates (cancellation, proof upload)
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Comprobante upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  // Official Bank Information (Matacos Deportes)
  const bankInfo = {
    cbu: "0110263720026300489124",
    alias: "MATACOS.DEPORTES.FSA",
    holder: "MUJICA SANDRA ISABEL (Matacos Deportes)",
    cuit: "27-18036080-3",
    bank: "Banco de Formosa S.A. / Red Link",
    whatsappNumber: "5493704287158",
  };

  // Countdown timer for 15-minute stock reservation
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => {
    const exp = new Date(order.expiresAt).getTime();
    return Math.max(0, exp - Date.now());
  });

  useEffect(() => {
    if (currentStatus !== "PENDIENTE_PAGO" || timeLeftMs <= 0) return;

    const timer = setInterval(() => {
      const exp = new Date(order.expiresAt).getTime();
      const remaining = Math.max(0, exp - Date.now());
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        setCurrentStatus("CANCELADA");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order.expiresAt, currentStatus, timeLeftMs]);

  const minutesRemaining = Math.floor(timeLeftMs / 60000);
  const secondsRemaining = Math.floor((timeLeftMs % 60000) / 1000);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Handle order cancellation
  const handleCancelReservation = async () => {
    const confirmed = window.confirm(
      "¿Estás seguro de cancelar la reserva de stock? Los artículos volverán a estar disponibles para otros compradores."
    );
    if (!confirmed) return;

    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await cancelGuestOrder(order.orderCode, "Cancelado por el cliente desde la pantalla de pedido");
      if (res.success) {
        setCurrentStatus("CANCELADA");
        router.refresh();
      } else {
        setCancelError(res.error || "No se pudo cancelar la reserva.");
      }
    } catch {
      setCancelError("Error de conexión al cancelar la reserva.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle proof upload
  const handleUploadProof = async () => {
    if (!selectedFile) return;

    setIsUploadingProof(true);
    setProofError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("orderId", order.orderCode);

      const uploadRes = await fetch("/api/ecommerce/upload-proof", {
        method: "POST",
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || "Error al subir el archivo de comprobante");
      }

      const proofRes = await submitTransferProof({
        orderId: order.orderCode,
        proofUrl: uploadJson.url,
        reference: `COMP-${Date.now().toString().slice(-6)}`,
        customerNotes: `Comprobante cargado por ${order.customerName}`,
      });

      if (proofRes.success) {
        setProofUploaded(true);
        setCurrentStatus("PENDIENTE_VERIFICACION");
        router.refresh();
      } else {
        throw new Error(proofRes.error || "No se pudo registrar el comprobante");
      }
    } catch (err: any) {
      setProofError(err.message || "Error al enviar el comprobante.");
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Handle Retry Order (re-add expired items to cart and redirect to checkout)
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryOrder = () => {
    setIsRetrying(true);
    const cartStore = useCartStore.getState();

    // Re-populate cart with all items from this order
    for (const item of order.items) {
      cartStore.addItem({
        variantId: item.variantId,
        productId: item.variantId,
        name: item.productName,
        brand: "Matacos Deportes",
        size: item.size || "Único",
        color: item.color || "Estándar",
        sku: item.sku || "PROD",
        price: item.unitPrice,
        imageUrl: item.imageUrl || "/placeholder-product.svg",
        availableStock: 99,
        quantity: item.quantity,
      });
    }

    // Direct redirection to checkout so the user can pay immediately
    router.push("/checkout");
  };

  const whatsappContingencyExpiredUrl = `https://wa.me/${bankInfo.whatsappNumber}?text=${encodeURIComponent(
    `¡Hola Matacos Deportes! Se me venció el tiempo de reserva para la orden web ${order.orderCode} por ${formatCurrency(
      order.total
    )} a nombre de ${order.customerName}. Quisiera saber si todavía tienen disponibilidad para reservármelo.`
  )}`;

  const getShippingLabel = (method: string) => {
    switch (method) {
      case "RETIRO_LOCAL":
        return "Retiro gratis en Saavedra 241, Formosa";
      case "CADETERIA_FORMOSA":
        return "Cadetería en Formosa Capital";
      case "CORREO_ARGENTINO":
      case "CORREO_ARGENTINO_DOMICILIO":
        return "Correo Argentino a Domicilio";
      case "CORREO_ARGENTINO_SUCURSAL":
        return "Retiro en Sucursal Correo Argentino";
      default:
        return method;
    }
  };

  const isPending = currentStatus === "PENDIENTE_PAGO" && !simulatedSuccess;
  const isVerification = currentStatus === "PENDIENTE_VERIFICACION" || proofUploaded;
  const isCompleted = currentStatus === "COMPLETADA" || simulatedSuccess;
  const isCancelled = currentStatus === "CANCELADA" || (isPending && timeLeftMs <= 0);

  // Formatted deadline (e.g. 15 minutos desde creación o fecha límite)
  const expirationDate = new Date(order.expiresAt);
  const formattedDeadline = `${expirationDate.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "numeric",
  })} a las ${expirationDate.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  // Masked DNI / CUIT for privacy (e.g., **.***.327) matching Foto 5
  const transferDocMatch = order.notes?.match(/Titular cuenta origen:\s*(DNI|CUIT)\s*([0-9.-]+)/i);
  const transferDocType = transferDocMatch ? transferDocMatch[1].toUpperCase() : "DNI";
  const transferDocRaw = transferDocMatch ? transferDocMatch[2] : order.customerDni;
  const cleanDoc = (transferDocRaw || "").replace(/\D/g, "");
  const maskedDoc =
    cleanDoc.length >= 3
      ? `**.***.${cleanDoc.slice(-3)}`
      : order.customerDni;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header Oficial */}
      <EcommerceHeader />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* ========================================================== */}
        {/* BANNER VERDE DE STOCK RESERVADO (FOTO 3)                   */}
        {/* ========================================================== */}
        {isPending && !isCancelled && (
          <div className="rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#06241d] border-emerald-800 text-white shadow-md animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#00D615] text-slate-950 flex items-center justify-center shrink-0 font-black">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    STOCK RESERVADO • ORDEN {order.orderCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400/20 text-[#00D615] border border-[#00D615]/30">
                    PRECIO CONGELADO
                  </span>
                </div>
                <p className="text-xs text-emerald-100/85">
                  Tus productos ya están separados en inventario. Elegí cómo querés abonar para completar la operación.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3.5 shrink-0">
              <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-center">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                  TIEMPO RESTANTE
                </span>
                <span className="text-lg font-black tabular-nums text-[#00D615] font-mono">
                  {String(minutesRemaining).padStart(2, "0")}:{String(secondsRemaining).padStart(2, "0")}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCancelReservation}
                disabled={isCancelling}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/15 disabled:opacity-50"
                title="Cancelar la reserva y devolver el stock al inventario"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <XCircle className="w-4 h-4 text-emerald-300" />
                )}
                <span>Cancelar reserva</span>
              </button>
            </div>
          </div>
        )}

        {cancelError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{cancelError}</span>
          </div>
        )}

        {/* ========================================================== */}
        {/* PANTALLA PRINCIPAL EN 2 COLUMNAS (TIENDANUBE STYLE - FOTO 5) */}
        {/* ========================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Instrucciones de Transferencia y Datos de Cuenta (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
              {/* Header de Estado */}
              {isCompleted ? (
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-[#00A811] shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                      Pago Acreditado
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950">
                      ¡Pago Confirmado y Orden Recibida!
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Estamos preparando tu pedido en Saavedra 241, Formosa.
                    </p>
                  </div>
                </div>
              ) : isCancelled ? (
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">
                      Reserva Expirada
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950">
                      Orden Cancelada o Vencida
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      El stock reservado fue restituido al catálogo para otros compradores.
                    </p>
                  </div>
                </div>
              ) : isVerification ? (
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                      En Verificación
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-950">
                      Comprobante Recibido
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Administración está corroborando la acreditación en el extracto bancario.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-slate-800" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-950 leading-snug">
                      Transferí antes del {formattedDeadline} para finalizar tu compra
                    </h1>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Para que tu pago se acredite rápidamente, enviá el monto exacto en una sola operación desde una cuenta que coincida con el {transferDocType}{" "}
                      <strong className="text-slate-900 font-mono">{maskedDoc}</strong>, o adjuntá tu comprobante abajo para que el equipo de Saavedra 241 concilie tu compra.
                    </p>
                  </div>
                </div>
              )}

              {/* Bloque de Datos Bancarios estilo Tiendanube (Foto 5) */}
              {(!isCompleted && !isCancelled) && (
                <div className="space-y-5">
                  {/* CVU / CBU */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                        CVU / CBU
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bankInfo.cbu, "cbu")}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 transition-colors cursor-pointer"
                      >
                        {copiedKey === "cbu" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                            <span className="text-emerald-700">¡COPIADO!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span className="uppercase text-[11px] font-bold">COPIAR CVU</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-base sm:text-lg font-black text-slate-950 tracking-wider select-all break-all">
                      {bankInfo.cbu}
                    </p>
                    <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 space-y-0.5">
                      <p>
                        <span className="text-slate-400">Alias:</span>{" "}
                        <strong className="text-slate-900 font-mono">{bankInfo.alias}</strong>{" "}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bankInfo.alias, "alias")}
                          className="text-[11px] text-emerald-700 hover:underline font-bold ml-1.5"
                        >
                          {copiedKey === "alias" ? "(Copiado)" : "(Copiar Alias)"}
                        </button>
                      </p>
                      <p>
                        <span className="text-slate-400">Beneficiario:</span>{" "}
                        <strong className="text-slate-900">{bankInfo.holder}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400">CUIT:</span>{" "}
                        <strong className="text-slate-900 font-mono">{bankInfo.cuit}</strong>
                      </p>
                      <p>
                        <span className="text-slate-400">Banco:</span>{" "}
                        <strong className="text-slate-900">{bankInfo.bank}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Monto exacto para transferencia */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">
                        Monto exacto para transferencia
                      </span>
                      <strong className="text-xl sm:text-2xl font-black text-slate-950">
                        {formatCurrency(order.total)}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(order.total), "monto")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-200/80 transition-colors cursor-pointer"
                    >
                      {copiedKey === "monto" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700 font-bold" />
                          <span className="text-emerald-700">¡COPIADO!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span className="uppercase text-[11px] font-bold">COPIAR MONTO</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Acciones de comprobante y WhatsApp */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-slate-800">
                      ¿Ya transferiste? Adjuntá tu comprobante para acelerar la preparación:
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs">
                        <FileUp className="w-4 h-4 text-slate-600" />
                        <span className="truncate">
                          {selectedFile ? selectedFile.name : "Subir comprobante (JPG, PNG o PDF)"}
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      {selectedFile && (
                        <button
                          type="button"
                          onClick={handleUploadProof}
                          disabled={isUploadingProof}
                          className="py-3 px-5 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isUploadingProof ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                              <span>ENVIANDO...</span>
                            </>
                          ) : (
                            <span>ENVIAR COMPROBANTE</span>
                          )}
                        </button>
                      )}
                    </div>

                    {proofError && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{proofError}</span>
                      </p>
                    )}

                    {proofUploaded && (
                      <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>¡Comprobante recibido con éxito! En breve lo validaremos.</span>
                      </p>
                    )}

                    {/* Botón WhatsApp oficial */}
                    <a
                      href={order.whatsappContingencyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                      <span>AVISAR O ENVIAR COMPROBANTE POR WHATSAPP</span>
                    </a>

                    <div className="pt-2 text-center">
                      <Link
                        href="/checkout"
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition-colors"
                      >
                        Cambiar medio de pago
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Bloque de Acciones cuando la orden está Cancelada o Vencida */}
              {isCancelled && (
                <div className="space-y-5 pt-1 animate-in fade-in duration-200">
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2 text-xs text-amber-950">
                    <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>El tiempo de reserva de 15 minutos ha finalizado</span>
                    </div>
                    <p className="leading-relaxed text-amber-900/90 text-xs">
                      Para garantizar la equidad con otros compradores, las unidades se liberaron y volvieron al inventario de Saavedra 241. Si todavía querés concretar tu compra, podés volver a cargar tus productos al carrito con un solo clic.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRetryOrder}
                      disabled={isRetrying}
                      className="flex-1 py-4 px-6 rounded-full bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#00D615]/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>CARGANDO AL CARRITO...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                          <span>REINTENTAR COMPRA Y RESERVAR</span>
                        </>
                      )}
                    </button>

                    <Link
                      href="/catalogo"
                      className="py-4 px-6 rounded-full bg-slate-900 hover:bg-black active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Ver Catálogo</span>
                    </Link>
                  </div>

                  {/* Asistencia Directa por WhatsApp */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">
                        ¿Tuviste algún inconveniente con el pago o transferencia?
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Nuestro equipo en Saavedra 241 puede asistirte para coordinar tu pedido.
                      </p>
                    </div>

                    <a
                      href={whatsappContingencyExpiredUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs uppercase tracking-wider shadow-xs transition-colors shrink-0"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Consultar por WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Destino de Envío */}
              <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
                <Truck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Destino:</strong>{" "}
                  {order.shippingAddress
                    ? `${order.shippingAddress}, ${order.shippingCity || "Formosa"} (CP ${order.shippingPostalCode || "3600"})`
                    : "Retiro en local Saavedra 241, Formosa Capital"}
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Resumen de Pedido y Contacto (5 cols - Foto 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
              {/* Productos */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={item.imageUrl || "/placeholder-product.svg"}
                        alt={item.productName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.productName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.size && <span>{item.size}</span>}
                        {item.color && <span> • {item.color}</span>}
                        <span> × {item.quantity}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Costo de envío</span>
                  <span
                    className={`font-semibold ${
                      order.shippingCost === 0 ? "text-[#00A811] font-bold" : "text-slate-900"
                    }`}
                  >
                    {order.shippingCost === 0 ? "A convenir / Gratis" : formatCurrency(order.shippingCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-100">
                  <span>Total</span>
                  <span className="text-xl text-[#00A811]">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Cómo seguir el pedido */}
              <div className="pt-4 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="text-sm">✉️</span>
                  <span>Cómo seguir el pedido</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Te enviamos un e-mail a <strong>{order.customerEmail}</strong> con un link a esta página, para que puedas seguir la entrega de tu compra.
                </p>
              </div>

              {/* Información del pedido */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-900 pb-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Información del pedido</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    E-MAIL
                  </span>
                  <span className="text-slate-800 font-medium">{order.customerEmail}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    DOMICILIO DE FACTURACIÓN Y DE ENTREGA
                  </span>
                  <p className="text-slate-800 font-medium leading-snug">
                    {order.customerName}
                    <br />
                    {order.customerPhone}
                    <br />
                    {order.shippingAddress || "Saavedra 241"}
                    <br />
                    {order.shippingCity || "Formosa"}, CP {order.shippingPostalCode || "3600"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    FORMA DE ENTREGA
                  </span>
                  <span className="text-slate-800 font-medium">{getShippingLabel(order.shippingMethod)}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    PEDIDO REALIZADO
                  </span>
                  <span className="text-slate-800 font-medium">
                    {new Date(order.createdAt).toLocaleDateString("es-AR", {
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    a las{" "}
                    {new Date(order.createdAt).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick print and back to catalog */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante</span>
              </button>

              <Link
                href="/catalogo"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-colors"
              >
                <span>Ir al Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <EcommerceFooter />
    </div>
  );
}
