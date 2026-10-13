"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { PosCartItem } from "./PosView";
import { Check, Search, ChevronDown, X, SlidersHorizontal } from "lucide-react";

/**
 * Retorna las clases de Tailwind correspondientes a la muestra visual (swatch) del color
 */
export function getColorSwatchClass(colorName: string): string {
  const c = (colorName || "").toLowerCase().trim();
  if (c.includes("negro") || c.includes("black")) return "bg-slate-900 border-slate-700";
  if (c.includes("blanco") || c.includes("white")) return "bg-white border-slate-300 ring-1 ring-slate-200";
  if (c.includes("navy") || c.includes("marino")) return "bg-blue-900 border-blue-700";
  if (c.includes("celeste")) return "bg-sky-400 border-sky-300";
  if (c.includes("azul") || c.includes("francia") || c.includes("blue")) return "bg-blue-600 border-blue-400";
  if (c.includes("rojo") || c.includes("red")) return "bg-red-600 border-red-400";
  if (c.includes("bordo") || c.includes("vino")) return "bg-rose-900 border-rose-700";
  if (c.includes("rosa") || c.includes("rosado") || c.includes("pink")) return "bg-pink-400 border-pink-300";
  if (c.includes("verde") || c.includes("green")) return "bg-emerald-600 border-emerald-400";
  if (c.includes("amarillo") || c.includes("yellow")) return "bg-yellow-400 border-yellow-300";
  if (c.includes("naranja") || c.includes("orange")) return "bg-orange-500 border-orange-400";
  if (c.includes("lila") || c.includes("violeta") || c.includes("purple")) return "bg-purple-500 border-purple-400";
  if (c.includes("gris") || c.includes("grey") || c.includes("silver") || c.includes("humo")) return "bg-slate-400 border-slate-300";
  if (c.includes("dorado") || c.includes("oro") || c.includes("gold")) return "bg-amber-400 border-amber-300";
  if (c.includes("petroleo")) return "bg-teal-700 border-teal-500";
  if (c.includes("mostaza") || c.includes("caramelo") || c.includes("camel")) return "bg-amber-600 border-amber-500";
  return "bg-slate-400 border-slate-300";
}

export interface PosProductCardProps {
  product: DetailedProductItem;
  cart: PosCartItem[];
  searchQuery: string;
  onAddVariant: (product: DetailedProductItem, variant: ProductVariantItem) => void;
}

/**
 * Selector Predictivo de Colores (Combobox flotante con autocompletado y chips de acceso rápido)
 * Reemplaza por completo las barras deslizables horizontales incómodas.
 */
interface PredictiveColorComboboxProps {
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  variants: ProductVariantItem[];
  compact?: boolean;
}

