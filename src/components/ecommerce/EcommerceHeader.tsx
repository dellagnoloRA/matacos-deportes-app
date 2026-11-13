"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Heart,
  User,
  ShoppingBag,
  MessageCircle,
  Menu,
  X,
  Flame,
  Truck,
  CreditCard,
  Percent,
  MapPin,
  ShieldCheck,
  Loader2,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import { getPredictiveSearch } from "@/server/actions/ecommerce/catalogActions";
import type { PredictiveSearchItem } from "@/types/ecommerce";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/store/cartStore";

const ANNOUNCEMENTS = [
  { icon: Truck, text: "Envíos a todo el país", highlight: false },
  { icon: CreditCard, text: "Medios de pago", highlight: false },
  { icon: Percent, text: "3 y 6 Cuotas sin interés", highlight: true },
  { icon: MapPin, text: "Retiro gratis en Saavedra 241, Formosa", highlight: false },
  { icon: Flame, text: "Hasta 40% OFF en Ofertas de temporada", highlight: true },
  { icon: ShieldCheck, text: "Garantía oficial y cambio en el local", highlight: false },
];

interface EcommerceHeaderProps {
  cartCount?: number;
  wishlistCount?: number;
  onOpenCart?: () => void;
  onOpenSearch?: () => void;
  onSearchChange?: (query: string) => void;
}

