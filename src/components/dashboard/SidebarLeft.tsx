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
  Package,
  Layers,
  History,
  ChevronDown,
  ArrowRightLeft,
  Tag,
  Receipt,
  Lock,
} from "lucide-react";

interface SidebarLeftProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
  activeItem?: string;
  onSelectItem?: (id: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  pendingSalesCount?: number;
}

export function SidebarLeft({
  className = "",
  onClose,
  isMobile = false,
  activeItem = "inventario",
  onSelectItem,
  pendingSalesCount = 0,
}: SidebarLeftProps) {
  const isInventoryActive =
    activeItem === "inventario" || activeItem.startsWith("inventario-");

  const activeSubItem =
    activeItem === "inventario-tablas"
      ? "tablas"
      : activeItem === "inventario-movimientos"
      ? "movimientos"
      : activeItem === "inventario-historial" || activeItem === "inventario-precios"
      ? "historial"
      : "productos";

  const isPreventaActive =
    activeItem === "pos-preventa" ||
    activeItem === "preventa" ||
    activeItem === "pos";
  const isCajaActive =
    activeItem === "pos-cobrar" ||
    activeItem === "pos-historial" ||
    activeItem === "caja";

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

          {/* 2. Inventario con Sub-índices */}
          <div className="space-y-1">
            <button
              onClick={() => handleItemClick("inventario-productos")}
              className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
                isInventoryActive
                  ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                  : "text-emerald-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes className={`w-4 h-4 ${isInventoryActive ? "text-slate-950" : "text-emerald-300"}`} />
                <span>Inventario</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isInventoryActive ? "text-slate-950 rotate-0" : "text-emerald-400/60 -rotate-90"}`} />
            </button>

            {/* Sub-índices de Inventario */}
            {isInventoryActive && (
              <div className="ml-3 pl-3.5 border-l border-emerald-500/30 space-y-1 pt-1.5 pb-1 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => handleItemClick("inventario-productos")}
                  className={`flex items-center gap-2.5 w-full py-2 px-2.5 rounded-xl transition-all font-semibold text-xs ${
                    activeSubItem === "productos"
                      ? "bg-white/15 text-[#c2f25b] font-bold shadow-xs border border-[#c2f25b]/25"
                      : "text-emerald-200/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Package className={`w-3.5 h-3.5 ${activeSubItem === "productos" ? "text-[#c2f25b]" : "text-emerald-400"}`} />
                  <span>Productos</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleItemClick("inventario-tablas")}
                  className={`flex items-center gap-2.5 w-full py-2 px-2.5 rounded-xl transition-all font-semibold text-xs ${
                    activeSubItem === "tablas"
                      ? "bg-white/15 text-[#c2f25b] font-bold shadow-xs border border-[#c2f25b]/25"
                      : "text-emerald-200/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 ${activeSubItem === "tablas" ? "text-[#c2f25b]" : "text-emerald-400"}`} />
                  <span>Tablas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleItemClick("inventario-movimientos")}
                  className={`flex items-center gap-2.5 w-full py-2 px-2.5 rounded-xl transition-all font-semibold text-xs ${
                    activeSubItem === "movimientos"
                      ? "bg-white/15 text-[#c2f25b] font-bold shadow-xs border border-[#c2f25b]/25"
                      : "text-emerald-200/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <ArrowRightLeft className={`w-3.5 h-3.5 ${activeSubItem === "movimientos" ? "text-[#c2f25b]" : "text-emerald-400"}`} />
                  <span>Movimientos de Stock</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleItemClick("inventario-historial")}
                  className={`flex items-center gap-2.5 w-full py-2 px-2.5 rounded-xl transition-all font-semibold text-xs ${
                    activeSubItem === "historial"
                      ? "bg-white/15 text-[#c2f25b] font-bold shadow-xs border border-[#c2f25b]/25"
                      : "text-emerald-200/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Tag className={`w-3.5 h-3.5 ${activeSubItem === "historial" ? "text-[#c2f25b]" : "text-emerald-400"}`} />
                  <span>Ajustes de Precios</span>
                </button>
              </div>
            )}
          </div>


          <button
            onClick={() => handleItemClick("pos-preventa")}
            className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
              isPreventaActive
                ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className={`w-4 h-4 ${isPreventaActive ? "text-slate-950" : "text-emerald-300"}`} />
              <span>Preventa</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                isPreventaActive
                  ? "bg-slate-950/15 text-slate-950"
                  : "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
              }`}
            >
              Salón
            </span>
          </button>

          {/* 4. Caja (Cobro de Preventas y Arqueo) */}
          <button
            onClick={() => handleItemClick("pos-cobrar")}
            className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
              isCajaActive
                ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <CircleDollarSign className={`w-4 h-4 ${isCajaActive ? "text-slate-950" : "text-emerald-300"}`} />
              <span>Caja</span>
            </div>
            {pendingSalesCount > 0 ? (
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-5 text-center transition-colors ${
                  isCajaActive
                    ? "bg-slate-950 text-[#c2f25b]"
                    : "bg-amber-400 text-slate-950"
                }`}
              >
                {pendingSalesCount}
              </span>
            ) : (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isCajaActive ? "bg-slate-950/15 text-slate-950" : "text-emerald-400/60"
                }`}
              >
                Cobro
              </span>
            )}
          </button>

          {/* 5. Cajas y Arqueos (Historial y Auditoría RF-11) */}
          <button
            onClick={() => handleItemClick("pos-arqueo")}
            className={`flex items-center justify-between w-full py-3 px-3.5 rounded-2xl transition-all font-semibold ${
              activeItem === "pos-arqueo"
                ? "bg-[#c2f25b] text-slate-950 font-bold shadow-md"
                : "text-emerald-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Lock className={`w-4 h-4 ${activeItem === "pos-arqueo" ? "text-slate-950" : "text-emerald-300"}`} />
              <span>Arqueos de Caja</span>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                activeItem === "pos-arqueo" ? "bg-slate-950/15 text-slate-950" : "text-emerald-400/60"
              }`}
            >
              Auditoría
            </span>
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

      {/* Bottom Section: User Profile Card (Terminal Mostrador / Saavedra 241) */}
      <div className="space-y-3 pt-4 border-t border-emerald-800/60">
        <div className="bg-[#042820] border border-emerald-800/60 rounded-2xl p-2.5 flex items-center gap-3 shadow-inner">
          <div className="w-9 h-9 rounded-full bg-[#c2f25b] text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm ring-2 ring-emerald-400/40">
            POS
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white leading-tight truncate">
              Terminal Mostrador
            </span>
            <span className="text-[10.5px] text-emerald-300/80 font-medium tracking-wide">
              Saavedra 241
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
