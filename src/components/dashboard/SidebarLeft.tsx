"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  Sparkles,
  X,
  Home,
  BarChart3,
  Users,
  FolderTree,
  ChevronDown,
  Layers,
  Package,
  Ruler,
  Boxes as PacksIcon,
  Tag,
  MapPin,
  CalendarCheck2,
  Store,
  Globe,
  ReceiptText,
  AppWindow,
} from "lucide-react";

interface SidebarLeftProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
  activeItem?: string;
  onSelectItem?: (id: string) => void;
}

export function SidebarLeft({
  className = "",
  onClose,
  isMobile = false,
  activeItem = "inventario",
  onSelectItem,
}: SidebarLeftProps) {
  const [catalogOpen, setCatalogOpen] = useState(true);

  const handleItemClick = (id: string) => {
    if (onSelectItem) {
      onSelectItem(id);
    }
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`w-60 shrink-0 flex flex-col justify-between py-4 px-3.5 bg-white/95 md:bg-white/80 backdrop-blur-md border-r border-slate-200/70 select-none text-[12.5px] overflow-y-auto ${className}`}
    >
      {/* Top Brand & Profile */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1.5 py-1">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-800 flex items-center justify-center text-white text-xs font-bold shadow-xs ring-1 ring-slate-200">
              <span className="text-[11px] tracking-tight font-bold">MD</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                Matacos Deportes
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Saavedra 241, Formosa</span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-1 pt-1">
          {/* Inicio / Overview */}
          <button
            onClick={() => handleItemClick("analytics")}
            className={`flex items-center justify-between w-full py-2 px-2.5 rounded-xl transition-all ${
              activeItem === "inicio"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-slate-500" />
              <span>Inicio</span>
            </div>
          </button>

          {/* Analítica */}
          <button
            onClick={() => handleItemClick("analytics")}
            className={`flex items-center justify-between w-full py-2 px-2.5 rounded-xl transition-all ${
              activeItem === "analytics"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className={`w-4 h-4 ${activeItem === "analytics" ? "text-emerald-400" : "text-slate-500"}`} />
              <span>Analítica</span>
            </div>
          </button>

          {/* Catálogo (Dropdown Group matching reference) */}
          <div className="pt-1">
            <button
              onClick={() => setCatalogOpen((prev) => !prev)}
              className="flex items-center justify-between w-full py-2 px-2.5 text-slate-700 hover:bg-slate-100/80 rounded-xl transition-all font-semibold"
            >
              <div className="flex items-center gap-2.5">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                <span>Catálogo</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  catalogOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {catalogOpen && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-indigo-100 ml-4 my-1">
                {/* Productos (Principal) */}
                <button
                  onClick={() => handleItemClick("inventario")}
                  className={`flex items-center justify-between w-full py-1.5 px-2.5 rounded-lg text-xs transition-all ${
                    activeItem === "inventario"
                      ? "bg-indigo-50 text-indigo-950 font-bold border border-indigo-200/80 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${activeItem === "inventario" ? "bg-indigo-600" : "bg-slate-300"}`} />
                    <span>Productos</span>
                  </div>
                  {activeItem === "inventario" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>

                {/* Variantes */}
                <button
                  onClick={() => handleItemClick("inventario")}
                  className="flex items-center gap-2 w-full py-1.5 px-2.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>Variantes</span>
                </button>

                {/* Colecciones / Disciplinas */}
                <button
                  onClick={() => handleItemClick("inventario")}
                  className="flex items-center gap-2 w-full py-1.5 px-2.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>Colecciones</span>
                </button>

                {/* Ubicaciones */}
                <button
                  onClick={() => handleItemClick("inventario")}
                  className="flex items-center gap-2 w-full py-1.5 px-2.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>Ubicaciones</span>
                </button>
              </div>
            )}
          </div>

          {/* Inventario */}
          <button
            onClick={() => handleItemClick("inventario")}
            className={`flex items-center justify-between w-full py-2 px-2.5 rounded-xl transition-all ${
              activeItem === "inventario_full"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Boxes className="w-4 h-4 text-slate-500" />
              <span>Inventario</span>
            </div>
          </button>

          {/* Tiendas / Mostrador Saavedra 241 */}
          <button
            onClick={() => handleItemClick("inventario")}
            className="flex items-center justify-between w-full py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-slate-500" />
              <span>Tienda Local (POS)</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Saavedra</span>
          </button>

          {/* Ecommerce */}
          <button
            onClick={() => handleItemClick("analytics")}
            className="flex items-center justify-between w-full py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>Ecommerce</span>
            </div>
          </button>

          {/* Facturación */}
          <button
            onClick={() => handleItemClick("analytics")}
            className="flex items-center justify-between w-full py-2 px-2.5 rounded-xl text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <ReceiptText className="w-4 h-4 text-slate-500" />
              <span>Facturación</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Footer / Status Indicator */}
      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between px-1 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-[11.5px] text-slate-700">POS Offline Ready</span>
        </div>
        <span className="text-[10px] text-slate-400">v2.4</span>
      </div>
    </aside>
  );
}