export function EcommerceHeader({
  cartCount,
  wishlistCount = 0,
  onOpenCart,
  onOpenSearch,
  onSearchChange,
}: EcommerceHeaderProps) {
  const router = useRouter();
  const cart = useCart();
  const pathname = usePathname();
  const effectiveCartCount =
    cartCount !== undefined && cartCount > 0
      ? cartCount
      : cart.itemCount;
  const handleOpenCart = onOpenCart || cart.openDrawer;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictiveResults, setPredictiveResults] = useState<PredictiveSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, startTransition] = useTransition();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close search and dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setPredictiveResults([]);
      }
    }

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  // Debounced predictive search effect
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setPredictiveResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const res = await getPredictiveSearch(trimmed, 6);
        if (res.success && res.data) {
          setPredictiveResults(res.data);
        } else {
          setPredictiveResults([]);
        }
      } catch (err) {
        console.error("Error en búsqueda predictiva:", err);
        setPredictiveResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (onSearchChange) {
      onSearchChange(trimmed);
    }
    if (trimmed.length > 0) {
      setIsSearchOpen(false);
      setPredictiveResults([]);
      startTransition(() => {
        router.push(`/catalogo?search=${encodeURIComponent(trimmed)}`);
      });
    }
  };

  const handleSelectPredictiveItem = (productId: string) => {
    setIsSearchOpen(false);
    setPredictiveResults([]);
    startTransition(() => {
      router.push(`/productos/${productId}`);
    });
  };

  return (
    <header className="w-full bg-white sticky top-0 z-40 shadow-xs border-b border-slate-100">
      {/* 1. Top Announcement Marquee Ticker Tape */}
      <div className="bg-[#06241d] text-white text-[11px] sm:text-xs py-2.5 overflow-hidden border-b border-emerald-950/80 select-none relative group">
        <div className="animate-marquee flex items-center">
          {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-16 sm:px-24 shrink-0 transition-opacity hover:opacity-100 cursor-default"
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    item.highlight ? "text-[#00D615]" : "text-emerald-400"
                  }`}
                />
                <span
                  className={`tracking-wider whitespace-nowrap ${
                    item.highlight
                      ? "font-bold text-[#c2f25b]"
                      : "font-medium text-slate-100"
                  }`}
                >
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-20 flex items-center justify-between gap-6">
        {/* Left: Mobile hamburger & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/" className="flex items-center group">
            <img
              src="/matacos-deportes-logo.png"
              alt="Matacos Deportes"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-102"
            />
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold tracking-wider text-slate-800 uppercase">
          <Link
            href="/"
            className="group flex flex-col items-center pb-1 transition-colors hover:text-[#00A811]"
          >
            <span className={pathname === "/" ? "text-[#0d4a36] font-black" : "text-slate-800"}>
              INICIO
            </span>
            {pathname === "/" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D615] mt-0.5" />
            )}
          </Link>
          <Link
            href="/catalogo"
            className="group flex flex-col items-center pb-1 transition-colors hover:text-[#00A811]"
          >
<span className={pathname?.startsWith("/catalogo") || pathname?.startsWith("/productos") ? "text-[#0d4a36] font-black" : "text-slate-800"}>
              CATÁLOGO
            </span>
            {(pathname?.startsWith("/catalogo") || pathname?.startsWith("/productos")) && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D615] mt-0.5" />
            )}
          </Link>
          <Link
            href="/catalogo?sort=disciplina"
            className="hover:text-[#00A811] transition-colors pb-1"
          >
            DISCIPLINAS

          </Link>
          <Link
            href="/catalogo?sort=newest"
            className="hover:text-[#00A811] transition-colors pb-1"
          >
            DESTACADOS
          </Link>
          <Link
            href="/catalogo?ofertas=true"
            className="text-red-600 font-extrabold hover:text-red-700 transition-colors pb-1"

          >
            <span>OFERTAS</span>
          </Link>
        </nav>


        {/* Right: Actions (Search, Account, Cart - Idéntico a la captura) */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-slate-700">
          {/* Horizontal Expanding Search Bar (Colapsado por defecto como icono lupa) */}

          <div
            ref={searchContainerRef}
            className={`relative flex items-center transition-all duration-300 ease-in-out ${
              isSearchOpen

                ? "w-44 sm:w-64 md:w-80 bg-slate-100 border border-slate-300 rounded-full px-3 py-1.5 shadow-inner"

                : "w-9 h-9 justify-center"
            }`}
          >
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center w-full gap-2">

                <Search className="w-4 h-4 text-slate-400 shrink-0" />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (onSearchChange) onSearchChange(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsSearchOpen(false);
                      setPredictiveResults([]);
                    }
                  }}

                  placeholder="Buscar productos..."

                  className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPredictiveResults([]);
                      if (onSearchChange) onSearchChange("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-full shrink-0 cursor-pointer"
                    title="Borrar texto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"

                    onClick={() => setIsSearchOpen(false)}

                    className="p-1 text-slate-400 hover:text-slate-700 rounded-full shrink-0 cursor-pointer"
                    title="Cerrar buscador"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            ) : (
              <button

                type="button"

                onClick={() => {
                  setIsSearchOpen(true);
                  if (onOpenSearch) onOpenSearch();
                }}
                className="w-full h-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Buscar productos"
                aria-label="Buscar productos"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Predictive Results Dropdown Popover */}
            {isSearchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Sugerencias en tiempo real</span>
                  {isSearching && (
                    <span className="flex items-center gap-1 text-[#00A811]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Buscando...</span>
                    </span>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {predictiveResults.length > 0 ? (
                    predictiveResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectPredictiveItem(item.id)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-200/60 p-1 flex items-center justify-center">
                          <img
                            src={item.imageUrl || "/placeholder-product.svg"}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-[#00A811] transition-colors truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs font-black text-[#00A811]">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {item.availableStock > 0 ? `${item.availableStock} disp.` : "Agotado"}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : !isSearching ? (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700">No encontramos coincidencias para "{searchQuery}"</p>
                      <p className="text-[11px] text-slate-400">Probá buscando por marca o categoría.</p>
                    </div>
                  ) : null}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <Link
                    href={`/catalogo?search=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setPredictiveResults([]);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-900 hover:text-[#00A811] transition-colors w-full py-1.5"
                  >
                    <span>Ver todos los resultados en el catálogo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>


          {/* User Account Link */}
          <Link
            href="/cuenta"
            className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Mi Cuenta"
            aria-label="Cuenta de usuario"
          >
            <User className="w-5 h-5" />
          </Link>

          {/* Shopping Cart Button */}
          <button

            type="button"
            onClick={handleOpenCart}
            className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"

            title="Carrito de compras"
            aria-label="Carrito de compras"
          >
            <ShoppingBag className="w-5 h-5" />
            {effectiveCartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#00D615] text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {effectiveCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl z-50 flex flex-col p-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <img
                src="/matacos-deportes-logo.png"
                alt="Matacos Deportes"
                className="h-8 w-auto object-contain"
              />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-4 mt-6 text-sm font-bold uppercase tracking-wider text-slate-800">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[#00A811] py-2 border-b border-slate-50"
              >
                INICIO
              </Link>
              <Link
                href="/catalogo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#00A811] py-2 border-b border-slate-50 transition-colors"
              >
                CATÁLOGO
              </Link>
              <a
                href="#disciplinas"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#00A811] py-2 border-b border-slate-50 transition-colors"
              >
                DISCIPLINAS
              </a>
              <a
                href="#productos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#00A811] py-2 border-b border-slate-50 transition-colors"
              >
                PRODUCTOS
              </a>
              <a
                href="#ofertas"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-emerald-700 py-2 transition-colors"
              >
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span>OFERTAS</span>
              </a>
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100 space-y-3">
              <Link
                href="/admin"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase"
              >
                <User className="w-4 h-4" />
                <span>Panel de Gestión</span>
              </Link>
              <p className="text-[11px] text-center text-slate-400">
                Saavedra 241, Formosa Capital
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
