"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Check, Sparkles, Filter, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface FilterState {
  category?: string;
  discipline?: string;
  brand?: string[];
  sizes?: string[];
  colors?: string[];
  gender?: string;
  onlyInStock?: boolean;
  onlyOffers?: boolean;
  storePickupOnly?: boolean;
  freeShippingOnly?: boolean;
  priceRange?: [number, number];
}

export interface SizeOption {
  size: string;
  count: number;
}

export interface SizeGroup {
  name: string;
  categoryKey?: string;
  sizes: SizeOption[];
}

interface ProductFiltersSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onClearFilters: () => void;
  availableSizes?: SizeOption[];
  sizeGroups?: SizeGroup[];
  availableBrands?: { brand: string; count: number }[];
  availableCategories?: { category: string; count: number }[];
  availableDisciplines?: { discipline: string; count: number }[];
  availableColors?: { color: string; count: number; hex?: string }[];
  totalProductCount?: number;
  inStockCount?: number;
  outOfStockCount?: number;
  hasActiveScopeForSizes?: boolean;
  activeScopeLabel?: string;
  minPrice?: number;
  maxPrice?: number;
  isMobileModal?: boolean;
  onCloseMobileModal?: () => void;
}

export function ProductFiltersSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  availableSizes = [],
  sizeGroups = [],
  availableBrands = [],
  availableCategories = [],
  availableDisciplines = [],
  availableColors = [],
  totalProductCount = 0,
  inStockCount = 0,
  outOfStockCount = 0,
  hasActiveScopeForSizes = false,
  activeScopeLabel,
  minPrice = 0,
  maxPrice = 250000,
  isMobileModal = false,
  onCloseMobileModal,
}: ProductFiltersSidebarProps) {
  // Estados de acordeones abiertos
  const [openSections, setOpenSections] = useState({
    talles: true,
    disponibilidad: true,
    categoria: true,
    disciplina: false,
    marca: true,
    precio: true,
    color: false,
    genero: false,
  });

  // Estado para expandir grupos de talles que superan las 3 filas
  const [expandedSizeGroups, setExpandedSizeGroups] = useState<Record<string, boolean>>({});

  // Estados para expandir categorías, marcas y disciplinas a partir del 10mo elemento sin slider
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllDisciplines, setShowAllDisciplines] = useState(false);

  const toggleExpandSizeGroup = (groupName: string) => {
    setExpandedSizeGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasActiveFilters =
    Boolean(filters.category) ||
    Boolean(filters.discipline) ||
    (filters.brand && filters.brand.length > 0) ||
    (filters.sizes && filters.sizes.length > 0) ||
    (filters.colors && filters.colors.length > 0) ||
    Boolean(filters.priceRange) ||
    Boolean(filters.gender) ||
    Boolean(filters.onlyInStock) ||
    Boolean(filters.onlyOffers) ||
    Boolean(filters.storePickupOnly) ||
    Boolean(filters.freeShippingOnly);

  const formatPrice = (amount: number) => {
    return formatCurrency(amount).replace(/,00$/, "");
  };

  const currentMin = filters.priceRange ? filters.priceRange[0] : minPrice;
  const currentMax = filters.priceRange ? filters.priceRange[1] : maxPrice;

  // Toggle de un elemento en array (ej: talles o marcas)
  const toggleArrayItem = (key: "sizes" | "brand" | "colors", item: string) => {
    const current = filters[key] || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter((x) => x !== item) : [...current, item];
    onFilterChange({ ...filters, [key]: updated });
  };

  return (
    <aside className="w-full flex flex-col gap-5 text-slate-800 text-xs select-none">
      {/* 1. Encabezado del Panel */}
      <div className="sticky top-0 bg-white z-10 flex items-center justify-between pb-3 pt-1 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-black tracking-wider uppercase text-slate-950">
            FILTROS
          </h3>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* 2. Switches Rápidos (Referencia Imagen 2 / Dexter) */}
      <div className="space-y-2.5 pb-4 border-b border-slate-200">
        {/* Switch Retiro por sucursal Saavedra 241 */}
        <label className="flex items-center justify-between cursor-pointer py-1 group">
          <span className="font-semibold text-slate-700 group-hover:text-slate-950">
            Retiro en Saavedra 241
          </span>
          <div
            onClick={() =>
              onFilterChange({
                ...filters,
                storePickupOnly: !filters.storePickupOnly,
              })
            }
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
              filters.storePickupOnly ? "bg-[#06241d]" : "bg-slate-200"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                filters.storePickupOnly ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </label>

        {/* Switch Envío a domicilio / Gratis */}
        <label className="flex items-center justify-between cursor-pointer py-1 group">
          <span className="font-semibold text-slate-700 group-hover:text-slate-950">
            Envío a domicilio
          </span>
          <div
            onClick={() =>
              onFilterChange({
                ...filters,
                freeShippingOnly: !filters.freeShippingOnly,
              })
            }
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
              filters.freeShippingOnly ? "bg-[#06241d]" : "bg-slate-200"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                filters.freeShippingOnly ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </label>

        {/* Switch Solo Ofertas y Descuentos */}
        <label className="flex items-center justify-between cursor-pointer py-1 group">
          <span className="font-semibold text-slate-700 group-hover:text-slate-950 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>En Oferta / SALE</span>
          </span>
          <div
            onClick={() =>
              onFilterChange({
                ...filters,
                onlyOffers: !filters.onlyOffers,
              })
            }
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 cursor-pointer ${
              filters.onlyOffers ? "bg-red-600" : "bg-slate-200"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                filters.onlyOffers ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
        </label>
      </div>

      {/* 3. Acordeón: TALLE (Solo mostrar si hay categorías con más de 1 talle) */}
      {sizeGroups && sizeGroups.some((g) => g.sizes.length > 1) && (
        <div className="pb-4 border-b border-slate-200">
          <button
            onClick={() => toggleSection("talles")}
            className="w-full flex items-center justify-between font-black uppercase text-[12px] tracking-wide text-slate-900 py-1"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>TALLE</span>
              {hasActiveScopeForSizes && activeScopeLabel && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded capitalize">
                  {activeScopeLabel}
                </span>
              )}
            </div>
            {openSections.talles ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {openSections.talles && (
            <div className="pt-3 space-y-4">
              {sizeGroups
                .filter((group) => group.sizes.length > 1)
                .map((group) => {
                  const MAX_VISIBLE_SIZES = 9; // ~3 filas de chips en el ancho del sidebar
                  const hasSelectedOverflow = group.sizes
                    .slice(MAX_VISIBLE_SIZES)
                    .some((s) => filters.sizes?.includes(s.size));

                  const isExpanded =
                    Boolean(expandedSizeGroups[group.name]) || hasSelectedOverflow;

                  const visibleSizes =
                    isExpanded || group.sizes.length <= MAX_VISIBLE_SIZES
                      ? group.sizes
                      : group.sizes.slice(0, MAX_VISIBLE_SIZES);

                  const hasOverflow = group.sizes.length > MAX_VISIBLE_SIZES;

                  return (
                    <div key={group.name} className="space-y-1.5">
                      {/* Título de la sección de talle */}
                      <div className="text-center sm:text-left text-xs font-semibold text-slate-800 tracking-tight">
                        {group.name}
                      </div>

                      {/* Fila / Cuadrícula de chips rectangulares como en la imagen */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        {visibleSizes.map(({ size, count }) => {
                          const isSelected = filters.sizes?.includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleArrayItem("sizes", size)}
                              className={`min-w-10 h-10 px-2 rounded-xs text-xs font-bold transition-all flex items-center justify-center select-none shadow-2xs cursor-pointer ${
                                isSelected
                                  ? "bg-slate-950 text-white shadow-md ring-2 ring-emerald-500 scale-102"
                                  : "bg-[#cbd5e1] hover:bg-[#b8c5d1] text-slate-800"
                              }`}
                              title={`${size} (${count} artículos)`}
                            >
                              <span>{size}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Botón Ver más a partir de la 3ra fila */}
                      {hasOverflow && (
                        <div className="flex justify-center sm:justify-start pt-0.5">
                          <button
                            type="button"
                            onClick={() => toggleExpandSizeGroup(group.name)}
                            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 transition-colors flex items-center gap-1 cursor-pointer select-none py-1"
                          >
                            {isExpanded ? (
                              <>
                                <span>Ver menos</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>+ Ver más ({group.sizes.length - MAX_VISIBLE_SIZES} más)</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 4. Acordeón: DISPONIBILIDAD (Referencia Imagen 1) */}
      <div className="pb-4 border-b border-slate-200">
        <button
          onClick={() => toggleSection("disponibilidad")}
          className="w-full flex items-center justify-between font-black uppercase text-[12px] tracking-wide text-slate-900 py-1"
        >
          <span>DISPONIBILIDAD</span>
          {openSections.disponibilidad ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.disponibilidad && (
          <div className="pt-3 space-y-2">
            <label className="flex items-center justify-between text-xs cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={Boolean(filters.onlyInStock)}
                  onChange={() =>
                    onFilterChange({
                      ...filters,
                      onlyInStock: !filters.onlyInStock,
                    })
                  }
                  className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-medium text-slate-800">En existencia</span>
              </div>
              <span className="text-[11px] text-slate-600">({inStockCount})</span>
            </label>

            <label className="flex items-center justify-between text-xs cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50 text-slate-600">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  disabled
                  className="w-3.5 h-3.5 rounded border-slate-300 opacity-50 cursor-not-allowed"
                />
                <span>Agotado</span>
              </div>
              <span className="text-[11px] text-slate-600">({outOfStockCount})</span>
            </label>
          </div>
        )}
      </div>

      {/* 5. Acordeón: CATEGORÍA DE PRODUCTO (Referencia Dexter e Imagen 1) */}
      <div className="pb-4 border-b border-slate-200">
        <button
          onClick={() => toggleSection("categoria")}
          className="w-full flex items-center justify-between font-black uppercase text-[12px] tracking-wide text-slate-900 py-1"
        >
          <span>CATEGORÍA</span>
          {openSections.categoria ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.categoria && (
          <div className="pt-2 space-y-1">
            <button
              onClick={() => onFilterChange({ ...filters, category: undefined })}
              className={`w-full text-left py-1.5 px-2 rounded font-medium text-xs transition-colors flex items-center justify-between ${
                !filters.category
                  ? "bg-slate-100 text-slate-950 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Todas las categorías</span>
              <span className="text-[10px] text-slate-600">({totalProductCount})</span>
            </button>

            {(showAllCategories
              ? availableCategories
              : availableCategories.slice(0, 10)
            ).map(({ category, count }) => {
              const isSelected = filters.category === category;
              return (
                <button
                  key={category}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      category: isSelected ? undefined : category,
                    })
                  }
                  className={`w-full text-left py-1.5 px-2 rounded font-medium text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-[#06241d] text-[#c2f25b] font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span>{category}</span>
                  <span className="text-[10px] text-slate-600">({count})</span>
                </button>
              );
            })}

            {availableCategories.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllCategories((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-2 transition-colors cursor-pointer flex items-center gap-1"
              >
                {showAllCategories
                  ? "- Ver menos"
                  : `+ Ver más (${availableCategories.length - 10})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 6. Acordeón: MARCA (Referencia Dexter) */}
      <div className="pb-4 border-b border-slate-200">
        <button
          onClick={() => toggleSection("marca")}
          className="w-full flex items-center justify-between font-black uppercase text-[12px] tracking-wide text-slate-900 py-1"
        >
          <span>MARCA</span>
          {openSections.marca ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.marca && (
          <div className="pt-3 space-y-1.5">
            {(showAllBrands
              ? availableBrands
              : availableBrands.slice(0, 10)
            ).map(({ brand, count }) => {
              const isChecked = filters.brand?.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex items-center justify-between text-xs cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50 text-slate-700"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={Boolean(isChecked)}
                      onChange={() => toggleArrayItem("brand", brand)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-800">{brand}</span>
                  </div>
                  <span className="text-[11px] text-slate-600">({count})</span>
                </label>
              );
            })}

            {availableBrands.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllBrands((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-1.5 transition-colors cursor-pointer flex items-center gap-1"
              >
                {showAllBrands
                  ? "- Ver menos"
                  : `+ Ver más (${availableBrands.length - 10})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 7. Acordeón: DISCIPLINA / DEPORTE (Matacos Deportes) */}
      <div className="pb-4 border-b border-slate-200">
        <button
          onClick={() => toggleSection("disciplina")}
          className="w-full flex items-center justify-between font-black uppercase text-[12px] tracking-wide text-slate-900 py-1"
        >
          <span>DISCIPLINA</span>
          {openSections.disciplina ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.disciplina && (
          <div className="pt-2 space-y-1">
            {(showAllDisciplines
              ? availableDisciplines
              : availableDisciplines.slice(0, 10)
            ).map(({ discipline, count }) => {
              const isSelected = filters.discipline === discipline;
              return (
                <button
                  key={discipline}
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      discipline: isSelected ? undefined : discipline,
                    })
                  }
                  className={`w-full text-left py-1.5 px-2 rounded font-medium text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-slate-950 text-white font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span>{discipline}</span>
                  <span className="text-[10px] text-slate-600">({count})</span>
                </button>
              );
            })}

            {availableDisciplines.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllDisciplines((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-2 transition-colors cursor-pointer flex items-center gap-1"
              >
                {showAllDisciplines
                  ? "- Ver menos"
                  : `+ Ver más (${availableDisciplines.length - 10})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 8. Acordeón: PRECIO con Slider de Rango (Referencia Imagen 1 y 2) */}
      <div className="pb-4 border-b border-slate-200">
        <button
          onClick={() => toggleSection("precio")}
          className="w-full flex items-center justify-between font-black uppercase text-[12px] tracking-wide text-slate-900 py-1"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>PRECIO</span>
            {filters.priceRange && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                Filtrado
              </span>
            )}
          </div>
          {openSections.precio ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.precio && (
          <div className="pt-3 space-y-3">
            {/* Rango de precio actual */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>{formatPrice(currentMin)}</span>
              <span className="text-slate-400 font-normal">—</span>
              <span>{formatPrice(currentMax)}</span>
            </div>

            {/* Sliders de Rango interactivos (Mínimo y Máximo) */}
            <div className="space-y-3 pt-1 pb-1">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>Mínimo:</span>
                  <span className="font-bold text-[#06241d]">{formatPrice(currentMin)}</span>
                </div>
                <input
                  type="range"
                  min={minPrice}
                  max={currentMax}
                  step={1000}
                  value={currentMin}
                  onChange={(e) => {
                    const newMin = Math.min(Number(e.target.value), currentMax);
                    onFilterChange({
                      ...filters,
                      priceRange: [newMin, currentMax],
                    });
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00D615]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>Máximo:</span>
                  <span className="font-bold text-[#06241d]">{formatPrice(currentMax)}</span>
                </div>
                <input
                  type="range"
                  min={currentMin}
                  max={maxPrice}
                  step={1000}
                  value={currentMax}
                  onChange={(e) => {
                    const newMax = Math.max(Number(e.target.value), currentMin);
                    onFilterChange({
                      ...filters,
                      priceRange: [currentMin, newMax],
                    });
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00D615]"
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Catálogo min: {formatPrice(minPrice)}</span>
                <span>Catálogo max: {formatPrice(maxPrice)}</span>
              </div>
            </div>

            {/* Inputs editables Min y Max */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                  Mínimo
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 text-xs">$</span>
                  <input
                    type="number"
                    value={currentMin}
                    min={minPrice}
                    max={currentMax}
                    step={1000}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onFilterChange({
                        ...filters,
                        priceRange: [val, currentMax],
                      });
                    }}
                    className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 focus:outline-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                  Máximo
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 text-xs">$</span>
                  <input
                    type="number"
                    value={currentMax}
                    min={currentMin}
                    max={maxPrice}
                    step={1000}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onFilterChange({
                        ...filters,
                        priceRange: [currentMin, val],
                      });
                    }}
                    className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-900 focus:outline-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Botón para restablecer el precio si está activo */}
            {filters.priceRange && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      priceRange: undefined,
                    })
                  }
                  className="text-[11px] font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Restablecer rango de precio
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 9. Acordeón: COLOR (Referencia Imagen 1 y 2) */}
      <div className="pb-4 border-b border-slate-200">
        <button
          onClick={() => toggleSection("color")}
          className="w-full flex items-center justify-between font-black uppercase text-[12px] tracking-wide text-slate-900 py-1"
        >
          <span>COLOR</span>
          {openSections.color ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {openSections.color && (
          <div className="pt-3 flex flex-wrap gap-2">
            {availableColors.map(({ color, count, hex }) => {
              const isSelected = filters.colors?.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleArrayItem("colors", color)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {hex && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                  )}
                  <span>{color}</span>
                  <span className="text-[9px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 9. Botón en Móvil para Cerrar Drawer */}
      {isMobileModal && (
        <div className="pt-4 sticky bottom-0 bg-white pb-6">
          <button
            onClick={onCloseMobileModal}
            className="w-full py-3 bg-[#06241d] text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <span>Ver resultados ({totalProductCount})</span>
          </button>
        </div>
      )}
    </aside>
  );
}
