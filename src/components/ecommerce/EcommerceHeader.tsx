"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  User,
  ShoppingCart,
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

export interface UserSession {
  name: string;
  email?: string;
}

interface EcommerceHeaderProps {
  cartCount?: number;
  wishlistCount?: number;
  user?: UserSession | null;
  onOpenCart?: () => void;
  onOpenSearch?: () => void;
  onSearchChange?: (query: string) => void;
}

export function EcommerceHeader({
  cartCount = 2,
  wishlistCount = 0,
  user,
  onOpenCart,
  onOpenSearch,
  onSearchChange,
}: EcommerceHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentUser, setCurrentUser] = useState<UserSession | null>(user ?? null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Leer sesión de usuario desde localStorage si no se pasa por prop
  useEffect(() => {
    if (user !== undefined) {
      setCurrentUser(user);
      return;
    }
    try {
      const stored = localStorage.getItem("matacos_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, [user]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("matacos_user");
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsAccountOpen(false);
  };

  // Close search and account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setIsAccountOpen(false);
      }
    }

    if (isSearchOpen || isAccountOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (isSearchOpen) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, isAccountOpen]);

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

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold tracking-wider text-slate-800 uppercase">
          <Link
            href="/"
            className="group relative flex flex-col items-center pb-1.5 transition-colors"
          >
            <span
              className={`transition-colors ${
                pathname === "/"
                  ? "text-[#0d4a36] font-black"
                  : "text-slate-800 group-hover:text-[#00A811]"
              }`}
            >
              INICIO
            </span>
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-[#00A811] transition-all duration-200 ${
                pathname === "/" ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </Link>

          <Link
            href="/productos"
            className="group relative flex flex-col items-center pb-1.5 transition-colors"
          >
            <span
              className={`transition-colors ${
                pathname === "/productos"
                  ? "text-[#0d4a36] font-black"
                  : "text-slate-800 group-hover:text-[#00A811]"
              }`}
            >
              CATÁLOGO
            </span>
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-[#00A811] transition-all duration-200 ${
                pathname === "/productos" ? "w-full" : "w-0 group-hover:w-full"
              }`}
            />
          </Link>

          <Link
            href="/productos"
            className="group relative flex flex-col items-center pb-1.5 transition-colors"
          >
            <span className="text-slate-800 group-hover:text-[#00A811] transition-colors">
              DISCIPLINAS
            </span>
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#00A811] w-0 group-hover:w-full transition-all duration-200" />
          </Link>

          <Link
            href="/productos"
            className="group relative flex flex-col items-center pb-1.5 transition-colors"
          >
            <span className="text-slate-800 group-hover:text-[#00A811] transition-colors">
              DESTACADOS
            </span>
            <span className="absolute bottom-0 left-0 h-0.5 bg-[#00A811] w-0 group-hover:w-full transition-all duration-200" />
          </Link>

          <Link
            href="/productos"
            className="group relative flex flex-col items-center pb-1.5 transition-colors"
          >
            <span className="text-red-600 font-extrabold group-hover:text-red-700 transition-colors">
              OFERTAS
            </span>
            <span className="absolute bottom-0 left-0 h-0.5 bg-red-600 w-0 group-hover:w-full transition-all duration-200" />
          </Link>
        </nav>

        {/* Right: Actions (Search, Account & Dropdown, Cart) */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-slate-700">
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

          {/* User Account Button & Dropdown */}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setIsAccountOpen((prev) => !prev)}
              className={
                currentUser
                  ? "flex items-center gap-2 px-2 py-1 sm:py-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-left group cursor-pointer"
                  : "p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              }
              title={currentUser ? "Cuenta y Favoritos" : "Iniciar Sesión"}
              aria-expanded={isAccountOpen}
            >
              {currentUser ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden md:flex flex-col leading-tight select-none">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors max-w-[120px] truncate">
                      ¡Hola {currentUser.name}!
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                      Cuenta y Favoritos
                    </span>
                  </div>
                </>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            {/* Dropdown Menu Modal */}
            {isAccountOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Lengüita / piquito estilo tooltip apuntando al icono de usuario */}
                <div className="absolute -top-1.5 right-3.5 w-3 h-3 bg-[#f3f4f6] rotate-45 border-t border-l border-slate-200 z-10" />

                <div className="overflow-hidden rounded-lg">
                  {currentUser ? (
                    <>
                      {/* Header para usuario logueado */}
                      <div className="bg-[#f3f4f6] px-4 py-3 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center gap-2.5">
                          <User className="w-5 h-5 text-slate-800" />
                          <span className="font-bold text-slate-900 text-[15px] truncate max-w-[170px]">
                            ¡Hola {currentUser.name}!
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAccountOpen(false)}
                          className="text-slate-500 hover:text-slate-800 p-1 rounded-md transition-colors cursor-pointer"
                          title="Cerrar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Opciones exclusivas de usuario logueado */}
                      <div className="divide-y divide-slate-100 text-sm">
                        <Link
                          href="/login"
                          onClick={() => setIsAccountOpen(false)}
                          className="block px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                        >
                          Mi Cuenta
                        </Link>
                        <Link
                          href="/login"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4 text-slate-600 shrink-0" />
                          <span>Mis Pedidos</span>
                        </Link>
                        <Link
                          href="/productos"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center justify-between px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                        >
                          <span>Mis Favoritos</span>
                          {wishlistCount > 0 && (
                            <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          Cerrar Sesión
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Header para usuario NO logueado */}
                      <div className="bg-[#f3f4f6] px-4 py-3 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center gap-2.5">
                          <User className="w-5 h-5 text-slate-800" />
                          <span className="font-bold text-slate-900 text-[15px]">
                            Mi Cuenta
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAccountOpen(false)}
                          className="text-slate-500 hover:text-slate-800 p-1 rounded-md transition-colors cursor-pointer"
                          title="Cerrar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Contenido para usuario NO logueado con cuadro de información */}
                      <div className="p-4 space-y-3">
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Ingresá a tu cuenta para ver tus pedidos, favoritos y gestionar tus compras.
                        </p>
                        <Link
                          href="/login"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs uppercase tracking-wide transition-colors"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>INICIAR SESIÓN</span>
                        </Link>
                        <Link
                          href="/login?mode=register"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors"
                        >
                          <span>Registrarme</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart with Badge (Logo de carrito) */}
          <button
            onClick={onOpenCart}
            className="p-2 text-slate-800 hover:text-[#00A811] hover:bg-emerald-50 rounded-full transition-colors relative"
            title="Carrito de compras"
          >
            <ShoppingCart className="w-5 h-5" />
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
                className="text-red-600 font-extrabold py-2 transition-colors hover:text-red-700"
              >
                <span>OFERTAS</span>
              </Link>
            </nav>

            <div className="mt-auto pt-4 border-t border-slate-100 space-y-2.5">
              {currentUser ? (
                /* User Account Info Card (Usuario logueado) */
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">¡Hola {currentUser.name}!</p>
                      <p className="text-[10px] text-slate-500">Cuenta y Favoritos</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium text-center hover:bg-slate-100 transition-colors"
                    >
                      Mi Cuenta
                    </Link>
                    <Link
                      href="/productos"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium text-center hover:bg-slate-100 transition-colors"
                    >
                      Mis Favoritos
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="col-span-2 py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-slate-700 font-medium flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-600" />
                      <span>Mis Pedidos</span>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-1 text-center text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                /* Botones para usuario NO logueado */
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase"
                  >
                    <User className="w-4 h-4" />
                    <span>Iniciar Sesión</span>
                  </Link>
                  <Link
                    href="/login?mode=register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs transition-colors"
                  >
                    <span>Registrarme</span>
                  </Link>
                </div>
              )}

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
