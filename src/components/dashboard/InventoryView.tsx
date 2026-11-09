"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
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
  RefreshCw,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  Barcode,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  Store,
  ArrowRightLeft,
  Percent,
  FileSpreadsheet,
  AlertOctagon,
  Layers,
} from "lucide-react";
import { MasterCategoriesManager, type MasterTabType } from "./MasterCategoriesManager";
import Link from "next/link";
import { formatCurrency, normalizeSearch } from "@/lib/utils";
import { DetailedProductItem } from "./types";
import { ProductDetailView } from "./ProductDetailView";
import { ProductFormModal } from "./ProductFormModal";
import { StockMovementModal, type OperationType } from "./StockMovementModal";
import { StockAlertsDrawer } from "./StockAlertsDrawer";
import { BatchPriceUpdateModal } from "./BatchPriceUpdateModal";
import { PriceHistoryView } from "./PriceHistoryView";
import { StockMovementHistoryView } from "./StockMovementHistoryView";
import { BulkImportModal } from "./BulkImportModal";
import { QuickSaleModal } from "./QuickSaleModal";
import { SalesHistoryModal } from "./SalesHistoryModal";
import {
  getDetailedInventoryProducts,
  toggleProductActive,
  deleteProduct,
  getProductById,
} from "@/server/actions/productActions";
import { getDisciplines } from "@/server/actions/categoryActions";

