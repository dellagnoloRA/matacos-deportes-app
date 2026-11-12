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
    activeFilters.gender,
    activeFilters.disciplineSlug,
    activeFilters.categorySlug,
    activeFilters.brandSlug,
    activeFilters.size,
    activeFilters.minPrice,
    activeFilters.maxPrice,
    activeFilters.search,
  ].filter(Boolean).length;

  // Resolve human-readable names for tags
  const genderMatch = activeFilters.gender
    ? facets.genders?.find((g) => g.gender === activeFilters.gender)
    : null;
  const genderLabel: string | null = genderMatch
    ? genderMatch.label
    : activeFilters.gender
    ? String(activeFilters.gender)
    : null;
  const disciplineName =
    facets.disciplines.find(
      (d) =>
        d.slug.toLowerCase() === activeFilters.disciplineSlug?.toLowerCase() ||
        d.name.toLowerCase() === activeFilters.disciplineSlug?.toLowerCase()
    )?.name || activeFilters.disciplineSlug;
  const categoryName =
    facets.categories.find(
      (c) =>
        c.slug.toLowerCase() === activeFilters.categorySlug?.toLowerCase() ||
        c.name.toLowerCase() === activeFilters.categorySlug?.toLowerCase()
    )?.name || activeFilters.categorySlug;
  const brandName =
    facets.brands.find(
      (b) =>
        b.slug.toLowerCase() === activeFilters.brandSlug?.toLowerCase() ||
        b.name.toLowerCase() === activeFilters.brandSlug?.toLowerCase()
    )?.name || activeFilters.brandSlug;

  return (
    <div className="space-y-4 mb-6">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/catalogo" className="hover:text-slate-900 transition-colors">
          Catálogo
        </Link>
        {disciplineName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">{disciplineName}</span>
          </>
        )}
        {categoryName && !disciplineName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-900">{categoryName}</span>
          </>
        )}
      </nav>

      {/* 2. Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Left: Mobile Filter Button & Results Counter */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#00D615] text-slate-950 text-[10px] flex items-center justify-center font-black">
                {activeCount}
              </span>
            )}
          </button>

          <span className="text-xs sm:text-sm font-semibold text-slate-600">
            <strong className="text-slate-900 font-bold">{pagination.totalItems}</strong>{" "}
            {pagination.totalItems === 1 ? "artículo disponible" : "artículos disponibles"}
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
              className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-[#00D615] cursor-pointer"
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

          {genderLabel && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold">
              <span>Género: {genderLabel}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ gender: undefined, page: 1 })}
                className="hover:text-red-600 cursor-pointer"
                title="Quitar filtro de género"
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

