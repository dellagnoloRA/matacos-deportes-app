"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Receipt,
  Search,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  ArrowUpRight,
  Printer,
  Eye,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Clock,
  Package,
  ShoppingBag,
  Store,
  X,
  User,
  PanelLeft,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getSaleHistory } from "@/server/actions/saleActions";

export interface ParsedExchangeData {
  isExchange: boolean;
  isReturn?: boolean;
  reason?: string;
  returnedItem?: string;
  deliveredItem?: string;
  financialSummary?: string;
  rawDetails?: string;
}

export function parseExchangeDetails(notes?: string | null): ParsedExchangeData | null {
  if (!notes) return null;
  const isReturn =
    notes.includes("[DEVOLUCION:") ||
    notes.toLowerCase().includes("devolución de producto") ||
    notes.toLowerCase().includes("devolución de prenda");
  const isExchange =
    notes.includes("[CAMBIO:") ||
    notes.toLowerCase().includes("cambio de producto") ||
    notes.toLowerCase().includes("cambio directo") ||
    notes.includes("VALE DE COMPRA");

  if (!isExchange && !isReturn) return null;

  let reason = "";
  const reasonMatch = notes.match(/reason=([^\]]*)/);
  if (reasonMatch && reasonMatch[1]) {
    try {
      reason = decodeURIComponent(reasonMatch[1]);
    } catch {
      reason = reasonMatch[1];
    }
  }

  // Remover etiqueta interna [CAMBIO:...] o [DEVOLUCION:...]
  const clean = notes
    .replace(/\[CAMBIO:[^\]]*\]\s*/, "")
    .replace(/\[DEVOLUCION:[^\]]*\]\s*/, "")
    .trim();

  let returnedItem = "";
  let deliveredItem = "";
  let financialSummary = "";

  if (isReturn) {
    const devPrendaMatch = clean.match(/Devolución de prenda:\s*([^.]+)\./i);
    if (devPrendaMatch) returnedItem = devPrendaMatch[1].trim();

    const montoMatch = clean.match(/Monto a reintegrar[^:]*:\s*([^.]+)\./i);
    if (montoMatch) financialSummary = `Monto a reintegrar: ${montoMatch[1].trim()}`;
    else financialSummary = "Devolución con reintegro al cliente";
  } else {
    const devuelveMatch = clean.match(/Devuelve:\s*([^.]+)\./i);
    if (devuelveMatch) returnedItem = devuelveMatch[1].trim();

    const entregaMatch = clean.match(/Entrega:\s*([^.]+)\./i);
    if (entregaMatch) deliveredItem = entregaMatch[1].trim();

    const diffMatch = clean.match(
      /(Diferencia a cobrar:[^.]+|Saldo a favor del cliente:[^.]+|Cambio directo sin diferencia[^.]+)/i
    );
    if (diffMatch) financialSummary = diffMatch[1].trim();
  }

  return {
    isExchange: !isReturn,
    isReturn,
    reason: reason || undefined,
    returnedItem: returnedItem || undefined,
    deliveredItem: deliveredItem || undefined,
    financialSummary: financialSummary || undefined,
    rawDetails: clean,
  };
}

export interface PosTransactionItem {
  id: string;
  invoiceNumber: string | null;
  ticketCode: string | null;
  customerName: string | null;
  total: number;
  subtotalGross?: number;
  discount: number;
  channel: string;
  status: string;
  createdAt: string;
  notes?: string | null;
  seller?: { id: string; name: string; email?: string } | null;
  cashier?: { id: string; name: string; email?: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    unitPrice?: number;
    subtotal: number;
    originalPrice?: number;
    discount?: number;
    variant: {
      id: string;
      size: string;
      color?: string;
      sku?: string | null;
      barcode?: string | null;
      product: {
        id: string;
        name: string;
        brand?: { name: string } | string | null;
        category?: { name: string } | string | null;
      };
    };
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: number;
    receivedAmount?: number | null;
    change?: number | null;
    cardBrand?: string | null;
    cardVoucher?: string | null;
    installments?: number | null;
    referenceCode?: string | null;
  }>;
}

export interface PosTransactionHistoryViewProps {
  onNavigateToPreventa?: () => void;
  onNavigateToCobrar?: () => void;
  onToggleSidebar?: () => void;
  pendingSalesCount?: number;
}

