"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  X,
  Check,
  Flame,
} from "lucide-react";
import type { CatalogFacetsResponse } from "@/types/ecommerce";
import type { CatalogFilterInput } from "@/schemas/ecommerce";
import { formatCurrency } from "@/lib/utils";

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
  // Accordion state: closed by default, auto-expanded only if that filter is currently active
  const [openSections, setOpenSections] = useState({
    gender: Boolean(activeFilters.gender),
    disciplines: Boolean(activeFilters.disciplineSlug),
    categories: Boolean(activeFilters.categorySlug),
    brands: Boolean(activeFilters.brandSlug),
    sizes: Boolean(activeFilters.size),
    price: Boolean(activeFilters.minPrice || activeFilters.maxPrice),
  });

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
      activeFilters.search ||
      activeFilters.ofertas
  );

  // El filtro de talles solo es relevante si se busca una disciplina, categoría, marca, término de búsqueda o ya hay un talle activo
  const hasContextForSizes = Boolean(
    activeFilters.disciplineSlug ||
      activeFilters.categorySlug ||
      activeFilters.brandSlug ||
      activeFilters.search ||
      activeFilters.size
  );

  return (
    <aside
      className={`w-full ${
        isMobile ? "p-6" : "space-y-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <h3 className="font-extrabold text-xs tracking-wider text-slate-900 uppercase">
          FILTRAR POR
        </h3>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          )}
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />

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

      <div className="space-y-5">
        {/* Toggle Solo Ofertas */}
        <div className="pb-3 border-b border-slate-100">
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                ofertas: activeFilters.ofertas ? undefined : true,
                page: 1,
              })
            }
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
              activeFilters.ofertas
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-500/30"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame
                className={`w-4 h-4 ${
                  activeFilters.ofertas
                    ? "text-orange-500 fill-orange-500 animate-bounce"
                    : "text-slate-400"
                }`}
              />
              <span>Solo en Oferta</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeFilters.ofertas
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {activeFilters.ofertas ? "ACTIVO" : "VER"}
            </span>
          </button>
        </div>

        {/* 0. Género */}
        {facets.genders && facets.genders.length > 0 && (
          <div className="border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => toggleSection("gender")}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-slate-950 py-1 cursor-pointer"
            >
              <span>Género</span>
              {openSections.gender ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.gender && (
              <div className="mt-3 space-y-1.5 text-xs">
                {facets.genders.map((g) => {
                  const isSelected = activeFilters.gender === g.gender;
                  return (
                    <button
                      key={g.gender}
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          gender: isSelected ? undefined : g.gender,
                          page: 1,
                        })
                      }
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{g.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {g.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 1. Disciplinas */}
        {facets.disciplines.length > 0 && (
          <div className="border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => toggleSection("disciplines")}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-slate-950 py-1 cursor-pointer"
            >
              <span>Disciplina</span>
              {openSections.disciplines ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.disciplines && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {facets.disciplines.map((d) => {
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{d.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {d.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. Categorías */}
        {facets.categories.length > 0 && (
          <div className="border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => toggleSection("categories")}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-slate-950 py-1 cursor-pointer"
            >
              <span>Categoría</span>
              {openSections.categories ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.categories && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {facets.categories.map((c) => {
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Marcas */}
        {facets.brands.length > 0 && (
          <div className="border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => toggleSection("brands")}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-slate-950 py-1 cursor-pointer"
            >
              <span>Marca</span>
              {openSections.brands ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.brands && (
              <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                {facets.brands.map((b) => {
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {b.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Talles (Solo visible cuando se busca una disciplina, categoría, marca o texto específico) */}
        {hasContextForSizes && facets.sizes.length > 0 && (
          <div className="border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => toggleSection("sizes")}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-slate-950 py-1 cursor-pointer"
            >
              <span>Talles</span>
              {openSections.sizes ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openSections.sizes && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {facets.sizes.map((s) => {
                  const isSelected = activeFilters.size === s.size;
                  return (
                    <button
                      key={s.size}
                      type="button"
                      onClick={() =>
                        onFilterChange({
                          size: isSelected ? undefined : s.size,
                          page: 1,
                        })
                      }
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#00D615] text-slate-950 border-[#00D615] font-black shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                      }`}
                      title={`${s.size} (${s.count} artículos)`}
                    >
                      {s.size}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Rango de Precios */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection("price")}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 hover:text-slate-950 py-1 cursor-pointer"
          >
            <span>Rango de Precio</span>
            {openSections.price ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {openSections.price && (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Mínimo
                  </label>
                  <input
                    type="number"
                    value={activeFilters.minPrice ?? ""}
                    placeholder={`$ ${facets.priceRange.min}`}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      onFilterChange({ minPrice: val, page: 1 });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#00D615] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Máximo
                  </label>
                  <input
                    type="number"
                    value={activeFilters.maxPrice ?? ""}
                    placeholder={`$ ${facets.priceRange.max}`}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      onFilterChange({ maxPrice: val, page: 1 });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:border-[#00D615] outline-none"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onFilterChange({ minPrice: undefined, maxPrice: 30000, page: 1 })}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                >
                  Hasta $30.000
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange({ minPrice: 30000, maxPrice: 70000, page: 1 })}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                >
                  $30.000 - $70.000
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange({ minPrice: 70000, maxPrice: undefined, page: 1 })}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer"
                >
                  Más de $70.000
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

