"use client";

import { useEffect, useState } from "react";
import { ReceiptData } from "@/schemas/receipt";
import { Printer, Copy, Check, ArrowLeft } from "lucide-react";

interface TicketPrintClientProps {
  receipt: ReceiptData;
  autoPrint?: boolean;
}

export function TicketPrintClient({ receipt, autoPrint = true }: TicketPrintClientProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    const el = document.getElementById("ticket-paper-content");
    if (el) {
      await navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200/80 flex flex-col items-center py-6 px-3 print:p-0 print:bg-white">
      {/* Barra de Herramientas de Pantalla (Oculta en Impresión) */}
      <div className="no-print w-full max-w-[420px] mb-4 bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-slate-800">Comprobante de Venta</h1>
            <p className="text-xs text-slate-500 font-mono">{receipt.sale.invoiceNumber} • {receipt.sale.time}</p>
          </div>
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : window.close())}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Comprobante (80mm)
          </button>
          <button
            onClick={handleCopyText}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      {/* Ticket Térmico Optimizado (80mm ancho estándar continuo) */}
      <div
        id="ticket-paper-content"
        className="ticket-paper w-[310px] max-w-[80mm] bg-white px-3.5 py-4 shadow-xl rounded-sm font-mono text-black text-[12.5px] leading-snug select-text print:shadow-none print:px-2 print:py-2 print:w-[80mm] print:m-0"
      >
        {/* Cabecera Comercial */}
        <div className="text-center font-black tracking-[0.25em] text-[16px] leading-tight pt-1">
          M A T A C O S
        </div>
        <div className="text-center font-black tracking-[0.2em] text-[16px] leading-tight mb-2.5">
          D E P O R T E S
        </div>

        {/* Datos Comerciales y Fiscales del Emisor */}
        <div className="text-left text-[11.5px] leading-[1.3] text-neutral-900 space-y-0.5">
          <div className="font-semibold">{receipt.company.legalName}</div>
          <div>CUIT Nro.: {receipt.company.cuit}</div>
          <div>Ing. Brutos {receipt.company.iibb}</div>
          <div>Dirección: {receipt.company.address}</div>
          <div>{receipt.company.city}</div>
          <div>C.P.{receipt.company.postalCode}</div>
          <div>Inicio de Actividades: {receipt.company.startDate}</div>
          <div>{receipt.company.vatCondition}</div>
          <div className="font-medium pt-0.5">{receipt.sale.customerCondition || "A CONSUMIDOR FINAL"}</div>
          {receipt.sale.customerName && receipt.sale.customerName !== "CONSUMIDOR FINAL" && (
            <div className="font-bold pt-0.5">Cliente: {receipt.sale.customerName}</div>
          )}
        </div>

        {/* Separador */}
        <div className="border-t border-dashed border-neutral-300 my-2.5" />

        {/* Identificación del Comprobante */}
        <div className="text-center text-[12px] space-y-0.5">
          <div className="font-bold text-[13px]">{receipt.sale.voucherType}</div>
          <div>
            P.V. Nro. {receipt.sale.pointOfSale} - Nro. T. {receipt.sale.voucherNumber}
          </div>
          <div className="flex justify-between items-baseline pt-0.5">
            <span>Fecha {receipt.sale.date}</span>
            <span>Hora {receipt.sale.time}</span>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-dashed border-neutral-300 my-2.5" />

        {/* Renglones / Ítems de la Venta (Con nombre real del producto) */}
        <div className="space-y-2">
          {receipt.items.map((item, idx) => (
            <div key={idx} className="leading-snug">
              <div className="flex justify-between items-start gap-2">
                <span className="font-bold text-[13px] flex-1 break-words">
                  {item.productName.toUpperCase()}
                </span>
                <span className="shrink-0 font-bold text-[13px] text-right">
                  {item.formattedSubtotal}
                </span>
              </div>
              
              {/* Información detallada de variantes y cantidades */}
              <div className="text-[11px] text-neutral-600 flex justify-between items-baseline mt-0.5">
                <span>
                  {item.quantity > 1 ? `${item.quantity} un. x ${item.formattedUnitPrice}` : "1 un."}
                  {item.size && item.size !== "U" ? ` • Talle: ${item.size}` : ""}
                  {item.color && item.color !== "Único" && item.color !== "Estándar" ? ` • Color: ${item.color}` : ""}
                </span>
                {item.discount > 0 && (
                  <span className="text-neutral-700 font-medium">Bonif.: -{item.formattedDiscount}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Separador Total */}
        <div className="border-t border-dashed border-neutral-400 my-2.5" />

        {/* Total General */}
        <div className="flex justify-between items-baseline py-1 border-y-2 border-black my-1">
          <span className="font-black text-[15.5px] tracking-wide">TOTAL</span>
          <span className="font-black text-[15.5px]">{receipt.totals.formattedNetTotal}</span>
        </div>

        {/* Separador Pagos */}
        <div className="my-2" />

        {/* Pagos Realizados */}
        <div>
          <div className="text-[11.5px] font-bold mb-1">RECIBI(MOS)</div>
          <div className="space-y-1">
            {receipt.payments.map((pay, idx) => (
              <div key={idx} className="text-[12px]">
                <div className="flex justify-between items-baseline">
                  <span>{pay.methodName.toUpperCase()}</span>
                  <span className="font-bold">{pay.formattedAmount}</span>
                </div>
                {pay.receivedAmount != null && pay.change != null && pay.change > 0 && (
                  <div className="text-[11px] text-neutral-600 space-y-0.5 mt-0.5 pl-2">
                    <div className="flex justify-between">
                      <span>SU PAGO:</span>
                      <span>{pay.formattedReceivedAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SU VUELTO:</span>
                      <span>{pay.formattedChange}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Separador Transparencia Fiscal */}
        <div className="border-t border-dashed border-neutral-300 my-2.5" />

        {/* Transparencia Fiscal (RG AFIP 5003) */}
        <div>
          <div className="text-center font-bold text-[11.5px] tracking-wider mb-1">
            TRANSPARENCIA FISCAL
          </div>
          <div className="flex justify-between items-baseline text-[12px]">
            <span>IVA contenido (21%):</span>
            <span className="font-bold">{receipt.fiscal.formattedVatAmount}</span>
          </div>
          <div className="text-right text-[11px] font-bold text-neutral-700 mt-0.5">
            {receipt.sale.cashierCode || "CAJERO01"}
          </div>
        </div>

        {/* Separador Código QR */}
        <div className="border-t border-dashed border-neutral-300 my-2" />

        {/* Código QR Oficial AFIP */}
        <div className="flex flex-col items-center justify-center my-2">
          {receipt.fiscal.qrDataUrl ? (
            <img
              src={receipt.fiscal.qrDataUrl}
              alt="Código QR AFIP"
              className="w-[145px] h-[145px] object-contain image-rendering-pixelated"
            />
          ) : (
            <div className="w-[145px] h-[145px] border border-dashed border-neutral-400 flex items-center justify-center text-[11px]">
              [ CÓDIGO QR AFIP ]
            </div>
          )}
        </div>

        {/* Pie de Página Controlador Fiscal */}
        <div className="border-t border-dotted border-neutral-300 pt-1.5 flex justify-between items-baseline text-[11px] text-neutral-600">
          <span>CF {receipt.fiscal.fiscalSerialNumber || "SESHRA000022252"}</span>
          <span>{receipt.fiscal.softwareVersion || "V: 1.02"}</span>
        </div>
      </div>

      {/* Reglas de Impresión Térmica en CSS */}
      <style jsx global>{`
        @page {
          size: 80mm auto;
          margin: 0mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .ticket-paper {
            width: 80mm !important;
            max-width: 80mm !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 3mm 2mm 5mm 2mm !important;
          }
        }
      `}</style>
    </div>
  );
}
