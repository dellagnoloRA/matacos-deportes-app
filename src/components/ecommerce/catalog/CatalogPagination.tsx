"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CatalogPagination } from "@/types/ecommerce";

interface CatalogPaginationProps {
  pagination: CatalogPagination;
  onPageChange: (page: number) => void;
}

export function CatalogPaginationNav({
  pagination,
  onPageChange,
}: CatalogPaginationProps) {
  const { page, totalPages, hasPrevPage, hasNextPage } = pagination;

  if (totalPages <= 1) return null;

  // Build page numbers array
  const pages: number[] = [];
  const maxButtons = 5;
  let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const handlePageClick = (p: number) => {
    onPageChange(p);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Paginación de catálogo"
      className="flex items-center justify-center gap-1 sm:gap-2 pt-10 pb-4"
    >
      {/* Prev Button */}
      <button
        type="button"
        onClick={() => handlePageClick(page - 1)}
        disabled={!hasPrevPage}
        className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* First Page if skipped */}
      {startPage > 1 && (
        <>
          <button
            type="button"
            onClick={() => handlePageClick(1)}
            className="w-9 h-9 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
          >
            1
          </button>
          {startPage > 2 && <span className="px-1 text-slate-400">...</span>}
        </>
      )}

      {/* Page Numbers */}
      {pages.map((p) => {
        const isCurrent = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={() => handlePageClick(p)}
            className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
              isCurrent
                ? "bg-slate-950 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300"
            }`}
            aria-current={isCurrent ? "page" : undefined}
          >
            {p}
          </button>
        );
      })}

      {/* Last Page if skipped */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-1 text-slate-400">...</span>}
          <button
            type="button"
            onClick={() => handlePageClick(totalPages)}
            className="w-9 h-9 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        type="button"
        onClick={() => handlePageClick(page + 1)}
        disabled={!hasNextPage}
        className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
        aria-label="Página siguiente"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

