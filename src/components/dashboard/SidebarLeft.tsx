"use client";

import React from "react";
import {
  LayoutDashboard,
  Boxes,
  Sparkles,
  X,
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
      className={`w-56 shrink-0 flex flex-col justify-between py-5 px-4 bg-white/95 md:bg-white/70 backdrop-blur-md md:backdrop-blur-sm border-r border-slate-200/70 select-none text-[13px] ${className}`}
    >
      {/* Top Section */}
      <div className="space-y-6">
        {/* User / Brand Profile & Mobile Close Button */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 flex items-center justify-center text-white text-xs font-semibold shadow-sm ring-1 ring-slate-200">
              <span className="text-[11px] tracking-tight font-medium">MD</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                Matacos
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dashboards / Menú Principal Section */}
        <div className="space-y-1.5">
          <div className="px-1 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
            Módulos
          </div>
          <nav className="space-y-1">
            {/* Dashboard / Analíticas */}
            <button
              onClick={() => handleItemClick("analytics")}
              className={`flex items-center justify-between w-full py-2 px-2.5 rounded-xl transition-all ${
                activeItem === "analytics"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeItem === "analytics" ? "text-emerald-400" : "text-slate-500"}`} />
                <span>Analíticas</span>
              </div>
            </button>

            {/* Inventario */}
            <button
              onClick={() => handleItemClick("inventario")}
              className={`flex items-center justify-between w-full py-2 px-2.5 rounded-xl transition-all ${
                activeItem === "inventario"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className={`w-4 h-4 ${activeItem === "inventario" ? "text-[#c2f25b]" : "text-slate-500"}`} />
                <span>Inventario</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer / Brand Logo */}
      <div className="pt-4 border-t border-slate-200/60 flex items-center gap-2 px-1">
        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-3 h-3" />
        </div>
        <span className="font-semibold text-xs tracking-tight text-slate-700">Matacos Deportes</span>
      </div>
    </aside>
  );
}