const INITIAL_PRODUCTS: DetailedProductItem[] = [
  {
    id: "p1",
    name: "Antiparras Cobra Ultra Mirror",
    description: "Antiparras de competición hidrodinámicas con lentes espejadas, protección UV400 y tratamiento antivaho de larga duración. Puente nasal intercambiable.",
    brand: "Arena",
    discipline: "Natación",
    category: "Accesorios Natación",
    subcategory: "Antiparras de Competición",
    price: 68000,
    costPrice: 42000,
    sku: "NAT-ARE-001",
    barcode: "779123456701",
    stockLocal: 14,
    stockWeb: 8,
    minStock: 3,
    updatedAt: "14 Abr 2026 at 8:00 PM",
    iconBg: "from-sky-500 to-blue-600",
    receivedTotal: 1545,
    stockTransfer: 46,
    salesStoreTotal: 129,
    salesWebTotal: 76,
    variants: [
      { size: "Único", color: "Mirror Silver", stockStore: 8, stockWarehouse: 12, barcode: "779123456701-1", receivedCount: 357, soldCountStore: 48, soldCountWeb: 33 },
      { size: "Único", color: "Mirror Gold", stockStore: 6, stockWarehouse: 10, barcode: "779123456701-2", receivedCount: 359, soldCountStore: 30, soldCountWeb: 18 },
      { size: "Único", color: "Mirror Blue", stockStore: 5, stockWarehouse: 8, barcode: "779123456701-3", receivedCount: 350, soldCountStore: 29, soldCountWeb: 14 },
      { size: "Único", color: "Smoke / Black", stockStore: 4, stockWarehouse: 6, barcode: "779123456701-4", receivedCount: 340, soldCountStore: 17, soldCountWeb: 8 },
      { size: "Único", color: "Ruby Red", stockStore: 3, stockWarehouse: 4, barcode: "779123456701-5", receivedCount: 139, soldCountStore: 5, soldCountWeb: 3 },
    ],
    sizeConversions: [
      { ar: "Único", us: "One Size", eu: "TU (Taille Unique)", br: "Tamanho Único", cm: "Ajustable 48-62 cm", note: "Correa doble silicona" },
    ],
  },
  {
    id: "p2",
    name: "Pelota Vóley V200W Oficial FIVB",
    description: "Balón oficial de juego de la Federación Internacional de Voleibol (FIVB). Diseño de 18 paneles aerodinámicos en microfibra doble hoyuelo con tecnología anti-sudor.",
    brand: "Mikasa",
    discipline: "Vóley",
    category: "Balones",
    subcategory: "Vóley Profesional Indoor",
    price: 145000,
    costPrice: 98000,
    sku: "VOL-MIK-200",
    barcode: "779123456702",
    stockLocal: 6,
    stockWeb: 4,
    minStock: 2,
    updatedAt: "05 Abr 2026 at 7:00 PM",
    iconBg: "from-amber-400 to-yellow-600",
    receivedTotal: 420,
    stockTransfer: 12,
    salesStoreTotal: 84,
    salesWebTotal: 42,
    variants: [
      { size: "N° 5", color: "Azul/Amarillo", stockStore: 6, stockWarehouse: 14, barcode: "779123456702-1", receivedCount: 420, soldCountStore: 84, soldCountWeb: 42 },
    ],
    sizeConversions: [
      { ar: "N° 5", us: "Size 5", eu: "Taille 5", br: "Tamanho 5", cm: "65 - 67 cm (Circunf.)", note: "Oficial FIVB (260-280g)" },
    ],
  },
  {
    id: "p3",
    name: "Zapatillas Gel-Rocket 11 Indoor",
    description: "Calzado multiusos para canchas de interior con tecnología GEL en el antepié para absorción de impactos, suela de goma non-marking de máxima tracción y capellada transpirable.",
    brand: "Asics",
    discipline: "Vóley / Indoor",
    category: "Calzado",
    subcategory: "Zapatillas de Vóley / Handball",
    price: 120000,
    costPrice: 78000,
    sku: "CAL-ASI-011",
    barcode: "779123456703",
    stockLocal: 10,
    stockWeb: 5,
    minStock: 2,
    updatedAt: "02 Abr 2026 at 10:00 PM",
    iconBg: "from-indigo-500 to-blue-700",
    receivedTotal: 580,
    stockTransfer: 24,
    salesStoreTotal: 96,
    salesWebTotal: 52,
    variants: [
      { size: "39", color: "Blanco/Azul", stockStore: 0, stockWarehouse: 4, barcode: "779123456703-39", receivedCount: 110, soldCountStore: 18, soldCountWeb: 10 },
      { size: "40", color: "Blanco/Azul", stockStore: 3, stockWarehouse: 6, barcode: "779123456703-40", receivedCount: 120, soldCountStore: 24, soldCountWeb: 14 },
      { size: "41", color: "Blanco/Azul", stockStore: 4, stockWarehouse: 8, barcode: "779123456703-41", receivedCount: 130, soldCountStore: 28, soldCountWeb: 16 },
      { size: "42", color: "Blanco/Azul", stockStore: 3, stockWarehouse: 5, barcode: "779123456703-42", receivedCount: 115, soldCountStore: 16, soldCountWeb: 8 },
      { size: "43", color: "Blanco/Azul", stockStore: 0, stockWarehouse: 0, barcode: "779123456703-43", receivedCount: 105, soldCountStore: 10, soldCountWeb: 4 },
    ],
    sizeConversions: [
      { ar: "39 AR", us: "7.0 US", eu: "40 EU", br: "38 BR", cm: "25.25 cm", note: "Calce justo" },
      { ar: "40 AR", us: "7.5 US", eu: "40.5 EU", br: "39 BR", cm: "25.75 cm", note: "Estándar" },
      { ar: "41 AR", us: "8.5 US", eu: "42 EU", br: "40 BR", cm: "26.50 cm", note: "Recomendado" },
      { ar: "42 AR", us: "9.5 US", eu: "43.5 EU", br: "41 BR", cm: "27.50 cm", note: "Estándar" },
      { ar: "43 AR", us: "10.5 US", eu: "44.5 EU", br: "42 BR", cm: "28.25 cm", note: "Holgado" },
    ],
  },
  {
    id: "p4",
    name: "Crocs Classic Clog Unisex",
    description: "El zueco icónico ultraliviano y resistente al agua. Fabricado con material Croslite moldeado, puertos de ventilación para respirabilidad y correa pivotante en el talón.",
    brand: "Crocs",
    discipline: "Crocs / Urbano",
    category: "Calzado Urbano",
    subcategory: "Zuecos Confort",
    price: 58000,
    costPrice: 34000,
    sku: "CRC-BLK-041",
    barcode: "779123456704",
    stockLocal: 22,
    stockWeb: 12,
    minStock: 5,
    updatedAt: "02 Abr 2026 at 6:00 AM",
    iconBg: "from-slate-700 to-slate-900",
    receivedTotal: 890,
    stockTransfer: 35,
    salesStoreTotal: 180,
    salesWebTotal: 95,
    variants: [
      { size: "4/6 (36)", color: "Negro", stockStore: 4, stockWarehouse: 6, barcode: "779123456704-36", receivedCount: 160, soldCountStore: 32, soldCountWeb: 18 },
      { size: "5/7 (37)", color: "Negro", stockStore: 5, stockWarehouse: 7, barcode: "779123456704-37", receivedCount: 170, soldCountStore: 35, soldCountWeb: 19 },
      { size: "6/8 (38)", color: "Negro", stockStore: 6, stockWarehouse: 8, barcode: "779123456704-38", receivedCount: 180, soldCountStore: 38, soldCountWeb: 20 },
      { size: "7/9 (39)", color: "Negro", stockStore: 7, stockWarehouse: 9, barcode: "779123456704-39", receivedCount: 190, soldCountStore: 40, soldCountWeb: 22 },
      { size: "8/10 (40)", color: "Negro", stockStore: 8, stockWarehouse: 12, barcode: "779123456704-40", receivedCount: 200, soldCountStore: 45, soldCountWeb: 24 },
      { size: "9/11 (41)", color: "Negro", stockStore: 6, stockWarehouse: 9, barcode: "779123456704-41", receivedCount: 175, soldCountStore: 36, soldCountWeb: 19 },
      { size: "10/12 (42)", color: "Negro", stockStore: 8, stockWarehouse: 10, barcode: "779123456704-42", receivedCount: 190, soldCountStore: 40, soldCountWeb: 21 },
      { size: "M11 (43)", color: "Negro", stockStore: 5, stockWarehouse: 6, barcode: "779123456704-43", receivedCount: 165, soldCountStore: 28, soldCountWeb: 14 },
      { size: "M12 (44)", color: "Negro", stockStore: 4, stockWarehouse: 5, barcode: "779123456704-44", receivedCount: 160, soldCountStore: 25, soldCountWeb: 12 },
      { size: "M13 (45)", color: "Negro", stockStore: 3, stockWarehouse: 4, barcode: "779123456704-45", receivedCount: 140, soldCountStore: 20, soldCountWeb: 10 },
    ],
    sizeConversions: [
      { ar: "4/6 (36 AR)", us: "M4/W6 US", eu: "36-37 EU", br: "34-35 BR", cm: "22.5 cm", note: "Dual sizing estándar" },
      { ar: "5/7 (37 AR)", us: "M5/W7 US", eu: "37-38 EU", br: "35-36 BR", cm: "23.5 cm", note: "Dual sizing estándar" },
      { ar: "6/8 (38 AR)", us: "M6/W8 US", eu: "38-39 EU", br: "36-37 BR", cm: "24.5 cm", note: "Dual sizing estándar" },
      { ar: "7/9 (39 AR)", us: "M7/W9 US", eu: "39-40 EU", br: "37-38 BR", cm: "25.5 cm", note: "Dual sizing estándar" },
      { ar: "8/10 (40 AR)", us: "M8/W10 US", eu: "41-42 EU", br: "39-40 BR", cm: "26.5 cm", note: "Dual sizing estándar" },
      { ar: "9/11 (41 AR)", us: "M9/W11 US", eu: "42-43 EU", br: "40-41 BR", cm: "27.5 cm", note: "Dual sizing estándar" },
      { ar: "10/12 (42 AR)", us: "M10/W12 US", eu: "43-44 EU", br: "41-42 BR", cm: "28.0 cm", note: "Dual sizing estándar" },
      { ar: "M11 (43 AR)", us: "M11 US", eu: "45-46 EU", br: "43 BR", cm: "29.0 cm", note: "Calce amplio" },
      { ar: "M12 (44 AR)", us: "M12 US", eu: "46-47 EU", br: "44 BR", cm: "30.0 cm", note: "Calce amplio" },
      { ar: "M13 (45 AR)", us: "M13 US", eu: "47-48 EU", br: "45 BR", cm: "31.0 cm", note: "Calce amplio" },
    ],
  },
  {
    id: "p5",
    name: "Malla Competición Fastskin LZR",
    description: "Traje de baño de competición aprobado por World Aquatics. Tejido ultracompresivo con costuras termoselladas ultrasónicas para mínima fricción hidrodinámica.",
    brand: "Speedo",
    discipline: "Natación",
    category: "Indumentaria Natación",
    subcategory: "Trajes de Competición",
    price: 92000,
    costPrice: 59000,
    sku: "NAT-SPE-040",
    barcode: "779123456705",
    stockLocal: 8,
    stockWeb: 3,
    minStock: 2,
    updatedAt: "30 Mar 2026 at 9:00 PM",
    iconBg: "from-rose-500 to-red-600",
    receivedTotal: 260,
    stockTransfer: 8,
    salesStoreTotal: 54,
    salesWebTotal: 28,
    variants: [
      { size: "S", color: "Negro/Dorado", stockStore: 2, stockWarehouse: 3, barcode: "779123456705-S", receivedCount: 65, soldCountStore: 14, soldCountWeb: 8 },
      { size: "M", color: "Negro/Dorado", stockStore: 4, stockWarehouse: 6, barcode: "779123456705-M", receivedCount: 95, soldCountStore: 22, soldCountWeb: 11 },
      { size: "L", color: "Negro/Dorado", stockStore: 4, stockWarehouse: 5, barcode: "779123456705-L", receivedCount: 70, soldCountStore: 12, soldCountWeb: 7 },
      { size: "XL", color: "Negro/Dorado", stockStore: 1, stockWarehouse: 2, barcode: "779123456705-XL", receivedCount: 30, soldCountStore: 6, soldCountWeb: 2 },
    ],
    sizeConversions: [
      { ar: "S (30 AR)", us: "30 US", eu: "75 EU", br: "P (BR)", cm: "Cintura: 76-80 cm", note: "Compresión alta" },
      { ar: "M (32 AR)", us: "32 US", eu: "80 EU", br: "M (BR)", cm: "Cintura: 81-85 cm", note: "Compresión alta" },
      { ar: "L (34 AR)", us: "34 US", eu: "85 EU", br: "G (BR)", cm: "Cintura: 86-90 cm", note: "Compresión alta" },
      { ar: "XL (36 AR)", us: "36 US", eu: "90 EU", br: "GG (BR)", cm: "Cintura: 91-95 cm", note: "Compresión alta" },
    ],
  },
  {
    id: "p6",
    name: "Cinturón de Levantamiento Cuero Pro",
    description: "Cinturón lumbar de levantamiento en cuero genuino reforzado de 10mm de espesor con hebilla de acero inoxidable de doble púa. Soporte firme para sentadillas y peso muerto.",
    brand: "Matacos Fitness",
    discipline: "Fitness",
    category: "Accesorios Gym",
    subcategory: "Soporte Lumbar Powerlifting",
    price: 34500,
    costPrice: 19000,
    sku: "FIT-BEL-002",
    barcode: "779123456706",
    stockLocal: 15,
    stockWeb: 9,
    minStock: 3,
    updatedAt: "20 Mar 2026 at 9:00 PM",
    iconBg: "from-emerald-600 to-teal-700",
    receivedTotal: 340,
    stockTransfer: 15,
    salesStoreTotal: 82,
    salesWebTotal: 46,
    variants: [
      { size: "S", color: "Negro", stockStore: 3, stockWarehouse: 5, barcode: "779123456706-S", receivedCount: 70, soldCountStore: 16, soldCountWeb: 9 },
      { size: "M", color: "Negro", stockStore: 8, stockWarehouse: 10, barcode: "779123456706-M", receivedCount: 140, soldCountStore: 35, soldCountWeb: 20 },
      { size: "L", color: "Negro", stockStore: 7, stockWarehouse: 8, barcode: "779123456706-L", receivedCount: 100, soldCountStore: 24, soldCountWeb: 14 },
      { size: "XL", color: "Negro", stockStore: 2, stockWarehouse: 3, barcode: "779123456706-XL", receivedCount: 30, soldCountStore: 7, soldCountWeb: 3 },
    ],
    sizeConversions: [
      { ar: "S", us: "Small (28-32 in)", eu: "S (70-80 cm)", br: "P (BR)", cm: "65 - 80 cm", note: "Ajuste 8 orificios" },
      { ar: "M", us: "Medium (32-36 in)", eu: "M (80-90 cm)", br: "M (BR)", cm: "78 - 92 cm", note: "Ajuste 8 orificios" },
      { ar: "L", us: "Large (36-40 in)", eu: "L (90-100 cm)", br: "G (BR)", cm: "88 - 104 cm", note: "Ajuste 8 orificios" },
      { ar: "XL", us: "X-Large (40-44 in)", eu: "XL (100-112 cm)", br: "GG (BR)", cm: "98 - 116 cm", note: "Ajuste 8 orificios" },
    ],
  },
  {
    id: "p7",
    name: "Gorra Silicona 3D Molded Soft",
    description: "Gorra ergonómica sin arrugas con moldeado 3D de alta densidad. Diseñada para competición y entrenamiento diario, ofrece mínima resistencia en el agua.",
    brand: "Arena",
    discipline: "Natación",
    category: "Accesorios Natación",
    subcategory: "Gorras de Competición",
    price: 18500,
    costPrice: 9500,
    sku: "NAT-CAP-003",
    barcode: "779123456707",
    stockLocal: 35,
    stockWeb: 20,
    minStock: 8,
    updatedAt: "24 Mar 2026 at 8:00 PM",
    iconBg: "from-cyan-500 to-blue-500",
    receivedTotal: 1200,
    stockTransfer: 40,
    salesStoreTotal: 340,
    salesWebTotal: 160,
    variants: [
      { size: "Único", color: "Blanco", stockStore: 20, stockWarehouse: 25, barcode: "779123456707-W", receivedCount: 600, soldCountStore: 180, soldCountWeb: 85 },
      { size: "Único", color: "Negro", stockStore: 15, stockWarehouse: 20, barcode: "779123456707-B", receivedCount: 450, soldCountStore: 120, soldCountWeb: 60 },
      { size: "Único", color: "Azul Royal", stockStore: 10, stockWarehouse: 15, barcode: "779123456707-BL", receivedCount: 150, soldCountStore: 40, soldCountWeb: 15 },
    ],
    sizeConversions: [
      { ar: "Único Adulto", us: "Standard Adult", eu: "Taille Adulte", br: "Adulto", cm: "54 - 60 cm (Circunf.)", note: "Silicona 100% hipoalergénica" },
    ],
  },
  {
    id: "p8",
    name: "Rodilleras Vóley Tokio Errea",
    description: "Rodilleras profesionales con relleno de espuma de poliuretano expandido y tejido elástico transpirable. Máxima protección contra impactos en saltos y caídas.",
    brand: "Errea",
    discipline: "Vóley",
    category: "Protección Vóley",
    subcategory: "Rodilleras Acolchadas",
    price: 29000,
    costPrice: 16000,
    sku: "VOL-ERR-005",
    barcode: "779123456708",
    stockLocal: 18,
    stockWeb: 11,
    minStock: 4,
    updatedAt: "10 Mar 2026 at 7:00 AM",
    iconBg: "from-blue-600 to-slate-800",
    receivedTotal: 500,
    stockTransfer: 20,
    salesStoreTotal: 120,
    salesWebTotal: 65,
    variants: [
      { size: "S", color: "Azul Marino", stockStore: 4, stockWarehouse: 6, barcode: "779123456708-S", receivedCount: 110, soldCountStore: 25, soldCountWeb: 12 },
      { size: "M", color: "Azul Marino", stockStore: 9, stockWarehouse: 12, barcode: "779123456708-M", receivedCount: 220, soldCountStore: 55, soldCountWeb: 30 },
      { size: "L", color: "Azul Marino", stockStore: 9, stockWarehouse: 10, barcode: "779123456708-L", receivedCount: 140, soldCountStore: 35, soldCountWeb: 20 },
      { size: "XL", color: "Azul Marino", stockStore: 2, stockWarehouse: 4, barcode: "779123456708-XL", receivedCount: 30, soldCountStore: 5, soldCountWeb: 3 },
    ],
    sizeConversions: [
      { ar: "S", us: "Small (13-15 in)", eu: "S (33-35.5 cm)", br: "P (BR)", cm: "33.0 - 35.5 cm", note: "Medir 10 cm arriba de rótula" },
      { ar: "M", us: "Medium (15-17 in)", eu: "M (35.5-38 cm)", br: "M (BR)", cm: "35.5 - 38.0 cm", note: "Recomendado juveniles/adultos" },
      { ar: "L", us: "Large (17-18.5 in)", eu: "L (38-40.5 cm)", br: "G (BR)", cm: "38.0 - 40.5 cm", note: "Ajuste firme" },
      { ar: "XL", us: "X-Large (18.5-20 in)", eu: "XL (40.5-43 cm)", br: "GG (BR)", cm: "40.5 - 43.0 cm", note: "Calce amplio" },
    ],
  },
  {
    id: "p9",
    name: "Antiparras Fastskin Elite Mirror",
    description: "Antiparras de perfil ultrabajo diseñadas para nadadores de élite. Sellado IQfit 3D ergonómico a prueba de filtraciones.",
    brand: "Speedo",
    discipline: "Natación",
    category: "Accesorios Natación",
    subcategory: "Antiparras de Competición",
    price: 89000,
    costPrice: 52000,
    sku: "NAT-SPE-999",
    barcode: "779123456709",
    stockLocal: 0,
    stockWeb: 0,
    minStock: 3,
    updatedAt: "14 Abr 2026 at 9:00 PM",
    iconBg: "from-rose-600 to-red-800",
    receivedTotal: 150,
    stockTransfer: 0,
    salesStoreTotal: 95,
    salesWebTotal: 55,
    variants: [
      { size: "Único", color: "Mirror Red", stockStore: 0, stockWarehouse: 0, barcode: "779123456709-1", receivedCount: 75, soldCountStore: 48, soldCountWeb: 27 },
      { size: "Único", color: "Mirror Black", stockStore: 0, stockWarehouse: 0, barcode: "779123456709-2", receivedCount: 75, soldCountStore: 47, soldCountWeb: 28 },
    ],
    sizeConversions: [
      { ar: "Único", us: "One Size", eu: "TU", br: "Tamanho Único", cm: "Ajustable 48-62 cm", note: "Escala graduada de tensión" },
    ],
  },
  {
    id: "p10",
    name: "Short Entrenamiento Microfibra Classic (Descontinuado)",
    description: "Modelo de temporada anterior dado de baja del catálogo activo (baja lógica).",
    brand: "Matacos Fitness",
    discipline: "Fitness",
    category: "Indumentaria",
    subcategory: "Shorts de Entrenamiento",
    price: 32000,
    costPrice: 18000,
    sku: "FIT-MAT-010",
    barcode: "779123456710",
    stockLocal: 0,
    stockWeb: 0,
    minStock: 2,
    active: false,
    updatedAt: "10 Mar 2026 at 11:00 AM",
    iconBg: "from-slate-500 to-slate-700",
    receivedTotal: 120,
    stockTransfer: 0,
    salesStoreTotal: 100,
    salesWebTotal: 20,
    variants: [
      { size: "M", color: "Negro", stockStore: 0, stockWarehouse: 0, barcode: "779123456710-M", receivedCount: 60, soldCountStore: 50, soldCountWeb: 10 },
      { size: "L", color: "Negro", stockStore: 0, stockWarehouse: 0, barcode: "779123456710-L", receivedCount: 60, soldCountStore: 50, soldCountWeb: 10 },
    ],
    sizeConversions: [
      { ar: "M", us: "32 US", eu: "48 EU", br: "M", cm: "Cintura 80-86 cm", note: "Corte estándar" },
      { ar: "L", us: "34 US", eu: "50 EU", br: "G", cm: "Cintura 86-92 cm", note: "Corte estándar" },
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

export type StockAlertFilterMode = "ALL" | "IN_ALERT" | "OUT_OF_STOCK" | "STORE_REPLENISHMENT";
export type ActiveFilterMode = "ACTIVE" | "INACTIVE" | "ALL";

export function evaluateProductStockStatus(product: DetailedProductItem) {
  const minStock = product.minStock || 2;
  const variants = product.variants || [];

  let totalStore = 0;
  let totalWarehouse = 0;
  let outOfStockVariants = 0;
  let storeEmptyVariants = 0;
  let criticalLowVariants = 0;

  if (variants.length === 0) {
    totalStore = product.stockLocal ?? 0;
    totalWarehouse = product.stockWeb ?? 0;
    const total = totalStore + totalWarehouse;

    if (total === 0 && minStock > 0) outOfStockVariants = 1;
    else if (totalStore === 0 && totalWarehouse > 0) storeEmptyVariants = 1;
    else if (minStock > 0 && total <= minStock) criticalLowVariants = 1;
  } else {
    for (const v of variants) {
      const vStore = v.stockStore ?? 0;
      const vWarehouse = v.stockWarehouse ?? 0;
      const vTotal = vStore + vWarehouse;
      const vMinStock = v.minStock ?? minStock;
      const vMinStore = v.minStoreStock ?? (product.minStoreStock ?? 1);

      totalStore += vStore;
      totalWarehouse += vWarehouse;

      if (vTotal === 0) {
        if (vMinStock > 0) {
          outOfStockVariants++;
        }
      } else if (vStore === 0 && vWarehouse > 0) {
        storeEmptyVariants++;
      } else if ((vMinStock > 0 && vTotal <= vMinStock) || (vMinStore > 0 && vStore <= vMinStore && vWarehouse > 0)) {
        criticalLowVariants++;
      }
    }
  }

  const totalStock = totalStore + totalWarehouse;
  const totalAlerts = outOfStockVariants + storeEmptyVariants + criticalLowVariants;

  let highestAlert: "OUT_OF_STOCK" | "STORE_EMPTY_WAREHOUSE_AVAIL" | "CRITICAL_LOW" | "NORMAL" = "NORMAL";

  if (outOfStockVariants > 0 || (totalStock === 0 && minStock > 0)) {
    highestAlert = "OUT_OF_STOCK";
  } else if (storeEmptyVariants > 0 || (totalStore === 0 && totalWarehouse > 0)) {
    highestAlert = "STORE_EMPTY_WAREHOUSE_AVAIL";
  } else if (criticalLowVariants > 0 || (minStock > 0 && totalStock <= minStock)) {
    highestAlert = "CRITICAL_LOW";
  }

  return {
    totalStore,
    totalWarehouse,
    totalStock,
    minStock,
    outOfStockVariants,
    storeEmptyVariants,
    criticalLowVariants,
    totalAlerts,
    highestAlert,
  };
}

export type StockBadgeLevel =
  | "OUT_OF_STOCK" // Gris / Negro: agotado
  | "MAJORITY_RISK" // Rojo: riesgo general en mayoría de variantes de producto
  | "SOME_VARIANTS_OUT" // Naranja: stock general bien, con variantes agotadas
  | "VARIANTS_LOW" // Amarillo: stock general bien con variantes por agotarse
  | "OPTIMAL"; // Verde: stock bien general

export interface StockBadgeInfo {
  level: StockBadgeLevel;
  badgeClass: string;
  badgeTextClass: string;
  iconType: "alert-octagon" | "alert-triangle" | "store" | "check-circle";
  iconColorClass: string;
  label: string;
  subtext: string;
  displayStock: number;
  warehouseStock: number;
  totalStock: number;
}

export function getProductStockBadgeInfo(
  item: DetailedProductItem,
  matchedVariant?: {
    stockStore?: number;
    stockWarehouse?: number;
    minStock?: number;
    minStoreStock?: number;
    size?: string;
  } | null
): StockBadgeInfo {
  // Caso 1: Variante específica seleccionada o coincidente por búsqueda
  if (matchedVariant) {
    const displayStock = matchedVariant.stockStore ?? 0;
    const warehouseStock = matchedVariant.stockWarehouse ?? 0;
    const totalStock = displayStock + warehouseStock;
    const minStock = matchedVariant.minStock ?? item.minStock ?? 2;

    // 1. Gris/Negro: Agotado
    if (totalStock === 0) {
      return {
        level: "OUT_OF_STOCK",
        badgeClass: "bg-zinc-900 text-zinc-100 border-zinc-700 shadow-2xs",
        badgeTextClass: "text-zinc-100",
        iconType: "alert-octagon",
        iconColorClass: "text-zinc-400",
        label: "0 un.",
        subtext: "0 local • 0 depósito",
        displayStock,
        warehouseStock,
        totalStock,
      };
    }

    // 2. Naranja: Salón agotado pero hay en depósito
    if (displayStock === 0 && warehouseStock > 0) {
      return {
        level: "SOME_VARIANTS_OUT",
        badgeClass: "bg-orange-100 text-orange-950 border-orange-300",
        badgeTextClass: "text-orange-950",
        iconType: "alert-triangle",
        iconColorClass: "text-orange-600",
        label: `${displayStock} un.`,
        subtext: `Salón 0 • Hay ${warehouseStock} un. en depósito`,
        displayStock,
        warehouseStock,
        totalStock,
      };
    }

    // 3. Rojo: Riesgo crítico (stock total 1 o menos)
    if (totalStock <= 1) {
      return {
        level: "MAJORITY_RISK",
        badgeClass: "bg-rose-100 text-rose-950 border-rose-300",
        badgeTextClass: "text-rose-950",
        iconType: "alert-octagon",
        iconColorClass: "text-rose-600",
        label: `${displayStock} un.`,
        subtext: `Stock crítico (${totalStock} un. total)`,
        displayStock,
        warehouseStock,
        totalStock,
      };
    }

    // 4. Amarillo: Por agotarse (stock total menor o igual al mínimo)
    if (totalStock <= minStock) {
      return {
        level: "VARIANTS_LOW",
        badgeClass: "bg-amber-100 text-amber-950 border-amber-300",
        badgeTextClass: "text-amber-950",
        iconType: "alert-triangle",
        iconColorClass: "text-amber-600",
        label: `${displayStock} un.`,
        subtext: `Por agotarse • Depósito: ${warehouseStock} un.`,
        displayStock,
        warehouseStock,
        totalStock,
      };
    }

    // 5. Verde: Stock bien
    return {
      level: "OPTIMAL",
      badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-200",
      badgeTextClass: "text-emerald-900",
      iconType: "store",
      iconColorClass: "text-emerald-600",
      label: `${displayStock} un.`,
      subtext: matchedVariant.size ? `Talle ${matchedVariant.size}` : "Saavedra 241",
      displayStock,
      warehouseStock,
      totalStock,
    };
  }

  // Caso 2: Evaluación general del producto (mostrador local)
  const variants = item.variants || [];

  if (variants.length === 0) {
    const displayStock = item.stockLocal ?? 0;
    const warehouseStock = item.stockWeb ?? 0;
    const totalStock = displayStock + warehouseStock;
    const minStock = item.minStock ?? 2;

    if (totalStock === 0) {
      return {
        level: "OUT_OF_STOCK",
        badgeClass: "bg-zinc-900 text-zinc-100 border-zinc-700 shadow-2xs",
        badgeTextClass: "text-zinc-100",
        iconType: "alert-octagon",
        iconColorClass: "text-zinc-400",
        label: "0 un.",
        subtext: "0 local • 0 depósito",
        displayStock,
        warehouseStock,
        totalStock,
      };
    }

    if (displayStock === 0 && warehouseStock > 0) {
      return {
        level: "SOME_VARIANTS_OUT",
        badgeClass: "bg-orange-100 text-orange-950 border-orange-300",
        badgeTextClass: "text-orange-950",
        iconType: "alert-triangle",
        iconColorClass: "text-orange-600",
        label: `${displayStock} un.`,
        subtext: `Salón 0 • Hay ${warehouseStock} un. en depósito`,
        displayStock,
        warehouseStock,
        totalStock,
      };
    }

    if (totalStock <= minStock) {
      return {
        level: "MAJORITY_RISK",
        badgeClass: "bg-rose-100 text-rose-950 border-rose-300",
        badgeTextClass: "text-rose-950",
        iconType: "alert-octagon",
        iconColorClass: "text-rose-600",
        label: `${displayStock} un.`,
        subtext: `Stock crítico local (mín. ${minStock})`,
        displayStock,
        warehouseStock,
        totalStock,
      };
    }

    return {
      level: "OPTIMAL",
      badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-200",
      badgeTextClass: "text-emerald-900",
      iconType: "store",
      iconColorClass: "text-emerald-600",
      label: `${displayStock} un.`,
      subtext: "Saavedra 241",
      displayStock,
      warehouseStock,
      totalStock,
    };
  }

  // Producto con múltiples variantes
  const totalVariants = variants.length;
  let displayStock = 0;
  let warehouseStock = 0;
  let outOfStockVariants = 0;
  let storeEmptyVariants = 0;
  let criticalVariants = 0;

  for (const v of variants) {
    const vStore = v.stockStore ?? 0;
    const vWarehouse = v.stockWarehouse ?? 0;
    const vTotal = vStore + vWarehouse;
    const vMin = v.minStock ?? item.minStock ?? 2;
    const vMinStore = v.minStoreStock ?? item.minStoreStock ?? 1;

    displayStock += vStore;
    warehouseStock += vWarehouse;

    if (vTotal === 0) {
      if (vMin > 0) outOfStockVariants++;
    } else if (vStore === 0 && vWarehouse > 0) {
      storeEmptyVariants++;
    } else if ((vMin > 0 && vTotal <= vMin) || (vMinStore > 0 && vStore <= vMinStore && vWarehouse > 0)) {
      criticalVariants++;
    }
  }

  const totalStock = displayStock + warehouseStock;
  const atRiskVariantsCount = outOfStockVariants + storeEmptyVariants + criticalVariants;

  // 1. Gris/Negro: Agotado (todo el stock en 0 y con umbral activo, o todas las variantes activas agotadas)
  if ((totalStock === 0 && (item.minStock ?? 2) > 0) || (outOfStockVariants === totalVariants && totalVariants > 0)) {
    return {
      level: "OUT_OF_STOCK",
      badgeClass: "bg-zinc-900 text-zinc-100 border-zinc-700 shadow-2xs",
      badgeTextClass: "text-zinc-100",
      iconType: "alert-octagon",
      iconColorClass: "text-zinc-400",
      label: "0 un.",
      subtext: "Sin existencias en ninguna variante",
      displayStock,
      warehouseStock,
      totalStock,
    };
  }

  // 2. Rojo: Riesgo general en mayoría de variantes de producto (> 50% de las variantes afectadas)
  if (atRiskVariantsCount > totalVariants / 2) {
    return {
      level: "MAJORITY_RISK",
      badgeClass: "bg-rose-100 text-rose-950 border-rose-300",
      badgeTextClass: "text-rose-950",
      iconType: "alert-octagon",
      iconColorClass: "text-rose-600",
      label: `${displayStock} un.`,
      subtext: `${atRiskVariantsCount} de ${totalVariants} variantes en riesgo`,
      displayStock,
      warehouseStock,
      totalStock,
    };
  }

  // 3. Naranja: Stock general bien, con variantes agotadas
  if (outOfStockVariants > 0 || storeEmptyVariants > 0 || (displayStock === 0 && warehouseStock > 0)) {
    const countAgotadas = outOfStockVariants + storeEmptyVariants;
    return {
      level: "SOME_VARIANTS_OUT",
      badgeClass: "bg-orange-100 text-orange-950 border-orange-300",
      badgeTextClass: "text-orange-950",
      iconType: "alert-triangle",
      iconColorClass: "text-orange-600",
      label: `${displayStock} un.`,
      subtext:
        displayStock === 0 && warehouseStock > 0
          ? `Salón vacío • Hay ${warehouseStock} en dep.`
          : `${countAgotadas} ${countAgotadas === 1 ? "variante agotada" : "variantes agotadas"}`,
      displayStock,
      warehouseStock,
      totalStock,
    };
  }

  // 4. Amarillo: Stock general bien con variantes por agotarse
  if (criticalVariants > 0) {
    return {
      level: "VARIANTS_LOW",
      badgeClass: "bg-amber-100 text-amber-950 border-amber-300",
      badgeTextClass: "text-amber-950",
      iconType: "alert-triangle",
      iconColorClass: "text-amber-600",
      label: `${displayStock} un.`,
      subtext: `${criticalVariants} ${criticalVariants === 1 ? "talle por agotarse" : "talles por agotarse"}`,
      displayStock,
      warehouseStock,
      totalStock,
    };
  }

  // 5. Verde: Stock bien general
  return {
    level: "OPTIMAL",
    badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-200",
    badgeTextClass: "text-emerald-900",
    iconType: "store",
    iconColorClass: "text-emerald-600",
    label: `${displayStock} un.`,
    subtext: "Stock general saludable",
    displayStock,
    warehouseStock,
    totalStock,
  };
}

interface InventoryViewProps {
  selectedDiscipline?: string;
  onDisciplineChange?: (discipline: string) => void;
  initialProducts?: DetailedProductItem[];
  selectedProductId?: string | null;
  onProductChange?: (productId: string | null) => void;
  isAlertsDrawerOpen?: boolean;
  onToggleAlertsDrawer?: (open: boolean) => void;
  onAlertsCountChange?: (count: number) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  activeSubView?: "productos" | "tablas" | "historial" | "movimientos";
  onSubViewChange?: (subView: "productos" | "tablas" | "historial" | "movimientos") => void;
}

export function InventoryView({
  selectedDiscipline: controlledDiscipline,
  onDisciplineChange,
  initialProducts,
  selectedProductId,
  onProductChange,
  isAlertsDrawerOpen: controlledAlertsDrawerOpen,
  onToggleAlertsDrawer,
  onAlertsCountChange,
  isSidebarOpen,
  onToggleSidebar,
  activeSubView,
  onSubViewChange,
}: InventoryViewProps = {}) {
  const [searchMode, setSearchMode] = useState<"barcode" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [internalDiscipline, setInternalDiscipline] = useState("Todas");
  const selectedDiscipline = controlledDiscipline !== undefined ? controlledDiscipline : internalDiscipline;
  const [selectedProduct, setSelectedProduct] = useState<DetailedProductItem | null>(null);
  const [productsList, setProductsList] = useState<DetailedProductItem[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : INITIAL_PRODUCTS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DetailedProductItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<DetailedProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; title: string; description?: string } | null>(null);

  // Estados para Alertas de Stock Crítico y Drawer (RF-06 / CU-INV-08)
  const [stockAlertFilter, setStockAlertFilter] = useState<StockAlertFilterMode>("ALL");
  const [internalAlertsDrawerOpen, setInternalAlertsDrawerOpen] = useState(false);
  const isStockAlertsDrawerOpen =
    controlledAlertsDrawerOpen !== undefined ? controlledAlertsDrawerOpen : internalAlertsDrawerOpen;
  const handleToggleAlertsDrawer = (open: boolean) => {
    if (onToggleAlertsDrawer) onToggleAlertsDrawer(open);
    else setInternalAlertsDrawerOpen(open);
  };

  // Estados para Filtro de Estado de Actividad / Baja Lógica (RF-01)
  const [activeFilterMode, setActiveFilterMode] = useState<ActiveFilterMode>("ACTIVE");
  const [isReactivatingId, setIsReactivatingId] = useState<string | null>(null);

  // Estados para el Filtro Unificado con Icono de Embudo (RF-01 / RF-01.2 / RF-06)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const filterMenuRef = React.useRef<HTMLDivElement>(null);
  // Filtros por marca y categoría
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  // Conteo total de filtros activos no predeterminados
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedDiscipline !== "Todas") count++;
    if (selectedBrand !== "Todas") count++;
    if (selectedCategory !== "Todas") count++;
    if (stockAlertFilter !== "ALL") count++;
    if (activeFilterMode !== "ACTIVE") count++;
    return count;
  }, [selectedDiscipline, selectedBrand, selectedCategory, stockAlertFilter, activeFilterMode]);

  const handleResetAllFilters = () => {
    handleSelectDiscipline("Todas");
    setSelectedBrand("Todas");
    setSelectedCategory("Todas");
    setStockAlertFilter("ALL");
    setActiveFilterMode("ACTIVE");
  };

  // Cierre automático al hacer clic fuera del menú de filtros o al pulsar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isFilterMenuOpen) {
        setIsFilterMenuOpen(false);
      }
    }
    if (isFilterMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isFilterMenuOpen]);

  // Conteo dinámico de productos activos e inactivos
  const activeStatusSummary = useMemo(() => {
    let active = 0;
    let inactive = 0;
    for (const p of productsList) {
      if (p.active === false) {
        inactive++;
      } else {
        active++;
      }
    }
    return { activeCount: active, inactiveCount: inactive, totalCount: productsList.length };
  }, [productsList]);

  // Estados para Carga Dinámica de Disciplinas desde BD (RF-01 / RF-01.2)
  const [dbDisciplines, setDbDisciplines] = useState<string[]>([]);

  // Lista consolidada de todas las disciplinas (BD + catálogo de productos)
  const allDisciplines = useMemo(() => {
    const set = new Set<string>();
    dbDisciplines.forEach((d) => {
      if (d && d.trim()) set.add(d.trim());
    });
    productsList.forEach((p) => {
      if (p.discipline && p.discipline.trim()) {
        set.add(p.discipline.trim());
      }
    });
    if (set.size === 0) {
      DISCIPLINES.filter((d) => d !== "Todas").forEach((d) => set.add(d));
    }
    const sorted = Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
    return ["Todas", ...sorted];
  }, [dbDisciplines, productsList]);

  // Conteo dinámico de productos por disciplina considerando el estado activo/inactivo
  const disciplineCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: 0 };
    for (const p of productsList) {
      if (activeFilterMode === "ACTIVE" && p.active === false) continue;
      if (activeFilterMode === "INACTIVE" && p.active !== false) continue;

      counts.Todas = (counts.Todas || 0) + 1;
      const d = p.discipline?.trim();
      if (d) {
        counts[d] = (counts[d] || 0) + 1;
      }
    }
    return counts;
  }, [productsList, activeFilterMode]);

  // Opciones de marca y categoría con conteo (respetando estado activo/inactivo)
  const { brandOptions, categoryOptions } = useMemo(() => {
    const brands = new Map<string, number>();
    const categories = new Map<string, number>();
    for (const p of productsList) {
      if (activeFilterMode === "ACTIVE" && p.active === false) continue;
      if (activeFilterMode === "INACTIVE" && p.active !== false) continue;
      const b = p.brand?.trim();
      if (b) brands.set(b, (brands.get(b) ?? 0) + 1);
      const c = p.category?.trim();
      if (c) categories.set(c, (categories.get(c) ?? 0) + 1);
    }
    const toSorted = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    return { brandOptions: toSorted(brands), categoryOptions: toSorted(categories) };
  }, [productsList, activeFilterMode]);

  // Resumen calculado en tiempo real de alertas de stock (excluyendo productos inactivos)
  const stockAlertsSummary = useMemo(() => {
    let outOfStockCount = 0;
    let storeEmptyCount = 0;
    let criticalLowCount = 0;
    let totalAlertVariants = 0;

    for (const p of productsList) {
      // Regla de Negocio: No alertar sobre artículos dados de baja / inactivos
      if (p.active === false) continue;

      const status = evaluateProductStockStatus(p);
      outOfStockCount += status.outOfStockVariants;
      storeEmptyCount += status.storeEmptyVariants;
      criticalLowCount += status.criticalLowVariants;
      totalAlertVariants += status.totalAlerts;
    }

    return {
      totalAlertVariants,
      outOfStockCount,
      storeEmptyCount,
      criticalLowCount,
    };
  }, [productsList]);

  useEffect(() => {
    onAlertsCountChange?.(stockAlertsSummary.totalAlertVariants);
  }, [stockAlertsSummary.totalAlertVariants, onAlertsCountChange]);

  // Estados para Modal de Movimientos Manuales de Stock (RF-03 / CU-04)
  const [stockModalProduct, setStockModalProduct] = useState<DetailedProductItem | null>(null);
  const [stockModalOperation, setStockModalOperation] = useState<OperationType | undefined>(undefined);
  const [stockModalVariantId, setStockModalVariantId] = useState<string | undefined>(undefined);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  // Estados para Actualización Masiva de Precios (RF-01.1 / CU-INV-05)
  const [isBatchPriceModalOpen, setIsBatchPriceModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Estado para Carga Masiva e Ingestión Excel/CSV (RF-04 / CU-INV-02)
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

  // Estados para Registro Rápido de Venta y Consulta de Tickets de Mostrador
  const [isQuickSaleModalOpen, setIsQuickSaleModalOpen] = useState(false);
  const [isSalesHistoryModalOpen, setIsSalesHistoryModalOpen] = useState(false);
  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState<string | null>(null);

  const toggleSelectProduct = (productId: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedProductIds(new Set());
  };

  // Pestaña activa del módulo de inventario y clasificadores (RF-01.2 / CU-INV-09)
  const [catalogViewTab, setCatalogViewTab] = useState<"products" | MasterTabType>("products");

  // Estado para expandir filas de variantes en la tabla de inventario
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleExpandProduct = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleOpenStockModal = (
    product: DetailedProductItem,
    operation?: OperationType,
    variantId?: string,
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    setStockModalProduct(product);
    setStockModalOperation(operation);
    setStockModalVariantId(variantId);
    setIsStockModalOpen(true);
  };

  // Paginación: 5 por defecto (mínimo 5, máximo 10) para que quepa en pantalla completa con el paginador visible
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileViewMode, setMobileViewMode] = useState<"table" | "cards">("table");

  // Adecuar inteligentemente si la pantalla es muy grande, pero manteniendo 5 por defecto en pantallas estándar
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        // En pantallas muy altas (> 1100px) puede mostrar 8 o 10; en pantallas estándar de laptop/desktop se preserva 5
        if (window.innerHeight > 1150) {
          setItemsPerPage((prev) => (prev === 5 ? 10 : prev));
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reiniciar a página 1 al filtrar o cambiar items por página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchMode, selectedDiscipline, itemsPerPage, activeFilterMode, stockAlertFilter]);

  const showToast = (title: string, description?: string) => {
    const id = Date.now().toString();
    setToast({ id, title, description });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: DetailedProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (product: DetailedProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteError(null);
    setProductToDelete(product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const deletedId = productToDelete.id;
    const deletedName = productToDelete.name;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await deleteProduct(deletedId);
      if (res.success) {
        // Actualización optimista inmediata en la interfaz:
        // Marcamos el producto como inactivo (100% baja lógica)
        setProductsList((prev) =>
          prev.map((p) => (p.id === deletedId ? { ...p, active: false } : p))
        );
        setProductToDelete(null);
        showToast(
          "Producto dado de baja",
          `"${deletedName}" fue dado de baja del catálogo activo (baja lógica). Podés consultarlo o reactivarlo en "Inactivos".`
        );
        loadProducts();
      } else {
        setDeleteError(res.error || "No se pudo dar de baja el producto");
      }
    } catch (err) {
      console.error("Error al dar de baja el producto:", err);
      setDeleteError("Ocurrió un error inesperado al dar de baja el producto");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactivateProduct = async (product: DetailedProductItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setIsReactivatingId(product.id);
      const res = await toggleProductActive(product.id);
      if (res.success) {
        // Actualización optimista inmediata en la interfaz:
        // Marcamos el producto nuevamente como activo
        setProductsList((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, active: true } : p))
        );
        showToast(
          "Producto reactivado",
          `"${product.name}" ha sido reactivado y devuelto al mostrador (POS) y catálogo activo.`
        );
        loadProducts();
      } else {
        showToast("Error", res.error || "No se pudo reactivar el producto");
      }
    } catch (err) {
      console.error("Error al reactivar el producto:", err);
      showToast("Error", "Ocurrió un error inesperado al reactivar el producto");
    } finally {
      setIsReactivatingId(null);
    }
  };

  const loadDisciplines = useCallback(async () => {
    try {
      const res = await getDisciplines();
      if (res.success && Array.isArray(res.data)) {
        const names = res.data.map((d: any) => d.name).filter(Boolean);
        setDbDisciplines(names);
      }
    } catch (err) {
      console.warn("No se pudieron cargar las disciplinas desde la BD:", err);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productsRes] = await Promise.all([
        getDetailedInventoryProducts({ includeInactive: true }),
        loadDisciplines(),
      ]);
      if (productsRes.success && Array.isArray(productsRes.data)) {
        setProductsList(productsRes.data);
      }
    } catch (err) {
      console.warn("Utilizando catálogo inicial de demostración:", err);
    } finally {
      setIsLoading(false);
    }
  }, [loadDisciplines]);

  useEffect(() => {
    loadDisciplines();
    if (!initialProducts || initialProducts.length === 0) {
      loadProducts();
    }
  }, [loadProducts, loadDisciplines, initialProducts]);


  const handleSelectDiscipline = (d: string) => {
    if (onDisciplineChange) {
      onDisciplineChange(d);
    } else {
      setInternalDiscipline(d);
    }
  };

  // Alternar filtro de alertas de stock con reseteo de disciplina si estaba acotada
  const handleToggleStockAlertFilter = (filter: StockAlertFilterMode) => {
    if (stockAlertFilter === filter) {
      // Si ya estaba activo, se desactiva (toggle off) y vuelve al catálogo completo
      setStockAlertFilter("ALL");
    } else {
      // Si se activa un filtro de alerta y la disciplina estaba acotada (ej. Natación),
      // la pasamos a "Todas" para que el usuario no se pierda productos en alerta de otras categorías
      if (selectedDiscipline !== "Todas") {
        handleSelectDiscipline("Todas");
      }
      setStockAlertFilter(filter);
    }
  };

  // Identificar qué variante coincide con el código de barra o SKU buscado
  const getMatchedVariant = useCallback((item: DetailedProductItem, query: string) => {
    if (!query) return null;
    const q = query.trim().toLowerCase();
    if (!item.variants || item.variants.length === 0) return null;

    // 1. Coincidencia exacta por código de barra
    const exactBarcode = item.variants.find(
      (v) => v.barcode && v.barcode.trim().toLowerCase() === q
    );
    if (exactBarcode) return exactBarcode;

    // 2. Coincidencia exacta por SKU
    const exactSku = item.variants.find(
      (v) => v.sku && v.sku.trim().toLowerCase() === q
    );
    if (exactSku) return exactSku;

    // 3. Coincidencia parcial por código de barra (mínimo 3 dígitos)
    if (q.length >= 3) {
      const partialBarcode = item.variants.find(
        (v) => v.barcode && v.barcode.toLowerCase().includes(q)
      );
      if (partialBarcode) return partialBarcode;
    }

    // 4. Coincidencia parcial por SKU
    if (q.length >= 3) {
      const partialSku = item.variants.find(
        (v) => v.sku && v.sku.toLowerCase().includes(q)
      );
      if (partialSku) return partialSku;
    }

    // 5. Si el producto tiene una única variante, asociarla directamente
    if (item.variants.length === 1) {
      return item.variants[0];
    }

    return null;
  }, []);

  // Manejo de pulsación de teclas en el campo de búsqueda (lector USB de código de barras)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const term = searchQuery.trim().toLowerCase();
      if (!term) return;

      // 1. Buscar coincidencia por código de barra (en producto o variantes)
      const exactMatch = filteredProducts.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === term) ||
          p.variants?.some((v) => v.barcode && v.barcode.toLowerCase() === term)
      );

      if (exactMatch) {
        const matchedVar = getMatchedVariant(exactMatch, term);
        if (matchedVar) {
          showToast(
            "Variante identificada",
            `Talle ${matchedVar.size} (${matchedVar.color}) de "${exactMatch.name}". Pulsa las flechas para modificar stock.`
          );
        } else {
          showToast(
            "Producto localizado",
            `"${exactMatch.name}". Pulsa las flechas para modificar stock.`
          );
        }
      } else if (filteredProducts.length === 1) {
        const single = filteredProducts[0];
        const matchedVar = getMatchedVariant(single, term);
        if (matchedVar) {
          showToast(
            "Variante identificada",
            `Talle ${matchedVar.size} (${matchedVar.color}) de "${single.name}". Pulsa las flechas para modificar stock.`
          );
        } else {
          showToast("Producto filtrado", `"${single.name}". Pulsa las flechas para modificar stock.`);
        }
      } else if (filteredProducts.length === 0) {
        showToast(
          "Código no encontrado",
          `No se encontró ningún producto con el código "${searchQuery.trim()}".`
        );
      }
    } else if (e.key === "Escape") {
      setSearchQuery("");
    }
  };

  // Filtrar productos según el modo de búsqueda (Código de Barra / Todos), disciplina y estado de alerta
  const filteredProducts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    const filtered = productsList.filter((item) => {
      let matchesSearch = true;

      if (term !== "") {
        const matchesMainBarcode = Boolean(item.barcode && item.barcode.toLowerCase().includes(term));
        const matchesVariantBarcode = Boolean(
          item.variants?.some((v) => v.barcode && v.barcode.toLowerCase().includes(term))
        );

        if (searchMode === "barcode") {
          // Búsqueda específica por código de barra (con tolerancia a SKU si se ingresa con lector)
          const matchesSku =
            (item.sku && item.sku.toLowerCase().includes(term)) ||
            item.variants?.some((v) => v.sku && v.sku.toLowerCase().includes(term));

          matchesSearch = matchesMainBarcode || matchesVariantBarcode || Boolean(matchesSku);
        } else {
          // Búsqueda tolerante: tildes, guiones, espacios, tokens múltiples
          const tokens = normalizeSearch(term).split(/\s+/).filter(Boolean);
          const termNoSpaces = normalizeSearch(term).replace(/\s+/g, "");

          // Campos del producto + variantes, normalizados
          const productFields = [
            item.name,
            item.brand,
            item.sku || "",
            item.discipline || "",
            item.category || "",
            item.subcategory || "",
          ].map(normalizeSearch);

          const variantFields = (item.variants ?? []).flatMap((v) => [
            v.sku || "",
            v.color || "",
            v.size || "",
          ].map(normalizeSearch));

          const allFields = [...productFields, ...variantFields];
          const allText = allFields.join(" ");
          const allTextNoSpaces = allText.replace(/\s+/g, "");

          // Cada token debe aparecer en algún campo (o en el texto concatenado)
          const matchesAllTokens = tokens.every((token) =>
            allFields.some((field) => field.includes(token)) || allText.includes(token)
          );

          // Término sin espacios vs texto sin espacios (ej: "airmax" → "air max")
          const matchesFuzzySpaces =
            termNoSpaces.length > 0 && allTextNoSpaces.includes(termNoSpaces);

          matchesSearch =
            matchesMainBarcode ||
            matchesVariantBarcode ||
            matchesAllTokens ||
            matchesFuzzySpaces;
        }
      }

      const matchesDiscipline =
        selectedDiscipline === "Todas" ||
        item.discipline.trim().toLowerCase() === selectedDiscipline.trim().toLowerCase() ||
        item.discipline.toLowerCase().includes(selectedDiscipline.toLowerCase()) ||
        selectedDiscipline.toLowerCase().includes(item.discipline.toLowerCase());

      let matchesAlertFilter = true;
      if (stockAlertFilter === "IN_ALERT") {
        const status = evaluateProductStockStatus(item);
        matchesAlertFilter = status.totalAlerts > 0;
      } else if (stockAlertFilter === "OUT_OF_STOCK") {
        const status = evaluateProductStockStatus(item);
        matchesAlertFilter = status.outOfStockVariants > 0 || status.totalStock === 0;
      } else if (stockAlertFilter === "STORE_REPLENISHMENT") {
        const status = evaluateProductStockStatus(item);
        matchesAlertFilter =
          status.storeEmptyVariants > 0 ||
          (status.totalStore === 0 && status.totalWarehouse > 0);
      }

      let matchesActive = true;
      if (activeFilterMode === "ACTIVE") {
        matchesActive = item.active !== false;
      } else if (activeFilterMode === "INACTIVE") {
        matchesActive = item.active === false;
      } else if (activeFilterMode === "ALL") {
        matchesActive = true;
      }

      const matchesBrand =
        selectedBrand === "Todas" ||
        (item.brand ?? "").trim().toLowerCase() === selectedBrand.trim().toLowerCase();

      const matchesCategory =
        selectedCategory === "Todas" ||
        (item.category ?? "").trim().toLowerCase() === selectedCategory.trim().toLowerCase();

      return (
        matchesSearch &&
        matchesDiscipline &&
        matchesBrand &&
        matchesCategory &&
        matchesAlertFilter &&
        matchesActive
      );
    });

    // Ordenamiento jerárquico por severidad de alerta:
    // 1. Agotados (0 un.) -> 2. Salón vacío (depósito disponible) -> 3. Stock crítico -> 4. Reposición preventiva
    if (stockAlertFilter !== "ALL") {
      const alertPriorityMap: Record<string, number> = {
        OUT_OF_STOCK: 1,
        STORE_EMPTY_WAREHOUSE_AVAIL: 2,
        CRITICAL_LOW: 3,
        STORE_REPLENISHMENT: 4,
        NORMAL: 5,
      };

      filtered.sort((a, b) => {
        const statusA = evaluateProductStockStatus(a);
        const statusB = evaluateProductStockStatus(b);
        const prioA = alertPriorityMap[statusA.highestAlert] ?? 5;
        const prioB = alertPriorityMap[statusB.highestAlert] ?? 5;
        return prioA - prioB;
      });
    }

    return filtered;
  }, [productsList, searchQuery, searchMode, selectedDiscipline, selectedBrand, selectedCategory, stockAlertFilter, activeFilterMode]);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [stockAlertFilter, activeFilterMode, searchQuery, selectedDiscipline, selectedBrand, selectedCategory]);

  // Cálculos de Paginación Adaptable
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIdx = (validCurrentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, validCurrentPage, itemsPerPage]);

  const toggleSelectAllVisible = (e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) e.stopPropagation();
    const visibleIds = paginatedProducts.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.has(id));

    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(validCurrentPage * itemsPerPage, totalItems);

  // Componente de pie de tabla/tarjetas adaptable
  const renderPaginationFooter = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/70 text-xs text-slate-600">
      {/* Contador y selector adaptable de items por página (5 min, 10 max) */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
        <span className="font-medium text-slate-600 text-xs">
          Mostrando <strong className="text-slate-900 font-bold">{startIndex} - {endIndex}</strong> de <strong className="text-slate-900 font-bold">{totalItems}</strong> productos
        </span>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">Por página:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer"
          >
            <option value={5}>5 (mínimo)</option>
            <option value={8}>8</option>
            <option value={10}>10 (máximo)</option>
          </select>
        </div>
      </div>

      {/* Controles de Navegación de Páginas */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage <= 1}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold shadow-2xs"
            title="Página anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-xl text-xs font-bold transition-all ${
                  validCurrentPage === pageNum
                    ? "bg-slate-900 text-white shadow-xs scale-105"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage >= totalPages}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold shadow-2xs"
            title="Página siguiente"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  // Referencia para evitar que actualizaciones asíncronas de la lista de productos
  // resuciten el detalle del producto mientras la transición de URL de Next.js se completa
  const closedProductIdRef = React.useRef<string | null>(null);

  // Sincronizar el producto seleccionado cuando cambia la URL (historial Atrás / Adelante del navegador)
  useEffect(() => {
    if (selectedProductId) {
      if (closedProductIdRef.current === selectedProductId) {
        return;
      }
      const found = productsList.find((p) => p.id === selectedProductId);
      if (found) {
        setSelectedProduct(found);
      }
    } else {
      closedProductIdRef.current = null;
      setSelectedProduct(null);
    }
  }, [selectedProductId, productsList]);

  const [selectedVariantIdForDetail, setSelectedVariantIdForDetail] = useState<string | undefined>(undefined);

  const handleOpenDetail = (product: DetailedProductItem, variantId?: string) => {
    closedProductIdRef.current = null;
    const targetVariantId = variantId || getMatchedVariant(product, searchQuery)?.id;
    setSelectedVariantIdForDetail(targetVariantId);
    setSelectedProduct(product);
    onProductChange?.(product.id);
  };

  // If a product is selected, render the full detailed view with back button
  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        initialVariantId={selectedVariantIdForDetail}
        onProductUpdate={(updated) => {
          setProductsList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setSelectedProduct(updated);
        }}
        onBack={() => {
          if (selectedProduct) {
            closedProductIdRef.current = selectedProduct.id;
          }
          setSelectedProduct(null);
          setSelectedVariantIdForDetail(undefined);
          onProductChange?.(null);
          loadProducts();
        }}
        onDeleteSuccess={(deletedId: string) => {
          closedProductIdRef.current = deletedId;
          setProductsList((prev) =>
            prev.map((p) => (p.id === deletedId ? { ...p, active: false } : p))
          );
          setSelectedProduct(null);
          setSelectedVariantIdForDetail(undefined);
          onProductChange?.(null);
          showToast(
            "Producto dado de baja",
            `"${selectedProduct.name}" fue dado de baja (baja lógica). Podés consultarlo o reactivarlo en "Inactivos".`
          );
          loadProducts();
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 select-none">
      {(activeSubView === "tablas" || (activeSubView === undefined && catalogViewTab !== "products")) ? (
        <MasterCategoriesManager
          initialTab={catalogViewTab === "products" ? "brands" : catalogViewTab}
          onTabChange={(tab) => setCatalogViewTab(tab)}
          onBackToInventory={() => {
            setCatalogViewTab("products");
            onSubViewChange?.("productos");
            loadProducts();
          }}
          onDataModified={() => {
            loadProducts();
          }}
        />
      ) : activeSubView === "movimientos" ? (
        <StockMovementHistoryView
          onBackToInventory={() => {
            onSubViewChange?.("productos");
            loadProducts();
          }}
          onNavigateToPriceHistory={() => {
            onSubViewChange?.("historial");
          }}
        />
      ) : activeSubView === "historial" ? (
        <PriceHistoryView
          onBackToInventory={() => {
            onSubViewChange?.("productos");
            loadProducts();
          }}
          onNavigateToStockMovements={() => {
            onSubViewChange?.("movimientos");
          }}
        />
      ) : (
        <>
          {/* Top Header: Title + Status + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-100">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex p-1.5 mr-1 bg-slate-900 text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors shadow-xs shrink-0"
                title="Mostrar menú lateral"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Inventario y Catálogo
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            Gestión de stock local y catálogo de e-commerce
          </p>
        </div>

        {/* Action icons & CTA Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap justify-start lg:justify-end overflow-x-auto pb-1 lg:pb-0">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={loadProducts}
              title="Recargar datos de base de datos"
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => handleToggleAlertsDrawer(true)}
              title={
                stockAlertsSummary.totalAlertVariants > 0
                  ? `${stockAlertsSummary.totalAlertVariants} alertas de stock crítico`
                  : "Centro de Alertas de Stock"
              }
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 relative cursor-pointer shrink-0"
            >
              <Bell className="w-4 h-4" />
              {stockAlertsSummary.totalAlertVariants > 0 ? (
                <span className="min-w-[17px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black absolute top-0.5 right-0.5 flex items-center justify-center ring-2 ring-white animate-pulse">
                  {stockAlertsSummary.totalAlertVariants > 99 ? "99+" : stockAlertsSummary.totalAlertVariants}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* Ajuste Masivo (Solo Icono) */}
          <button
            type="button"
            onClick={() => setIsBatchPriceModalOpen(true)}
            className="p-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-emerald-300 rounded-xl shadow-xs transition-all flex items-center justify-center border border-slate-800 select-none shrink-0 cursor-pointer"
            title="Ajuste Masivo de Precios"
            aria-label="Ajuste Masivo de Precios"
          >
            <Percent className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportModalOpen(true)}
            className="px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/90 active:scale-95 text-emerald-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs select-none whitespace-nowrap shrink-0 cursor-pointer"
            title="Importar catálogo e inventario desde Excel o CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="hidden xl:inline">Importar Excel/CSV</span>
            <span className="xl:hidden hidden sm:inline">Importar</span>
          </button>

          <Link
            href="/admin/productos/nuevo"
            className="bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] active:scale-95 text-white font-bold text-xs px-3.5 sm:px-4 py-2 rounded-xl border border-emerald-400/40 shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-1.5 select-none whitespace-nowrap shrink-0 cursor-pointer"
            title="Registrar Nuevo Producto con la Nueva Plantilla en Vivo"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5] shrink-0" />
            <span className="hidden sm:inline">Nuevo Producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        </div>
      </div>

      {/* Search Input (Lector USB / Barcode) & Discipline Filter Tabs */}
      <div className="space-y-2">
        {/* Search Input Box (Largo completo y adaptativo) */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar por código de barra, producto, marca, SKU o disciplina..."
            className="w-full text-xs text-slate-800 placeholder-slate-400 pl-10 pr-9 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 transition-all shadow-2xs focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Barra de Filtros Activos (Chips con remoción rápida) */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-0.5 select-none animate-in fade-in duration-150">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filtros activos:
            </span>

            {/* Chip: Estado */}
            {activeFilterMode !== "ACTIVE" && (
              <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold shadow-2xs">
                <span>Estado: {activeFilterMode === "INACTIVE" ? "Inactivos" : "Todos"}</span>
                <button
                  type="button"
                  onClick={() => setActiveFilterMode("ACTIVE")}
                  className="hover:bg-amber-200/60 p-0.5 rounded text-amber-700 hover:text-amber-950 transition-colors cursor-pointer"
                  title="Quitar filtro de estado"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Chip: Stock */}
            {stockAlertFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-900 text-xs font-semibold shadow-2xs">
                <span>
                  Stock:{" "}
                  {stockAlertFilter === "IN_ALERT"
                    ? "En Alerta"
                    : stockAlertFilter === "OUT_OF_STOCK"
                    ? "Agotados"
                    : "Reponer Mostrador"}
                </span>
                <button
                  type="button"
                  onClick={() => setStockAlertFilter("ALL")}
                  className="hover:bg-rose-200/60 p-0.5 rounded text-rose-700 hover:text-rose-950 transition-colors cursor-pointer"
                  title="Quitar filtro de stock"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Chip: Disciplina */}
            {selectedDiscipline !== "Todas" && (
              <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-semibold shadow-2xs">
                <span>Disciplina: {selectedDiscipline}</span>
                <button
                  type="button"
                  onClick={() => handleSelectDiscipline("Todas")}
                  className="hover:bg-slate-800 p-0.5 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Quitar filtro de disciplina"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Chip: Marca */}
            {selectedBrand !== "Todas" && (
              <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-indigo-900 text-xs font-semibold shadow-2xs">
                <span>Marca: {selectedBrand}</span>
                <button
                  type="button"
                  onClick={() => setSelectedBrand("Todas")}
                  className="hover:bg-indigo-200/60 p-0.5 rounded text-indigo-700 hover:text-indigo-950 transition-colors cursor-pointer"
                  title="Quitar filtro de marca"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Chip: Categoría */}
            {selectedCategory !== "Todas" && (
              <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-900 text-xs font-semibold shadow-2xs">
                <span>Categoría: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Todas")}
                  className="hover:bg-sky-200/60 p-0.5 rounded text-sky-700 hover:text-sky-950 transition-colors cursor-pointer"
                  title="Quitar filtro de categoría"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Botón para restablecer todos los filtros */}
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="text-[11.5px] font-semibold text-slate-500 hover:text-slate-900 underline hover:no-underline ml-1 transition-colors cursor-pointer"
            >
              Limpiar todos
            </button>
          </div>
        )}

        {/* Banner Informativo al consultar Inactivos */}
        {activeFilterMode === "INACTIVE" && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-100/90 rounded-xl border border-slate-200 text-slate-700 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span className="font-medium">
                Mostrando <strong className="font-bold text-slate-900">artículos dados de baja lógica</strong>. Están ocultos del mostrador (POS) y catálogo de ventas. Podés reactivarlos con el botón <strong>Reactivar</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveFilterMode("ACTIVE")}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
            >
              Volver a productos activos
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* VISTA DE PRODUCTOS: TABLA RESPONSIVE CON SCROLL Y TARJETAS */}
      {/* ======================================================== */}

      {/* Selector de modo de vista y Filtro (Embudo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 whitespace-nowrap truncate">
          <span className="font-semibold text-slate-700 text-xs">
            {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"} en catálogo
          </span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            • Desliza horizontalmente ↔
          </span>
        </div>

        {/* Acciones: Filtro (Embudo) al lado de Tabla / Tarjetas */}
        <div className="flex items-center gap-2 select-none justify-between sm:justify-end w-full sm:w-auto">
          {/* Botón y Popover del Filtro Unificado (Icono Embudo) */}
          <div className="relative" ref={filterMenuRef}>
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-2xs select-none cursor-pointer ${
                activeFiltersCount > 0 || isFilterMenuOpen
                  ? "bg-slate-900 text-white border-slate-800 shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
              title="Filtrar por estado, stock y disciplina deportiva"
            >
              <Filter
                className={`w-3.5 h-3.5 transition-colors ${
                  activeFiltersCount > 0 ? "text-[#00D615]" : "text-slate-500"
                }`}
              />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="min-w-[17px] h-[17px] px-1 rounded-full bg-[#00D615] text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  isFilterMenuOpen ? "rotate-180 text-white" : "text-slate-400"
                }`}
              />
            </button>

            {/* Popover Menú Desplegable del Filtro */}
            {isFilterMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
                {/* Cabecera del Popover */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
                        <Filter className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">Filtros del Catálogo</h4>
                        <p className="text-[11px] text-slate-500">Estado, stock, disciplina, marca y categoría</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetAllFilters}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          title="Restablecer todos los filtros"
                        >
                          Restablecer
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsFilterMenuOpen(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Cerrar filtros"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo de Filtros con scroll interno si es necesario */}
                  <div className="space-y-4 pr-1 overflow-y-auto custom-scrollbar">
                  {/* 1. FILTRO POR ESTADO */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Estado del Producto</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {activeStatusSummary.totalCount} en total
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setActiveFilterMode("ACTIVE")}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          activeFilterMode === "ACTIVE"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                      >
                        <span>Activos</span>
                        <span className={`text-[10px] ${activeFilterMode === "ACTIVE" ? "text-emerald-300 font-bold" : "text-slate-400"}`}>
                          ({activeStatusSummary.activeCount})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilterMode("INACTIVE")}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          activeFilterMode === "INACTIVE"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                      >
                        <span>Inactivos</span>
                        <span className={`text-[10px] ${activeFilterMode === "INACTIVE" ? "text-amber-100 font-bold" : "text-slate-400"}`}>
                          ({activeStatusSummary.inactiveCount})
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFilterMode("ALL")}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                          activeFilterMode === "ALL"
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                        }`}
                      >
                        <span>Todos</span>
                        <span className={`text-[10px] ${activeFilterMode === "ALL" ? "text-slate-300 font-bold" : "text-slate-400"}`}>
                          ({activeStatusSummary.totalCount})
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 2. FILTRO POR DISCIPLINA */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Disciplina Deportiva</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {allDisciplines.length - 1} disciplinas
                      </span>
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={selectedDiscipline}
                        onChange={(e) => handleSelectDiscipline(e.target.value)}
                        className="w-full text-xs font-bold pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 text-slate-800 cursor-pointer outline-none transition-all shadow-2xs"
                      >
                        {allDisciplines.map((d) => {
                          const count = disciplineCounts[d] ?? (d === "Todas" ? disciplineCounts.Todas ?? 0 : 0);
                          return (
                            <option key={d} value={d} className="bg-white text-slate-900 font-medium">
                              {d === "Todas" ? `Todas las disciplinas (${count})` : `${d} (${count})`}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* 3. MARCA Y CATEGORÍA (GRID PARA AHORRAR ESPACIO) */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* FILTRO POR MARCA */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Marca</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {brandOptions.length}
                        </span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedBrand}
                          onChange={(e) => setSelectedBrand(e.target.value)}
                          className="w-full text-xs font-bold pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 text-slate-800 cursor-pointer outline-none transition-all shadow-2xs appearance-none truncate"
                        >
                          <option value="Todas">Todas las marcas</option>
                          {brandOptions.map((b) => (
                            <option key={b.name} value={b.name}>
                              {b.name} ({b.count})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* FILTRO POR CATEGORÍA */}
                    <div className="space-y-1.5">
                      <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Categoría</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {categoryOptions.length}
                        </span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full text-xs font-bold pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 text-slate-800 cursor-pointer outline-none transition-all shadow-2xs appearance-none truncate"
                        >
                          <option value="Todas">Todas las categorías</option>
                          {categoryOptions.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.count})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 4. FILTRO DE STOCK (Personalizado con Iconos) */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Nivel de Stock</span>
                      {stockAlertsSummary.totalAlertVariants > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold">
                          {stockAlertsSummary.totalAlertVariants} en alerta
                        </span>
                      )}
                    </label>
                    
                    {/* Botón selector del dropdown */}
                    <button
                      type="button"
                      onClick={() => setIsStockDropdownOpen(!isStockDropdownOpen)}
                      className="w-full text-xs font-bold pl-3 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 text-slate-800 flex items-center justify-between transition-all shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {stockAlertFilter === "ALL" && (
                          <><Boxes className="w-4 h-4 text-slate-500" /><span>Todos los niveles de stock</span></>
                        )}
                        {stockAlertFilter === "IN_ALERT" && (
                          <><AlertTriangle className="w-4 h-4 text-rose-600" /><span>En Alerta (Crítico o Agotado)</span></>
                        )}
                        {stockAlertFilter === "OUT_OF_STOCK" && (
                          <><AlertOctagon className="w-4 h-4 text-rose-700" /><span>Agotados (0 un. total)</span></>
                        )}
                        {stockAlertFilter === "STORE_REPLENISHMENT" && (
                          <><Store className="w-4 h-4 text-orange-600" /><span>Reponer Mostrador (Dep. dispon.)</span></>
                        )}
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isStockDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Menú Desplegable Absoluto (hacia arriba) */}
                    {isStockDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[105]" onClick={() => setIsStockDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 bottom-[calc(100%+4px)] bg-white rounded-xl shadow-xl border border-slate-200/90 p-1.5 z-[110] space-y-1 animate-in fade-in zoom-in-95">
                          {/* Option 1: ALL */}
                          <button
                            type="button"
                            onClick={() => { setStockAlertFilter("ALL"); setIsStockDropdownOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              stockAlertFilter === "ALL" ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Boxes className={`w-4 h-4 ${stockAlertFilter === "ALL" ? "text-emerald-500" : "text-slate-400"}`} />
                              <span>Todos los niveles</span>
                            </div>
                            {stockAlertFilter === "ALL" && <CheckCircle2 className="w-3.5 h-3.5 text-[#00D615]" />}
                          </button>
                          
                          {/* Option 2: IN_ALERT */}
                          <button
                            type="button"
                            onClick={() => { handleToggleStockAlertFilter("IN_ALERT"); setIsStockDropdownOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              stockAlertFilter === "IN_ALERT" ? "bg-rose-50 text-rose-900" : "hover:bg-rose-50/50 text-rose-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-500" />
                              <span>En Alerta</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              stockAlertFilter === "IN_ALERT" ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"
                            }`}>
                              {stockAlertsSummary.totalAlertVariants}
                            </span>
                          </button>

                          {/* Option 3: OUT_OF_STOCK */}
                          <button
                            type="button"
                            onClick={() => { handleToggleStockAlertFilter("OUT_OF_STOCK"); setIsStockDropdownOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              stockAlertFilter === "OUT_OF_STOCK" ? "bg-rose-100 text-rose-900" : "hover:bg-rose-50 text-rose-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <AlertOctagon className="w-4 h-4 text-rose-600" />
                              <span>Agotados</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              stockAlertFilter === "OUT_OF_STOCK" ? "bg-rose-700 text-white" : "bg-rose-200 text-rose-800"
                            }`}>
                              {stockAlertsSummary.outOfStockCount}
                            </span>
                          </button>

                          {/* Option 4: STORE_REPLENISHMENT */}
                          <button
                            type="button"
                            onClick={() => { handleToggleStockAlertFilter("STORE_REPLENISHMENT"); setIsStockDropdownOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              stockAlertFilter === "STORE_REPLENISHMENT" ? "bg-orange-50 text-orange-900" : "hover:bg-orange-50/50 text-orange-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-orange-500" />
                              <span>Reponer Mostrador</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              stockAlertFilter === "STORE_REPLENISHMENT" ? "bg-orange-600 text-white" : "bg-orange-100 text-orange-700"
                            }`}>
                              {stockAlertsSummary.storeEmptyCount}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Pie del Popover */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 shrink-0">
                  <span className="text-[11.5px] text-slate-500 font-medium">
                    <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "coincidencia" : "coincidencias"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFilterMenuOpen(false)}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Switcher: Tabla vs Tarjetas */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setMobileViewMode("table")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                mobileViewMode === "table"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode("cards")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                mobileViewMode === "cards"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Acciones de Selección Múltiple */}
      {selectedProductIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-b from-[#16a34a] to-[#0f6f36] text-white font-bold flex items-center justify-center text-xs shadow-xs border border-emerald-400/30">
              {selectedProductIds.size}
            </span>
            <span className="text-xs font-semibold text-slate-200">
              {selectedProductIds.size === 1 ? "producto seleccionado" : "productos seleccionados"} para ajuste masivo
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchPriceModalOpen(true)}
              className="bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs border border-emerald-400/40 transition-all flex items-center gap-1.5"
            >
              <Percent className="w-3.5 h-3.5 text-white" />
              <span>Ajustar Precios de Seleccionados</span>
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. CARDS VIEW (Visible cuando mobileViewMode === "cards") */}
      {/* ======================================================== */}
      <div className={`${mobileViewMode === "cards" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" : "hidden"}`}>
        {filteredProducts.length === 0 ? (
          <div className="col-span-full bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Barcode className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-xs">
                {searchMode === "barcode"
                  ? "Código de barra no encontrado"
                  : "No se encontraron productos"}
              </h4>
              <p className="text-slate-400 text-[11px] mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? searchMode === "barcode"
                    ? `No existe ningún producto con el código "${searchQuery}". Verifique que el código esté asignado.`
                    : `No hay coincidencias para "${searchQuery}".`
                  : activeFilterMode === "INACTIVE"
                  ? "No hay productos inactivos o dados de baja en el sistema."
                  : stockAlertFilter !== "ALL"
                  ? `No hay artículos ${stockAlertFilter === "OUT_OF_STOCK" ? "agotados" : "en alerta de stock"} en la categoría "${selectedDiscipline}".`
                  : "No hay productos registrados en esta disciplina."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Limpiar búsqueda
                </button>
              )}
              {activeFilterMode === "INACTIVE" && (
                <button
                  type="button"
                  onClick={() => setActiveFilterMode("ACTIVE")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                >
                  Volver a productos activos
                </button>
              )}
              {stockAlertFilter !== "ALL" && selectedDiscipline !== "Todas" && (
                <button
                  type="button"
                  onClick={() => handleSelectDiscipline("Todas")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                >
                  Ver alertas en todas las disciplinas
                </button>
              )}
              {stockAlertFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setStockAlertFilter("ALL")}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Quitar filtro de stock
                </button>
              )}
            </div>
          </div>
        ) : (
          paginatedProducts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className={`bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] space-y-3 cursor-pointer ${
                item.active === false ? "opacity-60 hover:opacity-100 bg-slate-50/60" : ""
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start gap-3">
                {item.imageUrl ? (
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs p-0.5">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.iconBg} text-white flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    <Package className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-xs truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {item.brand} • {item.category}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10.5px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.discipline}
                    </span>
                    {item.active === false && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                        Inactivo
                      </span>
                    )}
                    {(() => {
                      const status = evaluateProductStockStatus(item);
                      if (status.highestAlert === "OUT_OF_STOCK") {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertOctagon className="w-2.5 h-2.5 text-rose-600" />
                            <span>Agotado</span>
                          </span>
                        );
                      }
                      if (status.highestAlert === "STORE_EMPTY_WAREHOUSE_AVAIL") {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                            <Store className="w-2.5 h-2.5 text-orange-600" />
                            <span>Salón Vacío</span>
                          </span>
                        );
                      }
                      if (status.highestAlert === "CRITICAL_LOW") {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            <span>Stock Crítico</span>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>

              {/* Price, Stock and Barcode */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Precio Venta</span>
                  {(() => {
                    const matchedVar = getMatchedVariant(item, searchQuery);
                    if (matchedVar && matchedVar.price) {
                      return (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {formatCurrency(matchedVar.price)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Talle {matchedVar.size}
                          </span>
                        </div>
                      );
                    }
                    const variantPrices = item.variants
                      ? item.variants.map((v) => v.price ?? item.price).filter((p) => p > 0)
                      : [];
                    if (variantPrices.length > 1) {
                      const minP = Math.min(...variantPrices);
                      const maxP = Math.max(...variantPrices);
                      if (minP !== maxP) {
                        return (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs">
                              {formatCurrency(minP)} – {formatCurrency(maxP)}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium">
                              Precios por talle
                            </span>
                          </div>
                        );
                      }
                    }
                    return (
                      <span className="font-bold text-slate-900 text-xs">
                        {formatCurrency(item.price)}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Stock Local</span>
                  {(() => {
                    const matchedVar = getMatchedVariant(item, searchQuery);
                    const badge = getProductStockBadgeInfo(item, matchedVar);

                    return (
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md border mt-0.5 ${badge.badgeClass}`}
                        title={`${badge.label} - ${badge.subtext}`}
                      >
                        {badge.iconType === "alert-octagon" ? (
                          <AlertOctagon className={`w-3 h-3 shrink-0 ${badge.iconColorClass}`} />
                        ) : badge.iconType === "alert-triangle" ? (
                          <AlertTriangle className={`w-3 h-3 shrink-0 ${badge.iconColorClass}`} />
                        ) : (
                          <Store className={`w-3 h-3 shrink-0 ${badge.iconColorClass}`} />
                        )}
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Modelo</span>
                  <span className="font-mono text-[11px] text-slate-700 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/70" title="Código de Modelo">
                    {item.modelCode || item.sku}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  {(() => {
                    const matchedVariant = getMatchedVariant(item, searchQuery);
                    return (
                      <button
                        onClick={(e) => handleOpenStockModal(item, "TRANSFERENCIA_INTERNA", matchedVariant?.id, e)}
                        title={
                          matchedVariant
                            ? `Ajustar stock de variante escaneada (${matchedVariant.size} - ${matchedVariant.color})`
                            : "Movimientos y Traslado de Stock"
                        }
                        className={`p-2 rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ${
                          matchedVariant
                            ? "text-emerald-950 bg-emerald-100 hover:bg-emerald-200 ring-2 ring-emerald-500/40 font-bold shadow-2xs"
                            : "text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        {matchedVariant && (
                          <span className="text-[10.5px] font-bold text-emerald-950">
                            {matchedVariant.size}
                          </span>
                        )}
                      </button>
                    );
                  })()}
                  <button
                    onClick={(e) => handleOpenEditModal(item, e)}
                    title="Editar producto"
                    className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {item.active === false ? (
                    <button
                      onClick={(e) => handleReactivateProduct(item, e)}
                      disabled={isReactivatingId === item.id}
                      title="Reactivar producto y devolver al mostrador (POS) y catálogo activo"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isReactivatingId === item.id ? "animate-spin" : ""}`} />
                      <span>Reactivar</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleOpenDeleteModal(item, e)}
                      title="Dar de baja producto"
                      className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleOpenDetail(item)}
                  className="bg-[#c2f25b] hover:bg-[#b0e838] active:scale-95 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-2xs transition-all"
                >
                  Ver Detalle
                </button>
              </div>
            </div>
          ))
        )}

        {/* Paginador para la vista de tarjetas */}
        {filteredProducts.length > 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden mt-3">
            {renderPaginationFooter()}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. TABLA RESPONSIVA CON SCROLL HORIZONTAL (Todas las pantallas) */}
      {/* ======================================================== */}
      <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all ${
        mobileViewMode === "cards" ? "hidden" : "block"
      }`}>
        
        {/* Barra superior de información y aviso de scroll horizontal */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-slate-50/90 border-b border-slate-200/80 text-[11px] sm:text-[11.5px] text-slate-500 whitespace-nowrap">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate mr-2">
            <span>
              Mostrando <strong className="text-slate-900 font-bold">{paginatedProducts.length}</strong> de {filteredProducts.length}
            </span>
            <span className="hidden md:inline font-normal text-slate-400">• Desliza horizontalmente ↔</span>
          </span>
          <span className="text-[10.5px] font-mono text-slate-500 shrink-0 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
            Pág. {validCurrentPage} / {totalPages}
          </span>
        </div>

        {/* Contenedor con scroll VERTICAL Y HORIZONTAL optimizado con altura máxima adaptable */}
        <div className="overflow-x-auto custom-scrollbar touch-pan-x select-text relative border-b border-slate-200/60">
          <table className="w-full text-left text-xs min-w-[760px] border-collapse">
            {/* Table Header con sticky top sólido para no transparentarse en scroll vertical */}
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center bg-slate-50">
                  <input
                    type="checkbox"
                    checked={paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedProductIds.has(p.id))}
                    onChange={toggleSelectAllVisible}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 align-middle"
                    title="Seleccionar o deseleccionar todos los visibles"
                  />
                </th>
                <th className="py-3 px-5 min-w-[240px] bg-slate-50">PRODUCTO / MARCA</th>
                <th className="py-3 px-4 min-w-[130px] bg-slate-50">DISCIPLINA</th>
                <th className="py-3 px-4 min-w-[120px] bg-slate-50">PRECIO VENTA</th>
                <th className="py-3 px-4 min-w-[140px] bg-slate-50">STOCK LOCAL</th>
                <th className="py-3 px-4 min-w-[150px] bg-slate-50">CÓD. BARRA / SKU</th>
                <th className="py-3 px-5 min-w-[140px] text-right sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]">ACCIÓN</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                        <Barcode className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">
                          {searchMode === "barcode"
                            ? "Código de barra no encontrado"
                            : "No se encontraron productos coincidentes"}
                        </h4>
                        <p className="text-slate-400 text-xs mt-1">
                          {searchQuery
                            ? searchMode === "barcode"
                              ? `No existe ningún producto con el código "${searchQuery}". Asegúrese de que el código esté asignado en el producto o variantes.`
                              : `No hay productos que coincidan con "${searchQuery}".`
                            : activeFilterMode === "INACTIVE"
                            ? "No hay productos inactivos o dados de baja en el sistema."
                            : stockAlertFilter !== "ALL"
                            ? `No hay artículos ${stockAlertFilter === "OUT_OF_STOCK" ? "agotados" : "en alerta de stock"} en la disciplina "${selectedDiscipline}".`
                            : "No hay productos registrados bajo esta categoría o disciplina."}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              searchInputRef.current?.focus();
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5" />
                            Limpiar búsqueda y volver a escanear
                          </button>
                        )}
                        {activeFilterMode === "INACTIVE" && (
                          <button
                            type="button"
                            onClick={() => setActiveFilterMode("ACTIVE")}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
                          >
                            Volver a productos activos
                          </button>
                        )}
                        {stockAlertFilter !== "ALL" && selectedDiscipline !== "Todas" && (
                          <button
                            type="button"
                            onClick={() => handleSelectDiscipline("Todas")}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
                          >
                            Ver alertas en todas las disciplinas
                          </button>
                        )}
                        {stockAlertFilter !== "ALL" && (
                          <button
                            type="button"
                            onClick={() => setStockAlertFilter("ALL")}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5 text-slate-400" />
                            Quitar filtro de stock
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                        selectedProductIds.has(item.id) ? "bg-emerald-50/40" : ""
                      } ${item.active === false ? "opacity-60 hover:opacity-100 bg-slate-50/60" : ""}`}
                      onClick={() => handleOpenDetail(item)}
                    >
                      {/* Checkbox de Selección */}
                      <td className="py-4 px-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.has(item.id)}
                          onChange={(e) => toggleSelectProduct(item.id, e)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4 align-middle"
                        />
                      </td>
                      {/* 1. Name / Brand */}
                      <td className="py-4 px-5 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform p-0.5">
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.iconBg} text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                            >
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                                {item.name}
                              </span>
                              {item.active === false && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                                  Inactivo
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {item.brand} • {item.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Discipline */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/70">
                          {item.discipline}
                        </span>
                      </td>

                      {/* 3. Sale Price */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        {(() => {
                          const matchedVar = getMatchedVariant(item, searchQuery);
                          if (matchedVar && matchedVar.price) {
                            return (
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-xs">
                                  {formatCurrency(matchedVar.price)}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-semibold">
                                  Talle {matchedVar.size}
                                </span>
                              </div>
                            );
                          }
                          const variantPrices = item.variants
                            ? item.variants.map((v) => v.price ?? item.price).filter((p) => p > 0)
                            : [];
                          if (variantPrices.length > 1) {
                            const minP = Math.min(...variantPrices);
                            const maxP = Math.max(...variantPrices);
                            if (minP !== maxP) {
                              return (
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {formatCurrency(minP)} – {formatCurrency(maxP)}
                                  </span>
                                  <span className="text-[10px] text-emerald-700 font-medium">
                                    Precios por talle
                                  </span>
                                </div>
                              );
                            }
                          }
                          return (
                            <span className="font-bold text-slate-900 text-xs">
                              {formatCurrency(item.price)}
                            </span>
                          );
                        })()}
                      </td>

                      {/* 4. Stock Disponible en Local (Saavedra 241) */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[130px]">
                        {(() => {
                          const matchedVar = getMatchedVariant(item, searchQuery);
                          const badge = getProductStockBadgeInfo(item, matchedVar);

                          return (
                            <span
                              title={badge.subtext}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border w-fit ${badge.badgeClass}`}
                            >
                              {badge.iconType === "alert-octagon" ? (
                                <AlertOctagon className={`w-3.5 h-3.5 shrink-0 ${badge.iconColorClass}`} />
                              ) : badge.iconType === "alert-triangle" ? (
                                <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${badge.iconColorClass}`} />
                              ) : (
                                <Store className={`w-3.5 h-3.5 shrink-0 ${badge.iconColorClass}`} />
                              )}
                              <span>{badge.label}</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* 5. Barcode / SKU + Selector de Variantes */}
                      <td className="py-4 px-4 whitespace-nowrap min-w-[150px]">
                        {(() => {
                          const matchedVar = getMatchedVariant(item, searchQuery);
                          if (matchedVar) {
                            return (
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-emerald-700 text-[11.5px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block w-fit">
                                  {matchedVar.barcode}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                  Variante: {matchedVar.size} • {matchedVar.color}
                                </span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80 w-fit" title="Código de Modelo">
                                  {item.modelCode || item.sku}
                                </span>
                              </div>
                              {item.variants && item.variants.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleExpandProduct(item.id, e)}
                                  className="text-[10.5px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 mt-0.5 w-fit hover:underline"
                                  title="Ver fila de variantes y acciones rápidas de stock"
                                >
                                  <span>{item.variants.length} variantes</span>
                                  {expandedProductIds.has(item.id) ? (
                                    <ChevronUp className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 text-emerald-600" />
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* 6. Action Buttons (Sticky Right para no perderse al scrollear) */}
                      <td className="py-4 px-5 text-right whitespace-nowrap min-w-[150px] sticky right-0 bg-white group-hover:bg-slate-50/90 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón rápido de Movimiento de Stock */}
                          {(() => {
                            const matchedVar = getMatchedVariant(item, searchQuery);
                            return (
                              <button
                                onClick={(e) => handleOpenStockModal(item, "TRANSFERENCIA_INTERNA", matchedVar?.id, e)}
                                title={
                                  matchedVar
                                    ? `Ajustar stock de variante escaneada (${matchedVar.size} - ${matchedVar.color})`
                                    : "Ajustar Stock / Movimientos"
                                }
                                className={`p-1.5 rounded-lg transition-all border ${
                                  matchedVar
                                    ? "text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border-emerald-300 font-bold ring-2 ring-emerald-500/30"
                                    : "text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border-transparent hover:border-emerald-200"
                                }`}
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            );
                          })()}
                          <button
                            onClick={(e) => handleOpenEditModal(item, e)}
                            title="Editar producto"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {item.active === false ? (
                            <button
                              onClick={(e) => handleReactivateProduct(item, e)}
                              disabled={isReactivatingId === item.id}
                              title="Reactivar producto y devolver al mostrador (POS) y catálogo activo"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-2xs"
                            >
                              <RefreshCw className={`w-3 h-3 text-emerald-600 ${isReactivatingId === item.id ? "animate-spin" : ""}`} />
                              <span>Reactivar</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleOpenDeleteModal(item, e)}
                              title="Dar de baja producto"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="bg-[#c2f25b] hover:bg-[#b0e838] active:scale-95 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-2xs transition-all tracking-tight ml-1"
                          >
                            Ver Detalle
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Fila Desplegable de Variantes con Acciones Rápidas (RF-03 / CU-04) */}
                    {expandedProductIds.has(item.id) && item.variants && item.variants.length > 0 && (
                      <tr className="bg-slate-50/70 border-b border-slate-200/90 animate-in fade-in duration-200">
                        <td colSpan={7} className="py-2.5 px-4 sm:px-6">
                          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                            <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Boxes className="w-3.5 h-3.5 text-slate-600" />
                                Fila de Variantes ({item.variants.length} talles registrados)
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Operaciones directas de stock por variante
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-semibold text-[10px] uppercase border-b border-slate-200/70">
                                  <tr>
                                    <th className="py-2 px-3">Talle / Color</th>
                                    <th className="py-2 px-3 font-mono">Cód. Barra</th>
                                    <th className="py-2 px-3 text-center">Stock Tienda</th>
                                    <th className="py-2 px-3 text-center">Stock Depósito</th>
                                    <th className="py-2 px-3 text-center">Total</th>
                                    <th className="py-2 px-3 text-center">Estado</th>
                                    <th className="py-2 px-3 text-center min-w-[90px]">Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {item.variants.map((v, vIdx) => {
                                    const vTotal = (v.stockStore || 0) + (v.stockWarehouse || 0);
                                    return (
                                      <tr key={v.id || vIdx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-2 px-3 font-semibold text-slate-800">
                                          <div className="flex flex-col">
                                            <div className="flex items-center">
                                              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] mr-1.5 font-bold text-slate-900">
                                                {v.size}
                                              </span>
                                              <span className="text-slate-600 text-[11px]">{v.color}</span>
                                            </div>
                                            {v.sku && (
                                              <span className="text-[10px] text-slate-400 font-mono mt-0.5" title="SKU de la Variante">
                                                SKU: {v.sku}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 font-mono text-[11px]">
                                          {v.barcode ? (
                                            <span className="text-slate-800 font-semibold">{v.barcode}</span>
                                          ) : (
                                            <span className="text-slate-400 italic text-[10.5px]">Sin código</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                            (v.stockStore || 0) === 0 ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-800"
                                          }`}>
                                            {v.stockStore || 0} un.
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">
                                            {v.stockWarehouse || 0} un.
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center font-bold text-slate-900">
                                          {vTotal}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          {vTotal === 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-zinc-900 text-zinc-100 border border-zinc-700 shadow-2xs">
                                              <AlertOctagon className="w-2.5 h-2.5 text-zinc-400" />
                                              <span>Agotado</span>
                                            </span>
                                          ) : (v.stockStore || 0) === 0 && (v.stockWarehouse || 0) > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-950 border border-orange-300">
                                              <Store className="w-2.5 h-2.5 text-orange-600" />
                                              <span>Salón 0</span>
                                            </span>
                                          ) : vTotal <= 1 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-950 border border-rose-300">
                                              <AlertOctagon className="w-2.5 h-2.5 text-rose-600" />
                                              <span>Riesgo</span>
                                            </span>
                                          ) : vTotal <= (v.minStock ?? item.minStock ?? 2) ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                              <span>Por agotarse</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                              <span>Óptimo</span>
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            type="button"
                                            onClick={(e) => handleOpenStockModal(item, undefined, v.id, e)}
                                            className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-950 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                                            title={`Modificar stock de variante (Talle ${v.size} - ${v.color})`}
                                          >
                                            Modificar
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de tabla con paginación integrada */}
        {renderPaginationFooter()}
      </div>
      </>
    )}

      {/* Modal de Crear / Editar Producto */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(isEditing) => {
          loadProducts();
          setIsModalOpen(false);
          showToast(
            isEditing ? "Producto actualizado" : "Producto creado",
            isEditing
              ? "Los cambios en el producto y sus variantes fueron guardados."
              : "El nuevo producto se agregó correctamente al inventario."
          );
        }}
        productToEdit={editingProduct}
      />

      {/* Modal de Confirmación para Eliminar Producto */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">
                  ¿Dar de baja producto?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  El producto <strong className="text-slate-800 font-semibold">{productToDelete.name}</strong> se dará de baja del mostrador (POS) y catálogo activo. <span className="font-medium text-slate-700">Su historial contable y trazabilidad se conservan intactos, y podés reactivarlo en cualquier momento filtrando por &quot;Inactivos / Dados de Baja&quot;</span>.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dando de baja...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Baja Lógica</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Movimientos Manuales de Stock (RF-03 / CU-04) */}
      {stockModalProduct && (
        <StockMovementModal
          isOpen={isStockModalOpen}
          onClose={() => {
            setIsStockModalOpen(false);
            setStockModalProduct(null);
            setStockModalOperation(undefined);
            setStockModalVariantId(undefined);
          }}
          product={stockModalProduct}
          onSuccess={() => {
            loadProducts();
            showToast("Stock actualizado", "El movimiento de stock se registró correctamente en el sistema.");
          }}
          initialOperationType={stockModalOperation}
          initialVariantId={stockModalVariantId}
        />
      )}

      {/* Modal de Actualización Masiva y Porcentual de Precios (RF-01.1 / CU-INV-05) */}
      <BatchPriceUpdateModal
        isOpen={isBatchPriceModalOpen}
        onClose={() => setIsBatchPriceModalOpen(false)}
        onSuccess={() => {
          loadProducts();
          clearSelection();
          showToast(
            "Precios actualizados",
            "La actualización masiva de precios se aplicó exitosamente en el catálogo."
          );
        }}
        selectedProductIds={Array.from(selectedProductIds)}
        totalCatalogProductsCount={productsList.length}
      />

      {/* Modal de Carga Inicial Progresiva e Ingestión Excel/CSV (RF-04 / CU-INV-02) */}
      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onSuccess={() => {
          loadProducts();
          showToast(
            "Lote importado con éxito",
            "Los productos y variantes del archivo fueron incorporados al catálogo."
          );
        }}
      />

      {/* Drawer de Alertas de Stock Crítico y Productos Agotados (RF-06 / CU-INV-08) */}
      <StockAlertsDrawer
        isOpen={isStockAlertsDrawerOpen}
        onClose={() => handleToggleAlertsDrawer(false)}
        products={productsList}
        onSelectProduct={(productId) => {
          const prod = productsList.find((p) => p.id === productId);
          if (prod) {
            handleOpenDetail(prod);
          }
        }}
        onOpenStockMovement={(product, operation, variantId) => {
          handleOpenStockModal(product, operation, variantId);
        }}
        onRefresh={loadProducts}
      />

      {/* Modal de Registro Rápido de Venta Multiproducto de Mostrador */}
      <QuickSaleModal
        isOpen={isQuickSaleModalOpen}
        onClose={() => setIsQuickSaleModalOpen(false)}
        products={productsList}
        onSaleSuccess={() => {
          loadProducts();
          showToast("Venta registrada", "El stock de salón y el ticket fueron procesados con éxito.");
        }}
        onOpenHistory={(ticketNumber) => {
          setSelectedHistoryTicket(ticketNumber || null);
          setIsSalesHistoryModalOpen(true);
        }}
      />

      {/* Modal de Historial de Tickets y Comprobantes de Venta */}
      <SalesHistoryModal
        isOpen={isSalesHistoryModalOpen}
        onClose={() => {
          setIsSalesHistoryModalOpen(false);
          setSelectedHistoryTicket(null);
        }}
        selectedTicketNumber={selectedHistoryTicket}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3.5 w-full sm:w-auto sm:min-w-[320px] max-w-md mx-auto">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>
              {toast.description && (
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight truncate">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
