"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronDown, PanelLeft, Lock, Settings } from "lucide-react";
import { SidebarLeft } from "./SidebarLeft";
import { TopHeader } from "./TopHeader";
import { KpiCard } from "./KpiCard";
import { EarningsChart } from "./EarningsChart";
import { SalesChannelsMatrix } from "./SalesChannelsMatrix";
import { WebTrafficChart } from "./WebTrafficChart";
import { ProvinceTrafficChart } from "./ProvinceTrafficChart";
import { MarketingSeoCard } from "./MarketingSeoCard";
import { SidebarRight } from "./SidebarRight";
import { InventoryView } from "./InventoryView";
import { StockAlertsDrawer } from "./StockAlertsDrawer";
import { PosView } from "./PosView";
import { CashShiftHistoryView } from "./CashShiftHistoryView";
import { UsersManagementView } from "./UsersManagementView";
import { ProfilesManagementView } from "./ProfilesManagementView";
import { StoreSettingsView } from "./StoreSettingsView";
import { getCurrentUserAction } from "@/server/actions/authActions";
import { SessionPayload } from "@/lib/session";
import { getPendingSales } from "@/server/actions/posSaleActions";
import { DetailedProductItem, KpiData } from "./types";

const INITIAL_KPIS: KpiData[] = [
  {
    id: "kpi-sales",
    title: "Ventas",
    value: "7,265",
    change: "+11.01%",
    isPositive: true,
    isFeatured: true, // Glowing Neon Green card
  },
  {
    id: "kpi-orders",
    title: "Pedidos Online",
    value: "1,523",
    change: "+4.15%",
    isPositive: true,
  },
  {
    id: "kpi-customers",
    title: "Clientes",
    value: "948",
    change: "-1.24%",
    isPositive: false,
  },
  {
    id: "kpi-earnings",
    title: "Ganancias",
    value: "2,318",
    change: "+6.08%",
    isPositive: true,
  },
];

interface DashboardViewProps {
  initialProducts?: DetailedProductItem[];
}

