"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { EcommerceCartDrawer } from "@/components/ecommerce/EcommerceCartDrawer";
import { CatalogFilterSidebar } from "./CatalogFilterSidebar";
import { CatalogTopBar } from "./CatalogTopBar";
import { CatalogPaginationNav } from "./CatalogPagination";
import {
  Heart,
  Flame,
  ShoppingBag,
  Loader2,
  LogIn,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCustomerStore } from "@/store/customerStore";
import { toggleCustomerFavoriteAction } from "@/server/actions/ecommerce/customerActions";
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

  // Customer store y favoritos autenticados
  const { customer, isLoaded, fetchCustomer, setCustomer } = useCustomerStore();
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);

  // Toast interactivo de favoritos (solo para advertencia cuando NO está logueado)
  const [favoriteToast, setFavoriteToast] = useState<{
    show: boolean;
    type: "login_required";
    message: string;
    productTitle?: string;
  } | null>(null);

  // Cargar sesión del cliente al montar si aún no se cargó
  useEffect(() => {
    if (!isLoaded) {
      fetchCustomer();
    }
  }, [isLoaded, fetchCustomer]);

  // Temporizador para auto-ocultar el toast
  useEffect(() => {
    if (favoriteToast?.show) {
      const timer = setTimeout(() => {
        setFavoriteToast((prev) => (prev ? { ...prev, show: false } : null));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [favoriteToast]);

  const handleToggleWishlist = async (productId: string, productName?: string) => {
    // Si el usuario no está logueado, advertir que debe iniciar sesión
    if (!customer) {
      setFavoriteToast({
        show: true,
        type: "login_required",
        message: "Tenés que iniciar sesión para guardar productos en tus favoritos.",
        productTitle: productName,
      });
      return;
    }

    try {
      setFavoriteLoadingId(productId);
      const res = await toggleCustomerFavoriteAction(productId);
      if (res.success && res.data) {
        // Actualizar el estado en el store global inmediatamente (tilde / destilde silencioso y reactivo)
        setCustomer({
          ...customer,
          favoriteProductIds: res.data.favoriteProductIds,
        });
      } else {
        setFavoriteToast({
          show: true,
          type: "login_required",
          message: res.error || "No se pudo actualizar tu lista de favoritos.",
          productTitle: productName,
        });
      }
    } catch {
      setFavoriteToast({
        show: true,
        type: "login_required",
        message: "Ocurrió un error inesperado al conectar con el servidor.",
      });
    } finally {
      setFavoriteLoadingId(null);
    }
  };

  // Mobile filters drawer state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header (incluye EcommerceCartDrawer global) */}
      <EcommerceHeader />

      {/* 2. Main Catalog Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-64 shrink-0">
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
                    const isWishlisted = Boolean(
                      customer?.favoriteProductIds?.includes(product.id)
                    );
                    const isFavoriteActionPending = favoriteLoadingId === product.id;

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
                            disabled={isFavoriteActionPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(product.id, product.name);
                            }}
                            className={`absolute top-2 right-2 w-7 h-7 rounded-full border shadow-2xs flex items-center justify-center transition-all z-10 cursor-pointer ${
                              isWishlisted
                                ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-500"
                                : "bg-white/90 hover:bg-white border-slate-200/80 text-slate-500 hover:text-red-500"
                            } ${isFavoriteActionPending ? "opacity-60 cursor-wait" : ""}`}
                            title={isWishlisted ? "Quitar de favoritos" : "Guardar en favoritos"}
                            aria-label={isWishlisted ? "Quitar de favoritos" : "Guardar en favoritos"}
                          >
                            {isFavoriteActionPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                            ) : (
                              <Heart
                                className={`w-3.5 h-3.5 transition-all ${
                                  isWishlisted
                                    ? "fill-red-500 text-red-500 scale-110"
                                    : "text-slate-500 hover:text-red-500"
                                }`}
                              />
                            )}
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

      {/* Slide-over Cart Drawer */}
      <EcommerceCartDrawer />

      {/* 6. Notificación flotante / Toast interactivo de favoritos */}
      {favoriteToast?.show && (
        <div
          className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setFavoriteToast(null)}
        >
          {/* Wrapper: círculo encima + tarjeta abajo */}
          <div
            className="relative w-full max-w-xs animate-in zoom-in-95 duration-200 pointer-events-auto flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Círculo con ícono flotando sobre la tarjeta */}
            <div className="relative z-10 mb-[-28px] flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center bg-red-500">
                <Heart className="w-7 h-7 text-white" />
              </div>
            </div>

            {/* Tarjeta principal */}
            <div className="w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Franja de color en el tope */}
              <div className="h-1.5 bg-red-500" />

              {/* Contenido */}
              <div className="pt-10 pb-5 px-5">
                {/* Título "Favoritos" centrado */}
                <p className="text-center text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Favoritos
                </p>

                {/* Subtítulo de acción */}
                <p className="text-center text-base font-bold text-slate-900 leading-snug mb-1">
                  Inicio de sesión requerido
                </p>

                {/* Mensaje descriptivo */}
                <p className="text-center text-sm text-slate-700 leading-relaxed mb-1">
                  {favoriteToast.message}
                </p>

                {/* Nombre del producto */}
                {favoriteToast.productTitle && (
                  <p className="text-center text-xs font-semibold text-slate-600 truncate mb-1">
                    {favoriteToast.productTitle}
                  </p>
                )}

                {/* Botón cerrar (X) arriba a la derecha */}
                <button
                  type="button"
                  onClick={() => setFavoriteToast(null)}
                  className="absolute top-10 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
                  aria-label="Cerrar notificación"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Botones de Acción */}
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href="/cuenta?mode=login&redirect=/catalogo"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00D615] hover:bg-[#00c013] text-black font-bold text-sm rounded-xl transition-colors shadow-sm"
                    onClick={() => setFavoriteToast(null)}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar Sesión</span>
                  </Link>
                  <Link
                    href="/cuenta?mode=register&redirect=/catalogo"
                    className="inline-flex items-center px-3 py-2.5 text-sm text-slate-600 hover:text-slate-800 font-medium border border-slate-200 hover:border-slate-300 rounded-xl transition-colors"
                    onClick={() => setFavoriteToast(null)}
                  >
                    Crear cuenta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
