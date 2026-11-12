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
  Palette,
  Ruler,
  Store,
  Receipt,
  User,
  Info,
} from "lucide-react";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { createPendingExchangeSale } from "@/server/actions/posSaleActions";
import { formatCurrency } from "@/lib/utils";

interface PosExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: DetailedProductItem[];
  cashShiftId?: string | null;
  cashierId?: string | null;
  onExchangeSuccess?: (message: string, extraData?: unknown) => void;
}

const COMMON_REASONS = [
  "Talle chico",
  "Talle grande",
  "Preferencia de color",
  "Cambio por regalo",
  "Falla de fábrica / defecto",
  "Disconformidad con el producto",
  "Arrepentimiento de compra",
];

export function PosExchangeModal({
  isOpen,
  onClose,
  products,
  cashShiftId,
  cashierId,
  onExchangeSuccess,
}: PosExchangeModalProps) {
  // -------------------------------------------------------------
  // ESTADO - TIPO DE OPERACIÓN (CAMBIO vs DEVOLUCIÓN)
  // -------------------------------------------------------------
  const [operationType, setOperationType] = useState<"EXCHANGE" | "RETURN">("EXCHANGE");

  // -------------------------------------------------------------
  // ESTADOS - PASO 1: PRENDA DEVUELTA
  // -------------------------------------------------------------
  const [returnSearch, setReturnSearch] = useState("");
  const [selectedReturnProduct, setSelectedReturnProduct] = useState<DetailedProductItem | null>(null);
  const [selectedReturnVariant, setSelectedReturnVariant] = useState<ProductVariantItem | null>(null);

  // Filtros facetados para variantes de la prenda devuelta
  const [returnVariantSearch, setReturnVariantSearch] = useState("");
  const [returnColorFilter, setReturnColorFilter] = useState("ALL");
  const [returnSizeFilter, setReturnSizeFilter] = useState("ALL");

  // -------------------------------------------------------------
  // ESTADOS - PASO 2: PRENDA A ENTREGAR
  // -------------------------------------------------------------
  const [isDifferentProduct, setIsDifferentProduct] = useState(false);
  const [exchangeSearch, setExchangeSearch] = useState("");
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<DetailedProductItem | null>(null);
  const [selectedExchangeVariant, setSelectedExchangeVariant] = useState<ProductVariantItem | null>(null);

  // Filtros facetados para variantes de la prenda a entregar
  const [exchangeVariantSearch, setExchangeVariantSearch] = useState("");
  const [exchangeColorFilter, setExchangeColorFilter] = useState("ALL");
  const [exchangeSizeFilter, setExchangeSizeFilter] = useState("ALL");
  const [exchangeStockFilter, setExchangeStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");

  // -------------------------------------------------------------
  // ESTADOS - CANTIDAD Y MOTIVO
  // -------------------------------------------------------------
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Talle chico");
  const [customReason, setCustomReason] = useState("");

  // -------------------------------------------------------------
  // ESTADOS - PASO 3: DESTINO Y DATOS DE PREVENTA
  // -------------------------------------------------------------
  const [customerName, setCustomerName] = useState("");

  // Estado de envío y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // BÚSQUEDA INTELIGENTE DE PRODUCTOS (CON AUTO-DETECCIÓN DE VARIANTE POR PISTOLA USB)
  // -------------------------------------------------------------
  const handleReturnSearchChange = (val: string) => {
    setReturnSearch(val);
    const q = val.trim();
    if (!q) return;

    // Si el usuario escanea un código de barras exacto de variante con pistola USB:
    for (const prod of products) {
      const matchedVariant = prod.variants.find(
        (v) => v.barcode && v.barcode.toLowerCase() === q.toLowerCase()
      );
      if (matchedVariant) {
        setSelectedReturnProduct(prod);
        setSelectedReturnVariant(matchedVariant);
        setReturnSearch("");
        return;
      }
    }
  };

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

  const handleExchangeSearchChange = (val: string) => {
    setExchangeSearch(val);
    const q = val.trim();
    if (!q) return;

    // Si el usuario escanea un código de barras exacto de variante con pistola USB:
    for (const prod of products) {
      const matchedVariant = prod.variants.find(
        (v) => v.barcode && v.barcode.toLowerCase() === q.toLowerCase()
      );
      if (matchedVariant) {
        setSelectedExchangeProduct(prod);
        setSelectedExchangeVariant(matchedVariant);
        setExchangeSearch("");
        return;
      }
    }
  };

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

  // Si no es un producto diferente, el modelo a entregar es el mismo que el devuelto
  const targetExchangeProduct = isDifferentProduct ? selectedExchangeProduct : selectedReturnProduct;

  // -------------------------------------------------------------
  // FILTROS FACETADOS DE VARIANTES - PRENDA DEVUELTA
  // -------------------------------------------------------------
  const returnAvailableColors = useMemo(() => {
    if (!selectedReturnProduct) return [];
    const map = new Map<string, number>();
    selectedReturnProduct.variants.forEach((v) => {
      const c = (v.color || "").trim();
      if (c) map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).map(([color, count]) => ({ color, count }));
  }, [selectedReturnProduct]);

  const returnAvailableSizes = useMemo(() => {
    if (!selectedReturnProduct) return [];
    const map = new Map<string, number>();
    selectedReturnProduct.variants.forEach((v) => {
      const s = (v.size || "").trim();
      if (s) map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([size, count]) => ({ size, count }));
  }, [selectedReturnProduct]);

  const filteredReturnVariants = useMemo(() => {
    if (!selectedReturnProduct) return [];
    return selectedReturnProduct.variants.filter((v) => {
      if (returnColorFilter !== "ALL" && (v.color || "").trim().toLowerCase() !== returnColorFilter.toLowerCase()) {
        return false;
      }
      if (returnSizeFilter !== "ALL" && (v.size || "").trim().toLowerCase() !== returnSizeFilter.toLowerCase()) {
        return false;
      }
      if (returnVariantSearch.trim() !== "") {
        const q = returnVariantSearch.trim().toLowerCase();
        const matchesSize = v.size.toLowerCase().includes(q);
        const matchesColor = (v.color || "").toLowerCase().includes(q);
        const matchesBarcode = (v.barcode || "").toLowerCase().includes(q);
        const matchesSku = (v.sku || "").toLowerCase().includes(q);
        if (!matchesSize && !matchesColor && !matchesBarcode && !matchesSku) return false;
      }
      return true;
    });
  }, [selectedReturnProduct, returnColorFilter, returnSizeFilter, returnVariantSearch]);

  // -------------------------------------------------------------
  // FILTROS FACETADOS DE VARIANTES - PRENDA A ENTREGAR
  // -------------------------------------------------------------
  const exchangeAvailableColors = useMemo(() => {
    if (!targetExchangeProduct) return [];
    const map = new Map<string, number>();
    targetExchangeProduct.variants.forEach((v) => {
      const c = (v.color || "").trim();
      if (c) map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).map(([color, count]) => ({ color, count }));
  }, [targetExchangeProduct]);

  const exchangeAvailableSizes = useMemo(() => {
    if (!targetExchangeProduct) return [];
    const map = new Map<string, number>();
    targetExchangeProduct.variants.forEach((v) => {
      const s = (v.size || "").trim();
      if (s) map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([size, count]) => ({ size, count }));
  }, [targetExchangeProduct]);

  const filteredExchangeVariants = useMemo(() => {
    if (!targetExchangeProduct) return [];
    return targetExchangeProduct.variants.filter((v) => {
      if (exchangeColorFilter !== "ALL" && (v.color || "").trim().toLowerCase() !== exchangeColorFilter.toLowerCase()) {
        return false;
      }
      if (exchangeSizeFilter !== "ALL" && (v.size || "").trim().toLowerCase() !== exchangeSizeFilter.toLowerCase()) {
        return false;
      }
      if (exchangeStockFilter === "IN_STOCK" && v.stockStore <= 0) {
        return false;
      }
      if (exchangeStockFilter === "OUT_OF_STOCK" && v.stockStore > 0) {
        return false;
      }
      if (exchangeVariantSearch.trim() !== "") {
        const q = exchangeVariantSearch.trim().toLowerCase();
        const matchesSize = v.size.toLowerCase().includes(q);
        const matchesColor = (v.color || "").toLowerCase().includes(q);
        const matchesBarcode = (v.barcode || "").toLowerCase().includes(q);
        const matchesSku = (v.sku || "").toLowerCase().includes(q);
        if (!matchesSize && !matchesColor && !matchesBarcode && !matchesSku) return false;
      }
      return true;
    });
  }, [targetExchangeProduct, exchangeColorFilter, exchangeSizeFilter, exchangeStockFilter, exchangeVariantSearch]);

  // -------------------------------------------------------------
  // CÁLCULO EN TIEMPO REAL DE PRECIOS Y BALANCE ECONÓMICO
  // -------------------------------------------------------------
  const returnUnitPrice = useMemo(() => {
    if (!selectedReturnVariant || !selectedReturnProduct) return 0;
    const vPrice = selectedReturnVariant.price !== null && selectedReturnVariant.price !== undefined
      ? Number(selectedReturnVariant.price)
      : null;
    return vPrice !== null && vPrice > 0 ? vPrice : Number(selectedReturnProduct.price);
  }, [selectedReturnVariant, selectedReturnProduct]);

  const exchangeUnitPrice = useMemo(() => {
    if (!selectedExchangeVariant || !targetExchangeProduct) return 0;
    const vPrice = selectedExchangeVariant.price !== null && selectedExchangeVariant.price !== undefined
      ? Number(selectedExchangeVariant.price)
      : null;
    return vPrice !== null && vPrice > 0 ? vPrice : Number(targetExchangeProduct.price);
  }, [selectedExchangeVariant, targetExchangeProduct]);

  const totalReturn = returnUnitPrice * quantity;
  const totalExchange = exchangeUnitPrice * quantity;
  const balance = totalExchange - totalReturn;

  const isSamePrice = Math.abs(balance) < 0.01;
  const isMoreExpensive = balance > 0.01;
  const isCheaper = balance < -0.01;
  const absDifference = Math.abs(balance);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleSelectReturnProduct = (product: DetailedProductItem) => {
    setSelectedReturnProduct(product);
    setSelectedReturnVariant(null);
    setSelectedExchangeVariant(null);
    setReturnSearch("");
    setReturnVariantSearch("");
    setReturnColorFilter("ALL");
    setReturnSizeFilter("ALL");
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
    setOperationType("EXCHANGE");
    setSelectedReturnProduct(null);
    setSelectedReturnVariant(null);
    setIsDifferentProduct(false);
    setSelectedExchangeProduct(null);
    setSelectedExchangeVariant(null);
    setReturnSearch("");
    setExchangeSearch("");
    setReturnVariantSearch("");
    setReturnColorFilter("ALL");
    setReturnSizeFilter("ALL");
    setExchangeVariantSearch("");
    setExchangeColorFilter("ALL");
    setExchangeSizeFilter("ALL");
    setExchangeStockFilter("ALL");
    setQuantity(1);
    setReason("Talle chico");
    setCustomReason("");
    setCustomerName("");
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // -------------------------------------------------------------
  // ENVÍO DE TICKET DE CAMBIO O DEVOLUCIÓN A CAJA
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedReturnVariant?.id) {
      setErrorMessage("Por favor selecciona la prenda a devolver.");
      return;
    }

    if (operationType === "EXCHANGE") {
      if (!selectedExchangeVariant?.id) {
        setErrorMessage("Por favor selecciona el nuevo talle o prenda a entregar.");
        return;
      }
      if (selectedReturnVariant.id === selectedExchangeVariant.id) {
        setErrorMessage("La prenda devuelta y la prenda a entregar no pueden ser el mismo talle y color.");
        return;
      }

      const availableStock = selectedExchangeVariant.stockStore - (selectedExchangeVariant.stockReserved || 0);
      if (availableStock < quantity) {
        setErrorMessage(
          `No hay suficiente stock en Salón Saavedra para entregar el Talle ${selectedExchangeVariant.size}. Disponible: ${availableStock} un., Solicitado: ${quantity} un.`
        );
        return;
      }
    }

    const finalReason = reason === "Otro" ? customReason.trim() : reason;
    if (!finalReason) {
      setErrorMessage(
        operationType === "EXCHANGE"
          ? "Debes especificar un motivo para el cambio."
          : "Debes especificar un motivo para la devolución."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPendingExchangeSale({
        operationType,
        returnVariantId: selectedReturnVariant.id,
        exchangeVariantId: operationType === "EXCHANGE" ? selectedExchangeVariant?.id : undefined,
        quantity,
        reason: finalReason,
        customerName: customerName.trim() || undefined,
        sellerId: cashierId ?? undefined,
      });

      if (!res.success || !res.data) {
        setErrorMessage(res.error || "Ocurrió un error al generar el ticket para Caja.");
        return;
      }

      onExchangeSuccess?.(
        res.message ||
          (operationType === "RETURN"
            ? `Solicitud de devolución ${res.data.ticketCode} pasada a Caja exitosamente.`
            : `Ticket de cambio ${res.data.ticketCode} pasado a Caja exitosamente.`),
        res.data
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
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[500px] max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Encabezado */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
              operationType === "RETURN"
                ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            }`}>
              {operationType === "RETURN" ? <RotateCcw className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {operationType === "RETURN" ? "Devolución de Producto" : "Devolución / Cambio de Productos"}
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  operationType === "RETURN"
                    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                }`}>
                  Pase a Caja
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {operationType === "RETURN"
                  ? "Reingreso de producto a stock y solicitud de reintegro económico para Caja"
                  : "Selección de prendas y cálculo de saldo para cobro y resolución en Caja"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo de Trámite: Cambio vs Devolución */}
        <div className="bg-slate-900/95 px-6 py-2.5 flex items-center gap-2 border-b border-slate-800 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Operación:
          </span>
          <button
            type="button"
            onClick={() => {
              setOperationType("EXCHANGE");
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              operationType === "EXCHANGE"
                ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Cambio de Producto</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOperationType("RETURN");
              setSelectedExchangeProduct(null);
              setSelectedExchangeVariant(null);
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              operationType === "RETURN"
                ? "bg-rose-500 text-white font-black shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Solo Devolución (Sin prenda a cambio)</span>
          </button>
        </div>

        {/* Stepper Visual de Progreso Adaptativo */}
        <div className={`bg-slate-100/90 px-6 py-2.5 border-b border-slate-200/80 grid gap-2 shrink-0 select-none ${
          operationType === "RETURN" ? "grid-cols-2" : "grid-cols-3"
        }`}>
          <div className={`flex items-center gap-2 text-xs font-bold ${selectedReturnVariant ? "text-emerald-700" : "text-slate-900"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${selectedReturnVariant ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}`}>
              {selectedReturnVariant ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
            </span>
            <span className="truncate">Prenda Devuelta</span>
          </div>

          {operationType === "EXCHANGE" ? (
            <>
              <div className={`flex items-center gap-2 text-xs font-bold ${selectedExchangeVariant ? "text-emerald-700" : selectedReturnVariant ? "text-slate-900" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${selectedExchangeVariant ? "bg-emerald-600 text-white" : selectedReturnVariant ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {selectedExchangeVariant ? <Check className="w-3 h-3 stroke-[3]" /> : "2"}
                </span>
                <span className="truncate">Prenda a Entregar</span>
              </div>
              <div className={`flex items-center gap-2 text-xs font-bold ${selectedReturnVariant && selectedExchangeVariant ? "text-emerald-700" : "text-slate-400"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${selectedReturnVariant && selectedExchangeVariant ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
                  3
                </span>
                <span className="truncate">Saldo y Destino Caja</span>
              </div>
            </>
          ) : (
            <div className={`flex items-center gap-2 text-xs font-bold ${selectedReturnVariant ? "text-emerald-700" : "text-slate-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${selectedReturnVariant ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
                2
              </span>
              <span className="truncate">Reintegro y Destino Caja</span>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

          {/* ========================================================= */}
          {/* PASO 1: PRENDA DEVUELTA */}
          {/* ========================================================= */}
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
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
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                >
                  Cambiar producto
                </button>
              )}
            </div>

            {!selectedReturnProduct ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={returnSearch}
                    onChange={(e) => handleReturnSearchChange(e.target.value)}
                    placeholder="Escanear código de barras de la prenda (USB) o buscar por nombre / SKU..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
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
                        className="w-full p-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between transition-colors text-xs cursor-pointer"
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
                    <p className="text-xs text-slate-500">
                      {selectedReturnProduct.brand} • SKU: {selectedReturnProduct.sku}
                    </p>
                  </div>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {formatCurrency(selectedReturnProduct.price)}
                  </span>
                </div>

                {/* Buscador y Filtros Facetados de Variantes (igual a Editar Producto) */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Búsqueda rápida de variante */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={returnVariantSearch}
                        onChange={(e) => setReturnVariantSearch(e.target.value)}
                        placeholder="Buscar talle, color, SKU..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Filtro Color */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                      <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        value={returnColorFilter}
                        onChange={(e) => setReturnColorFilter(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                      >
                        <option value="ALL">Color: Todos ({returnAvailableColors.length})</option>
                        {returnAvailableColors.map((c) => (
                          <option key={c.color} value={c.color}>
                            {c.color} ({c.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro Talle */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                      <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        value={returnSizeFilter}
                        onChange={(e) => setReturnSizeFilter(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                      >
                        <option value="ALL">Talle: Todos ({returnAvailableSizes.length})</option>
                        {returnAvailableSizes.map((s) => (
                          <option key={s.size} value={s.size}>
                            Talle {s.size} ({s.count})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Grilla de Variantes para seleccionar la devuelta */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Selecciona el talle / color físico que el cliente trajo para devolver:
                  </label>
                  {filteredReturnVariants.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No hay variantes que coincidan con los filtros de búsqueda.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredReturnVariants.map((v) => {
                        const isSelected = selectedReturnVariant?.id === v.id;
                        const vPrice = v.price ? Number(v.price) : Number(selectedReturnProduct.price);
                        return (
                          <button
                            key={v.id || `${v.size}-${v.color}`}
                            type="button"
                            onClick={() => handleSelectReturnVariant(v)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                              isSelected
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Talle {v.size}</span>
                              {v.color && <span className="opacity-80">({v.color})</span>}
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-[10px] font-mono opacity-75">
                              Valor: {formatCurrency(vPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Guía visual de pasos pendientes cuando aún no se seleccionó la prenda devuelta */}
          {!selectedReturnVariant && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                  2
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-700">
                    {operationType === "EXCHANGE" ? "Prenda a entregar al cliente" : "Motivo y datos del cliente"}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Se habilitará automáticamente tras escanear o seleccionar el producto y variante devuelta arriba.
                  </p>
                </div>
              </div>

              <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/40 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-200/60 text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                  {operationType === "EXCHANGE" ? "3" : "2"}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-500">
                    {operationType === "EXCHANGE"
                      ? "Liquidación económica y comprobante"
                      : "Reintegro económico en Caja"}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {operationType === "EXCHANGE"
                      ? "Cálculo de diferencia (mismo valor, cobro en caja o emisión de vale de compra)."
                      : "Cálculo del monto a devolver al cliente y pase a la lista de espera de Caja."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 2: PRENDA A ENTREGAR (SOLO EN CAMBIO) */}
          {/* ========================================================= */}
          {selectedReturnVariant && operationType === "EXCHANGE" && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 animate-in fade-in">
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

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={isDifferentProduct}
                    onChange={(e) => {
                      setIsDifferentProduct(e.target.checked);
                      setSelectedExchangeProduct(null);
                      setSelectedExchangeVariant(null);
                      setExchangeVariantSearch("");
                      setExchangeColorFilter("ALL");
                      setExchangeSizeFilter("ALL");
                      setExchangeStockFilter("ALL");
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Cambiar por otro modelo</span>
                </label>
              </div>

              {/* Búsqueda de modelo diferente */}
              {isDifferentProduct && !selectedExchangeProduct && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={exchangeSearch}
                      onChange={(e) => handleExchangeSearchChange(e.target.value)}
                      placeholder="Escanear código de barras USB o buscar modelo a entregar..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>

                  {exchangeSearchResults.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                      {exchangeSearchResults.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => {
                            setSelectedExchangeProduct(prod);
                            setSelectedExchangeVariant(null);
                            setExchangeSearch("");
                            setExchangeVariantSearch("");
                            setExchangeColorFilter("ALL");
                            setExchangeSizeFilter("ALL");
                            setExchangeStockFilter("ALL");
                          }}
                          className="w-full p-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between transition-colors text-xs cursor-pointer"
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
              )}

              {targetExchangeProduct && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  {isDifferentProduct && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Modelo a Entregar</span>
                        <h5 className="text-sm font-bold text-slate-900">{targetExchangeProduct.name}</h5>
                        <p className="text-xs text-slate-500">{targetExchangeProduct.brand} • SKU: {targetExchangeProduct.sku}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExchangeProduct(null);
                          setSelectedExchangeVariant(null);
                        }}
                        className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Cambiar modelo
                      </button>
                    </div>
                  )}

                  {/* Barra de Filtros Facetados para Variantes de la prenda a entregar */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {/* Búsqueda rápida */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={exchangeVariantSearch}
                          onChange={(e) => setExchangeVariantSearch(e.target.value)}
                          placeholder="Buscar talle, color, SKU..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Filtro Color */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={exchangeColorFilter}
                          onChange={(e) => setExchangeColorFilter(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                        >
                          <option value="ALL">Color: Todos ({exchangeAvailableColors.length})</option>
                          {exchangeAvailableColors.map((c) => (
                            <option key={c.color} value={c.color}>
                              {c.color} ({c.count})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtro Talle */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={exchangeSizeFilter}
                          onChange={(e) => setExchangeSizeFilter(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                        >
                          <option value="ALL">Talle: Todos ({exchangeAvailableSizes.length})</option>
                          {exchangeAvailableSizes.map((s) => (
                            <option key={s.size} value={s.size}>
                              Talle {s.size} ({s.count})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtro Stock Salón */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={exchangeStockFilter}
                          onChange={(e) => setExchangeStockFilter(e.target.value as "ALL" | "IN_STOCK" | "OUT_OF_STOCK")}
                          className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                        >
                          <option value="ALL">Stock: Todos</option>
                          <option value="IN_STOCK">🟢 Con stock salón (&gt;0)</option>
                          <option value="OUT_OF_STOCK">❌ Sin stock salón (0)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Selección de Variante a entregar */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Selecciona la prenda que se lleva el cliente:
                    </label>
                    {filteredExchangeVariants.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No hay variantes que coincidan con los filtros seleccionados.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {filteredExchangeVariants.map((v) => {
                          const isSameAsReturned = v.id === selectedReturnVariant.id;
                          const hasStock = v.stockStore > 0;
                          const isSelected = selectedExchangeVariant?.id === v.id;
                          const isDisabled = isSameAsReturned || !hasStock;
                          const vPrice = v.price ? Number(v.price) : Number(targetExchangeProduct.price);

                          return (
                            <button
                              key={v.id || `${v.size}-${v.color}`}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => handleSelectExchangeVariant(v)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                  : isDisabled
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                                  : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Talle {v.size}</span>
                                {v.color && <span className="opacity-80">({v.color})</span>}
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                                <span>
                                  {isSameAsReturned
                                    ? "Prenda devuelta"
                                    : hasStock
                                    ? `Salón: ${v.stockStore} un.`
                                    : "Agotado en salón"}
                                </span>
                                <span className="font-bold">{formatCurrency(vPrice)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 3 (o 2): MOTIVO DEL TRÁMITE                          */}
          {/* ========================================================= */}
          {selectedReturnVariant && (operationType === "RETURN" || selectedExchangeVariant) && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 animate-in fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center font-mono">
                  {operationType === "RETURN" ? "2" : "3"}
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {operationType === "RETURN" ? "Motivo de la devolución" : "Motivo del cambio"}
                </h4>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      setCustomReason("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      reason === r
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setReason("Otro")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    reason === "Otro"
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
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
                  placeholder={operationType === "RETURN" ? "Escribí el motivo de la devolución..." : "Escribí el motivo del cambio..."}
                  className="w-full px-3.5 py-2 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 4 (o 3): LIQUIDACIÓN ECONÓMICA Y DESTINO A CAJA      */}
          {/* ========================================================= */}
          {selectedReturnVariant && (operationType === "RETURN" || selectedExchangeVariant) && (
            <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                    operationType === "RETURN" ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"
                  }`}>
                    {operationType === "RETURN" ? "3" : "4"}
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    {operationType === "RETURN" ? (
                      <>
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                        Liquidación Económica y Reintegro en Caja
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4 text-indigo-600" />
                        Liquidación Económica del Cambio
                      </>
                    )}
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {quantity} unidad(es)
                </span>
              </div>

              {/* Nombre / Alias del Cliente */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre o Alias del Cliente (para identificar el ticket en Caja):
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Carlos Gómez o Consumidor Final"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-900 font-semibold rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {operationType === "EXCHANGE" ? (
                <>
                  {/* Comparador de Precios para Cambio */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Prenda Devuelta</span>
                      <p className="font-bold text-slate-800 truncate">{selectedReturnProduct?.name}</p>
                      <p className="text-rose-700 font-mono font-black text-sm">
                        -{formatCurrency(totalReturn)}
                      </p>
                    </div>

                    <div className="text-center py-1 sm:border-x border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Prenda Entregada</span>
                      <p className="font-bold text-slate-800 truncate">{targetExchangeProduct?.name}</p>
                      <p className="text-emerald-700 font-mono font-black text-sm">
                        +{formatCurrency(totalExchange)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Neto</span>
                      <p
                        className={`font-mono font-black text-base ${
                          isSamePrice
                            ? "text-slate-700"
                            : isMoreExpensive
                            ? "text-blue-700"
                            : "text-purple-700"
                        }`}
                      >
                        {isSamePrice ? "$ 0,00" : formatCurrency(balance)}
                      </p>
                      <span className="text-[10px] font-bold text-slate-500">
                        {isSamePrice
                          ? "Mismo valor (Mano a mano)"
                          : isMoreExpensive
                          ? "A cobrar en Caja"
                          : "A favor del cliente"}
                      </span>
                    </div>
                  </div>

                  {/* Tarjetas Informativas de Liquidación hacia Caja */}
                  {isSamePrice && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3] mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>Cambio mano a mano ($ 0,00):</strong> Las dos prendas tienen el mismo valor de lista.
                        Se enviará el ticket a la Caja Mostrador sin saldo a abonar. En Caja se confirmará la entrega del nuevo talle y se emitirá el comprobante oficial.
                      </div>
                    </div>
                  )}

                  {isMoreExpensive && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900 text-xs">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>Diferencia a cobrar en Caja ({formatCurrency(balance)}):</strong> El ticket se enviará a la lista de espera de Caja Mostrador.
                        El cliente abonará la diferencia allí mediante el medio de pago que elija (Efectivo, Tarjeta Débito/Crédito, QR o Transferencia).
                      </div>
                    </div>
                  )}

                  {isCheaper && (
                    <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl flex items-start gap-2.5 text-purple-900 text-xs">
                      <RotateCcw className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong>Saldo a favor del cliente ({formatCurrency(absDifference)}):</strong> La prenda nueva tiene un valor menor.
                        El ticket pasará a la Caja Mostrador indicando el crédito a favor para que el cajero resuelva el saldo según la política del local.
                      </div>
                    </div>
                  )}

                  {/* Aviso operativo */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Al presionar <strong>Pasar Ticket a Caja</strong>, la prenda a entregar quedará reservada y la operación se procesará en Caja sin emitir tickets definitivos en salón.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* Resumen de Reintegro de Devolución Directa */}
                  <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-500 block">Prenda a Reingresar al Stock</span>
                        <p className="font-bold text-slate-900 text-sm">{selectedReturnProduct?.name}</p>
                        <p className="text-xs text-slate-600">
                          Talle {selectedReturnVariant.size} {selectedReturnVariant.color ? `• ${selectedReturnVariant.color}` : ""} x{quantity} un.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-rose-500 block">Monto a Reintegrar</span>
                        <p className="font-mono font-black text-rose-700 text-lg">
                          {formatCurrency(totalReturn)}
                        </p>
                        <span className="text-[10px] font-bold text-slate-500">
                          En Caja Mostrador
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white/80 rounded-lg border border-rose-200 text-[11px] text-slate-700 leading-relaxed flex items-start gap-2">
                      <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        El cliente no se lleva ningún artículo a cambio. Se enviará el ticket de devolución a Caja para procesar el reintegro de <strong>{formatCurrency(totalReturn)}</strong> (Efectivo / Transferencia o emisión de Vale de Compra). La prenda devuelta se reincorporará automáticamente al stock físico de Saavedra 241 cuando Caja complete la operación.
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          </div>

          {/* ========================================================= */}
          {/* FOOTER ACTIONS - PINNED TOOLBAR                           */}
          {/* ========================================================= */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 select-none">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedReturnVariant ||
                (operationType === "EXCHANGE" && !selectedExchangeVariant)
              }
              className={`flex-1 py-3 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 ${
                !selectedReturnVariant || (operationType === "EXCHANGE" && !selectedExchangeVariant)
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : operationType === "RETURN"
                  ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer active:scale-[0.99]"
                  : isMoreExpensive
                  ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-[0.99]"
                  : isCheaper
                  ? "bg-purple-700 hover:bg-purple-800 text-white cursor-pointer active:scale-[0.99]"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-[0.99]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {operationType === "RETURN" ? "Pasando devolución a Caja..." : "Pasando ticket a Caja..."}
                  </span>
                </>
              ) : !selectedReturnVariant ? (
                <>
                  <Search className="w-4 h-4" />
                  <span>Paso 1: Selecciona la prenda a devolver</span>
                </>
              ) : operationType === "EXCHANGE" && !selectedExchangeVariant ? (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Paso 2: Selecciona la prenda a entregar</span>
                </>
              ) : operationType === "RETURN" ? (
                <>
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    Pasar Devolución a Caja (Reintegrar {formatCurrency(totalReturn)})
                  </span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isSamePrice
                      ? "Pasar Ticket a Caja ($ 0,00)"
                      : isMoreExpensive
                      ? `Pasar Ticket a Caja (Cobrar ${formatCurrency(balance)})`
                      : `Pasar Ticket a Caja (Saldo a favor ${formatCurrency(absDifference)})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
