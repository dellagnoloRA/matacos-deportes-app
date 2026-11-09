"use client";

import React from "react";
import {
  AlertTriangle,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  X,
} from "lucide-react";
import type {
  SidebarAlertItemDTO,
  SidebarActivityItemDTO,
  SidebarStaffItemDTO,
} from "@/schemas/analytics";

interface SidebarRightProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
  notifications?: SidebarAlertItemDTO[];
  activities?: SidebarActivityItemDTO[];
  staff?: SidebarStaffItemDTO[];
  onNavigateTab?: (tabId: string) => void;
}

const DEFAULT_NOTIFICATIONS: SidebarAlertItemDTO[] = [
  {
    id: "default-1",
    title: "Monitoreo de stock activo",
    subtitle: "Control dual Salón y Depósito",
    time: "Tiempo real",
    iconType: "bug",
    severity: "info",
    targetTab: "inventario",
  },
  {
    id: "default-2",
    title: "Conciliación de pagos web",
    subtitle: "Mercado Pago y Transferencias",
    time: "Operativo",
    iconType: "subscribe",
    severity: "success",
    targetTab: "ecommerce",
  },
];

const DEFAULT_ACTIVITIES: SidebarActivityItemDTO[] = [
  {
    id: "act-1",
    action: "Sistema sincronizado",
    detail: "Base de datos PostgreSQL activa",
    time: "Recién",
    avatarBg: "from-emerald-600 to-teal-700",
    initials: "MD",
  },
];

const DEFAULT_STAFF: SidebarStaffItemDTO[] = [
  {
    id: "staff-1",
    name: "Administrador Matacos",
    roleLabel: "Administrador",
    status: "online",
    avatarBg: "from-slate-700 to-slate-900",
    initials: "AM",
  },
];

export function SidebarRight({
  className = "",
  onClose,
  notifications,
  activities,
  staff,
  onNavigateTab,
}: SidebarRightProps) {
  const alertList =
    notifications && notifications.length > 0
      ? notifications
      : DEFAULT_NOTIFICATIONS;
  const activityList =
    activities && activities.length > 0 ? activities : DEFAULT_ACTIVITIES;
  const staffList = staff && staff.length > 0 ? staff : DEFAULT_STAFF;

  return (
    <aside
      className={`w-80 shrink-0 flex flex-col gap-6 py-5 px-5 bg-white border-l border-slate-300/90 shadow-lg select-none overflow-y-auto ${className}`}
    >
      {/* 1. Alertas Operativas Section */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Alertas Operativas
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Ocultar panel lateral"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="space-y-2.5">
          {alertList.map((item) => (
            <div
              key={item.id}
              onClick={() => item.targetTab && onNavigateTab?.(item.targetTab)}
              className="flex items-start gap-3 group cursor-pointer bg-slate-50/90 hover:bg-emerald-50/50 p-2.5 rounded-xl transition-colors border border-slate-200/80 hover:border-emerald-300"
            >
              <div
                className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  item.severity === "critical"
                    ? "bg-rose-100 text-rose-700 border border-rose-300"
                    : item.severity === "warning"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : item.severity === "success"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {item.severity === "critical" || item.severity === "warning" ? (
                  <AlertTriangle className="w-4 h-4 stroke-[2]" />
                ) : item.severity === "success" ? (
                  <Wallet className="w-4 h-4 stroke-[2]" />
                ) : (
                  <ShoppingBag className="w-4 h-4 stroke-[2]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                )}
                <span className="text-[11px] text-slate-500 font-semibold">
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Actividad en Vivo Section */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight pb-2.5 mb-3 border-b border-slate-200">
          Actividad en Vivo
        </h3>
        <div className="relative space-y-4 before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-200">
          {activityList.map((act) => (
            <div key={act.id} className="relative flex items-start gap-3 pl-0.5">
              <div
                className={`relative z-10 w-6 h-6 rounded-full bg-gradient-to-br ${act.avatarBg} text-white text-[10px] font-bold flex items-center justify-center shrink-0 ring-2 ring-white shadow-xs`}
              >
                {act.initials}
              </div>
              <div className="flex-1 min-w-0 -mt-0.5">
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                  {act.action}
                </p>
                {act.detail && (
                  <p className="text-xs font-medium text-slate-600 truncate">
                    {act.detail}
                  </p>
                )}
                <span className="text-[11px] font-medium text-slate-500">
                  {act.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Personal y Turnos Section */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight pb-2.5 mb-3 border-b border-slate-200">
          Equipo y Turnos
        </h3>
        <div className="space-y-2.5">
          {staffList.map((prov) => (
            <div
              key={prov.id}
              className="flex items-center justify-between group p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100 border border-slate-200/70 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full bg-gradient-to-br ${prov.avatarBg} text-white text-xs font-bold flex items-center justify-center shadow-xs`}
                  >
                    {prov.initials}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                      prov.status === "online"
                        ? "bg-emerald-500"
                        : prov.status === "busy"
                        ? "bg-sky-500"
                        : "bg-slate-300"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-slate-950 truncate block transition-colors">
                    {prov.name}
                  </span>
                  <span className="text-xs font-medium text-slate-500 truncate block">
                    {prov.roleLabel}
                  </span>
                </div>
              </div>

              <CheckCircle2
                className={`w-4 h-4 shrink-0 transition-colors ${
                  prov.status === "online"
                    ? "text-emerald-600"
                    : "text-slate-300 group-hover:text-emerald-500"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
