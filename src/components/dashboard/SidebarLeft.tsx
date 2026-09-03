"use client";

import React, { useState } from "react";
import {
  Boxes,
  X,
  Home,
  ChevronDown,
  Waves,
  Volleyball,
  Footprints,
  Dumbbell,
  Layers,
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

const INVENTORY_CATEGORIES = [
  { id: "Todas", label: "Todos los productos", icon: Layers },
  { id: "Natación", label: "Natación", icon: Waves },
  { id: "Vóley", label: "Vóley", icon: Volleyball },
  { id: "Crocs / Urbano", label: "Crocs / Urbano", icon: Footprints },
  { id: "Fitness", label: "Fitness", icon: Dumbbell },
];

export function SidebarLeft({
  className = "",
  onClose,
  isMobile = false,
  activeItem = "inventario",
  onSelectItem,
  selectedCategory = "Todas",
  onSelectCategory,
}: SidebarLeftProps) {
  const [inventoryOpen, setInventoryOpen] = useState(true);

  const handleCategoryClick = (category: string) => {
    if (onSelectItem) {
      onSelectItem("inventario");
    }
    if (onSelectCategory) {
      onSelectCategory(category);
    }
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleItemClick = (id: string) => {
    if (onSelectItem) {
      onSelectItem(id);
    }
    if (id === "inventario") {
      setInventoryOpen((prev) => !prev);
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
        <nav className="space-y-1.5 pt-1">
          {/* Inicio / Overview */}
          <button
            onClick={() => handleItemClick("inicio")}
            className={`flex items-center justify-between w-full py-2 px-2.5 rounded-xl transition-all ${
              activeItem === "inicio" || activeItem === "analytics"
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Home className={`w-4 h-4 ${activeItem === "inicio" || activeItem === "analytics" ? "text-emerald-400" : "text-slate-500"}`} />
              <span>Inicio</span>
            </div>
          </button>

          {/* Inventario (Dropdown Group with Categories) */}
          <div className="pt-0.5">
            <button
              onClick={() => {
                if (activeItem !== "inventario") {
                  handleItemClick("inventario");
                  setInventoryOpen(true);
                } else {
                  setInventoryOpen((prev) => !prev);
                }
              }}
              className={`flex items-center justify-between w-full py-2 px-2.5 rounded-xl transition-all font-semibold ${
                activeItem === "inventario"
                  ? "bg-indigo-50/80 text-indigo-950 border border-indigo-200/60"
                  : "text-slate-700 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-indigo-600" />
                <span>Inventario</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  inventoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {inventoryOpen && (
              <div className="pl-3 pr-1 py-1 space-y-1 border-l-2 border-indigo-100 ml-4 my-1">
                {INVENTORY_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected =
                    activeItem === "inventario" && selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`flex items-center justify-between w-full py-1.5 px-2.5 rounded-lg text-xs transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white font-semibold shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-200" : "text-slate-400"}`} />
                        <span>{cat.label}</span>
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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

