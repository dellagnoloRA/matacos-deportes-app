"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Check,
  Search,
  Palette,
  Ruler,
  Boxes,
  RotateCcw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getColorSwatchClass } from "./PosProductCard";

export interface VariantOption {
  id: string;
  size: string;
  color: string;
  sku?: string;
  barcode?: string;
  stockStore: number;
  stockReserved?: number;
  price?: number | null;
}

export interface VariantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  brandName?: string;
  basePrice?: number;
  variants: VariantOption[];
  currentVariantId?: string;
  originalReservedInTicket?: number;
  mode: "change" | "add";
  onSelectVariant: (variant: VariantOption) => void;
}

/**
 * Ordena las variantes naturalmente por talle (numérico o indumentaria estándar)
 * y luego alfabéticamente por color.
 */
function sortVariantsNaturally<T extends { size: string; color?: string | null }>(
  variants: T[]
): T[] {
  const sizeOrder: Record<string, number> = {
    xxs: 1,
    xs: 2,
    s: 3,
    m: 4,
    l: 5,
    xl: 6,
    xxl: 7,
    "2xl": 7,
    xxxl: 8,
    "3xl": 8,
    "4xl": 9,
    unico: 10,
    único: 10,
    u: 10,
  };

  return [...variants].sort((a, b) => {
    const sA = (a.size || "").trim().toLowerCase();
    const sB = (b.size || "").trim().toLowerCase();

    const numA = parseFloat(sA.replace(",", "."));
    const numB = parseFloat(sB.replace(",", "."));
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA - numB;
    } else if (sizeOrder[sA] && sizeOrder[sB]) {
      if (sizeOrder[sA] !== sizeOrder[sB]) return sizeOrder[sA] - sizeOrder[sB];
    } else if (sA !== sB) {
      const cmp = sA.localeCompare(sB, "es", { numeric: true });
      if (cmp !== 0) return cmp;
    }

    const cA = (a.color || "").trim().toLowerCase();
    const cB = (b.color || "").trim().toLowerCase();
    return cA.localeCompare(cB, "es");
  });
}

