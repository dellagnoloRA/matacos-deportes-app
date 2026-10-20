"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Tag,
  Receipt,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  User,
  Percent,
  DollarSign,
  Printer,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CreditCard,
  Banknote,
  QrCode,
  ArrowUpRight,
  X,
  Store,
  Check,
  ShoppingBag,
  CircleDollarSign,
  PanelLeft,
  Split,
  Lock,
  Unlock,
  ArrowLeftRight,
  Edit3,
  Barcode,
  Zap,
  LogOut,
} from "lucide-react";
import { getCurrentUserAction, logoutAction } from "@/server/actions/authActions";
import { formatCurrency, formatDate, normalizeSearch } from "@/lib/utils";
import { DetailedProductItem, ProductVariantItem } from "./types";
import {
  calculateSaleTotals,
  calculateItemDiscount,
  DiscountType,
  CalculatedSaleTotals,
} from "@/lib/discounts";
import {
  createPendingSale,
  getPendingSales,
  updatePendingSale,
  completePendingSale,
  cancelPendingSale,
  getPosSyncPulse,
  getPosVariantStockSnapshot,
} from "@/server/actions/posSaleActions";
import { getCurrentCashShift } from "@/server/actions/cashShiftActions";
import {
  OpenCashShiftModal,
  CashMovementModal,
  CloseCashShiftModal,
  CashShiftTicketModal,
} from "./CashShiftModals";
import { CashShiftTicketReceipt } from "@/server/services/cashShiftService";
import type { UpdatePendingSaleInput } from "@/schemas/sale";
import { PosTransactionHistoryView } from "./PosTransactionHistoryView";
import { PosExchangeModal } from "./PosExchangeModal";
import { EditPendingTicketModal } from "./EditPendingTicketModal";
import { PriceStockCheckerModal } from "./PriceStockCheckerModal";
import { QuickProductModal } from "./QuickProductModal";
import {
  PosProductGridCard,
  PosProductListRow,
  getColorSwatchClass,
} from "./PosProductCard";

// ----------------------------------------------------------------------
// Tipos de Estado para Preventa y Carrito
// ----------------------------------------------------------------------

export interface PosCartItem {
  rowId: string;
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  category: string;
  discipline: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  originalPrice: number;
  quantity: number;
  stockStore: number;
  stockWarehouse: number;
  stockReserved: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
}

export interface PendingSaleItemSummary {
  id: string;
  ticketCode: string | null;
  invoiceNumber: string | null;
  customerName: string | null;
  status: string;
  total: number;
  subtotalGross: number;
  discount: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  notes?: string | null;
  createdAt: string;
  seller?: { id: string; name: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    price: number;
    subtotal: number;
    originalPrice?: number;
    discount?: number;
    discountType?: DiscountType | null;
    discountValue?: number | null;
    variant: {
      id: string;
      size: string;
      color: string;
      sku?: string;
      barcode?: string;
      stockStore: number;
      stockWarehouse?: number;
      stockReserved?: number;
      price?: number | null;
      product: {
        id: string;
        name: string;
        imageUrl?: string | null;
        price?: number;
        brand: { name: string };
        category: { name: string };
        variants?: Array<{
          id: string;
          size: string;
          color: string;
          sku?: string;
          barcode?: string;
          stockStore: number;
          stockReserved?: number;
          price?: number | null;
        }>;
      };
    };
  }>;
}

