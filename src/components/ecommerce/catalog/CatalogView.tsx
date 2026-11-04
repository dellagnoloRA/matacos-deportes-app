"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { useCartStore } from "@/stores/cartStore";
import { CatalogFilterSidebar } from "./CatalogFilterSidebar";
import { CatalogTopBar } from "./CatalogTopBar";
import { CatalogPaginationNav } from "./CatalogPagination";
import { Eye, Check, ShoppingBag, X, ExternalLink, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  PublicProductItem,
  CatalogPagination,
  CatalogFacetsResponse,
} from "@/types/ecommerce";
import type { CatalogFilterInput } from "@/schemas/ecommerce";
import type { EcommerceProduct } from "@/components/ecommerce/types";
import { mapPublicProductToEcommerce } from "@/lib/ecommerceProductMapper";

interface CatalogViewProps {
  products: PublicProductItem[];
  pagination: CatalogPagination;
  facets: CatalogFacetsResponse;
  activeFilters: CatalogFilterInput;
}

export function CatalogView({
  products,
  pagination,
  facets,
  activeFilters,
}: CatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Mobile filters drawer state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Quick view modal
  const [activeModalProduct, setActiveModalProduct] = useState<EcommerceProduct | null>(null);

  // URL query updater
  const updateQueryParams = (newFilters: Partial<CatalogFilterInput>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Merge or delete filter keys
    Object.entries(newFilters).forEach(([key, val]) => {
      // Mapping filter keys to query param names
      let paramKey = key;
      if (key === "disciplineSlug") paramKey = "disciplina";
      if (key === "categorySlug") paramKey = "categoria";
      if (key === "brandSlug") paramKey = "marca";
      if (key === "size") paramKey = "talle";
      if (key === "gender") paramKey = "genero";

      if (val === undefined || val === null || val === "") {
        params.delete(paramKey);
      } else {
        params.set(paramKey, String(val));
      }
    });

    startTransition(() => {
      router.push(`/catalogo?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      router.push("/catalogo");
    });
  };

  // Cart actions via persistent Zustand store
  const handleAddToCart = (product: EcommerceProduct) => {
    const variant =
      product.variants?.find((v) => v.inStock && v.availableStock > 0) ||
      product.variants?.[0];

    if (variant) {
      useCartStore.getState().addItem(
        {
          variantId: variant.id,
          productId: product.id,
          name: product.name,
          brand: product.brand,
          size: variant.size,
          color: variant.color,
          image: product.image || "/placeholder-product.svg",
          unitPrice: variant.price || product.price,
          maxAvailableStock: variant.availableStock,
        },
        1
      );
      setAddedNotice(product.name);
      setTimeout(() => setAddedNotice(null), 3000);
    } else {
      router.push(`/productos/${product.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header (Includes persistent cart drawer) */}
      <EcommerceHeader />

      {/* 2. Main Catalog Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Desktop Filter Sidebar (Compact width to allow 4 columns) */}
          <div className="hidden lg:block w-56 lg:w-60 shrink-0 sticky top-24">
            <CatalogFilterSidebar
              facets={facets}
              activeFilters={activeFilters}
              onFilterChange={updateQueryParams}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Right: Products Area */}
          <div className="flex-1 w-full min-w-0">
            {/* Top Toolbar */}
            <CatalogTopBar
              pagination={pagination}
              activeFilters={activeFilters}
              facets={facets}
              onFilterChange={updateQueryParams}
              onClearFilters={handleClearFilters}
              onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
            />

            {/* Products Grid with Pending State */}
            <div className="relative min-h-96">
              {isPending && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs z-20 flex items-center justify-center rounded-2xl">
                  <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-[#00D615]" />
                    <span>Actualizando catálogo...</span>
                  </div>
                </div>
              )}

              {products.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      No se encontraron artículos disponibles
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      No hay productos que coincidan con la combinación de filtros seleccionada.
                      Intentá quitando algunos filtros o restableciendo la búsqueda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Restablecer todos los filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {products.map((item) => {
                    const product = mapPublicProductToEcommerce(item);
                    const isOutOfStock = !product.hasStock || product.totalAvailableStock === 0;
                    const isLowStock =
                      !isOutOfStock &&
                      product.totalAvailableStock !== undefined &&
                      product.totalAvailableStock > 0 &&
                      product.totalAvailableStock <= 3;

                    return (
                      <div
                        key={product.id}
                        className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-400 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                      >
                        {/* Image Container */}
                        <div className="relative w-full aspect-square bg-[#f8fafc] overflow-hidden p-4 flex items-center justify-center">
                          {product.isOffer && (
                            <span className="absolute top-3 left-3 z-10 bg-[#c2f25b] text-slate-950 font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-xs">
                              {product.offerTag || "OFERTA"}
                            </span>
                          )}

                          {isOutOfStock ? (
                            <span className="absolute top-3 right-3 z-10 bg-slate-800 text-slate-100 font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-xs">
                              Agotado
                            </span>
                          ) : isLowStock ? (
                            <span className="absolute top-3 right-3 z-10 bg-amber-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-xs">
                              ¡Últimas {product.totalAvailableStock}!
                            </span>
                          ) : null}

                          <Link
                            href={`/productos/${product.id}`}
                            className="w-full h-full flex items-center justify-center"
                          >
                            <img
                              src={product.image || "/placeholder-product.svg"}
                              alt={product.name}
                              className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                              }}
                            />
                          </Link>

                          {/* Quick View Button Hover Overlay */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveModalProduct(product);
                            }}
                            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white font-bold text-xs bg-black/40 backdrop-blur-2xs transition-opacity cursor-pointer"
                            title="Vista rápida"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Vista Rápida</span>
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              <span>{product.brand}</span>
                              {product.discipline && (
                                <span className="text-[10px] text-emerald-600 font-semibold">
                                  {product.discipline}
                                </span>
                              )}
                            </div>
                            <Link href={`/productos/${product.id}`}>
                              <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#00A811] transition-colors line-clamp-2">
                                {product.name}
                              </h3>
                            </Link>
                          </div>

                          <div className="space-y-3 pt-1">
                            {/* Pricing */}
                            <div className="min-h-10 flex flex-col justify-end">
                              {product.originalPrice ? (
                                <span className="text-xs text-slate-400 line-through font-medium">
                                  {formatCurrency(product.originalPrice)}
                                </span>
                              ) : null}
                              <span className="text-base font-extrabold text-[#00A811] tracking-tight">
                                {formatCurrency(product.price)}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-1 gap-2">
                              <Link
                                href={`/productos/${product.id}`}
                                className="w-full py-2.5 px-4 rounded-lg border border-slate-900 text-slate-900 font-bold text-xs uppercase tracking-wider hover:bg-slate-900 hover:text-white active:scale-98 transition-all duration-150 text-center block"
                              >
                                Ver producto
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              <CatalogPaginationNav
                pagination={pagination}
                onPageChange={(p) => updateQueryParams({ page: p })}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <EcommerceFooter />

      {/* 5. Mobile Filters Modal Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-80 max-w-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex-1 overflow-y-auto">
              <CatalogFilterSidebar
                facets={facets}
                activeFilters={activeFilters}
                onFilterChange={(filters) => {
                  updateQueryParams(filters);
                  setIsMobileFiltersOpen(false);
                }}
                onClearFilters={() => {
                  handleClearFilters();
                  setIsMobileFiltersOpen(false);
                }}
                onCloseMobile={() => setIsMobileFiltersOpen(false)}
                isMobile
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Quick View Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row">
            <button
              type="button"
              onClick={() => setActiveModalProduct(null)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="md:w-1/2 bg-[#f8fafc] p-8 flex items-center justify-center relative">
              {activeModalProduct.isOffer && (
                <span className="absolute top-4 left-4 bg-[#c2f25b] text-slate-950 font-black text-xs px-2.5 py-1 rounded shadow-xs">
                  {activeModalProduct.offerTag || "OFERTA"}
                </span>
              )}
              <img
                src={activeModalProduct.image || "/placeholder-product.svg"}
                alt={activeModalProduct.name}
                className="max-h-72 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                }}
              />
            </div>

            <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {activeModalProduct.brand} • {activeModalProduct.category}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">
                    {activeModalProduct.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeModalProduct.description ||
                    "Artículo deportivo original garantizado por Matacos Deportes. Local a la calle en Saavedra 241, Formosa."}
                </p>

                <div className="pt-2">
                  {activeModalProduct.originalPrice && (
                    <span className="text-sm text-slate-400 line-through font-semibold block">
                      {formatCurrency(activeModalProduct.originalPrice)}
                    </span>
                  )}
                  <span className="text-2xl font-black text-[#00A811]">
                    {formatCurrency(activeModalProduct.price)}
                  </span>
                  <span className="block text-[11px] text-emerald-700 font-bold mt-1">
                    {activeModalProduct.installments || "3 y 6 cuotas sin interés en el local"}
                  </span>
                </div>

                {activeModalProduct.totalAvailableStock !== undefined && (
                  <div className="text-xs text-slate-600 font-semibold">
                    Stock disponible:{" "}
                    <span className="text-emerald-700 font-bold">
                      {activeModalProduct.totalAvailableStock} unidades
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleAddToCart(activeModalProduct);
                    setActiveModalProduct(null);
                  }}
                  disabled={!activeModalProduct.hasStock || activeModalProduct.totalAvailableStock === 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#00D615] hover:bg-[#00b812] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 active:scale-98 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {!activeModalProduct.hasStock || activeModalProduct.totalAvailableStock === 0
                      ? "Sin Stock"
                      : "Agregar al carrito"}
                  </span>
                </button>

                <Link
                  href={`/productos/${activeModalProduct.id}`}
                  onClick={() => setActiveModalProduct(null)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Ver ficha y selector de talles</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Success Toast */}
      {addedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-bottom duration-300">
          <div className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center font-bold">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold">{addedNotice}</p>
            <p className="text-[11px] text-slate-300">¡Agregado al carrito con éxito!</p>
          </div>
        </div>
      )}
    </div>
  );
}

