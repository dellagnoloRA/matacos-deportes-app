"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Printer,
  Barcode,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  CheckCircle2,
  Scroll,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { BarcodeSvg } from "./BarcodeSvg";
import { generateEan13FromSequence, GS1_INTERNAL_PREFIX } from "@/lib/barcodeGenerator";
import { generateInternalBarcodes } from "@/server/actions/barcodeActions";

export type LabelPaperFormat = "50x30" | "40x25" | "80mm";

export interface ThermalLabelPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: DetailedProductItem | null;
  initialVariantId?: string;
  onVariantBarcodeAssigned?: (variantIndex: number, newBarcode: string) => void;
}

interface VariantPrintConfig {
  variant: ProductVariantItem;
  variantIndex: number;
  selected: boolean;
  copies: number;
  barcode: string;
}

export function ThermalLabelPrintModal({
  isOpen,
  onClose,
  product,
  initialVariantId,
  onVariantBarcodeAssigned,
}: ThermalLabelPrintModalProps) {
  // Formato de bobina térmica seleccionado (por defecto 50x30 mm para rollo adhesivo)
  const [format, setFormat] = useState<LabelPaperFormat>("50x30");

  // Configuración de impresión por variante (selección y copias)
  const [variantConfigs, setVariantConfigs] = useState<VariantPrintConfig[]>([]);
  const [isGeneratingMissingBarcodes, setIsGeneratingMissingBarcodes] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (!product || !isOpen) return;

    const initialConfigs: VariantPrintConfig[] = product.variants.map((v, idx) => {
      const isSelected = initialVariantId ? v.barcode === initialVariantId || v.sku === initialVariantId : true;
      const initialCopies = Math.max(1, (v.stockStore || 0) + (v.stockWarehouse || 0));

      return {
        variant: v,
        variantIndex: idx,
        selected: isSelected,
        copies: initialCopies,
        barcode: v.barcode || "",
      };
    });

    setVariantConfigs(initialConfigs);
  }, [product, isOpen, initialVariantId]);

  if (!isOpen || !product) return null;

  // Variantes activas para imprimir
  const activeConfigs = variantConfigs.filter((c) => c.selected && c.copies > 0);
  const totalLabelsCount = activeConfigs.reduce((sum, c) => sum + c.copies, 0);

  // Variante para vista previa interactiva (la primera seleccionada)
  const previewConfig = activeConfigs[0] || variantConfigs[0];

  // Alternar selección de una variante
  const toggleVariantSelection = (idx: number) => {
    setVariantConfigs((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, selected: !c.selected } : c))
    );
  };

  // Cambiar número de copias
  const updateVariantCopies = (idx: number, delta: number) => {
    setVariantConfigs((prev) =>
      prev.map((c, i) =>
        i === idx ? { ...c, copies: Math.max(1, Math.min(999, c.copies + delta)) } : c
      )
    );
  };

  const setVariantCopiesDirect = (idx: number, value: number) => {
    const safeVal = isNaN(value) ? 1 : Math.max(1, Math.min(999, value));
    setVariantConfigs((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, copies: safeVal } : c))
    );
  };

  // Acciones rápidas de selección
  const handleSelectAll = (select: boolean) => {
    setVariantConfigs((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  const handleSetAllToOneCopy = () => {
    setVariantConfigs((prev) => prev.map((c) => ({ ...c, copies: 1 })));
  };

  const handleResetCopiesToStock = () => {
    setVariantConfigs((prev) =>
      prev.map((c) => ({
        ...c,
        copies: Math.max(1, (c.variant.stockStore || 0) + (c.variant.stockWarehouse || 0)),
      }))
    );
  };

  // Asignar código interno GS1 correlativo a variantes que carecen de código
  const handleAutoGenerateMissingBarcodes = async () => {
    const missingIndices = variantConfigs
      .map((c, idx) => (!c.barcode || c.barcode.trim() === "" ? idx : -1))
      .filter((i) => i !== -1);

    if (missingIndices.length === 0) return;

    setIsGeneratingMissingBarcodes(true);

    try {
      let generatedList: string[] = [];

      try {
        const res = await generateInternalBarcodes({
          count: missingIndices.length,
          prefix: GS1_INTERNAL_PREFIX,
        });
        if (res.success && res.barcodes.length === missingIndices.length) {
          generatedList = res.barcodes;
        }
      } catch (err) {
        console.warn("Utilizando generador local de códigos GS1 EAN-13:", err);
      }

      // Fallback local seguro si está offline
      if (generatedList.length < missingIndices.length) {
        const seedBase = Math.floor(Date.now() / 1000) % 900000000;
        generatedList = missingIndices.map((_, i) =>
          generateEan13FromSequence(seedBase + i, GS1_INTERNAL_PREFIX)
        );
      }

      setVariantConfigs((prev) => {
        const updated = [...prev];
        missingIndices.forEach((varIdx, i) => {
          const newCode = generatedList[i];
          updated[varIdx] = { ...updated[varIdx], barcode: newCode };
          onVariantBarcodeAssigned?.(varIdx, newCode);
        });
        return updated;
      });

      setSuccessToast(`Se asignaron ${missingIndices.length} códigos EAN-13 internos.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } finally {
      setIsGeneratingMissingBarcodes(false);
    }
  };

  // Disparar diálogo de impresión nativo del navegador
  const handleTriggerPrint = () => {
    if (totalLabelsCount === 0) return;
    window.print();
  };

  // Dimensiones según formato de bobina térmica
  const formatDimensions = {
    "50x30": {
      name: "Etiqueta Adhesiva 50 × 30 mm",
      description: "Rollo térmico continuo estándar para textil y calzado",
      tag: "Recomendado",
      widthMm: 50,
      heightMm: 30,
      previewWidthPx: 310,
      previewHeightPx: 186,
    },
    "40x25": {
      name: "Etiqueta Adhesiva 40 × 25 mm",
      description: "Rollo compacto para accesorios (antiparras, gorras, tapones)",
      tag: "Accesorios",
      widthMm: 40,
      heightMm: 25,
      previewWidthPx: 260,
      previewHeightPx: 162,
    },
    "80mm": {
      name: "Tira de Comandera 80 mm",
      description: "Impresora térmica de tickets para lote continuo con corte",
      tag: "Mostrador",
      widthMm: 72,
      heightMm: 45,
      previewWidthPx: 340,
      previewHeightPx: 212,
    },
  }[format];

  // Componente que dibuja una etiqueta individual
  const renderSingleLabelContent = (
    config: VariantPrintConfig,
    isForPrint = false
  ) => {
    const effectivePrice =
      config.variant.price !== undefined &&
      config.variant.price !== null &&
      Number(config.variant.price) > 0
        ? Number(config.variant.price)
        : product.price;

    const barcodeVal =
      config.barcode && config.barcode.trim() !== ""
        ? config.barcode.trim()
        : config.variant.sku || product.sku || "2000000000017";

    const isCompact = format === "40x25";

    return (
      <div
        className={`bg-white text-black font-sans select-none flex flex-col justify-between border border-black/30 ${
          isForPrint ? "thermal-label-page" : "rounded-xl shadow-md p-3"
        }`}
        style={
          isForPrint
            ? {
                width: `${formatDimensions.widthMm}mm`,
                height: `${formatDimensions.heightMm}mm`,
                padding: isCompact ? "1.5mm 2mm" : "2mm 2.5mm",
                boxSizing: "border-box",
                pageBreakAfter: "always",
                breakAfter: "page",
              }
            : {
                width: `${formatDimensions.previewWidthPx}px`,
                height: `${formatDimensions.previewHeightPx}px`,
              }
        }
      >
        {/* Cabecera: Marca y Tienda */}
        <div className="flex items-center justify-between border-b border-black/30 pb-0.5 leading-none">
          <span className="font-extrabold text-[9.5px] tracking-wider uppercase text-black">
            MATACOS DEPORTES
          </span>
          <span className="font-bold text-[8.5px] uppercase text-black/80 truncate max-w-[110px]">
            {product.brand}
          </span>
        </div>

        {/* Nombre del Producto */}
        <div className="my-auto py-0.5">
          <div className="font-bold text-[10.5px] leading-tight text-black line-clamp-2">
            {product.name}
          </div>
          <div className="text-[8.5px] text-black/70 flex items-center gap-1.5 mt-0.5">
            <span>{product.discipline}</span>
            <span>•</span>
            <span className="truncate">{product.category}</span>
          </div>
        </div>

        {/* Fila Central: Talle, Color y Precio Prominente */}
        <div className="flex items-end justify-between gap-1 py-0.5 border-y border-dashed border-black/40">
          <div className="flex items-center gap-1.5">
            <div className="bg-black text-white px-1.5 py-0.5 rounded text-[10.5px] font-black leading-none">
              T: {config.variant.size || "Único"}
            </div>
            <div className="font-bold text-[9.5px] leading-tight text-black truncate max-w-[85px]">
              {config.variant.color || "Único"}
            </div>
          </div>

          <div className="text-right">
            <span className="font-black text-[12.5px] tracking-tight leading-none text-black">
              {formatCurrency(effectivePrice)}
            </span>
          </div>
        </div>

        {/* Código de barras Vectorial SVG */}
        <div className="pt-0.5 flex flex-col items-center justify-center">
          <BarcodeSvg
            value={barcodeVal}
            width="96%"
            height={isCompact ? 28 : 36}
            fontSize={isCompact ? 8 : 9}
            showText={true}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-[#00D615] flex items-center justify-center shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Impresión Térmica de Etiquetas
              </h2>
              <p className="text-xs text-slate-500">
                {product.name} • {product.brand} ({product.variants.length} variantes)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Toast de éxito si se generaron códigos */}
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* 1. Selector de Formato de Bobina Térmica */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              1. Formato de Bobina Térmica
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "50x30" as LabelPaperFormat,
                  title: "50 × 30 mm",
                  sub: "Adhesiva Textil / Calzado",
                  tag: "Recomendado",
                  icon: Scroll,
                },
                {
                  id: "40x25" as LabelPaperFormat,
                  title: "40 × 25 mm",
                  sub: "Adhesiva Compacta",
                  tag: "Accesorios",
                  icon: Scroll,
                },
                {
                  id: "80mm" as LabelPaperFormat,
                  title: "Comandera 80 mm",
                  sub: "Tira Continua Ticket",
                  tag: "Mostrador",
                  icon: FileText,
                },
              ].map((fmt) => {
                const IconComponent = fmt.icon;
                const isSelected = format === fmt.id;

                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10"
                        : "bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className={`w-4 h-4 ${isSelected ? "text-[#00D615]" : "text-slate-500"}`} />
                        <span className="font-extrabold text-xs tracking-tight">{fmt.title}</span>
                      </div>
                      <span
                        className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isSelected
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {fmt.tag}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 block ${
                        isSelected ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {fmt.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Área Central: Grilla de Variantes y Previsualizador */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Columna Izquierda: Configuración por Variante */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Variantes y Copias a Imprimir
                </label>

                {/* Acciones de selección masiva */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded-md hover:bg-slate-100"
                  >
                    Todas
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleSetAllToOneCopy}
                    className="text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded-md hover:bg-slate-100"
                  >
                    1 Copia c/u
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleResetCopiesToStock}
                    className="text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded-md hover:bg-slate-100"
                  >
                    Según Stock
                  </button>
                </div>
              </div>

              {/* Botón de Asignar EAN-13 a variantes sin código */}
              {variantConfigs.some((c) => !c.barcode || c.barcode.trim() === "") && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-800">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Hay variantes sin código de barras asignado.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerateMissingBarcodes}
                    disabled={isGeneratingMissingBarcodes}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-all active:scale-95 shrink-0 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingMissingBarcodes ? "Generando..." : "Generar EAN-13"}</span>
                  </button>
                </div>
              )}

              {/* Lista de variantes */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {variantConfigs.map((cfg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      cfg.selected
                        ? "bg-white border-slate-300 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200 opacity-60"
                    }`}
                  >
                    {/* Checkbox y datos de variante */}
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleVariantSelection(idx)}
                        className="text-slate-600 hover:text-slate-900 shrink-0"
                      >
                        {cfg.selected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900">
                            Talle: {cfg.variant.size || "Único"}
                          </span>
                          <span className="text-xs text-slate-500">•</span>
                          <span className="text-xs text-slate-700 font-medium">
                            {cfg.variant.color || "Único"}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                            Stock: {(cfg.variant.stockStore || 0) + (cfg.variant.stockWarehouse || 0)}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          <span>{cfg.barcode || cfg.variant.sku || "[Sin código]"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contador de copias */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={!cfg.selected || cfg.copies <= 1}
                        onClick={() => updateVariantCopies(idx, -1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="1"
                        max="999"
                        disabled={!cfg.selected}
                        value={cfg.copies}
                        onChange={(e) => setVariantCopiesDirect(idx, parseInt(e.target.value, 10))}
                        className="w-12 text-center font-mono font-extrabold text-xs py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />

                      <button
                        type="button"
                        disabled={!cfg.selected}
                        onClick={() => updateVariantCopies(idx, 1)}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna Derecha: Vista Previa en Vivo (Wysiwyg) */}
            <div className="lg:col-span-5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between gap-4">
              <div className="w-full text-center">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  <span>3. Vista Previa Térmica</span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">
                    {formatDimensions.widthMm} × {formatDimensions.heightMm} mm
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Escala de renderizado directo para cabezal térmico de alta nitidez.
                </p>
              </div>

              {/* Tarjeta de previsualización */}
              <div className="p-4 bg-slate-200/60 rounded-2xl border border-slate-300/80 shadow-inner flex items-center justify-center max-w-full overflow-hidden">
                {previewConfig ? (
                  renderSingleLabelContent(previewConfig, false)
                ) : (
                  <div className="text-xs text-slate-400 font-medium py-10">
                    No hay variantes seleccionadas para imprimir
                  </div>
                )}
              </div>

              {/* Resumen numérico */}
              <div className="w-full bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">Total a Imprimir:</span>
                <span className="font-extrabold font-mono text-sm bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {totalLabelsCount} etiqueta{totalLabelsCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Botones */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all active:scale-95"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={totalLabelsCount === 0}
            onClick={handleTriggerPrint}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-[#00D615] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 border border-slate-800"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>Imprimir {totalLabelsCount} Etiqueta{totalLabelsCount === 1 ? "" : "s"}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONTENEDOR OCULTO PARA IMPRESIÓN DIRECTA (@media print)  */}
      {/* ======================================================== */}
      <div id="thermal-print-container" className="hidden">
        {activeConfigs.flatMap((config, cIdx) =>
          Array.from({ length: config.copies }, (_, copyIdx) => (
            <div
              key={`${cIdx}-${copyIdx}`}
              className="thermal-single-print-wrapper"
              style={{
                pageBreakAfter: "always",
                breakAfter: "page",
                width: `${formatDimensions.widthMm}mm`,
                height: `${formatDimensions.heightMm}mm`,
                overflow: "hidden",
              }}
            >
              {renderSingleLabelContent(config, true)}
            </div>
          ))
        )}
      </div>

      {/* Estilos CSS Inyectados para la Impresora Térmica */}
      <style jsx global>{`
        @media print {
          /* Ocultar toda la interfaz del navegador y modales */
          body * {
            visibility: hidden !important;
          }

          /* Hacer visible únicamente el contenedor térmico */
          #thermal-print-container,
          #thermal-print-container * {
            visibility: visible !important;
          }

          #thermal-print-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
          }

          @page {
            margin: 0 !important;
            size: auto !important;
          }

          .thermal-single-print-wrapper {
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
