"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Filter,
  Plus,
  Package,
  Boxes,
  Waves,
  Volleyball,
  Footprints,
  Dumbbell,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { InventoryItem, ProductDetailModal } from "./ProductDetailModal";

const INITIAL_PRODUCTS: InventoryItem[] = [
  {
    id: "p1",
    name: "Antiparras Cobra Ultra Mirror",
    brand: "Arena",
    discipline: "Natación",
    category: "Accesorios Natación",
    price: 68000,
    costPrice: 42000,
    sku: "NAT-ARE-001",
    barcode: "779123456701",
    stockLocal: 14,
    stockWeb: 8,
    minStock: 3,
    updatedAt: "14 Abr 2026 at 8:00 PM",
    iconBg: "from-sky-500 to-blue-600",
    variants: [
      { size: "Único", color: "Mirror Silver", stockLocal: 8, stockWeb: 5, barcode: "779123456701-1" },
      { size: "Único", color: "Mirror Gold", stockLocal: 6, stockWeb: 3, barcode: "779123456701-2" },
    ],
  },
  {
    id: "p2",
    name: "Pelota Vóley V200W Oficial FIVB",
    brand: "Mikasa",
    discipline: "Vóley",
    category: "Balones",
    price: 145000,
    costPrice: 98000,
    sku: "VOL-MIK-200",
    barcode: "779123456702",
    stockLocal: 6,
    stockWeb: 4,
    minStock: 2,
    updatedAt: "05 Abr 2026 at 7:00 PM",
    iconBg: "from-amber-400 to-yellow-600",
    variants: [
      { size: "N° 5", color: "Azul/Amarillo", stockLocal: 6, stockWeb: 4, barcode: "779123456702-1" },
    ],
  },
  {
    id: "p3",
    name: "Zapatillas Gel-Rocket 11 Indoor",
    brand: "Asics",
    discipline: "Vóley / Indoor",
    category: "Calzado",
    price: 120000,
    costPrice: 78000,
    sku: "CAL-ASI-011",
    barcode: "779123456703",
    stockLocal: 10,
    stockWeb: 5,
    minStock: 2,
    updatedAt: "02 Abr 2026 at 10:00 PM",
    iconBg: "from-indigo-500 to-blue-700",
    variants: [
      { size: "40", color: "Blanco/Azul", stockLocal: 3, stockWeb: 1, barcode: "779123456703-40" },
      { size: "41", color: "Blanco/Azul", stockLocal: 4, stockWeb: 2, barcode: "779123456703-41" },
      { size: "42", color: "Blanco/Azul", stockLocal: 3, stockWeb: 2, barcode: "779123456703-42" },
    ],
  },
  {
    id: "p4",
    name: "Crocs Classic Clog Unisex",
    brand: "Crocs",
    discipline: "Crocs / Urbano",
    category: "Calzado Urbano",
    price: 58000,
    costPrice: 34000,
    sku: "CRC-BLK-041",
    barcode: "779123456704",
    stockLocal: 22,
    stockWeb: 12,
    minStock: 5,
    updatedAt: "02 Abr 2026 at 6:00 AM",
    iconBg: "from-slate-700 to-slate-900",
    variants: [
      { size: "38", color: "Negro", stockLocal: 6, stockWeb: 3, barcode: "779123456704-38" },
      { size: "40", color: "Negro", stockLocal: 8, stockWeb: 5, barcode: "779123456704-40" },
      { size: "42", color: "Negro", stockLocal: 8, stockWeb: 4, barcode: "779123456704-42" },
    ],
  },
  {
    id: "p5",
    name: "Malla Competición Fastskin LZR",
    brand: "Speedo",
    discipline: "Natación",
    category: "Indumentaria Natación",
    price: 92000,
    costPrice: 59000,
    sku: "NAT-SPE-040",
    barcode: "779123456705",
    stockLocal: 8,
    stockWeb: 3,
    minStock: 2,
    updatedAt: "30 Mar 2026 at 9:00 PM",
    iconBg: "from-rose-500 to-red-600",
    variants: [
      { size: "M", color: "Negro/Dorado", stockLocal: 4, stockWeb: 1, barcode: "779123456705-M" },
      { size: "L", color: "Negro/Dorado", stockLocal: 4, stockWeb: 2, barcode: "779123456705-L" },
    ],
  },
  {
    id: "p6",
    name: "Cinturón de Levantamiento Cuero Pro",
    brand: "Matacos Fitness",
    discipline: "Fitness",
    category: "Accesorios Gym",
    price: 34500,
    costPrice: 19000,
    sku: "FIT-BEL-002",
    barcode: "779123456706",
    stockLocal: 15,
    stockWeb: 9,
    minStock: 3,
    updatedAt: "20 Mar 2026 at 9:00 PM",
    iconBg: "from-emerald-600 to-teal-700",
    variants: [
      { size: "M", color: "Negro", stockLocal: 8, stockWeb: 5, barcode: "779123456706-M" },
      { size: "L", color: "Negro", stockLocal: 7, stockWeb: 4, barcode: "779123456706-L" },
    ],
  },
  {
    id: "p7",
    name: "Gorra Silicona 3D Molded Soft",
    brand: "Arena",
    discipline: "Natación",
    category: "Accesorios Natación",
    price: 18500,
    costPrice: 9500,
    sku: "NAT-CAP-003",
    barcode: "779123456707",
    stockLocal: 35,
    stockWeb: 20,
    minStock: 8,
    updatedAt: "24 Mar 2026 at 8:00 PM",
    iconBg: "from-cyan-500 to-blue-500",
    variants: [
      { size: "Único", color: "Blanco", stockLocal: 20, stockWeb: 10, barcode: "779123456707-W" },
      { size: "Único", color: "Negro", stockLocal: 15, stockWeb: 10, barcode: "779123456707-B" },
    ],
  },
  {
    id: "p8",
    name: "Rodilleras Vóley Tokio Errea",
    brand: "Errea",
    discipline: "Vóley",
    category: "Protección Vóley",
    price: 29000,
    costPrice: 16000,
    sku: "VOL-ERR-005",
    barcode: "779123456708",
    stockLocal: 18,
    stockWeb: 11,
    minStock: 4,
    updatedAt: "10 Mar 2026 at 7:00 AM",
    iconBg: "from-blue-600 to-slate-800",
    variants: [
      { size: "M", color: "Azul Marino", stockLocal: 9, stockWeb: 6, barcode: "779123456708-M" },
      { size: "L", color: "Azul Marino", stockLocal: 9, stockWeb: 5, barcode: "779123456708-L" },
    ],
  },
];

