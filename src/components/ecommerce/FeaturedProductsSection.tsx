"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { EcommerceProduct } from "./types";
import { MOCK_FEATURED_PRODUCTS } from "./mockData";
import { ChevronDown, Eye, Check, ShoppingBag, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FeaturedProductsSectionProps {
  products?: EcommerceProduct[];
  onAddToCart?: (product: EcommerceProduct) => void;
}

const CATEGORY_TABS = [
  "Todos",
  "Calzado",
  "Indumentaria",
  "Accesorios",
  "Mochilas y bolsos",
  "Equipamiento deportivo",
  "Crocs",
];

export function FeaturedProductsSection({
  products = MOCK_FEATURED_PRODUCTS,
  onAddToCart,
}: FeaturedProductsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [sortBy, setSortBy] = useState<"destacados" | "menor-precio" | "mayor-precio">("destacados");
  const [activeModalProduct, setActiveModalProduct] = useState<EcommerceProduct | null>(null);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Formatter matching screenshot: $ 99.900
  const formatPrice = (amount: number) => {
    return formatCurrency(amount).replace(/,00$/, "");
  };

  // Filter products by selected tab
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "Todos") {
      list = list.filter((p) => {
        if (selectedCategory.toLowerCase() === "crocs") {
          return p.brand.toLowerCase() === "crocs" || p.name.toLowerCase().includes("crocs");
        }
        return p.category.toLowerCase() === selectedCategory.toLowerCase();
      });
    }

    if (sortBy === "menor-precio") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "mayor-precio") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  }, [products, selectedCategory, sortBy]);

  const handleAddProduct = (prod: EcommerceProduct) => {
    onAddToCart?.(prod);
    setAddedNotice(prod.name);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  return (
    <section id="productos" className="w-full py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header with sample indicator */}
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
            <span>Productos y precios de muestra</span>
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-slate-950 text-white shadow-xs"
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
          <span>{filteredProducts.length} productos de muestra</span>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Ordenar por:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
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

        {/* Product Grid: 4 columns on desktop, 2 on tablet/mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-2xl border border-slate-200/90 hover:border-slate-400 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Product Card Top / Image Container */}
              <div className="relative w-full aspect-square bg-[#f8fafc] overflow-hidden p-4 flex items-center justify-center">
                {/* Offer Tag */}
                {product.isOffer && (
                  <span className="absolute top-3 left-3 z-10 bg-[#c2f25b] text-slate-950 font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-xs">
                    {product.offerTag || "OFERTA"}
                  </span>
                )}

                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain object-center group-hover:scale-108 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Quick View Button Hover Overlay */}
                <button
                  onClick={() => setActiveModalProduct(product)}
                  className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white font-bold text-xs bg-black/40 backdrop-blur-2xs transition-opacity"
                  title="Vista rápida"
                >
                  <Eye className="w-4 h-4" />
                  <span>Vista Rápida</span>
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {product.brand}
                  </span>
                  <Link href={`/productos/${product.id}`} className="block">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#00A811] transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Pricing */}
                  <div className="min-h-10 flex flex-col justify-end">
                    {product.originalPrice ? (
                      <span className="text-xs text-slate-400 line-through font-medium">
                        {formatPrice(product.originalPrice)}
                      </span>
                    ) : null}
                    <span className="text-base font-extrabold text-[#00A811] tracking-tight">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  {/* Ver producto action button */}
                  <Link
                    href={`/productos/${product.id}`}
                    className="w-full py-2.5 px-4 rounded-lg border border-slate-900 text-slate-900 font-bold text-xs uppercase tracking-wider hover:bg-slate-900 hover:text-white active:scale-98 transition-all duration-150 text-center block"
                  >
                    Ver producto
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enlace para Ver Catálogo Completo */}
        <div className="pt-6 flex justify-center">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-slate-950 hover:bg-[#06241d] text-white text-xs sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-101 active:scale-98 group cursor-pointer"
          >
            <span>Ver todos los productos del catálogo</span>
            <span className="w-5 h-5 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center font-bold text-xs group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>

        {/* Success Notice Notification */}
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

        {/* Modal: Ver Producto / Detalle Rápido */}
        {activeModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row">
              {/* Close Button */}
              <button
                onClick={() => setActiveModalProduct(null)}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Image Side */}
              <div className="md:w-1/2 bg-[#f8fafc] p-8 flex items-center justify-center relative">
                {activeModalProduct.isOffer && (
                  <span className="absolute top-4 left-4 bg-[#c2f25b] text-slate-950 font-black text-xs px-2.5 py-1 rounded shadow-xs">
                    {activeModalProduct.offerTag || "OFERTA"}
                  </span>
                )}
                <img
                  src={activeModalProduct.image}
                  alt={activeModalProduct.name}
                  className="max-h-72 object-contain"
                />
              </div>

              {/* Details Side */}
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
                      "Materiales de alta durabilidad diseñados para resistir el entrenamiento intensivo y actividades outdoor."}
                  </p>

                  <div className="pt-2">
                    {activeModalProduct.originalPrice && (
                      <span className="text-sm text-slate-400 line-through font-semibold block">
                        {formatPrice(activeModalProduct.originalPrice)}
                      </span>
                    )}
                    <span className="text-2xl font-black text-[#00A811]">
                      {formatPrice(activeModalProduct.price)}
                    </span>
                    <span className="block text-[11px] text-emerald-700 font-bold mt-1">
                      {activeModalProduct.installments || "3 y 6 cuotas sin interés en el local"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleAddProduct(activeModalProduct);
                      setActiveModalProduct(null);
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 active:scale-98 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Agregar al carrito</span>
                  </button>
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
