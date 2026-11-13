"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { EcommerceCartDrawer } from "@/components/ecommerce/EcommerceCartDrawer";
import { useCart, buildCartItemFromEcommerceProduct } from "@/store/cartStore";
import { CatalogFilterSidebar } from "./CatalogFilterSidebar";
import { CatalogTopBar } from "./CatalogTopBar";
import { CatalogPaginationNav } from "./CatalogPagination";
import {
  Heart,
  Flame,
  Eye,
  Check,
  ShoppingBag,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type {
  PublicProductItem,
  CatalogPagination,
  CatalogFacetsResponse,
} from "@/types/ecommerce";
import type { CatalogFilterInput } from "@/schemas/ecommerce";
import type { EcommerceProduct } from "@/components/ecommerce/types";
import { mapPublicProductToEcommerce } from "@/lib/ecommerceProductMapper";

const COLOR_HEX_MAP: Record<string, string> = {
  negro: "#111827",
  blanco: "#F8FAFC",
  gris: "#94A3B8",
  azul: "#2563EB",
  marino: "#1E3A8A",
  rojo: "#DC2626",
  verde: "#16A34A",
  amarillo: "#EAB308",
  naranja: "#EA580C",
  rosa: "#F472B6",
  violeta: "#8B5CF6",
  celeste: "#38BDF8",
  "celeste y blanco": "#38BDF8",
  marron: "#78350F",
  beige: "#D4B996",
};

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
  const [navigatingProductId, setNavigatingProductId] = useState<string | null>(
    null
  );
  const cart = useCart();

  // Wishlist state (persisted in localStorage)
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("matacos_wishlist");
      if (stored) {
        setWishlistIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      try {
        localStorage.setItem("matacos_wishlist", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Mobile filters drawer state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Cart notice
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Quick view modal
  const [activeModalProduct, setActiveModalProduct] =
    useState<EcommerceProduct | null>(null);

  const openQuickView = (product: EcommerceProduct) => {
    setActiveModalProduct(product);
  };

  const navigateToProductDetail = (
    e: React.MouseEvent<HTMLElement>,
    productId: string
  ) => {
    if (
      "metaKey" in e &&
      (e.metaKey || e.ctrlKey || e.shiftKey || (e as React.MouseEvent).button === 1)
    ) {
      return;
    }
    e.preventDefault();
    setNavigatingProductId(productId);
    router.push(`/productos/${productId}`);
  };

  // URL query updater
  const updateQueryParams = (newFilters: Partial<CatalogFilterInput>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, val]) => {
      let paramKey = key;
      if (key === "disciplineSlug") paramKey = "disciplina";
      if (key === "categorySlug") paramKey = "categoria";
      if (key === "brandSlug") paramKey = "marca";
      if (key === "size") paramKey = "talle";
      if (key === "gender") paramKey = "genero";
      if (key === "ofertas") {
        paramKey = "ofertas";
        params.delete("enOferta");
        params.delete("discount");
      }

      if (val === undefined || val === null || val === "" || val === false) {
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

  // Cart actions
  const handleAddToCart = (product: EcommerceProduct) => {
    const itemInput = buildCartItemFromEcommerceProduct(product);
    if (itemInput) {
      cart.addItem(itemInput);
      setAddedNotice(product.name);
      setTimeout(() => setAddedNotice(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header (incluye EcommerceCartDrawer global) */}
      <EcommerceHeader />

      {/* 2. Main Catalog Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-64 shrink-0 sticky top-24">
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
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5 lg:gap-4">
                  {products.map((item) => {
                    const product = mapPublicProductToEcommerce(item);
                    const isOutOfStock = !product.hasStock || product.totalAvailableStock === 0;
                    const isLowStock =
                      !isOutOfStock &&
                      product.totalAvailableStock !== undefined &&
                      product.totalAvailableStock > 0 &&
                      product.totalAvailableStock <= 3;
                    const isNavigatingThis = navigatingProductId === product.id;
                    const isWishlisted = wishlistIds.includes(product.id);

                    const hasOffer = Boolean(
                      product.isOffer ||
                      (product.originalPrice && product.originalPrice > product.price) ||
                      (product.discountPercent && product.discountPercent > 0)
                    );

                    const originalPrice =
                      product.originalPrice && product.originalPrice > product.price
                        ? product.originalPrice
                        : hasOffer
                        ? Math.round(product.price * (1 + (product.discountPercent || 15) / 100))
                        : undefined;

                    const discountPercent =
                      product.discountPercent ||
                      (originalPrice
                        ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
                        : 15);

                    const installmentCount = 3;
                    const installmentAmount = Math.round(product.price / installmentCount);

                    return (
                      <article
                        key={product.id}
                        onClick={(e) => navigateToProductDetail(e, product.id)}
                        className="group flex flex-col bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer select-none overflow-hidden h-full"
                      >
                        {/* 1. Contenedor de Imagen aspect-[4/5] */}
                        <div className="relative aspect-[4/5] sm:aspect-square md:aspect-[4/5] w-full bg-slate-50 overflow-hidden flex items-center justify-center border-b border-slate-100">
                          <img
                            src={product.image || "/placeholder-product.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                            }}
                          />

                          {/* Badges en la parte inferior izquierda de la imagen */}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
                            {isOutOfStock ? (
                              <span className="bg-slate-900/90 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
                                Agotado
                              </span>
                            ) : isLowStock ? (
                              <div className="flex items-center gap-1 bg-[#ff5722] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                <Flame className="w-3 h-3 fill-white text-white shrink-0" />
                                <span>¡ÚLTIMA!</span>
                              </div>
                            ) : product.colors && product.colors.length > 0 ? (
                              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-1.5 py-1 rounded-full shadow-xs">
                                {product.colors.slice(0, 3).map((col, idx) => {
                                  const key = col.toLowerCase().trim();
                                  const hex = COLOR_HEX_MAP[key] || "#94a3b8";
                                  return (
                                    <span
                                      key={idx}
                                      className="w-2.5 h-2.5 rounded-full border border-white/70 shadow-2xs shrink-0"
                                      style={{ backgroundColor: hex }}
                                      title={col}
                                    />
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>

                          {/* Botón de Favorito / Wishlist (arriba a la derecha) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(product.id);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-slate-500 hover:text-red-500 border border-slate-200/80 shadow-2xs flex items-center justify-center transition-all z-10 cursor-pointer"
                            title={isWishlisted ? "Quitar de favoritos" : "Guardar en favoritos"}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 transition-colors ${
                                isWishlisted
                                  ? "fill-red-500 text-red-500"
                                  : "text-slate-500 hover:text-red-500"
                              }`}
                            />
                          </button>

                          {/* Botón secundario flotante para Vista Rápida */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openQuickView(product);
                            }}
                            className="absolute bottom-2 right-2 z-10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white font-bold text-[10px] bg-slate-950/85 hover:bg-slate-950 backdrop-blur-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
                            title="Vista rápida"
                          >
                            <Eye className="w-3 h-3 text-[#00D615]" />
                            <span>Rápida</span>
                          </button>
                        </div>

                        {/* 2. Cuerpo de Información */}
                        <div className="p-3 sm:p-3.5 flex flex-col grow justify-between bg-white">
                          <div>
                            {/* Nombre / Título */}
                            <h3
                              className="text-sm sm:text-[15px] font-normal text-slate-800 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug"
                              title={product.name}
                            >
                              {product.name}
                            </h3>

                            {/* Marca en negrita uppercase */}
                            <div className="mt-0.5">
                              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate block">
                                {product.brand}
                              </span>
                            </div>

                            {/* Rating con estrella azul */}
                            <div className="flex items-center gap-1 text-[11px] text-[#3483fa] mt-0.5">
                              <span className="text-xs">★</span>
                              <span className="font-semibold text-slate-700">
                                {product.rating ? product.rating.toFixed(1) : "4.8"}
                              </span>
                            </div>

                            {/* Precio */}
                            <div className="mt-1.5">
                              {hasOffer && originalPrice && (
                                <div className="text-[11px] sm:text-xs text-slate-400 line-through leading-none">
                                  {formatCurrency(originalPrice)}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-base sm:text-lg font-normal text-slate-900 tracking-tight">
                                  {formatCurrency(product.price)}
                                </span>
                                {hasOffer && (
                                  <span className="text-[10px] sm:text-[11px] font-bold text-[#00a650] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/50">
                                    {discountPercent}% OFF
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Cuotas sin interés en verde */}
                            <div className="text-[11px] sm:text-xs font-medium text-[#00a650] leading-tight mt-0.5">
                              Mismo precio {installmentCount} cuotas de {formatCurrency(installmentAmount)}
                            </div>

                            {/* Envíos a todo el país */}
                            <div className="text-[11px] sm:text-xs font-medium text-[#00a650] mt-0.5">
                              Envíos a todo el país
                            </div>
                          </div>

                          {/* Loading indicator if navigating */}
                          {isNavigatingThis && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00D615]" />
                              <span>Cargando...</span>
                            </div>
                          )}
                        </div>
                      </article>
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

      {/* 8. Slide-over Cart Drawer */}
      <EcommerceCartDrawer />
    </div>
  );
}
