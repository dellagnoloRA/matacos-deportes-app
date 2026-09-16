"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  Percent,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Loader2,
  Layers,
  Tag,
  ShieldAlert,
  Building2,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  RoundingPolicy,
  TargetPriceField,
  BatchPriceUpdateResult,
} from "@/schemas/priceUpdate";
import {
  previewBatchPriceUpdate,
  updatePricesByPercentage,
} from "@/server/actions/priceActions";
import { getDisciplines, getBrands } from "@/server/actions/categoryActions";
import { savePriceHistoryBatch } from "@/lib/priceHistoryStorage";

export interface BatchPriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedProductIds?: string[];
  totalCatalogProductsCount?: number;
}

type ScopeType = "ALL" | "DISCIPLINE" | "BRAND" | "SELECTED";

interface OptionItem {
  id: string;
  name: string;
}

export function BatchPriceUpdateModal({
  isOpen,
  onClose,
  onSuccess,
  selectedProductIds = [],
  totalCatalogProductsCount = 0,
}: BatchPriceUpdateModalProps) {
  // Parámetros del Formulario
  const [percentage, setPercentage] = useState<number>(10);
  const [targetField, setTargetField] = useState<TargetPriceField>("PRICE");
  const [roundingPolicy, setRoundingPolicy] = useState<RoundingPolicy>("NEAREST_50");
  const [scope, setScope] = useState<ScopeType>(
    selectedProductIds.length > 0 ? "SELECTED" : "ALL"
  );
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [updateVariantPrices, setUpdateVariantPrices] = useState<boolean>(true);

  // Listados para selectores dinámicos
  const [disciplines, setDisciplines] = useState<OptionItem[]>([]);
  const [brands, setBrands] = useState<OptionItem[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState<boolean>(false);

  // Estados de Simulación / Previsualización en Vivo
  const [previewResult, setPreviewResult] = useState<BatchPriceUpdateResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isFormStale, setIsFormStale] = useState<boolean>(true);

  // Estados de Confirmación y Ejecución
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<BatchPriceUpdateResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Cargar Disciplinas y Marcas al abrir el modal y resetear ejecuciones previas
  useEffect(() => {
    if (!isOpen) return;

    // Resetear estados al abrir el modal para que siempre aparezca el formulario listo
    setExecutionResult(null);
    setPreviewResult(null);
    setShowConfirmDialog(false);
    setPreviewError(null);
    setExecutionError(null);
    setIsFormStale(true);
    setReason("");

    let isMounted = true;
    async function loadMasterData() {
      setIsLoadingLists(true);
      try {
        const [discRes, brandRes] = await Promise.all([
          getDisciplines(),
          getBrands(),
        ]);

        if (isMounted) {
          if (discRes.success && discRes.data) {
            setDisciplines(discRes.data);
            if (discRes.data.length > 0 && !selectedDisciplineId) {
              setSelectedDisciplineId(discRes.data[0].id);
            }
          }
          if (brandRes.success && brandRes.data) {
            setBrands(brandRes.data);
            if (brandRes.data.length > 0 && !selectedBrandId) {
              setSelectedBrandId(brandRes.data[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar maestros para actualización de precios:", err);
      } finally {
        if (isMounted) setIsLoadingLists(false);
      }
    }

    loadMasterData();

    // Si venimos con productos seleccionados desde la tabla, seleccionamos por defecto 'SELECTED'
    if (selectedProductIds.length > 0) {
      setScope("SELECTED");
    } else {
      setScope("ALL");
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedProductIds]);

  // Cerrar y limpiar estados para la próxima apertura
  const handleClose = () => {
    if (isExecuting) return;
    setExecutionResult(null);
    setPreviewResult(null);
    setShowConfirmDialog(false);
    setPreviewError(null);
    setExecutionError(null);
    setIsFormStale(true);
    setReason("");
    onClose();
  };

  // Si cambia cualquier parámetro, marcar la simulación como desactualizada
  const handleParameterChange = () => {
    setIsFormStale(true);
    setPreviewError(null);
  };

  if (!isOpen) return null;

  // Construir el payload de filtros para Server Actions
  const buildPayload = () => {
    let filtersPayload: {
      productIds?: string[];
      disciplineId?: string;
      brandId?: string;
      activeOnly: boolean;
    } = { activeOnly: true };

    if (scope === "SELECTED") {
      filtersPayload.productIds = selectedProductIds;
    } else if (scope === "DISCIPLINE") {
      filtersPayload.disciplineId = selectedDisciplineId;
    } else if (scope === "BRAND") {
      filtersPayload.brandId = selectedBrandId;
    }

    return {
      percentage: Number(percentage),
      targetField,
      roundingPolicy,
      updateVariantPrices,
      reason: reason.trim() !== "" ? reason.trim() : undefined,
      filters: filtersPayload,
    };
  };

  // 1. Simulación / Previsualización en Vivo (Live Preview)
  const handleRunPreview = async () => {
    if (percentage === 0) {
      setPreviewError("El porcentaje a aplicar no puede ser 0%");
      return;
    }

    if (scope === "SELECTED" && selectedProductIds.length === 0) {
      setPreviewError("No hay artículos seleccionados en la tabla de inventario.");
      return;
    }

    setIsPreviewing(true);
    setPreviewError(null);

    try {
      const payload = buildPayload();
      const res = await previewBatchPriceUpdate(payload);

      if (res.success) {
        setPreviewResult(res);
        setIsFormStale(false);
      } else {
        setPreviewError(res.error || res.message || "Error al generar la previsualización.");
      }
    } catch (err) {
      console.error("Error en previsualización de precios:", err);
      setPreviewError("Ocurrió un error inesperado al calcular la previsualización.");
    } finally {
      setIsPreviewing(false);
    }
  };

  // 2. Disparar el diálogo de doble confirmación
  const handleRequestApply = () => {
    if (isFormStale || !previewResult) {
      handleRunPreview();
      return;
    }

    if (previewResult.summary.matchedProductsCount === 0) {
      setPreviewError("No se encontraron productos coincidentes para el filtro seleccionado.");
      return;
    }

    setShowConfirmDialog(true);
  };

  // 3. Ejecución Definitiva en Base de Datos (Atomic Transaction)
  const handleConfirmExecution = async () => {
    setIsExecuting(true);
    setExecutionError(null);

    try {
      const payload = buildPayload();
      const res = await updatePricesByPercentage(payload);

      if (res.success) {
        setExecutionResult(res);
        setShowConfirmDialog(false);

        // Guardar automáticamente en el Historial Global persistente de Frontend
        try {
          const now = new Date();
          const formattedDate = new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Argentina/Buenos_Aires",
          }).format(now);

          const currentDiscipline = disciplines.find((d) => d.id === selectedDisciplineId)?.name;
          const currentBrand = brands.find((b) => b.id === selectedBrandId)?.name;

          savePriceHistoryBatch({
            id: `batch-${Date.now()}`,
            timestamp: now.toISOString(),
            formattedDate: `${formattedDate} hs`,
            percentage: Number(percentage),
            targetField,
            roundingPolicy,
            scopeType: scope,
            scopeLabel: selectedScopeName(),
            disciplineName: currentDiscipline,
            brandName: currentBrand,
            reason: reason.trim() !== "" ? reason.trim() : undefined,
            summary: res.summary,
            auditLog: res.auditLog,
          });
        } catch (historyErr) {
          console.warn("No se pudo registrar en el historial local:", historyErr);
        }

        // Notificar al componente padre para recargar datos
        onSuccess();
      } else {
        setExecutionError(res.error || res.message || "Error al actualizar los precios en la base de datos.");
      }
    } catch (err) {
      console.error("Error al aplicar actualización masiva de precios:", err);
      setExecutionError("Ocurrió un error inesperado al aplicar los precios en la base de datos.");
    } finally {
      setIsExecuting(false);
    }
  };

  // Acceso rápido a porcentajes comunes
  const quickPercentages = [
    { label: "+10%", value: 10, variant: "green" },
    { label: "+15%", value: 15, variant: "green" },
    { label: "+20%", value: 20, variant: "green" },
    { label: "-5%", value: -5, variant: "amber" },
  ];

  const selectedScopeName = () => {
    if (scope === "ALL") return "Todo el catálogo activo";
    if (scope === "SELECTED") return `${selectedProductIds.length} producto(s) seleccionados`;
    if (scope === "DISCIPLINE") {
      const d = disciplines.find((item) => item.id === selectedDisciplineId);
      return `Disciplina: ${d ? d.name : "Seleccionada"}`;
    }
    if (scope === "BRAND") {
      const b = brands.find((item) => item.id === selectedBrandId);
      return `Marca: ${b ? b.name : "Seleccionada"}`;
    }
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop con desenfoque suave */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isExecuting) handleClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-[#00D615] flex items-center justify-center shadow-xs">
              <Percent className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Ajuste Masivo y Porcentual de Precios
              </h2>
              <p className="text-xs text-slate-500">
                Aumentos o descuentos por lote con simulación previa y redondeo comercial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isExecuting}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors disabled:opacity-50"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable Form & Preview */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          
          {/* Si ya se ejecutó con éxito, mostrar pantalla de confirmación exitosa */}
          {executionResult ? (
            <div className="py-8 px-4 text-center space-y-4 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <CheckCircle2 className="w-9 h-9 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ¡Precios Actualizados Exitosamente!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {executionResult.message}
                </p>
              </div>

              {/* Tarjeta de Resumen Final */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-600">
                  <span>Productos actualizados:</span>
                  <span className="font-bold text-slate-900">{executionResult.summary.updatedProductsCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-600">
                  <span>Variantes actualizadas:</span>
                  <span className="font-bold text-slate-900">{executionResult.summary.updatedVariantsCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-600">
                  <span>Suma total anterior:</span>
                  <span className="font-medium text-slate-700">{formatCurrency(executionResult.summary.totalOldPriceSum)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-600">
                  <span>Suma total nueva:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(executionResult.summary.totalNewPriceSum)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-700 font-bold">
                  <span>Diferencia total:</span>
                  <span className={executionResult.summary.totalDeltaSum >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {executionResult.summary.totalDeltaSum >= 0 ? "+" : ""}{formatCurrency(executionResult.summary.totalDeltaSum)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                Volver al Inventario
              </button>
            </div>
          ) : (
            <>
              {/* Formulario Principal de Parámetros */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* 1. Porcentaje a Aplicar */}
                <div className="md:col-span-5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                  <label className="text-slate-800 font-bold flex items-center justify-between text-xs">
                    <span>1. Porcentaje a Aplicar</span>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      {percentage > 0 ? `+${percentage}%` : `${percentage}%`}
                    </span>
                  </label>

                  {/* Input con controles +/- */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPercentage((prev) => Math.round((prev - 1) * 10) / 10);
                        handleParameterChange();
                      }}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
                      title="Disminuir 1%"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.1"
                        min="-99"
                        max="1000"
                        value={percentage}
                        onChange={(e) => {
                          setPercentage(parseFloat(e.target.value) || 0);
                          handleParameterChange();
                        }}
                        className="w-full text-center font-mono font-extrabold text-lg text-slate-900 bg-white py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                        %
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPercentage((prev) => Math.round((prev + 1) * 10) / 10);
                        handleParameterChange();
                      }}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-100 active:scale-95 transition-all shadow-2xs"
                      title="Aumentar 1%"
                    >
                      +
                    </button>
                  </div>

                  {/* Botones de acceso rápido */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {quickPercentages.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setPercentage(item.value);
                          handleParameterChange();
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all active:scale-95 border ${
                          percentage === item.value
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : item.variant === "green"
                            ? "bg-white text-emerald-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
                            : "bg-white text-amber-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    Usa valores positivos para aumentos (ej. 15%) o negativos para descuentos (ej. -5%).
                  </p>
                </div>

                {/* 2. Objetivo y Redondeo */}
                <div className="md:col-span-7 space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                  {/* Objetivo de Aplicación */}
                  <div>
                    <label className="text-slate-800 font-bold block mb-1.5 text-xs">
                      2. Objetivo de Aplicación
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetField("PRICE");
                          handleParameterChange();
                        }}
                        className={`py-2 px-2.5 rounded-xl text-center text-xs font-semibold border transition-all ${
                          targetField === "PRICE"
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Solo Precio Venta
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetField("COST_PRICE");
                          handleParameterChange();
                        }}
                        className={`py-2 px-2.5 rounded-xl text-center text-xs font-semibold border transition-all ${
                          targetField === "COST_PRICE"
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Solo Precio Costo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetField("BOTH");
                          handleParameterChange();
                        }}
                        className={`py-2 px-2.5 rounded-xl text-center text-xs font-semibold border transition-all ${
                          targetField === "BOTH"
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Ambos (Costo y Venta)
                      </button>
                    </div>
                  </div>

                  {/* Política de Redondeo */}
                  <div>
                    <label className="text-slate-800 font-bold flex items-center justify-between mb-1.5 text-xs">
                      <span>3. Política de Redondeo Comercial</span>
                      <span className="text-[11px] text-emerald-700 font-medium">Recomendado ARS: $50</span>
                    </label>
                    <select
                      value={roundingPolicy}
                      onChange={(e) => {
                        setRoundingPolicy(e.target.value as RoundingPolicy);
                        handleParameterChange();
                      }}
                      className="w-full bg-white text-slate-900 font-medium px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                    >
                      <option value="NEAREST_50">
                        Múltiplo de $ 50 (Recomendado para inflación ARS - ej: $ 45.450)
                      </option>
                      <option value="NEAREST_100">
                        Múltiplo de $ 100 (ej: $ 45.500)
                      </option>
                      <option value="PSYCHOLOGICAL_90">
                        Terminación psicológica en $ 90 (ej: $ 45.890)
                      </option>
                      <option value="INTEGER">
                        Entero sin decimales (ej: $ 45.423)
                      </option>
                      <option value="NEAREST_10">
                        Múltiplo de $ 10 (ej: $ 45.420)
                      </option>
                      <option value="NONE">
                        Sin redondeo comercial (2 decimales exactos)
                      </option>
                    </select>
                  </div>
                </div>

                {/* 3. Ámbito / Filtro de Aplicación */}
                <div className="md:col-span-12 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                  <label className="text-slate-800 font-bold block text-xs">
                    4. Ámbito / Alcance del Aumento
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Opción A: Todo el catálogo */}
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        scope === "ALL"
                          ? "bg-white border-slate-900 shadow-xs ring-1 ring-slate-900"
                          : "bg-white border-slate-200 hover:bg-slate-100/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === "ALL"}
                        onChange={() => {
                          setScope("ALL");
                          handleParameterChange();
                        }}
                        className="mt-0.5 text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Todo el Catálogo</span>
                        <span className="text-[11px] text-slate-500">
                          Todos los productos activos ({totalCatalogProductsCount > 0 ? totalCatalogProductsCount : "catálogo completo"})
                        </span>
                      </div>
                    </label>

                    {/* Opción B: Por Disciplina */}
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        scope === "DISCIPLINE"
                          ? "bg-white border-slate-900 shadow-xs ring-1 ring-slate-900"
                          : "bg-white border-slate-200 hover:bg-slate-100/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === "DISCIPLINE"}
                        onChange={() => {
                          setScope("DISCIPLINE");
                          handleParameterChange();
                        }}
                        className="mt-0.5 text-slate-900 focus:ring-slate-900"
                      />
                      <div className="w-full">
                        <span className="font-bold text-slate-900 block text-xs">Por Disciplina</span>
                        {scope === "DISCIPLINE" ? (
                          <select
                            value={selectedDisciplineId}
                            onChange={(e) => {
                              setSelectedDisciplineId(e.target.value);
                              handleParameterChange();
                            }}
                            className="mt-1.5 w-full bg-slate-50 text-slate-900 px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {disciplines.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-500">Filtrar por deporte específico</span>
                        )}
                      </div>
                    </label>

                    {/* Opción C: Por Marca */}
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        scope === "BRAND"
                          ? "bg-white border-slate-900 shadow-xs ring-1 ring-slate-900"
                          : "bg-white border-slate-200 hover:bg-slate-100/60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === "BRAND"}
                        onChange={() => {
                          setScope("BRAND");
                          handleParameterChange();
                        }}
                        className="mt-0.5 text-slate-900 focus:ring-slate-900"
                      />
                      <div className="w-full">
                        <span className="font-bold text-slate-900 block text-xs">Por Marca</span>
                        {scope === "BRAND" ? (
                          <select
                            value={selectedBrandId}
                            onChange={(e) => {
                              setSelectedBrandId(e.target.value);
                              handleParameterChange();
                            }}
                            className="mt-1.5 w-full bg-slate-50 text-slate-900 px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] text-slate-500">Filtrar por proveedor o marca</span>
                        )}
                      </div>
                    </label>

                    {/* Opción D: Artículos Seleccionados en la Tabla */}
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                        selectedProductIds.length === 0
                          ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200"
                          : scope === "SELECTED"
                          ? "bg-white border-slate-900 shadow-xs ring-1 ring-slate-900 cursor-pointer"
                          : "bg-white border-slate-200 hover:bg-slate-100/60 cursor-pointer"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        disabled={selectedProductIds.length === 0}
                        checked={scope === "SELECTED"}
                        onChange={() => {
                          setScope("SELECTED");
                          handleParameterChange();
                        }}
                        className="mt-0.5 text-slate-900 focus:ring-slate-900"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Solo Seleccionados</span>
                        <span className="text-[11px] text-slate-500">
                          {selectedProductIds.length > 0
                            ? `${selectedProductIds.length} producto(s) marcados en tabla`
                            : "Ninguno marcado en la tabla"}
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Variantes y Motivo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Checkbox actualizar variantes */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        checked={updateVariantPrices}
                        onChange={(e) => {
                          setUpdateVariantPrices(e.target.checked);
                          handleParameterChange();
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-slate-700 font-medium text-xs">
                        Actualizar también variantes con precio propio asignado
                      </span>
                    </label>

                    {/* Motivo de la Modificación */}
                    <div className="flex items-center gap-2 bg-white p-1.5 px-3 rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-medium text-xs shrink-0">Motivo (auditoría):</span>
                      <input
                        type="text"
                        placeholder="Ej. Aumento de lista Speedo Septiembre 2026"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full bg-transparent text-slate-800 text-xs focus:outline-none placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Previsualizar Impacto (Live Preview CTA) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="text-slate-500 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Ámbito actual: <strong className="text-slate-800">{selectedScopeName()}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRunPreview}
                  disabled={isPreviewing}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 active:scale-95 text-[#00D615] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPreviewing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#00D615]" />
                      <span>Calculando Impacto...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Previsualizar Cambios</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error de Previsualización si ocurre */}
              {previewError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}

              {/* Simulación Previa / Live Preview Container */}
              {previewResult && (
                <div className={`space-y-4 pt-2 border-t border-slate-200/80 transition-opacity ${isFormStale ? "opacity-60" : "opacity-100"}`}>
                  
                  {isFormStale && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Has modificado los parámetros. Pulsa "Previsualizar Impacto" para refrescar el cálculo.
                      </span>
                      <button
                        type="button"
                        onClick={handleRunPreview}
                        className="font-bold underline hover:text-amber-950"
                      >
                        Refrescar
                      </button>
                    </div>
                  )}

                  {/* Tarjetas de Métricas Económicas Agregadas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium block">Productos Afectados</span>
                      <span className="text-lg font-extrabold text-slate-900 block mt-0.5">
                        {previewResult.summary.matchedProductsCount}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {previewResult.summary.updatedVariantsCount} variantes
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium block">Suma Actual Catálogo</span>
                      <span className="text-sm font-bold text-slate-700 block mt-1">
                        {formatCurrency(previewResult.summary.totalOldPriceSum)}
                      </span>
                      <span className="text-[10px] text-slate-400">Base de comparación</span>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/70">
                      <span className="text-[11px] text-emerald-800 font-medium block">Suma Nueva Proyectada</span>
                      <span className="text-sm font-extrabold text-emerald-900 block mt-1">
                        {formatCurrency(previewResult.summary.totalNewPriceSum)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Con redondeo comercial
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl border ${
                      previewResult.summary.totalDeltaSum >= 0
                        ? "bg-emerald-500/10 border-emerald-300"
                        : "bg-rose-500/10 border-rose-300"
                    }`}>
                      <span className="text-[11px] text-slate-700 font-medium block">Diferencia Total ($)</span>
                      <span className={`text-sm font-extrabold block mt-1 ${
                        previewResult.summary.totalDeltaSum >= 0 ? "text-emerald-700" : "text-rose-700"
                      }`}>
                        {previewResult.summary.totalDeltaSum >= 0 ? "+" : ""}
                        {formatCurrency(previewResult.summary.totalDeltaSum)}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Impacto financiero global
                      </span>
                    </div>
                  </div>

                  {/* Tabla Comparativa de Muestra (Primeras Filas) */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">
                        Muestra de Impacto (Primeras {Math.min(5, previewResult.auditLog.length)} de {previewResult.auditLog.length} filas)
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        Política: {previewResult.appliedSettings.roundingPolicy}
                      </span>
                    </div>

                    {previewResult.auditLog.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        No se encontraron productos con el filtro aplicado.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Producto / Marca</th>
                              {targetField === "COST_PRICE" || targetField === "BOTH" ? (
                                <>
                                  <th className="py-2 px-3">Costo Actual</th>
                                  <th className="py-2 px-3">Costo Nuevo</th>
                                </>
                              ) : null}
                              {targetField === "PRICE" || targetField === "BOTH" ? (
                                <>
                                  <th className="py-2 px-3">Precio Venta Actual</th>
                                  <th className="py-2 px-3">Precio Venta Nuevo</th>
                                </>
                              ) : null}
                              <th className="py-2 px-3 text-right">Variación ($ / %)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {previewResult.auditLog.slice(0, 5).map((row) => (
                              <tr key={row.productId} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                                    {row.productName}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {row.brand} • {row.discipline}
                                  </div>
                                </td>

                                {targetField === "COST_PRICE" || targetField === "BOTH" ? (
                                  <>
                                    <td className="py-2.5 px-3 font-mono text-slate-500">
                                      {formatCurrency(row.oldCostPrice)}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                      {formatCurrency(row.newCostPrice)}
                                    </td>
                                  </>
                                ) : null}

                                {targetField === "PRICE" || targetField === "BOTH" ? (
                                  <>
                                    <td className="py-2.5 px-3 font-mono text-slate-500">
                                      {formatCurrency(row.oldPrice)}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                                      {formatCurrency(row.newPrice)}
                                    </td>
                                  </>
                                ) : null}

                                <td className="py-2.5 px-3 text-right">
                                  <span className={`inline-flex items-center gap-1 font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                                    row.priceDelta >= 0
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      : "bg-rose-50 text-rose-800 border border-rose-200"
                                  }`}>
                                    {row.priceDelta >= 0 ? "+" : ""}{formatCurrency(row.priceDelta)}
                                    <span className="text-[10px] font-normal text-slate-500">
                                      ({row.effectivePercentage > 0 ? `+${row.effectivePercentage}%` : `${row.effectivePercentage}%`})
                                    </span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer / Actions */}
        {!executionResult && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80">
            <button
              type="button"
              onClick={handleClose}
              disabled={isExecuting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold transition-all shadow-2xs"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleRequestApply}
              disabled={isExecuting || !previewResult || isFormStale || previewResult.summary.matchedProductsCount === 0}
              className={`w-full sm:w-auto font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95 ${
                !previewResult || isFormStale || previewResult.summary.matchedProductsCount === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : percentage >= 0
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-amber-600 hover:bg-amber-500 text-white"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>
                {isFormStale || !previewResult
                  ? "Previsualizar antes de confirmar"
                  : `Aplicar ${percentage > 0 ? `+${percentage}%` : `${percentage}%`} a ${previewResult.summary.matchedProductsCount} productos`}
              </span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL DE DOBLE CONFIRMACIÓN DESTRUCITVA (Seguridad Absoluta) */}
        {/* ========================================================= */}
        {showConfirmDialog && previewResult && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200/80 space-y-4 animate-in zoom-in-95 duration-150">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ¿Confirmar Actualización Definitiva?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Esta acción modificará la base de datos de manera permanente.
                  </p>
                </div>
              </div>

              {/* Detalle de Impacto de la Confirmación */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Porcentaje a aplicar:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {percentage > 0 ? `+${percentage}%` : `${percentage}%`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ámbito seleccionado:</span>
                  <span className="font-semibold text-slate-900">{selectedScopeName()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Productos a modificar:</span>
                  <span className="font-bold text-slate-900">{previewResult.summary.matchedProductsCount} productos</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Variantes afectadas:</span>
                  <span className="font-bold text-slate-900">{previewResult.summary.updatedVariantsCount} variantes</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>Diferencia neta ($):</span>
                  <span className={`font-bold font-mono ${
                    previewResult.summary.totalDeltaSum >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}>
                    {previewResult.summary.totalDeltaSum >= 0 ? "+" : ""}
                    {formatCurrency(previewResult.summary.totalDeltaSum)}
                  </span>
                </div>
              </div>

              {executionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                  {executionError}
                </div>
              )}

              {/* Botones del Diálogo de Seguridad */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isExecuting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-all"
                >
                  Cancelar y Revisar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmExecution}
                  disabled={isExecuting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Escribiendo en BD...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Sí, Actualizar Precios</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

