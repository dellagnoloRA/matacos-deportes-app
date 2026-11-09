"use client";

import React from "react";
import { X, Printer, Package, MapPin, User, Phone, CheckCircle, Truck } from "lucide-react";
import { WebOrderDTO } from "@/server/actions/ecommerce/webOrdersActions";

interface WebOrderPackingSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WebOrderDTO | null;
}

export function WebOrderPackingSlipModal({
  isOpen,
  onClose,
  order,
}: WebOrderPackingSlipModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);

  const shippingLabel =
    order.shippingMethod === "RETIRO_LOCAL"
      ? "Retiro en Salón (Saavedra 241)"
      : order.shippingMethod === "CADETERIA_FORMOSA"
      ? "Cadetería Express (Formosa Capital)"
      : "Correo Argentino a Domicilio";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Screen Only */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#06241d] text-white print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#094d3f] border border-[#00D615]/40 flex items-center justify-center text-[#00D615]">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                Remito de Embalaje y Despacho Web
              </h3>
              <p className="text-[11px] text-emerald-300/80">
                Orden #{order.orderCode} • Para pegado en bulto o archivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar - Screen Only */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 print:hidden">
          <span className="text-xs text-slate-500 font-medium">
            Formato estándar compatible con comandera 80mm y hoja A4
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00D615] hover:bg-[#00c013] text-slate-950 text-xs font-bold shadow-xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Remito</span>
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div
          id="packing-slip-printable-area"
          className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white text-slate-900 font-sans space-y-6 print:p-0 print:space-y-4 print:overflow-visible"
        >
          {/* Header Brand */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter text-slate-950">
                  MATACOS <span className="text-[#00b012] font-black">DEPORTES</span>
                </h1>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  Saavedra 241, Formosa Capital (CP 3600) • Tel: +54 9 3704-123456
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider">
                  Remito de Despacho
                </span>
                <p className="text-base font-black text-slate-950 mt-1">
                  #{order.orderCode}
                </p>
                <p className="text-[11px] text-slate-500">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* Logistics & Shipping Badge */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 print:bg-white print:border-slate-400">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Modalidad de Entrega
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-700" />
                {shippingLabel}
              </p>
              {order.shippingTrackingCode && (
                <div className="mt-2 pt-1 border-t border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Guía Correo Argentino
                  </span>
                  <p className="text-xs font-mono font-bold text-indigo-700">
                    {order.shippingTrackingCode}
                  </p>
                </div>
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Estado del Pedido
              </span>
              <p className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Pago Aprobado (Total: {order.totalFormatted})
              </p>
              <div className="mt-2 pt-1 border-t border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Bulto / Paquete
                </span>
                <p className="text-xs font-bold text-slate-900">
                  {totalItemsCount} {totalItemsCount === 1 ? "artículo" : "artículos"} en total
                </p>
              </div>
            </div>
          </div>

          {/* Customer / Recipient Section */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Datos del Destinatario</span>
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div>
                <span className="text-slate-500">Nombre: </span>
                <strong className="text-slate-950 font-bold">
                  {order.customerName || "Consumidor Final"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">DNI: </span>
                <strong className="text-slate-950 font-bold">
                  {order.customerDni || "No especificado"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Teléfono: </span>
                <strong className="text-slate-950 font-bold">
                  {order.customerPhone || "Sin teléfono"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Email: </span>
                <span className="text-slate-800">
                  {order.customerEmail || "Sin email"}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-950 font-bold">
                    {order.shippingAddress || "Retiro en local Saavedra 241"}
                  </strong>
                  {order.shippingCity && `, ${order.shippingCity}`}
                  {order.shippingPostalCode && ` (CP ${order.shippingPostalCode})`}
                </span>
              </div>
            </div>
          </div>

          {/* Items Picking List */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span>Artículos para Picking y Control</span>
            </h4>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-2 px-3 text-center w-12">Cant</th>
                  <th className="py-2 px-3">Producto & Marca</th>
                  <th className="py-2 px-3">Talle / Color</th>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3 text-right">P. Unit</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-50/50">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">{item.brandName}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      Talle: <strong>{item.size}</strong> • Color: <strong>{item.color}</strong>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {item.sku}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {item.unitPriceFormatted}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {item.subtotalFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-900">
            <div className="space-y-6">
              {order.notes && (
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <strong className="block text-slate-900 font-bold mb-0.5">Observaciones:</strong>
                  {order.notes}
                </div>
              )}
              <div className="pt-6 border-t border-dashed border-slate-400">
                <div className="w-48 border-t border-slate-600 text-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Control de Picking / Embalado por
                </div>
              </div>
            </div>

            <div className="text-right space-y-1 text-xs">
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Subtotal Productos:</span>
                <span>{order.totalFormatted}</span>
              </div>
              <div className="flex justify-between py-0.5 text-slate-600">
                <span>Costo de Envío:</span>
                <span>{order.shippingCost > 0 ? `$ ${order.shippingCost.toFixed(2)}` : "Gratis / Retiro"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-900 text-sm font-black text-slate-950">
                <span>Total Abonado:</span>
                <span>{order.totalFormatted}</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-bold mt-1">
                Comprobante oficial Matacos Deportes • Saavedra 241
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Media Print Global Rules */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #packing-slip-printable-area,
          #packing-slip-printable-area * {
            visibility: visible !important;
          }
          #packing-slip-printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
