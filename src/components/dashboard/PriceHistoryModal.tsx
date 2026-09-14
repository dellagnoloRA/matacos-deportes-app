"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  History,
  Search,
  Filter,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  Percent,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Package,
  Layers,
  FileText,
  RotateCcw,
  Boxes,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  PriceHistoryBatch,
  getPriceHistoryBatches,
} from "@/lib/priceHistoryStorage";

export interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PriceHistoryModal({ isOpen, onClose }: PriceHistoryModalProps) {
  const [batches, setBatches] = useState<PriceHistoryBatch[]>([]);
  const [expandedBatchIds, setExpandedBatchIds] = useState<Set<string>>(new Set());

  // Filtros
  const [selectedBrand, setSelectedBrand] = useState<string>("TODAS");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("TODAS");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7DAYS" | "30DAYS">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cargar lotes al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const data = getPriceHistoryBatches();
      setBatches(data);
      // Por defecto, expandir el primer lote para que se vea el detalle inmediatamente
      if (data.length > 0) {
        setExpandedBatchIds(new Set([data[0].id]));
      }
    }
  }, [isOpen]);

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

  // Opciones únicas de marcas y disciplinas presentes en el historial o catálogo
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-[#00D615] flex items-center justify-center shadow-xs">
              <History className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Historial Global de Ajustes de Precios
                </h2>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                  {filteredBatches.length} {filteredBatches.length === 1 ? "registro" : "registros"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Auditoría cronológica de aumentos y descuentos aplicados al catálogo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 sm:px-6 bg-slate-50/60 border-b border-slate-200/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            
            {/* 1. Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por motivo, producto..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/20 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
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
                onChange={(e) => setDateFilter(e.target.value as any)}
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
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 text-[11px]">
                Filtros aplicados. Mostrando {filteredBatches.length} de {batches.length} ajustes.
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer filtros</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body - List of Batches */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {filteredBatches.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3 max-w-sm mx-auto">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  No se encontraron ajustes de precios
                </h4>
                <p className="text-slate-400 text-xs mt-1">
                  No hay registros que coincidan con la marca, disciplina o fecha seleccionada.
                </p>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
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
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Tarjeta Principal del Lote */}
                  <div className="p-4 sm:p-5 space-y-3.5">
                    {/* Fila 1: Badges y Fecha */}
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

                      {/* Fecha y Hora */}
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{batch.formattedDate}</span>
                      </span>
                    </div>

                    {/* Motivo de Auditoría */}
                    {batch.reason && (
                      <div className="bg-slate-50/90 px-3.5 py-2 rounded-xl border border-slate-200/70 text-slate-700 flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="italic text-xs font-medium">
                          "{batch.reason}"
                        </span>
                      </div>
                    )}

                    {/* Métricas Agregadas y Botón Desplegable */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      {/* Cifras Resumidas */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
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

                      {/* Botón Acordeón Desplegable */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(batch.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all active:scale-95 shadow-2xs"
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

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/80">
          <span className="text-[11px] text-slate-400">
            Historial persistido localmente en el mostrador (Modo Offline-First)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-2xs active:scale-95"
          >
            Cerrar Historial
          </button>
        </div>

      </div>
    </div>
  );
}

