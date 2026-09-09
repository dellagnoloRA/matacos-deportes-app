"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, PanelLeft } from "lucide-react";
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
  const [currentTab, setCurrentTab] = useState<"inventario" | "analytics">("inventario");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [isDesktopLeftOpen, setIsDesktopLeftOpen] = useState(true);
  const [isMobileLeftOpen, setIsMobileLeftOpen] = useState(false);
  const [isDesktopRightOpen, setIsDesktopRightOpen] = useState(true);
  const [isMobileRightOpen, setIsMobileRightOpen] = useState(false);

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
            activeItem={currentTab === "analytics" ? "inicio" : "inventario"}
            onSelectItem={(id) => {
              if (id === "inicio" || id === "analytics") {
                setCurrentTab("analytics");
              } else {
                setCurrentTab("inventario");
              }
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setCurrentTab("inventario");
            }}
            className="transition-all duration-300 hidden md:flex sticky top-0 h-screen overflow-y-auto shrink-0"
          />
        )}

        {/* 2. Main Content Area */}
        {currentTab === "inventario" ? (
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
                  {selectedCategory === "Todas" ? "Catálogo" : selectedCategory}
                </span>
              </div>
            </div>
            <InventoryView
              selectedDiscipline={selectedCategory}
              onDisciplineChange={(cat) => setSelectedCategory(cat)}
              initialProducts={initialProducts}
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
          activeItem={currentTab === "analytics" ? "inicio" : "inventario"}
          onSelectItem={(id) => {
            if (id === "inicio" || id === "analytics") {
              setCurrentTab("analytics");
            } else {
              setCurrentTab("inventario");
            }
          }}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setCurrentTab("inventario");
          }}
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
    </div>
  );
}
