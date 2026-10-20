"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction, logoutAction } from "@/server/actions/authActions";
import { SessionPayload } from "@/lib/session";
import { LogOut } from "lucide-react";
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
  alertCount?: number;
  onOpenAlerts?: () => void;
}

export function TopHeader({
  onToggleLeftSidebar,
  onToggleRightSidebar,
  isLeftSidebarOpen = true,
  isRightSidebarOpen = true,
  alertCount = 0,
  onOpenAlerts,
}: TopHeaderProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionPayload | null>(null);

  useEffect(() => {
    getCurrentUserAction().then(setCurrentUser);
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="w-full bg-[#111215] text-slate-200 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg shadow-black/10 border border-neutral-800">
      {/* Left side: Icons & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleLeftSidebar}
          title="Alternar barra lateral"
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
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
          className={`hidden sm:flex p-1.5 rounded-lg transition-colors shrink-0 ${
            isStarred
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-400 hover:text-white hover:bg-neutral-800/70"
          }`}
        >
          <Star className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs select-none min-w-0 truncate">
          <span className="text-emerald-400 font-medium">Panel</span>
          <span className="text-slate-600">/</span>
          <span className="text-emerald-400 font-medium truncate">Métricas</span>
        </div>
      </div>

      {/* Right side: Search & Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Search Input Pill */}
        <div className="relative hidden md:flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-36 lg:w-52 bg-neutral-900/90 text-xs text-slate-100 placeholder-slate-500 pl-8 pr-7 py-1.5 rounded-xl border border-neutral-700/60 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          title="Modo de color"
          className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Sun className="w-4 h-4" />
        </button>

        {/* History / Clock Button */}
        <button
          title="Historial de actividad"
          className="hidden sm:flex p-1.5 text-slate-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Clock className="w-4 h-4" />
        </button>

        {/* Notifications Bell Button */}
        <button
          onClick={onOpenAlerts}
          title={alertCount > 0 ? `${alertCount} alertas de stock crítico` : "Centro de Alertas de Stock"}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 ? (
            <span className="min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full absolute -top-1 -right-1 flex items-center justify-center ring-2 ring-[#111215] animate-pulse">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          ) : (
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-neutral-950" />
          )}
        </button>

        {/* User Session Badge & Logout */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight">
                {currentUser.username || currentUser.name}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium leading-tight">
                {currentUser.profileName || "Personal"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar Sesión"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

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
