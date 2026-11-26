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
  Package,
  LogOut,
  Lock,
  ChevronRight,
  Store,
} from "lucide-react";
import { getPredictiveSearch } from "@/server/actions/ecommerce/catalogActions";
import { getCurrentUserAction, logoutAction } from "@/server/actions/authActions";
import { getCurrentCustomerAction } from "@/server/actions/ecommerce/customerActions";
import type { PredictiveSearchItem } from "@/types/ecommerce";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/store/cartStore";
import { useCustomerStore } from "@/store/customerStore";

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

  const { customer, fetchCustomer, logout: logoutCustomerStore } = useCustomerStore();
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    level: number;
    profileName: string | null;
  } | null>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUserAction()
      .then((u) => {
        if (u) {
          setCurrentUser({
            name: u.name,
            email: u.email,
            level: u.level,
            profileName: u.profileName,
          });
          return;
        }
        fetchCustomer();
      })
      .catch(() => {});
  }, [fetchCustomer]);

  // Cerrar menú de usuario al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

  const handleLogoutCustomer = async () => {
    setIsUserMenuOpen(false);
    await logoutCustomerStore();
    router.push("/cuenta");
    router.refresh();
  };

  const handleLogoutStaff = async () => {
    setIsUserMenuOpen(false);
    await logoutAction();
    setCurrentUser(null);
    router.push("/cuenta");
    router.refresh();
  };

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
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[13px] font-bold tracking-wider text-slate-800 uppercase">
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
          <Link
            href="/sobre-nosotros"
            className="hover:text-[#00A811] transition-colors pb-1 whitespace-nowrap"
          >
            <span>SOBRE NOSOTROS</span>
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


          {/* User Account Popover (Personita) */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen((prev) => !prev);
                if (isSearchOpen) setIsSearchOpen(false);
              }}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors cursor-pointer relative"
              title={
                currentUser
                  ? `Sesión activa: ${currentUser.name}`
                  : customer
                  ? `Cuenta: ${customer.name}`
                  : "Mi Cuenta y Favoritos"
              }
              aria-label="Cuenta de usuario"
              aria-expanded={isUserMenuOpen}
            >
              {currentUser ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-[#00D615] font-black text-[11px] flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden md:inline max-w-24 truncate">
                    {currentUser.name.split(" ")[0]}
                  </span>
                </span>
              ) : customer ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 font-black text-[11px] flex items-center justify-center">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden md:inline max-w-24 truncate">
                    {customer.name.split(" ")[0]}
                  </span>
                </span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>

            {/* Dropdown Popover de la Personita */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                {customer ? (
                  /* 1. Cliente logueado — estilo MercadoLibre */
                  <div>
                    {/* Cabecera: avatar + nombre + email + chevron arriba */}
                    <div className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-slate-100">
                      <div className="w-11 h-11 rounded-full bg-[#00D615] text-slate-950 font-black text-base flex items-center justify-center shrink-0 shadow-sm select-none">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">
                          {customer.name.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {customer.email}
                        </p>
                      </div>
                    </div>

                    {/* Lista de ítems estilo ML — solo texto, sin íconos */}
                    <nav className="py-2">
                      <Link
                        href="/cuenta?tab=compras"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-3 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-normal"
                      >
                        Compras
                      </Link>
                      <Link
                        href="/cuenta?tab=favoritos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center justify-between px-5 py-3 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-normal"
                      >
                        <span>Favoritos</span>
                        {(customer.favoriteProductIds?.length || 0) > 0 && (
                          <span className="text-[11px] font-bold text-white bg-rose-500 min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center">
                            {customer.favoriteProductIds.length}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/cuenta?tab=pedidos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-3 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-normal"
                      >
                        Pedidos
                      </Link>
                      <div className="my-1 mx-5 border-t border-slate-100" />
                      <Link
                        href="/cuenta?tab=preguntas"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-3 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-normal"
                      >
                        Preguntas frecuentes
                      </Link>
                      <Link
                        href="/cuenta?tab=opiniones"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-3 text-[14px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-normal"
                      >
                        Opiniones
                      </Link>
                    </nav>

                    {/* Cerrar sesión */}
                    <div className="border-t border-slate-100 px-5 py-3">
                      <button
                        type="button"
                        onClick={handleLogoutCustomer}
                        className="flex items-center gap-2 text-[14px] text-rose-500 hover:text-rose-700 transition-colors cursor-pointer font-normal"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                ) : currentUser ? (
                  /* 2. Staff / Administrador logueado */
                  <div className="divide-y divide-slate-100">
                    <div className="p-4 bg-slate-950 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-[#00D615] font-black text-sm flex items-center justify-center shrink-0 border border-emerald-500/40">
                          {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-white truncate uppercase tracking-tight">
                            {currentUser.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {currentUser.email}
                          </p>
                          <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider text-[#00D615] bg-[#00D615]/20 px-1.5 py-0.5 rounded">
                            {currentUser.profileName || "Personal Matacos"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 space-y-1">
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              Panel de Gestión
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Métricas, inventario y ventas
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <Link
                        href="/pos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              Punto de Venta (POS)
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Mostrador Saavedra 241
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    <div className="p-2 bg-slate-50">
                      <button
                        type="button"
                        onClick={handleLogoutStaff}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3. No está logueado: Aviso claro para iniciar sesión y ver favoritos */
                  <div className="p-4 space-y-3.5">
                    <div className="text-center space-y-1">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
                        <Heart className="w-6 h-6 fill-amber-500 text-amber-500" />
                      </div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight pt-1">
                        ¿Querés ver tus favoritos?
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                        Tenés que iniciar sesión en tu cuenta para acceder a tu lista de artículos guardados y gestionar tus pedidos.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <Link
                        href="/cuenta?mode=login&redirect=/cuenta?tab=favoritos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full py-2.5 px-4 bg-[#00D615] hover:bg-[#00ba13] text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider text-center block shadow-md shadow-[#00D615]/20 active:scale-98 transition-all cursor-pointer"
                      >
                        Iniciar Sesión
                      </Link>

                      <Link
                        href="/cuenta?mode=register&redirect=/cuenta?tab=favoritos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider text-center block transition-colors cursor-pointer"
                      >
                        Crear Cuenta Nueva
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400">
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Acceso seguro a tu perfil</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
              <Link
                href="/catalogo?sort=disciplina"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#00A811] py-2 border-b border-slate-50 transition-colors"
              >
                DISCIPLINAS
              </Link>
              <Link
                href="/catalogo?sort=newest"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#00A811] py-2 border-b border-slate-50 transition-colors"
              >
                DESTACADOS
              </Link>
              <Link
                href="/catalogo?ofertas=true"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 text-red-600 font-extrabold hover:text-red-700 py-2 border-b border-slate-50 transition-colors"
              >
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span>OFERTAS</span>
              </Link>
              <Link
                href="/sobre-nosotros"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-[#00A811] py-2 border-b border-slate-50 transition-colors"
              >
                SOBRE NOSOTROS
              </Link>
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100 space-y-2.5">
              {/* Opción Mis Favoritos en menú móvil */}
              <Link
                href={customer ? "/cuenta?tab=favoritos" : "/cuenta?mode=login&redirect=/cuenta?tab=favoritos"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100/80 text-rose-950 border border-rose-200/80 rounded-xl font-bold text-xs uppercase transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>Mis Favoritos</span>
                </span>
                {customer?.favoriteProductIds?.length ? (
                  <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
                    {customer.favoriteProductIds.length}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-rose-700">
                    {customer ? "0" : "Ingresar"}
                  </span>
                )}
              </Link>

              <Link
                href={currentUser ? "/admin" : "/cuenta"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase"
              >
                <User className="w-4 h-4" />
                <span>
                  {currentUser
                    ? "Panel de Gestión"
                    : customer
                    ? "Mi Cuenta"
                    : "Iniciar Sesión / Mi Cuenta"}
                </span>
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