const DISCIPLINES = [
  "Todas",
  "Natación",
  "Vóley",
  "Crocs / Urbano",
  "Fitness",
];

export function InventoryView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("Todas");
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter products by search and discipline
  const filteredProducts = useMemo(() => {
    return INITIAL_PRODUCTS.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.discipline.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDiscipline =
        selectedDiscipline === "Todas" ||
        item.discipline.toLowerCase().includes(selectedDiscipline.toLowerCase().split(" ")[0]);

      return matchesSearch && matchesDiscipline;
    });
  }, [searchQuery, selectedDiscipline]);

  const handleOpenDetail = (product: InventoryItem) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Header: Title + Search Icon, Bell, User Profile */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de stock local (Saavedra 241) y catálogo de e-commerce
          </p>
        </div>

        {/* User profile & quick action icons */}
        <div className="flex items-center gap-4">
          <button
            title="Buscar"
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            title="Notificaciones"
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-200 shadow-xs">
              RA
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                Matacos Admin
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Saavedra 241</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Search Input matching reference screenshot */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything on Inventory..."
            className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:bg-white focus:border-lime-500 focus:ring-2 focus:ring-lime-400/20 transition-all shadow-2xs"
          />
        </div>

        {/* Discipline filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs select-none">
          {DISCIPLINES.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDiscipline(d)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium ${
                selectedDiscipline === d
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header matching NAME/BUSINESS, TYPE, AMOUNT, DATE, INVOICE ID, ACTION */}
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="py-3.5 px-5">NAME/BUSINESS</th>
                <th className="py-3.5 px-4">TYPE</th>
                <th className="py-3.5 px-4">AMOUNT</th>
                <th className="py-3.5 px-4">DATE</th>
                <th className="py-3.5 px-4">INVOICE ID</th>
                <th className="py-3.5 px-5 text-right">ACTION</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No se encontraron productos coincidentes con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
                    {/* 1. Name / Brand */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.iconBg} text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                        >
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {item.brand}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Type / Discipline */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-slate-600 font-medium text-[11.5px]">
                        {item.discipline}
                      </span>
                    </td>

                    {/* 3. Amount */}
                    <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900 text-[12.5px]">
                      {formatCurrency(item.price)}
                    </td>

                    {/* 4. Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-[11.5px]">
                      {item.updatedAt}
                    </td>

                    {/* 5. Invoice ID / SKU */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {item.sku}
                    </td>

                    {/* 6. Action Button (Lime green View button) */}
                    <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="bg-[#c2f25b] hover:bg-[#b0e838] active:scale-95 text-slate-950 font-bold text-xs px-5 py-1.5 rounded-lg shadow-2xs transition-all tracking-tight"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <span>Mostrando {filteredProducts.length} de {INITIAL_PRODUCTS.length} productos</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">Base de datos sincronizada</span>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
