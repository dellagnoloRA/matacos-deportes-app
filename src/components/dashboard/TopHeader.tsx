"use client";

import React, { useState } from "react";
import {
  Star,
  Search,
  Sun,
  Clock,
  Bell,
  PanelRight,
  PanelLeft,
  LayoutGrid,
} from "lucide-react";

interface TopHeaderProps {
  onToggleLeftSidebar?: () => void;
  onToggleRightSidebar?: () => void;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
}

export function TopHeader({
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isLeftSidebarOpen = true,
  isRightSidebarOpen = true,
}: TopHeaderProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="w-full bg-[#111215] text-slate-200 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg shadow-black/10 border border-neutral-800">
      {/* Left side: Icons & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleLeftSidebar}
          title="Alternar barra lateral"
          className={`p-1.5 rounded-lg transition-colors ${
            isLeftSidebarOpen
              ? "text-emerald-400 bg-neutral-800/90 shadow-2xs"
              : "text-slate-400 hover:text-white hover:bg-neutral-800/70"
          }`}
        >
          <PanelLeft className="w-4 h-4" />
        </button>


        <button
          onClick={() => setIsStarred(!isStarred)}
          title="Marcar favorito"
          className={`p-1.5 rounded-lg transition-colors ${
            isStarred
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-400 hover:text-white hover:bg-neutral-800/70"
          }`}
        >
          <Star className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-xs select-none">
          <span className="text-emerald-400 font-medium">Panel de Control</span>
          <span className="text-slate-600">/</span>
          <span className="text-emerald-400 font-medium">Analíticas</span>
        </div>
      </div>

      {/* Right side: Search & Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Search Input Pill */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar"
            className="w-44 lg:w-56 bg-neutral-900/90 text-xs text-slate-100 placeholder-slate-500 pl-8 pr-8 py-1.5 rounded-xl border border-neutral-700/60 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
          <span className="absolute right-2.5 text-[10px] bg-neutral-800 text-slate-400 px-1.5 py-0.5 rounded border border-neutral-700/50 font-mono">
            ⌘/
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          title="Modo de color"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Sun className="w-4 h-4" />
        </button>

        {/* History / Clock Button */}
        <button
          title="Historial de actividad"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Clock className="w-4 h-4" />
        </button>

        {/* Notifications Bell Button */}
        <button
          title="Notificaciones"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-neutral-950" />
        </button>

        {/* Right Sidebar Toggle */}
        <button
          onClick={onToggleRightSidebar}
          title={isRightSidebarOpen ? "Ocultar panel derecho" : "Mostrar panel derecho"}
          className={`p-1.5 rounded-lg transition-colors ${
            isRightSidebarOpen
              ? "text-emerald-400 bg-neutral-800/90"
              : "text-slate-400 hover:text-white hover:bg-neutral-800"
          }`}
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
