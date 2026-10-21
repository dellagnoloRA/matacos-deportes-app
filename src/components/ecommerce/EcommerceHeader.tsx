"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

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
  cartCount = 2,
  wishlistCount = 0,
  onOpenCart,
  onOpenSearch,
  onSearchChange,
}: EcommerceHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchQuery);
    }
  };

  return (
    <header className="w-full bg-white sticky top-0 z-40 shadow-xs border-b border-slate-100">
      {/* 1. Top Announcement Marquee Ticker Tape (Banda continua interactiva) */}
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
            className="lg:hidden p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
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

        {/* Center: Desktop Navigation Links (Idéntico a la captura) */}
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
            href="/productos"
            className="group flex flex-col items-center pb-1 transition-colors hover:text-[#00A811]"
          >
            <span className={pathname === "/productos" ? "text-[#0d4a36] font-black" : "text-slate-800"}>
              CATÁLOGO
            </span>
            {pathname === "/productos" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D615] mt-0.5" />
            )}
          </Link>
          <Link
            href="/productos"
            className="hover:text-[#00A811] transition-colors pb-1"
          >
            DISCIPLINAS
          </Link>
          <Link
            href="/productos"
            className="hover:text-[#00A811] transition-colors pb-1"
          >
            DESTACADOS
          </Link>
          <Link
            href="/productos"
            className="flex items-center gap-1.5 text-emerald-700 font-extrabold hover:text-emerald-800 transition-colors pb-1"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>OFERTAS</span>
          </Link>
        </nav>

        {/* Right: Actions (Search, WhatsApp, Wishlist, Account, Cart) */}
        <div className="flex items-center gap-2 sm:gap-3 text-slate-700">
          {/* Help / WhatsApp Support */}
          <a
            href="https://wa.me/5493704000000?text=Hola%20Matacos%20Deportes!%20Quiero%20consultar%20por%20un%20producto"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            title="Atención WhatsApp"
          >
            <MessageCircle className="w-5 h-5" />
          </a>

          {/* Horizontal Expanding Search Bar */}
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
                      if (onSearchChange) onSearchChange("");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-full shrink-0"
                    title="Borrar texto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-full shrink-0"
                    title="Cerrar buscador"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            ) : (
              <button
                onClick={() => {
                  setIsSearchOpen(true);
                  if (onOpenSearch) onOpenSearch();
                }}
                className="w-full h-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                title="Buscar productos"
                aria-label="Buscar productos"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Wishlist */}
          <button
            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors relative"
            title="Favoritos"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* User Account / Iniciar Sesión / Registrarse */}
          <Link
            href="/login"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            title="Iniciar Sesión / Registrarse"
          >
            <User className="w-5 h-5" />
          </Link>

          {/* Cart with Badge */}
          <button
            onClick={onOpenCart}
            className="p-2 text-slate-800 hover:text-[#00A811] hover:bg-emerald-50 rounded-full transition-colors relative"
            title="Carrito de compras"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#00D615] text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
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
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-4 mt-6 text-sm font-bold uppercase tracking-wider text-slate-800">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 border-b border-slate-50 ${
                  pathname === "/" ? "text-[#00A811] font-black" : "hover:text-[#00A811]"
                }`}
              >
                INICIO
              </Link>
              <Link
                href="/productos"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-2 border-b border-slate-50 transition-colors ${
                  pathname === "/productos" ? "text-[#00A811] font-black" : "hover:text-[#00A811]"
                }`}
              >
                PRODUCTOS
              </Link>
              <Link
                href="/productos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#00A811] py-2 border-b border-slate-50 transition-colors"
              >
                DISCIPLINAS
              </Link>
              <Link
                href="/productos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#00A811] py-2 border-b border-slate-50 transition-colors"
              >
                MARCAS
              </Link>
              <Link
                href="/productos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-emerald-700 py-2 transition-colors"
              >
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span>OFERTAS</span>
              </Link>
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100 space-y-2.5">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase"
              >
                <User className="w-4 h-4" />
                <span>Iniciar Sesión / Registrarse</span>
              </Link>
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase transition-colors"
              >
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
