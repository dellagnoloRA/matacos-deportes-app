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
  Barcode,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DetailedProductItem } from "./types";
import { ProductDetailView } from "./ProductDetailView";
import { ProductFormModal } from "./ProductFormModal";
import {
  getDetailedInventoryProducts,
  toggleProductActive,
  deleteProduct,
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
  initialProducts?: DetailedProductItem[];
  selectedProductId?: string | null;
  onProductChange?: (productId: string | null) => void;
}

export function InventoryView({
  selectedDiscipline: controlledDiscipline,
  onDisciplineChange,
  initialProducts,
  selectedProductId,
  onProductChange,
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
  }, [searchQuery, searchMode, selectedDiscipline, itemsPerPage]);

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
        // Actualización optimista inmediata en la interfaz
        setProductsList((prev) => prev.filter((p) => p.id !== deletedId));
        setProductToDelete(null);
        showToast("Producto eliminado", `"${deletedName}" se eliminó correctamente.`);
        loadProducts();
      } else {
        setDeleteError(res.error || "No se pudo eliminar el producto");
      }
    } catch (err) {
      console.error("Error al eliminar el producto:", err);
      setDeleteError("Ocurrió un error inesperado al eliminar el producto");
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
    if (!initialProducts || initialProducts.length === 0) {
      loadProducts();
    }
  }, [loadProducts, initialProducts]);


  const handleSelectDiscipline = (d: string) => {
    if (onDisciplineChange) {
      onDisciplineChange(d);
    } else {
      setInternalDiscipline(d);
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

  // Filtrar productos según el modo de búsqueda (Código de Barra / Todos) y disciplina
  const filteredProducts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return productsList.filter((item) => {
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
        item.discipline.toLowerCase().includes(selectedDiscipline.toLowerCase().split(" ")[0]);

      return matchesSearch && matchesDiscipline;
    });
  }, [productsList, searchQuery, searchMode, selectedDiscipline]);

  // Cálculos de Paginación Adaptable
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIdx = (validCurrentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, validCurrentPage, itemsPerPage]);

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
        onBack={() => {
          setSelectedProduct(null);
          onProductChange?.(null);
          loadProducts();
        }}
        onDeleteSuccess={(deletedId: string) => {
          setProductsList((prev) => prev.filter((p) => p.id !== deletedId));
          setSelectedProduct(null);
          onProductChange?.(null);
          showToast("Producto eliminado", `"${selectedProduct.name}" se eliminó correctamente.`);
          loadProducts();
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 select-none">
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
              title="Notificaciones"
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial bg-[#00D615] hover:bg-[#00be13] active:scale-95 text-slate-950 font-extrabold text-xs px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Producto</span>
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

          {/* Discipline filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 text-xs select-none -mx-1 px-1">
            {DISCIPLINES.map((d) => (
              <button
                key={d}
                onClick={() => handleSelectDiscipline(d)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium text-xs active:scale-95 ${
                  selectedDiscipline === d
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                }`}
              >
                {d}
              </button>
            ))}
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
                  : "No hay productos registrados en esta disciplina."}
              </p>
            </div>
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
          </div>
        ) : (
          paginatedProducts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] space-y-3 cursor-pointer"
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
                  <span className="inline-block mt-1 text-[10.5px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {item.discipline}
                  </span>
                </div>
              </div>

              {/* Price and Barcode */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Precio Venta</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {formatCurrency(item.price)}
                  </span>
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
                    onClick={(e) => handleOpenEditModal(item, e)}
                    title="Editar producto"
                    className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleOpenDeleteModal(item, e)}
                    title="Dar de baja producto"
                    className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                <th className="py-3 px-5 min-w-[240px] bg-slate-50">PRODUCTO / MARCA</th>
                <th className="py-3 px-4 min-w-[130px] bg-slate-50">DISCIPLINA</th>
                <th className="py-3 px-4 min-w-[120px] bg-slate-50">PRECIO VENTA</th>
                <th className="py-3 px-4 min-w-[130px] bg-slate-50">FECHA REGISTRO</th>
                <th className="py-3 px-4 min-w-[150px] bg-slate-50">CÓD. BARRA / SKU</th>
                <th className="py-3 px-5 min-w-[140px] text-right sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]">ACCIÓN</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 px-4">
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
                            : "No hay productos registrados bajo esta categoría o disciplina."}
                        </p>
                      </div>
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
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetail(item)}
                  >
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
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            {item.name}
                          </span>
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
                    <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900 text-xs min-w-[120px]">
                      {formatCurrency(item.price)}
                    </td>

                    {/* 4. Registration Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-[11.5px] min-w-[130px]">
                      {item.updatedAt}
                    </td>

                    {/* 5. Barcode / SKU */}
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
                            {item.variants && item.variants.length > 1 && (
                              <span className="text-[10px] text-slate-400">
                                {item.variants.length} variantes
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 6. Action Buttons (Sticky Right para no perderse al scrollear) */}
                    <td className="py-4 px-5 text-right whitespace-nowrap min-w-[140px] sticky right-0 bg-white group-hover:bg-slate-50/90 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]" onClick={(e) => e.stopPropagation()}>
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
                          title="Dar de baja producto"
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

        {/* Pie de tabla con paginación integrada */}
        {renderPaginationFooter()}
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
