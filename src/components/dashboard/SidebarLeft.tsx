"use client";

import React from "react";
import {
  Boxes,
  X,
  ShoppingBag,
  CircleDollarSign,
  Globe,
  Settings,
  LayoutDashboard,
} from "lucide-react";

interface SidebarLeftProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
  activeItem?: string;
  onSelectItem?: (id: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export function SidebarLeft({
  className = "",
  onClose,
  isMobile = false,
  activeItem = "inventario",
  onSelectItem,
}: SidebarLeftProps) {
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
      className={`w-64 shrink-0 flex flex-col justify-between py-5 px-4 bg-[#06241d] text-white select-none text-[12.5px] overflow-y-auto ${className}`}
    >
      {/* Top Brand Logo & Nav */}
      <div className="space-y-6">
        {/* Logo Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col cursor-pointer group">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#094d3f] to-[#042820] border border-[#00D615]/40 flex items-center justify-center text-[#00D615] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <span className="font-black italic text-xl tracking-tighter">M</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black italic text-[#00D615] text-[22px] tracking-tighter leading-none select-none drop-shadow-[0_2px_10px_rgba(0,214,21,0.25)]">
                  MATACOS
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-black italic text-[11.5px] text-white tracking-[0.2em] leading-none uppercase">
                    DEPORTES
                  </span>
                  <span className="text-[9px] text-[#00D615] font-bold -mt-0.5">®</span>
                </div>
              </div>
            </div>
            <span className="text-[11px] text-emerald-300/80 font-medium tracking-wide mt-2 pl-0.5">
              Saavedra 241, Formosa
            </span>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Navigation Menu */}
        <nav className="space-y-1.5 pt-1">
          {/* 1. Inicio / Dashboard Overview (Lourdes's Analytics) */}
          <button
            onClick={() => handleItemClick("inicio")}
            className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
              activeItem === "inicio" || activeItem === "analytics"
                ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className={`w-4 h-4 ${activeItem === "inicio" || activeItem === "analytics" ? "text-slate-950" : "text-emerald-300"}`} />
              <span>Inicio / Métricas</span>
            </div>
          </button>

          {/* 2. Inventario */}
          <button
            onClick={() => handleItemClick("inventario")}
            className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
              activeItem === "inventario"
                ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Boxes className={`w-4 h-4 ${activeItem === "inventario" ? "text-slate-950" : "text-emerald-300"}`} />
              <span>Inventario</span>
            </div>
          </button>

          {/* 3. Ventas POS */}
          <button
            onClick={() => handleItemClick("pos")}
            className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
              activeItem === "pos"
                ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className={`w-4 h-4 ${activeItem === "pos" ? "text-slate-950" : "text-emerald-300"}`} />
              <span>Ventas POS</span>
            </div>
          </button>

          {/* 4. Caja */}
          <button
            onClick={() => handleItemClick("caja")}
            className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
              activeItem === "caja"
                ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <CircleDollarSign className={`w-4 h-4 ${activeItem === "caja" ? "text-slate-950" : "text-emerald-300"}`} />
              <span>Caja</span>
            </div>
          </button>

          {/* 5. E-commerce */}
          <button
            onClick={() => handleItemClick("ecommerce")}
            className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
              activeItem === "ecommerce"
                ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className={`w-4 h-4 ${activeItem === "ecommerce" ? "text-slate-950" : "text-emerald-300"}`} />
              <span>E-commerce</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Configuración + User Profile Card */}
      <div className="space-y-3 pt-4 border-t border-emerald-800/60">
        {/* Configuración */}
        <button
          onClick={() => handleItemClick("configuracion")}
          className="flex items-center gap-3 w-full py-2 px-2.5 text-emerald-200/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors font-medium text-xs"
        >
          <Settings className="w-4 h-4 text-emerald-300" />
          <span>Configuración</span>
        </button>

        {/* User Profile Card (Inferior Izquierda como en Canva) */}
        <div className="bg-[#042820] border border-emerald-800/60 rounded-2xl p-2.5 flex items-center gap-3 shadow-inner">
          <div className="w-9 h-9 rounded-full bg-white text-[#063a2f] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-emerald-600/30">
            MS
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white leading-tight truncate">
              Martina Suárez
            </span>
            <span className="text-[10px] text-emerald-300 font-medium tracking-wide">
              Administración
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
