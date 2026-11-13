"use client";

import React from "react";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, X, ChevronRight } from "lucide-react";
import type { CatalogFilterInput } from "@/schemas/ecommerce";
import type { CatalogPagination, CatalogFacetsResponse } from "@/types/ecommerce";

interface CatalogTopBarProps {
  pagination: CatalogPagination;
  activeFilters: CatalogFilterInput;
  facets: CatalogFacetsResponse;
  onFilterChange: (filters: Partial<CatalogFilterInput>) => void;
  onClearFilters: () => void;
  onOpenMobileFilters: () => void;
}

export function CatalogTopBar({
  pagination,
  activeFilters,
  facets,
  onFilterChange,
  onClearFilters,
  onOpenMobileFilters,
}: CatalogTopBarProps) {
  // Count active filters (excluding sort, page, limit)
  const activeCount = [
    activeFilters.disciplineSlug,
    activeFilters.categorySlug,
    activeFilters.brandSlug,
    activeFilters.size,
    activeFilters.minPrice,
    activeFilters.maxPrice,
    activeFilters.search,
  ].filter(Boolean).length;

  // Resolve human-readable names for tags
  const disciplineName = facets.disciplines.find(
    (d) => d.slug === activeFilters.disciplineSlug
  )?.name;
  const categoryName = facets.categories.find(
    (c) => c.slug === activeFilters.categorySlug
  )?.name;
  const brandName = facets.brands.find((b) => b.slug === activeFilters.brandSlug)?.name;

  return (
    <div className="space-y-4 mb-6">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 font-normal mb-3">
        <Link href="/" className="hover:text-slate-700 transition-colors">
          Inicio
        </Link>
        <span className="text-slate-300">&gt;</span>
        <Link href="/catalogo" className="hover:text-slate-700 transition-colors">
          Catálogo
        </Link>
        {disciplineName && (
          <>
            <span className="text-slate-300">&gt;</span>
            <span className="font-semibold text-slate-800">{disciplineName}</span>
          </>
        )}
        {categoryName && !disciplineName && (
          <>
            <span className="text-slate-300">&gt;</span>
            <span className="font-semibold text-slate-800">{categoryName}</span>
          </>
        )}
      </nav>

      {/* 2. Controls Toolbar (Barra superior sin contenedor tosco, idéntico a la captura) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 pt-1 border-b border-slate-100 sm:border-none">
        {/* Left: Mobile Filter Button & Results Counter */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-800" />
            <span>Filtros</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#00D615] text-slate-950 text-[10px] flex items-center justify-center font-black">
                {activeCount}
              </span>
            )}
          </button>

          <span className="text-sm font-bold text-slate-800">
            {pagination.totalItems} {pagination.totalItems === 1 ? "artículo disponible" : "artículos disponibles"}
          </span>
        </div>

        {/* Right: Sort By Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Ordenar por:
          </span>
          <div className="relative">
            <select
              value={activeFilters.sort || "newest"}
              onChange={(e) =>
                onFilterChange({ sort: e.target.value as any, page: 1 })
              }
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-[#00D615] cursor-pointer"
            >
              <option value="newest">Novedades y Destacados</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
              <option value="name_asc">Nombre (A - Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 3. Active Filters Tags Ribbon */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Filtros activos:
          </span>

          {activeFilters.search && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold">
              <span>Búsqueda: "{activeFilters.search}"</span>
              <button
                type="button"
                onClick={() => onFilterChange({ search: undefined, page: 1 })}
                className="hover:text-red-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {disciplineName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
              <span>Disciplina: {disciplineName}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ disciplineSlug: undefined, page: 1 })}
                className="hover:text-red-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {categoryName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
              <span>Categoría: {categoryName}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ categorySlug: undefined, page: 1 })}
                className="hover:text-red-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {brandName && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
              <span>Marca: {brandName}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ brandSlug: undefined, page: 1 })}
                className="hover:text-red-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeFilters.size && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
              <span>Talle: {activeFilters.size}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ size: undefined, page: 1 })}
                className="hover:text-red-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {(activeFilters.minPrice || activeFilters.maxPrice) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
              <span>
                Precio:{" "}
                {activeFilters.minPrice ? `$ ${activeFilters.minPrice}` : "$ 0"}{" "}
                -{" "}
                {activeFilters.maxPrice
                  ? `$ ${activeFilters.maxPrice}`
                  : "sin límite"}
              </span>
              <button
                type="button"
                onClick={() =>
                  onFilterChange({ minPrice: undefined, maxPrice: undefined, page: 1 })
                }
                className="hover:text-red-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-bold text-[#00A811] hover:underline ml-1 cursor-pointer"
          >
            Limpiar todos los filtros
          </button>
        </div>
      )}
    </div>
  );
}

