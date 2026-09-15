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
  PanelLeft,
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

          {/* Close buttons (Mobile X and Desktop Collapse) */}
          {onClose && (
            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="md:hidden p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Cerrar menú"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="hidden md:flex p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Ocultar menú lateral"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main Navigation Menu */}
        <nav className="space-y-1.5 pt-1">
          {/* 1. Inicio / Dashboard Overview (Bloqueado) */}
          <button
            disabled
            className="flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold opacity-50 cursor-not-allowed text-emerald-100"
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4 text-emerald-300" />
              <span>Inicio / Métricas</span>
            </div>
            <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pronto</span>
          </button>

          {/* 2. Inventario (Activo) */}
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

          {/* 3. Ventas POS (Bloqueado) */}
          <button
            disabled
            className="flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold opacity-50 cursor-not-allowed text-emerald-100"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span>Ventas POS</span>
            </div>
            <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pronto</span>
          </button>

          {/* 4. Caja (Bloqueado) */}
          <button
            disabled
            className="flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold opacity-50 cursor-not-allowed text-emerald-100"
          >
            <div className="flex items-center gap-3">
              <CircleDollarSign className="w-4 h-4 text-emerald-300" />
              <span>Caja</span>
            </div>
            <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pronto</span>
          </button>

          {/* 5. E-commerce (Bloqueado) */}
          <button
            disabled
            className="flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold opacity-50 cursor-not-allowed text-emerald-100"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-emerald-300" />
              <span>E-commerce</span>
            </div>
            <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pronto</span>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Configuración + User Profile Card */}
      <div className="space-y-3 pt-4 border-t border-emerald-800/60">
        {/* Configuración (Bloqueado) */}
        <button
          disabled
          className="flex items-center justify-between w-full py-2 px-2.5 text-emerald-200/50 cursor-not-allowed rounded-xl transition-colors font-medium text-xs"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-emerald-300/50" />
            <span>Configuración general</span>
          </div>
          <span className="text-[9px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Pronto</span>
        </button>

        {/* User Profile Card (Cambiado a perfil de mostrador) */}
        <div className="bg-[#042820] border border-emerald-800/60 rounded-2xl p-2.5 flex items-center gap-3 shadow-inner">
          <div className="w-9 h-9 rounded-full bg-slate-800 text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-emerald-900/50">
            LOC
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white leading-tight truncate">
              Sesión Local
            </span>
            <span className="text-[10px] text-emerald-300 font-medium tracking-wide">
              Mostrador
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
