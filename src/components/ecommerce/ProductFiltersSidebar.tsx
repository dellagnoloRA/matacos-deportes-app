"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

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
  sizeGroups = [],
  availableBrands = [],
  availableCategories = [],
  availableDisciplines = [],
  totalProductCount = 0,
  minPrice = 0,
  maxPrice = 250000,
  isMobileModal = false,
  onCloseMobileModal,
}: ProductFiltersSidebarProps) {
  // Estados de acordeones abiertos según el diseño oficial de Matacos Deportes
  const [openSections, setOpenSections] = useState({
    disciplina: true,
    categoria: false,
    marca: false,
    talles: false,
    precio: true,
  });

  // Estado para expandir grupos de talles que superan las 3 filas
  const [expandedSizeGroups, setExpandedSizeGroups] = useState<Record<string, boolean>>({});

  // Estados para expandir categorías, marcas y disciplinas a partir del 10mo elemento sin scroll
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
    Boolean(filters.priceRange);

  const currentMin = filters.priceRange ? filters.priceRange[0] : minPrice;
  const currentMax = filters.priceRange ? filters.priceRange[1] : maxPrice;

  // Toggle de un elemento en array (ej: talles o marcas)
  const toggleArrayItem = (key: "sizes" | "brand", item: string) => {
    const current = filters[key] || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter((x) => x !== item) : [...current, item];
    onFilterChange({ ...filters, [key]: updated });
  };

  return (
    <aside className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col gap-4 text-slate-800 text-xs select-none">
      {/* 1. Encabezado del Panel: FILTRAR POR y Limpiar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-xs font-black tracking-wider uppercase text-slate-900">
          FILTRAR POR
        </h3>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <span>Limpiar</span>
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* 2. Acordeón: DISCIPLINA (Primero y abierto por defecto) */}
      <div className="pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => toggleSection("disciplina")}
          className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
        >
          <span>DISCIPLINA</span>
          {openSections.disciplina ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.disciplina && (
          <div className="pt-2.5 space-y-1">
            {(showAllDisciplines
              ? availableDisciplines
              : availableDisciplines.slice(0, 10)
            ).map(({ discipline, count }) => {
              const isSelected = filters.discipline === discipline;
              return (
                <button
                  key={discipline}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      discipline: isSelected ? undefined : discipline,
                    })
                  }
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#0B132B] text-white font-bold shadow-xs"
                      : "text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span>{discipline}</span>
                  <span className={`text-xs ${isSelected ? "text-white font-bold" : "text-slate-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {availableDisciplines.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllDisciplines((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-3 transition-colors cursor-pointer flex items-center gap-1"
              >
                {showAllDisciplines
                  ? "- Ver menos"
                  : `+ Ver más (${availableDisciplines.length - 10})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Acordeón: CATEGORÍA (Cerrado por defecto) */}
      <div className="pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => toggleSection("categoria")}
          className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
        >
          <span>CATEGORÍA</span>
          {openSections.categoria ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.categoria && (
          <div className="pt-2.5 space-y-1">
            {(showAllCategories
              ? availableCategories
              : availableCategories.slice(0, 10)
            ).map(({ category, count }) => {
              const isSelected = filters.category === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      category: isSelected ? undefined : category,
                    })
                  }
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-[#0B132B] text-white font-bold shadow-xs"
                      : "text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-xs ${isSelected ? "text-white font-bold" : "text-slate-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {availableCategories.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllCategories((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-3 transition-colors cursor-pointer flex items-center gap-1"
              >
                {showAllCategories
                  ? "- Ver menos"
                  : `+ Ver más (${availableCategories.length - 10})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Acordeón: MARCA (Cerrado por defecto) */}
      <div className="pb-3 border-b border-slate-100">
        <button
          type="button"
          onClick={() => toggleSection("marca")}
          className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
        >
          <span>MARCA</span>
          {openSections.marca ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.marca && (
          <div className="pt-2.5 space-y-1">
            {(showAllBrands
              ? availableBrands
              : availableBrands.slice(0, 10)
            ).map(({ brand, count }) => {
              const isChecked = filters.brand?.includes(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleArrayItem("brand", brand)}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isChecked
                      ? "bg-[#0B132B] text-white font-bold shadow-xs"
                      : "text-slate-700 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <span>{brand}</span>
                  <span className={`text-xs ${isChecked ? "text-white font-bold" : "text-slate-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {availableBrands.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllBrands((prev) => !prev)}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-3 transition-colors cursor-pointer flex items-center gap-1"
              >
                {showAllBrands
                  ? "- Ver menos"
                  : `+ Ver más (${availableBrands.length - 10})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 5. Acordeón: TALLES (Cerrado por defecto) */}
      {sizeGroups.length > 0 && (
        <div className="pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => toggleSection("talles")}
            className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
          >
            <span>TALLES</span>
            {openSections.talles ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.talles && (
            <div className="pt-3 space-y-3">
              {sizeGroups.map((group) => {
                const isExpanded = expandedSizeGroups[group.name];
                const displayedSizes = isExpanded ? group.sizes : group.sizes.slice(0, 9);
                const hasMore = group.sizes.length > 9;

                return (
                  <div key={group.name} className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      {group.name}
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {displayedSizes.map(({ size }) => {
                        const isSelected = filters.sizes?.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleArrayItem("sizes", size)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer border ${
                              isSelected
                                ? "bg-[#0B132B] text-white border-[#0B132B]"
                                : "bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => toggleExpandSizeGroup(group.name)}
                        className="text-[10px] font-bold text-emerald-800 hover:underline pt-0.5"
                      >
                        {isExpanded ? "- Ver menos" : `+ Ver más (${group.sizes.length - 9})`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. Acordeón: RANGO DE PRECIO (Abierto por defecto, con MÍNIMO, MÁXIMO y 3 botones rápidos) */}
      <div className="pb-1">
        <button
          type="button"
          onClick={() => toggleSection("precio")}
          className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
        >
          <span>RANGO DE PRECIO</span>
          {openSections.precio ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.precio && (
          <div className="pt-3 space-y-3">
            {/* Inputs editables MÍNIMO y MÁXIMO */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  MÍNIMO
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
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
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  MÁXIMO
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
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
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 3 Botones rápidos de rango de precio */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    priceRange: [minPrice, 30000],
                  })
                }
                className="py-1 px-2 rounded-md border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-semibold text-center transition-colors bg-white hover:bg-slate-50 cursor-pointer"
              >
                Hasta $30.000
              </button>

              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    priceRange: [30000, 70000],
                  })
                }
                className="py-1 px-2 rounded-md border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-semibold text-center transition-colors bg-white hover:bg-slate-50 cursor-pointer"
              >
                $30.000 - $70.000
              </button>

              <button
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    priceRange: [70000, maxPrice],
                  })
                }
                className="col-span-2 py-1 px-2 rounded-md border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-semibold text-center transition-colors bg-white hover:bg-slate-50 cursor-pointer"
              >
                Más de $70.000
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Botón en Móvil para Cerrar Drawer */}
      {isMobileModal && (
        <div className="pt-4 sticky bottom-0 bg-white pb-6">
          <button
            type="button"
            onClick={onCloseMobileModal}
            className="w-full py-3 bg-[#0B132B] text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ver resultados ({totalProductCount})</span>
          </button>
        </div>
      )}
    </aside>
  );
}
