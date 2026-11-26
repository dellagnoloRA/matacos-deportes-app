"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  X,
  ArrowLeftRight,
  Search,
  Check,
  AlertCircle,
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
  Barcode,
  Filter,
} from "lucide-react";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { createPendingExchangeSale } from "@/server/actions/posSaleActions";
import { formatCurrency, normalizeSearch } from "@/lib/utils";
import { getColorSwatchClass } from "./PosProductCard";
import {
  getAvailableStoreStock,
  getAvailableColors,
  resolveDefaultColor,
  findExactVariantByCode,
  searchProductsByQuery,
  filterExchangeVariants,
} from "@/lib/posExchangeUtils";

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

interface VariantFilterPanelProps {
  variants: ProductVariantItem[];
  colorFilter: string;
  onColorFilterChange: (color: string) => void;
  variantSearch: string;
  onVariantSearchChange: (value: string) => void;
  stockFilter?: "ALL" | "IN_STOCK";
  onStockFilterChange?: (value: "ALL" | "IN_STOCK") => void;
  preferredColor?: string;
  excludedVariantId?: string;
  selectedVariantId?: string | null;
  basePrice: number;
  mode: "return" | "exchange";
  onSelectVariant: (variant: ProductVariantItem) => void;
}

function VariantFilterPanel({
  variants,
  colorFilter,
  onColorFilterChange,
  variantSearch,
  onVariantSearchChange,
  stockFilter = "ALL",
  onStockFilterChange,
  preferredColor,
  excludedVariantId,
  selectedVariantId,
  basePrice,
  mode,
  onSelectVariant,
}: VariantFilterPanelProps) {
  const [colorSearchText, setColorSearchText] = useState("");

  // Limpiar buscador local de color cuando cambia la lista de variantes de producto
  useEffect(() => {
    setColorSearchText("");
  }, [variants]);

  const colorOptions = useMemo(
    () => getAvailableColors(variants, excludedVariantId),
    [variants, excludedVariantId]
  );

  const visibleColorOptions = useMemo(() => {
    const q = normalizeSearch(colorSearchText);
    if (!q) return colorOptions;
    return colorOptions.filter(
      (c) =>
        normalizeSearch(c.color).includes(q) ||
        c.color.toLowerCase() === colorFilter.toLowerCase()
    );
  }, [colorOptions, colorSearchText, colorFilter]);

  const totalNonExcludedCount = useMemo(
    () => variants.filter((v) => v.id !== excludedVariantId).length,
    [variants, excludedVariantId]
  );

  const filteredVariants = useMemo(
    () =>
      filterExchangeVariants({
        variants,
        colorFilter,
        variantSearch,
        mode,
        stockFilter,
        excludedVariantId,
      }),
    [variants, excludedVariantId, colorFilter, mode, stockFilter, variantSearch]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-3">
      {/* Selector rápido de Colores (chips con swatch + filtro predictivo si hay muchos) */}
      {colorOptions.length > 0 && (
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-600" />
              <span>Color ({colorOptions.length})</span>
            </span>

            {colorOptions.length > 5 && (
              <div className="relative w-44">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={colorSearchText}
                  onChange={(e) => setColorSearchText(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Filtrar color..."
                  className="w-full pl-7 pr-6 py-1 bg-white text-[11px] text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
                {colorSearchText && (
                  <button
                    type="button"
                    onClick={() => setColorSearchText("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-0.5">
            {visibleColorOptions.map((c) => {
              const isSelected =
                colorFilter !== "ALL" &&
                colorFilter.toLowerCase() === c.color.toLowerCase();
              const isPreferred =
                preferredColor &&
                preferredColor.trim().toLowerCase() === c.color.toLowerCase();

              return (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => onColorFilterChange(c.color)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full border shrink-0 ${getColorSwatchClass(
                      c.color
                    )}`}
                  />
                  <span>{c.color}</span>
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    ({c.count})
                  </span>
                  {isPreferred && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md uppercase font-extrabold ${
                        isSelected
                          ? "bg-emerald-500/25 text-emerald-300"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      Mismo color
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => onColorFilterChange("ALL")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                colorFilter === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white text-slate-600 border-dashed border-slate-300 hover:bg-slate-100"
              }`}
            >
              Todos ({totalNonExcludedCount})
            </button>
          </div>
        </div>
      )}

      {/* Barra de búsqueda por Talle / Código y Filtro de Stock */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Ruler className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={variantSearch}
            onChange={(e) => onVariantSearchChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              colorFilter === "ALL"
                ? "Buscar talle, color, SKU o código..."
                : `Filtrar talle en ${colorFilter} (ej: 38, M, XL) o SKU...`
            }
            className="w-full pl-8 pr-7 py-1.5 bg-white text-xs text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
          />
          {variantSearch && (
            <button
              type="button"
              onClick={() => onVariantSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Limpiar filtro de talle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {mode === "exchange" && onStockFilterChange && (
          <button
            type="button"
            onClick={() =>
              onStockFilterChange(stockFilter === "IN_STOCK" ? "ALL" : "IN_STOCK")
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              stockFilter === "IN_STOCK"
                ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Solo con stock en salón</span>
          </button>
        )}
      </div>

      {/* Grilla acotada de tarjetitas de talles */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
          <label className="text-[11px] font-bold text-slate-700">
            {mode === "return"
              ? "Selecciona el talle que el cliente devuelve:"
              : colorFilter !== "ALL"
              ? `Otros talles disponibles en color ${colorFilter}:`
              : "Selecciona el talle / color que se lleva el cliente:"}
          </label>
          <span className="text-[10.5px] font-semibold text-slate-400">
            Mostrando {filteredVariants.length} {filteredVariants.length === 1 ? "opción" : "opciones"}
          </span>
        </div>

        {filteredVariants.length === 0 ? (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
            <p className="text-xs text-slate-600 font-semibold">
              {colorFilter !== "ALL"
                ? `No hay ${mode === "exchange" ? "otros " : ""}talles disponibles en color ${colorFilter} con los filtros actuales.`
                : "No hay variantes que coincidan con los filtros seleccionados."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {variantSearch.trim() && (
                <button
                  type="button"
                  onClick={() => onVariantSearchChange("")}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Limpiar filtro de talle
                </button>
              )}
              {mode === "exchange" && stockFilter === "IN_STOCK" && onStockFilterChange && (
                <button
                  type="button"
                  onClick={() => onStockFilterChange("ALL")}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Ver también sin stock
                </button>
              )}
              {colorFilter !== "ALL" && colorOptions.length > 1 && (
                <button
                  type="button"
                  onClick={() => onColorFilterChange("ALL")}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Buscar en todos los colores
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredVariants.map((v) => {
              const isSelected = selectedVariantId === v.id;
              const availStock = getAvailableStoreStock(v);
              const isDisabled = mode === "exchange" && availStock <= 0;
              const vPrice = v.price && Number(v.price) > 0 ? Number(v.price) : basePrice;

              return (
                <button
                  key={v.id || `${v.size}-${v.color}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onSelectVariant(v)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 ${
                    isSelected
                      ? mode === "return"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs cursor-pointer"
                        : "bg-emerald-600 text-white border-emerald-600 shadow-xs cursor-pointer"
                      : isDisabled
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                      : mode === "return"
                      ? "bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-slate-800 border-slate-200 cursor-pointer"
                      : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 border-slate-200 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Talle {v.size}</span>
                    {v.color && colorFilter === "ALL" && (
                      <span className="inline-flex items-center gap-1 text-[10px] opacity-85">
                        <span
                          className={`w-2 h-2 rounded-full border shrink-0 ${getColorSwatchClass(
                            v.color
                          )}`}
                        />
                        {v.color}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {mode === "return" ? (
                    <span className="text-[10px] font-mono opacity-75">
                      Valor: {formatCurrency(vPrice)}
                    </span>
                  ) : (
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span>
                        {availStock > 0 ? `Salón: ${availStock} un.` : "Agotado en salón"}
                      </span>
                      <span className="font-bold">{formatCurrency(vPrice)}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function PosExchangeModal({
  isOpen,
  onClose,
  products,
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
  const [isEditingReturnVariant, setIsEditingReturnVariant] = useState(false);

  const [returnVariantSearch, setReturnVariantSearch] = useState("");
  const [returnColorFilter, setReturnColorFilter] = useState("ALL");

  // -------------------------------------------------------------
  // ESTADOS - PASO 2: PRENDA A ENTREGAR
  // -------------------------------------------------------------
  const [isDifferentProduct, setIsDifferentProduct] = useState(false);
  const [exchangeSearch, setExchangeSearch] = useState("");
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<DetailedProductItem | null>(null);
  const [selectedExchangeVariant, setSelectedExchangeVariant] = useState<ProductVariantItem | null>(null);

  const [exchangeVariantSearch, setExchangeVariantSearch] = useState("");
  const [exchangeColorFilter, setExchangeColorFilter] = useState("ALL");
  const [exchangeStockFilter, setExchangeStockFilter] = useState<"ALL" | "IN_STOCK">("ALL");
  const [exchangeNotice, setExchangeNotice] = useState<string | null>(null);

  // -------------------------------------------------------------
  // ESTADOS - CANTIDAD, MOTIVO Y CLIENTE
  // -------------------------------------------------------------
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Talle chico");
  const [customReason, setCustomReason] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const returnSearchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const lastHandledBarcodeRef = useRef<{ code: string; time: number } | null>(null);

  const resetForm = useCallback(() => {
    setOperationType("EXCHANGE");
    setSelectedReturnProduct(null);
    setSelectedReturnVariant(null);
    setIsEditingReturnVariant(false);
    setIsDifferentProduct(false);
    setSelectedExchangeProduct(null);
    setSelectedExchangeVariant(null);
    setReturnSearch("");
    setExchangeSearch("");
    setReturnVariantSearch("");
    setReturnColorFilter("ALL");
    setExchangeVariantSearch("");
    setExchangeColorFilter("ALL");
    setExchangeStockFilter("ALL");
    setExchangeNotice(null);
    setQuantity(1);
    setReason("Talle chico");
    setCustomReason("");
    setCustomerName("");
    setErrorMessage(null);
    barcodeBufferRef.current = "";
    lastHandledBarcodeRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const targetExchangeProduct = isDifferentProduct
    ? selectedExchangeProduct
    : selectedReturnProduct;

  const markBarcodeHandled = useCallback((code: string) => {
    lastHandledBarcodeRef.current = {
      code: code.trim().toLowerCase(),
      time: Date.now(),
    };
  }, []);

  // Inicializa Paso 2 por defecto en el MISMO artículo y MISMO color que la prenda devuelta
  const syncExchangeStepDefaults = useCallback(
    (product: DetailedProductItem, returnVariant: ProductVariantItem) => {
      setIsDifferentProduct(false);
      setSelectedExchangeProduct(null);
      setSelectedExchangeVariant(null);
      setExchangeSearch("");
      setExchangeVariantSearch("");
      setExchangeStockFilter("ALL");
      setExchangeNotice(null);
      setExchangeColorFilter(
        resolveDefaultColor(product.variants, returnVariant.color, undefined, returnVariant.id)
      );
    },
    []
  );

  // -------------------------------------------------------------
  // BÚSQUEDA Y ESCANEO - PASO 1 (PRENDA DEVUELTA)
  // -------------------------------------------------------------
  const applyReturnVariantMatch = useCallback(
    (prod: DetailedProductItem, variant: ProductVariantItem) => {
      setSelectedReturnProduct(prod);
      setSelectedReturnVariant(variant);
      setIsEditingReturnVariant(false);
      setReturnSearch("");
      setReturnVariantSearch("");
      setReturnColorFilter(resolveDefaultColor(prod.variants, variant.color));
      setErrorMessage(null);
      syncExchangeStepDefaults(prod, variant);
    },
    [syncExchangeStepDefaults]
  );

  const handleReturnSearchChange = (val: string) => {
    setReturnSearch(val);
    setErrorMessage(null);
    const q = val.trim();
    if (q.length < 4) return;

    const match = findExactVariantByCode(products, q, false);
    if (match) {
      markBarcodeHandled(q);
      applyReturnVariantMatch(match.product, match.variant);
    }
  };

  const returnSearchResults = useMemo(
    () => searchProductsByQuery(products, returnSearch, 10),
    [products, returnSearch]
  );

  const handleSelectReturnProduct = (
    product: DetailedProductItem,
    preferredColorHint?: string
  ) => {
    const defaultColor = resolveDefaultColor(
      product.variants,
      preferredColorHint,
      returnSearch
    );
    setSelectedReturnProduct(product);
    setSelectedReturnVariant(null);
    setIsEditingReturnVariant(true);
    setSelectedExchangeProduct(null);
    setSelectedExchangeVariant(null);
    setIsDifferentProduct(false);
    setReturnSearch("");
    setReturnVariantSearch("");
    setReturnColorFilter(defaultColor);
    setErrorMessage(null);
  };

  const handleReturnSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = returnSearch.trim();
    if (!q) return;

    const exact = findExactVariantByCode(products, q, true);
    if (exact) {
      markBarcodeHandled(q);
      applyReturnVariantMatch(exact.product, exact.variant);
      return;
    }

    if (returnSearchResults.length === 1) {
      const only = returnSearchResults[0];
      if (only.product.variants.length === 1) {
        applyReturnVariantMatch(only.product, only.product.variants[0]);
      } else {
        handleSelectReturnProduct(only.product, only.matchedVariant?.color);
      }
    }
  };

  const handleSelectReturnVariant = (variant: ProductVariantItem) => {
    if (!selectedReturnProduct) return;
    setSelectedReturnVariant(variant);
    setIsEditingReturnVariant(false);
    setReturnColorFilter(resolveDefaultColor(selectedReturnProduct.variants, variant.color));
    setErrorMessage(null);
    syncExchangeStepDefaults(selectedReturnProduct, variant);
  };

  // -------------------------------------------------------------
  // BÚSQUEDA Y ESCANEO - PASO 2 (PRENDA A ENTREGAR)
  // -------------------------------------------------------------
  const applyExchangeVariantMatch = useCallback(
    (prod: DetailedProductItem, variant: ProductVariantItem) => {
      setErrorMessage(null);
      setExchangeNotice(null);

      if (selectedReturnVariant && variant.id === selectedReturnVariant.id) {
        setExchangeNotice(
          "El código escaneado corresponde a la misma prenda devuelta. Elegí otro talle, color o modelo."
        );
        setExchangeSearch("");
        return;
      }

      const isOther = Boolean(selectedReturnProduct && prod.id !== selectedReturnProduct.id);
      if (isOther) {
        setIsDifferentProduct(true);
        setSelectedExchangeProduct(prod);
      } else {
        setIsDifferentProduct(false);
        setSelectedExchangeProduct(null);
      }

      setExchangeSearch("");
      setExchangeVariantSearch("");
      setExchangeStockFilter("ALL");
      setExchangeColorFilter(
        resolveDefaultColor(prod.variants, variant.color, undefined, selectedReturnVariant?.id)
      );

      const avail = getAvailableStoreStock(variant);
      if (avail <= 0) {
        setSelectedExchangeVariant(null);
        setExchangeNotice(
          `El artículo escaneado (${prod.name} • Talle ${variant.size}${variant.color ? ` • ${variant.color}` : ""}) está agotado en Salón.`
        );
        return;
      }

      setSelectedExchangeVariant(variant);
    },
    [selectedReturnProduct, selectedReturnVariant]
  );

  const handleExchangeSearchChange = (val: string) => {
    setExchangeSearch(val);
    setExchangeNotice(null);
    setErrorMessage(null);

    const q = val.trim();
    if (q.length < 4) return;

    const match = findExactVariantByCode(products, q, false);
    if (match) {
      markBarcodeHandled(q);
      applyExchangeVariantMatch(match.product, match.variant);
    }
  };

  const exchangeSearchResults = useMemo(
    () => searchProductsByQuery(products, exchangeSearch, 10),
    [products, exchangeSearch]
  );

  const handleSelectExchangeProduct = (
    prod: DetailedProductItem,
    preferredColorHint?: string
  ) => {
    const isOther = Boolean(selectedReturnProduct && prod.id !== selectedReturnProduct.id);
    const defaultColor = resolveDefaultColor(
      prod.variants,
      preferredColorHint ?? (!isOther ? selectedReturnVariant?.color : undefined),
      exchangeSearch,
      !isOther ? selectedReturnVariant?.id : undefined
    );

    setIsDifferentProduct(isOther);
    setSelectedExchangeProduct(isOther ? prod : null);
    setSelectedExchangeVariant(null);
    setExchangeSearch("");
    setExchangeVariantSearch("");
    setExchangeStockFilter("ALL");
    setExchangeColorFilter(defaultColor);
    setExchangeNotice(null);
    setErrorMessage(null);
  };

  const handleExchangeSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = exchangeSearch.trim();
    if (!q) return;

    const exact = findExactVariantByCode(products, q, true);
    if (exact) {
      markBarcodeHandled(q);
      applyExchangeVariantMatch(exact.product, exact.variant);
      return;
    }

    if (exchangeSearchResults.length === 1) {
      const only = exchangeSearchResults[0];
      handleSelectExchangeProduct(only.product, only.matchedVariant?.color);
    }
  };

  const handleResetToSameProduct = () => {
    if (!selectedReturnProduct || !selectedReturnVariant) return;
    syncExchangeStepDefaults(selectedReturnProduct, selectedReturnVariant);
    setErrorMessage(null);
  };

  const handleSelectExchangeVariant = (variant: ProductVariantItem) => {
    setSelectedExchangeVariant(variant);
    setExchangeNotice(null);
    setErrorMessage(null);
  };

  // -------------------------------------------------------------
  // ESCUCHADOR USB DEDICADO DENTRO DEL MODAL (ESCAPE + PISTOLA USB)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // Si el foco está dentro de un input/textarea/select, el propio input procesa el texto y Enter
      const targetEl = e.target as HTMLElement | null;
      const tag = targetEl?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        barcodeBufferRef.current = "";
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const scannedCode = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = "";

        if (scannedCode.length < 4) return;
        e.preventDefault();
        e.stopPropagation();

        // Evitar doble disparo si el input recién desmontado ya procesó este mismo código en onChange
        const recent = lastHandledBarcodeRef.current;
        if (
          recent &&
          recent.code === scannedCode.toLowerCase() &&
          now - recent.time < 500
        ) {
          return;
        }

        const match = findExactVariantByCode(products, scannedCode, true);
        if (!match) {
          if (!selectedReturnVariant) {
            setErrorMessage(`No se encontró ningún producto con el código: ${scannedCode}`);
          } else if (operationType === "EXCHANGE") {
            setExchangeNotice(`No se encontró ningún producto con el código: ${scannedCode}`);
          }
          return;
        }

        markBarcodeHandled(scannedCode);
        if (!selectedReturnVariant) {
          applyReturnVariantMatch(match.product, match.variant);
        } else if (operationType === "EXCHANGE") {
          applyExchangeVariantMatch(match.product, match.variant);
        }
        return;
      }

      if (diff > 150) {
        barcodeBufferRef.current = "";
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleModalKeyDown);
    return () => window.removeEventListener("keydown", handleModalKeyDown);
  }, [
    isOpen,
    products,
    selectedReturnVariant,
    operationType,
    handleClose,
    markBarcodeHandled,
    applyReturnVariantMatch,
    applyExchangeVariantMatch,
  ]);

  // -------------------------------------------------------------
  // CÁLCULO EN TIEMPO REAL DE PRECIOS Y BALANCE ECONÓMICO
  // -------------------------------------------------------------
  const returnUnitPrice = useMemo(() => {
    if (!selectedReturnVariant || !selectedReturnProduct) return 0;
    const vPrice =
      selectedReturnVariant.price !== null && selectedReturnVariant.price !== undefined
        ? Number(selectedReturnVariant.price)
        : null;
    return vPrice !== null && vPrice > 0 ? vPrice : Number(selectedReturnProduct.price);
  }, [selectedReturnVariant, selectedReturnProduct]);

  const exchangeUnitPrice = useMemo(() => {
    if (!selectedExchangeVariant || !targetExchangeProduct) return 0;
    const vPrice =
      selectedExchangeVariant.price !== null && selectedExchangeVariant.price !== undefined
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
        setErrorMessage(
          "La prenda devuelta y la prenda a entregar no pueden ser el mismo talle y color."
        );
        return;
      }

      const availableStock = getAvailableStoreStock(selectedExchangeVariant);
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
        exchangeVariantId:
          operationType === "EXCHANGE" ? selectedExchangeVariant?.id : undefined,
        quantity,
        reason: finalReason,
        customerName: customerName.trim() || undefined,
        sellerId: cashierId ?? undefined,
      });

      if (!res.success || !res.data) {
        setErrorMessage(
          res.error || "Ocurrió un error al generar el ticket para Caja."
        );
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
      const msg =
        err instanceof Error
          ? err.message
          : "Error inesperado al conectar con el servidor.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Devolución y cambio de productos"
    >
      <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[500px] max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Encabezado */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
                operationType === "RETURN"
                  ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                  : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              }`}
            >
              {operationType === "RETURN" ? (
                <RotateCcw className="w-5 h-5" />
              ) : (
                <ArrowLeftRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {operationType === "RETURN"
                    ? "Devolución de Producto"
                    : "Devolución / Cambio de Productos"}
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    operationType === "RETURN"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }`}
                >
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
              setIsDifferentProduct(false);
              setExchangeNotice(null);
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
        <div
          className={`bg-slate-100/90 px-6 py-2.5 border-b border-slate-200/80 grid gap-2 shrink-0 select-none ${
            operationType === "RETURN" ? "grid-cols-2" : "grid-cols-3"
          }`}
        >
          <div
            className={`flex items-center gap-2 text-xs font-bold ${
              selectedReturnVariant ? "text-emerald-700" : "text-slate-900"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                selectedReturnVariant
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-white"
              }`}
            >
              {selectedReturnVariant ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
            </span>
            <span className="truncate">Prenda Devuelta</span>
          </div>

          {operationType === "EXCHANGE" ? (
            <>
              <div
                className={`flex items-center gap-2 text-xs font-bold ${
                  selectedExchangeVariant
                    ? "text-emerald-700"
                    : selectedReturnVariant
                    ? "text-slate-900"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    selectedExchangeVariant
                      ? "bg-emerald-600 text-white"
                      : selectedReturnVariant
                      ? "bg-slate-900 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {selectedExchangeVariant ? (
                    <Check className="w-3 h-3 stroke-[3]" />
                  ) : (
                    "2"
                  )}
                </span>
                <span className="truncate">Prenda a Entregar</span>
              </div>
              <div
                className={`flex items-center gap-2 text-xs font-bold ${
                  selectedReturnVariant && selectedExchangeVariant
                    ? "text-emerald-700"
                    : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    selectedReturnVariant && selectedExchangeVariant
                      ? "bg-slate-900 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  3
                </span>
                <span className="truncate">Saldo y Destino Caja</span>
              </div>
            </>
          ) : (
            <div
              className={`flex items-center gap-2 text-xs font-bold ${
                selectedReturnVariant ? "text-emerald-700" : "text-slate-400"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  selectedReturnVariant
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                2
              </span>
              <span className="truncate">Reintegro y Destino Caja</span>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* PASO 1: PRENDA DEVUELTA                                   */}
            {/* ========================================================= */}
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between gap-2 flex-wrap">
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
                      setIsEditingReturnVariant(false);
                      setSelectedExchangeProduct(null);
                      setSelectedExchangeVariant(null);
                      setIsDifferentProduct(false);
                      setExchangeNotice(null);
                      setTimeout(() => returnSearchInputRef.current?.focus(), 40);
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
                      ref={returnSearchInputRef}
                      type="text"
                      value={returnSearch}
                      onChange={(e) => handleReturnSearchChange(e.target.value)}
                      onKeyDown={handleReturnSearchEnter}
                      placeholder="Escanear código de barras de la prenda (USB) o buscar por nombre / SKU..."
                      className="w-full pl-10 pr-9 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                      autoFocus
                    />
                    {returnSearch && (
                      <button
                        type="button"
                        onClick={() => setReturnSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {returnSearchResults.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                      {returnSearchResults.map(({ product: prod, matchedVariant }) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() =>
                            handleSelectReturnProduct(prod, matchedVariant?.color)
                          }
                          className="w-full p-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between gap-2 transition-colors text-xs cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {prod.brand} • SKU: {prod.sku} • {prod.variants.length}{" "}
                              variantes
                            </p>
                            {matchedVariant && (
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-1.5 py-0.2 rounded-md">
                                <Barcode className="w-3 h-3" />
                                {matchedVariant.barcode || matchedVariant.sku} •{" "}
                                {matchedVariant.color ? `${matchedVariant.color} • ` : ""}
                                Talle {matchedVariant.size}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-slate-900 shrink-0">
                            {formatCurrency(prod.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Producto Devuelto
                      </span>
                      <h5 className="text-sm font-bold text-slate-900 truncate">
                        {selectedReturnProduct.name}
                      </h5>
                      <p className="text-xs text-slate-500">
                        {selectedReturnProduct.brand} • SKU: {selectedReturnProduct.sku}
                      </p>
                    </div>
                    <span className="text-sm font-black font-mono text-slate-900 shrink-0">
                      {formatCurrency(
                        selectedReturnVariant ? returnUnitPrice : selectedReturnProduct.price
                      )}
                    </span>
                  </div>

                  {/* Resumen compacto cuando ya se eligió o escaneó la variante devuelta */}
                  {selectedReturnVariant && !isEditingReturnVariant && (
                    <div className="p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-xl flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {selectedReturnVariant.color && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-rose-200 font-bold text-slate-900">
                            <span
                              className={`w-2.5 h-2.5 rounded-full border shrink-0 ${getColorSwatchClass(
                                selectedReturnVariant.color
                              )}`}
                            />
                            <span>{selectedReturnVariant.color}</span>
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-black font-mono">
                          Talle {selectedReturnVariant.size}
                        </span>
                        {selectedReturnVariant.barcode && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Cód: {selectedReturnVariant.barcode}
                          </span>
                        )}
                      </div>

                      {selectedReturnProduct.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setIsEditingReturnVariant(true)}
                          className="text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:underline cursor-pointer"
                        >
                          Cambiar talle / color
                        </button>
                      )}
                    </div>
                  )}

                  {/* Selector filtrado por color y talle (solo si falta elegir o pide cambiar) */}
                  {(!selectedReturnVariant || isEditingReturnVariant) && (
                    <VariantFilterPanel
                      variants={selectedReturnProduct.variants}
                      colorFilter={returnColorFilter}
                      onColorFilterChange={setReturnColorFilter}
                      variantSearch={returnVariantSearch}
                      onVariantSearchChange={setReturnVariantSearch}
                      selectedVariantId={selectedReturnVariant?.id}
                      basePrice={Number(selectedReturnProduct.price)}
                      mode="return"
                      onSelectVariant={handleSelectReturnVariant}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Guía visual cuando aún no se seleccionó la prenda devuelta */}
            {!selectedReturnVariant && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-700">
                      {operationType === "EXCHANGE"
                        ? "Prenda a entregar al cliente"
                        : "Motivo y datos del cliente"}
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
            {/* PASO 2: PRENDA A ENTREGAR (SOLO EN CAMBIO)                */}
            {/* ========================================================= */}
            {selectedReturnVariant && operationType === "EXCHANGE" && (
              <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 animate-in fade-in">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      Nuevo talle o prenda a entregar al cliente (Egreso de Salón)
                    </h4>
                  </div>

                  {isDifferentProduct && (
                    <button
                      type="button"
                      onClick={handleResetToSameProduct}
                      className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Volver al mismo artículo</span>
                    </button>
                  )}
                </div>

                {/* Buscador directo siempre visible para cambiar a otro producto por nombre o código de barras */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={exchangeSearch}
                      onChange={(e) => handleExchangeSearchChange(e.target.value)}
                      onKeyDown={handleExchangeSearchEnter}
                      placeholder="¿Cambiar por otro artículo? Escribí nombre, SKU o escaneá código de barras..."
                      className="w-full pl-10 pr-9 py-2 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                    />
                    {exchangeSearch && (
                      <button
                        type="button"
                        onClick={() => setExchangeSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {exchangeNotice && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{exchangeNotice}</span>
                    </div>
                  )}

                  {exchangeSearchResults.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                      {exchangeSearchResults.map(({ product: prod, matchedVariant }) => {
                        const isSameAsReturnedProd = prod.id === selectedReturnProduct?.id;
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() =>
                              handleSelectExchangeProduct(prod, matchedVariant?.color)
                            }
                            className="w-full p-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between gap-2 transition-colors text-xs cursor-pointer"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 truncate">
                                  {prod.name}
                                </p>
                                {isSameAsReturnedProd && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                                    Mismo artículo
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {prod.brand} • SKU: {prod.sku} • {prod.variants.length}{" "}
                                variantes
                              </p>
                              {matchedVariant && (
                                <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-1.5 py-0.2 rounded-md">
                                  <Barcode className="w-3 h-3" />
                                  {matchedVariant.barcode || matchedVariant.sku} •{" "}
                                  {matchedVariant.color ? `${matchedVariant.color} • ` : ""}
                                  Talle {matchedVariant.size}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-slate-900 shrink-0">
                              {formatCurrency(prod.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {targetExchangeProduct && (
                  <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              isDifferentProduct
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isDifferentProduct
                              ? "Otro artículo seleccionado"
                              : "Mismo artículo (cambio de talle / color)"}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 truncate mt-1">
                          {targetExchangeProduct.name}
                        </h5>
                        <p className="text-xs text-slate-500">
                          {targetExchangeProduct.brand} • SKU: {targetExchangeProduct.sku}
                        </p>
                      </div>
                      <span className="text-sm font-black font-mono text-slate-900 shrink-0">
                        {formatCurrency(
                          selectedExchangeVariant
                            ? exchangeUnitPrice
                            : targetExchangeProduct.price
                        )}
                      </span>
                    </div>

                    <VariantFilterPanel
                      variants={targetExchangeProduct.variants}
                      colorFilter={exchangeColorFilter}
                      onColorFilterChange={setExchangeColorFilter}
                      variantSearch={exchangeVariantSearch}
                      onVariantSearchChange={setExchangeVariantSearch}
                      stockFilter={exchangeStockFilter}
                      onStockFilterChange={setExchangeStockFilter}
                      preferredColor={
                        !isDifferentProduct ? selectedReturnVariant.color : undefined
                      }
                      excludedVariantId={selectedReturnVariant.id}
                      selectedVariantId={selectedExchangeVariant?.id}
                      basePrice={Number(targetExchangeProduct.price)}
                      mode="exchange"
                      onSelectVariant={handleSelectExchangeVariant}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* PASO 3 (o 2): MOTIVO DEL TRÁMITE                          */}
            {/* ========================================================= */}
            {selectedReturnVariant &&
              (operationType === "RETURN" || selectedExchangeVariant) && (
                <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center font-mono">
                      {operationType === "RETURN" ? "2" : "3"}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {operationType === "RETURN"
                        ? "Motivo de la devolución"
                        : "Motivo del cambio"}
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                      placeholder={
                        operationType === "RETURN"
                          ? "Escribí el motivo de la devolución..."
                          : "Escribí el motivo del cambio..."
                      }
                      className="w-full px-3.5 py-2 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      autoFocus
                    />
                  )}
                </div>
              )}

            {/* ========================================================= */}
            {/* PASO 4 (o 3): LIQUIDACIÓN ECONÓMICA Y DESTINO A CAJA      */}
            {/* ========================================================= */}
            {selectedReturnVariant &&
              (operationType === "RETURN" || selectedExchangeVariant) && (
                <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                          operationType === "RETURN"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.preventDefault();
                        }}
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
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Prenda Devuelta
                          </span>
                          <p className="font-bold text-slate-800 truncate">
                            {selectedReturnProduct?.name}
                          </p>
                          <p className="text-rose-700 font-mono font-black text-sm">
                            -{formatCurrency(totalReturn)}
                          </p>
                        </div>

                        <div className="text-center py-1 sm:border-x border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Prenda Entregada
                          </span>
                          <p className="font-bold text-slate-800 truncate">
                            {targetExchangeProduct?.name}
                          </p>
                          <p className="text-emerald-700 font-mono font-black text-sm">
                            +{formatCurrency(totalExchange)}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Saldo Neto
                          </span>
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

                      {isSamePrice && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3] mt-0.5" />
                          <div className="leading-relaxed">
                            <strong>Cambio mano a mano ($ 0,00):</strong> Las dos prendas
                            tienen el mismo valor de lista. Se enviará el ticket a la Caja
                            Mostrador sin saldo a abonar. En Caja se confirmará la entrega del
                            nuevo talle y se emitirá el comprobante oficial.
                          </div>
                        </div>
                      )}

                      {isMoreExpensive && (
                        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900 text-xs">
                          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong>
                              Diferencia a cobrar en Caja ({formatCurrency(balance)}):
                            </strong>{" "}
                            El ticket se enviará a la lista de espera de Caja Mostrador. El
                            cliente abonará la diferencia allí mediante el medio de pago que
                            elija (Efectivo, Tarjeta Débito/Crédito, QR o Transferencia).
                          </div>
                        </div>
                      )}

                      {isCheaper && (
                        <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl flex items-start gap-2.5 text-purple-900 text-xs">
                          <RotateCcw className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong>
                              Saldo a favor del cliente ({formatCurrency(absDifference)}):
                            </strong>{" "}
                            La prenda nueva tiene un valor menor. El ticket pasará a la Caja
                            Mostrador indicando el crédito a favor para que el cajero resuelva
                            el saldo según la política del local.
                          </div>
                        </div>
                      )}

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
                        <Info className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          Al presionar <strong>Pasar Ticket a Caja</strong>, la prenda a
                          entregar quedará reservada y la operación se procesará en Caja sin
                          emitir tickets definitivos en salón.
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-rose-500 block">
                            Prenda a Reingresar al Stock
                          </span>
                          <p className="font-bold text-slate-900 text-sm">
                            {selectedReturnProduct?.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            Talle {selectedReturnVariant.size}{" "}
                            {selectedReturnVariant.color
                              ? `• ${selectedReturnVariant.color}`
                              : ""}{" "}
                            x{quantity} un.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-rose-500 block">
                            Monto a Reintegrar
                          </span>
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
                          El cliente no se lleva ningún artículo a cambio. Se enviará el
                          ticket de devolución a Caja para procesar el reintegro de{" "}
                          <strong>{formatCurrency(totalReturn)}</strong> (Efectivo /
                          Transferencia o emisión de Vale de Compra). La prenda devuelta se
                          reincorporará automáticamente al stock físico de Saavedra 241 cuando
                          Caja complete la operación.
                        </span>
                      </div>
                    </div>
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
                !selectedReturnVariant ||
                (operationType === "EXCHANGE" && !selectedExchangeVariant)
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
                    {operationType === "RETURN"
                      ? "Pasando devolución a Caja..."
                      : "Pasando ticket a Caja..."}
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
