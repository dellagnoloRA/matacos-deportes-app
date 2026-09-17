"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Receipt,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Store,
  Printer,
  ChevronRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Clock,
  Package,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getSaleHistory } from "@/server/actions/saleActions";

export interface SaleHistoryItem {
  id: string;
  invoiceNumber: string | null;
  userId: string | null;
  total: number;
  discount: number;
  channel: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    variantId: string;
    quantity: number;
    price: number;
    subtotal: number;
    variant: {
      id: string;
      size: string;
      color: string;
      barcode?: string | null;
      sku?: string | null;
      product: {
        id: string;
        name: string;
        brand: string;
        modelCode?: string | null;
        imageUrl?: string | null;
      };
    };
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
  }>;
}

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTicketNumber?: string | null;
}

export function SalesHistoryModal({
  isOpen,
  onClose,
  selectedTicketNumber,
}: SalesHistoryModalProps) {
  const [sales, setSales] = useState<SaleHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [activeSale, setActiveSale] = useState<SaleHistoryItem | null>(null);

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSaleHistory({ limit: 80 });
      if (res.success && Array.isArray(res.data)) {
        const salesList = res.data as unknown as SaleHistoryItem[];
        setSales(salesList);
        // Si viene un ticket preseleccionado, abrirlo directamente
        if (selectedTicketNumber) {
          const found = salesList.find(
            (s) => s.invoiceNumber === selectedTicketNumber
          );
          if (found) setActiveSale(found);
        }
      }
    } catch (error) {
      console.error("Error al cargar historial de ventas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicketNumber]);

  useEffect(() => {
    if (isOpen) {
      fetchSales();
    } else {
      setActiveSale(null);
      setSearchQuery("");
    }
  }, [isOpen, fetchSales]);

  if (!isOpen) return null;

  // Filtrado en memoria por número de ticket, producto, o método
  const filteredSales = sales.filter((sale) => {
    const matchesMethod =
      methodFilter === "ALL" ||
      sale.payments.some((p) => p.method === methodFilter);

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesMethod;

    const matchesTicket = sale.invoiceNumber?.toLowerCase().includes(q);
    const matchesProduct = sale.items.some(
      (item) =>
        item.variant.product.name.toLowerCase().includes(q) ||
        item.variant.product.brand.toLowerCase().includes(q) ||
        item.variant.size.toLowerCase().includes(q)
    );

    return matchesMethod && (matchesTicket || matchesProduct);
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "EFECTIVO":
        return {
          label: "Efectivo",
          icon: Banknote,
          className: "bg-emerald-50 text-emerald-800 border-emerald-300",
        };
      case "DEBITO":
        return {
          label: "Débito",
          icon: CreditCard,
          className: "bg-blue-50 text-blue-800 border-blue-300",
        };
      case "CREDITO":
        return {
          label: "Crédito",
          icon: CreditCard,
          className: "bg-purple-50 text-purple-800 border-purple-300",
        };
      case "TRANSFERENCIA":
        return {
          label: "Transferencia",
          icon: Store,
          className: "bg-amber-50 text-amber-800 border-amber-300",
        };
      case "QR_MERCADOPAGO":
        return {
          label: "QR Mercado Pago",
          icon: QrCode,
          className: "bg-sky-50 text-sky-800 border-sky-300",
        };
      default:
        return {
          label: method,
          icon: CreditCard,
          className: "bg-slate-100 text-slate-800 border-slate-300",
        };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Cabecera Principal */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  Historial de Tickets y Ventas
                </h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Mostrador Saavedra 241
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Registro de ventas multiproducto y auditoría de comprobantes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSales}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Actualizar lista de tickets"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido: Si hay un ticket activo seleccionado, muestra el detalle del ticket; si no, la lista */}
        {activeSale ? (
          /* ========================================================= */
          /* VISTA DETALLADA DE UN TICKET ESPECÍFICO                   */
          /* ========================================================= */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Barra superior del detalle */}
            <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveSale(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al listado de tickets</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Imprimir ticket o guardar como PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
              </div>
            </div>

            {/* Comprobante Digital (Estilo Ticket Térmico Imprimible) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
              <div
                id="printable-ticket"
                className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-slate-900 font-sans print:shadow-none print:border-none print:max-w-none print:p-0"
              >
                {/* Cabecera del Comercio */}
                <div className="text-center pb-4 border-b border-dashed border-slate-300">
                  <div className="inline-block font-black italic text-emerald-700 text-xl tracking-tighter">
                    MATACOS DEPORTES
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Artículos Deportivos & Accesorios
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Saavedra 241 — Formosa Capital, Argentina
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-slate-800 border border-slate-200">
                    <span>COMPROBANTE DE VENTA:</span>
                    <span className="text-emerald-700">{activeSale.invoiceNumber}</span>
                  </div>
                </div>

                {/* Metadatos de la Venta */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1 text-slate-600 border-b border-dashed border-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Fecha y Hora:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatDate(activeSale.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">
                      Canal de Venta:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeSale.channel || "MOSTRADOR"}
                    </span>
                  </div>
                </div>

                {/* Detalle de Productos Vendidos */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Detalle de Artículos ({activeSale.items.length})
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                    {activeSale.items.map((item) => (
                      <div key={item.id} className="p-2.5 flex items-start justify-between gap-3 text-xs">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 leading-tight">
                            {item.variant.product.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{item.variant.product.brand}</span>
                            <span>•</span>
                            <span className="bg-slate-200 px-1 py-0.2 rounded font-semibold text-slate-700">
                              Talle {item.variant.size}
                            </span>
                            {item.variant.color && <span>({item.variant.color})</span>}
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          <div className="font-mono text-slate-600 text-[11px]">
                            {item.quantity} un. x {formatCurrency(item.price)}
                          </div>
                          <div className="font-black text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totales y Liquidación */}
                <div className="pt-2 border-t-2 border-dashed border-slate-300 space-y-1 text-xs">
                  {activeSale.discount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Descuento aplicado:</span>
                      <span className="font-semibold text-rose-600">
                        -{formatCurrency(activeSale.discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline pt-2">
                    <span className="text-sm font-black uppercase text-slate-900 tracking-tight">
                      Total Pagado:
                    </span>
                    <span className="text-xl font-black text-emerald-700 tracking-tight font-mono">
                      {formatCurrency(activeSale.total)}
                    </span>
                  </div>
                </div>

                {/* Métodos de Pago Aplicados */}
                <div className="pt-3 border-t border-dashed border-slate-300">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Forma de Cobro:
                  </span>
                  <div className="space-y-1">
                    {activeSale.payments.map((p) => {
                      const badge = getMethodBadge(p.method);
                      const Icon = badge.icon;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-100 border border-slate-200"
                        >
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-slate-600" />
                            <span className="font-bold text-slate-800">{badge.label}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pie del ticket */}
                <div className="pt-4 text-center text-[10px] text-slate-400 border-t border-slate-100">
                  <p>¡Gracias por elegir Matacos Deportes!</p>
                  <p className="font-mono mt-0.5">Sistema de Gestión & POS Saavedra 241</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* LISTADO GENERAL DE TICKETS REGISTRADOS                     */
          /* ========================================================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barra de Búsqueda y Filtros */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por número de ticket (ej: TKT-1234), nombre de prenda o marca..."
                  className="w-full text-xs text-slate-900 pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                />
              </div>

              {/* Filtro por Medio de Pago */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  aria-label="Filtrar por medio de pago"
                  className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
                >
                  <option value="ALL">Todos los medios de pago</option>
                  <option value="EFECTIVO">Solo Efectivo</option>
                  <option value="DEBITO">Solo Débito</option>
                  <option value="CREDITO">Solo Crédito</option>
                  <option value="TRANSFERENCIA">Solo Transferencia</option>
                </select>
              </div>
            </div>

            {/* Listado de Ventas */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  <span className="text-xs font-semibold">Cargando tickets registrados...</span>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <Receipt className="w-12 h-12 mx-auto stroke-1 mb-2 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No se encontraron ventas</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery
                      ? "Probá con otro término de búsqueda."
                      : "Aún no hay ventas registradas en el sistema."}
                  </p>
                </div>
              ) : (
                filteredSales.map((sale) => {
                  const totalItemsCount = sale.items.reduce((acc, i) => acc + i.quantity, 0);
                  const primaryMethod = sale.payments[0]?.method || "EFECTIVO";
                  const badge = getMethodBadge(primaryMethod);
                  const Icon = badge.icon;

                  return (
                    <div
                      key={sale.id}
                      onClick={() => setActiveSale(sale)}
                      className="py-3 px-3.5 hover:bg-emerald-50/50 rounded-2xl transition-colors flex items-center justify-between gap-4 cursor-pointer group border border-transparent hover:border-emerald-200"
                    >
                      {/* Lado izquierdo: Ticket + Fecha + Ítems */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-900 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors">
                            {sale.invoiceNumber || "S/N"}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(sale.createdAt)}
                          </span>
                        </div>

                        {/* Resumen de productos en una línea */}
                        <p className="text-xs text-slate-600 truncate max-w-xl">
                          <span className="font-bold text-slate-800">
                            {totalItemsCount} {totalItemsCount === 1 ? "artículo" : "artículos"}:
                          </span>{" "}
                          {sale.items
                            .map((i) => `${i.variant.product.name} (Talle ${i.variant.size}) x${i.quantity}`)
                            .join(", ")}
                        </p>
                      </div>

                      {/* Lado derecho: Medio de pago + Monto Total */}
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div className="hidden sm:block">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-sm font-black text-slate-900 block font-mono">
                            {formatCurrency(sale.total)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold uppercase flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completada
                          </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pie con Contador Total */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Mostrando <strong>{filteredSales.length}</strong> de <strong>{sales.length}</strong> tickets
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                Saavedra 241 • Formosa
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
