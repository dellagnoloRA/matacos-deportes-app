"use client";

import React, { useState } from "react";
import {
  X,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  Truck,
  MessageCircle,
  Printer,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Send,
  Loader2,
  Store,
  Ban,
  AlertTriangle,
} from "lucide-react";
import {
  WebOrderDTO,
  updateWebOrderShippingStatusAction,
  generateShippingLabelAction,
  cancelWebOrderAction,
} from "@/server/actions/ecommerce/webOrdersActions";
import { CORREO_ARGENTINO_TRACKING_URL } from "@/lib/emailService";

interface WebOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WebOrderDTO | null;
  onOrderUpdated: (updated: WebOrderDTO) => void;
  onOpenPackingSlip: (order: WebOrderDTO) => void;
}

export function WebOrderDetailModal({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
  onOpenPackingSlip,
}: WebOrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const [shippingStatus, setShippingStatus] = useState<WebOrderDTO["shippingStatus"]>(
    order.shippingStatus
  );
  const [trackingCode, setTrackingCode] = useState(order.shippingTrackingCode || "");
  const [notes, setNotes] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const formattedDate = new Date(order.createdAt).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSaveStatus = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await updateWebOrderShippingStatusAction({
        orderId: order.id,
        shippingStatus,
        shippingTrackingCode: trackingCode.trim() || null,
        notifyCustomer,
        notes: notes.trim() || null,
      });

      if (res.success && res.data) {
        onOrderUpdated(res.data);
        setFeedback({
          type: "success",
          message: res.emailDispatched
            ? "Estado actualizado y notificación por correo enviada con éxito."
            : "Estado actualizado correctamente.",
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "No se pudo actualizar el estado logístico.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Ocurrió un error inesperado al procesar la actualización.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateLabel = async () => {
    setIsGeneratingLabel(true);
    setFeedback(null);
    try {
      const res = await generateShippingLabelAction({
        orderId: order.id,
        operatorName: "Operador Mostrador Saavedra 241",
      });
      if (res.success && res.data) {
        onOrderUpdated(res.data);
        setTrackingCode(res.trackingNumber || res.data.shippingTrackingCode || "");
        setShippingStatus("EN_CAMINO");
        setFeedback({
          type: "success",
          message: `Guía generada exitosamente (${res.trackingNumber}). Pedido en camino e imposición registrada en Correo Argentino.`,
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "No se pudo generar la guía de Correo Argentino.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Error de conexión al generar la guía postal.",
      });
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setFeedback({
        type: "error",
        message: "Por favor indicá un motivo para la anulación del pedido.",
      });
      return;
    }
    setIsCancelling(true);
    setFeedback(null);
    try {
      const res = await cancelWebOrderAction({
        orderId: order.id,
        reason: cancelReason.trim(),
        operatorName: "Operador Mostrador Saavedra 241",
      });
      if (res.success && res.data) {
        onOrderUpdated(res.data);
        setShippingStatus("CANCELADO");
        setIsCancelDialogOpen(false);
        setFeedback({
          type: "success",
          message: "Pedido anulado con éxito. Las existencias físicas han sido devueltas al inventario (movimiento ANULACION_VENTA).",
        });
        setTimeout(() => setFeedback(null), 6000);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "No se pudo anular la orden.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Ocurrió un error al procesar la anulación de la orden.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: WebOrderDTO["shippingStatus"]) => {
    switch (status) {
      case "PENDIENTE":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Pendiente de Preparación</span>;
      case "EN_PREPARACION":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">En Preparación (Picking)</span>;
      case "LISTO_RETIRO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Listo para Retiro (Saavedra 241)</span>;
      case "EN_CAMINO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">En Camino</span>;
      case "ENTREGADO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-white">Entregado</span>;
      case "CANCELADO":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#06241d] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#094d3f] to-[#042820] border border-[#00D615]/40 flex items-center justify-center text-[#00D615] font-black">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">
                  Orden #{order.orderCode}
                </h3>
                {getStatusBadge(order.shippingStatus)}
              </div>
              <p className="text-xs text-emerald-300/80 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Ingresada el {formattedDate}</span>
                <span>•</span>
                <span>Canal: <strong>E-Commerce Web</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : "bg-rose-50 text-rose-800 border border-rose-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Customer & Shipping Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Datos del Comprador</span>
                </h4>
                {order.customerWhatsAppUrl && (
                  <a
                    href={order.customerWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nombre:</span>
                  <span className="font-bold text-slate-900">{order.customerName || "Consumidor Final"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DNI:</span>
                  <span className="font-medium text-slate-800">{order.customerDni || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="font-medium text-slate-800">{order.customerPhone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[200px]" title={order.customerEmail || ""}>
                    {order.customerEmail || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Logistics Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Método y Destino de Envío</span>
                </h4>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                  {order.shippingMethod === "RETIRO_LOCAL"
                    ? "Retiro en Saavedra 241"
                    : order.shippingMethod === "CADETERIA_FORMOSA"
                    ? "Cadetería Formosa"
                    : order.shippingMethod === "CORREO_ARGENTINO_SUCURSAL"
                    ? "Correo Arg (Sucursal)"
                    : "Correo Arg (Domicilio)"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-800">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>{order.shippingAddress || "Saavedra 241, Formosa Capital"}</strong>
                    {order.shippingCity && `, ${order.shippingCity}`}
                    {order.shippingPostalCode && ` (CP ${order.shippingPostalCode})`}
                  </span>
                </div>

                {order.shippingBranchName && (
                  <div className="flex items-start gap-2 text-xs text-blue-900 bg-blue-50/80 p-2.5 rounded-xl border border-blue-200">
                    <Store className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Sucursal de Retiro Seleccionada:</span>
                      <span className="text-slate-800">{order.shippingBranchName}</span>
                      {order.shippingBranchCode && (
                        <span className="text-[11px] text-blue-700 font-mono block mt-0.5">
                          Código sucursal: {order.shippingBranchCode}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {order.shippingTrackingCode && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Código Guía:</span>
                    <a
                      href={CORREO_ARGENTINO_TRACKING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>{order.shippingTrackingCode}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Importe Total Orden:</span>
                  <span className="font-black text-slate-950 text-sm">{order.totalFormatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Picking Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Artículos para Picking en Salón / Depósito
                </h4>
                <p className="text-[11px] text-slate-500">
                  Controle existencias físicas antes de embalar el paquete
                </p>
              </div>
              <button
                onClick={() => onOpenPackingSlip(order)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Remito</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 text-center w-14">Cant</th>
                    <th className="py-2.5 px-4">Prenda / Artículo</th>
                    <th className="py-2.5 px-4">Talle & Color</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-center">Stock Físico</th>
                    <th className="py-2.5 px-4 text-right">P. Unitario</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 text-white font-black text-xs">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{item.productName}</div>
                            <div className="text-[11px] text-slate-500">{item.brandName} • {item.categoryName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-black text-slate-800 text-[11px]">
                            {item.size}
                          </span>
                          <span className="text-slate-600 font-medium">{item.color}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{item.sku}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col text-[10px] leading-tight">
                          <span className="text-emerald-700 font-bold">Salón: {item.stockStore} u.</span>
                          <span className="text-blue-700 font-medium">Depósito: {item.stockWarehouse} u.</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">{item.unitPriceFormatted}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{item.subtotalFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operaciones de Correo Argentino y Rótulo Postal (BE-RF25) */}
          {(order.shippingMethod.startsWith("CORREO_ARGENTINO") || order.shippingTrackingCode) && (
            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-5 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                      Despacho e Imposición Correo Argentino (RF-25)
                    </h4>
                    <p className="text-[11px] text-indigo-700">
                      Generación de guía postal e impresión de rótulo para embalaje
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isGeneratingLabel || order.status === "CANCELADA"}
                    onClick={handleGenerateLabel}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                  >
                    {isGeneratingLabel ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Package className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {order.shippingTrackingCode ? "Regenerar Guía" : "Generar Guía Correo Argentino"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`/api/shipping/labels/${order.id}`, "_blank")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-300 text-xs font-bold shadow-2xs transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Imprimir Rótulo Postal</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/80 p-3 rounded-xl border border-indigo-100/80">
                  <span className="text-slate-500 block text-[11px]">Modalidad</span>
                  <span className="font-bold text-slate-900">
                    {order.shippingMethod === "CORREO_ARGENTINO_SUCURSAL"
                      ? "Retiro en Sucursal Oficial"
                      : "Entrega a Domicilio"}
                  </span>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-indigo-100/80">
                  <span className="text-slate-500 block text-[11px]">Código Guía / Tracking</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">
                    {order.shippingTrackingCode || "Pendiente de imposición"}
                  </span>
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-indigo-100/80">
                  <span className="text-slate-500 block text-[11px]">Destino Declarado</span>
                  <span className="font-medium text-slate-800 truncate block" title={order.shippingBranchName || order.shippingAddress || ""}>
                    {order.shippingBranchName || `${order.shippingAddress || ""}, ${order.shippingCity || ""} (CP ${order.shippingPostalCode || ""})`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status Mutation & Logistics Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              Gestión del Estado de Despacho
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cambiar Estado Logístico
                </label>
                <select
                  value={shippingStatus}
                  onChange={(e) => setShippingStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="PENDIENTE">PENDIENTE — A la espera de armado</option>
                  <option value="EN_PREPARACION">EN PREPARACIÓN — Picking en depósito/salón</option>
                  <option value="LISTO_RETIRO">LISTO RETIRO — En mostrador Saavedra 241</option>
                  <option value="EN_CAMINO">EN CAMINO — Cadetería o Correo Argentino</option>
                  <option value="ENTREGADO">ENTREGADO — Paquete recibido por el cliente</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código de Guía (Correo Argentino / Remito)
                </label>
                <input
                  type="text"
                  placeholder="Ej: TN012345678AR"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nota o Mensaje Interno (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Retira familiar con autorización / Dejado en cadetería turno mañana"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyCustomer}
                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    Enviar correo de notificación automática a <strong>{order.customerEmail || "cliente"}</strong>
                  </span>
                </label>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveStatus}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-[#00D615]" />
                  )}
                  <span>Actualizar Estado</span>
                </button>
              </div>
            </div>
          </div>

          {/* Anulación de Pedido Web (BE-RF25 Subtarea 5) */}
          {order.shippingStatus !== "CANCELADO" && order.status !== "CANCELADA" && (
            <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-xs font-bold text-rose-900">
                    Zona de Control: Anulación y Devolución de Stock
                  </span>
                </div>
                {!isCancelDialogOpen && (
                  <button
                    type="button"
                    onClick={() => setIsCancelDialogOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 hover:bg-rose-100/60 text-rose-700 text-xs font-bold transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Anular Pedido...</span>
                  </button>
                )}
              </div>

              {isCancelDialogOpen && (
                <div className="pt-2 border-t border-rose-200 space-y-3">
                  <p className="text-xs text-rose-700">
                    Al anular este pedido, el sistema reintegrará automáticamente las existencias físicas al stock del salón (asentando un movimiento inmutable <code>ANULACION_VENTA</code>) o liberará las unidades reservadas.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-rose-900 mb-1">
                      Motivo de la anulación *
                    </label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Ej: Solicitado por el cliente / Falta de pago / Cambio de talle no disponible..."
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => setIsCancelDialogOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                    >
                      Descartar
                    </button>
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={handleCancelOrder}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                    >
                      {isCancelling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                      <span>Confirmar Anulación y Devolver Stock</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