export type PosDateFilter = "TODAY" | "YESTERDAY" | "7DAYS" | "30DAYS" | "ALL";

// Helper para fecha en zona horaria Argentina (America/Argentina/Buenos_Aires)
function getArgentinaDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getYesterdayArgentinaDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getArgentinaDate(d);
}

export function PosTransactionHistoryView({
  onNavigateToPreventa,
  onNavigateToCobrar,
  onToggleSidebar,
  pendingSalesCount = 0,
}: PosTransactionHistoryViewProps) {
  const [sales, setSales] = useState<PosTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<PosDateFilter>("TODAY");
  const [operationFilter, setOperationFilter] = useState<"ALL" | "SALES" | "EXCHANGES">("ALL");

  // Transacción activa para modal de comprobante térmico
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] =
    useState<PosTransactionItem | null>(null);

  // Cerrar modal de comprobante con tecla Escape
  useEffect(() => {
    if (!selectedSaleForReceipt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedSaleForReceipt(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSaleForReceipt]);

  // Filas expandidas para ver desglose de artículos en la tabla
  const [expandedSaleIds, setExpandedSaleIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedSaleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Carga de ventas desde el backend
  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let dateParam: string | undefined;
      let startDateParam: string | undefined;

      const todayStr = getArgentinaDate();
      const yesterdayStr = getYesterdayArgentinaDate();

      if (dateFilter === "TODAY") {
        dateParam = todayStr;
      } else if (dateFilter === "YESTERDAY") {
        dateParam = yesterdayStr;
      } else if (dateFilter === "7DAYS") {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        startDateParam = d7.toISOString();
      } else if (dateFilter === "30DAYS") {
        const d30 = new Date();
        d30.setDate(d30.getDate() - 30);
        startDateParam = d30.toISOString();
      }

      const res = await getSaleHistory({
        date: dateParam,
        startDate: startDateParam,
        limit: 300,
        status: "COMPLETADA",
      });

      if (res.success && Array.isArray(res.data)) {
        setSales(res.data as unknown as PosTransactionItem[]);
      } else {
        setErrorMessage(res.error || "No se pudo cargar el historial de ventas");
      }
    } catch (err) {
      console.error("Error al cargar historial POS:", err);
      setErrorMessage("Error de conexión al cargar las transacciones");
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Filtrado en memoria por búsqueda, método de pago y tipo de operación
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Filtro por tipo de operación (Ventas regulares vs Cambios)
      if (operationFilter !== "ALL") {
        const isEx = !!parseExchangeDetails(s.notes);
        if (operationFilter === "EXCHANGES" && !isEx) return false;
        if (operationFilter === "SALES" && isEx) return false;
      }

      // Filtro por método de pago
      if (selectedMethod !== "ALL") {
        const hasMethod = s.payments.some((p) => p.method === selectedMethod);
        if (!hasMethod) return false;
      }

      // Filtro textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inv = s.invoiceNumber?.toLowerCase() || "";
        const tkt = s.ticketCode?.toLowerCase() || "";
        const cust = s.customerName?.toLowerCase() || "";
        const seller = s.seller?.name?.toLowerCase() || "";
        const cashier = s.cashier?.name?.toLowerCase() || "";
        const notes = (s.notes || "").toLowerCase();
        const matchNotes = notes.includes(q);
        const matchItem = s.items.some(
          (it) =>
            it.variant.product.name.toLowerCase().includes(q) ||
            (typeof it.variant.product.brand === "object"
              ? it.variant.product.brand?.name?.toLowerCase().includes(q)
              : String(it.variant.product.brand || "").toLowerCase().includes(q)) ||
            (it.variant.sku && it.variant.sku.toLowerCase().includes(q)) ||
            (it.variant.barcode && it.variant.barcode.toLowerCase().includes(q))
        );

        if (
          !inv.includes(q) &&
          !tkt.includes(q) &&
          !cust.includes(q) &&
          !seller.includes(q) &&
          !cashier.includes(q) &&
          !matchItem &&
          !matchNotes
        ) {
          return false;
        }
      }

      return true;
    });
  }, [sales, searchQuery, selectedMethod, operationFilter]);

  // Métricas agregadas
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalItems = 0;
    let cashRevenue = 0;
    let digitalRevenue = 0;

    filteredSales.forEach((s) => {
      totalRevenue += Number(s.total || 0);
      s.items.forEach((it) => {
        totalItems += Number(it.quantity || 0);
      });
      s.payments.forEach((p) => {
        const amt = Number(p.amount || 0);
        if (p.method === "EFECTIVO") {
          cashRevenue += amt;
        } else {
          digitalRevenue += amt;
        }
      });
    });

    return {
      count: filteredSales.length,
      totalRevenue,
      totalItems,
      cashRevenue,
      digitalRevenue,
    };
  }, [filteredSales]);

  // Helper para renderizar badge de medio de pago
  const renderPaymentBadge = (method: string) => {
    switch (method) {
      case "EFECTIVO":
        return {
          label: "Efectivo",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: Banknote,
          iconColor: "text-emerald-600",
        };
      case "DEBITO":
        return {
          label: "Tarjeta Débito",
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: CreditCard,
          iconColor: "text-blue-600",
        };
      case "CREDITO":
        return {
          label: "Tarjeta Crédito",
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: CreditCard,
          iconColor: "text-indigo-600",
        };
      case "QR_MERCADOPAGO":
        return {
          label: "QR Mercado Pago",
          bg: "bg-cyan-50 text-cyan-800 border-cyan-200",
          icon: QrCode,
          iconColor: "text-cyan-600",
        };
      case "TRANSFERENCIA":
        return {
          label: "Transferencia",
          bg: "bg-purple-50 text-purple-800 border-purple-200",
          icon: ArrowUpRight,
          iconColor: "text-purple-600",
        };
      default:
        return {
          label: method.replace(/_/g, " "),
          bg: "bg-slate-100 text-slate-800 border-slate-200",
          icon: DollarSign,
          iconColor: "text-slate-600",
        };
    }
  };

  const getBrandName = (brand: any) => {
    if (!brand) return "";
    if (typeof brand === "string") return brand;
    if (typeof brand === "object" && brand.name) return brand.name;
    return "";
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & POS SUB-NAVIGATION TABS                      */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 sticky top-0 z-20 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Abrir menú"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <span>Historial de Transacciones POS</span>
                </h1>
                <span className="bg-indigo-50 text-indigo-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
                  Saavedra 241
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Auditoría completa de ventas cobradas, medios de pago, vuelto y detalle de artículos.
              </p>
            </div>
          </div>

          {/* Quick Sub-Navigation Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onNavigateToCobrar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-700" />
              <span>Volver a Caja</span>
            </button>

            <button
              onClick={fetchSales}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
              title="Refrescar transacciones"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CONTENIDO PRINCIPAL                                       */}
      {/* ============================================================ */}
      <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Ventas */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Transacciones
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {metrics.count}
              </p>
              <span className="text-[11px] text-slate-400 font-medium">tickets emitidos</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Facturación Total */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Total Cobrado
              </span>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <span className="text-[11px] text-emerald-600/80 font-medium">ingreso por ventas</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Artículos Vendidos */}
          <div className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Artículos Vendidos
              </span>
              <p className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
                {metrics.totalItems} u.
              </p>
              <span className="text-[11px] text-indigo-600/80 font-medium">unidades entregadas</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Efectivo vs Digital */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs flex items-center justify-between">
            <div className="space-y-1 w-full mr-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Medios de Pago
              </span>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600">Efvo:</span>
                <span className="font-bold text-slate-900">{formatCurrency(metrics.cashRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600">Digital:</span>
                <span className="font-bold text-indigo-700">{formatCurrency(metrics.digitalRevenue)}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. BARRA DE FILTROS                                          */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Buscador */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por ticket, comprobante, cliente, prenda o motivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtro por Tipo de Operación */}
            <div className="md:col-span-3 relative">
              <select
                value={operationFilter}
                onChange={(e) =>
                  setOperationFilter(e.target.value as "ALL" | "SALES" | "EXCHANGES")
                }
                aria-label="Filtrar por tipo de operación"
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none transition-all"
              >
                <option value="ALL">Operación: Todas</option>
                <option value="SALES">Solo Ventas Directas</option>
                <option value="EXCHANGES">Solo Cambios de Prenda</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filtro por Medio de Pago */}
            <div className="md:col-span-2 relative">
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                aria-label="Filtrar por método de pago"
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none transition-all"
              >
                <option value="ALL">Medio: Todos</option>
                <option value="EFECTIVO">Solo Efectivo</option>
                <option value="DEBITO">Solo Débito</option>
                <option value="CREDITO">Solo Crédito</option>
                <option value="QR_MERCADOPAGO">Solo QR MP</option>
                <option value="TRANSFERENCIA">Solo Transf.</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filtro por Fecha */}
            <div className="md:col-span-3 relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as PosDateFilter)}
                aria-label="Filtrar por fecha"
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none transition-all"
              >
                <option value="TODAY">Período: Hoy</option>
                <option value="YESTERDAY">Ayer</option>
                <option value="7DAYS">Últimos 7 días</option>
                <option value="30DAYS">Últimos 30 días</option>
                <option value="ALL">Todo el historial</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. LISTADO DE TRANSACCIONES                                  */}
        {/* ============================================================ */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
            <div className="inline-block animate-spin text-indigo-600 mb-3">
              <RotateCcw className="w-8 h-8" />
            </div>
            <p className="text-slate-600 font-medium">Cargando transacciones de Saavedra 241...</p>
          </div>
        ) : errorMessage ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-rose-200 max-w-lg mx-auto">
            <p className="text-rose-600 font-bold mb-4">{errorMessage}</p>
            <button
              onClick={fetchSales}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Reintentar
            </button>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-slate-300 max-w-lg mx-auto">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No se encontraron transacciones
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No hay ventas registradas que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSales.map((sale) => {
              const dateObj = new Date(sale.createdAt);
              const formattedDate = dateObj.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
              const formattedTime = dateObj.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              const isExpanded = expandedSaleIds.has(sale.id);
              const totalItemsInSale = sale.items.reduce(
                (acc, it) => acc + (it.quantity || 0),
                0
              );
              const exchangeInfo = parseExchangeDetails(sale.notes);

              return (
                <div
                  key={sale.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all overflow-hidden"
                >
                  {/* Fila Principal / Cabecera de la Transacción */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Bloque Izquierdo: Comprobante, Fecha y Cliente */}
                    <div className="space-y-1.5 min-w-[220px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          {sale.invoiceNumber || sale.ticketCode || "TKT-S/N"}
                        </span>
                        {sale.ticketCode && sale.invoiceNumber && (
                          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Ticket {sale.ticketCode}
                          </span>
                        )}
                        {exchangeInfo && (
                          exchangeInfo.isReturn ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 shadow-2xs">
                              <RotateCcw className="w-3 h-3 text-rose-600" />
                              <span>DEVOLUCIÓN</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1 shadow-2xs">
                              <ArrowLeftRight className="w-3 h-3 text-purple-600" />
                              <span>CAMBIO</span>
                            </span>
                          )
                        )}
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formattedDate}</span>
                          <span className="font-mono text-slate-500 font-bold">{formattedTime} hs</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-800">
                          {sale.customerName || "Consumidor Final"}
                        </span>
                        {sale.cashier?.name && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 text-[11px]">
                              Caja: {sale.cashier.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bloque Central: Medios de Pago & Vuelto */}
                    <div className="flex-1 flex flex-col gap-1.5 lg:border-x lg:border-slate-100 lg:px-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Medios de Pago:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {sale.payments && sale.payments.length > 0 ? (
                          sale.payments.map((p, pIdx) => {
                            const badge = renderPaymentBadge(p.method);
                            const Icon = badge.icon;
                            const hasCashAuditing =
                              p.method === "EFECTIVO" &&
                              p.receivedAmount != null &&
                              Number(p.receivedAmount) > Number(p.amount);

                            return (
                              <div
                                key={p.id || pIdx}
                                className={`inline-flex flex-col gap-0.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${badge.bg}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <Icon className={`w-3.5 h-3.5 ${badge.iconColor}`} />
                                  <span>{badge.label}</span>
                                  <span className="font-mono font-bold ml-1">
                                    {formatCurrency(Number(p.amount))}
                                  </span>
                                </div>
                                {hasCashAuditing && (
                                  <div className="text-[10.5px] font-mono text-emerald-900 border-t border-emerald-200/60 pt-0.5 mt-0.5 flex items-center justify-between gap-2">
                                    <span>Pagó: {formatCurrency(Number(p.receivedAmount))}</span>
                                    {p.change != null && Number(p.change) > 0 && (
                                      <span className="font-black">
                                        Vuelto: {formatCurrency(Number(p.change))}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic font-mono">
                            Sin medios de pago registrados
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bloque Derecho: Total y Acciones */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 min-w-[200px]">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {exchangeInfo?.isReturn ? "Total Reintegrado" : "Total Cobrado"}
                        </span>
                        <span className={`text-xl font-black font-mono ${
                          exchangeInfo?.isReturn ? "text-rose-600" : "text-slate-950"
                        }`}>
                          {formatCurrency(
                            exchangeInfo?.isReturn
                              ? Number(sale.subtotalGross || 0)
                              : Number(sale.total)
                          )}
                        </span>
                        {Number(sale.discount) > 0 && (
                          <span className="text-[10.5px] text-rose-600 block font-semibold">
                            Desc: -{formatCurrency(Number(sale.discount))}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botón explícito para VISUALIZAR el Ticket No Fiscal */}
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                          title="Visualizar ticket no fiscal emitido para esta venta"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Ver Ticket</span>
                        </button>

                        <button
                          onClick={() => toggleExpand(sale.id)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            isExpanded
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{totalItemsInSale} art.</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Banner Informativo si es Cambio de Prenda */}
                  {exchangeInfo && (
                    <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-xl bg-purple-50/70 border border-purple-200/90 text-xs text-purple-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                          <ArrowLeftRight className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-purple-950 text-xs">
                              Operación de Cambio de Producto
                            </span>
                            {exchangeInfo.reason && (
                              <span className="text-[10px] font-bold text-purple-800 bg-purple-200/60 px-2 py-0.2 rounded-full border border-purple-300/60">
                                Motivo: {exchangeInfo.reason}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-purple-900/90 flex items-center gap-1.5 flex-wrap">
                            {exchangeInfo.returnedItem && (
                              <span>
                                <strong className="text-purple-950 font-semibold">Devuelve:</strong>{" "}
                                {exchangeInfo.returnedItem}
                              </span>
                            )}
                            {exchangeInfo.returnedItem && exchangeInfo.deliveredItem && (
                              <span className="text-purple-400 font-bold">➔</span>
                            )}
                            {exchangeInfo.deliveredItem && (
                              <span>
                                <strong className="text-purple-950 font-semibold">Se entrega:</strong>{" "}
                                {exchangeInfo.deliveredItem}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {exchangeInfo.financialSummary && (
                        <span className="text-[11px] font-black px-2.5 py-1 bg-white rounded-lg border border-purple-200 text-purple-900 shadow-2xs self-end md:self-center shrink-0 font-mono">
                          {exchangeInfo.financialSummary}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Detalle Expandible de Artículos Vendidos */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 border-t border-slate-100 p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-indigo-600" />
                          <span>Artículos incluidos en la venta ({sale.items.length} líneas)</span>
                        </h4>

                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 text-[11px] font-bold rounded-lg transition-colors border border-emerald-200/60 cursor-pointer"
                          title="Visualizar ticket no fiscal de esta venta"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Visualizar Ticket No Fiscal</span>
                        </button>
                      </div>

                      {exchangeInfo && (
                        <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-200 text-[11px] text-purple-950 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                            <span>
                              <strong>Auditoría de Stock:</strong> La prenda devuelta (<em>{exchangeInfo.returnedItem || "devuelta"}</em>) reingresó a stock en Saavedra 241 con tipo <strong>Devolución Cliente</strong> (+1 un.).
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                              <th className="pb-2">Producto / Prenda</th>
                              <th className="pb-2">Marca</th>
                              <th className="pb-2">Talle & Color</th>
                              <th className="pb-2">SKU</th>
                              <th className="pb-2 text-center">Cantidad</th>
                              <th className="pb-2 text-right">Precio Unit.</th>
                              <th className="pb-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {sale.items.map((it) => {
                              const bName = getBrandName(it.variant.product.brand);
                              return (
                                <tr key={it.id} className="hover:bg-white/60">
                                  <td className="py-2.5 font-bold text-slate-900 pr-2">
                                    {it.variant.product.name}
                                  </td>
                                  <td className="py-2.5 text-slate-600 pr-2 font-medium">
                                    {bName || "—"}
                                  </td>
                                  <td className="py-2.5 pr-2">
                                    <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[11px] font-bold text-slate-800">
                                      {it.variant.size}
                                    </span>
                                    {it.variant.color && (
                                      <span className="text-slate-500 text-[11px] ml-1.5">
                                        ({it.variant.color})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 font-mono text-[11px] text-slate-400 pr-2">
                                    {it.variant.sku || "—"}
                                  </td>
                                  <td className="py-2.5 text-center font-bold text-slate-900">
                                    {it.quantity} u.
                                  </td>
                                  <td className="py-2.5 text-right font-mono text-slate-600">
                                    {formatCurrency(Number(it.unitPrice || it.price))}
                                  </td>
                                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                                    {formatCurrency(Number(it.subtotal))}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. MODAL DE TICKET TÉRMICO REIMPRIMIBLE                      */}
      {/* ============================================================ */}
      {selectedSaleForReceipt && (() => {
        const sale = selectedSaleForReceipt;
        const dateObj = new Date(sale.createdAt);
        const formattedDate = dateObj.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const formattedTime = dateObj.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header Modal */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      Ticket No Fiscal de Venta
                    </span>
                    <span className="text-[10.5px] text-slate-500 font-medium">
                      Control interno de mostrador • Saavedra 241
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSaleForReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Ticket Preview Body (80mm Continuo no fiscal) */}
              <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 space-y-4">
                {/* Cabecera del Comercio */}
                <div className="border-b border-dashed border-slate-300 pb-3 text-center">
                  <div className="font-black tracking-[0.25em] text-base leading-tight pt-1 text-slate-950">
                    M A T A C O S
                  </div>
                  <div className="font-black tracking-[0.2em] text-base leading-tight mb-2 text-slate-950">
                    D E P O R T E S
                  </div>
                  <div className="text-[11px] text-neutral-600 space-y-0.5">
                    <div>Saavedra 241 — Formosa Capital</div>
                    <div className="font-semibold text-slate-900 pt-0.5">
                      Instagram: @matacosdeportes
                    </div>
                  </div>
                </div>

                {/* Identificación de Control Operativo */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <div className="text-center pb-1">
                    <span className="font-bold text-[12px] uppercase tracking-wider block text-slate-900">
                      COMPROBANTE NO FISCAL
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Control Interno de Venta
                    </span>
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Ticket Nro.:</span>
                    <span className="font-bold text-slate-950 font-mono">
                      {sale.invoiceNumber || sale.ticketCode || "00008-00000001"}
                      {sale.ticketCode && sale.invoiceNumber ? ` (${sale.ticketCode})` : ""}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha y Hora:</span>
                    <span className="font-medium text-slate-900">
                      {formattedDate} {formattedTime}
                    </span>
                  </div>

                  {sale.customerName &&
                    sale.customerName !== "Consumidor Final" &&
                    sale.customerName !== "CONSUMIDOR FINAL" && (
                      <div className="flex justify-between pt-0.5">
                        <span className="text-slate-500">Cliente:</span>
                        <strong className="text-slate-950">{sale.customerName}</strong>
                      </div>
                    )}
                </div>

                {/* Comprobante de cambio o devolución si corresponde */}
                {(() => {
                  const receiptEx = parseExchangeDetails(sale.notes);
                  if (!receiptEx) return null;
                  return (
                    <div className={`py-2.5 px-3 rounded-xl border border-dashed text-[10.5px] space-y-1 ${
                      receiptEx.isReturn
                        ? "bg-rose-50/80 border-rose-300 text-rose-950"
                        : "bg-purple-50/80 border-purple-300 text-purple-950"
                    }`}>
                      <div className={`font-black uppercase tracking-wider text-[10px] flex items-center gap-1.5 ${
                        receiptEx.isReturn ? "text-rose-900" : "text-purple-900"
                      }`}>
                        {receiptEx.isReturn ? (
                          <RotateCcw className="w-3 h-3 text-rose-700" />
                        ) : (
                          <ArrowLeftRight className="w-3 h-3 text-purple-700" />
                        )}
                        <span>{receiptEx.isReturn ? "COMPROBANTE DE DEVOLUCIÓN DE PRODUCTO" : "COMPROBANTE DE CAMBIO DE PRODUCTO"}</span>
                      </div>
                      {receiptEx.reason && (
                        <div>
                          <strong>Motivo:</strong> {receiptEx.reason}
                        </div>
                      )}
                      {receiptEx.returnedItem && (
                        <div>
                          <strong>Prenda devuelta:</strong> {receiptEx.returnedItem}
                        </div>
                      )}
                      {receiptEx.deliveredItem && (
                        <div>
                          <strong>Prenda entregada:</strong> {receiptEx.deliveredItem}
                        </div>
                      )}
                      {receiptEx.financialSummary && (
                        <div className={`font-bold pt-0.5 border-t font-mono ${
                          receiptEx.isReturn
                            ? "text-rose-900 border-rose-200/60"
                            : "text-purple-900 border-purple-200/60"
                        }`}>
                          {receiptEx.financialSummary}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Items */}
                <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                  <div className="flex justify-between font-bold text-[11px] text-slate-500 uppercase">
                    <span>Cant. / Descripción</span>
                    <span>Subtotal</span>
                  </div>
                  {sale.items.map((it) => (
                    <div key={it.id} className="space-y-0.5">
                      <div className="flex justify-between text-xs gap-2">
                        <span className="font-bold text-slate-900 break-words flex-1">
                          {it.quantity}x {it.variant.product.name}
                        </span>
                        <span className="font-bold text-slate-950 shrink-0 font-mono">
                          {formatCurrency(Number(it.subtotal))}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 pl-4">
                        Talle: {it.variant.size} {it.variant.color ? `• Color: ${it.variant.color}` : ""}
                        {" • "}P.U: {formatCurrency(Number(it.unitPrice || it.price))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals & Payments */}
                <div className="space-y-1.5 text-xs">
                  {Number(sale.discount) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Descuento aplicado:</span>
                      <span>-{formatCurrency(Number(sale.discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black border-y-2 border-slate-900 py-1.5 text-slate-950">
                    <span className="tracking-wide">TOTAL:</span>
                    <span className="font-mono">{formatCurrency(Number(sale.total))}</span>
                  </div>

                  {/* Medios de Pago */}
                  <div className="pt-2 space-y-1 text-[11px]">
                    <span className="font-bold text-slate-600 block text-[10px] uppercase tracking-wider">
                      Detalle de Pagos:
                    </span>
                    {sale.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between pl-2">
                        <span>{p.method}:</span>
                        <span className="font-bold font-mono">{formatCurrency(Number(p.amount))}</span>
                      </div>
                    ))}
                    {sale.payments.some((p) => p.change != null && Number(p.change) > 0) && (
                      <div className="flex justify-between pl-2 text-emerald-800 font-bold border-t border-slate-200 pt-1 mt-1">
                        <span>Su Vuelto:</span>
                        <span className="font-mono">
                          {formatCurrency(
                            sale.payments.reduce((acc, p) => acc + Number(p.change || 0), 0)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Leyenda Legal No Fiscal (RF-10 / Modelo Burger Joint) */}
                <div className="py-2.5 px-3 bg-slate-100 rounded-xl text-center border border-slate-200">
                  <span className="font-black text-[11px] text-slate-950 tracking-wider block">
                    DOCUMENTO NO VALIDO COMO FACTURA
                  </span>
                </div>

                {/* Pie de Políticas y Agradecimiento */}
                <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300 space-y-1">
                  <p className="font-semibold text-slate-700">
                    Conserve este ticket para cambios (plazo 30 días)
                  </p>
                  <p>Prendas sin uso y con etiquetas originales adheridas.</p>
                  <p className="font-bold text-slate-900 pt-0.5">
                    ¡Gracias por su compra en Matacos Deportes!
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ticket (80mm)</span>
                </button>
                <button
                  onClick={() => setSelectedSaleForReceipt(null)}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
