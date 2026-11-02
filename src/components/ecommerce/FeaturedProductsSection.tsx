"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EcommerceProduct } from "./types";
import { MOCK_FEATURED_PRODUCTS } from "./mockData";
import {
  ChevronDown,
  Eye,
  Check,
  ShoppingBag,
  X,
  ExternalLink,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  useCartStore,
  buildCartItemFromEcommerceProduct,
} from "@/store/cartStore";

interface FeaturedProductsSectionProps {
  products?: EcommerceProduct[];
}

type SortByOption = "destacados" | "menor-precio" | "mayor-precio";

const CATEGORY_TABS = [
  "Todos",
  "Natación",
  "Vóley",
  "Calzado",
  "Indumentaria",
  "Accesorios",
  "Crocs",
];

const UUID_CHECK_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function FeaturedProductsSection({
  products = MOCK_FEATURED_PRODUCTS,
}: FeaturedProductsSectionProps) {
  const router = useRouter();
  const { addItem, openDrawer } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<SortByOption>("destacados");
  const [navigatingProductId, setNavigatingProductId] = useState<string | null>(
    null
  );
  const [activeModalProduct, setActiveModalProduct] =
    useState<EcommerceProduct | null>(null);
  const [selectedQuickVariantId, setSelectedQuickVariantId] = useState<
    string | undefined
  >(undefined);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const openQuickView = (prod: EcommerceProduct) => {
    const firstInStock =
      prod.variants?.find((v) => v.inStock && v.availableStock > 0) ||
      prod.variants?.[0];
    setSelectedQuickVariantId(firstInStock?.id);
    setActiveModalProduct(prod);
  };

  const navigateToProduct = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    prod: EcommerceProduct
  ) => {
    // Si es un ítem mock ilustrativo sin UUID real, abrir Vista Rápida en lugar de 404
    const hasRealPage =
      UUID_CHECK_REGEX.test(prod.id) || Boolean(prod.variants?.length);
    if (!hasRealPage) {
      e.preventDefault();
      openQuickView(prod);
      return;
    }

    if (
      "metaKey" in e &&
      (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)
    ) {
      return;
    }
    e.preventDefault();
    setNavigatingProductId(prod.id);
    router.push(`/productos/${prod.id}`);
  };

  // Filtrado y ordenamiento de productos
  const filteredProducts = useMemo(() => {
    const list = [...products].filter((p) => {
      if (selectedCategory === "Todos") return true;
      const target = selectedCategory.toLowerCase();
      if (target === "crocs") {
        return (
          p.brand.toLowerCase() === "crocs" ||
          p.name.toLowerCase().includes("crocs") ||
          Boolean(p.discipline?.toLowerCase().includes("crocs"))
        );
      }
      if (target === "natación" || target === "natacion") {
        return (
          Boolean(p.discipline?.toLowerCase().includes("nataci")) ||
          p.category.toLowerCase().includes("nataci") ||
          p.category.toLowerCase().includes("malla") ||
          p.category.toLowerCase().includes("antipar") ||
          p.name.toLowerCase().includes("speedo") ||
          p.name.toLowerCase().includes("nataci")
        );
      }
      if (target === "vóley" || target === "voley") {
        return (
          Boolean(p.discipline?.toLowerCase().includes("voley")) ||
          Boolean(p.discipline?.toLowerCase().includes("vóley")) ||
          p.name.toLowerCase().includes("voley") ||
          p.name.toLowerCase().includes("v200w") ||
          p.brand.toLowerCase().includes("mikasa")
        );
      }
      return (
        p.category.toLowerCase().includes(target) ||
        Boolean(p.discipline?.toLowerCase().includes(target)) ||
        p.brand.toLowerCase().includes(target)
      );
    });

    if (sortBy === "menor-precio") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "mayor-precio") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, selectedCategory, sortBy]);

  const handleAddProductFromModal = (prod: EcommerceProduct) => {
    const payload = buildCartItemFromEcommerceProduct(
      prod,
      selectedQuickVariantId,
      1
    );
    if (!payload) return;

    const res = addItem(payload);
    if (res.added) {
      setAddedNotice(`${payload.name} (${payload.size} • ${payload.color})`);
      setTimeout(() => setAddedNotice(null), 3000);
      openDrawer();
    }
  };

  const selectedModalVariant = activeModalProduct?.variants?.find(
    (v) => v.id === selectedQuickVariantId
  );
  const modalHasRealVariants = Boolean(
    activeModalProduct?.variants && activeModalProduct.variants.length > 0
  );
  const modalDisplayPrice =
    selectedModalVariant?.price && selectedModalVariant.price > 0
      ? selectedModalVariant.price
      : activeModalProduct?.price ?? 0;

  return (
    <section id="productos" className="w-full py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00A811]">
              ELEGIDOS PARA VOS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black italic tracking-tight text-slate-950 uppercase">
              PRODUCTOS DESTACADOS
            </h2>
          </div>

          <div className="inline-flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#00D615] animate-ping" />
            <span>Stock en tiempo real • Saavedra 241</span>
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sub-bar: Counter and Sort By */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500 font-medium">
          <span>{filteredProducts.length} productos disponibles</span>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Ordenar por:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value;
                  if (
                    val === "destacados" ||
                    val === "menor-precio" ||
                    val === "mayor-precio"
                  ) {
                    setSortBy(val);
                  }
                }}
                className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-800 outline-none hover:border-slate-300 focus:border-[#00D615] cursor-pointer"
              >
                <option value="destacados">Destacados</option>
                <option value="menor-precio">Menor precio</option>
                <option value="mayor-precio">Mayor precio</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-bold text-slate-700">
              No encontramos productos en esta categoría por el momento.
            </p>
            <button
              type="button"
              onClick={() => setSelectedCategory("Todos")}
              className="text-xs font-bold text-[#00A811] hover:underline cursor-pointer"
            >
              Ver todos los productos disponibles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isOutOfStock =
                product.hasStock === false || product.totalAvailableStock === 0;
              const isLowStock =
                !isOutOfStock &&
                product.totalAvailableStock !== undefined &&
                product.totalAvailableStock > 0 &&
                product.totalAvailableStock <= 3;
              const isNavigatingThis = navigatingProductId === product.id;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-400 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Product Card Top / Image Container */}
                  <div className="relative w-full aspect-square bg-[#f8fafc] overflow-hidden p-4 flex items-center justify-center">
                    {product.isOffer && (
                      <span className="absolute top-3 left-3 z-10 bg-[#c2f25b] text-slate-950 font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-sm pointer-events-none">
                        {product.offerTag || "OFERTA"}
                      </span>
                    )}

                    {isOutOfStock ? (
                      <span className="absolute top-3 right-3 z-10 bg-slate-800 text-slate-100 font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-sm pointer-events-none">
                        Agotado
                      </span>
                    ) : isLowStock ? (
                      <span className="absolute top-3 right-3 z-10 bg-amber-500 text-slate-950 font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-sm pointer-events-none">
                        ¡Últimas {product.totalAvailableStock}!
                      </span>
                    ) : null}

                    <Link
                      href={`/productos/${product.id}`}
                      prefetch={false}
                      onClick={(e) => navigateToProduct(e, product)}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <img
                        src={product.image || "/placeholder-product.svg"}
                        alt={product.name}
                        className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder-product.svg";
                        }}
                      />
                    </Link>

                    {/* Botón compacto de Vista Rápida sin cubrir toda la imagen */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openQuickView(product);
                      }}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-[11px] bg-slate-950/85 hover:bg-slate-950 backdrop-blur-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
                      title="Vista rápida"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#00D615]" />
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
                      <Link
                        href={`/productos/${product.id}`}
                        prefetch={false}
                        onClick={(e) => navigateToProduct(e, product)}
                        className="block"
                      >
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#00A811] transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="space-y-3 pt-1">
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

                      <div className="grid grid-cols-1 gap-2 relative z-10">
                        <Link
                          href={`/productos/${product.id}`}
                          prefetch={false}
                          onClick={(e) => navigateToProduct(e, product)}
                          className="w-full py-2.5 px-4 rounded-lg border border-slate-900 text-slate-900 font-bold text-xs uppercase tracking-wider hover:bg-slate-900 hover:text-white active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {isNavigatingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Abriendo...</span>
                            </>
                          ) : (
                            <>
                              <span>Ver producto</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Success Notice Notification */}
        {addedNotice && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500 animate-in slide-in-from-bottom duration-300">
            <div className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">{addedNotice}</p>
              <p className="text-[11px] text-slate-300">
                ¡Agregado al carrito con éxito!
              </p>
            </div>
          </div>
        )}

        {/* Modal: Vista Rápida */}
        {activeModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
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
                  <span className="absolute top-4 left-4 bg-[#c2f25b] text-slate-950 font-black text-xs px-2.5 py-1 rounded shadow-sm">
                    {activeModalProduct.offerTag || "OFERTA"}
                  </span>
                )}
                <img
                  src={activeModalProduct.image || "/placeholder-product.svg"}
                  alt={activeModalProduct.name}
                  className="max-h-72 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/placeholder-product.svg";
                  }}
                />
              </div>

              <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      {activeModalProduct.brand} • {activeModalProduct.category}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">
                      {activeModalProduct.name}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {activeModalProduct.description ||
                      "Artículo deportivo original garantizado por Matacos Deportes. Local a la calle en Saavedra 241, Formosa."}
                  </p>

                  <div className="pt-1">
                    {activeModalProduct.originalPrice && (
                      <span className="text-sm text-slate-400 line-through font-semibold block">
                        {formatCurrency(activeModalProduct.originalPrice)}
                      </span>
                    )}
                    <span className="text-2xl font-black text-[#00A811]">
                      {formatCurrency(modalDisplayPrice)}
                    </span>
                    <span className="block text-[11px] text-emerald-700 font-bold mt-1">
                      {activeModalProduct.installments ||
                        "3 y 6 cuotas sin interés en el local"}
                    </span>
                  </div>

                  {modalHasRealVariants ? (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Seleccioná variante (Talle / Color):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {activeModalProduct.variants!.map((v) => {
                          const isSelected = v.id === selectedQuickVariantId;
                          const out = !v.inStock || v.availableStock <= 0;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              disabled={out}
                              onClick={() => setSelectedQuickVariantId(v.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                isSelected
                                  ? "bg-slate-950 text-white border-slate-950"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                              }`}
                            >
                              {v.size} • {v.color}
                            </button>
                          );
                        })}
                      </div>
                      {selectedModalVariant && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Disponibles en esta variante:{" "}
                          <span className="text-emerald-700 font-bold">
                            {selectedModalVariant.availableStock} un.
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium">
                      Artículo ilustrativo de muestra. Iniciá la base de datos para ver talles reales.
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddProductFromModal(activeModalProduct);
                      setActiveModalProduct(null);
                    }}
                    disabled={
                      !modalHasRealVariants ||
                      !selectedModalVariant ||
                      !selectedModalVariant.inStock ||
                      selectedModalVariant.availableStock <= 0
                    }
                    className="w-full py-3.5 px-4 rounded-xl bg-[#00D615] hover:bg-[#00b812] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {!modalHasRealVariants
                        ? "Requiere catálogo activo"
                        : !selectedModalVariant ||
                            selectedModalVariant.availableStock <= 0
                          ? "Sin Stock"
                          : "Agregar al carrito"}
                    </span>
                  </button>

                  {modalHasRealVariants && (
                    <Link
                      href={`/productos/${activeModalProduct.id}`}
                      prefetch={false}
                      onClick={(e) => {
                        const target = activeModalProduct;
                        setActiveModalProduct(null);
                        navigateToProduct(e, target);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Ver ficha y selector de talles</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  <p className="text-[10px] text-center text-slate-400">
                    Retiro sin cargo en Saavedra 241, Formosa
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
