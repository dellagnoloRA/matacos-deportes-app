"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  History,
  Search,
  Calendar,
  Filter,
  ArrowLeft,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  PackagePlus,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  Store,
  Warehouse,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Tag,
  Boxes,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getAllInventoryMovements } from "@/server/actions/inventoryActions";

export interface StockMovementHistoryItem {
  id: string;
  variantId: string;
  type: string;
  quantity: number;
  stockAfter: number;
  location: string | null;
  reason: string | null;
  createdAt: string;
  variant: {
    id: string;
    size: string;
    color: string | null;
    sku: string;
    barcode: string | null;
    stockStore: number;
    stockWarehouse: number;
  };
  product: {
    id: string;
    name: string;
    brand: string;
    category: string;
    discipline?: string | null;
    code?: string | null;
    imageUrl?: string | null;
  } | null;
}

export interface StockMovementHistoryViewProps {
  onBackToInventory?: () => void;
  onNavigateToPriceHistory?: () => void;
}

export function StockMovementHistoryView({
  onBackToInventory,
  onNavigateToPriceHistory,
}: StockMovementHistoryViewProps) {
  const [movements, setMovements] = useState<StockMovementHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("TODAS");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Carga de datos
  const loadMovements = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let startDate: string | undefined;
      const now = new Date();

      if (dateFilter === "TODAY") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDate = today.toISOString();
      } else if (dateFilter === "7DAYS") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = sevenDaysAgo.toISOString();
      } else if (dateFilter === "30DAYS") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = thirtyDaysAgo.toISOString();
      }

      const res = await getAllInventoryMovements({
        type: selectedType !== "ALL" ? selectedType : undefined,
        location: selectedLocation !== "ALL" ? selectedLocation : undefined,
        startDate,
        take: 500,
      });

      if (res.success && res.data) {
        setMovements(res.data as StockMovementHistoryItem[]);
      } else {
        setErrorMessage(res.error || "No se pudo cargar el historial de movimientos");
      }
    } catch (err: any) {
      console.error("Error al cargar historial de movimientos:", err);
      setErrorMessage("Error de conexión al cargar movimientos de stock");
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, selectedType, selectedLocation]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedLocation, selectedBrand, dateFilter]);

  // Lista única de marcas presentes en los movimientos cargados
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    movements.forEach((m) => {
      if (m.product?.brand) brands.add(m.product.brand);
    });
    return Array.from(brands).sort();
  }, [movements]);

  // Filtrado en memoria por búsqueda y marca
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Filtro de marca
      if (selectedBrand !== "TODAS" && m.product?.brand !== selectedBrand) {
        return false;
      }

      // Filtro de búsqueda textual (Producto, Marca, SKU, Código de barras, Motivo)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = m.product?.name?.toLowerCase() || "";
        const pBrand = m.product?.brand?.toLowerCase() || "";
        const pCat = m.product?.category?.toLowerCase() || "";
        const vSku = m.variant?.sku?.toLowerCase() || "";
        const vBarcode = m.variant?.barcode?.toLowerCase() || "";
        const reason = m.reason?.toLowerCase() || "";

        const matches =
          pName.includes(q) ||
          pBrand.includes(q) ||
          pCat.includes(q) ||
          vSku.includes(q) ||
          vBarcode.includes(q) ||
          reason.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [movements, selectedBrand, searchQuery]);

  // Métricas agregadas sobre movimientos filtrados
  const metrics = useMemo(() => {
    let unitsIn = 0;
    let unitsOut = 0;
    let transferCount = 0;

    filteredMovements.forEach((m) => {
      const qty = Math.abs(m.quantity);
      if (m.type === "TRANSFERENCIA_INTERNA") {
        transferCount++;
      } else if (
        m.type === "VENTA_MOSTRADOR" ||
        m.type === "VENTA_WEB" ||
        m.type === "AJUSTE_EGRESO" ||
        m.quantity < 0
      ) {
        unitsOut += qty;
      } else if (
        m.type === "INGRESO_COMPRA" ||
        m.type === "INGRESO_INICIAL" ||
        m.type === "AJUSTE_INGRESO" ||
        m.type === "DEVOLUCION_CLIENTE" ||
        m.type === "ANULACION_VENTA" ||
        m.quantity > 0
      ) {
        unitsIn += qty;
      }
    });

    return {
      total: filteredMovements.length,
      unitsIn,
      unitsOut,
      transferCount,
    };
  }, [filteredMovements]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / itemsPerPage));
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMovements.slice(start, start + itemsPerPage);
  }, [filteredMovements, currentPage, itemsPerPage]);

  // Helper para renderizar badge de tipo de movimiento
  const renderMovementTypeBadge = (type: string) => {
    switch (type) {
      case "VENTA_MOSTRADOR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <Store className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Venta Salón</span>
          </span>
        );
      case "VENTA_WEB":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <ShoppingBag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Venta Online</span>
          </span>
        );
      case "INGRESO_COMPRA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <PackagePlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Ingreso Compra</span>
          </span>
        );
      case "INGRESO_INICIAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Boxes className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Ingreso Inicial</span>
          </span>
        );
      case "AJUSTE_INGRESO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <PlusCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Ajuste Positivo (+)</span>
          </span>
        );
      case "AJUSTE_EGRESO":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <MinusCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Ajuste Merma (-)</span>
          </span>
        );
      case "TRANSFERENCIA_INTERNA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Traslado Depósito ➔ Salón</span>
          </span>
        );
      case "DEVOLUCION_CLIENTE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span>Devolución Cliente</span>
          </span>
        );
      case "ANULACION_VENTA":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <RotateCcw className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Anulación Venta</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200">
            <span>{type.replace(/_/g, " ")}</span>
          </span>
        );
    }
  };

  // Helper para renderizar badge de ubicación
  const renderLocationBadge = (loc: string | null) => {
    if (!loc) return <span className="text-slate-400 font-mono text-xs">—</span>;
    if (loc === "STORE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
          <Store className="w-3 h-3 text-sky-600" />
          <span>Salón</span>
        </span>
      );
    }
    if (loc === "WAREHOUSE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Warehouse className="w-3 h-3 text-amber-600" />
          <span>Depósito</span>
        </span>
      );
    }
    if (loc === "WAREHOUSE_TO_STORE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
          <ArrowRightLeft className="w-3 h-3 text-indigo-600" />
          <span>Depósito ➔ Salón</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {loc}
      </span>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ============================================================ */}
      {/* 1. TOP HEADER & SWITCHER DE HISTORIALES                      */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {onBackToInventory && (
            <button
              type="button"
              onClick={onBackToInventory}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 transition-colors shadow-2xs group shrink-0"
              title="Regresar al Catálogo de Productos"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-[#00D615] flex items-center justify-center shadow-xs shrink-0">
            <History className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Historial de Movimientos de Stock
              </h1>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 font-mono">
                {filteredMovements.length} {filteredMovements.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría y trazabilidad completa de compras, ventas en mostrador/web, traslados y ajustes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Switcher entre Historiales */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              className="py-1.5 px-3 rounded-xl text-xs font-black bg-slate-900 text-white shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Boxes className="w-3.5 h-3.5 text-[#00D615]" />
              <span>Movimientos de Stock</span>
            </button>

            {onNavigateToPriceHistory && (
              <button
                type="button"
                onClick={onNavigateToPriceHistory}
                className="py-1.5 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 flex items-center gap-1.5 transition-all"
                title="Ir a Historial de Ajustes de Precios"
              >
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Ajustes de Precios</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadMovements}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50"
            title="Refrescar movimientos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TARJETAS DE MÉTRICAS RÁPIDAS                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Operaciones */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Operaciones
            </span>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {metrics.total}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        {/* Ingresos de Stock */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Unidades Ingresadas
            </span>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
              +{metrics.unitsIn}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PackagePlus className="w-5 h-5" />
          </div>
        </div>

        {/* Egresos / Ventas */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Unidades Egresadas
            </span>
            <p className="text-2xl font-black text-rose-600 font-mono mt-0.5">
              -{metrics.unitsOut}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Traslados Internos */}
        <div className="bg-white rounded-2xl p-4 border border-indigo-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Traslados Internos
            </span>
            <p className="text-2xl font-black text-indigo-600 font-mono mt-0.5">
              {metrics.transferCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. BARRA DE FILTROS AVANZADOS                                */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Buscador */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto, marca, SKU o código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Filtro por Tipo de Movimiento */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none transition-all"
            >
              <option value="ALL">Tipo: Todos los tipos</option>
              <option value="VENTA_MOSTRADOR">Venta Salón (Mostrador)</option>
              <option value="VENTA_WEB">Venta Web (Online)</option>
              <option value="INGRESO_COMPRA">Ingreso Compra</option>
              <option value="INGRESO_INICIAL">Ingreso Inicial</option>
              <option value="AJUSTE_INGRESO">Ajuste Positivo (+)</option>
              <option value="AJUSTE_EGRESO">Ajuste Merma (-)</option>
              <option value="TRANSFERENCIA_INTERNA">Traslado Depósito ➔ Salón</option>
              <option value="DEVOLUCION_CLIENTE">Devolución Cliente</option>
              <option value="ANULACION_VENTA">Anulación de Venta</option>
            </select>
          </div>

          {/* Filtro por Ubicación */}
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none transition-all"
            >
              <option value="ALL">Ubicación: Todas</option>
              <option value="STORE">Salón de Ventas</option>
              <option value="WAREHOUSE">Depósito Central</option>
              <option value="WAREHOUSE_TO_STORE">Traslado Interno</option>
            </select>
          </div>

          {/* Filtro por Período de Tiempo */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer appearance-none transition-all"
            >
              <option value="ALL">Período: Todo el historial</option>
              <option value="TODAY">Hoy</option>
              <option value="7DAYS">Últimos 7 días</option>
              <option value="30DAYS">Últimos 30 días</option>
            </select>
          </div>
        </div>

        {/* Filtros secundarios: Marca & Limpieza rápida */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px]">Marca:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="TODAS">Todas las marcas ({availableBrands.length})</option>
              {availableBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedType !== "ALL" || selectedLocation !== "ALL" || selectedBrand !== "TODAS" || dateFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedType("ALL");
                setSelectedLocation("ALL");
                setSelectedBrand("TODAS");
                setDateFilter("ALL");
              }}
              className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] underline underline-offset-2 transition-colors cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. TABLA DE MOVIMIENTOS                                      */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {errorMessage && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-xs font-bold text-slate-600">Cargando movimientos de stock...</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Boxes className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No se encontraron movimientos de stock
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No hay registros que coincidan con los filtros seleccionados o todavía no se realizaron transacciones en el sistema.
            </p>
            {(searchQuery || selectedType !== "ALL" || selectedLocation !== "ALL" || selectedBrand !== "TODAS" || dateFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("ALL");
                  setSelectedLocation("ALL");
                  setSelectedBrand("TODAS");
                  setDateFilter("ALL");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[840px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Producto & Variante</th>
                  <th className="py-3.5 px-4">Tipo de Movimiento</th>
                  <th className="py-3.5 px-3">Ubicación</th>
                  <th className="py-3.5 px-3 text-center">Variación</th>
                  <th className="py-3.5 px-3 text-center">Stock Post.</th>
                  <th className="py-3.5 px-4">Motivo / Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedMovements.map((m) => {
                  const dateObj = new Date(m.createdAt);
                  const formattedDate = dateObj.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isTransfer = m.type === "TRANSFERENCIA_INTERNA";
                  const isEgress =
                    m.type === "VENTA_MOSTRADOR" ||
                    m.type === "VENTA_WEB" ||
                    m.type === "AJUSTE_EGRESO" ||
                    m.quantity < 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Fecha y Hora */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formattedDate}</span>
                          <span className="text-slate-400 font-normal text-[11px]">{formattedTime} hs</span>
                        </div>
                      </td>

                      {/* Producto & Variante */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 line-clamp-1">
                            {m.product?.name || "Producto sin nombre"}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                            {m.product?.brand && (
                              <span className="font-semibold text-slate-700">{m.product.brand}</span>
                            )}
                            {m.variant && (
                              <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-700 font-mono text-[10.5px]">
                                Talle: {m.variant.size} {m.variant.color ? `(${m.variant.color})` : ""}
                              </span>
                            )}
                            {m.variant?.sku && (
                              <span className="font-mono text-slate-400 text-[10.5px]">
                                SKU: {m.variant.sku}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tipo de Movimiento Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderMovementTypeBadge(m.type)}
                      </td>

                      {/* Ubicación */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {renderLocationBadge(m.location)}
                      </td>

                      {/* Variación de Cantidad */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg ${
                            isTransfer
                              ? "bg-indigo-50 text-indigo-700"
                              : isEgress
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isTransfer
                            ? `🔄 ${Math.abs(m.quantity)}`
                            : isEgress
                            ? `-${Math.abs(m.quantity)}`
                            : `+${Math.abs(m.quantity)}`}{" "}
                          u.
                        </span>
                      </td>

                      {/* Stock Posterior Resultante */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                          {m.stockAfter} u.
                        </span>
                      </td>

                      {/* Motivo / Referencia */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {m.reason ? (
                          <span title={m.reason}>{m.reason}</span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {filteredMovements.length > itemsPerPage && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <div>
              Mostrando{" "}
              <span className="font-bold text-slate-900">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              a{" "}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * itemsPerPage, filteredMovements.length)}
              </span>{" "}
              de{" "}
              <span className="font-bold text-slate-900">{filteredMovements.length}</span>{" "}
              movimientos
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
