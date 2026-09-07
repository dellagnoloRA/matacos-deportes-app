"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  RefreshCw,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DetailedProductItem } from "./types";
import { ProductDetailView } from "./ProductDetailView";
import { ProductFormModal } from "./ProductFormModal";
import {
  getDetailedInventoryProducts,
  toggleProductActive,
} from "@/server/actions/productActions";

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
      { size: "39", color: "Blanco/Azul", stockStore: 2, stockWarehouse: 4, barcode: "779123456703-39", receivedCount: 110, soldCountStore: 18, soldCountWeb: 10 },
      { size: "40", color: "Blanco/Azul", stockStore: 3, stockWarehouse: 6, barcode: "779123456703-40", receivedCount: 120, soldCountStore: 24, soldCountWeb: 14 },
      { size: "41", color: "Blanco/Azul", stockStore: 4, stockWarehouse: 8, barcode: "779123456703-41", receivedCount: 130, soldCountStore: 28, soldCountWeb: 16 },
      { size: "42", color: "Blanco/Azul", stockStore: 3, stockWarehouse: 5, barcode: "779123456703-42", receivedCount: 115, soldCountStore: 16, soldCountWeb: 8 },
      { size: "43", color: "Blanco/Azul", stockStore: 2, stockWarehouse: 3, barcode: "779123456703-43", receivedCount: 105, soldCountStore: 10, soldCountWeb: 4 },
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
      { size: "36", color: "Negro", stockStore: 4, stockWarehouse: 6, barcode: "779123456704-36", receivedCount: 160, soldCountStore: 32, soldCountWeb: 18 },
      { size: "38", color: "Negro", stockStore: 6, stockWarehouse: 8, barcode: "779123456704-38", receivedCount: 180, soldCountStore: 38, soldCountWeb: 20 },
      { size: "40", color: "Negro", stockStore: 8, stockWarehouse: 12, barcode: "779123456704-40", receivedCount: 200, soldCountStore: 45, soldCountWeb: 24 },
      { size: "42", color: "Negro", stockStore: 8, stockWarehouse: 10, barcode: "779123456704-42", receivedCount: 190, soldCountStore: 40, soldCountWeb: 21 },
      { size: "44", color: "Negro", stockStore: 4, stockWarehouse: 5, barcode: "779123456704-44", receivedCount: 160, soldCountStore: 25, soldCountWeb: 12 },
    ],
    sizeConversions: [
      { ar: "36 AR", us: "M4/W6 US", eu: "36-37 EU", br: "35 BR", cm: "22.9 cm", note: "Roomy Fit" },
      { ar: "38 AR", us: "M6/W8 US", eu: "38-39 EU", br: "37 BR", cm: "24.6 cm", note: "Roomy Fit" },
      { ar: "40 AR", us: "M8/W10 US", eu: "41-42 EU", br: "39 BR", cm: "26.3 cm", note: "Roomy Fit" },
      { ar: "42 AR", us: "M10/W12 US", eu: "43-44 EU", br: "41 BR", cm: "28.0 cm", note: "Roomy Fit" },
      { ar: "44 AR", us: "M12 US", eu: "46-47 EU", br: "43 BR", cm: "29.7 cm", note: "Roomy Fit" },
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
];

const DISCIPLINES = [
  "Todas",
  "Natación",
  "Vóley",
  "Crocs / Urbano",
  "Fitness",
];

interface InventoryViewProps {
  selectedDiscipline?: string;
  onDisciplineChange?: (discipline: string) => void;
}

