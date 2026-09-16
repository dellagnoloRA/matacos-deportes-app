"use client";

import React from "react";
import { Bug, UserPlus, Radio, CheckCircle, X } from "lucide-react";

import { NotificationItem, ActivityItem, ProviderContact } from "./types";

interface SidebarRightProps {
  className?: string;
  onClose?: () => void;
  isMobile?: boolean;
}


const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "You fixed a bug.",
    time: "Just now",
    iconType: "bug",
  },
  {
    id: "2",
    title: "New user registered.",
    time: "59 minutes ago",
    iconType: "user",
  },
  {
    id: "3",
    title: "You fixed a bug.",
    time: "12 hours ago",
    iconType: "bug",
  },
  {
    id: "4",
    title: "Andi Lane subscribed to you.",
    time: "Today, 11:59 AM",
    iconType: "subscribe",
  },
];

const ACTIVITIES: ActivityItem[] = [
  {
    id: "a1",
    action: "Changed the style.",
    time: "Just now",
    avatarBg: "from-pink-500 to-rose-400",
    initials: "CS",
  },
  {
    id: "a2",
    action: "Released a new version.",
    time: "59 minutes ago",
    avatarBg: "from-amber-500 to-orange-500",
    initials: "NV",
  },
  {
    id: "a3",
    action: "Submitted a bug.",
    time: "12 hours ago",
    avatarBg: "from-blue-600 to-indigo-500",
    initials: "SB",
  },
  {
    id: "a4",
    action: "Modified A data in Page X.",
    time: "Today, 11:59 AM",
    avatarBg: "from-purple-800 to-slate-900",
    initials: "MD",
  },
  {
    id: "a5",
    action: "Deleted a page in Project X.",
    time: "Feb 2, 2026",
    avatarBg: "from-teal-500 to-emerald-600",
    initials: "DP",
  },
];

const PROVIDERS: ProviderContact[] = [
  {
    id: "p1",
    name: "Natali Craig",
    status: "online",
    avatarBg: "from-slate-700 to-slate-900",
    initials: "NC",
  },
  {
    id: "p2",
    name: "Drew Cano",
    status: "online",
    avatarBg: "from-stone-600 to-stone-800",
    initials: "DC",
  },
  {
    id: "p3",
    name: "Andi Lane",
    status: "offline",
    avatarBg: "from-zinc-500 to-zinc-700",
    initials: "AL",
  },
  {
    id: "p4",
    name: "Koray Okumus",
    status: "online",
    avatarBg: "from-neutral-700 to-neutral-900",
    initials: "KO",
  },
  {
    id: "p5",
    name: "Kate Morrison",
    status: "offline",
    avatarBg: "from-slate-600 to-slate-800",
    initials: "KM",
  },
  {
    id: "p6",
    name: "Melody Macy",
    status: "online",
    avatarBg: "from-gray-700 to-gray-900",
    initials: "MM",
  },
];

export function SidebarRight({ className = "", onClose, isMobile = false }: SidebarRightProps) {
  return (
    <aside
      className={`w-64 shrink-0 flex flex-col gap-6 py-5 px-4 bg-white/95 xl:bg-white/70 backdrop-blur-md xl:backdrop-blur-sm border-l border-slate-200/70 select-none overflow-y-auto ${className}`}
    >
      {/* 1. Notifications Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-800 tracking-tight">
            Notificaciones
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="xl:hidden p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {NOTIFICATIONS.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2.5 group cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 shrink-0 mt-0.5 group-hover:bg-slate-200">
                {item.iconType === "bug" && <Bug className="w-3 h-3" />}
                {item.iconType === "user" && <UserPlus className="w-3 h-3" />}
                {item.iconType === "subscribe" && <Radio className="w-3 h-3" />}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-800 leading-snug truncate">
                  {item.title}
                </span>
                <span className="text-[10.5px] text-slate-400">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Activities Section */}
      <div>
        <h3 className="text-xs font-semibold text-slate-800 tracking-tight mb-3">
          Actividades
        </h3>
        <div className="space-y-3">
          {ACTIVITIES.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-2.5 group cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-tr ${act.avatarBg} text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-xs ring-1 ring-white`}
              >
                {act.initials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-800 leading-snug truncate">
                  {act.action}
                </span>
                <span className="text-[10.5px] text-slate-400">{act.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Providers / Contacts Section */}
      <div>
        <h3 className="text-xs font-semibold text-slate-800 tracking-tight mb-3">
          Proveedores
        </h3>
        <div className="space-y-2.5">
          {PROVIDERS.map((prov) => (
            <div
              key={prov.id}
              className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-1 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-tr ${prov.avatarBg} text-white flex items-center justify-center text-[9.5px] font-semibold ring-1 ring-slate-200`}
                  >
                    {prov.initials}
                  </div>
                  {prov.status === "online" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 ring-1 ring-white" />
                  )}
                </div>
                <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 truncate">
                  {prov.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
