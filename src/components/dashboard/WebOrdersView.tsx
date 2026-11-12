"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Search,
  RefreshCw,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  ExternalLink,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  getWebOrdersAction,
  WebOrderDTO,
  WebOrdersSummaryCounts,
} from "@/server/actions/ecommerce/webOrdersActions";
import { WebOrderDetailModal } from "./WebOrderDetailModal";
import { WebOrderPackingSlipModal } from "./WebOrderPackingSlipModal";
import { CORREO_ARGENTINO_TRACKING_URL } from "@/lib/emailService";

type ActiveTab =
  | "TODAS"
  | "PENDIENTE_PAGO"
  | "EN_PREPARACION"
  | "LISTO_RETIRO"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "CANCELADAS";

export function WebOrdersView() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("TODAS");
  const [searchQuery, setSearchQuery] = useState("");
  const [shippingMethodFilter, setShippingMethodFilter] = useState<string>("TODOS");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [orders, setOrders] = useState<WebOrderDTO[]>([]);
  const [counts, setCounts] = useState<WebOrdersSummaryCounts>({
    total: 0,
    pendingPayment: 0,
    inPreparation: 0,
    readyForPickup: 0,
    onTheWay: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatching, setTotalMatching] = useState(0);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<WebOrderDTO | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [packingSlipOrder, setPackingSlipOrder] = useState<WebOrderDTO | null>(null);
  const [isPackingSlipOpen, setIsPackingSlipOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      let paymentStatus: "TODAS" | "PENDIENTE_PAGO" | "COMPLETADA" | "CANCELADA" = "TODAS";
      let shippingStatus: any = "TODAS";

      if (activeTab === "PENDIENTE_PAGO") {
        paymentStatus = "PENDIENTE_PAGO";
      } else if (activeTab === "CANCELADAS") {
        paymentStatus = "CANCELADA";
      } else if (activeTab === "EN_PREPARACION") {
        paymentStatus = "COMPLETADA";
        shippingStatus = "EN_PREPARACION";
      } else if (activeTab === "LISTO_RETIRO") {
        paymentStatus = "COMPLETADA";
        shippingStatus = "LISTO_RETIRO";
      } else if (activeTab === "EN_CAMINO") {
        paymentStatus = "COMPLETADA";
        shippingStatus = "EN_CAMINO";
      } else if (activeTab === "ENTREGADO") {
        paymentStatus = "COMPLETADA";
        shippingStatus = "ENTREGADO";
      }

      const res = await getWebOrdersAction({
        page,
        limit: 15,
        search: searchQuery.trim() || undefined,
        paymentStatus,
        shippingStatus,
        shippingMethod: shippingMethodFilter as any,
      });

      if (res.success) {
        setOrders(res.orders);
        setCounts(res.counts);
        setTotalPages(res.pagination.totalPages);
        setTotalMatching(res.pagination.totalMatching);
      }
    } catch (err) {
      console.error("Error al cargar órdenes web:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, searchQuery, shippingMethodFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetail = (order: WebOrderDTO) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleOpenPackingSlip = (order: WebOrderDTO) => {
    setPackingSlipOrder(order);
    setIsPackingSlipOpen(true);
  };

  const handleOrderUpdated = (updated: WebOrderDTO) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    if (selectedOrder?.id === updated.id) {
      setSelectedOrder(updated);
    }
    fetchOrders();
  };

  const getShippingBadge = (method: string, status: WebOrderDTO["shippingStatus"]) => {
    const methodLabel =
      method === "RETIRO_LOCAL"
        ? "Retiro Salón"
        : method === "CADETERIA_FORMOSA"
        ? "Cadetería"
        : method === "CORREO_ARGENTINO_SUCURSAL"
        ? "Correo Sucursal"
        : "Correo Domicilio";

    let color = "bg-slate-100 text-slate-700 border-slate-200";
    if (status === "EN_PREPARACION") color = "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "LISTO_RETIRO") color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "EN_CAMINO") color = "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (status === "ENTREGADO") color = "bg-slate-900 text-white border-slate-900";
    if (status === "CANCELADO") color = "bg-rose-50 text-rose-700 border-rose-200";

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${color}`}>
        <span>{methodLabel}</span>
        <span>•</span>
        <span>{status}</span>
      </span>
    );
  };

  const getPaymentBadge = (status: WebOrderDTO["status"]) => {
    if (status === "COMPLETADA") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Aprobado</span>
        </span>
      );
    }
    if (status === "PENDIENTE_PAGO") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Pendiente (15m)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" />
        <span>Cancelado</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
      {/* Top Bar Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#094d3f] to-[#042820] border border-[#00D615]/40 flex items-center justify-center text-[#00D615] shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Órdenes Web y Despacho para Salón</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Saavedra 241
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Supervisión en tiempo real, picking en depósito/local, guías de Correo Argentino y contacto con clientes.
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchOrders()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => {
              setActiveTab("TODAS");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "TODAS"
                ? "bg-slate-950 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todas ({counts.total})
          </button>

          <button
            onClick={() => {
              setActiveTab("EN_PREPARACION");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "EN_PREPARACION"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>En Preparación ({counts.inPreparation})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("LISTO_RETIRO");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "LISTO_RETIRO"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Listas para Retiro ({counts.readyForPickup})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("EN_CAMINO");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "EN_CAMINO"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>En Camino ({counts.onTheWay})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("ENTREGADO");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "ENTREGADO"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Entregadas ({counts.delivered})
          </button>

          <button
            onClick={() => {
              setActiveTab("PENDIENTE_PAGO");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "PENDIENTE_PAGO"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes Pago ({counts.pendingPayment})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("CANCELADAS");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "CANCELADAS"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Canceladas ({counts.cancelled})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-4">
        {/* Search & Method Filter Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código (#WEB...), cliente, DNI, teléfono o guía..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={shippingMethodFilter}
              onChange={(e) => {
                setShippingMethodFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
            >
              <option value="TODOS">Todas las modalidades de envío</option>
              <option value="RETIRO_LOCAL">Retiro en Salón (Saavedra 241)</option>
              <option value="CADETERIA_FORMOSA">Cadetería Express (Formosa)</option>
              <option value="CORREO_ARGENTINO">Correo Argentino (Todas)</option>
              <option value="CORREO_ARGENTINO_DOMICILIO">Correo Argentino (Domicilio)</option>
              <option value="CORREO_ARGENTINO_SUCURSAL">Correo Argentino (Sucursal)</option>
            </select>
          </div>
        </div>

        {/* Orders Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Cargando órdenes de e-commerce...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No se encontraron órdenes web</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay pedidos que coincidan con la pestaña y filtros seleccionados en este momento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="py-3.5 px-4">Código & Fecha</th>
                    <th className="py-3.5 px-4">Cliente & Contacto</th>
                    <th className="py-3.5 px-4">Modalidad & Estado</th>
                    <th className="py-3.5 px-4">Pago & Total</th>
                    <th className="py-3.5 px-4">Prendas</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const formattedDate = new Date(order.createdAt).toLocaleDateString("es-AR", {
                      timeZone: "America/Argentina/Buenos_Aires",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const itemsSummary = order.items
                      .map((i) => `${i.quantity}x ${i.productName} (${i.size})`)
                      .join(", ");

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Código & Fecha */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900 text-[12.5px]">
                            #{order.orderCode}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{formattedDate}</div>
                        </td>

                        {/* Cliente & Contacto */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {order.customerName || "Consumidor Final"}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {order.customerPhone ? (
                              <span className="text-[11px] text-slate-600">{order.customerPhone}</span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Sin tel</span>
                            )}
                            {order.customerWhatsAppUrl && (
                              <a
                                href={order.customerWhatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir chat en WhatsApp"
                                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 p-0.5"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {order.customerDni && (
                            <div className="text-[10.5px] text-slate-400">DNI: {order.customerDni}</div>
                          )}
                        </td>

                        {/* Modalidad & Estado */}
                        <td className="py-3.5 px-4">
                          {getShippingBadge(order.shippingMethod, order.shippingStatus)}
                          {order.shippingBranchName && (
                            <div className="text-[10px] text-blue-700 font-medium truncate max-w-[180px] mt-0.5" title={order.shippingBranchName}>
                              Sucursal: {order.shippingBranchName}
                            </div>
                          )}
                          {order.shippingTrackingCode && (
                            <div className="mt-1">
                              <a
                                href={CORREO_ARGENTINO_TRACKING_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1"
                              >
                                <span>Guía: {order.shippingTrackingCode}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Pago & Total */}
                        <td className="py-3.5 px-4">
                          <div className="font-black text-slate-950 text-sm">
                            {order.totalFormatted}
                          </div>
                          <div className="mt-1">{getPaymentBadge(order.status)}</div>
                        </td>

                        {/* Prendas */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-slate-700 truncate" title={itemsSummary}>
                            {itemsSummary}
                          </div>
                          <div className="text-[10.5px] text-slate-400 mt-0.5">
                            {order.items.reduce((acc, i) => acc + i.quantity, 0)} u. en total
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenPackingSlip(order)}
                              title="Imprimir Remito / Etiqueta"
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDetail(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Picking</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
              <div>
                Mostrando página <strong>{page}</strong> de <strong>{totalPages}</strong> ({totalMatching} órdenes)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail & Picking Modal */}
      <WebOrderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        order={selectedOrder}
        onOrderUpdated={handleOrderUpdated}
        onOpenPackingSlip={handleOpenPackingSlip}
      />

      {/* Packing Slip Print Modal */}
      <WebOrderPackingSlipModal
        isOpen={isPackingSlipOpen}
        onClose={() => setIsPackingSlipOpen(false)}
        order={packingSlipOrder}
      />
    </div>
  );
}