export function InventoryView({
  selectedDiscipline: controlledDiscipline,
  onDisciplineChange,
}: InventoryViewProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [internalDiscipline, setInternalDiscipline] = useState("Todas");
  const [selectedProduct, setSelectedProduct] = useState<DetailedProductItem | null>(null);
  const [productsList, setProductsList] = useState<DetailedProductItem[]>(INITIAL_PRODUCTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveFromDb, setIsLiveFromDb] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DetailedProductItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<DetailedProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; title: string; description?: string } | null>(null);

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
    const deletedName = productToDelete.name;
    try {
      setIsDeleting(true);
      setDeleteError(null);
      const res = await toggleProductActive(productToDelete.id);
      if (res.success) {
        await loadProducts();
        setProductToDelete(null);
        showToast("Producto eliminado", `"${deletedName}" se dio de baja correctamente.`);
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

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getDetailedInventoryProducts();
      if (res.success && Array.isArray(res.data)) {
        setProductsList(res.data);
        setIsLiveFromDb(true);
      }
    } catch (err) {
      console.warn("Utilizando catálogo inicial de demostración:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const selectedDiscipline = controlledDiscipline !== undefined ? controlledDiscipline : internalDiscipline;

  const handleSelectDiscipline = (d: string) => {
    if (onDisciplineChange) {
      onDisciplineChange(d);
    } else {
      setInternalDiscipline(d);
    }
  };

  // Filter products by search and discipline
  const filteredProducts = useMemo(() => {
    return productsList.filter((item) => {
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
  }, [productsList, searchQuery, selectedDiscipline]);

  const handleOpenDetail = (product: DetailedProductItem) => {
    setSelectedProduct(product);
  };

  // If a product is selected, render the full detailed view with back button
  if (selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        onBack={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto px-4 lg:px-8 py-6 space-y-6 select-none">
      {/* Top Header: Title + Search Icon, Bell, User Profile */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventario y Catálogo
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500">
              Gestión de stock local y catálogo de e-commerce
            </p>
            {isLiveFromDb ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL en vivo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Demo
              </span>
            )}
          </div>
        </div>

        {/* User profile & quick action icons */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadProducts}
            title="Recargar datos de base de datos"
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

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

          <button
            onClick={handleOpenCreateModal}
            className="bg-[#00D615] hover:bg-[#00be13] active:scale-95 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
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
            placeholder="Buscar por producto, marca, SKU o disciplina..."
            className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:bg-white focus:border-lime-500 focus:ring-2 focus:ring-lime-400/20 transition-all shadow-2xs"
          />
        </div>

        {/* Discipline filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs select-none">
          {DISCIPLINES.map((d) => (
            <button
              key={d}
              onClick={() => handleSelectDiscipline(d)}
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
            {/* Table Header */}
            <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="py-3.5 px-5">PRODUCTO / MARCA</th>
                <th className="py-3.5 px-4">DISCIPLINA</th>
                <th className="py-3.5 px-4">PRECIO VENTA</th>
                <th className="py-3.5 px-4">FECHA REGISTRO</th>
                <th className="py-3.5 px-4">CÓD. BARRA / SKU</th>
                <th className="py-3.5 px-5 text-right">ACCIÓN</th>
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
                            {item.brand} • {item.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Type / Discipline */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-slate-600 font-medium text-[11.5px] bg-slate-100 px-2 py-0.5 rounded-md">
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
                      {item.barcode || item.sku}
                    </td>

                    {/* 6. Action Buttons */}
                    <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleOpenEditModal(item, e)}
                          title="Editar producto"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenDeleteModal(item, e)}
                          title="Eliminar producto"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="bg-[#c2f25b] hover:bg-[#b0e838] active:scale-95 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-2xs transition-all tracking-tight ml-1"
                        >
                          Ver Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <span>Mostrando {filteredProducts.length} de {productsList.length} productos</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700">Base de datos sincronizada</span>
          </div>
        </div>
      </div>

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
                  ¿Eliminar producto?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  El producto <strong className="text-slate-800 font-semibold">{productToDelete.name}</strong> se dará de baja del mostrador (POS) y catálogo activo, pero <span className="font-medium text-slate-700">su historial contable y ventas se conservarán intactos</span>.
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
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Producto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3.5 min-w-[300px] max-w-md">
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
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
