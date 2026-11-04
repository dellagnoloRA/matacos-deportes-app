"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Barcode,
  X,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Store,
  Boxes,
  Clock,
  Sparkles,
  Plus,
  RotateCcw,
  Tag,
  Layers,
  Check,
  Filter,
  Palette,
  Ruler,
  SlidersHorizontal,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { getColorSwatchClass } from "./PosProductCard";

interface PriceStockCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: DetailedProductItem[];
  onAddToCart?: (product: DetailedProductItem, variant: ProductVariantItem) => void;
}

type StockFilterType = "all" | "store_only" | "any_stock" | "warehouse_only" | "out_of_stock";

export function PriceStockCheckerModal({
  isOpen,
  onClose,
  products,
  onAddToCart,
}: PriceStockCheckerModalProps) {
  const [searchInput, setSearchInput] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<DetailedProductItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantItem | null>(null);
  const [searchFeedback, setSearchFeedback] = useState<{
    type: "not_found" | "added";
    message: string;
  } | null>(null);
  const [multipleResults, setMultipleResults] = useState<
    Array<{ product: DetailedProductItem; variant: ProductVariantItem }>
  >([]);
  const [multipleResultsOnlyInStock, setMultipleResultsOnlyInStock] = useState<boolean>(false);

  // Filtros internos para variantes del producto seleccionado (clave para productos con 200+ variantes como Crocs)
  const [variantColorFilter, setVariantColorFilter] = useState<string>("");
  const [variantSizeFilter, setVariantSizeFilter] = useState<string>("");
  const [variantStockFilter, setVariantStockFilter] = useState<StockFilterType>("all");

  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Auto-focus al abrir el modal o limpiar
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Resetear estado al cerrar
      setSearchInput("");
      setSelectedProduct(null);
      setSelectedVariant(null);
      setSearchFeedback(null);
      setMultipleResults([]);
      setMultipleResultsOnlyInStock(false);
      setVariantColorFilter("");
      setVariantSizeFilter("");
      setVariantStockFilter("all");
    }
  }, [isOpen]);

  // Manejo de búsqueda por código o texto multi-palabra (ej: "crocs negro 38")
  const executeLookup = useCallback(
    (query: string) => {
      const cleaned = query.trim();
      if (!cleaned) return;

      setSearchFeedback(null);
      setMultipleResults([]);

      const lower = cleaned.toLowerCase();

      // 1. Coincidencia exacta por código de barras de variante
      for (const prod of products) {
        for (const variant of prod.variants) {
          if (variant.barcode === cleaned) {
            setSelectedProduct(prod);
            setSelectedVariant(variant);
            setVariantColorFilter(variant.color || "");
            setVariantSizeFilter("");
            setVariantStockFilter("all");
            inputRef.current?.select();
            return;
          }
        }
      }

      // 2. Coincidencia exacta por SKU de variante
      for (const prod of products) {
        for (const variant of prod.variants) {
          if (variant.sku && variant.sku.toLowerCase() === lower) {
            setSelectedProduct(prod);
            setSelectedVariant(variant);
            setVariantColorFilter(variant.color || "");
            setVariantSizeFilter("");
            setVariantStockFilter("all");
            inputRef.current?.select();
            return;
          }
        }
      }

      // 3. Coincidencia exacta por código de barras del producto cabecera
      for (const prod of products) {
        if (prod.barcode === cleaned) {
          setSelectedProduct(prod);
          setSelectedVariant(prod.variants[0] || null);
          setVariantColorFilter("");
          setVariantSizeFilter("");
          setVariantStockFilter("all");
          inputRef.current?.select();
          return;
        }
      }

      // 4. Coincidencia por SKU o Código de Modelo del producto cabecera
      for (const prod of products) {
        if (
          prod.sku.toLowerCase() === lower ||
          (prod.modelCode && prod.modelCode.toLowerCase() === lower)
        ) {
          setSelectedProduct(prod);
          setSelectedVariant(prod.variants[0] || null);
          setVariantColorFilter("");
          setVariantSizeFilter("");
          setVariantStockFilter("all");
          inputRef.current?.select();
          return;
        }
      }

      // 5. Búsqueda inteligente multi-palabra (ej: "crocs negro 38" o "classic navy")
      const queryTokens = lower.split(/\s+/).filter(Boolean);
      const matches: Array<{ product: DetailedProductItem; variant: ProductVariantItem }> = [];

      for (const prod of products) {
        const prodTokens = [
          prod.name.toLowerCase(),
          prod.brand.toLowerCase(),
          prod.discipline.toLowerCase(),
          prod.category.toLowerCase(),
          prod.modelCode?.toLowerCase() || "",
          prod.sku.toLowerCase(),
        ];

        for (const variant of prod.variants) {
          const varTokens = [
            variant.color.toLowerCase(),
            variant.size.toLowerCase(),
            variant.barcode.toLowerCase(),
            variant.sku?.toLowerCase() || "",
          ];

          const combinedTokens = [...prodTokens, ...varTokens];

          // Todas las palabras escritas deben estar presentes en algún atributo del producto o variante
          const allTokensMatch = queryTokens.every((word) =>
            combinedTokens.some((tok) => tok.includes(word))
          );

          if (allTokensMatch) {
            matches.push({ product: prod, variant });
            if (matches.length >= 40) break;
          }
        }
        if (matches.length >= 40) break;
      }

      if (matches.length === 1) {
        setSelectedProduct(matches[0].product);
        setSelectedVariant(matches[0].variant);
        setVariantColorFilter(matches[0].variant.color || "");
        setVariantSizeFilter("");
        setVariantStockFilter("all");
        inputRef.current?.select();
        return;
      }

      if (matches.length > 1) {
        // Si todos los resultados corresponden al MISMO producto (ej: buscaron "crocs classic")
        const firstProdId = matches[0].product.id;
        const allSameProduct = matches.every((m) => m.product.id === firstProdId);

        if (allSameProduct) {
          setSelectedProduct(matches[0].product);
          // Tomar la primera variante o la primera con stock
          const variantWithStock =
            matches.find((m) => m.variant.stockStore > 0)?.variant || matches[0].variant;
          setSelectedVariant(variantWithStock);
          setVariantColorFilter("");
          setVariantSizeFilter("");
          setVariantStockFilter("all");
          inputRef.current?.select();
          return;
        }

        setMultipleResults(matches);
        setSelectedProduct(null);
        setSelectedVariant(null);
        return;
      }

      // No se encontró nada
      setSelectedProduct(null);
      setSelectedVariant(null);
      setSearchFeedback({
        type: "not_found",
        message: `No se encontró ningún artículo registrado con el código o término "${cleaned}".`,
      });
      inputRef.current?.select();
    },
    [products]
  );

  // Escuchador para lector de código de barras USB y teclas rápidas mientras el modal está abierto
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC para cerrar
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Atajo F3 para cerrar
      if (e.key === "F3") {
        e.preventDefault();
        onClose();
        return;
      }

      // Captura de ráfaga de escáner USB aunque el foco se haya desviado
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 4) {
          const scannedCode = barcodeBufferRef.current.trim();
          barcodeBufferRef.current = "";
          setSearchInput(scannedCode);
          executeLookup(scannedCode);
          return;
        }
        barcodeBufferRef.current = "";
        return;
      }

      if (diff > 70) {
        barcodeBufferRef.current = "";
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, executeLookup]);

  // Manejo de envío manual por formulario
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(searchInput);
  };

  // Cálculo de precio efectivo y stock de la variante activa
  const effectivePrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (
      selectedVariant &&
      selectedVariant.price !== null &&
      selectedVariant.price !== undefined &&
      selectedVariant.price > 0
    ) {
      return selectedVariant.price;
    }
    return selectedProduct.price || 0;
  }, [selectedProduct, selectedVariant]);

  const stockStore = selectedVariant?.stockStore ?? 0;
  const stockWarehouse = selectedVariant?.stockWarehouse ?? 0;
  const stockReserved = selectedVariant?.stockReserved ?? 0;
  const availableNet = Math.max(0, stockStore - stockReserved);

  // Imagen activa según color o principal
  const activeImageUrl = useMemo(() => {
    if (!selectedProduct) return null;
    if (selectedProduct.images && selectedProduct.images.length > 0 && selectedVariant?.color) {
      const match = selectedProduct.images.find(
        (img) => (img.color || "").toLowerCase().trim() === selectedVariant.color.toLowerCase().trim()
      );
      if (match?.url) return match.url;
    }
    return selectedProduct.imageUrl || selectedProduct.images?.[0]?.url || null;
  }, [selectedProduct, selectedVariant]);

  // Colores únicos del producto seleccionado
  const availableColors = useMemo(() => {
    if (!selectedProduct) return [];
    const set = new Set<string>();
    for (const v of selectedProduct.variants) {
      if (v.color?.trim()) set.add(v.color.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [selectedProduct]);

  // Talles únicos del producto seleccionado (prioriza talles del color filtrado si hay color activo)
  const availableSizes = useMemo(() => {
    if (!selectedProduct) return [];
    const set = new Set<string>();
    const colorLower = variantColorFilter.trim().toLowerCase();

    for (const v of selectedProduct.variants) {
      if (colorLower && v.color && !v.color.toLowerCase().includes(colorLower)) {
        continue;
      }
      if (v.size?.trim()) set.add(v.size.trim());
    }
    return Array.from(set);
  }, [selectedProduct, variantColorFilter]);

  // Estadísticas de stock para las opciones de filtro rápido
  const stockCounts = useMemo(() => {
    if (!selectedProduct) return { all: 0, store: 0, warehouse: 0, any: 0, out: 0 };
    let store = 0;
    let warehouse = 0;
    let any = 0;
    let out = 0;
    for (const v of selectedProduct.variants) {
      const net = Math.max(0, v.stockStore - (v.stockReserved || 0));
      const hasStore = net > 0;
      const hasWarehouse = (v.stockWarehouse || 0) > 0;
      if (hasStore) store++;
      if (hasWarehouse) warehouse++;
      if (hasStore || hasWarehouse) any++;
      if (!hasStore && !hasWarehouse) out++;
    }
    return {
      all: selectedProduct.variants.length,
      store,
      warehouse,
      any,
      out,
    };
  }, [selectedProduct]);

  // Variantes filtradas según Color, Talle y Stock disponible
  const filteredVariants = useMemo(() => {
    if (!selectedProduct) return [];
    const colorTerm = variantColorFilter.trim().toLowerCase();
    const sizeTerm = variantSizeFilter.trim().toLowerCase();

    return selectedProduct.variants.filter((v) => {
      // 1. Filtro de Color
      if (colorTerm && (!v.color || !v.color.toLowerCase().includes(colorTerm))) {
        return false;
      }

      // 2. Filtro de Talle
      if (sizeTerm && (!v.size || !v.size.toLowerCase().includes(sizeTerm))) {
        return false;
      }

      // 3. Filtro de Stock
      const netStore = Math.max(0, v.stockStore - (v.stockReserved || 0));
      const hasStore = netStore > 0;
      const hasWarehouse = (v.stockWarehouse || 0) > 0;

      if (variantStockFilter === "store_only") {
        if (!hasStore) return false;
      } else if (variantStockFilter === "warehouse_only") {
        if (!hasWarehouse) return false;
      } else if (variantStockFilter === "any_stock") {
        if (!hasStore && !hasWarehouse) return false;
      } else if (variantStockFilter === "out_of_stock") {
        if (hasStore || hasWarehouse) return false;
      }

      return true;
    });
  }, [selectedProduct, variantColorFilter, variantSizeFilter, variantStockFilter]);

  const hasActiveVariantFilters =
    variantColorFilter.trim() !== "" ||
    variantSizeFilter.trim() !== "" ||
    variantStockFilter !== "all";

  const handleClearVariantFilters = () => {
    setVariantColorFilter("");
    setVariantSizeFilter("");
    setVariantStockFilter("all");
  };

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedVariant || !onAddToCart) return;
    if (availableNet <= 0) return;

    onAddToCart(selectedProduct, selectedVariant);
    const colorDetail = selectedVariant.color ? ` - ${selectedVariant.color}` : "";
    setSearchFeedback({
      type: "added",
      message: `"${selectedProduct.name}${colorDetail} (${selectedVariant.size})" agregado a la Preventa.`,
    });

    setTimeout(() => {
      setSearchFeedback((prev) => (prev?.type === "added" ? null : prev));
    }, 3000);

    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleResetSearch = () => {
    setSearchInput("");
    setSelectedProduct(null);
    setSelectedVariant(null);
    setSearchFeedback(null);
    setMultipleResults([]);
    setMultipleResultsOnlyInStock(false);
    handleClearVariantFilters();
    inputRef.current?.focus();
  };

  // Filtrado de la lista de múltiples resultados si el usuario activa "Solo con stock"
  const displayedMultipleResults = useMemo(() => {
    if (!multipleResultsOnlyInStock) return multipleResults;
    return multipleResults.filter(
      (m) =>
        Math.max(0, m.variant.stockStore - (m.variant.stockReserved || 0)) > 0 ||
        (m.variant.stockWarehouse || 0) > 0
    );
  }, [multipleResults, multipleResultsOnlyInStock]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-[#06241d] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#094d3f] border border-[#00D615]/40 flex items-center justify-center text-[#00D615] shadow-xs shrink-0">
              <Barcode className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Verificador de Precios y Stock
                </h2>
                <span className="text-[10px] bg-[#00D615]/20 text-[#00D615] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#00D615]/30">
                  Modo Consulta
                </span>
              </div>
              <p className="text-xs text-emerald-200/70 mt-0.5">
                Escanee o busque artículos con filtros avanzados de color, talle y disponibilidad.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] text-emerald-300/80 bg-white/10 px-2 py-1 rounded-lg font-mono">
              ESC para salir
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-emerald-200/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Cerrar (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Entrada / Escaneo continuo */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200/80 shrink-0">
          <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Escanee código de barras, SKU o escriba 'crocs negro 38'..."
                className="w-full pl-11 pr-10 py-3 bg-white text-sm text-slate-900 rounded-2xl border-2 border-emerald-500/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all placeholder:text-slate-400 outline-none font-medium shadow-xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full"
                  title="Limpiar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-98"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Consultar</span>
            </button>
          </form>

          {/* Feedback de resultado o alertas */}
          {searchFeedback && (
            <div
              className={`mt-2.5 p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                searchFeedback.type === "added"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {searchFeedback.type === "added" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{searchFeedback.message}</span>
            </div>
          )}
        </div>

        {/* Contenido Principal con Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Caso 1: Múltiples Coincidencias Predictivas */}
          {multipleResults.length > 0 && !selectedProduct && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Coincidencias ({displayedMultipleResults.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setMultipleResultsOnlyInStock((prev) => !prev)}
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
                      multipleResultsOnlyInStock
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Filter className="w-3 h-3 text-emerald-600" />
                    <span>Solo con stock</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-400">
                  Seleccione el artículo para abrirlo:
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-96 overflow-y-auto">
                {displayedMultipleResults.map((item, idx) => {
                  const itemStore = Math.max(0, item.variant.stockStore - (item.variant.stockReserved || 0));
                  return (
                    <button
                      key={`${item.product.id}-${item.variant.id || idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(item.product);
                        setSelectedVariant(item.variant);
                        setVariantColorFilter(item.variant.color || "");
                        setVariantSizeFilter("");
                        setVariantStockFilter("all");
                        setMultipleResults([]);
                        inputRef.current?.select();
                      }}
                      className="w-full p-3.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                            {item.product.name}
                          </span>
                          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                            Talle {item.variant.size}
                          </span>
                          {item.variant.color && (
                            <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full border ${getColorSwatchClass(
                                  item.variant.color
                                )}`}
                              />
                              {item.variant.color}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="font-semibold text-slate-600">{item.product.brand}</span>
                          <span>•</span>
                          <span className="font-mono">Cód: {item.variant.barcode}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-900 font-mono">
                          {formatCurrency(
                            item.variant.price && item.variant.price > 0
                              ? item.variant.price
                              : item.product.price
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-bold ${
                            itemStore > 0 ? "text-emerald-700" : "text-slate-400"
                          }`}
                        >
                          Salón: {itemStore} un.
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Caso 2: Producto Encontrado */}
          {selectedProduct && selectedVariant ? (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Encabezado del Producto */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                {activeImageUrl ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-1 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0">
                    <Package className="w-8 h-8 stroke-[1.8]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                      {selectedProduct.brand}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-lg font-medium">
                      {selectedProduct.discipline}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-lg font-medium">
                      {selectedProduct.category}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 leading-snug">
                    {selectedProduct.name}
                  </h3>

                  {/* Variante Activa: Color y Talle destacados debajo del nombre del producto */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {selectedVariant.color ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-emerald-500/30 shadow-xs">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0 ${getColorSwatchClass(
                            selectedVariant.color
                          )}`}
                        />
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Color:
                          </span>
                          <span className="text-xs sm:text-sm font-black text-slate-950 tracking-tight">
                            {selectedVariant.color}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Color:
                        </span>
                        <span className="italic">Sin especificar</span>
                      </div>
                    )}

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        Talle:
                      </span>
                      <span className="text-xs sm:text-sm font-black font-mono">
                        {selectedVariant.size}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 font-mono">
                    {selectedVariant.barcode && (
                      <span>
                        <strong className="text-slate-700 font-sans">Cód. Barra:</strong>{" "}
                        {selectedVariant.barcode}
                      </span>
                    )}
                    {(selectedVariant.sku || selectedProduct.sku) && (
                      <span>
                        <strong className="text-slate-700 font-sans">SKU:</strong>{" "}
                        {selectedVariant.sku || selectedProduct.sku}
                      </span>
                    )}
                    {selectedProduct.modelCode && (
                      <span>
                        <strong className="text-slate-700 font-sans">Modelo:</strong>{" "}
                        {selectedProduct.modelCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloque Destacado: PRECIO Y ESTADO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tarjeta de Precio */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-[#06241d] text-white shadow-md flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Precio al Público
                  </span>
                  <div className="my-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
                      {formatCurrency(effectivePrice)}
                    </div>
                    <span className="text-[11px] text-emerald-200/80">
                      Precio final para mostrador / salón
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-300/70 pt-1 border-t border-emerald-800/80 flex items-center justify-between font-mono">
                    <span>Pesos Argentinos (ARS)</span>
                    <span>IVA incluido</span>
                  </div>
                </div>

                {/* Tarjeta de Disponibilidad Inmediata */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Disponibilidad en Salón
                  </span>

                  <div className="my-2 flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-black font-mono ${
                        availableNet > 0 ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {availableNet}
                    </span>
                    <span className="text-xs font-bold text-slate-600 uppercase">
                      {availableNet === 1 ? "Unidad libre" : "Unidades libres"}
                    </span>
                  </div>

                  <div>
                    {availableNet > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Disponible para entrega inmediata
                      </span>
                    ) : stockWarehouse > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl">
                        <Boxes className="w-3.5 h-3.5" /> Sin stock en salón (hay en depósito)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-xl">
                        <AlertCircle className="w-3.5 h-3.5" /> Agotado en todos los depósitos
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Desglose de Stock Físico (Salón, Depósito, Reservado) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Desglose de Inventario para Talle {selectedVariant.size}
                  {selectedVariant.color ? ` • ${selectedVariant.color}` : ""}
                </span>

                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Salón (Saavedra)</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                      {stockStore}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Boxes className="w-3.5 h-3.5 text-sky-600" />
                      <span>Depósito Central</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                      {stockWarehouse}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reservado Preventa</span>
                    </div>
                    <div className="text-lg font-black text-amber-700 mt-1 font-mono">
                      {stockReserved}
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* PANEL DE FILTRADO AVANZADO DE VARIANTES (COLORES, TALLES, STOCK) */}
              {/* ============================================================ */}
              {selectedProduct.variants.length > 1 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Explorador de Variantes ({selectedProduct.variants.length} en catálogo)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">
                        Mostrando{" "}
                        <strong className="text-slate-900 font-mono">
                          {filteredVariants.length}
                        </strong>{" "}
                        de {selectedProduct.variants.length}
                      </span>
                      {hasActiveVariantFilters && (
                        <button
                          type="button"
                          onClick={handleClearVariantFilters}
                          className="text-[11px] text-rose-700 hover:text-rose-900 font-bold bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Limpiar filtros</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1. Filtro por Estado de Stock */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                      Filtrar por Stock:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVariantStockFilter("all")}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                          variantStockFilter === "all"
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Todos ({stockCounts.all})
                      </button>

                      <button
                        type="button"
                        onClick={() => setVariantStockFilter("store_only")}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          variantStockFilter === "store_only"
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                            : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>En Salón &gt; 0 ({stockCounts.store})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVariantStockFilter("any_stock")}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          variantStockFilter === "any_stock"
                            ? "bg-sky-700 text-white border-sky-700 shadow-2xs"
                            : "bg-white text-sky-800 border-sky-200 hover:bg-sky-50"
                        }`}
                      >
                        <Boxes className="w-3 h-3" />
                        <span>Con Stock Salón/Dep ({stockCounts.any})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setVariantStockFilter("warehouse_only")}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                          variantStockFilter === "warehouse_only"
                            ? "bg-indigo-700 text-white border-indigo-700 shadow-2xs"
                            : "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50"
                        }`}
                      >
                        Solo Depósito ({stockCounts.warehouse})
                      </button>

                      <button
                        type="button"
                        onClick={() => setVariantStockFilter("out_of_stock")}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                          variantStockFilter === "out_of_stock"
                            ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                            : "bg-white text-rose-800 border-rose-200 hover:bg-rose-50"
                        }`}
                      >
                        Sin Stock ({stockCounts.out})
                      </button>
                    </div>
                  </div>

                  {/* 2. Filtros de Texto / Búsqueda para Color y Talle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {/* Búsqueda de Color */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <Palette className="w-3 h-3 text-emerald-600" />
                          <span>Color ({availableColors.length}):</span>
                        </label>
                        {variantColorFilter && (
                          <button
                            type="button"
                            onClick={() => setVariantColorFilter("")}
                            className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold"
                          >
                            Quitar color
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={variantColorFilter}
                          onChange={(e) => setVariantColorFilter(e.target.value)}
                          placeholder="Escribir color (ej: Negro, Navy, Rosa)..."
                          className="w-full pl-8 pr-7 py-2 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none placeholder:text-slate-400 font-medium"
                        />
                        <Palette className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        {variantColorFilter && (
                          <button
                            type="button"
                            onClick={() => setVariantColorFilter("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Búsqueda de Talle */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-emerald-600" />
                          <span>Talle ({availableSizes.length}):</span>
                        </label>
                        {variantSizeFilter && (
                          <button
                            type="button"
                            onClick={() => setVariantSizeFilter("")}
                            className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold"
                          >
                            Quitar talle
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={variantSizeFilter}
                          onChange={(e) => setVariantSizeFilter(e.target.value)}
                          placeholder="Escribir talle (ej: 38, 41, M8/W10)..."
                          className="w-full pl-8 pr-7 py-2 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none placeholder:text-slate-400 font-medium"
                        />
                        <Ruler className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        {variantSizeFilter && (
                          <button
                            type="button"
                            onClick={() => setVariantSizeFilter("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chips de Colores Disponibles (Acceso Rápido) */}
                  {availableColors.length > 0 && availableColors.length <= 16 && (
                    <div className="pt-0.5">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                        <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                          Colores:
                        </span>
                        {availableColors.map((colorName) => {
                          const isSelected =
                            variantColorFilter.toLowerCase() === colorName.toLowerCase();
                          return (
                            <button
                              key={colorName}
                              type="button"
                              onClick={() =>
                                setVariantColorFilter(isSelected ? "" : colorName)
                              }
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 shrink-0 transition-all ${
                                isSelected
                                  ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs font-bold"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full border shrink-0 ${getColorSwatchClass(
                                  colorName
                                )}`}
                              />
                              <span>{colorName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Grilla de Variantes Filtradas */}
                  {filteredVariants.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                      {filteredVariants.map((v, i) => {
                        const isCurrent =
                          (v.id && v.id === selectedVariant.id) ||
                          (v.barcode === selectedVariant.barcode && v.size === selectedVariant.size);
                        const vAvailable = Math.max(0, v.stockStore - (v.stockReserved || 0));

                        return (
                          <button
                            key={`${v.id || v.barcode || i}`}
                            type="button"
                            onClick={() => {
                              setSelectedVariant(v);
                              setSearchInput(v.barcode || v.sku || searchInput);
                              inputRef.current?.select();
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isCurrent
                                ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xs"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900">
                                Talle {v.size}
                              </span>
                              {v.color && (
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full border shrink-0 ${getColorSwatchClass(
                                      v.color
                                    )}`}
                                  />
                                  <span className="text-[10px] text-slate-600 truncate max-w-[70px] font-medium">
                                    {v.color}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-2 text-[11px]">
                              <span className="font-mono text-slate-500">
                                Salón:{" "}
                                <strong
                                  className={vAvailable > 0 ? "text-emerald-700" : "text-rose-600"}
                                >
                                  {vAvailable}
                                </strong>
                              </span>
                              {v.stockWarehouse > 0 && (
                                <span className="text-[10px] text-sky-700 bg-sky-50 px-1 rounded font-medium">
                                  Dep: {v.stockWarehouse}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2 bg-white rounded-xl border border-dashed border-slate-200 p-4">
                      <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                      <p className="text-xs text-slate-600 font-semibold">
                        No se encontraron variantes que coincidan con los filtros aplicados.
                      </p>
                      <button
                        type="button"
                        onClick={handleClearVariantFilters}
                        className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        Restablecer filtros
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Caso 3: Estado Inicial / Esperando Escaneo */
            <div className="py-10 sm:py-14 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-inner animate-pulse">
                <Barcode className="w-8 h-8 stroke-[2]" />
              </div>

              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Esperando lectura del código de barras...
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Acerque la etiqueta al lector láser USB, o tipee el nombre, color y talle (ej. <span className="font-mono font-bold text-slate-700">"crocs negro 38"</span>).
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600">
                  F3: Abrir/Cerrar
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600">
                  ENTER: Buscar
                </span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600">
                  ESC: Salir
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Acciones Inferior */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetSearch}
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Escanear Otro</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
            >
              Cerrar (ESC)
            </button>
          </div>

          {selectedProduct && selectedVariant && onAddToCart && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={availableNet <= 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>
                Agregar a la Preventa ({selectedVariant.color ? `${selectedVariant.color} • ` : ""}Talle {selectedVariant.size})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