interface PosViewProps {
  initialProducts?: DetailedProductItem[];
  subView?: "preventa" | "cobrar" | "historial" | "arqueo";
  onNavigateSubView?: (subView: "preventa" | "cobrar" | "historial" | "arqueo") => void;
  onPendingCountChange?: (count: number) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function PosView({
  initialProducts = [],
  subView = "preventa",
  onNavigateSubView,
  onPendingCountChange,
  isSidebarOpen,
  onToggleSidebar,
}: PosViewProps) {
  // ----------------------------------------------------------------------
  // Estado del Catálogo y Filtros
  // ----------------------------------------------------------------------
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUserAction().then(setCurrentUser);
  }, []);

  const [products, setProducts] = useState<DetailedProductItem[]>(initialProducts);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("Todas");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");
  const [isUsbScannerActive, setIsUsbScannerActive] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------------------
  // Estado del Carrito y Preventa Salón
  // ----------------------------------------------------------------------
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [globalDiscount, setGlobalDiscount] = useState<{
    type: DiscountType;
    value: number;
  } | null>(null);

  const [isSubmittingPreventa, setIsSubmittingPreventa] = useState(false);
  const [preventaSuccessData, setPreventaSuccessData] = useState<{
    saleId: string;
    ticketCode: string;
    customerName: string;
    totalNet: number;
    subtotalGross: number;
    totalDiscount: number;
    itemsCount: number;
    items: PosCartItem[];
  } | null>(null);

  // Estado para Modal de Devolución / Cambio de Talle
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  // Estado para Modal de Carga Rápida de Producto (Emergencia)
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [quickProductQuery, setQuickProductQuery] = useState("");

  // Estado para Modal Verificador de Precios y Stock (Modo Consulta - F3)
  const [isPriceCheckerOpen, setIsPriceCheckerOpen] = useState(false);

  // Modal de confirmación personalizado para cancelar preventa (sin window.confirm)
  const [confirmCancelModal, setConfirmCancelModal] = useState<{
    saleId: string;
    ticketCode: string | null;
    origin: "caja" | "salon";
  } | null>(null);
  const [isCancelingPending, setIsCancelingPending] = useState(false);
  const [isUpdatingPendingSaleItems, setIsUpdatingPendingSaleItems] = useState(false);

  // ----------------------------------------------------------------------
  // Modal de Descuento (RF-08)
  // ----------------------------------------------------------------------
  const [discountModalConfig, setDiscountModalConfig] = useState<{
    isOpen: boolean;
    isGlobal: boolean;
    targetRowId?: string;
    productName?: string;
    originalAmount: number;
    currentType: DiscountType;
    currentValue: number;
  } | null>(null);

  // ----------------------------------------------------------------------
  // Estado de Caja Mostrador ("Cobrar")
  // ----------------------------------------------------------------------
  const [pendingSales, setPendingSales] = useState<PendingSaleItemSummary[]>([]);
  const [isLoadingPendingSales, setIsLoadingPendingSales] = useState(false);
  type CashierPaymentMethodType =
    | "EFECTIVO"
    | "DEBITO"
    | "CREDITO"
    | "QR_MERCADOPAGO"
    | "TRANSFERENCIA";

  const [activeCheckoutSale, setActiveCheckoutSale] = useState<PendingSaleItemSummary | null>(null);
  const [editingTicket, setEditingTicket] = useState<PendingSaleItemSummary | null>(null);
  const [cashierPaymentMethod, setCashierPaymentMethod] = useState<CashierPaymentMethodType>("EFECTIVO");
  const [cashierReceivedAmount, setCashierReceivedAmount] = useState<string>("");

  // Soporte para Cobro Dividido (2 Métodos de Pago)
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [splitPayment1Method, setSplitPayment1Method] = useState<CashierPaymentMethodType>("EFECTIVO");
  const [splitPayment1Amount, setSplitPayment1Amount] = useState<string>("");
  const [splitPayment1Received, setSplitPayment1Received] = useState<string>("");

  const [splitPayment2Method, setSplitPayment2Method] = useState<CashierPaymentMethodType>("DEBITO");
  const [splitPayment2Amount, setSplitPayment2Amount] = useState<string>("");
  const [splitPayment2Received, setSplitPayment2Received] = useState<string>("");

  // Card Details State
  const [cashierCardBrand, setCashierCardBrand] = useState<string>("");
  const [cashierCardVoucher, setCashierCardVoucher] = useState<string>("");
  const [cashierInstallments, setCashierInstallments] = useState<number>(1);

  const [splitPayment1CardBrand, setSplitPayment1CardBrand] = useState<string>("");
  const [splitPayment1CardVoucher, setSplitPayment1CardVoucher] = useState<string>("");
  const [splitPayment1Installments, setSplitPayment1Installments] = useState<number>(1);

  const [splitPayment2CardBrand, setSplitPayment2CardBrand] = useState<string>("");
  const [splitPayment2CardVoucher, setSplitPayment2CardVoucher] = useState<string>("");
  const [splitPayment2Installments, setSplitPayment2Installments] = useState<number>(1);

  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [completedSaleResult, setCompletedSaleResult] = useState<{
    saleId?: string;
    invoiceNumber: string;
    ticketCode: string;
    customerName: string;
    totalNet: number;
    change: number;
    payments: Array<{ method: string; amount: number }>;
    items: any[];
    isExchange?: boolean;
    notes?: string | null;
  } | null>(null);

  // ----------------------------------------------------------------------
  // Estado de Turno de Caja (RF-11)
  // ----------------------------------------------------------------------
  const [terminalId, setTerminalId] = useState<string>("TERMINAL_2_CAJA");
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [activeShiftTotals, setActiveShiftTotals] = useState<any | null>(null);
  const [isLoadingShift, setIsLoadingShift] = useState<boolean>(true);

  // Modales de Turno de Caja
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [closingReceipt, setClosingReceipt] = useState<CashShiftTicketReceipt | null>(null);

  const fetchActiveShift = useCallback(async () => {
    setIsLoadingShift(true);
    try {
      const res = await getCurrentCashShift(terminalId);
      if (res.success) {
        setActiveShift(res.activeShift);
        setActiveShiftTotals(res.totals);
      }
    } catch (e) {
      console.error("Error al cargar turno de caja:", e);
    } finally {
      setIsLoadingShift(false);
    }
  }, [terminalId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTerminal = localStorage.getItem("matacos_pos_terminal");
      if (savedTerminal) {
        setTerminalId(savedTerminal);
      }
    }
  }, []);

  useEffect(() => {
    fetchActiveShift();
  }, [fetchActiveShift]);

  // ----------------------------------------------------------------------
  // Notificación tipo Toast en pantalla
  // ----------------------------------------------------------------------
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  const showToast = useCallback(
    (text: string, type: "success" | "warning" | "error" = "success") => {
      setToastMessage({ text, type });
      setTimeout(() => {
        setToastMessage((prev) => (prev?.text === text ? null : prev));
      }, 3500);
    },
    []
  );

  // ----------------------------------------------------------------------
  // Cargar Preventas Pendientes para la Terminal de Caja
  // ----------------------------------------------------------------------
  const fetchPendingSalesList = useCallback(async () => {
    setIsLoadingPendingSales(true);
    try {
      const res = await getPendingSales();
      if (res.success && res.data) {
        const mapped = res.data as unknown as PendingSaleItemSummary[];
        setPendingSales(mapped);
        if (onPendingCountChange) {
          onPendingCountChange(mapped.length);
        }
      }
    } catch (err) {
      console.error("Error al cargar preventas pendientes:", err);
    } finally {
      setIsLoadingPendingSales(false);
    }
  }, [onPendingCountChange]);

  // ----------------------------------------------------------------------
  // Sincronización Reactiva de Stock en Catálogo (Deltas y Snapshot)
  // ----------------------------------------------------------------------
  const applyVariantStockDeltas = useCallback(
    (
      deltas: Array<{
        variantId: string;
        stockStoreDelta?: number;
        stockReservedDelta?: number;
      }>
    ) => {
      setProducts((prev) => {
        const deltaMap = new Map(deltas.map((d) => [d.variantId, d]));
        return prev.map((prod) => {
          let hasChanges = false;
          const updatedVariants = prod.variants.map((v) => {
            const d = deltaMap.get(v.id || "");
            if (!d) return v;
            hasChanges = true;
            const newReserved = Math.max(
              0,
              (v.stockReserved || 0) + (d.stockReservedDelta || 0)
            );
            const newStore = Math.max(0, v.stockStore + (d.stockStoreDelta || 0));
            return {
              ...v,
              stockReserved: newReserved,
              stockStore: newStore,
            };
          });
          if (!hasChanges) return prod;
          const newStockLocal = updatedVariants.reduce((sum, v) => sum + v.stockStore, 0);
          return {
            ...prod,
            stockLocal: newStockLocal,
            variants: updatedVariants,
          };
        });
      });
    },
    []
  );

  const refreshCatalogStock = useCallback(async () => {
    try {
      const res = await getPosVariantStockSnapshot();
      if (!res.success || !res.data) return;

      const snapshotMap = new Map(res.data.map((item) => [item.id, item]));
      setProducts((prev) => {
        return prev.map((prod) => {
          let hasChanges = false;
          const updatedVariants = prod.variants.map((v) => {
            const snap = snapshotMap.get(v.id || "");
            if (!snap) return v;
            if (
              v.stockStore !== snap.stockStore ||
              (v.stockReserved || 0) !== snap.stockReserved ||
              v.stockWarehouse !== snap.stockWarehouse
            ) {
              hasChanges = true;
              return {
                ...v,
                stockStore: snap.stockStore,
                stockReserved: snap.stockReserved,
                stockWarehouse: snap.stockWarehouse,
              };
            }
            return v;
          });

          if (!hasChanges) return prod;
          const newStockLocal = updatedVariants.reduce((sum, v) => sum + v.stockStore, 0);
          return {
            ...prod,
            stockLocal: newStockLocal,
            variants: updatedVariants,
          };
        });
      });
    } catch (err) {
      console.error("Error al refrescar snapshot de stock:", err);
    }
  }, []);

  // Emisor de Eventos inter-pestañas / ventanas (Capa 1: 0 ms)
  const broadcastSyncEvent = useCallback(
    (event: {
      type: "TICKET_CREATED" | "TICKET_UPDATED" | "TICKET_CANCELLED" | "SALE_COMPLETED";
      saleId?: string;
      ticketCode?: string | null;
      deltas?: Array<{
        variantId: string;
        stockStoreDelta?: number;
        stockReservedDelta?: number;
      }>;
    }) => {
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("matacos_pos_sync");
          channel.postMessage(event);
          channel.close();
        }
      } catch {
        // Ignorar si el navegador no soporta BroadcastChannel
      }
    },
    []
  );

  // Receptor de Eventos inter-pestañas / ventanas (Capa 1: 0 ms)
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel("matacos_pos_sync");
    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      // 1. Refrescar preventas pendientes en caja
      fetchPendingSalesList();

      // 2. Si vienen deltas de stock precisos, aplicarlos al catálogo en 0 ms
      if (Array.isArray(data.deltas) && data.deltas.length > 0) {
        applyVariantStockDeltas(data.deltas);
      } else {
        refreshCatalogStock();
      }
    };

    return () => {
      channel.close();
    };
  }, [fetchPendingSalesList, applyVariantStockDeltas, refreshCatalogStock]);

  // Sincronización Multi-Dispositivo en Red Local Saavedra 241 (Capa 2: Pulso cada 4 segundos)
  const lastSyncRef = useRef<{
    lastSaleUpdatedAt: string | null;
    lastMovementCreatedAt: string | null;
    pendingSalesCount: number;
  }>({
    lastSaleUpdatedAt: null,
    lastMovementCreatedAt: null,
    pendingSalesCount: 0,
  });

  useEffect(() => {
    // Carga inicial
    fetchPendingSalesList();

    const checkSyncPulse = async () => {
      try {
        const res = await getPosSyncPulse();
        if (!res.success || !res.data) return;

        const pulse = res.data;
        const prev = lastSyncRef.current;

        // Primer chequeo: solo registrar el estado base
        if (prev.lastSaleUpdatedAt === null) {
          lastSyncRef.current = pulse;
          return;
        }

        const salesChanged =
          prev.lastSaleUpdatedAt !== pulse.lastSaleUpdatedAt ||
          prev.pendingSalesCount !== pulse.pendingSalesCount;

        const movementsChanged =
          prev.lastMovementCreatedAt !== pulse.lastMovementCreatedAt;

        if (salesChanged) {
          fetchPendingSalesList();
          refreshCatalogStock();
        } else if (movementsChanged) {
          refreshCatalogStock();
        }

        lastSyncRef.current = pulse;
      } catch (err) {
        console.error("Error en pulso de sincronización POS:", err);
      }
    };

    const pulseInterval = setInterval(checkSyncPulse, 4000);
    return () => clearInterval(pulseInterval);
  }, [fetchPendingSalesList, refreshCatalogStock]);

  // ----------------------------------------------------------------------
  // Disciplinas Únicas para Chips de Filtrado
  // ----------------------------------------------------------------------
  const disciplineOptions = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.discipline) list.add(p.discipline);
    });
    return ["Todas", ...Array.from(list)];
  }, [products]);

  const availableCategories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return Array.from(list);
  }, [products]);

  // Filtros adicionales por marca y categoría
  const [selectedBrand, setSelectedBrand] = useState<string>("Todas");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  const brandFilterOptions = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.brand?.trim()) list.add(p.brand.trim());
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  }, [products]);

  const categoryFilterOptions = useMemo(
    () => [...availableCategories].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })),
    [availableCategories]
  );

  const availableBrands = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.brand) list.add(p.brand);
    });
    return Array.from(list);
  }, [products]);

  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const categoriesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoriesDropdownRef.current &&
        !categoriesDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoriesDropdownOpen(false);
      }
    };
    if (isCategoriesDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCategoriesDropdownOpen]);

  const MAX_VISIBLE_CATEGORIES = 5;
  const visibleCategories = useMemo(() => {
    const initial = disciplineOptions.slice(0, MAX_VISIBLE_CATEGORIES);
    if (
      selectedDiscipline &&
      selectedDiscipline !== "Todas" &&
      !initial.includes(selectedDiscipline)
    ) {
      return [...initial, selectedDiscipline];
    }
    return initial;
  }, [disciplineOptions, selectedDiscipline]);

  // ----------------------------------------------------------------------
  // Filtrado reactivo de productos del catálogo
  // ----------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedDiscipline !== "Todas") {
      result = result.filter(
        (p) => p.discipline.toLowerCase() === selectedDiscipline.toLowerCase()
      );
    }

    if (selectedBrand !== "Todas") {
      const b = selectedBrand.toLowerCase();
      result = result.filter((p) => (p.brand ?? "").trim().toLowerCase() === b);
    }

    if (selectedCategory !== "Todas") {
      const c = selectedCategory.toLowerCase();
      result = result.filter((p) => (p.category ?? "").trim().toLowerCase() === c);
    }

    const rawQ = searchQuery.trim().toLowerCase();
    if (rawQ) {
      const tokens = normalizeSearch(rawQ).split(/\s+/).filter(Boolean);
      const termNoSpaces = normalizeSearch(rawQ).replace(/\s+/g, "");

      result = result.filter((p) => {
        const productFields = [
          p.name,
          p.brand,
          p.category,
          p.discipline || "",
          p.modelCode || "",
          p.sku || "",
        ].map(normalizeSearch);

        const variantFields = p.variants.flatMap((v) =>
          [v.size, v.color, v.sku || "", v.barcode].map(normalizeSearch)
        );

        const allFields = [...productFields, ...variantFields];
        const allText = allFields.join(" ");
        const allTextNoSpaces = allText.replace(/\s+/g, "");

        // Cada token debe aparecer en al menos un campo (tolerante a guiones y tildes)
        const matchesAllTokens = tokens.every((token) =>
          allFields.some((field) => field.includes(token)) || allText.includes(token)
        );

        // Búsqueda sin espacios: "gelrocket" encuentra "gel-rocket" / "gel rocket"
        const matchesFuzzySpaces =
          termNoSpaces.length > 0 && allTextNoSpaces.includes(termNoSpaces);

        return matchesAllTokens || matchesFuzzySpaces;
      });
    }

    return result;
  }, [products, selectedDiscipline, selectedBrand, selectedCategory, searchQuery]);

  // Resetear paginación al cambiar filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDiscipline, selectedBrand, selectedCategory]);

  // Cálculos de Paginación del Catálogo POS
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIdx = (validCurrentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredProducts, validCurrentPage, itemsPerPage]);

  const startIndex = totalItems === 0 ? 0 : (validCurrentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(validCurrentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (validCurrentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (validCurrentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", validCurrentPage, "...", totalPages);
    }
    return pages;
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sugerencias predictivas de colores presentes en los productos filtrados
  const predictiveColorSuggestions = useMemo(() => {
    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ || rawQ.length < 2) return [];

    const colorMap = new Map<string, number>();
    for (const p of filteredProducts) {
      for (const v of p.variants) {
        const c = v.color?.trim();
        if (c) {
          const avail = Math.max(0, v.stockStore - (v.stockReserved || 0));
          colorMap.set(c, (colorMap.get(c) || 0) + avail);
        }
      }
    }

    const terms = rawQ.split(/\s+/).filter(Boolean);
    const results: Array<{ color: string; stock: number }> = [];

    colorMap.forEach((stock, color) => {
      // Excluir si el color ya está escrito en la búsqueda
      const alreadyInQuery = terms.some(
        (t) => color.toLowerCase() === t.toLowerCase()
      );
      if (!alreadyInQuery) {
        results.push({ color, stock });
      }
    });

    results.sort((a, b) => b.stock - a.stock);
    return results.slice(0, 7);
  }, [filteredProducts, searchQuery]);

  const handleSelectPredictiveColor = (colorName: string) => {
    const currentTerms = searchQuery.trim().split(/\s+/).filter(Boolean);
    if (!currentTerms.some((t) => t.toLowerCase() === colorName.toLowerCase())) {
      setSearchQuery([...currentTerms, colorName].join(" "));
    } else {
      setSearchQuery(colorName);
    }
    searchInputRef.current?.focus();
  };

  // ----------------------------------------------------------------------
  // Totales de la Preventa en Tiempo Real (RF-08)
  // ----------------------------------------------------------------------
  const saleTotals: CalculatedSaleTotals = useMemo(() => {
    return calculateSaleTotals(
      cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        originalPrice: item.originalPrice,
        discountType: item.discountType,
        discountValue: item.discountValue,
      })),
      globalDiscount
    );
  }, [cart, globalDiscount]);

  // ----------------------------------------------------------------------
  // Atajo F2, F3 y Lector de Códigos de Barras USB
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: enfocar búsqueda en catálogo
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // F3: abrir/cerrar Verificador de Precios y Stock (Exclusivo para salón / preventa)
      if (e.key === "F3") {
        if (subView !== "preventa") return;
        e.preventDefault();
        setIsPriceCheckerOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [subView]);

  // Handler para cerrar el modal de preventa exitosa y reenfocar el buscador
  const handleClosePreventaModal = useCallback(() => {
    setPreventaSuccessData(null);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  }, []);

  // Atajo de teclado para cerrar modal de Preventa Exitosa con ENTER o ESCAPE
  useEffect(() => {
    if (!preventaSuccessData) return;

    const handlePreventaModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClosePreventaModal();
      }
    };

    window.addEventListener("keydown", handlePreventaModalKeyDown, true);
    return () => window.removeEventListener("keydown", handlePreventaModalKeyDown, true);
  }, [preventaSuccessData, handleClosePreventaModal]);

  // Lector de código de barras USB (acumula caracteres rápidos que terminan en Enter)
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isUsbScannerActive) return;

    const handleWindowKeyPress = (e: KeyboardEvent) => {
      // Si el verificador de precios o el modal de preventa exitosa están abiertos, ignorar escaneo
      if (isPriceCheckerOpen || preventaSuccessData) return;

      // Si el foco está en un input normal (excepto si fue por escaneo)
      const targetTag = (e.target as HTMLElement)?.tagName;
      const isInputFocused = targetTag === "INPUT" || targetTag === "TEXTAREA";

      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 4) {
          const scannedCode = barcodeBufferRef.current.trim();
          barcodeBufferRef.current = "";

          // Buscar variante por barcode o SKU
          handleBarcodeScanned(scannedCode);
        }
        barcodeBufferRef.current = "";
        return;
      }

      // Si los caracteres llegan a más de 70ms de distancia, es tipeo humano, resetear buffer
      if (diff > 70) {
        barcodeBufferRef.current = "";
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleWindowKeyPress);
    return () => window.removeEventListener("keydown", handleWindowKeyPress);
  }, [isUsbScannerActive, products, isPriceCheckerOpen]);

  const handleBarcodeScanned = (code: string) => {
    for (const prod of products) {
      for (const variant of prod.variants) {
        if (
          variant.barcode === code ||
          variant.sku?.toLowerCase() === code.toLowerCase()
        ) {
          // Agregar al carrito
          handleAddVariantToCart(prod, variant);
          const colorDetail = variant.color ? ` - ${variant.color}` : "";
          showToast(`"${prod.name}${colorDetail} (${variant.size})" agregado al carrito`);
          return;
        }
      }
    }
    showToast(`No se encontró ningún producto con el código: ${code}`, "warning");
  };

  // ----------------------------------------------------------------------
  // Acciones sobre el Carrito (Agregar, Quitar, Modificar)
  // ----------------------------------------------------------------------
  const handleAddVariantToCart = (
    product: DetailedProductItem,
    variant: ProductVariantItem
  ) => {
    const availableStock = Math.max(
      0,
      variant.stockStore - (variant.stockReserved || 0)
    );

    if (availableStock <= 0) {
      const colorDetail = variant.color ? ` (${variant.color})` : "";
      showToast(
        `Sin stock disponible en salón para ${product.name}${colorDetail} (Talle ${variant.size})`,
        "error"
      );
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.variantId === variant.id
      );

      if (existingIndex >= 0) {
        const currentQty = prevCart[existingIndex].quantity;
        if (currentQty + 1 > availableStock) {
          showToast(
            `Alcanzaste el máximo de stock en salón (${availableStock} un.)`,
            "warning"
          );
          return prevCart;
        }

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
        };
        return updated;
      }

      // Nuevo ítem
      const effectivePrice = variant.price ? variant.price : product.price;
      const newItem: PosCartItem = {
        rowId: `${variant.id}-${Date.now()}`,
        productId: product.id,
        variantId: variant.id || "",
        name: product.name,
        brand: product.brand,
        category: product.category,
        discipline: product.discipline,
        size: variant.size,
        color: variant.color,
        sku: variant.sku || product.sku,
        barcode: variant.barcode,
        originalPrice: effectivePrice,
        quantity: 1,
        stockStore: variant.stockStore,
        stockWarehouse: variant.stockWarehouse,
        stockReserved: variant.stockReserved || 0,
        discountType: null,
        discountValue: null,
      };

      return [newItem, ...prevCart];
    });
  };

  const handleProductCreatedFromQuickModal = (
    newProduct: DetailedProductItem,
    newVariant: ProductVariantItem
  ) => {
    // 1. Agregar a la lista de catálogo para que figure en la vista
    setProducts((prev) => [newProduct, ...prev]);
    // 2. Agregar directamente al carrito
    handleAddVariantToCart(newProduct, newVariant);
    // 3. Limpiar buscador para volver a vista limpia con el carrito cargado
    setSearchQuery("");
    showToast(
      `Producto "${newProduct.name}" (Talle ${newVariant.size}) creado y sumado a la preventa.`,
      "success"
    );
  };

  const handleUpdateQuantity = (variantId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.variantId === variantId) {
            const availableStock = Math.max(
              0,
              item.stockStore - item.stockReserved
            );
            const newQty = item.quantity + delta;

            if (newQty <= 0) return null; // Eliminar renglón
            if (newQty > availableStock) {
              showToast(
                `Stock máximo en salón alcanzado (${availableStock} un.)`,
                "warning"
              );
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as PosCartItem[];
    });
  };

  const handleRemoveItem = (variantId: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.variantId !== variantId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("¿Deseas vaciar todos los productos del carrito actual?")) {
      setCart([]);
      setCustomerName("");
      setNotes("");
      setGlobalDiscount(null);
    }
  };

  // ----------------------------------------------------------------------
  // Gestión de Descuentos (Modal RF-08)
  // ----------------------------------------------------------------------
  const openItemDiscountModal = (item: PosCartItem) => {
    setDiscountModalConfig({
      isOpen: true,
      isGlobal: false,
      targetRowId: item.rowId,
      productName: `${item.name} (${item.size})`,
      originalAmount: item.originalPrice,
      currentType: item.discountType || "PERCENTAGE",
      currentValue: item.discountValue || 0,
    });
  };

  const openGlobalDiscountModal = () => {
    setDiscountModalConfig({
      isOpen: true,
      isGlobal: true,
      productName: "Preventa Salón Completa (Descuento Global)",
      originalAmount: saleTotals.subtotalAfterItems,
      currentType: globalDiscount?.type || "PERCENTAGE",
      currentValue: globalDiscount?.value || 0,
    });
  };

  const handleApplyDiscount = (
    type: DiscountType,
    value: number,
    isGlobal: boolean,
    targetRowId?: string
  ) => {
    let sanitizedValue = Math.max(0, Number(value) || 0);
    if (type === "PERCENTAGE") {
      sanitizedValue = Math.min(100, Math.round(sanitizedValue * 100) / 100);
    } else if (type === "FIXED") {
      sanitizedValue = Math.round(sanitizedValue * 100) / 100;
    }

    if (isGlobal) {
      if (type === "FIXED") {
        sanitizedValue = Math.min(saleTotals.subtotalAfterItems, sanitizedValue);
      }
      if (sanitizedValue <= 0) {
        setGlobalDiscount(null);
      } else {
        setGlobalDiscount({ type, value: sanitizedValue });
      }
    } else if (targetRowId) {
      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.rowId === targetRowId) {
            const finalVal =
              type === "FIXED"
                ? Math.min(item.originalPrice, sanitizedValue)
                : sanitizedValue;
            return {
              ...item,
              discountType: finalVal > 0 ? type : null,
              discountValue: finalVal > 0 ? finalVal : null,
            };
          }
          return item;
        })
      );
    }
    setDiscountModalConfig(null);
  };

  // ----------------------------------------------------------------------
  // Enviar Preventa a Caja y Reservar Stock
  // ----------------------------------------------------------------------
  const handleSendPreventaToCashier = async () => {
    if (cart.length === 0) {
      showToast("Agrega al menos un producto a la preventa", "warning");
      return;
    }

    setIsSubmittingPreventa(true);
    try {
      const payload = {
        customerName: customerName.trim() || "Consumidor Final",
        notes: notes.trim() || undefined,
        items: cart.map((i) => {
          const { unitDiscount, unitPrice } = calculateItemDiscount(
            i.originalPrice,
            i.discountType,
            i.discountValue
          );
          return {
            variantId: i.variantId,
            quantity: i.quantity,
            originalPrice: i.originalPrice,
            unitPrice: unitPrice,
            discountAmount: unitDiscount,
            discountType: i.discountType,
            discountValue: i.discountValue,
          };
        }),
        globalDiscount: globalDiscount
          ? {
              type: globalDiscount.type,
              value: globalDiscount.value,
            }
          : null,
      };

      const result = await createPendingSale(payload);

      if (!result.success || !result.data) {
        showToast(result.error || "No se pudo generar la preventa", "error");
        return;
      }

      const resData = result.data as {
        saleId: string;
        ticketCode: string;
        customerName: string;
        totalNet: number;
        subtotalGross: number;
        totalDiscount: number;
        itemsCount: number;
      };
      setPreventaSuccessData({
        saleId: resData.saleId,
        ticketCode: resData.ticketCode,
        customerName: resData.customerName || "Consumidor Final",
        totalNet: resData.totalNet,
        subtotalGross: resData.subtotalGross,
        totalDiscount: resData.totalDiscount,
        itemsCount: resData.itemsCount,
        items: [...cart],
      });

      // Aplicar reserva de stock inmediatamente en el catálogo local (0 ms)
      const stockDeltas = cart.map((i) => ({
        variantId: i.variantId,
        stockReservedDelta: i.quantity,
      }));
      applyVariantStockDeltas(stockDeltas);

      // Notificar a otras terminales / pestañas (Caja y otros salones)
      broadcastSyncEvent({
        type: "TICKET_CREATED",
        saleId: resData.saleId,
        ticketCode: resData.ticketCode,
        deltas: stockDeltas,
      });

      // Limpiar preventa actual
      setCart([]);
      setCustomerName("");
      setNotes("");
      setGlobalDiscount(null);

      // Actualizar contador en sidebar y lista de pendientes
      fetchPendingSalesList();
    } catch (err: any) {
      console.error("Error al enviar preventa:", err);
      showToast(err.message || "Error al procesar la preventa", "error");
    } finally {
      setIsSubmittingPreventa(false);
    }
  };

  // ----------------------------------------------------------------------
  // Terminal 2: Cobro de Preventa en Caja
  // ----------------------------------------------------------------------
  const handleOpenCheckoutModal = (sale: PendingSaleItemSummary) => {
    setActiveCheckoutSale(sale);
    setIsSplitPayment(false);
    setCashierPaymentMethod("EFECTIVO");
    setCashierReceivedAmount(sale.total.toString());
    setCashierCardBrand("");
    setCashierCardVoucher("");
    setCashierInstallments(1);

    // Inicializar valores para pago mixto por defecto (50% / 50%)
    const half = Math.round((sale.total / 2) * 100) / 100;
    const rest = Math.round((sale.total - half) * 100) / 100;
    setSplitPayment1Method("EFECTIVO");
    setSplitPayment1Amount(half.toString());
    setSplitPayment1Received(half.toString());
    setSplitPayment1CardBrand("");
    setSplitPayment1CardVoucher("");
    setSplitPayment1Installments(1);
    
    setSplitPayment2Method("DEBITO");
    setSplitPayment2Amount(rest.toString());
    setSplitPayment2Received(rest.toString());
    setSplitPayment2CardBrand("");
    setSplitPayment2CardVoucher("");
    setSplitPayment2Installments(1);
  };

  const handleCancelPending = (saleId: string, ticketCode: string | null) => {
    setConfirmCancelModal({
      saleId,
      ticketCode,
      origin: "caja",
    });
  };

  const handleExecuteCancelPending = async () => {
    if (!confirmCancelModal) return;

    const { saleId, ticketCode, origin } = confirmCancelModal;
    setIsCancelingPending(true);

    try {
      const reason =
        origin === "salon"
          ? "Cancelado por el cliente en salón"
          : "Cancelado desde Terminal de Cobro";
      const res = await cancelPendingSale(saleId, reason);
      if (res.success) {
        showToast(`Ticket ${ticketCode || "Preventa"} cancelado. Stock liberado.`, "success");
        if (activeCheckoutSale?.id === saleId) {
          setActiveCheckoutSale(null);
        }
        if (preventaSuccessData?.saleId === saleId) {
          setPreventaSuccessData(null);
        }

        // Obtener ítems para liberar reserva de stock en el catálogo inmediatamente
        const targetSale = pendingSales.find((s) => s.id === saleId);
        const stockDeltas = targetSale
          ? targetSale.items.map((it) => ({
              variantId: it.variant.id,
              stockReservedDelta: -it.quantity,
            }))
          : preventaSuccessData && preventaSuccessData.saleId === saleId
          ? preventaSuccessData.items.map((it) => ({
              variantId: it.variantId,
              stockReservedDelta: -it.quantity,
            }))
          : [];

        if (stockDeltas.length > 0) {
          applyVariantStockDeltas(stockDeltas);
        } else {
          refreshCatalogStock();
        }

        broadcastSyncEvent({
          type: "TICKET_CANCELLED",
          saleId,
          ticketCode,
          deltas: stockDeltas,
        });

        setConfirmCancelModal(null);
        fetchPendingSalesList();
      } else {
        showToast(res.error || "Error al cancelar preventa", "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      showToast(msg, "error");
    } finally {
      setIsCancelingPending(false);
    }
  };

  // ----------------------------------------------------------------------
  // Modificar o retirar prendas de una preventa en mostrador (RF-08)
  // ----------------------------------------------------------------------
  const executePendingSaleItemsUpdate = async (
    updatedItems: PendingSaleItemSummary["items"]
  ) => {
    if (!activeCheckoutSale) return;

    setIsUpdatingPendingSaleItems(true);
    try {
      const payload: UpdatePendingSaleInput = {
        saleId: activeCheckoutSale.id,
        customerName: activeCheckoutSale.customerName || undefined,
        items: updatedItems.map((it) => ({
          variantId: it.variant.id,
          quantity: it.quantity,
          originalPrice: it.originalPrice ?? it.unitPrice,
          discountAmount: it.discount ?? 0,
          unitPrice: it.unitPrice,
        })),
      };

      const res = await updatePendingSale(payload);
      if (!res.success || !res.data) {
        showToast(res.error || "No se pudo actualizar el ticket de preventa", "error");
        return;
      }

      const newTotal = res.data.totalNet;
      const newSubtotal = res.data.subtotalGross;
      const newDiscount = res.data.totalDiscount;

      // Actualizar activeCheckoutSale en memoria
      setActiveCheckoutSale({
        ...activeCheckoutSale,
        total: newTotal,
        subtotalGross: newSubtotal,
        discount: newDiscount,
        items: updatedItems,
      });

      // Ajustar campos de pago si es pago único
      setCashierReceivedAmount(newTotal.toString());

      // Si es pago mixto, recalcular 50/50
      const half = Math.round((newTotal / 2) * 100) / 100;
      const rest = Math.round((newTotal - half) * 100) / 100;
      setSplitPayment1Amount(half.toString());
      setSplitPayment1Received(half.toString());
      setSplitPayment2Amount(rest.toString());
      setSplitPayment2Received(rest.toString());

      // Calcular deltas de stock reservado
      const oldMap = new Map(activeCheckoutSale.items.map((i) => [i.variant.id, i.quantity]));
      const newMap = new Map(updatedItems.map((i) => [i.variant.id, i.quantity]));
      const allVariantIds = Array.from(new Set([...oldMap.keys(), ...newMap.keys()]));
      const deltas = allVariantIds.map((vId) => {
        const oldQ = oldMap.get(vId) || 0;
        const newQ = newMap.get(vId) || 0;
        return {
          variantId: vId,
          stockReservedDelta: newQ - oldQ,
        };
      });

      applyVariantStockDeltas(deltas);

      broadcastSyncEvent({
        type: "TICKET_UPDATED",
        saleId: activeCheckoutSale.id,
        ticketCode: activeCheckoutSale.ticketCode,
        deltas,
      });

      showToast(`Prenda modificada. Stock liberado y nuevo total: ${formatCurrency(newTotal)}`, "success");
      fetchPendingSalesList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar preventa";
      showToast(msg, "error");
    } finally {
      setIsUpdatingPendingSaleItems(false);
    }
  };

  const handleRemoveItemFromPendingSale = async (saleItemId: string) => {
    if (!activeCheckoutSale) return;

    if (activeCheckoutSale.items.length <= 1) {
      showToast(
        "El ticket no puede quedar vacío. Si el cliente no llevará nada, utiliza 'Cancelar Preventa'.",
        "warning"
      );
      return;
    }

    const updatedItems = activeCheckoutSale.items.filter((it) => it.id !== saleItemId);
    await executePendingSaleItemsUpdate(updatedItems);
  };

  const handleUpdateItemQuantityInPendingSale = async (saleItemId: string, delta: number) => {
    if (!activeCheckoutSale) return;

    const targetItem = activeCheckoutSale.items.find((it) => it.id === saleItemId);
    if (!targetItem) return;

    const newQty = targetItem.quantity + delta;
    if (newQty <= 0) {
      await handleRemoveItemFromPendingSale(saleItemId);
      return;
    }

    const updatedItems = activeCheckoutSale.items.map((it) =>
      it.id === saleItemId ? { ...it, quantity: newQty, subtotal: newQty * it.unitPrice } : it
    );
    await executePendingSaleItemsUpdate(updatedItems);
  };

  const handleProcessCashierCheckout = async () => {
    if (!activeCheckoutSale) return;

    if (!activeShift) {
      showToast(
        "No se puede procesar el cobro: La caja se encuentra cerrada en esta terminal. Debe abrir el turno primero.",
        "error"
      );
      setIsOpenShiftModalOpen(true);
      return;
    }

    const totalToPay = activeCheckoutSale.total;

    if (!isSplitPayment) {
      const parsedRec = parseFloat(cashierReceivedAmount);
      const receivedNum = !isNaN(parsedRec) ? parsedRec : totalToPay;

      if (cashierPaymentMethod === "EFECTIVO" && totalToPay > 0 && receivedNum < totalToPay - 0.05) {
        showToast("El monto en efectivo ingresado no cubre el total de la venta", "error");
        return;
      }

      setIsProcessingCheckout(true);
      try {
        const payload = {
          saleId: activeCheckoutSale.id,
          cashShiftId: activeShift.id,
          terminalId,
          payments: [
            {
              method: cashierPaymentMethod,
              amount: totalToPay,
              receivedAmount: cashierPaymentMethod === "EFECTIVO" ? receivedNum : undefined,
              cardBrand: ["DEBITO", "CREDITO"].includes(cashierPaymentMethod) ? cashierCardBrand || undefined : undefined,
              cardVoucher: ["DEBITO", "CREDITO"].includes(cashierPaymentMethod) ? cashierCardVoucher || undefined : undefined,
              installments: cashierPaymentMethod === "CREDITO" ? cashierInstallments : undefined,
            },
          ],
        };

        const res = await completePendingSale(payload);

        if (!res.success || !res.data) {
          showToast(res.error || "No se pudo registrar el cobro", "error");
          return;
        }

        const completed = res.data as {
          invoiceNumber: string;
          ticketCode?: string;
          customerName?: string;
        };
        const changeGiven =
          cashierPaymentMethod === "EFECTIVO" ? Math.max(0, receivedNum - totalToPay) : 0;

        setCompletedSaleResult({
          saleId: activeCheckoutSale.id,
          invoiceNumber: completed.invoiceNumber,
          ticketCode: completed.ticketCode || activeCheckoutSale.ticketCode || "Salón",
          customerName: completed.customerName || "Consumidor Final",
          totalNet: totalToPay,
          change: changeGiven,
          payments: [{ method: cashierPaymentMethod, amount: totalToPay }],
          items: activeCheckoutSale.items,
          isExchange: activeCheckoutSale.notes?.includes("[CAMBIO"),
          notes: activeCheckoutSale.notes,
        });

        // Descontar stock definitivamente y liberar reserva en el catálogo
        const soldDeltas = activeCheckoutSale.items.map((it) => ({
          variantId: it.variant.id,
          stockStoreDelta: -it.quantity,
          stockReservedDelta: -it.quantity,
        }));
        applyVariantStockDeltas(soldDeltas);

        broadcastSyncEvent({
          type: "SALE_COMPLETED",
          saleId: activeCheckoutSale.id,
          ticketCode: activeCheckoutSale.ticketCode,
          deltas: soldDeltas,
        });

        setActiveCheckoutSale(null);
        fetchPendingSalesList();
        fetchActiveShift();
        refreshCatalogStock();
      } catch (err: any) {
        console.error("Error al cobrar:", err);
        showToast(err.message || "Error al procesar el cobro", "error");
      } finally {
        setIsProcessingCheckout(false);
      }
    } else {
      // Cobro con 2 Métodos de Pago
      const amt1 = parseFloat(splitPayment1Amount) || 0;
      const amt2 = parseFloat(splitPayment2Amount) || 0;
      const sumPayments = Math.round((amt1 + amt2) * 100) / 100;

      if (amt1 <= 0 || amt2 <= 0) {
        showToast("Ambos métodos de pago deben tener un monto asignado mayor a cero", "error");
        return;
      }

      if (Math.abs(sumPayments - totalToPay) > 0.05) {
        showToast(
          `La suma de ambos pagos (${formatCurrency(sumPayments)}) debe coincidir exactamente con el total (${formatCurrency(totalToPay)})`,
          "error"
        );
        return;
      }

      const rec1 = parseFloat(splitPayment1Received) || amt1;
      const rec2 = parseFloat(splitPayment2Received) || amt2;

      if (splitPayment1Method === "EFECTIVO" && rec1 < amt1 - 0.05) {
        showToast("El efectivo recibido en Método 1 no cubre el monto asignado", "error");
        return;
      }

      if (splitPayment2Method === "EFECTIVO" && rec2 < amt2 - 0.05) {
        showToast("El efectivo recibido en Método 2 no cubre el monto asignado", "error");
        return;
      }

      setIsProcessingCheckout(true);
      try {
        const payload = {
          saleId: activeCheckoutSale.id,
          cashShiftId: activeShift.id,
          terminalId,
          payments: [
            {
              method: splitPayment1Method,
              amount: amt1,
              receivedAmount: splitPayment1Method === "EFECTIVO" ? rec1 : undefined,
              cardBrand: ["DEBITO", "CREDITO"].includes(splitPayment1Method) ? splitPayment1CardBrand || undefined : undefined,
              cardVoucher: ["DEBITO", "CREDITO"].includes(splitPayment1Method) ? splitPayment1CardVoucher || undefined : undefined,
              installments: splitPayment1Method === "CREDITO" ? splitPayment1Installments : undefined,
            },
            {
              method: splitPayment2Method,
              amount: amt2,
              receivedAmount: splitPayment2Method === "EFECTIVO" ? rec2 : undefined,
              cardBrand: ["DEBITO", "CREDITO"].includes(splitPayment2Method) ? splitPayment2CardBrand || undefined : undefined,
              cardVoucher: ["DEBITO", "CREDITO"].includes(splitPayment2Method) ? splitPayment2CardVoucher || undefined : undefined,
              installments: splitPayment2Method === "CREDITO" ? splitPayment2Installments : undefined,
            },
          ],
        };

        const res = await completePendingSale(payload);

        if (!res.success || !res.data) {
          showToast(res.error || "No se pudo registrar el cobro", "error");
          return;
        }

        const completed = res.data as {
          invoiceNumber: string;
          ticketCode?: string;
          customerName?: string;
        };
        const change1 = splitPayment1Method === "EFECTIVO" ? Math.max(0, rec1 - amt1) : 0;
        const change2 = splitPayment2Method === "EFECTIVO" ? Math.max(0, rec2 - amt2) : 0;
        const totalChange = change1 + change2;

        setCompletedSaleResult({
          saleId: activeCheckoutSale.id,
          invoiceNumber: completed.invoiceNumber,
          ticketCode: completed.ticketCode || activeCheckoutSale.ticketCode || "Salón",
          customerName: completed.customerName || "Consumidor Final",
          totalNet: totalToPay,
          change: totalChange,
          payments: [
            { method: splitPayment1Method, amount: amt1 },
            { method: splitPayment2Method, amount: amt2 },
          ],
          items: activeCheckoutSale.items,
          isExchange: activeCheckoutSale.notes?.includes("[CAMBIO"),
          notes: activeCheckoutSale.notes,
        });

        // Descontar stock definitivamente y liberar reserva en el catálogo
        const soldDeltas = activeCheckoutSale.items.map((it) => ({
          variantId: it.variant.id,
          stockStoreDelta: -it.quantity,
          stockReservedDelta: -it.quantity,
        }));
        applyVariantStockDeltas(soldDeltas);

        broadcastSyncEvent({
          type: "SALE_COMPLETED",
          saleId: activeCheckoutSale.id,
          ticketCode: activeCheckoutSale.ticketCode,
          deltas: soldDeltas,
        });

        setActiveCheckoutSale(null);
        fetchPendingSalesList();
        fetchActiveShift();
        refreshCatalogStock();
      } catch (err: any) {
        console.error("Error al cobrar con pagos mixtos:", err);
        showToast(err.message || "Error al procesar el cobro", "error");
      } finally {
        setIsProcessingCheckout(false);
      }
    }
  };

  // ----------------------------------------------------------------------
  // Modales compartidos y Toast para todas las sub-vistas del POS (RF-11)
  // ----------------------------------------------------------------------
  const renderSharedModalsAndToast = () => (
    <>
      {/* ============================================================ */}
      {/* TOAST FLOTANTE                                               */}
      {/* ============================================================ */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-none">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 pointer-events-auto ${
              toastMessage.type === "error"
                ? "bg-rose-900 text-rose-100 border-rose-700"
                : toastMessage.type === "warning"
                ? "bg-amber-900 text-amber-100 border-amber-700"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Modales de Control de Caja (RF-11: Apertura, Arqueo y Cierre) */}
      {/* ============================================================ */}
      <OpenCashShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        terminalId={terminalId}
        onSuccess={() => {
          fetchActiveShift();
          showToast("Turno de caja abierto correctamente con fondo de cambio", "success");
        }}
      />

      <CashMovementModal
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
        cashShiftId={activeShift?.id || ""}
        currentAvailableCash={
          activeShiftTotals?.currentAvailableCash ?? Number(activeShift?.initialAmount ?? 0)
        }
        onSuccess={() => {
          fetchActiveShift();
          showToast("Movimiento de caja registrado exitosamente", "success");
        }}
        defaultPerformedBy={activeShift?.user?.name || "Cajero"}
      />

      <CloseCashShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        cashShiftId={activeShift?.id || ""}
        terminalId={terminalId}
        onSuccess={(receipt) => {
          setClosingReceipt(receipt);
          fetchActiveShift();
          showToast("Turno de caja cerrado y arqueo asentado con éxito", "success");
        }}
      />

      <CashShiftTicketModal
        receipt={closingReceipt}
        onClose={() => setClosingReceipt(null)}
      />

      {/* Modal de Devolución / Cambio de Talle */}
      <PosExchangeModal
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        products={products}
        cashShiftId={activeShift?.id}
        cashierId={activeShift?.userId}
        onExchangeSuccess={(msg, extraData: any) => {
          showToast(msg, "success");
          if (extraData?.stockDeltas) {
            applyVariantStockDeltas(extraData.stockDeltas);
          }
          fetchPendingSalesList();
          refreshCatalogStock();
          broadcastSyncEvent({
            type: "TICKET_CREATED",
            saleId: extraData?.saleId,
            ticketCode: extraData?.ticketCode,
            deltas: extraData?.stockDeltas,
          });
        }}
      />

      {/* Modal Verificador de Precios y Stock (Modo Consulta - Exclusivo para Salón / Preventa) */}
      {subView === "preventa" && (
        <PriceStockCheckerModal
          isOpen={isPriceCheckerOpen}
          onClose={() => setIsPriceCheckerOpen(false)}
          products={products}
          onAddToCart={(product, variant) => {
            handleAddVariantToCart(product, variant);
          }}
        />
      )}

      {/* Modal de Carga Rápida de Producto para Preventa (Emergencia) */}
      <QuickProductModal
        isOpen={isQuickProductModalOpen}
        onClose={() => setIsQuickProductModalOpen(false)}
        initialSearchQuery={quickProductQuery}
        disciplines={disciplineOptions.filter((d) => d !== "Todas")}
        categories={availableCategories}
        brands={availableBrands}
        onProductCreated={handleProductCreatedFromQuickModal}
      />

      {/* Modal de Modificación de Artículos de Ticket en Caja */}
      {editingTicket && (
        <EditPendingTicketModal
          isOpen={!!editingTicket}
          onClose={() => setEditingTicket(null)}
          ticket={editingTicket}
          catalogProducts={products}
          onSaveSuccess={(updatedSale, autoOpenCheckout) => {
            showToast(
              `Ticket ${updatedSale.ticketCode || ""} actualizado correctamente.`,
              "success"
            );
            setEditingTicket(null);
            fetchPendingSalesList();
            refreshCatalogStock();
            broadcastSyncEvent({
              type: "TICKET_UPDATED",
              saleId: updatedSale.id,
              ticketCode: updatedSale.ticketCode,
            });

            if (autoOpenCheckout) {
              handleOpenCheckoutModal(updatedSale);
            } else if (activeCheckoutSale?.id === updatedSale.id) {
              handleOpenCheckoutModal(updatedSale);
            }
          }}
          onCancelTicket={(saleId, ticketCode) => {
            setEditingTicket(null);
            handleCancelPending(saleId, ticketCode);
          }}
        />
      )}

      {/* Modal de Confirmación de Cancelación de Preventa */}
      {confirmCancelModal && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0 shadow-inner">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  ¿Confirmas la cancelación del Ticket {confirmCancelModal.ticketCode || "Preventa"}?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  El ticket pasará a estado <span className="font-bold text-rose-700">CANCELADA</span> y las prendas reservadas se liberarán inmediatamente para la venta.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block text-amber-950">Acción irreversible</span>
                <p className="text-[11px] text-amber-800">
                  Esta operación devolverá el stock al salón y no se podrá reabrir este comprobante.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmCancelModal(null)}
                disabled={isCancelingPending}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleExecuteCancelPending}
                disabled={isCancelingPending}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isCancelingPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, Cancelar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // ----------------------------------------------------------------------
  // Render: SUB-VISTA HISTORIAL DE TRANSACCIONES POS
  // ----------------------------------------------------------------------
  if (subView === "historial") {
    return (
      <>
        <PosTransactionHistoryView
          onNavigateToPreventa={() => onNavigateSubView?.("preventa")}
          onNavigateToCobrar={() => onNavigateSubView?.("cobrar")}
          onToggleSidebar={onToggleSidebar}
          pendingSalesCount={pendingSales.length}
        />
        {renderSharedModalsAndToast()}
      </>
    );
  }

  // ----------------------------------------------------------------------
  // Render: SUB-VISTA COBRAR (TERMINAL 2)
  // ----------------------------------------------------------------------
  if (subView === "cobrar") {
    return (
      <>
        <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
        {/* Top Header Barra */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg shrink-0"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 whitespace-nowrap">
                  <Receipt className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Caja Mostrador • Cobro de Preventas</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 truncate hidden sm:block">
                Selecciona una preventa emitida desde los salones para procesar el pago y emitir comprobante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Widget de Control de Turno de Caja (Prioridad Alta) */}
            {activeShift ? (
              <div className="flex items-center gap-2.5 bg-emerald-50/90 border border-emerald-300/80 px-3 h-10 rounded-xl shadow-2xs shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="flex flex-col text-left justify-center">
                  <span className="text-[11px] font-bold text-emerald-950 leading-tight flex items-center gap-1 whitespace-nowrap">
                    <span>Turno:</span>
                    <strong className="text-emerald-800">{activeShift.user?.name || "Cajero"}</strong>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono leading-tight whitespace-nowrap">
                    Disp:{" "}
                    <strong className="text-emerald-900">
                      {formatCurrency(
                        activeShiftTotals?.currentAvailableCash ?? Number(activeShift.initialAmount)
                      )}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-1.5 border-l border-emerald-200/80 pl-2">
                  <button
                    onClick={() => setIsCashMovementModalOpen(true)}
                    className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-300 shadow-2xs transition active:scale-95 whitespace-nowrap"
                    title="Registrar retiro, gasto menor o aporte de cambio"
                  >
                    Movimiento
                  </button>
                  <button
                    onClick={() => setIsCloseShiftModalOpen(true)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition flex items-center gap-1 active:scale-95 whitespace-nowrap"
                    title="Cerrar turno y realizar arqueo ciego"
                  >
                    <Lock className="w-3 h-3 text-emerald-400" />
                    Arqueo
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-rose-50/90 border border-rose-200 px-3 h-10 rounded-xl shadow-2xs shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <div className="flex flex-col text-left justify-center">
                    <span className="text-[11px] font-bold text-rose-900 leading-tight whitespace-nowrap">
                      Caja Cerrada
                    </span>
                    <span className="text-[10px] text-rose-700 leading-tight whitespace-nowrap">
                      Abra turno para cobrar
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(true)}
                  className="h-10 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
                  title="Abrir nuevo turno de caja en Saavedra 241"
                >
                  <Unlock className="w-4 h-4 shrink-0" />
                  <span>Abrir Caja</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onNavigateSubView?.("historial")}
              className="h-10 px-3.5 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
              title="Consultar historial de comprobantes y transacciones cobradas"
            >
              <Receipt className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Historial Transacciones</span>
            </button>

            <button
              type="button"
              onClick={fetchPendingSalesList}
              disabled={isLoadingPendingSales}
              className="h-10 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
              title="Actualizar lista de preventas pendientes"
            >
              <RotateCcw className={`w-4 h-4 shrink-0 ${isLoadingPendingSales ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Preventas en Espera</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{pendingSales.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total a Cobrar</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(pendingSales.reduce((acc, s) => acc + Number(s.total), 0))}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Punto de Venta</span>
              <p className="text-sm font-bold text-slate-800 mt-2">Saavedra 241, Formosa</p>
            </div>
          </div>

          {/* List of Pending Sales or Closed Cash Register State */}
          {!activeShift ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-amber-200/80 shadow-xs max-w-xl mx-auto my-6 space-y-5">
              <div className="w-16 h-16 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-center justify-center text-amber-600 mx-auto shadow-2xs">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Turno de Caja Cerrado
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Para registrar cobros de mostrador, emitir comprobantes y habilitar la gaveta de efectivo en Saavedra 241, debe realizar la apertura de turno e ingresar el fondo inicial.
                </p>
              </div>

              {pendingSales.length > 0 ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-left gap-3 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {pendingSales.length}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-950">
                        {pendingSales.length === 1 ? "1 preventa en espera" : `${pendingSales.length} preventas en espera`}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Total acumulado: {formatCurrency(pendingSales.reduce((acc, s) => acc + Number(s.total), 0))}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md shrink-0">
                    En Salón
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Sin preventas pendientes en este momento</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftModalOpen(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-sm font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Abrir Turno de Caja</span>
                </button>
              </div>
            </div>
          ) : isLoadingPendingSales && pendingSales.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <div className="inline-block animate-spin text-slate-400 mb-3">
                <RotateCcw className="w-8 h-8" />
              </div>
              <p className="text-slate-600 font-medium">Buscando preventas pendientes en salón...</p>
            </div>
          ) : pendingSales.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 max-w-lg mx-auto my-8">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No hay preventas pendientes</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No hay clientes esperando en caja en este momento. Las preventas emitidas desde el salón aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black tracking-tight bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-200/60 font-mono">
                          {sale.ticketCode || "#000"}
                        </span>
                        {sale.notes?.includes("[CAMBIO") && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                            <RotateCcw className="w-3 h-3 text-purple-600" /> Cambio
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(sale.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {sale.customerName || "Consumidor Final"}
                      </h4>
                    </div>

                    {/* Resumen del cambio si el ticket proviene de un cambio de prenda */}
                    {sale.notes?.includes("[CAMBIO") && (
                      <div className="p-2.5 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-purple-600" /> Operación de Cambio
                        </span>
                        <p className="text-xs text-purple-900 font-medium leading-relaxed">
                          {sale.notes.replace(/\[CAMBIO:[^\]]+\]\s*/, "")}
                        </p>
                      </div>
                    )}

                    {/* Breakdown of items */}
                    <div className="space-y-1 pt-1">
                      {sale.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg"
                        >
                          <span className="truncate max-w-[170px] font-medium" title={`${it.variant.product.name} - ${it.variant.color || ""} (Talle ${it.variant.size})`}>
                            {it.quantity}x {it.variant.product.name} ({it.variant.color ? `${it.variant.color} • ` : ""}{it.variant.size})
                          </span>
                          <span className="font-semibold text-slate-800 font-mono">
                            {formatCurrency(Number(it.subtotal))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/50 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        {sale.notes?.includes("[CAMBIO") && Number(sale.total) === 0
                          ? "Saldo a cobrar:"
                          : "Importe a cobrar:"}
                      </span>
                      <span className={`text-xl font-black font-mono ${
                        sale.notes?.includes("[CAMBIO") && Number(sale.total) === 0
                          ? "text-emerald-600"
                          : "text-slate-950"
                      }`}>
                        {formatCurrency(Number(sale.total))}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenCheckoutModal(sale)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform cursor-pointer ${
                          sale.notes?.includes("[CAMBIO") && Number(sale.total) === 0
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {sale.notes?.includes("[CAMBIO") && Number(sale.total) === 0 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmar Cambio</span>
                          </>
                        ) : (
                          <>
                            <Banknote className="w-4 h-4" />
                            <span>Cobrar</span>
                          </>
                        )}
                      </button>
                      {!sale.notes?.includes("[CAMBIO") && (
                        <button
                          onClick={() => setEditingTicket(sale)}
                          className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs active:scale-98 cursor-pointer"
                          title="Modificar artículos, talles, cantidades o descuentos del ticket"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Modificar</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelPending(sale.id, sale.ticketCode)}
                        className="p-2.5 text-slate-500 hover:text-rose-700 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center transition-colors cursor-pointer"
                        title={sale.notes?.includes("[CAMBIO") ? "Cancelar cambio y liberar reserva" : "Cancelar preventa y liberar stock"}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Cobro Caja Mostrador */}
        {activeCheckoutSale && (() => {
          const isExchangeTicket = !!activeCheckoutSale.notes?.includes("[CAMBIO");
          const isZeroTotal = activeCheckoutSale.total === 0;

          const splitP1 = parseFloat(splitPayment1Amount) || 0;
          const splitP2 = parseFloat(splitPayment2Amount) || 0;
          const splitTotalAssigned = Math.round((splitP1 + splitP2) * 100) / 100;
          const splitDiff = Math.round((activeCheckoutSale.total - splitTotalAssigned) * 100) / 100;

          const splitRec1 = parseFloat(splitPayment1Received) || splitP1;
          const splitRec2 = parseFloat(splitPayment2Received) || splitP2;
          const splitChange1 = splitPayment1Method === "EFECTIVO" ? Math.max(0, splitRec1 - splitP1) : 0;
          const splitChange2 = splitPayment2Method === "EFECTIVO" ? Math.max(0, splitRec2 - splitP2) : 0;
          const totalSplitChange = splitChange1 + splitChange2;

          const isSplitCash1Valid = splitPayment1Method !== "EFECTIVO" || splitRec1 >= splitP1 - 0.05;
          const isSplitCash2Valid = splitPayment2Method !== "EFECTIVO" || splitRec2 >= splitP2 - 0.05;
          const isSplitBalanced =
            Math.abs(splitDiff) <= 0.05 &&
            splitP1 > 0 &&
            splitP2 > 0 &&
            isSplitCash1Valid &&
            isSplitCash2Valid;

          // Helper: Asignar saldo restante a Método 2 teniendo en cuenta lo ingresado en Método 1
          const handleAssignRemainingTo2 = () => {
            let p1 = parseFloat(splitPayment1Amount) || 0;
            if (splitPayment1Method === "EFECTIVO" && splitPayment1Received) {
              const rec1 = parseFloat(splitPayment1Received) || 0;
              if (
                rec1 > 0 &&
                (p1 === 0 ||
                  p1 === Math.round((activeCheckoutSale.total / 2) * 100) / 100 ||
                  rec1 < p1)
              ) {
                p1 = rec1;
                setSplitPayment1Amount(splitPayment1Received);
              }
            }
            const rest = Math.max(0, Math.round((activeCheckoutSale.total - p1) * 100) / 100);
            setSplitPayment2Amount(rest.toString());
            setSplitPayment2Received(rest.toString());
          };

          // Helper: Asignar saldo restante a Método 1 teniendo en cuenta lo ingresado en Método 2
          const handleAssignRemainingTo1 = () => {
            let p2 = parseFloat(splitPayment2Amount) || 0;
            if (splitPayment2Method === "EFECTIVO" && splitPayment2Received) {
              const rec2 = parseFloat(splitPayment2Received) || 0;
              if (
                rec2 > 0 &&
                (p2 === 0 ||
                  p2 === Math.round((activeCheckoutSale.total / 2) * 100) / 100 ||
                  rec2 < p2)
              ) {
                p2 = rec2;
                setSplitPayment2Amount(splitPayment2Received);
              }
            }
            const rest = Math.max(0, Math.round((activeCheckoutSale.total - p2) * 100) / 100);
            setSplitPayment1Amount(rest.toString());
            setSplitPayment1Received(rest.toString());
          };

          // Helper: Distribuir 50% y 50%
          const handleSetFiftyFifty = () => {
            const half = Math.round((activeCheckoutSale.total / 2) * 100) / 100;
            const rest = Math.round((activeCheckoutSale.total - half) * 100) / 100;
            setSplitPayment1Amount(half.toString());
            setSplitPayment1Received(half.toString());
            setSplitPayment2Amount(rest.toString());
            setSplitPayment2Received(rest.toString());
          };

          const cashierPaymentOptions = [
            { id: "EFECTIVO", label: "Efectivo", icon: Banknote },
            { id: "DEBITO", label: "Débito", icon: CreditCard },
            { id: "CREDITO", label: "Crédito", icon: CreditCard },
            { id: "QR_MERCADOPAGO", label: "QR / MP", icon: QrCode },
            { id: "TRANSFERENCIA", label: "Transfer.", icon: ArrowUpRight },
          ] as const;

          return (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className={`px-6 py-4 text-white flex items-center justify-between shrink-0 ${
                  isExchangeTicket ? "bg-slate-900 border-b border-purple-500/30" : "bg-slate-900"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                      {activeCheckoutSale.ticketCode || "#000"}
                    </span>
                    <h3 className="text-base font-bold">
                      {isExchangeTicket ? "Confirmar Cambio de Prenda en Caja" : "Cobrar Preventa en Caja"}
                    </h3>
                    {isExchangeTicket && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full font-semibold hidden sm:inline-flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Cambio
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveCheckoutSale(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  {/* Banner de Información de Cambio de Prenda */}
                  {isExchangeTicket && (
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                          Detalles del Cambio Registrado
                        </span>
                        <span className="text-[11px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
                          Reingreso a stock en confirmación
                        </span>
                      </div>
                      <p className="text-xs text-purple-900 leading-relaxed font-medium">
                        {activeCheckoutSale.notes?.replace(/\[CAMBIO:[^\]]+\]\s*/, "")}
                      </p>
                    </div>
                  )}

                  {/* Total Display */}
                  <div className={`border rounded-2xl p-3.5 text-center ${
                    isZeroTotal
                      ? "bg-slate-50 border-slate-200"
                      : "bg-emerald-50 border-emerald-200/80"
                  }`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isZeroTotal ? "text-slate-600" : "text-emerald-800"
                    }`}>
                      {isExchangeTicket ? "Diferencia a Cobrar" : "Total a Cobrar"}
                    </span>
                    <p className={`text-3xl font-black mt-0.5 font-mono ${
                      isZeroTotal ? "text-slate-700" : "text-emerald-700"
                    }`}>
                      {formatCurrency(activeCheckoutSale.total)}
                    </p>
                    {isZeroTotal && (
                      <p className="text-xs font-semibold text-emerald-600 mt-1">
                        Mano a mano (mismo valor) — Sin diferencia a pagar
                      </p>
                    )}
                  </div>

                  {/* Desglose Interactivo de Prendas del Ticket */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                        {isExchangeTicket ? "Prenda a Entregar" : `Prendas del Ticket (${activeCheckoutSale.items.length})`}
                      </span>
                      {!isExchangeTicket && (
                        <button
                          type="button"
                          onClick={() => setEditingTicket(activeCheckoutSale)}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          title="Añadir nuevas prendas, cambiar talles o editar artículos"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Añadir / Modificar Artículos</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto divide-y divide-slate-200/60 pr-1">
                      {activeCheckoutSale.items.map((it) => (
                        <div key={it.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 truncate">
                              {it.variant.product.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Talle {it.variant.size}
                              {it.variant.color ? ` • ${it.variant.color}` : ""}
                              {" • "}
                              <span className="font-mono text-slate-700">{formatCurrency(it.unitPrice)} c/u</span>
                            </p>
                          </div>

                          {!isExchangeTicket ? (
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Control de cantidad */}
                              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  disabled={isUpdatingPendingSaleItems}
                                  onClick={() => handleUpdateItemQuantityInPendingSale(it.id, -1)}
                                  className="p-1 text-slate-500 hover:text-rose-600 disabled:opacity-40 rounded transition-colors"
                                  title="Disminuir cantidad (libera stock en salón)"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  disabled={isUpdatingPendingSaleItems}
                                  value={it.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val > 0 && val !== it.quantity) {
                                      handleUpdateItemQuantityInPendingSale(it.id, val - it.quantity);
                                    }
                                  }}
                                  className="w-9 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={isUpdatingPendingSaleItems}
                                  onClick={() => handleUpdateItemQuantityInPendingSale(it.id, 1)}
                                  className="p-1 text-slate-500 hover:text-emerald-600 disabled:opacity-40 rounded transition-colors"
                                  title="Aumentar cantidad (reserva stock)"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="font-mono font-bold text-slate-900 text-xs w-16 text-right">
                                {formatCurrency(it.unitPrice * it.quantity)}
                              </span>

                              {/* Botón de quitar renglón completo */}
                              <button
                                type="button"
                                disabled={isUpdatingPendingSaleItems}
                                onClick={() => handleRemoveItemFromPendingSale(it.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Retirar prenda del ticket y devolver stock al salón"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-slate-600 font-semibold">
                                Cantidad: {it.quantity}
                              </span>
                              <span className="font-mono font-bold text-slate-900 text-xs w-16 text-right">
                                {formatCurrency(it.unitPrice * it.quantity)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Banner si el total es $ 0,00 (Cambio sin diferencia monetaria) o Selector de Medios de Pago */}
                  {isZeroTotal ? (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-center space-y-1.5 animate-in fade-in duration-150">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-1">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-950">
                        Cambio directo sin diferencia ($ 0,00)
                      </h4>
                      <p className="text-xs text-emerald-800 max-w-sm mx-auto leading-relaxed">
                        No se requiere cobro monetario. Al confirmar, el sistema reingresará la prenda devuelta al stock de Saavedra 241, entregará la nueva prenda y emitirá el comprobante no fiscal oficial.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Selector Segmentado: 1 Método vs 2 Métodos */}
                      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setIsSplitPayment(false)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            !isSplitPayment
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pago Único (1 Medio)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSplitPayment(true);
                            const parsedReceived = parseFloat(cashierReceivedAmount);
                            if (!isNaN(parsedReceived) && parsedReceived > 0 && parsedReceived < activeCheckoutSale.total) {
                              const p1 = Math.round(parsedReceived * 100) / 100;
                              const rest = Math.max(0, Math.round((activeCheckoutSale.total - p1) * 100) / 100);
                              setSplitPayment1Method(cashierPaymentMethod);
                              setSplitPayment1Amount(p1.toString());
                              setSplitPayment1Received(p1.toString());
                              setSplitPayment2Amount(rest.toString());
                              setSplitPayment2Received(rest.toString());
                            } else if (!splitPayment1Amount || parseFloat(splitPayment1Amount) === 0) {
                              handleSetFiftyFifty();
                            }
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            isSplitPayment
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Split className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Dividir Pago (2 Medios)</span>
                        </button>
                      </div>

                      {/* VISTA A: 1 SOLO MEDIO DE PAGO */}
                      {!isSplitPayment && (
                        <div className="space-y-4 animate-in fade-in duration-150">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700">Medio de Pago</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {cashierPaymentOptions.map((m) => {
                                const Icon = m.icon;
                                const isSelected = cashierPaymentMethod === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setCashierPaymentMethod(m.id as any)}
                                    className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    <span className="truncate">{m.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Si es efectivo: input de monto entregado y cálculo de vuelto */}
                          {cashierPaymentMethod === "EFECTIVO" && (
                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                              <label className="text-xs font-bold text-slate-700 block">
                                Monto entregado por el cliente:
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                                  $
                                </span>
                                <input
                                  type="number"
                                  value={cashierReceivedAmount}
                                  onChange={(e) => setCashierReceivedAmount(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              {parseFloat(cashierReceivedAmount) >= activeCheckoutSale.total && (
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                                  <span className="font-bold text-slate-600">Vuelto a entregar:</span>
                                  <span className="font-mono font-black text-emerald-700 text-base">
                                    {formatCurrency(
                                      parseFloat(cashierReceivedAmount) - activeCheckoutSale.total
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Detalles de Tarjeta (Débito/Crédito) */}
                          {(cashierPaymentMethod === "DEBITO" || cashierPaymentMethod === "CREDITO") && (
                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                              <div>
                                <label className="text-xs font-bold text-slate-700 block mb-2">Marca de Tarjeta:</label>
                                <div className="flex flex-wrap gap-2">
                                  {["Visa", "Mastercard", "Cabal", ...(cashierPaymentMethod === "CREDITO" ? ["Naranja"] : []), "Otra"].map(brand => (
                                    <button
                                      key={brand}
                                      type="button"
                                      onClick={() => setCashierCardBrand(brand)}
                                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                        cashierCardBrand === brand
                                          ? "bg-slate-900 text-white border-slate-900"
                                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                      }`}
                                    >
                                      {brand}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {cashierPaymentMethod === "CREDITO" && (
                                <div>
                                  <label className="text-xs font-bold text-slate-700 block mb-2">Cuotas:</label>
                                  <div className="flex flex-wrap gap-2">
                                    {(cashierCardBrand === "Naranja" 
                                      ? [{ v: 1, l: "1 pago" }, { v: 3, l: "Plan Z" }, { v: 4, l: "4 cuotas" }, { v: 5, l: "5 cuotas" }, { v: 6, l: "6 cuotas" }]
                                      : [{ v: 1, l: "1 pago" }, { v: 2, l: "2 cuotas" }, { v: 3, l: "3 cuotas" }, { v: 6, l: "6 cuotas" }]
                                    ).map(inst => (
                                      <button
                                        key={inst.v}
                                        type="button"
                                        onClick={() => setCashierInstallments(inst.v)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                          cashierInstallments === inst.v
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                      >
                                        {inst.l}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div>
                                <label className="text-xs font-bold text-slate-700 block mb-1">Nº de Operación / Lote (Opcional):</label>
                                <input
                                  type="text"
                                  placeholder="Ej: 123456"
                                  value={cashierCardVoucher}
                                  onChange={(e) => setCashierCardVoucher(e.target.value)}
                                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* VISTA B: PAGO DIVIDIDO (2 MÉTODOS DE PAGO) */}
                      {isSplitPayment && (
                        <div className="space-y-3.5 animate-in fade-in duration-150">
                          {/* Accesos rápidos de distribución */}
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-500 font-semibold text-[11px]">Distribución rápida:</span>
                            <div className="flex gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={handleSetFiftyFifty}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition-colors cursor-pointer"
                              >
                                50% / 50%
                              </button>
                              <button
                                type="button"
                                onClick={handleAssignRemainingTo2}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-[11px] transition-colors cursor-pointer"
                              >
                                Restante a Método 2
                              </button>
                              <button
                                type="button"
                                onClick={handleAssignRemainingTo1}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-[11px] transition-colors cursor-pointer"
                              >
                                Restante a Método 1
                              </button>
                            </div>
                          </div>

                          {/* Tarjeta Método 1 */}
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">1</span>
                                Primer Medio de Pago
                              </span>
                              <button
                                type="button"
                                onClick={handleAssignRemainingTo1}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Asignar el saldo restante a este medio"
                              >
                                <CircleDollarSign className="w-3 h-3 text-emerald-600" />
                                <span>Asignar Restante</span>
                              </button>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                              {cashierPaymentOptions.map((m) => {
                                const Icon = m.icon;
                                const isSel = splitPayment1Method === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setSplitPayment1Method(m.id as any);
                                      if (m.id === "EFECTIVO") {
                                        const p1 = parseFloat(splitPayment1Amount) || 0;
                                        const rec1 = parseFloat(splitPayment1Received) || 0;
                                        if (!splitPayment1Received || rec1 < p1) {
                                          setSplitPayment1Received(splitPayment1Amount);
                                        }
                                      }
                                    }}
                                    className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                      isSel
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="truncate">{m.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[11px] font-bold text-slate-600 block mb-1">Monto a Cobrar:</label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={splitPayment1Amount}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const prevAmt = parseFloat(splitPayment1Amount) || 0;
                                      const currentRec = parseFloat(splitPayment1Received) || 0;
                                      const newAmt = parseFloat(val) || 0;

                                      setSplitPayment1Amount(val);

                                      if (splitPayment1Method === "EFECTIVO") {
                                        // Solo auto-actualizar si estaba vacío, era pago exacto previo, o si el nuevo monto supera lo recibido
                                        if (
                                          splitPayment1Received === "" ||
                                          currentRec === prevAmt ||
                                          currentRec < newAmt
                                        ) {
                                          setSplitPayment1Received(val);
                                        }
                                      }
                                    }}
                                    className="w-full pl-6 pr-2.5 py-1.5 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                              {splitPayment1Method === "EFECTIVO" ? (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-slate-600">Efectivo Entregado:</label>
                                    <button
                                      type="button"
                                      onClick={() => setSplitPayment1Received(splitPayment1Amount)}
                                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                                      title="Poner pago exacto sin vuelto"
                                    >
                                      Exacto
                                    </button>
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                    <input
                                      type="number"
                                      step="any"
                                      value={splitPayment1Received}
                                      onChange={(e) => setSplitPayment1Received(e.target.value)}
                                      placeholder="Monto entregado"
                                      className="w-full pl-6 pr-2.5 py-1.5 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-end pb-1.5">
                                  <span className="text-[11px] text-slate-400 italic">Monto exacto vía tarjeta/transferencia</span>
                                </div>
                              )}
                            </div>
                            {splitPayment1Method === "EFECTIVO" && splitChange1 > 0 && (
                              <div className="text-right text-[11px] font-bold text-emerald-700 font-mono">
                                Vuelto Método 1: {formatCurrency(splitChange1)}
                              </div>
                            )}
                            
                            {/* Detalles de Tarjeta 1 (Débito/Crédito) */}
                            {(splitPayment1Method === "DEBITO" || splitPayment1Method === "CREDITO") && (
                              <div className="pt-2 border-t border-slate-200 mt-2 space-y-2">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Marca de Tarjeta:</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {["Visa", "Mastercard", "Cabal", ...(splitPayment1Method === "CREDITO" ? ["Naranja"] : []), "Otra"].map(brand => (
                                      <button
                                        key={brand}
                                        type="button"
                                        onClick={() => setSplitPayment1CardBrand(brand)}
                                        className={`px-2 py-1 rounded-md border text-[11px] font-bold transition-all ${
                                          splitPayment1CardBrand === brand
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                      >
                                        {brand}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {splitPayment1Method === "CREDITO" && (
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Cuotas:</label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(splitPayment1CardBrand === "Naranja" 
                                        ? [{ v: 1, l: "1 pago" }, { v: 3, l: "Plan Z" }, { v: 4, l: "4 cuotas" }, { v: 5, l: "5 cuotas" }, { v: 6, l: "6 cuotas" }]
                                        : [{ v: 1, l: "1 pago" }, { v: 2, l: "2 cuotas" }, { v: 3, l: "3 cuotas" }, { v: 6, l: "6 cuotas" }]
                                      ).map(inst => (
                                        <button
                                          key={inst.v}
                                          type="button"
                                          onClick={() => setSplitPayment1Installments(inst.v)}
                                          className={`px-2 py-1 rounded-md border text-[11px] font-bold transition-all ${
                                            splitPayment1Installments === inst.v
                                              ? "bg-slate-900 text-white border-slate-900"
                                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                          }`}
                                        >
                                          {inst.l}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nº Operación / Lote (Opcional):</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: 123456"
                                    value={splitPayment1CardVoucher}
                                    onChange={(e) => setSplitPayment1CardVoucher(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white rounded-md border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Tarjeta Método 2 */}
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">2</span>
                                Segundo Medio de Pago
                              </span>
                              <button
                                type="button"
                                onClick={handleAssignRemainingTo2}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Asignar el saldo restante a este medio"
                              >
                                <CircleDollarSign className="w-3 h-3 text-emerald-600" />
                                <span>Asignar Restante</span>
                              </button>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                              {cashierPaymentOptions.map((m) => {
                                const Icon = m.icon;
                                const isSel = splitPayment2Method === m.id;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => {
                                      setSplitPayment2Method(m.id as any);
                                      if (m.id === "EFECTIVO") {
                                        const p2 = parseFloat(splitPayment2Amount) || 0;
                                        const rec2 = parseFloat(splitPayment2Received) || 0;
                                        if (!splitPayment2Received || rec2 < p2) {
                                          setSplitPayment2Received(splitPayment2Amount);
                                        }
                                      }
                                    }}
                                    className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                      isSel
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="truncate">{m.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[11px] font-bold text-slate-600 block mb-1">Monto a Cobrar:</label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                  <input
                                    type="number"
                                    step="any"
                                    value={splitPayment2Amount}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const prevAmt = parseFloat(splitPayment2Amount) || 0;
                                      const currentRec = parseFloat(splitPayment2Received) || 0;
                                      const newAmt = parseFloat(val) || 0;

                                      setSplitPayment2Amount(val);

                                      if (splitPayment2Method === "EFECTIVO") {
                                        if (
                                          splitPayment2Received === "" ||
                                          currentRec === prevAmt ||
                                          currentRec < newAmt
                                        ) {
                                          setSplitPayment2Received(val);
                                        }
                                      }
                                    }}
                                    className="w-full pl-6 pr-2.5 py-1.5 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                              {splitPayment2Method === "EFECTIVO" ? (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-bold text-slate-600">Efectivo Entregado:</label>
                                    <button
                                      type="button"
                                      onClick={() => setSplitPayment2Received(splitPayment2Amount)}
                                      className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                                      title="Poner pago exacto sin vuelto"
                                    >
                                      Exacto
                                    </button>
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                    <input
                                      type="number"
                                      step="any"
                                      value={splitPayment2Received}
                                      onChange={(e) => setSplitPayment2Received(e.target.value)}
                                      placeholder="Monto entregado"
                                      className="w-full pl-6 pr-2.5 py-1.5 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-end pb-1.5">
                                  <span className="text-[11px] text-slate-400 italic">Monto exacto vía tarjeta/transferencia</span>
                                </div>
                              )}
                            </div>
                            {splitPayment2Method === "EFECTIVO" && splitChange2 > 0 && (
                              <div className="text-right text-[11px] font-bold text-emerald-700 font-mono">
                                Vuelto Método 2: {formatCurrency(splitChange2)}
                              </div>
                            )}
                            
                            {/* Detalles de Tarjeta 2 (Débito/Crédito) */}
                            {(splitPayment2Method === "DEBITO" || splitPayment2Method === "CREDITO") && (
                              <div className="pt-2 border-t border-slate-200 mt-2 space-y-2">
                                <div>
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Marca de Tarjeta:</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {["Visa", "Mastercard", "Cabal", ...(splitPayment2Method === "CREDITO" ? ["Naranja"] : []), "Otra"].map(brand => (
                                      <button
                                        key={brand}
                                        type="button"
                                        onClick={() => setSplitPayment2CardBrand(brand)}
                                        className={`px-2 py-1 rounded-md border text-[11px] font-bold transition-all ${
                                          splitPayment2CardBrand === brand
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                      >
                                        {brand}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                {splitPayment2Method === "CREDITO" && (
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Cuotas:</label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(splitPayment2CardBrand === "Naranja" 
                                        ? [{ v: 1, l: "1 pago" }, { v: 3, l: "Plan Z" }, { v: 4, l: "4 cuotas" }, { v: 5, l: "5 cuotas" }, { v: 6, l: "6 cuotas" }]
                                        : [{ v: 1, l: "1 pago" }, { v: 2, l: "2 cuotas" }, { v: 3, l: "3 cuotas" }, { v: 6, l: "6 cuotas" }]
                                      ).map(inst => (
                                        <button
                                          key={inst.v}
                                          type="button"
                                          onClick={() => setSplitPayment2Installments(inst.v)}
                                          className={`px-2 py-1 rounded-md border text-[11px] font-bold transition-all ${
                                            splitPayment2Installments === inst.v
                                              ? "bg-slate-900 text-white border-slate-900"
                                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                          }`}
                                        >
                                          {inst.l}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nº Operación / Lote (Opcional):</label>
                                  <input
                                    type="text"
                                    placeholder="Ej: 123456"
                                    value={splitPayment2CardVoucher}
                                    onChange={(e) => setSplitPayment2CardVoucher(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-white rounded-md border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Balance y Resumen de Asignación */}
                          <div
                            className={`p-3 rounded-2xl border text-xs flex flex-col gap-1.5 ${
                              isSplitBalanced
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                : !isSplitCash1Valid || !isSplitCash2Valid
                                ? "bg-rose-50/80 border-rose-200 text-rose-900"
                                : splitDiff > 0
                                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                                : "bg-rose-50/80 border-rose-200 text-rose-900"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>Total Asignado:</span>
                              <span className="font-mono text-sm">
                                {formatCurrency(splitTotalAssigned)} / {formatCurrency(activeCheckoutSale.total)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              {isSplitBalanced ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Coincide con el total a cobrar
                                </span>
                              ) : !isSplitCash1Valid ? (
                                <span className="text-rose-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Efectivo en Método 1 ({formatCurrency(splitRec1)}) no cubre lo asignado ({formatCurrency(splitP1)})
                                </span>
                              ) : !isSplitCash2Valid ? (
                                <span className="text-rose-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Efectivo en Método 2 ({formatCurrency(splitRec2)}) no cubre lo asignado ({formatCurrency(splitP2)})
                                </span>
                              ) : splitDiff > 0 ? (
                                <span className="text-amber-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Faltan asignar {formatCurrency(splitDiff)}
                                </span>
                              ) : (
                                <span className="text-rose-700 font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Supera el total por {formatCurrency(Math.abs(splitDiff))}
                                </span>
                              )}
                              {totalSplitChange > 0 && (
                                <span className="font-mono font-bold text-emerald-800">
                                  Vuelto Total: {formatCurrency(totalSplitChange)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Botón de Confirmación */}
                  <button
                    type="button"
                    onClick={handleProcessCashierCheckout}
                    disabled={isProcessingCheckout || (!isZeroTotal && isSplitPayment && !isSplitBalanced)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isProcessingCheckout ? (
                      <span>Procesando...</span>
                    ) : isZeroTotal ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>CONFIRMAR CAMBIO Y EMITIR COMPROBANTE</span>
                      </>
                    ) : isExchangeTicket ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>CONFIRMAR COBRO DE DIFERENCIA Y EMITIR COMPROBANTE</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>CONFIRMAR COBRO Y ENTREGAR PRENDAS</span>
                      </>
                    )}
                  </button>

                  {/* Acciones Secundarias: Cerrar o Cancelar Preventa */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveCheckoutSale(null)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                    >
                      Cerrar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelPending(activeCheckoutSale.id, activeCheckoutSale.ticketCode)}
                      className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                      title="Cancelar la preventa y liberar el stock reservado inmediatamente"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cancelar Preventa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal de Éxito de Cobro Definitivo */}
        {completedSaleResult && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-5 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {completedSaleResult.isExchange ? "¡Cambio Confirmado con Éxito!" : "¡Cobro Completado con Éxito!"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Comprobante: <span className="font-mono font-bold text-slate-800">{completedSaleResult.invoiceNumber}</span>
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-800">{completedSaleResult.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {completedSaleResult.totalNet === 0 ? "Saldo Abonado:" : "Total Abonado:"}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(completedSaleResult.totalNet)}
                  </span>
                </div>

                {completedSaleResult.isExchange && (
                  <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px] leading-relaxed font-medium">
                    Prenda devuelta reingresada a stock en Saavedra 241 y nueva prenda entregada al cliente.
                  </div>
                )}
                {completedSaleResult.payments && completedSaleResult.payments.length > 0 && completedSaleResult.totalNet > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="text-slate-500 font-semibold block text-[11px]">Medios de Pago:</span>
                    {completedSaleResult.payments.map((p, idx) => (
                      <div key={idx} className="flex justify-between font-mono pl-1 text-[11px]">
                        <span className="text-slate-600 font-medium">
                          {p.method === "EFECTIVO"
                            ? "Efectivo"
                            : p.method === "DEBITO"
                            ? "Tarjeta Débito"
                            : p.method === "CREDITO"
                            ? "Tarjeta Crédito"
                            : p.method === "QR_MERCADOPAGO"
                            ? "QR Mercado Pago"
                            : p.method === "TRANSFERENCIA"
                            ? "Transferencia"
                            : p.method}
                          :
                        </span>
                        <span className="font-bold text-slate-800">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {completedSaleResult.change > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                    <span>Vuelto Entregado:</span>
                    <span className="font-mono">{formatCurrency(completedSaleResult.change)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (completedSaleResult.saleId) {
                      window.open(`/pos/tickets/${completedSaleResult.saleId}/print`, "_blank");
                    } else {
                      window.print();
                    }
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Imprimir comprobante no fiscal (80mm)"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ticket (80mm)</span>
                </button>
                <button
                  onClick={() => setCompletedSaleResult(null)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        {renderSharedModalsAndToast()}
      </>
    );
  }

  // ----------------------------------------------------------------------
  // Render: SUB-VISTA PREVENTA SALÓN (TERMINAL 1)
  // ----------------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#f1f4f6] min-h-screen relative overflow-x-hidden">
      {/* ============================================================ */}
      {/* COLUMNA CENTRAL / IZQUIERDA: CATÁLOGO Y BUSCADOR             */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-6">
        {/* Top Sticky Header */}
        <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-2xs space-y-3">
          {/* Breadcrumb & Navigation Controls */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  aria-label="Abrir menú"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Preventa</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Salón
                </h1>
              </div>
            </div>

            {/* Acciones de Preventa: Carga Rápida, Consultar Precios/Stock y Devolución / Cambio */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => {
                  setQuickProductQuery(searchQuery.trim());
                  setIsQuickProductModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Carga de emergencia de producto no catalogado en stock"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Carga Rápida</span>
                <span className="sm:hidden">Rápida</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPriceCheckerOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border border-emerald-300/90 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Verificador de Precios y Stock (F3)"
              >
                <Barcode className="w-4 h-4 text-emerald-700" />
                <span className="hidden md:inline">Consultar Precio</span>
                <span className="md:hidden">Consultar</span>
                <span className="hidden sm:inline-block text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
                  F3
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsExchangeModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                title="Iniciar solicitud de cambio de prenda o devolución de cliente"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-sky-700" />
                <span className="hidden sm:inline">Devolución / Cambio</span>
                <span className="sm:hidden">Cambio</span>
              </button>

              {/* User Session Badge & Logout */}
              {currentUser && (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUser.username || currentUser.name}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold leading-tight">
                      {currentUser.profileName || "Personal"}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      await logoutAction();
                      window.location.href = "/login";
                    }}
                    title="Cerrar Sesión"
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, código de barras, SKU..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400 outline-none"
              />

              {searchQuery && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Layout Toggle (Grid / List) */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewLayout("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewLayout === "grid"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Vista Cuadrícula"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout("list")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewLayout === "list"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Vista Lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Barra de Sugerencias Predictivas de Color */}
          {predictiveColorSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap animate-in fade-in duration-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Colores sugeridos:</span>
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {predictiveColorSuggestions.map(({ color, stock }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleSelectPredictiveColor(color)}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-white hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title={`Filtrar por ${color} (${stock} un. en salón)`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full border shrink-0 ${getColorSwatchClass(
                        color
                      )}`}
                    />
                    <span>{color}</span>
                    <span className="text-[9.5px] font-mono text-slate-400">
                      ({stock})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Discipline / Category Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap relative py-0.5">
            {visibleCategories.map((disc) => {
              const isSelected = selectedDiscipline === disc;
              return (
                <button
                  key={disc}
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {disc}
                </button>
              );
            })}

            {/* Botón Desplegable hacia abajo para Ver Todas las Categorías */}
            {disciplineOptions.length > MAX_VISIBLE_CATEGORIES && (
              <div className="relative shrink-0" ref={categoriesDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoriesDropdownOpen((prev) => !prev)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isCategoriesDropdownOpen
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  title="Ver todas las categorías"
                >
                  <span>Más</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isCategoriesDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Menú Desplegable hacia abajo */}
                {isCategoriesDropdownOpen && (
                  <div className="absolute left-0 sm:left-auto right-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 min-w-[280px] max-w-[340px] animate-in fade-in zoom-in-95 duration-150 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        Todas las Disciplinas ({disciplineOptions.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCategoriesDropdownOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                      {disciplineOptions.map((disc) => {
                        const isSelected = selectedDiscipline === disc;
                        return (
                          <button
                            key={disc}
                            type="button"
                            onClick={() => {
                              setSelectedDiscipline(disc);
                              setIsCategoriesDropdownOpen(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? "bg-slate-900 text-white shadow-xs font-bold"
                                : "bg-slate-50 border border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span>{disc}</span>
                            {isSelected && <Check className="w-3 h-3 text-[#c2f25b]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filtros por Marca y Categoría */}
            <div className="flex items-center gap-1.5 sm:ml-auto shrink-0">
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  title="Filtrar por marca"
                  className={`appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-semibold border cursor-pointer outline-none transition-all max-w-[150px] truncate ${
                    selectedBrand !== "Todas"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <option value="Todas" className="bg-white text-slate-900">Todas las marcas</option>
                  {brandFilterOptions.map((b) => (
                    <option key={b} value={b} className="bg-white text-slate-900">{b}</option>
                  ))}
                </select>
                <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${selectedBrand !== "Todas" ? "text-white" : "text-slate-400"}`} />
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  title="Filtrar por categoría"
                  className={`appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-semibold border cursor-pointer outline-none transition-all max-w-[170px] truncate ${
                    selectedCategory !== "Todas"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <option value="Todas" className="bg-white text-slate-900">Todas las categorías</option>
                  {categoryFilterOptions.map((c) => (
                    <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
                  ))}
                </select>
                <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${selectedCategory !== "Todas" ? "text-white" : "text-slate-400"}`} />
              </div>

              {(selectedBrand !== "Todas" || selectedCategory !== "Todas") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand("Todas");
                    setSelectedCategory("Todas");
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                  title="Quitar filtros de marca y categoría"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Product Catalog Grid / List */}
        <main className="p-4 sm:p-6">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-12 text-center border border-dashed border-slate-300 max-w-md mx-auto my-12 space-y-4">
              <div>
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No se encontraron productos</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Intenta con otro término de búsqueda o limpia los filtros.
                </p>
              </div>

              {searchQuery.trim() && (
                <div className="pt-3 border-t border-slate-100 flex flex-col items-center">
                  <p className="text-xs text-amber-800 font-medium mb-2">
                    ¿Es un producto nuevo que aún no está cargado en stock?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickProductQuery(searchQuery.trim());
                      setIsQuickProductModalOpen(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Cargar "{searchQuery.trim().slice(0, 16)}" en Carga Rápida</span>
                  </button>
                </div>
              )}

              <div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedDiscipline("Todas");
                    setSelectedBrand("Todas");
                    setSelectedCategory("Todas");
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          ) : viewLayout === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4">
              {paginatedProducts.map((product) => (
                <PosProductGridCard
                  key={product.id}
                  product={product}
                  cart={cart}
                  searchQuery={searchQuery}
                  onAddVariant={handleAddVariantToCart}
                />
              ))}
            </div>
          ) : (
            /* Vista de Lista Compacta */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {paginatedProducts.map((product) => (
                <PosProductListRow
                  key={product.id}
                  product={product}
                  cart={cart}
                  searchQuery={searchQuery}
                  onAddVariant={handleAddVariantToCart}
                />
              ))}
            </div>
          )}

          {/* Paginador del Catálogo (Totalmente Responsive) */}
          {totalItems > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs mt-4">
              {/* Información y selector de ítems */}
              <div className="flex items-center justify-between gap-2 w-full sm:w-auto shrink-0">
                <span className="font-medium text-slate-600 text-xs truncate">
                  <strong className="text-slate-900 font-bold">{startIndex}-{endIndex}</strong> de <strong className="text-slate-900 font-bold">{totalItems}</strong>
                </span>

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-xl shadow-2xs shrink-0">
                  <span className="text-[10px] text-slate-500 font-medium">Por pág.:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                  </select>
                </div>
              </div>

              {/* Controles de Navegación de Páginas */}
              {totalPages > 1 && (
                <>
                  {/* Vista Mobile (< sm): Táctil y compacta sin desbordes */}
                  <div className="flex sm:hidden items-center justify-between w-full pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, validCurrentPage - 1))}
                      disabled={validCurrentPage <= 1}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Página anterior"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                      {validCurrentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, validCurrentPage + 1))}
                      disabled={validCurrentPage >= totalPages}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
                      title="Página siguiente"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Vista Tablet / Desktop (sm+): Flechitas en burbuja + números compactos */}
                  <div className="hidden sm:flex items-center gap-1.5 w-auto justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.max(1, validCurrentPage - 1))}
                      disabled={validCurrentPage <= 1}
                      className="w-7 h-7 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer shrink-0"
                      title="Página anterior"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((pageNum, idx) =>
                        typeof pageNum === "string" ? (
                          <span key={`dots-${idx}`} className="px-0.5 text-slate-400 text-xs font-bold">
                            ...
                          </span>
                        ) : (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              validCurrentPage === pageNum
                                ? "bg-slate-900 text-white shadow-xs scale-105"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePageChange(Math.min(totalPages, validCurrentPage + 1))}
                      disabled={validCurrentPage >= totalPages}
                      className="w-7 h-7 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer shrink-0"
                      title="Página siguiente"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ============================================================ */}
      {/* COLUMNA DERECHA: PANEL DE PREVENTA / CARRITO SALÓN           */}
      {/* ============================================================ */}
      <aside id="pos-cart-panel" className="w-full md:w-[330px] lg:w-[370px] xl:w-[410px] shrink-0 bg-white border-l border-slate-200/90 flex flex-col justify-between h-auto md:h-screen sticky md:top-0 shadow-sm z-30">
        {/* Header Preventa */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                PREVENTA SALÓN
              </h2>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/60">
                Stock Reservado
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="text-xs text-slate-400 hover:text-rose-600 disabled:opacity-30 flex items-center gap-1 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <span>Saavedra 241 • Formosa</span>
          </p>

          {/* Campo Cliente / Ref */}
          <div className="relative pt-1">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Cliente / Ref (Consumidor Final)"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-900 font-medium rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Lista de Ítems del Carrito */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[380px] md:max-h-none">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">
                El carrito de preventa está vacío
              </p>
              <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                Toca los talles de los productos para reservarlos en salón.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const { unitDiscount, unitPrice } = calculateItemDiscount(
                item.originalPrice,
                item.discountType,
                item.discountValue
              );
              const lineSubtotal = unitPrice * item.quantity;
              const hasDiscount = unitDiscount > 0;

              return (
                <div
                  key={item.rowId}
                  className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2 hover:border-slate-300 transition-all"
                >
                  {/* Top Item Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Talle: <span className="font-semibold text-slate-700">{item.size}</span>
                        {item.color ? ` • ${item.color}` : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.variantId)}
                      className="text-slate-300 hover:text-rose-600 p-0.5 rounded transition-colors"
                      title="Quitar ítem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity & Pricing Controls */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Botones de Cantidad [-] [ 1 ] [+] */}
                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.variantId, -1)}
                        className="p-1 text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold text-slate-800 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.variantId, 1)}
                        className="p-1 text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Descuento por Renglón (RF-08) */}
                    <div>
                      {hasDiscount ? (
                        <button
                          type="button"
                          onClick={() => openItemDiscountModal(item)}
                          className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                          title="Editar descuento de este ítem"
                        >
                          <Tag className="w-3 h-3" />
                          <span>
                            {item.discountType === "PERCENTAGE"
                              ? `-${item.discountValue}%`
                              : `-$${item.discountValue}`}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openItemDiscountModal(item)}
                          className="text-[10px] font-semibold text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 px-1.5 py-0.5 rounded border border-dashed border-slate-300 transition-colors"
                        >
                          + Desc.
                        </button>
                      )}
                    </div>

                    {/* Importe del Renglón */}
                    <div className="text-right">
                      {hasDiscount && (
                        <span className="text-[10px] text-slate-400 line-through block leading-none font-mono">
                          {formatCurrency(item.originalPrice * item.quantity)}
                        </span>
                      )}
                      <span className="text-xs font-extrabold text-slate-900 font-mono">
                        {formatCurrency(lineSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Resumen de Totales y Descuentos */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-white space-y-3">
          <div className="space-y-1.5 text-xs text-slate-600">
            {/* Subtotal Bruto */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Subtotal bruto:</span>
              <span className="font-semibold text-slate-800 font-mono">
                {formatCurrency(saleTotals.subtotalGross)}
              </span>
            </div>

            {/* Descuento Ítems */}
            {saleTotals.totalItemDiscounts > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Descuento ítems:</span>
                <span className="font-mono font-bold">
                  - {formatCurrency(saleTotals.totalItemDiscounts)}
                </span>
              </div>
            )}

            {/* Descuento Global del Ticket (RF-08) */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-slate-500 font-medium">Descuento ticket:</span>
              {globalDiscount ? (
                <button
                  type="button"
                  onClick={openGlobalDiscountModal}
                  className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1 font-mono"
                >
                  <span>
                    {globalDiscount.type === "PERCENTAGE"
                      ? `-${globalDiscount.value}%`
                      : `-$${globalDiscount.value}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">(editar)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openGlobalDiscountModal}
                  disabled={cart.length === 0}
                  className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold disabled:opacity-40"
                >
                  + Descuento Global
                </button>
              )}
            </div>

            {saleTotals.globalDiscountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span>Monto dto. global:</span>
                <span className="font-mono font-bold">
                  - {formatCurrency(saleTotals.globalDiscountAmount)}
                </span>
              </div>
            )}

            {/* Total Descuentos Acumulados */}
            {saleTotals.totalDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-800 font-bold pt-1 border-t border-slate-100">
                <span>Total Descuentos:</span>
                <span className="font-mono">- {formatCurrency(saleTotals.totalDiscount)}</span>
              </div>
            )}
          </div>

          {/* Tarjeta Verde Oscuro Institucional con TOTAL A CONGELAR */}
          <div className="bg-[#06241d] rounded-2xl p-4 text-white border border-[#094d3f] shadow-lg space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#c2f25b] block">
              TOTAL A CONGELAR
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#00D615] font-mono drop-shadow-[0_0_12px_rgba(0,214,21,0.25)]">
              {formatCurrency(saleTotals.totalNet)}
            </div>
          </div>

          {/* Botón Principal: ENVIAR A CAJA Y RESERVAR STOCK */}
          <button
            type="button"
            disabled={cart.length === 0 || isSubmittingPreventa}
            onClick={handleSendPreventaToCashier}
            className="w-full py-3.5 px-4 bg-[#00D615] hover:bg-[#00be13] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmittingPreventa ? (
              <span>Reservando stock en base de datos...</span>
            ) : (
              <>
                <span>ENVIAR A CAJA Y RESERVAR STOCK</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Floating Cart Summary Bar (Visible en móviles cuando hay ítems en preventa) */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#06241d]/95 backdrop-blur-md border-t border-[#094d3f] p-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2.5 text-white pl-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#c2f25b] shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider block truncate">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} {cart.reduce((acc, i) => acc + i.quantity, 0) === 1 ? "ítem" : "ítems"}
              </span>
              <span className="text-base font-black text-[#00D615] font-mono leading-none truncate block">
                {formatCurrency(saleTotals.totalNet)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const asideEl = document.getElementById("pos-cart-panel");
              asideEl?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 bg-[#00D615] hover:bg-[#00be13] active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <span>Ver Preventa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE DESCUENTO (RF-08): Ítem o Global                   */}
      {/* ============================================================ */}
      {discountModalConfig && (() => {
        const isPercentage = discountModalConfig.currentType === "PERCENTAGE";
        const val = Number(discountModalConfig.currentValue) || 0;
        const isOverPercentage = isPercentage && val > 100;
        const isOverFixed = !isPercentage && val > discountModalConfig.originalAmount;
        const hasValidationError = isOverPercentage || isOverFixed;

        let calculatedDiscount = 0;
        if (isPercentage) {
          const clamped = Math.min(100, Math.max(0, val));
          calculatedDiscount = Math.round(((discountModalConfig.originalAmount * clamped) / 100) * 100) / 100;
        } else {
          calculatedDiscount = Math.min(discountModalConfig.originalAmount, Math.max(0, val));
        }
        const finalPrice = Math.max(0, Math.round((discountModalConfig.originalAmount - calculatedDiscount) * 100) / 100);

        return (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    {discountModalConfig.isGlobal ? "Descuento Global del Ticket" : "Descuento por Ítem"}
                  </h3>
                </div>
                <button
                  onClick={() => setDiscountModalConfig(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium">
                  Aplicar a: <span className="font-bold text-slate-800">{discountModalConfig.productName}</span>
                </p>

                {/* Selector de Tipo: Porcentaje vs Monto Fijo */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      if (discountModalConfig.currentType !== "PERCENTAGE") {
                        setDiscountModalConfig({
                          ...discountModalConfig,
                          currentType: "PERCENTAGE",
                          currentValue: 0,
                        });
                      }
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      isPercentage
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>Porcentaje (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (discountModalConfig.currentType !== "FIXED") {
                        setDiscountModalConfig({
                          ...discountModalConfig,
                          currentType: "FIXED",
                          currentValue: 0,
                        });
                      }
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      !isPercentage
                        ? "bg-white text-emerald-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Monto Fijo ($ ARS)</span>
                  </button>
                </div>

                {/* Input de Valor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      {isPercentage
                        ? "Porcentaje de descuento (0 a 100%):"
                        : "Monto en pesos a descontar:"}
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium font-mono">
                      Base: {formatCurrency(discountModalConfig.originalAmount)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      {isPercentage ? "%" : "$"}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={isPercentage ? "100" : discountModalConfig.originalAmount}
                      value={discountModalConfig.currentValue || ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setDiscountModalConfig({
                            ...discountModalConfig,
                            currentValue: 0,
                          });
                          return;
                        }
                        const parsed = parseFloat(raw);
                        setDiscountModalConfig({
                          ...discountModalConfig,
                          currentValue: isNaN(parsed) ? 0 : Math.max(0, parsed),
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!hasValidationError && val > 0) {
                            handleApplyDiscount(
                              discountModalConfig.currentType,
                              val,
                              discountModalConfig.isGlobal,
                              discountModalConfig.targetRowId
                            );
                          }
                        }
                      }}
                      placeholder="0"
                      className={`w-full pl-8 pr-3.5 py-2.5 bg-slate-50 rounded-xl border font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                        hasValidationError
                          ? "border-rose-400 focus:ring-rose-500 text-rose-700 bg-rose-50/30"
                          : "border-slate-300 focus:ring-emerald-500"
                      }`}
                    />
                  </div>

                  {/* Mensajes de Validación en Vivo */}
                  {isOverPercentage && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>El porcentaje de descuento no puede ser mayor al 100%.</span>
                    </div>
                  )}

                  {isOverFixed && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>El descuento fijo no puede superar el precio base ({formatCurrency(discountModalConfig.originalAmount)}).</span>
                    </div>
                  )}
                </div>

                {/* Botones Preset Rápidos */}
                {isPercentage ? (
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() =>
                          setDiscountModalConfig({
                            ...discountModalConfig,
                            currentValue: pct,
                          })
                        }
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          val === pct
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border-slate-200"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {[1000, 2000, 5000, 10000]
                      .filter((amt) => amt <= discountModalConfig.originalAmount)
                      .map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() =>
                            setDiscountModalConfig({
                              ...discountModalConfig,
                              currentValue: amt,
                            })
                          }
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors font-mono ${
                            val === amt
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border-slate-200"
                          }`}
                        >
                          ${amt >= 1000 ? `${amt / 1000}k` : amt}
                        </button>
                      ))}
                  </div>
                )}

                {/* Preview del descuento */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Precio base:</span>
                    <span className="font-mono font-semibold">
                      {formatCurrency(discountModalConfig.originalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Descuento estimado:</span>
                    <span className="font-mono">
                      - {formatCurrency(calculatedDiscount)}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                    <span>Total con descuento:</span>
                    <span className="font-mono text-sm text-emerald-700">
                      {formatCurrency(finalPrice)}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyDiscount(
                        discountModalConfig.currentType,
                        0,
                        discountModalConfig.isGlobal,
                        discountModalConfig.targetRowId
                      )
                    }
                    className="px-4 py-2.5 text-slate-500 hover:text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    Quitar Descuento
                  </button>
                  <button
                    type="button"
                    disabled={hasValidationError || val <= 0}
                    onClick={() =>
                      handleApplyDiscount(
                        discountModalConfig.currentType,
                        val,
                        discountModalConfig.isGlobal,
                        discountModalConfig.targetRowId
                      )
                    }
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Aplicar Descuento
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* MODAL PREVENTA ENVIADA CON ÉXITO (TICKET TÉRMICO PREVIEW)    */}
      {/* ============================================================ */}
      {preventaSuccessData && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Verde */}
            <div className="px-6 py-4 bg-[#06241d] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#00D615]/20 flex items-center justify-center text-[#00D615]">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Preventa Salón Generada</h3>
                  <p className="text-[11px] text-emerald-300">Stock reservado en mostrador</p>
                </div>
              </div>
              <button
                onClick={handleClosePreventaModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Cerrar modal (Esc o Enter)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen Ágil para Salón */}
            <div className="p-6 space-y-4">
              <div className="bg-[#fffdfa] border border-amber-200/80 rounded-2xl p-5 shadow-xs font-mono text-xs text-slate-800 space-y-3">
                {/* Logo & Header */}
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <h4 className="font-black text-base text-slate-900 tracking-tighter">
                    MATACOS DEPORTES
                  </h4>
                  <p className="text-[10px] text-slate-500">Saavedra 241, Formosa</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                    PREVENTA SALÓN
                  </p>
                </div>

                {/* Ticket Number & Customer */}
                <div className="text-center py-2.5 bg-amber-50 rounded-xl border border-amber-200/60">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">
                    Número de Ticket para Caja
                  </span>
                  <span className="text-4xl font-black text-slate-950 font-mono tracking-widest my-1 block">
                    {preventaSuccessData.ticketCode}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    Indique este número al cliente para abonar en caja
                  </span>
                </div>

                {/* Info Clientes */}
                <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente:</span>
                    <span className="font-bold">{preventaSuccessData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha:</span>
                    <span>{formatDate(new Date())}</span>
                  </div>
                </div>

                {/* Ítems */}
                <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2 text-[11px] max-h-36 overflow-y-auto pr-1">
                  {preventaSuccessData.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-baseline gap-2">
                      <span className="truncate max-w-[210px]" title={`${it.name} - ${it.color || ""} (${it.size})`}>
                        {it.quantity}x {it.name} ({it.color ? `${it.color} • ` : ""}{it.size})
                      </span>
                      <span className="font-bold shrink-0">
                        {formatCurrency(it.originalPrice * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="space-y-1 pt-1">
                  {preventaSuccessData.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Descuentos:</span>
                      <span>- {formatCurrency(preventaSuccessData.totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-1 border-t border-slate-900">
                    <span>TOTAL A PAGAR:</span>
                    <span>{formatCurrency(preventaSuccessData.totalNet)}</span>
                  </div>
                </div>
              </div>

              {/* Botón Principal: Siguiente Preventa con atajo Enter */}
              <div>
                <button
                  type="button"
                  autoFocus
                  onClick={handleClosePreventaModal}
                  className="w-full py-3.5 bg-[#00D615] hover:bg-[#00be13] active:scale-[0.99] text-slate-950 font-black rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Nueva Preventa</span>
                  <span className="text-[10px] bg-black/15 text-slate-900 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                    Enter ↵
                  </span>
                </button>
              </div>

              {/* Botón para cancelar preventa si el cliente desiste en salón */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmCancelModal({
                      saleId: preventaSuccessData.saleId,
                      ticketCode: preventaSuccessData.ticketCode,
                      origin: "salon",
                    });
                  }}
                  className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-rose-200/60"
                  title="Cancelar preventa y liberar stock reservado"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Cancelar Preventa y Liberar Stock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderSharedModalsAndToast()}
    </div>
  );
}
