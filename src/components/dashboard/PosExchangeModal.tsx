"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  ArrowLeftRight,
  Search,
  Check,
  AlertCircle,
  Package,
  RotateCcw,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { exchangeProductSize } from "@/server/actions/inventoryActions";
import { formatCurrency } from "@/lib/utils";

interface PosExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: DetailedProductItem[];
  onExchangeSuccess?: (message: string) => void;
}

const COMMON_REASONS = [
  "Talle chico",
  "Talle grande",
  "Preferencia de color",
  "Cambio por regalo",
  "Falla de fábrica / defecto",
];

export function PosExchangeModal({
  isOpen,
  onClose,
  products,
  onExchangeSuccess,
}: PosExchangeModalProps) {
  // Prenda devuelta
  const [returnSearch, setReturnSearch] = useState("");
  const [selectedReturnProduct, setSelectedReturnProduct] = useState<DetailedProductItem | null>(null);
  const [selectedReturnVariant, setSelectedReturnVariant] = useState<ProductVariantItem | null>(null);

  // Prenda entregada
  const [isDifferentProduct, setIsDifferentProduct] = useState(false);
  const [exchangeSearch, setExchangeSearch] = useState("");
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<DetailedProductItem | null>(null);
  const [selectedExchangeVariant, setSelectedExchangeVariant] = useState<ProductVariantItem | null>(null);

  // Cantidad y motivo
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Talle chico");
  const [customReason, setCustomReason] = useState("");

  // Estado de envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Búsqueda de producto devuelto
  const returnSearchResults = useMemo(() => {
    const q = returnSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        const matchesVariant = p.variants.some(
          (v) =>
            v.barcode?.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q) ||
            v.color?.toLowerCase().includes(q) ||
            v.size.toLowerCase().includes(q)
        );
        return matchesName || matchesBrand || matchesSku || matchesBarcode || matchesVariant;
      })
      .slice(0, 8);
  }, [products, returnSearch]);

  // Búsqueda de producto a entregar si es diferente
  const exchangeSearchResults = useMemo(() => {
    if (!isDifferentProduct) return [];
    const q = exchangeSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        return matchesName || matchesBrand || matchesSku || matchesBarcode;
      })
      .slice(0, 8);
  }, [products, exchangeSearch, isDifferentProduct]);

  // Si no es un producto diferente, el producto a entregar es el mismo que el devuelto
  const targetExchangeProduct = isDifferentProduct
    ? selectedExchangeProduct
    : selectedReturnProduct;

  if (!isOpen) return null;

  const handleSelectReturnProduct = (product: DetailedProductItem) => {
    setSelectedReturnProduct(product);
    setSelectedReturnVariant(null);
    setSelectedExchangeVariant(null);
    setReturnSearch("");
  };

  const handleSelectReturnVariant = (variant: ProductVariantItem) => {
    setSelectedReturnVariant(variant);
    setSelectedExchangeVariant(null);
    setErrorMessage(null);
  };

  const handleSelectExchangeVariant = (variant: ProductVariantItem) => {
    setSelectedExchangeVariant(variant);
    setErrorMessage(null);
  };

  const resetForm = () => {
    setSelectedReturnProduct(null);
    setSelectedReturnVariant(null);
    setIsDifferentProduct(false);
    setSelectedExchangeProduct(null);
    setSelectedExchangeVariant(null);
    setReturnSearch("");
    setExchangeSearch("");
    setQuantity(1);
    setReason("Talle chico");
    setCustomReason("");
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedReturnVariant?.id) {
      setErrorMessage("Por favor selecciona la variante de producto a devolver.");
      return;
    }

    if (!selectedExchangeVariant?.id) {
      setErrorMessage("Por favor selecciona el nuevo talle o variante a entregar.");
      return;
    }

    if (selectedReturnVariant.id === selectedExchangeVariant.id) {
      setErrorMessage("La prenda devuelta y la prenda a entregar no pueden ser el mismo talle y color.");
      return;
    }

    const availableStock = selectedExchangeVariant.stockStore;
    if (availableStock < quantity) {
      setErrorMessage(
        `No hay suficiente stock en salón para entregar el Talle ${selectedExchangeVariant.size}. Disponible: ${availableStock} un., Solicitado: ${quantity} un.`
      );
      return;
    }

    const finalReason = reason === "Otro" ? customReason.trim() : reason;
    if (!finalReason) {
      setErrorMessage("Debes especificar un motivo para el cambio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await exchangeProductSize({
        returnVariantId: selectedReturnVariant.id,
        exchangeVariantId: selectedExchangeVariant.id,
        quantity,
        targetLocation: "STORE",
        reason: finalReason,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Ocurrió un error al procesar el cambio de talle.");
        return;
      }

      onExchangeSuccess?.(
        res.message ||
          `Cambio completado. Reingresó Talle ${selectedReturnVariant.size} y egresó Talle ${selectedExchangeVariant.size}.`
      );
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al conectar con el servidor.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white flex items-center justify-between border-b border-sky-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-inner">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Devolución / Cambio de Talle
                </h3>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-sky-400/30 uppercase">
                  Salón Saavedra 241
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Reingresa la prenda devuelta al stock y entrega el nuevo talle en una sola operación atómica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PASO 1: Prenda a Devolver */}
          <div className="space-y-3 bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                  Prenda que el cliente devuelve (Reingreso a Salón)
                </h4>
              </div>
              {selectedReturnProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReturnProduct(null);
                    setSelectedReturnVariant(null);
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 font-bold hover:underline"
                >
                  Cambiar producto
                </button>
              )}
            </div>

            {!selectedReturnProduct ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={returnSearch}
                    onChange={(e) => setReturnSearch(e.target.value)}
                    placeholder="Escanear código de barras de la prenda o buscar por nombre / SKU..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all placeholder:text-slate-400"
                    autoFocus
                  />
                </div>

                {returnSearchResults.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                    {returnSearchResults.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectReturnProduct(prod)}
                        className="w-full p-2.5 text-left hover:bg-sky-50/60 flex items-center justify-between transition-colors text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{prod.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {prod.brand} • SKU: {prod.sku} • {prod.variants.length} variantes
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(prod.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Producto Seleccionado</span>
                    <h5 className="text-sm font-bold text-slate-900">{selectedReturnProduct.name}</h5>
                    <p className="text-xs text-slate-500">{selectedReturnProduct.brand} • SKU: {selectedReturnProduct.sku}</p>
                  </div>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {formatCurrency(selectedReturnProduct.price)}
                  </span>
                </div>

                {/* Selección de variante devuelta */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Selecciona el talle / color físico que el cliente trajo para devolver:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedReturnProduct.variants.map((v) => {
                      const isSelected = selectedReturnVariant?.id === v.id;
                      return (
                        <button
                          key={v.id || `${v.size}-${v.color}`}
                          type="button"
                          onClick={() => handleSelectReturnVariant(v)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          <span>Talle {v.size}</span>
                          {v.color && <span className="opacity-75">({v.color})</span>}
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PASO 2: Prenda a Entregar */}
          {selectedReturnVariant && (
            <div className="space-y-3 bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    Nuevo talle o prenda a entregar al cliente (Egreso de Salón)
                  </h4>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={isDifferentProduct}
                    onChange={(e) => {
                      setIsDifferentProduct(e.target.checked);
                      setSelectedExchangeProduct(null);
                      setSelectedExchangeVariant(null);
                    }}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                  />
                  <span>Cambiar por otro modelo</span>
                </label>
              </div>

              {isDifferentProduct && !selectedExchangeProduct && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={exchangeSearch}
                      onChange={(e) => setExchangeSearch(e.target.value)}
                      placeholder="Buscar el otro modelo o prenda a entregar..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {exchangeSearchResults.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                      {exchangeSearchResults.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => setSelectedExchangeProduct(prod)}
                          className="w-full p-2.5 text-left hover:bg-sky-50/60 flex items-center justify-between transition-colors text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{prod.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {prod.brand} • SKU: {prod.sku}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(prod.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {targetExchangeProduct && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  {isDifferentProduct && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Modelo a Entregar</span>
                        <h5 className="text-sm font-bold text-slate-900">{targetExchangeProduct.name}</h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExchangeProduct(null);
                          setSelectedExchangeVariant(null);
                        }}
                        className="text-xs text-sky-600 font-bold hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Selecciona el talle que se lleva el cliente:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {targetExchangeProduct.variants.map((v) => {
                        const isSameAsReturned = v.id === selectedReturnVariant.id;
                        const hasStock = v.stockStore > 0;
                        const isSelected = selectedExchangeVariant?.id === v.id;
                        const isDisabled = isSameAsReturned || !hasStock;

                        return (
                          <button
                            key={v.id || `${v.size}-${v.color}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleSelectExchangeVariant(v)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : isDisabled
                                ? "bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed"
                                : "bg-white hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-800 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Talle {v.size}</span>
                              {v.color && <span className="opacity-75 font-normal">({v.color})</span>}
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] ml-1" />}
                            </div>
                            <span
                              className={`text-[10px] font-mono ${
                                isSelected
                                  ? "text-emerald-100"
                                  : hasStock
                                  ? "text-emerald-700"
                                  : "text-rose-500 font-bold"
                              }`}
                            >
                              {isSameAsReturned
                                ? "(Mismo talle)"
                                : hasStock
                                ? `${v.stockStore} un. en salón`
                                : "Agotado en salón"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Motivo y Cantidad */}
          {selectedReturnVariant && selectedExchangeVariant && (
            <div className="space-y-4 bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 animate-in fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 font-black text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Motivo del cambio
                </h4>
              </div>

              {/* Botones de motivos comunes */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      setCustomReason("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      reason === r
                        ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setReason("Otro")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    reason === "Otro"
                      ? "bg-sky-600 text-white border-sky-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Otro motivo
                </button>
              </div>

              {reason === "Otro" && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Escribí el motivo del cambio..."
                  className="w-full px-3.5 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  autoFocus
                />
              )}

              {/* Resumen del Intercambio */}
              <div className="p-3.5 bg-white rounded-xl border border-sky-200/80 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                  Resumen de Movimiento Atómico
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-rose-50/60 rounded-lg border border-rose-100">
                    <ArrowDownLeft className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold text-rose-900">Reingresa a Salón (+{quantity})</p>
                      <p className="text-[11px] text-slate-600">
                        {selectedReturnProduct?.name} ({selectedReturnVariant.size})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-900">Egresa de Salón (-{quantity})</p>
                      <p className="text-[11px] text-slate-600">
                        {targetExchangeProduct?.name} ({selectedExchangeVariant.size})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReturnVariant || !selectedExchangeVariant}
              className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando cambio...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirmar Cambio de Prenda</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
