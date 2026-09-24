"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  History,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  FileText,
  RotateCcw,
  ArrowLeft,
  RefreshCw,
  Clock,
  Layers,
  Trash2,
  AlertTriangle,
  Boxes,
  Tag,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  PriceHistoryBatch,
  getPriceHistoryBatches,
  deletePriceHistoryBatch,
  clearPriceHistory,
} from "@/lib/priceHistoryStorage";

export interface PriceHistoryViewProps {
  onBackToInventory?: () => void;
  onNavigateToStockMovements?: () => void;
}

export function PriceHistoryView({
  onBackToInventory,
  onNavigateToStockMovements,
}: PriceHistoryViewProps) {
  const [batches, setBatches] = useState<PriceHistoryBatch[]>([]);
  const [expandedBatchIds, setExpandedBatchIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<PriceHistoryBatch | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

  // Filtros
  const [selectedBrand, setSelectedBrand] = useState<string>("TODAS");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("TODAS");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = useCallback(() => {
    setIsRefreshing(true);
    try {
      const data = getPriceHistoryBatches();
      setBatches(data);
      // Por defecto, expandir el primer lote si existe para mostrar el detalle de inmediato
      if (data.length > 0) {
        setExpandedBatchIds(new Set([data[0].id]));
      } else {
        setExpandedBatchIds(new Set());
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, []);

  const handleDeleteBatch = (id: string) => {
    deletePriceHistoryBatch(id);
    setBatchToDelete(null);
    loadData();
  };

  const handleClearAll = () => {
    clearPriceHistory();
    setIsConfirmClearAllOpen(false);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleExpand = (id: string) => {
    setExpandedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Opciones de marcas presentes en los lotes
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    batches.forEach((b) => {
      if (b.brandName) brandsSet.add(b.brandName);
      b.auditLog.forEach((item) => {
        if (item.brand) brandsSet.add(item.brand);
      });
    });
    return Array.from(brandsSet).sort();
  }, [batches]);

  // Opciones de disciplinas presentes en los lotes
  const availableDisciplines = useMemo(() => {
    const disciplinesSet = new Set<string>();
    batches.forEach((b) => {
      if (b.disciplineName) disciplinesSet.add(b.disciplineName);
      b.auditLog.forEach((item) => {
        if (item.discipline) disciplinesSet.add(item.discipline);
      });
    });
    return Array.from(disciplinesSet).sort();
  }, [batches]);

  // Filtrar lotes
  const filteredBatches = useMemo(() => {
    const now = new Date();
    const query = searchQuery.trim().toLowerCase();

    return batches.filter((batch) => {
      // 1. Filtro por Marca
      if (selectedBrand !== "TODAS") {
        const matchesBrand =
          (batch.brandName && batch.brandName.toLowerCase() === selectedBrand.toLowerCase()) ||
          batch.auditLog.some(
            (item) => item.brand.toLowerCase() === selectedBrand.toLowerCase()
          );
        if (!matchesBrand) return false;
      }

      // 2. Filtro por Disciplina
      if (selectedDiscipline !== "TODAS") {
        const matchesDiscipline =
          (batch.disciplineName &&
            batch.disciplineName.toLowerCase() === selectedDiscipline.toLowerCase()) ||
          batch.auditLog.some(
            (item) => item.discipline.toLowerCase() === selectedDiscipline.toLowerCase()
          );
        if (!matchesDiscipline) return false;
      }

      // 3. Filtro por Fecha
      if (dateFilter !== "ALL") {
        const batchDate = new Date(batch.timestamp);
        const diffMs = now.getTime() - batchDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (dateFilter === "TODAY" && diffHours > 24) return false;
        if (dateFilter === "7DAYS" && diffHours > 24 * 7) return false;
        if (dateFilter === "30DAYS" && diffHours > 24 * 30) return false;
      }

      // 4. Filtro por Texto libre (motivo o productos)
      if (query !== "") {
        const inReason = batch.reason && batch.reason.toLowerCase().includes(query);
        const inScope = batch.scopeLabel && batch.scopeLabel.toLowerCase().includes(query);
        const inProducts = batch.auditLog.some(
          (p) =>
            p.productName.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query)
        );

        if (!inReason && !inScope && !inProducts) return false;
      }

      return true;
    });
  }, [batches, selectedBrand, selectedDiscipline, dateFilter, searchQuery]);

  const hasActiveFilters =
    selectedBrand !== "TODAS" ||
    selectedDiscipline !== "TODAS" ||
    dateFilter !== "ALL" ||
    searchQuery.trim() !== "";

  const handleClearFilters = () => {
    setSelectedBrand("TODAS");
    setSelectedDiscipline("TODAS");
    setDateFilter("ALL");
    setSearchQuery("");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 select-none pb-12">
      {/* 1. Header con Botón de Regreso a Inventario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {onBackToInventory && (
            <button
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
                Historial de Ajustes de Precios
              </h1>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {filteredBatches.length} {filteredBatches.length === 1 ? "registro" : "registros"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría cronológica de aumentos y descuentos porcentuales aplicados al catálogo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented Switcher entre Historiales */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
            {onNavigateToStockMovements && (
              <button
                type="button"
                onClick={onNavigateToStockMovements}
                className="py-1.5 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 flex items-center gap-1.5 transition-all"
                title="Ir a Historial de Movimientos de Stock"
              >
                <Boxes className="w-3.5 h-3.5 text-slate-400" />
                <span>Movimientos de Stock</span>
              </button>
            )}

            <button
              type="button"
              className="py-1.5 px-3 rounded-xl text-xs font-black bg-slate-900 text-white shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Tag className="w-3.5 h-3.5 text-[#00D615]" />
              <span>Ajustes de Precios</span>
            </button>
          </div>

          {batches.length > 0 && (
            <button
              type="button"
              onClick={() => setIsConfirmClearAllOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer active:scale-95"
              title="Vaciar todo el historial de cambios de precios"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vaciar historial</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50"
            title="Refrescar historial"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Barra de Filtros */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Buscador */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por motivo, producto, SKU..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Filtro por Marca */}
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-white rounded-xl border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="TODAS">Marca: Todas las marcas</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>
                  Marca: {brand}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filtro por Disciplina */}
          <div className="relative">
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full text-xs py-2 px-3 bg-white rounded-xl border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="TODAS">Disciplina: Todas</option>
              {availableDisciplines.map((d) => (
                <option key={d} value={d}>
                  Disciplina: {d}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filtro por Fecha */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as "ALL" | "TODAY" | "7DAYS" | "30DAYS")}
              className="w-full text-xs py-2 px-3 bg-white rounded-xl border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Período: Todo el historial</option>
              <option value="TODAY">Período: Últimas 24 horas</option>
              <option value="7DAYS">Período: Últimos 7 días</option>
              <option value="30DAYS">Período: Últimos 30 días</option>
            </select>
          </div>
        </div>

        {/* Estado de Filtros y Botón Limpiar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 text-[11px]">
              Filtros activos. Mostrando {filteredBatches.length} de {batches.length} registros de auditoría.
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Lista de Lotes / Ajustes */}
      <div className="space-y-3.5">
        {batches.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3 bg-white rounded-2xl border border-dashed border-slate-200 max-w-xl mx-auto shadow-2xs">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <History className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Sin historial de cambios de precios
              </h4>
              <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto leading-relaxed">
                Aún no se han ejecutado actualizaciones de precios en el catálogo. Cuando realices un ajuste porcentual masivo desde el inventario, cada lote y su detalle de auditoría aparecerán reflejados aquí automáticamente.
              </p>
            </div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 max-w-xl mx-auto">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
              <Search className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                No se encontraron ajustes de precios
              </h4>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                No hay registros que coincidan con la búsqueda o con los filtros de marca, disciplina o fecha seleccionada.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpiar filtros de búsqueda
              </button>
            )}
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const isExpanded = expandedBatchIds.has(batch.id);
            const isPositive = batch.percentage >= 0;

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Cabecera del Lote */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Badge Porcentaje */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold ${
                          isPositive
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>
                          {isPositive ? `+${batch.percentage}%` : `${batch.percentage}%`}
                        </span>
                      </span>

                      {/* Badge Ámbito */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-900 text-white shadow-2xs">
                        {batch.scopeLabel}
                      </span>

                      {/* Badge Objetivo */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
                        {batch.targetField === "PRICE"
                          ? "Solo Venta"
                          : batch.targetField === "COST_PRICE"
                          ? "Solo Costo"
                          : "Costo y Venta"}
                      </span>

                      {/* Política de Redondeo */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono text-slate-500 bg-slate-50 border border-slate-200/60">
                        {batch.roundingPolicy}
                      </span>
                    </div>

                    {/* Fecha y Hora + Botón Eliminar Registro */}
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{batch.formattedDate}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBatchToDelete(batch);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                        title="Eliminar este registro del historial"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Motivo de Auditoría */}
                  {batch.reason && (
                    <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="italic text-xs font-medium">
                        "{batch.reason}"
                      </span>
                    </div>
                  )}

                  {/* Métricas Agregadas y Botón Desplegable */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Productos</span>
                        <strong className="text-slate-900 font-bold">
                          {batch.summary.updatedProductsCount} prod. ({batch.summary.updatedVariantsCount} var.)
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] block">Suma Anterior</span>
                        <span className="font-mono font-medium text-slate-700">
                          {formatCurrency(batch.summary.totalOldPriceSum)}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] block">Suma Nueva</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(batch.summary.totalNewPriceSum)}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px] block">Variación Total</span>
                        <span
                          className={`font-mono font-bold ${
                            batch.summary.totalDeltaSum >= 0
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {batch.summary.totalDeltaSum >= 0 ? "+" : ""}
                          {formatCurrency(batch.summary.totalDeltaSum)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(batch.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all active:scale-95 shadow-2xs cursor-pointer shrink-0"
                    >
                      <span>
                        {isExpanded
                          ? "Ocultar detalle"
                          : `Ver ${batch.auditLog.length} producto(s) afectados`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Tabla Desplegable con Detalle de Productos Modificados */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[500px]">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Producto / Marca</th>
                              <th className="py-2.5 px-3">SKU</th>
                              <th className="py-2.5 px-3">Precio Anterior</th>
                              <th className="py-2.5 px-3">Precio Nuevo</th>
                              <th className="py-2.5 px-3 text-right">Diferencia ($ / %)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {batch.auditLog.map((prod) => (
                              <tr key={prod.productId} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-slate-900 block truncate max-w-xs">
                                    {prod.productName}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {prod.brand} • {prod.discipline}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                  {prod.sku}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">
                                  {formatCurrency(prod.oldPrice)}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  {formatCurrency(prod.newPrice)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span
                                    className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[10.5px] ${
                                      prod.priceDelta >= 0
                                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                        : "bg-rose-50 text-rose-800 border border-rose-200"
                                    }`}
                                  >
                                    {prod.priceDelta >= 0 ? "+" : ""}
                                    {formatCurrency(prod.priceDelta)}
                                    <span className="font-normal text-slate-500 text-[10px]">
                                      ({prod.effectivePercentage > 0 ? `+${prod.effectivePercentage}%` : `${prod.effectivePercentage}%`})
                                    </span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmación: Eliminar Lote Específico */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  ¿Eliminar este registro de cambio de precio?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta acción eliminará de forma permanente este lote del historial.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Ámbito:</span>
                <span className="font-semibold text-slate-900">{batchToDelete.scopeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Porcentaje:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {batchToDelete.percentage > 0 ? `+${batchToDelete.percentage}%` : `${batchToDelete.percentage}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha:</span>
                <span className="font-medium text-slate-700">{batchToDelete.formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Productos afectados:</span>
                <span className="font-semibold text-slate-900">{batchToDelete.auditLog.length} producto(s)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBatchToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBatch(batchToDelete.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs cursor-pointer active:scale-95"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación: Vaciar Todo el Historial */}
      {isConfirmClearAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  ¿Vaciar todo el historial de cambios de precios?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Se borrarán permanentemente todos los registros y lotes de auditoría guardados en el navegador.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs cursor-pointer active:scale-95"
              >
                Vaciar Todo el Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
