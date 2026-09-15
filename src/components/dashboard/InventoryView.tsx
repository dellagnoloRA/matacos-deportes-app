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
  PackagePlus,
  MinusCircle,
  Percent,
  History,
  FileSpreadsheet,
  AlertOctagon,
  Layers,
  Tag,
} from "lucide-react";
import { MasterCategoriesManager, type MasterTabType } from "./MasterCategoriesManager";
import { formatCurrency } from "@/lib/utils";
import { DetailedProductItem } from "./types";
import { ProductDetailView } from "./ProductDetailView";
import { ProductFormModal } from "./ProductFormModal";
import { StockMovementModal, type OperationType } from "./StockMovementModal";
import { StockAlertsDrawer } from "./StockAlertsDrawer";
import { BatchPriceUpdateModal } from "./BatchPriceUpdateModal";
import { PriceHistoryModal } from "./PriceHistoryModal";
import { BulkImportModal } from "./BulkImportModal";
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

    if (total === 0) outOfStockVariants = 1;
    else if (totalStore === 0 && totalWarehouse > 0) storeEmptyVariants = 1;
    else if (total <= minStock) criticalLowVariants = 1;
  } else {
    for (const v of variants) {
      const vStore = v.stockStore ?? 0;
      const vWarehouse = v.stockWarehouse ?? 0;
      const vTotal = vStore + vWarehouse;

      totalStore += vStore;
      totalWarehouse += vWarehouse;

      if (vTotal === 0) {
        outOfStockVariants++;
      } else if (vStore === 0 && vWarehouse > 0) {
        storeEmptyVariants++;
      } else if (vTotal <= minStock || (vStore <= 1 && vWarehouse > 0)) {
        criticalLowVariants++;
      }
    }
  }

  const totalStock = totalStore + totalWarehouse;
  const totalAlerts = outOfStockVariants + storeEmptyVariants + criticalLowVariants;

  let highestAlert: "OUT_OF_STOCK" | "STORE_EMPTY_WAREHOUSE_AVAIL" | "CRITICAL_LOW" | "NORMAL" = "NORMAL";

  if (outOfStockVariants > 0 || totalStock === 0) {
    highestAlert = "OUT_OF_STOCK";
  } else if (storeEmptyVariants > 0 || (totalStore === 0 && totalWarehouse > 0)) {
    highestAlert = "STORE_EMPTY_WAREHOUSE_AVAIL";
  } else if (criticalLowVariants > 0 || totalStock <= minStock) {
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

interface InventoryViewProps {
  selectedDiscipline?: string;
  onDisciplineChange?: (discipline: string) => void;
  initialProducts?: DetailedProductItem[];
  selectedProductId?: string | null;
  onProductChange?: (productId: string | null) => void;
  isAlertsDrawerOpen?: boolean;
  onToggleAlertsDrawer?: (open: boolean) => void;
  onAlertsCountChange?: (count: number) => void;
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
}: InventoryViewProps = {}) {
  const [searchMode, setSearchMode] = useState<"barcode" | "all">("barcode");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [internalDiscipline, setInternalDiscipline] = useState("Todas");
  const selectedDiscipline = controlledDiscipline !== undefined ? controlledDiscipline : internalDiscipline;
  const [selectedProduct, setSelectedProduct] = useState<DetailedProductItem | null>(null);
  const [productsList, setProductsList] = useState<DetailedProductItem[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : INITIAL_PRODUCTS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveFromDb, setIsLiveFromDb] = useState(
    Boolean(initialProducts && initialProducts.length > 0)
  );
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
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Estado para Carga Masiva e Ingestión Excel/CSV (RF-04 / CU-INV-02)
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

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
        setIsLiveFromDb(true);
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

  // Identificar qué variante coincide con el código de barra buscado
  const getMatchedVariant = useCallback((item: DetailedProductItem, query: string) => {
    if (!query) return null;
    const q = query.trim().toLowerCase();
    return item.variants?.find((v) => v.barcode && v.barcode.toLowerCase().includes(q)) || null;
  }, []);

  // Manejo de pulsación de teclas en el campo de búsqueda (lector USB de código de barras)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const term = searchQuery.trim().toLowerCase();
      if (!term) return;

      // 1. Buscar coincidencia exacta por código de barra (en producto o variantes)
      const exactMatch = filteredProducts.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === term) ||
          p.variants?.some((v) => v.barcode && v.barcode.toLowerCase() === term)
      );

      if (exactMatch) {
        handleOpenDetail(exactMatch);
        showToast("Producto escaneado", `Se abrió el detalle de "${exactMatch.name}".`);
      } else if (filteredProducts.length === 1) {
        handleOpenDetail(filteredProducts[0]);
        showToast("Producto encontrado", `Se abrió "${filteredProducts[0].name}".`);
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
          // Búsqueda en todos los campos (código de barra, nombre, marca, SKU, disciplina)
          const matchesName = item.name.toLowerCase().includes(term);
          const matchesBrand = item.brand.toLowerCase().includes(term);
          const matchesSku =
            (item.sku && item.sku.toLowerCase().includes(term)) ||
            item.variants?.some((v) => v.sku && v.sku.toLowerCase().includes(term));
          const matchesDisciplineText = item.discipline.toLowerCase().includes(term);

          matchesSearch =
            matchesMainBarcode ||
            matchesVariantBarcode ||
            matchesName ||
            matchesBrand ||
            Boolean(matchesSku) ||
            matchesDisciplineText;
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

      return matchesSearch && matchesDiscipline && matchesAlertFilter && matchesActive;
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
  }, [productsList, searchQuery, searchMode, selectedDiscipline, stockAlertFilter, activeFilterMode]);

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [stockAlertFilter, activeFilterMode, searchQuery, selectedDiscipline]);

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

  // Sincronizar el producto seleccionado cuando cambia la URL (historial Atrás / Adelante del navegador)
  useEffect(() => {
    if (selectedProductId) {
      const found = productsList.find((p) => p.id === selectedProductId);
      if (found) {
        setSelectedProduct(found);
      }
    } else {
      setSelectedProduct(null);
    }
  }, [selectedProductId, productsList]);

  const handleOpenDetail = (product: DetailedProductItem) => {
    setSelectedProduct(product);
    onProductChange?.(product.id);
  };

  // If a product is selected, render the full detailed view with back button
  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        onProductUpdate={(updated) => {
          setProductsList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setSelectedProduct(updated);
        }}
        onBack={() => {
          setSelectedProduct(null);
          onProductChange?.(null);
          loadProducts();
        }}
        onDeleteSuccess={(deletedId: string) => {
          setProductsList((prev) =>
            prev.map((p) => (p.id === deletedId ? { ...p, active: false } : p))
          );
          setSelectedProduct(null);
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
      {catalogViewTab !== "products" ? (
        <MasterCategoriesManager
          initialTab={catalogViewTab}
          onTabChange={(tab) => setCatalogViewTab(tab)}
          onBackToInventory={() => {
            setCatalogViewTab("products");
            loadProducts();
          }}
          onDataModified={() => {
            loadProducts();
          }}
        />
      ) : (
        <>
          {/* Top Header: Title + Status + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Inventario y Catálogo
            </h1>
            {isLiveFromDb ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En vivo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de stock local y catálogo de e-commerce
          </p>
        </div>

        {/* Action icons & CTA Button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={loadProducts}
              title="Recargar datos de base de datos"
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
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
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 relative"
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

          <button
            type="button"
            onClick={() => setIsBatchPriceModalOpen(true)}
            className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 active:scale-95 text-emerald-300 font-medium text-xs px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border border-slate-800 select-none"
            title="Actualización Masiva y Porcentual de Precios (RF-01.1 / CU-INV-05)"
          >
            <Percent className="w-4 h-4 text-emerald-300" />
            <span>Ajuste Masivo de Precios</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPriceHistoryModalOpen(true)}
            className="px-3 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs select-none"
            title="Ver Historial Global y Auditoría de Ajustes de Precios"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Historial de Ajustes</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportModalOpen(true)}
            className="px-3 sm:px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/90 active:scale-95 text-emerald-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs select-none"
            title="Carga Inicial Progresiva e Ingestión Excel/CSV (RF-04 / CU-INV-02)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Importar Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setCatalogViewTab("brands")}
            className="px-3 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 hover:text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs select-none"
            title="Gestión de Tablas Maestras (Marcas, Disciplinas y Categorías - RF-01.2 / CU-INV-09)"
          >
            <Layers className="w-4 h-4 text-indigo-500" />
            <span className="hidden lg:inline">Tablas Maestras</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] active:scale-95 text-white font-bold text-xs px-4 sm:px-5 py-2 rounded-2xl border border-emerald-400/40 shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-3 select-none"
            title="Registrar Nuevo Producto en el Inventario"
          >
            <Plus className="w-5 h-5 text-white stroke-[2.2] shrink-0" />
            <div className="flex flex-col items-center justify-center text-center leading-tight">
              <span className="text-white font-bold text-xs sm:text-[13px] tracking-tight">Nuevo</span>
              <span className="text-white font-bold text-xs sm:text-[13px] tracking-tight">Producto</span>
            </div>
          </button>
        </div>
      </div>

      {/* Search Input (Lector USB / Barcode) & Discipline Filter Tabs */}
      <div className="space-y-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-full lg:max-w-2xl">
            {/* Mode Switcher Pill */}
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0 select-none">
              <button
                type="button"
                onClick={() => {
                  setSearchMode("barcode");
                  searchInputRef.current?.focus();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  searchMode === "barcode"
                    ? "bg-slate-900 text-[#00D615] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Barcode className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>Cód. de Barra</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode("all");
                  searchInputRef.current?.focus();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  searchMode === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Todos</span>
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative flex-1">
              {searchMode === "barcode" ? (
                <Barcode className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
              ) : (
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={
                  searchMode === "barcode"
                    ? "Escanear código de barra con lector USB o escribir..."
                    : "Buscar por código de barra, producto, marca, SKU o disciplina..."
                }
                className={`w-full text-xs text-slate-800 placeholder-slate-400 pl-10 pr-9 py-2.5 rounded-xl border transition-all shadow-2xs focus:outline-none ${
                  searchMode === "barcode"
                    ? "bg-emerald-50/30 border-emerald-300/90 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 font-mono"
                    : "bg-slate-50 border-slate-200/80 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Selector Dinámico de Disciplinas (RF-01 / RF-01.2) */}
          <div className="flex items-center gap-1.5 shrink-0 select-none">
            <div
              className={`inline-flex items-center gap-1.5 p-1 rounded-xl border transition-all ${
                selectedDiscipline !== "Todas"
                  ? "bg-slate-900 border-slate-800 text-white shadow-xs"
                  : "bg-slate-100/90 border-slate-200/80 text-slate-700"
              }`}
            >
              <Layers
                className={`w-3.5 h-3.5 ml-1.5 shrink-0 ${
                  selectedDiscipline !== "Todas" ? "text-[#00D615]" : "text-slate-500"
                }`}
              />
              <span
                className={`text-[10.5px] font-bold uppercase tracking-wider hidden sm:inline ${
                  selectedDiscipline !== "Todas" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Disciplina:
              </span>
              <select
                value={selectedDiscipline}
                onChange={(e) => handleSelectDiscipline(e.target.value)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-emerald-400/20 max-w-[180px] sm:max-w-[220px] truncate ${
                  selectedDiscipline !== "Todas"
                    ? "bg-slate-800 text-white border-slate-700 hover:bg-slate-750"
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
                }`}
                title="Filtrar catálogo por disciplina deportiva (cargadas y futuras)"
              >
                {allDisciplines.map((d) => {
                  const count =
                    disciplineCounts[d] ?? (d === "Todas" ? disciplineCounts.Todas ?? 0 : 0);
                  return (
                    <option key={d} value={d} className="bg-white text-slate-900 font-medium">
                      {d === "Todas" ? `Todas las disciplinas (${count})` : `${d} (${count})`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Botón rápido para limpiar filtro de disciplina si no es 'Todas' */}
            {selectedDiscipline !== "Todas" && (
              <button
                type="button"
                onClick={() => handleSelectDiscipline("Todas")}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors active:scale-95 shadow-2xs"
                title="Restablecer a todas las disciplinas"
              >
                <X className="w-3 h-3 text-slate-400" />
                <span className="hidden sm:inline">Todas</span>
              </button>
            )}
          </div>
        </div>

        {/* Barcode scanner status banner */}
        {searchMode === "barcode" && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-0.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Lector USB Barcode Activo
              </span>
              <span className="text-slate-400 hidden sm:inline text-[11px]">
                Escanee el código o presione <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-700">Enter</kbd> para abrir el detalle
              </span>
            </div>
            {searchQuery && (
              <span className="font-mono text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                {filteredProducts.length} {filteredProducts.length === 1 ? "coincidencia" : "coincidencias"}
              </span>
            )}
          </div>
        )}

        {/* Quick Filter Chips: Alertas de Stock Crítico y Agotados (RF-06 / CU-INV-08) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 select-none -mx-1 px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline mr-1">
              Filtro de Stock:
            </span>

            {/* Chip: En Alerta */}
            <button
              type="button"
              onClick={() => handleToggleStockAlertFilter("IN_ALERT")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                stockAlertFilter === "IN_ALERT"
                  ? "bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/40"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200"
              }`}
              title="Filtrar artículos en alerta (ordenados por criticidad de stock)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>En Alerta</span>
              {stockAlertsSummary.totalAlertVariants > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  stockAlertFilter === "IN_ALERT" ? "bg-white text-rose-700" : "bg-rose-500 text-white"
                }`}>
                  {stockAlertsSummary.totalAlertVariants}
                </span>
              )}
            </button>

            {/* Chip: Agotados (0 un.) */}
            <button
              type="button"
              onClick={() => handleToggleStockAlertFilter("OUT_OF_STOCK")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                stockAlertFilter === "OUT_OF_STOCK"
                  ? "bg-rose-700 text-white shadow-xs ring-2 ring-rose-400/40"
                  : "bg-rose-50/70 text-rose-900 hover:bg-rose-100 border border-rose-300"
              }`}
              title="Filtrar únicamente artículos con quiebre de stock total"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Agotados (0 un.)</span>
              {stockAlertsSummary.outOfStockCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  stockAlertFilter === "OUT_OF_STOCK" ? "bg-white text-rose-800" : "bg-rose-600 text-white"
                }`}>
                  {stockAlertsSummary.outOfStockCount}
                </span>
              )}
            </button>

            {/* Chip: Reponer Mostrador */}
            <button
              type="button"
              onClick={() => handleToggleStockAlertFilter("STORE_REPLENISHMENT")}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                stockAlertFilter === "STORE_REPLENISHMENT"
                  ? "bg-orange-600 text-white shadow-xs ring-2 ring-orange-400/40"
                  : "bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-300"
              }`}
              title="Filtrar artículos con salón en 0 y existencia en depósito para reponer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Reponer Mostrador</span>
              {stockAlertsSummary.storeEmptyCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  stockAlertFilter === "STORE_REPLENISHMENT" ? "bg-white text-orange-800" : "bg-orange-600 text-white"
                }`}>
                  {stockAlertsSummary.storeEmptyCount}
                </span>
              )}
            </button>

            {/* Botón para quitar filtro cuando hay alguno activo */}
            {stockAlertFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setStockAlertFilter("ALL")}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors active:scale-95 ml-1 border border-slate-200 shadow-2xs"
                title="Quitar filtro de alerta de stock"
              >
                <X className="w-3 h-3 text-slate-400" />
                <span>Quitar filtro</span>
              </button>
            )}
          </div>

          {/* Selector de Estado (RF-01) y Botón de Drawer */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Selector de Estado en Filtros: Activos, Inactivos / Dados de Baja, Todos */}
            <div className="inline-flex items-center gap-1.5 bg-slate-100/90 p-0.5 sm:p-1 rounded-xl border border-slate-200/80 select-none">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider px-1.5 hidden md:inline">
                Estado:
              </span>
              <select
                value={activeFilterMode}
                onChange={(e) => setActiveFilterMode(e.target.value as ActiveFilterMode)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs transition-colors cursor-pointer ${
                  activeFilterMode === "INACTIVE"
                    ? "bg-slate-800 text-amber-300 border-slate-700"
                    : activeFilterMode === "ALL"
                    ? "bg-slate-100 text-slate-900 border-slate-300"
                    : "bg-white text-slate-800 border-slate-200"
                }`}
                title="Filtrar por estado del producto: Activos, Inactivos / Dados de Baja, o Todos"
              >
                <option value="ACTIVE">Activos ({activeStatusSummary.activeCount})</option>
                <option value="INACTIVE">Inactivos / Dados de Baja ({activeStatusSummary.inactiveCount})</option>
                <option value="ALL">Todos ({activeStatusSummary.totalCount})</option>
              </select>
            </div>

            {/* Botón directo para abrir Drawer de Alertas */}
            <button
              type="button"
              onClick={() => handleToggleAlertsDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-95 shadow-2xs shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-rose-400" />
              <span>Ver Panel de Alertas</span>
              {stockAlertsSummary.totalAlertVariants > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

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

      {/* Selector de modo de vista en móviles / tablet (< 768px) y aviso de scroll */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700 text-xs">
            {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"} en catálogo
          </span>
          <span className="hidden sm:inline text-slate-400 text-[11.5px]">
            • Desliza horizontalmente para ver todas las columnas ↔
          </span>
        </div>

        {/* Switcher Móvil: Tabla vs Tarjetas */}
        <div className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
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
      {/* 1. MOBILE CARDS VIEW (Visible cuando mobileViewMode === "cards") */}
      {/* ======================================================== */}
      <div className={`space-y-3 ${mobileViewMode === "cards" ? "block md:hidden" : "hidden"}`}>
        {filteredProducts.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center space-y-3">
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
                    const store = matchedVar
                      ? matchedVar.stockStore
                      : item.stockLocal ?? item.variants?.reduce((acc, v) => acc + (v.stockStore || 0), 0) ?? 0;
                    const warehouse = matchedVar
                      ? matchedVar.stockWarehouse
                      : item.stockWeb ?? item.variants?.reduce((acc, v) => acc + (v.stockWarehouse || 0), 0) ?? 0;
                    const total = store + warehouse;

                    if (total === 0) {
                      return (
                        <span className="inline-flex items-center gap-1 font-black text-xs text-rose-600">
                          <AlertOctagon className="w-3 h-3" />
                          Agotado
                        </span>
                      );
                    }
                    if (store === 0 && warehouse > 0) {
                      return (
                        <span className="inline-flex items-center gap-1 font-black text-xs text-orange-600">
                          <Store className="w-3 h-3" />
                          Salón 0 (Dep: {warehouse})
                        </span>
                      );
                    }
                    if (total <= (item.minStock || 2)) {
                      return (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-600">
                          <AlertTriangle className="w-3 h-3" />
                          {store} un.
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700">
                        <Store className="w-3 h-3" />
                        {store} un.
                      </span>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Código / SKU</span>
                  <span className="font-mono text-[11px] text-slate-700 font-semibold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/70">
                    {item.barcode || item.sku}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleOpenStockModal(item, "TRANSFERENCIA_INTERNA", undefined, e)}
                    title="Movimientos y Traslado de Stock"
                    className="p-2 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors active:scale-95"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
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

        {/* Paginador para la vista de tarjetas móviles */}
        {filteredProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden mt-3">
            {renderPaginationFooter()}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. TABLA RESPONSIVA CON SCROLL HORIZONTAL (Todas las pantallas) */}
      {/* ======================================================== */}
      <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all ${
        mobileViewMode === "cards" ? "hidden md:block" : "block"
      }`}>
        
        {/* Barra superior de información y aviso de scroll horizontal */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/80 text-[11.5px] text-slate-500">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            Mostrando <strong className="text-slate-900 font-bold">{paginatedProducts.length}</strong> de {filteredProducts.length} productos
            <span className="hidden sm:inline font-normal text-slate-400">• Desliza horizontalmente para ver todas las columnas ↔</span>
          </span>
          <span className="text-[10.5px] font-mono text-slate-400">
            Página {validCurrentPage} de {totalPages}
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
                      <td className="py-4 px-4 whitespace-nowrap min-w-[150px]">
                        {(() => {
                          const matchedVar = getMatchedVariant(item, searchQuery);
                          const displayStock = matchedVar
                            ? matchedVar.stockStore
                            : item.stockLocal ?? item.variants?.reduce((acc, v) => acc + (v.stockStore || 0), 0) ?? 0;
                          const warehouseStock = matchedVar
                            ? matchedVar.stockWarehouse
                            : item.stockWeb ?? item.variants?.reduce((acc, v) => acc + (v.stockWarehouse || 0), 0) ?? 0;
                          const totalStock = displayStock + warehouseStock;
                          const minStock = item.minStock || 2;

                          // 1. Totalmente agotado
                          if (totalStock === 0) {
                            return (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 w-fit">
                                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>Agotado Total</span>
                                </span>
                                <span className="text-[10px] text-rose-600 font-medium mt-0.5">
                                  0 local • 0 depósito
                                </span>
                              </div>
                            );
                          }

                          // 2. Salón vacío pero con existencia en depósito (Urgente Mostrador)
                          if (displayStock === 0 && warehouseStock > 0) {
                            return (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-orange-100 text-orange-800 border border-orange-300 w-fit">
                                  <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                  <span>Salón Vacío</span>
                                </span>
                                <span className="text-[10px] text-orange-700 font-semibold mt-0.5">
                                  Hay {warehouseStock} un. en depósito
                                </span>
                              </div>
                            );
                          }

                          // 3. Stock crítico o stock de salón bajo
                          if (totalStock <= minStock || displayStock <= 1) {
                            return (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 w-fit">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>{displayStock} un. (Bajo)</span>
                                </span>
                                <span className="text-[10px] text-amber-700 font-medium mt-0.5">
                                  Depósito: {warehouseStock} un.
                                </span>
                              </div>
                            );
                          }

                          // 4. Stock saludable / óptimo
                          return (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{displayStock} un.</span>
                              </span>
                              {matchedVar ? (
                                <span className="text-[10px] text-slate-400 mt-0.5">Talle {matchedVar.size}</span>
                              ) : (
                                <span className="text-[10px] text-slate-400 mt-0.5">Saavedra 241</span>
                              )}
                            </div>
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
                              <span className="font-mono font-medium text-slate-700 text-[11px]">
                                {item.barcode || item.sku}
                              </span>
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
                          <button
                            onClick={(e) => handleOpenStockModal(item, "TRANSFERENCIA_INTERNA", undefined, e)}
                            title="Ajustar Stock / Movimientos"
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
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
                                    <th className="py-2 px-3 text-center min-w-[130px]">Acciones de Stock</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                  {item.variants.map((v, vIdx) => {
                                    const vTotal = (v.stockStore || 0) + (v.stockWarehouse || 0);
                                    return (
                                      <tr key={v.id || vIdx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-2 px-3 font-semibold text-slate-800">
                                          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] mr-1.5">
                                            {v.size}
                                          </span>
                                          <span className="text-slate-500 text-[11px]">{v.color}</span>
                                        </td>
                                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                                          {v.barcode || `${item.barcode || item.sku}-${v.size}`}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
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
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                              <AlertOctagon className="w-2.5 h-2.5 text-rose-600" />
                                              <span>Agotado</span>
                                            </span>
                                          ) : (v.stockStore || 0) === 0 && (v.stockWarehouse || 0) > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                                              <Store className="w-2.5 h-2.5 text-orange-600" />
                                              <span>Salón 0</span>
                                            </span>
                                          ) : vTotal <= (item.minStock || 2) ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                              <span>Crítico</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                              <span>Óptimo</span>
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-center whitespace-nowrap">
                                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            {/* + Ingreso por Compra */}
                                            <button
                                              type="button"
                                              onClick={(e) => handleOpenStockModal(item, "INGRESO_COMPRA", v.id, e)}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10.5px] font-semibold transition-all active:scale-95 shadow-2xs"
                                              title={`+ Ingreso por Compra (Talle ${v.size} - ${v.color})`}
                                            >
                                              <PackagePlus className="w-3 h-3" />
                                              <span>+ Compra</span>
                                            </button>

                                            {/* - Ajuste / Merma */}
                                            <button
                                              type="button"
                                              onClick={(e) => handleOpenStockModal(item, "AJUSTE_EGRESO", v.id, e)}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10.5px] font-semibold transition-all active:scale-95 shadow-2xs"
                                              title={`- Ajuste / Merma (Talle ${v.size} - ${v.color})`}
                                            >
                                              <MinusCircle className="w-3 h-3" />
                                              <span>- Merma</span>
                                            </button>

                                            {/* ⇄ Traslado Interno */}
                                            <button
                                              type="button"
                                              onClick={(e) => handleOpenStockModal(item, "TRANSFERENCIA_INTERNA", v.id, e)}
                                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10.5px] font-semibold transition-all active:scale-95 shadow-2xs"
                                              title={`⇄ Traslado Depósito ➔ Salón (Talle ${v.size} - ${v.color})`}
                                            >
                                              <ArrowRightLeft className="w-3 h-3" />
                                              <span>⇄ Traslado</span>
                                            </button>
                                          </div>
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

      {/* Modal de Historial Global de Ajustes de Precios */}
      <PriceHistoryModal
        isOpen={isPriceHistoryModalOpen}
        onClose={() => setIsPriceHistoryModalOpen(false)}
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