export function DashboardView({ initialProducts }: DashboardViewProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<SessionPayload | null>(null);

  useEffect(() => {
    getCurrentUserAction().then(setCurrentUser);
  }, []);

  const hasPerm = useCallback((code: string) => {
    if (!currentUser) return false;
        return currentUser.permissions?.includes(code) ?? false;
  }, [currentUser]);

  // Pestaña actual sincronizada con la URL del navegador
  const currentTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "inicio" || tab === "analytics") return "analytics";
    if (tab === "pos") return "pos";
    if (tab === "caja") return "caja";
    if (tab === "ecommerce") return "ecommerce";
    if (tab === "configuracion") return "configuracion";
    if (tab === "usuarios") return "usuarios";
    if (tab === "perfiles") return "perfiles";
    return "inventario";
  }, [searchParams]);

  // Sub-vista de inventario sincronizada con la URL (productos, tablas, historial, movimientos)
  const currentInventorySubView = useMemo<"productos" | "tablas" | "historial" | "movimientos">(() => {
    const seccion = searchParams.get("seccion");
    if (seccion === "tablas") return "tablas";
    if (seccion === "historial" || seccion === "precios") return "historial";
    if (seccion === "movimientos") return "movimientos";
    return "productos";
  }, [searchParams]);

  // Sub-vista de POS sincronizada con la URL (preventa, cobrar, historial, arqueo)
  const currentPosSubView = useMemo<"preventa" | "cobrar" | "historial" | "arqueo">(() => {
    const seccion = searchParams.get("seccion");
    if (seccion === "cobrar") return "cobrar";
    if (seccion === "historial" || seccion === "transacciones") return "historial";
    if (seccion === "arqueo" || seccion === "cajas") return "arqueo";
    return "preventa";
  }, [searchParams]);

  // Contador de preventas pendientes para el badge de "Cobrar"
  const [pendingSalesCount, setPendingSalesCount] = useState(0);

  useEffect(() => {
    async function checkPending() {
      try {
        const res = await getPendingSales();
        if (res.success && Array.isArray(res.data)) {
          setPendingSalesCount(res.data.length);
        }
      } catch {}
    }
    checkPending();
  }, []);

  // Categoría/Disciplina seleccionada sincronizada con la URL
  const selectedCategory = useMemo(() => {
    return searchParams.get("categoria") || "Todas";
  }, [searchParams]);

  // ID del producto para vista de detalle sincronizado con la URL
  const urlProductId = searchParams.get("producto") || null;
  const [selectedProductId, setSelectedProductId] = useState<string | null>(urlProductId);

  // Sincronizar estado local cuando la URL cambia externamente (ej. botones Atrás/Adelante del navegador)
  useEffect(() => {
    setSelectedProductId(urlProductId);
  }, [urlProductId]);

  // Actualizar URL creando entradas en el historial del navegador (soporta botón Atrás y Adelante)
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      router.push(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleSelectTab = useCallback(
    (id: string) => {
      setSelectedProductId(null);
      if (id === "admin-usuarios" || id === "usuarios") {
        updateUrl({
          tab: "usuarios",
          seccion: null,
          categoria: null,
          producto: null,
        });
      } else if (id === "admin-perfiles" || id === "perfiles") {
        updateUrl({
          tab: "perfiles",
          seccion: null,
          categoria: null,
          producto: null,
        });
      } else if (id === "pos" || id === "pos-preventa" || id === "preventa") {
        updateUrl({
          tab: "pos",
          seccion: "preventa",
          producto: null,
        });
      } else if (id === "pos-cobrar" || id === "caja") {
        updateUrl({
          tab: "pos",
          seccion: "cobrar",
          producto: null,
        });
      } else if (id === "pos-historial" || id === "pos-transacciones") {
        updateUrl({
          tab: "pos",
          seccion: "historial",
          producto: null,
        });
      } else if (id === "pos-arqueo" || id === "arqueo" || id === "cajas") {
        updateUrl({
          tab: "pos",
          seccion: "arqueo",
          producto: null,
        });
      } else if (id === "inventario" || id === "inventario-productos") {
        updateUrl({
          tab: "inventario",
          seccion: null,
          producto: null,
        });
      } else if (id === "inventario-tablas") {
        updateUrl({
          tab: "inventario",
          seccion: "tablas",
          producto: null,
        });
      } else if (id === "inventario-historial" || id === "inventario-precios") {
        updateUrl({
          tab: "inventario",
          seccion: "historial",
          producto: null,
        });
      } else if (id === "inventario-movimientos") {
        updateUrl({
          tab: "inventario",
          seccion: "movimientos",
          producto: null,
        });
      } else {
        const targetTab = id === "analytics" ? "inicio" : id;
        updateUrl({
          tab: targetTab,
          seccion: null,
          producto: null,
        });
      }
    },
    [updateUrl]
  );

  const handleSelectCategory = useCallback(
    (category: string) => {
      setSelectedProductId(null);
      updateUrl({
        tab: "inventario",
        categoria: category === "Todas" ? null : category,
        producto: null,
      });
    },
    [updateUrl]
  );

  const handleSelectProduct = useCallback(
    (productId: string | null) => {
      setSelectedProductId(productId);
      updateUrl({
        tab: "inventario",
        producto: productId,
      });
    },
    [updateUrl]
  );

  const [isDesktopLeftOpen, setIsDesktopLeftOpen] = useState(true);
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isDesktopRightOpen, setIsDesktopRightOpen] = useState(true);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);

  // Estados de Alertas de Stock Crítico Globales (RF-06 / CU-INV-08)
  const [isGlobalAlertsDrawerOpen, setIsGlobalAlertsDrawerOpen] = useState(false);
  const [globalAlertsCount, setGlobalAlertsCount] = useState(0);

  const [timeFilter, setTimeFilter] = useState("Hoy");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);

  const timeOptions = ["Hoy", "Esta semana", "Este mes", "Año actual"];

  // Toggle Left Sidebar (Desktop / Responsive Drawer)
  const handleToggleLeft = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsMobileLeftOpen((prev) => !prev);
    } else {
      setIsDesktopLeftOpen((prev) => !prev);
    }
  };

  // Toggle Right Sidebar (Desktop / Responsive Drawer)
  const handleToggleRight = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setIsMobileRightOpen((prev) => !prev);
    } else {
      setIsDesktopRightOpen((prev) => !prev);
    }
  };

  // Close mobile drawers on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileLeftOpen(false);
        setIsMobileRightOpen(false);
        setIsTimeDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen w-full bg-white text-slate-800 flex font-sans antialiased select-none relative">
      {/* Main App Container (Full Width & Height) */}
      <div className="flex-1 flex w-full min-h-screen bg-white">
        {/* 1. Left Navigation Sidebar (Desktop Mode) */}
        {isDesktopLeftOpen && (
          <SidebarLeft
            activeItem={
              currentTab === "usuarios"
                ? "admin-usuarios"
                : currentTab === "perfiles"
                ? "admin-perfiles"
                : currentTab === "inventario"
                ? `inventario-${currentInventorySubView}`
                : currentTab === "pos"
                ? `pos-${currentPosSubView}`
                : currentTab === "analytics"
                ? "inicio"
                : currentTab
            }
            onSelectItem={handleSelectTab}
            onSelectCategory={handleSelectCategory}
            pendingSalesCount={pendingSalesCount}
            onClose={handleToggleLeft}
            className="transition-all duration-300 hidden md:flex sticky top-0 h-screen overflow-y-auto shrink-0"
          />
        )}

        {/* 2. Main Content Area */}
        {currentTab === "usuarios" ? (
          hasPerm("admin.usuarios") ? (
            <UsersManagementView />
          ) : (
            <div className="flex-1 p-8 text-center bg-white border border-rose-200 rounded-2xl m-6">
              <p className="text-sm font-bold text-rose-600">Acceso Restringido</p>
              <p className="text-xs text-slate-500 mt-1">
                Tu perfil no cuenta con permisos para gestionar personal (admin.usuarios).
              </p>
            </div>
          )
        ) : currentTab === "perfiles" ? (
          hasPerm("admin.perfiles") ? (
            <ProfilesManagementView />
          ) : (
            <div className="flex-1 p-8 text-center bg-white border border-rose-200 rounded-2xl m-6">
              <p className="text-sm font-bold text-rose-600">Acceso Restringido</p>
              <p className="text-xs text-slate-500 mt-1">
                Tu perfil no cuenta con permisos para gestionar perfiles (admin.perfiles).
              </p>
            </div>
          )
        ) : currentTab === "configuracion" ? (
          <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
            <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
              <div className="flex items-center gap-3">
                {handleToggleLeft && (
                  <button
                    onClick={handleToggleLeft}
                    className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    <PanelLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-600" />
                    <span>Configuración Comercial y Canales de Contacto</span>
                  </h1>
                  <p className="text-xs text-slate-500">
                    Edite el WhatsApp comercial, correos y datos del local con validación en tiempo real.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full">
              <StoreSettingsView />
            </div>
          </div>
        ) : currentTab === "pos" ? (
          currentPosSubView === "arqueo" ? (
            <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
              <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
                <div className="flex items-center gap-3">
                  {handleToggleLeft && (
                    <button
                      onClick={handleToggleLeft}
                      className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <PanelLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Lock className="w-5 h-5 text-indigo-600" />
                      <span>Auditoría e Historial de Turnos de Caja</span>
                    </h1>
                    <p className="text-xs text-slate-500">
                      Control de arqueos, fondos iniciales, diferencias y reimpresión de comprobantes en 80mm.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateUrl({ tab: "pos", seccion: "cobrar", producto: null })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
                  >
                    <span>Ir a Cobro en Caja</span>
                  </button>
                </div>
              </div>
              <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                {hasPerm("caja.auditoria_historial") ? (
                  <CashShiftHistoryView />
                ) : (
                  <div className="p-8 text-center bg-white border border-rose-200 rounded-2xl shadow-sm">
                    <p className="text-sm font-bold text-rose-600">Acceso Restringido</p>
                    <p className="text-xs text-slate-500 mt-1">Tu perfil no cuenta con permisos para auditar arqueos de caja (caja.auditoria_historial).</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <PosView
              initialProducts={initialProducts}
              subView={currentPosSubView}
              onNavigateSubView={(sub) =>
                updateUrl({ tab: "pos", seccion: sub, producto: null })
              }
              onPendingCountChange={setPendingSalesCount}
              isSidebarOpen={isDesktopLeftOpen}
              onToggleSidebar={handleToggleLeft}
            />
          )
        ) : currentTab === "inventario" ? (
          <div className="flex-1 flex flex-col min-w-0 bg-white relative min-h-screen">
            {/* Mobile Top App Bar for Inventory */}
            <div className="md:hidden px-4 py-3 bg-[#06241d] text-white flex items-center justify-between border-b border-emerald-950/60 sticky top-0 z-20 shadow-xs">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsMobileLeftOpen(true)}
                  className="flex items-center justify-center p-2 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors active:scale-95"
                  aria-label="Abrir menú"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#094d3f] border border-[#00D615]/40 flex items-center justify-center text-[#00D615] font-black italic text-sm">
                    M
                  </div>
                  <span className="font-black italic text-[#00D615] text-base tracking-tighter">
                    MATACOS
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-300/80 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                  {currentInventorySubView === "tablas"
                    ? "Tablas"
                    : currentInventorySubView === "historial"
                    ? "Historial"
                    : selectedCategory === "Todas"
                    ? "Catálogo"
                    : selectedCategory}
                </span>
              </div>
            </div>

            <InventoryView
              selectedDiscipline={selectedCategory}
              onDisciplineChange={handleSelectCategory}
              initialProducts={initialProducts}
              selectedProductId={selectedProductId}
              onProductChange={handleSelectProduct}
              isAlertsDrawerOpen={isGlobalAlertsDrawerOpen}
              onToggleAlertsDrawer={setIsGlobalAlertsDrawerOpen}
              onAlertsCountChange={setGlobalAlertsCount}
              isSidebarOpen={isDesktopLeftOpen}
              onToggleSidebar={handleToggleLeft}
              activeSubView={currentInventorySubView}
              onSubViewChange={(sub) => {
                handleSelectTab(sub === "productos" ? "inventario-productos" : `inventario-${sub}`);
              }}
            />
          </div>
        ) : (
          <main className="flex-1 flex flex-col min-w-0 bg-[#f4f5f7] overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
            {/* Top Capsule Dark Header */}
            <TopHeader
              onToggleLeftSidebar={handleToggleLeft}
              onToggleRightSidebar={handleToggleRight}
              isLeftSidebarOpen={isDesktopLeftOpen || isMobileLeftOpen}
              isRightSidebarOpen={isDesktopRightOpen || isMobileRightOpen}
              alertCount={globalAlertsCount}
              onOpenAlerts={() => setIsGlobalAlertsDrawerOpen(true)}
            />

            {/* Section Header: Overview + Time Filter */}
            <div className="flex items-center justify-between pt-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Overview
              </h1>

              {/* Time Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
                >
                  <span>{timeFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isTimeDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30 text-xs">
                    {timeOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setTimeFilter(opt);
                          setIsTimeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors ${
                          timeFilter === opt
                            ? "bg-emerald-50 text-emerald-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4 Top KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {INITIAL_KPIS.map((kpi) => (
                <KpiCard key={kpi.id} data={kpi} />
              ))}
            </section>

            {/* Middle Row: Total de Ganancias Chart (2/3) + Canales de venta Matrix (1/3) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
              <EarningsChart className="lg:col-span-2 min-h-[290px]" />
              <SalesChannelsMatrix className="lg:col-span-1 min-h-[290px]" />
            </section>

            {/* Bottom Row: Web Traffic (1/3) + Province Traffic (1/3) + Marketing & SEO (1/3) */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-4">
              <WebTrafficChart className="min-h-[240px]" />
              <ProvinceTrafficChart className="min-h-[240px]" />
              <MarketingSeoCard className="min-h-[240px]" />
            </section>
          </main>
        )}

        {/* 3. Right Sidebar Panel (Desktop Mode in Analytics View) */}
        {currentTab === "analytics" && isDesktopRightOpen && (
          <SidebarRight className="transition-all duration-300 hidden xl:flex sticky top-0 h-screen overflow-y-auto shrink-0" />
        )}
      </div>

      {/* ========================================================= */}
      {/* MOBILE / RESPONSIVE SLIDE-OVER DRAWERS & BACKDROPS         */}
      {/* ========================================================= */}

      {/* Left Mobile Drawer Backdrop */}
      {isMobileLeftOpen && (
        <div
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileLeftOpen(false)}
        />
      )}

      {/* Left Mobile Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 md:hidden w-72 max-w-[88vw] bg-[#06241d] shadow-2xl transition-transform duration-300 ease-in-out ${
          isMobileLeftOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        <SidebarLeft
          className="h-full w-full bg-[#06241d]"
          isMobile
          activeItem={
            currentTab === "usuarios"
              ? "admin-usuarios"
              : currentTab === "perfiles"
              ? "admin-perfiles"
              : currentTab === "inventario"
              ? `inventario-${currentInventorySubView}`
              : currentTab === "pos"
              ? `pos-${currentPosSubView}`
              : currentTab === "analytics"
              ? "inicio"
              : currentTab
          }
          onSelectItem={handleSelectTab}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          pendingSalesCount={pendingSalesCount}
          onClose={() => setIsMobileLeftOpen(false)}
        />
      </div>

      {/* Right Mobile Drawer Backdrop */}
      {isMobileRightOpen && currentTab === "analytics" && (
        <div
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 xl:hidden transition-opacity duration-300"
          onClick={() => setIsMobileRightOpen(false)}
        />
      )}

      {/* Right Mobile Drawer */}
      {currentTab === "analytics" && (
        <div
          className={`fixed top-0 bottom-0 right-0 z-50 xl:hidden w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            isMobileRightOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
          }`}
        >
          <SidebarRight
            className="h-full w-full bg-white"
            isMobile
            onClose={() => setIsMobileRightOpen(false)}
          />
        </div>
      )}

      {/* Drawer Global de Alertas de Stock Crítico (para vistas no-inventario) */}
      {currentTab !== "inventario" && (
        <StockAlertsDrawer
          isOpen={isGlobalAlertsDrawerOpen}
          onClose={() => setIsGlobalAlertsDrawerOpen(false)}
          products={initialProducts || []}
          onSelectProduct={(productId) => {
            setIsGlobalAlertsDrawerOpen(false);
            updateUrl({
              tab: "inventario",
              producto: productId,
            });
          }}
          onOpenStockMovement={(product) => {
            setIsGlobalAlertsDrawerOpen(false);
            updateUrl({
              tab: "inventario",
              producto: product.id,
            });
          }}
        />
      )}
    </div>
  );
}