function PredictiveColorCombobox({
  colors,
  selectedColor,
  onSelectColor,
  variants,
  compact = false,
}: PredictiveColorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [colorFilterText, setColorFilterText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mapa de stock disponible en salón por color
  const colorStockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of colors) {
      const stock = variants
        .filter((v) => (v.color?.trim() || "").toLowerCase() === c.toLowerCase())
        .reduce(
          (sum, v) => sum + Math.max(0, v.stockStore - (v.stockReserved || 0)),
          0
        );
      map.set(c, stock);
    }
    return map;
  }, [colors, variants]);

  // Colores ordenados por mayor stock en salón para destacar los más disponibles
  const sortedColors = useMemo(() => {
    return [...colors].sort(
      (a, b) => (colorStockMap.get(b) || 0) - (colorStockMap.get(a) || 0)
    );
  }, [colors, colorStockMap]);

  // Top 3 colores con mayor stock para chips de 1 solo clic (sin deslizamiento)
  const topQuickColors = useMemo(() => {
    return sortedColors.slice(0, 3);
  }, [sortedColors]);

  // Colores filtrados por texto predictivo
  const matchingColors = useMemo(() => {
    const q = colorFilterText.trim().toLowerCase();
    if (!q) return sortedColors;
    return sortedColors.filter((c) => c.toLowerCase().includes(q));
  }, [sortedColors, colorFilterText]);

  // Cerrar desplegable al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Autoenfoque al abrir el buscador predictivo
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setHighlightedIndex(0);
    } else {
      setColorFilterText("");
    }
  }, [isOpen]);

  // Navegación por teclado (Flechas, Enter para seleccionar)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < matchingColors.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : Math.max(0, matchingColors.length - 1)
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (matchingColors[highlightedIndex]) {
        onSelectColor(matchingColors[highlightedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {/* Botón Disparador / Selector de Color */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
          <span className="shrink-0">Color:</span>
          <span className="text-slate-900 font-extrabold flex items-center gap-1 min-w-0">
            <span
              className={`w-2 h-2 rounded-full border shrink-0 ${getColorSwatchClass(
                selectedColor
              )}`}
            />
            <span className="truncate max-w-[120px]" title={selectedColor}>
              {selectedColor || "Seleccionar"}
            </span>
          </span>
        </span>

        {/* Botón que despliega el Buscador Predictivo */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
            isOpen
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
          }`}
          title="Buscar color por texto predictivo"
        >
          <Search className="w-3 h-3 text-slate-400" />
          <span>Buscar color</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Popover Flotante de Búsqueda Predictiva de Color */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150 min-w-[220px]">
          {/* Input Predictivo con Icono de Búsqueda y Botón Limpiar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={colorFilterText}
              onChange={(e) => {
                setColorFilterText(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe color: ej. negro, celeste..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-900 font-medium rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
            {colorFilterText && (
              <button
                type="button"
                onClick={() => setColorFilterText("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Lista de Resultados Predictivos con Swatch y Stock */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5 no-scrollbar divide-y divide-slate-50">
            {matchingColors.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <p className="text-[11px] font-medium text-slate-500">
                  Sin coincidencias para &ldquo;{colorFilterText}&rdquo;
                </p>
                <p className="text-[10px] text-slate-400">
                  Prueba con otro término de color.
                </p>
              </div>
            ) : (
              matchingColors.map((c, idx) => {
                const stock = colorStockMap.get(c) || 0;
                const isSelected =
                  selectedColor.toLowerCase() === c.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      onSelectColor(c);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-2 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-bold"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full border shrink-0 ${getColorSwatchClass(
                          c
                        )}`}
                      />
                      <span className="truncate">{c}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span
                        className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                          stock > 0
                            ? "bg-emerald-100/70 text-emerald-800"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {stock > 0 ? `${stock} en salón` : "Sin stock"}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Chips Rápidos de los Colores con Mayor Disponibilidad (Totalmente sin scroll lateral) */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {topQuickColors.map((c) => {
            const isSel = selectedColor.toLowerCase() === c.toLowerCase();
            const stock = colorStockMap.get(c) || 0;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onSelectColor(c)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSel
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : stock > 0
                    ? "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 active:scale-95"
                    : "bg-slate-50 text-slate-400 border-slate-200/60 opacity-60"
                }`}
                title={`${c} (${stock} disponibles en salón)`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full border shrink-0 ${getColorSwatchClass(
                    c
                  )}`}
                />
                <span className="truncate max-w-[95px]">{c}</span>
                <span
                  className={`text-[9.5px] font-mono ${
                    isSel ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  ({stock})
                </span>
              </button>
            );
          })}

          {/* Botón "+N más..." para abrir directamente el buscador predictivo */}
          {colors.length > 3 && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 border border-dashed border-slate-300 transition-colors cursor-pointer flex items-center gap-1"
              title="Ver más colores disponibles"
            >
              <span>+{colors.length - 3} más</span>
              <Search className="w-2.5 h-2.5 text-slate-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Tarjeta de Producto para Vista en Cuadrícula (Grid) del POS.
 * Integra buscador predictivo de color sin barras de deslizamiento horizontales.
 */
export function PosProductGridCard({
  product,
  cart,
  searchQuery,
  onAddVariant,
}: PosProductCardProps) {
  const totalSalonStock = useMemo(
    () => product.variants.reduce((acc, v) => acc + (v.stockStore || 0), 0),
    [product.variants]
  );
  const totalReservedStock = useMemo(
    () => product.variants.reduce((acc, v) => acc + (v.stockReserved || 0), 0),
    [product.variants]
  );
  const availableSalonStock = Math.max(0, totalSalonStock - totalReservedStock);

  // Lista única de colores ordenados
  const colors = useMemo(() => {
    const list: string[] = [];
    product.variants.forEach((v) => {
      const col = v.color?.trim() || "";
      if (col && !list.includes(col)) {
        list.push(col);
      }
    });
    return list;
  }, [product.variants]);

  // Determinar si todas las variantes comparten talle "Único" (ej: mochilas, accesorios)
  const isAllUniqueSize = useMemo(() => {
    return product.variants.every((v) => {
      const s = (v.size || "").toLowerCase().trim();
      return !s || s === "único" || s === "unico";
    });
  }, [product.variants]);

  // Color seleccionado en la tarjeta
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const withStock = colors.find((c) => {
      return product.variants.some(
        (v) =>
          (v.color?.trim() || "") === c &&
          Math.max(0, v.stockStore - (v.stockReserved || 0)) > 0
      );
    });
    return withStock || colors[0] || "";
  });

  // Filtro predictivo para productos con Talle Único (Mochilas, etc.)
  const [uniqueSizeColorSearch, setUniqueSizeColorSearch] = useState<string>("");

  // Modo expandido para ver todos los colores con sus talles al mismo tiempo
  const [isGroupedExpanded, setIsGroupedExpanded] = useState<boolean>(false);

  // Sincronizar automáticamente el color cuando el usuario busca un color en el input del POS
  useEffect(() => {
    if (!searchQuery) return;
    const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      const match = colors.find((c) => c.toLowerCase().includes(term));
      if (match) {
        setSelectedColor(match);
        break;
      }
    }
  }, [searchQuery, colors]);

  // Asegurar que selectedColor sea válido si cambia el producto
  useEffect(() => {
    if (colors.length > 0 && !colors.includes(selectedColor)) {
      const withStock = colors.find((c) => {
        return product.variants.some(
          (v) =>
            (v.color?.trim() || "") === c &&
            Math.max(0, v.stockStore - (v.stockReserved || 0)) > 0
        );
      });
      setSelectedColor(withStock || colors[0]);
    }
  }, [colors, selectedColor, product.variants]);

  // Variantes del color seleccionado
  const selectedColorVariants = useMemo(() => {
    if (!selectedColor) return product.variants;
    return product.variants.filter(
      (v) =>
        (v.color?.trim() || "").toLowerCase() === selectedColor.toLowerCase()
    );
  }, [product.variants, selectedColor]);

  // Stock en salón disponible para el color seleccionado
  const selectedColorSalonStock = useMemo(() => {
    return selectedColorVariants.reduce(
      (acc, v) => acc + Math.max(0, v.stockStore - (v.stockReserved || 0)),
      0
    );
  }, [selectedColorVariants]);

  // Imagen del producto (prioriza imagen específica del color seleccionado si existe)
  const activeImageUrl = useMemo(() => {
    if (product.images && product.images.length > 0 && selectedColor) {
      const colorImg = product.images.find(
        (img) =>
          (img.color || "").toLowerCase().trim() ===
          selectedColor.toLowerCase().trim()
      );
      if (colorImg?.url) return colorImg.url;
    }
    return product.imageUrl || product.images?.[0]?.url;
  }, [product.images, product.imageUrl, selectedColor]);

  // Para productos de talle único, variantes filtradas por texto predictivo
  const filteredUniqueSizeVariants = useMemo(() => {
    if (!uniqueSizeColorSearch.trim()) return product.variants;
    const q = uniqueSizeColorSearch.trim().toLowerCase();
    return product.variants.filter((v) =>
      (v.color || "").toLowerCase().includes(q)
    );
  }, [product.variants, uniqueSizeColorSearch]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-3.5 sm:p-4 flex flex-col justify-between space-y-3 group">
      <div>
        {/* Cabecera: Marca, Categoría y Badge de Stock en Salón */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
            {product.brand} • {product.category || product.discipline}
          </span>

          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
              availableSalonStock > 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                : "bg-rose-50 text-rose-700 border-rose-200/60"
            }`}
          >
            {availableSalonStock > 0
              ? `${availableSalonStock} en salón`
              : "Sin stock"}
          </span>
        </div>

        {/* Nombre del Producto y Thumbnail Opcional */}
        <div className="flex items-start gap-2.5 mt-1.5">
          {activeImageUrl ? (
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : null}
          <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 flex-1">
            {product.name}
          </h3>
        </div>

        {/* SKU y Precio */}
        <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
            SKU: {product.modelCode || product.sku}
          </span>
          <span className="text-base font-black text-slate-900 font-mono shrink-0">
            {formatCurrency(product.price)}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN DE VARIANTES (COLORES Y TALLES)                          */}
      {/* ============================================================== */}

      {/* CASO 1: Accesorios o Mochilas con Talle Único pero varios Colores */}
      {isAllUniqueSize ? (
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Color ({product.variants.length}):
            </span>

            {/* Input predictivo rápido para mochilas / accesorios con muchos colores */}
            {product.variants.length > 4 && (
              <div className="relative w-36">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={uniqueSizeColorSearch}
                  onChange={(e) => setUniqueSizeColorSearch(e.target.value)}
                  placeholder="Filtrar color..."
                  className="w-full pl-6 pr-5 py-0.5 bg-slate-50 focus:bg-white text-[10.5px] rounded-lg border border-slate-200 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                />
                {uniqueSizeColorSearch && (
                  <button
                    type="button"
                    onClick={() => setUniqueSizeColorSearch("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5 no-scrollbar">
            {filteredUniqueSizeVariants.length === 0 ? (
              <p className="text-[10.5px] text-slate-400 py-1">
                No hay colores que coincidan
              </p>
            ) : (
              filteredUniqueSizeVariants.map((v) => {
                const vAvail = Math.max(0, v.stockStore - (v.stockReserved || 0));
                const isOutOfStock = vAvail <= 0;
                const inCart = cart.find((i) => i.variantId === v.id);
                const inCartQty = inCart ? inCart.quantity : 0;

                return (
                  <button
                    key={v.id || `${v.size}-${v.color}`}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => onAddVariant(product, v)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isOutOfStock
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                        : inCartQty > 0
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border-slate-200/80 active:scale-95"
                    }`}
                    title={`${product.name} (${v.color}) — ${vAvail} disponibles en salón`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full border shrink-0 ${getColorSwatchClass(
                        v.color
                      )}`}
                    />
                    <span>{v.color}</span>
                    <span
                      className={`text-[10px] font-medium opacity-80 ${
                        inCartQty > 0 ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      ({vAvail})
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : colors.length > 1 ? (
        /* CASO 2: Múltiples Colores y Múltiples Talles (EJ: CROCS) */
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Selector Predictivo con Combobox flotante y Chips de Acceso Rápido */}
          <PredictiveColorCombobox
            colors={colors}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            variants={product.variants}
          />

          {/* Toggle entre vista del color activo y ver todos los colores agrupados */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span className="truncate">
              Talles para{" "}
              <strong className="text-slate-800 font-bold">{selectedColor}</strong>:
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-slate-500">
                {selectedColorSalonStock} en salón
              </span>
              <button
                type="button"
                onClick={() => setIsGroupedExpanded((prev) => !prev)}
                className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <SlidersHorizontal className="w-2.5 h-2.5" />
                <span>{isGroupedExpanded ? "Por color" : "Ver todos"}</span>
              </button>
            </div>
          </div>

          {/* Talles del Color Seleccionado (Modo Estándar) */}
          {!isGroupedExpanded ? (
            <div className="flex flex-wrap gap-1.5 max-h-24 sm:max-h-28 overflow-y-auto pr-0.5 no-scrollbar">
              {selectedColorVariants.map((v) => {
                const vAvail = Math.max(
                  0,
                  v.stockStore - (v.stockReserved || 0)
                );
                const isOutOfStock = vAvail <= 0;
                const inCart = cart.find((i) => i.variantId === v.id);
                const inCartQty = inCart ? inCart.quantity : 0;

                return (
                  <button
                    key={v.id || `${v.size}-${v.color}`}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => onAddVariant(product, v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                      isOutOfStock
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                        : inCartQty > 0
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border-slate-200/80 active:scale-95"
                    }`}
                    title={`${product.name} - ${v.color} - Talle ${v.size} (${vAvail} disponibles en salón)`}
                  >
                    <span>{v.size}</span>
                    <span
                      className={`text-[10px] font-medium opacity-80 ${
                        inCartQty > 0 ? "text-emerald-100" : "text-slate-400"
                      }`}
                    >
                      ({vAvail})
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Vista Agrupada: Todos los Colores Expandidos */
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 no-scrollbar">
              {colors.map((c) => {
                const cVariants = product.variants.filter(
                  (v) =>
                    (v.color?.trim() || "").toLowerCase() === c.toLowerCase()
                );
                const cStock = cVariants.reduce(
                  (sum, v) =>
                    sum + Math.max(0, v.stockStore - (v.stockReserved || 0)),
                  0
                );
                return (
                  <div
                    key={c}
                    className="bg-slate-50/80 rounded-xl p-2 border border-slate-100 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full border shrink-0 ${getColorSwatchClass(
                            c
                          )}`}
                        />
                        <span>{c}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {cStock} en salón
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cVariants.map((v) => {
                        const vAvail = Math.max(
                          0,
                          v.stockStore - (v.stockReserved || 0)
                        );
                        const isOutOfStock = vAvail <= 0;
                        const inCart = cart.find((i) => i.variantId === v.id);
                        const inCartQty = inCart ? inCart.quantity : 0;
                        return (
                          <button
                            key={v.id || `${v.size}-${v.color}`}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => onAddVariant(product, v)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                              isOutOfStock
                                ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                                : inCartQty > 0
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : "bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 active:scale-95"
                            }`}
                            title={`${product.name} - ${v.color} - Talle ${v.size} (${vAvail} disponibles)`}
                          >
                            <span>{v.size}</span>
                            <span className="text-[9.5px] opacity-75">
                              ({vAvail})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* CASO 3: Un solo color en el producto */
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 block">
              Tocar talle para agregar:
            </span>
            {colors[0] && (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full border shrink-0 ${getColorSwatchClass(
                    colors[0]
                  )}`}
                />
                <span>Color: {colors[0]}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 sm:max-h-28 overflow-y-auto pr-0.5 no-scrollbar">
            {product.variants.map((v) => {
              const vAvail = Math.max(0, v.stockStore - (v.stockReserved || 0));
              const isOutOfStock = vAvail <= 0;
              const inCart = cart.find((i) => i.variantId === v.id);
              const inCartQty = inCart ? inCart.quantity : 0;

              return (
                <button
                  key={v.id || `${v.size}-${v.color}`}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onAddVariant(product, v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    isOutOfStock
                      ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                      : inCartQty > 0
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border-slate-200/80 active:scale-95"
                  }`}
                  title={`${product.name} (${v.color}) - Talle ${v.size} — ${vAvail} disponibles`}
                >
                  <span>{v.size}</span>
                  <span
                    className={`text-[10px] font-medium opacity-80 ${
                      inCartQty > 0 ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    ({vAvail})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Fila de Producto para Vista en Lista (List) del POS.
 * Incluye selector predictivo de color compacto.
 */
export function PosProductListRow({
  product,
  cart,
  searchQuery,
  onAddVariant,
}: PosProductCardProps) {
  const colors = useMemo(() => {
    const list: string[] = [];
    product.variants.forEach((v) => {
      const col = v.color?.trim() || "";
      if (col && !list.includes(col)) {
        list.push(col);
      }
    });
    return list;
  }, [product.variants]);

  const isAllUniqueSize = useMemo(() => {
    return product.variants.every((v) => {
      const s = (v.size || "").toLowerCase().trim();
      return !s || s === "único" || s === "unico";
    });
  }, [product.variants]);

  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const withStock = colors.find((c) => {
      return product.variants.some(
        (v) =>
          (v.color?.trim() || "") === c &&
          Math.max(0, v.stockStore - (v.stockReserved || 0)) > 0
      );
    });
    return withStock || colors[0] || "";
  });

  useEffect(() => {
    if (!searchQuery) return;
    const terms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      const match = colors.find((c) => c.toLowerCase().includes(term));
      if (match) {
        setSelectedColor(match);
        break;
      }
    }
  }, [searchQuery, colors]);

  const selectedColorVariants = useMemo(() => {
    if (!selectedColor) return product.variants;
    return product.variants.filter(
      (v) =>
        (v.color?.trim() || "").toLowerCase() === selectedColor.toLowerCase()
    );
  }, [product.variants, selectedColor]);

  return (
    <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
      <div className="space-y-0.5 min-w-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {product.brand} • {product.category || product.discipline}
        </span>
        <h4 className="text-sm font-bold text-slate-900 truncate">
          {product.name}
        </h4>
        <span className="text-xs font-mono text-slate-400 block">
          SKU: {product.modelCode || product.sku}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <span className="text-base font-black text-slate-900 font-mono">
          {formatCurrency(product.price)}
        </span>

        {/* Variantes según tipo de producto */}
        {isAllUniqueSize ? (
          /* Accesorios / Mochilas (Talle único): mostrar colores directamente */
          <div className="flex flex-wrap gap-1">
            {product.variants.map((v) => {
              const vAvail = Math.max(0, v.stockStore - (v.stockReserved || 0));
              const isOutOfStock = vAvail <= 0;
              const inCart = cart.find((i) => i.variantId === v.id);
              const inCartQty = inCart ? inCart.quantity : 0;
              return (
                <button
                  key={v.id || `${v.size}-${v.color}`}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onAddVariant(product, v)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                    isOutOfStock
                      ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                      : inCartQty > 0
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-white hover:bg-emerald-50 text-slate-800 border-slate-200 active:scale-95"
                  }`}
                  title={`${v.color} (${vAvail} disponibles)`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full border shrink-0 ${getColorSwatchClass(
                      v.color
                    )}`}
                  />
                  <span>{v.color}</span>
                  <span className="text-[10px] opacity-75">({vAvail})</span>
                </button>
              );
            })}
          </div>
        ) : colors.length > 1 ? (
          /* Múltiples colores y talles (ej: Crocs) con selector predictivo compacto */
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <PredictiveColorCombobox
              colors={colors}
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
              variants={product.variants}
              compact={true}
            />

            {/* Talles del color activo */}
            <div className="flex flex-wrap gap-1">
              {selectedColorVariants.map((v) => {
                const vAvail = Math.max(
                  0,
                  v.stockStore - (v.stockReserved || 0)
                );
                const disabled = vAvail <= 0;
                const inCart = cart.find((i) => i.variantId === v.id);
                const inCartQty = inCart ? inCart.quantity : 0;
                return (
                  <button
                    key={v.id || `${v.size}-${v.color}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAddVariant(product, v)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                      disabled
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                        : inCartQty > 0
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white hover:bg-emerald-50 text-slate-800 border-slate-200 active:scale-95"
                    }`}
                    title={`${product.name} - ${v.color} - Talle ${v.size} (${vAvail} disponibles)`}
                  >
                    <span>{v.size}</span>
                    <span className="text-[10px] opacity-75">({vAvail})</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Solo 1 color */
          <div className="flex items-center gap-2">
            {colors[0] && (
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full border shrink-0 ${getColorSwatchClass(
                    colors[0]
                  )}`}
                />
                {colors[0]}
              </span>
            )}
            <div className="flex flex-wrap gap-1">
              {product.variants.map((v) => {
                const vAvail = Math.max(
                  0,
                  v.stockStore - (v.stockReserved || 0)
                );
                const disabled = vAvail <= 0;
                const inCart = cart.find((i) => i.variantId === v.id);
                const inCartQty = inCart ? inCart.quantity : 0;
                return (
                  <button
                    key={v.id || `${v.size}-${v.color}`}
                    disabled={disabled}
                    onClick={() => onAddVariant(product, v)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                      disabled
                        ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                        : inCartQty > 0
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                        : "bg-white hover:bg-emerald-50 text-slate-800 border-slate-200 active:scale-95"
                    }`}
                  >
                    <span>{v.size}</span>
                    <span className="text-[10px] opacity-75">({vAvail})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