export function VariantSelectorModal({
  isOpen,
  onClose,
  productName,
  brandName,
  basePrice,
  variants,
  currentVariantId,
  originalReservedInTicket = 0,
  mode,
  onSelectVariant,
}: VariantSelectorModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    currentVariantId || null
  );
  const [selectedColor, setSelectedColor] = useState<string>("TODOS");
  const [filterText, setFilterText] = useState<string>("");
  const [onlyInStock, setOnlyInStock] = useState<boolean>(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedVariantId(currentVariantId || null);
      setFilterText("");
      setOnlyInStock(true);

      // Si hay una variante actual, seleccionar su color por defecto
      if (currentVariantId) {
        const currentVar = variants.find((v) => v.id === currentVariantId);
        if (currentVar && currentVar.color) {
          setSelectedColor(currentVar.color.trim());
        } else {
          setSelectedColor("TODOS");
        }
      } else {
        setSelectedColor("TODOS");
      }

      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
    }
  }, [isOpen, currentVariantId, variants]);

  // Lista única de colores ordenados alfabéticamente con conteo de stock disponible
  const colorOptions = useMemo(() => {
    const map = new Map<string, { totalStock: number; count: number }>();

    for (const v of variants) {
      const c = (v.color || "Sin Color").trim();
      const origRes = v.id === currentVariantId ? originalReservedInTicket : 0;
      const avail = Math.max(0, v.stockStore - (v.stockReserved || 0) + origRes);

      const existing = map.get(c) || { totalStock: 0, count: 0 };
      existing.totalStock += avail;
      existing.count += 1;
      map.set(c, existing);
    }

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [variants, currentVariantId, originalReservedInTicket]);

  // Filtrar variantes según color seleccionado, texto y stock
  const filteredVariants = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    const sorted = sortVariantsNaturally(variants);

    return sorted.filter((v) => {
      const colorMatch =
        selectedColor === "TODOS" ||
        (v.color || "Sin Color").trim().toLowerCase() === selectedColor.toLowerCase();

      if (!colorMatch) return false;

      const origRes = v.id === currentVariantId ? originalReservedInTicket : 0;
      const avail = v.stockStore - (v.stockReserved || 0) + origRes;
      if (onlyInStock && avail <= 0 && v.id !== currentVariantId) {
        return false;
      }

      if (q) {
        const matchSize = v.size.toLowerCase().includes(q);
        const matchColor = (v.color || "").toLowerCase().includes(q);
        const matchSku = (v.sku || "").toLowerCase().includes(q);
        const matchBarcode = (v.barcode || "").toLowerCase().includes(q);
        return matchSize || matchColor || matchSku || matchBarcode;
      }

      return true;
    });
  }, [variants, selectedColor, filterText, onlyInStock, currentVariantId, originalReservedInTicket]);

  if (!isOpen) return null;

  const currentVariant = variants.find((v) => v.id === currentVariantId);
  const activeSelectedVariant = variants.find((v) => v.id === selectedVariantId);

  const getAvailStock = (v: VariantOption) => {
    const origRes = v.id === currentVariantId ? originalReservedInTicket : 0;
    return v.stockStore - (v.stockReserved || 0) + origRes;
  };

  const handleConfirm = () => {
    if (!activeSelectedVariant) return;
    const avail = getAvailStock(activeSelectedVariant);
    if (avail <= 0) return;
    onSelectVariant(activeSelectedVariant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* ========================================================= */}
        {/* ENCABEZADO DEL MODAL                                      */}
        {/* ========================================================= */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                {mode === "change" ? "Cambiar Variante" : "Añadir Prenda"}
              </span>
              {brandName && (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-lg">
                  {brandName}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 truncate mt-1">
              {productName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* RESUMEN DE LA PRENDA ACTUAL (SI ESTÁ EN MODO CAMBIO)       */}
        {/* ========================================================= */}
        {mode === "change" && currentVariant && (
          <div className="px-5 py-2.5 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between text-xs text-amber-950 shrink-0">
            <span className="font-semibold flex items-center gap-1.5">
              <span>Prenda actual en ticket:</span>
              <strong className="font-bold underline decoration-amber-400">
                Talle {currentVariant.size} • {currentVariant.color}
              </strong>
            </span>
            <span className="text-[11px] text-amber-800 font-medium">
              {getAvailStock(currentVariant)} un. disp. salón
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* ÁREA DE FILTROS Y BÚSQUEDA INTERNA                        */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-100 space-y-3 shrink-0">
          {/* Buscador de talle o color */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Buscar talle o color específico (ej: 38, 40, Negro, Blanco)..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Colores (Chips rápidos con swatches) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-emerald-600" />
                <span>Colores Disponibles ({colorOptions.length})</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer lowercase text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span className="text-[11px] font-semibold">solo con stock en salón</span>
              </label>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                type="button"
                onClick={() => setSelectedColor("TODOS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                  selectedColor === "TODOS"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                Todos ({variants.length})
              </button>

              {colorOptions.map((c) => {
                const isSelected = selectedColor.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(isSelected ? "TODOS" : c.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 shrink-0 transition-all ${
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs ring-2 ring-emerald-500/20"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full border ${getColorSwatchClass(c.name)}`}
                    />
                    <span>{c.name}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.totalStock}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* GRILLA DE TALLES Y VARIANTES                              */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/50">
          {filteredVariants.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">
                No hay variantes que coincidan con los filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedColor("TODOS");
                  setFilterText("");
                  setOnlyInStock(false);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredVariants.map((v) => {
                const isSelected = selectedVariantId === v.id;
                const isCurrent = v.id === currentVariantId;
                const avail = getAvailStock(v);
                const isOutOfStock = avail <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isOutOfStock && !isCurrent}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all relative ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30 scale-[1.01]"
                        : isOutOfStock
                        ? "bg-slate-100/70 border-slate-200 opacity-50 cursor-not-allowed"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50 shadow-2xs"
                    }`}
                  >
                    {/* Header de la tarjeta de variante */}
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div>
                        <span
                          className={`text-base font-black font-mono block leading-none ${
                            isSelected ? "text-white" : "text-slate-900"
                          }`}
                        >
                          Talle {v.size}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`w-2 h-2 rounded-full border shrink-0 ${getColorSwatchClass(
                              v.color
                            )}`}
                          />
                          <span
                            className={`text-[11px] font-semibold truncate max-w-[90px] ${
                              isSelected ? "text-emerald-100" : "text-slate-600"
                            }`}
                          >
                            {v.color || "Único"}
                          </span>
                        </div>
                      </div>

                      {/* Icono de Check o Badge de Actual */}
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-white text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                          Actual
                        </span>
                      ) : null}
                    </div>

                    {/* Stock disponible y precio */}
                    <div className="pt-2 border-t border-slate-100/40 flex items-center justify-between text-[11px] w-full font-mono">
                      <span
                        className={`font-bold ${
                          isSelected
                            ? "text-emerald-100"
                            : isOutOfStock
                            ? "text-rose-600"
                            : "text-emerald-700"
                        }`}
                      >
                        {isOutOfStock ? "Sin stock" : `${avail} disp.`}
                      </span>

                      {v.price && (
                        <span
                          className={`font-bold ${
                            isSelected ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {formatCurrency(Number(v.price))}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* PIE DEL MODAL: CONFIRMACIÓN Y RESUMEN                     */}
        {/* ========================================================= */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            {activeSelectedVariant ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Seleccionado:</span>
                <span className="font-black text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-xl flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full border ${getColorSwatchClass(
                      activeSelectedVariant.color
                    )}`}
                  />
                  <span>Talle {activeSelectedVariant.size}</span>
                  <span>•</span>
                  <span>{activeSelectedVariant.color}</span>
                  <span className="text-emerald-700 font-mono font-bold ml-1">
                    ({getAvailStock(activeSelectedVariant)} un. salón)
                  </span>
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium">
                Toca un talle para seleccionarlo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={
                !activeSelectedVariant ||
                getAvailStock(activeSelectedVariant) <= 0 ||
                (mode === "change" && activeSelectedVariant.id === currentVariantId)
              }
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              {mode === "change" ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirmar Cambio</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Añadir al Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
