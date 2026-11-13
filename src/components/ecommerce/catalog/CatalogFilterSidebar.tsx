"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { CatalogFacetsResponse } from "@/types/ecommerce";
import type { CatalogFilterInput } from "@/schemas/ecommerce";

interface CatalogFilterSidebarProps {
  facets: CatalogFacetsResponse;
  activeFilters: CatalogFilterInput;
  onFilterChange: (filters: Partial<CatalogFilterInput>) => void;
  onClearFilters: () => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export function CatalogFilterSidebar({
  facets,
  activeFilters,
  onFilterChange,
  onClearFilters,
  onCloseMobile,
  isMobile = false,
}: CatalogFilterSidebarProps) {
  // Estados de acordeones: Disciplina y Precio abiertos por defecto, idéntico a la captura
  const [openSections, setOpenSections] = useState({
    disciplines: true,
    categories: Boolean(activeFilters.categorySlug),
    brands: Boolean(activeFilters.brandSlug),
    gender: Boolean(activeFilters.gender),
    sizes: Boolean(activeFilters.size),
    price: true,
  });

  const [showAllDisciplines, setShowAllDisciplines] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = Boolean(
    activeFilters.gender ||
      activeFilters.disciplineSlug ||
      activeFilters.categorySlug ||
      activeFilters.brandSlug ||
      activeFilters.size ||
      activeFilters.minPrice ||
      activeFilters.maxPrice ||
      activeFilters.search
  );

  return (
    <aside
      className={`w-full bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col gap-4 text-slate-800 text-xs select-none ${
        isMobile ? "max-h-full overflow-y-auto" : ""
      }`}
    >
      {/* 1. Encabezado del Panel: FILTRAR POR y Limpiar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-xs font-black tracking-wider uppercase text-slate-900">
          FILTRAR POR
        </h3>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Restablecer todos los filtros"
            >
              <span>Limpiar</span>
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Acordeón: DISCIPLINA (Primero y abierto por defecto) */}
      {facets.disciplines.length > 0 && (
        <div className="pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => toggleSection("disciplines")}
            className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
          >
            <span>DISCIPLINA</span>
            {openSections.disciplines ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.disciplines && (
            <div className="pt-2.5 space-y-1">
              {(showAllDisciplines
                ? facets.disciplines
                : facets.disciplines.slice(0, 10)
              ).map((d) => {
                const isSelected =
                  activeFilters.disciplineSlug?.toLowerCase() === d.slug.toLowerCase() ||
                  activeFilters.disciplineSlug?.toLowerCase() === d.name.toLowerCase();
                return (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        disciplineSlug: isSelected ? undefined : d.slug,
                        page: 1,
                      })
                    }
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#0B132B] text-white font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <span>{d.name}</span>
                    <span
                      className={`text-xs ${
                        isSelected ? "text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      {d.count}
                    </span>
                  </button>
                );
              })}

              {facets.disciplines.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllDisciplines((prev) => !prev)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-3 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {showAllDisciplines
                    ? "- Ver menos"
                    : `+ Ver más (${facets.disciplines.length - 10})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Acordeón: CATEGORÍA (Cerrado por defecto) */}
      {facets.categories.length > 0 && (
        <div className="pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => toggleSection("categories")}
            className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
          >
            <span>CATEGORÍA</span>
            {openSections.categories ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.categories && (
            <div className="pt-2.5 space-y-1">
              {(showAllCategories
                ? facets.categories
                : facets.categories.slice(0, 10)
              ).map((c) => {
                const isSelected =
                  activeFilters.categorySlug?.toLowerCase() === c.slug.toLowerCase() ||
                  activeFilters.categorySlug?.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        categorySlug: isSelected ? undefined : c.slug,
                        page: 1,
                      })
                    }
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#0B132B] text-white font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-xs ${
                        isSelected ? "text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}

              {facets.categories.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((prev) => !prev)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-3 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {showAllCategories
                    ? "- Ver menos"
                    : `+ Ver más (${facets.categories.length - 10})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Acordeón: MARCA (Cerrado por defecto) */}
      {facets.brands.length > 0 && (
        <div className="pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() => toggleSection("brands")}
            className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
          >
            <span>MARCA</span>
            {openSections.brands ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.brands && (
            <div className="pt-2.5 space-y-1">
              {(showAllBrands
                ? facets.brands
                : facets.brands.slice(0, 10)
              ).map((b) => {
                const isSelected =
                  activeFilters.brandSlug?.toLowerCase() === b.slug.toLowerCase() ||
                  activeFilters.brandSlug?.toLowerCase() === b.name.toLowerCase();
                return (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        brandSlug: isSelected ? undefined : b.slug,
                        page: 1,
                      })
                    }
                    className={`w-full text-left py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-[#0B132B] text-white font-bold shadow-xs"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <span>{b.name}</span>
                    <span
                      className={`text-xs ${
                        isSelected ? "text-white font-bold" : "text-slate-400"
                      }`}
                    >
                      {b.count}
                    </span>
                  </button>
                );
              })}

              {facets.brands.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllBrands((prev) => !prev)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 pt-1.5 px-3 transition-colors cursor-pointer flex items-center gap-1"
                >
                  {showAllBrands
                    ? "- Ver menos"
                    : `+ Ver más (${facets.brands.length - 10})`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Acordeón: RANGO DE PRECIO (Abierto por defecto con MÍNIMO, MÁXIMO y 3 botones rápidos) */}
      <div className="pb-1">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between font-black uppercase text-xs tracking-wide text-slate-900 py-1 cursor-pointer"
        >
          <span>RANGO DE PRECIO</span>
          {openSections.price ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {openSections.price && (
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
                    value={activeFilters.minPrice ?? ""}
                    placeholder="0"
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      onFilterChange({ minPrice: val, page: 1 });
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
                    value={activeFilters.maxPrice ?? ""}
                    placeholder={String(facets.priceRange.max || 145000)}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      onFilterChange({ maxPrice: val, page: 1 });
                    }}
                    className="w-full pl-6 pr-2 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Botones de presets directos */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onFilterChange({ minPrice: undefined, maxPrice: 30000, page: 1 })}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px] border border-slate-200 transition-colors text-center cursor-pointer"
              >
                Hasta $30.000
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ minPrice: 30000, maxPrice: 70000, page: 1 })}
                className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px] border border-slate-200 transition-colors text-center cursor-pointer"
              >
                $30.000 - $70.000
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ minPrice: 70000, maxPrice: undefined, page: 1 })}
                className="col-span-2 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px] border border-slate-200 transition-colors text-center cursor-pointer"
              >
                Más de $70.000
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
