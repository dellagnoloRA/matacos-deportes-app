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
  PanelLeft,
  Split,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  completePendingSale,
  cancelPendingSale,
} from "@/server/actions/posSaleActions";
import { BarcodeSvg } from "./BarcodeSvg";
import { PosTransactionHistoryView } from "./PosTransactionHistoryView";

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
    variant: {
      id: string;
      size: string;
      color: string;
      sku?: string;
      barcode?: string;
      stockStore: number;
      product: {
        id: string;
        name: string;
        brand: { name: string };
        category: { name: string };
      };
    };
  }>;
}

interface PosViewProps {
  initialProducts?: DetailedProductItem[];
  subView?: "preventa" | "cobrar" | "historial";
  onNavigateSubView?: (subView: "preventa" | "cobrar" | "historial") => void;
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
  const [products] = useState<DetailedProductItem[]>(initialProducts);
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

  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [completedSaleResult, setCompletedSaleResult] = useState<{
    invoiceNumber: string;
    ticketCode: string;
    customerName: string;
    totalNet: number;
    change: number;
    payments: Array<{ method: string; amount: number }>;
    items: any[];
  } | null>(null);

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

  useEffect(() => {
    fetchPendingSalesList();
    const interval = setInterval(fetchPendingSalesList, 15000); // Polling suave cada 15 seg
    return () => clearInterval(interval);
  }, [fetchPendingSalesList]);

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

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchModel = p.modelCode?.toLowerCase().includes(q);
        const matchVariants = p.variants.some(
          (v) =>
            v.size.toLowerCase().includes(q) ||
            v.color.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q) ||
            v.barcode.toLowerCase().includes(q)
        );
        return matchName || matchBrand || matchCategory || matchModel || matchVariants;
      });
    }

    return result;
  }, [products, selectedDiscipline, searchQuery]);

  // Resetear paginación al cambiar filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDiscipline]);

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
  // Atajo F2 y Lector de Códigos de Barras USB
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: enfocar búsqueda
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lector de código de barras USB (acumula caracteres rápidos que terminan en Enter)
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isUsbScannerActive) return;

    const handleWindowKeyPress = (e: KeyboardEvent) => {
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
  }, [isUsbScannerActive, products]);

  const handleBarcodeScanned = (code: string) => {
    for (const prod of products) {
      for (const variant of prod.variants) {
        if (
          variant.barcode === code ||
          variant.sku?.toLowerCase() === code.toLowerCase()
        ) {
          // Agregar al carrito
          handleAddVariantToCart(prod, variant);
          showToast(`"${prod.name} (${variant.size})" agregado al carrito`);
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
      showToast(
        `Sin stock disponible en salón para ${product.name} (Talle ${variant.size})`,
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
    if (isGlobal) {
      if (value <= 0) {
        setGlobalDiscount(null);
      } else {
        setGlobalDiscount({ type, value });
      }
    } else if (targetRowId) {
      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.rowId === targetRowId) {
            return {
              ...item,
              discountType: value > 0 ? type : null,
              discountValue: value > 0 ? value : null,
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

    // Inicializar valores para pago mixto por defecto (50% / 50%)
    const half = Math.round((sale.total / 2) * 100) / 100;
    const rest = Math.round((sale.total - half) * 100) / 100;
    setSplitPayment1Method("EFECTIVO");
    setSplitPayment1Amount(half.toString());
    setSplitPayment1Received(half.toString());
    setSplitPayment2Method("DEBITO");
    setSplitPayment2Amount(rest.toString());
    setSplitPayment2Received(rest.toString());
  };

  const handleCancelPending = async (saleId: string, ticketCode: string | null) => {
    if (
      !window.confirm(
        `¿Confirmas la cancelación del Ticket ${ticketCode || "Preventa"}? El stock reservado se liberará inmediatamente para la venta.`
      )
    ) {
      return;
    }

    try {
      const res = await cancelPendingSale(saleId, "Cancelado desde Terminal de Cobro");
      if (res.success) {
        showToast(`Ticket ${ticketCode} cancelado. Stock liberado.`, "success");
        fetchPendingSalesList();
      } else {
        showToast(res.error || "Error al cancelar preventa", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Error de conexión", "error");
    }
  };

  const handleProcessCashierCheckout = async () => {
    if (!activeCheckoutSale) return;

    const totalToPay = activeCheckoutSale.total;

    if (!isSplitPayment) {
      const receivedNum = parseFloat(cashierReceivedAmount) || totalToPay;

      if (cashierPaymentMethod === "EFECTIVO" && receivedNum < totalToPay - 0.05) {
        showToast("El monto en efectivo ingresado no cubre el total de la venta", "error");
        return;
      }

      setIsProcessingCheckout(true);
      try {
        const payload = {
          saleId: activeCheckoutSale.id,
          payments: [
            {
              method: cashierPaymentMethod,
              amount: totalToPay,
              receivedAmount: cashierPaymentMethod === "EFECTIVO" ? receivedNum : undefined,
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
          invoiceNumber: completed.invoiceNumber,
          ticketCode: completed.ticketCode || activeCheckoutSale.ticketCode || "Salón",
          customerName: completed.customerName || "Consumidor Final",
          totalNet: totalToPay,
          change: changeGiven,
          payments: [{ method: cashierPaymentMethod, amount: totalToPay }],
          items: activeCheckoutSale.items,
        });

        setActiveCheckoutSale(null);
        fetchPendingSalesList();
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
          payments: [
            {
              method: splitPayment1Method,
              amount: amt1,
              receivedAmount: splitPayment1Method === "EFECTIVO" ? rec1 : undefined,
            },
            {
              method: splitPayment2Method,
              amount: amt2,
              receivedAmount: splitPayment2Method === "EFECTIVO" ? rec2 : undefined,
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
        });

        setActiveCheckoutSale(null);
        fetchPendingSalesList();
      } catch (err: any) {
        console.error("Error al cobrar con pagos mixtos:", err);
        showToast(err.message || "Error al procesar el cobro", "error");
      } finally {
        setIsProcessingCheckout(false);
      }
    }
  };

  // ----------------------------------------------------------------------
  // Render: SUB-VISTA HISTORIAL DE TRANSACCIONES POS
  // ----------------------------------------------------------------------
  if (subView === "historial") {
    return (
      <PosTransactionHistoryView
        onNavigateToPreventa={() => onNavigateSubView?.("preventa")}
        onNavigateToCobrar={() => onNavigateSubView?.("cobrar")}
        onToggleSidebar={onToggleSidebar}
        pendingSalesCount={pendingSales.length}
      />
    );
  }

  // ----------------------------------------------------------------------
  // Render: SUB-VISTA COBRAR (TERMINAL 2)
  // ----------------------------------------------------------------------
  if (subView === "cobrar") {
    return (
      <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
        {/* Top Header Barra */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  <span>Caja Mostrador • Cobro de Preventas</span>
                </h1>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300/60">
                  Terminal 2
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Selecciona una preventa emitida desde los salones para procesar el pago y emitir comprobante.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigateSubView?.("preventa")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ir a Preventa Salón</span>
            </button>
            <button
              onClick={() => onNavigateSubView?.("historial")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-all"
            >
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>Historial Transacciones</span>
            </button>
            <button
              onClick={fetchPendingSalesList}
              disabled={isLoadingPendingSales}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingPendingSales ? "animate-spin" : ""}`} />
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

          {/* List of Pending Sales */}
          {isLoadingPendingSales && pendingSales.length === 0 ? (
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
                Los vendedores no tienen clientes esperando en caja en este momento.
              </p>
              <button
                onClick={() => onNavigateSubView?.("preventa")}
                className="mt-5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Abrir Terminal Preventa
              </button>
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
                      <span className="text-base font-black tracking-tight text-slate-900 bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-200/60 font-mono">
                        {sale.ticketCode || "#000"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(sale.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {sale.customerName || "Consumidor Final"}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Vendedor: {sale.seller?.name || "Lucas (Salón 1)"}
                      </p>
                    </div>

                    {/* Breakdown of items */}
                    <div className="space-y-1 pt-1">
                      {sale.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 px-2.5 py-1.5 rounded-lg"
                        >
                          <span className="truncate max-w-[170px] font-medium">
                            {it.quantity}x {it.variant.product.name} ({it.variant.size})
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
                      <span className="text-xs font-semibold text-slate-500">Importe a cobrar:</span>
                      <span className="text-xl font-black text-slate-950 font-mono">
                        {formatCurrency(Number(sale.total))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenCheckoutModal(sale)}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform"
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cobrar Ticket</span>
                      </button>
                      <button
                        onClick={() => handleCancelPending(sale.id, sale.ticketCode)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Cancelar preventa y liberar stock"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Cobro Caja Mostrador */}
        {/* Modal de Cobro Caja Mostrador */}
        {activeCheckoutSale && (() => {
          const splitP1 = parseFloat(splitPayment1Amount) || 0;
          const splitP2 = parseFloat(splitPayment2Amount) || 0;
          const splitTotalAssigned = Math.round((splitP1 + splitP2) * 100) / 100;
          const splitDiff = Math.round((activeCheckoutSale.total - splitTotalAssigned) * 100) / 100;
          const isSplitBalanced = Math.abs(splitDiff) <= 0.05 && splitP1 > 0 && splitP2 > 0;

          const splitRec1 = parseFloat(splitPayment1Received) || splitP1;
          const splitRec2 = parseFloat(splitPayment2Received) || splitP2;
          const splitChange1 = splitPayment1Method === "EFECTIVO" ? Math.max(0, splitRec1 - splitP1) : 0;
          const splitChange2 = splitPayment2Method === "EFECTIVO" ? Math.max(0, splitRec2 - splitP2) : 0;
          const totalSplitChange = splitChange1 + splitChange2;

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
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                      {activeCheckoutSale.ticketCode || "#000"}
                    </span>
                    <h3 className="text-base font-bold">Cobrar Preventa en Caja</h3>
                  </div>
                  <button
                    onClick={() => setActiveCheckoutSale(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                  {/* Total Display */}
                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Total a Cobrar
                    </span>
                    <p className="text-3xl font-black text-emerald-700 mt-0.5 font-mono">
                      {formatCurrency(activeCheckoutSale.total)}
                    </p>
                  </div>

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
                        if (!splitPayment1Amount || parseFloat(splitPayment1Amount) === 0) {
                          const half = Math.round((activeCheckoutSale.total / 2) * 100) / 100;
                          const rest = Math.round((activeCheckoutSale.total - half) * 100) / 100;
                          setSplitPayment1Amount(half.toString());
                          setSplitPayment1Received(half.toString());
                          setSplitPayment2Amount(rest.toString());
                          setSplitPayment2Received(rest.toString());
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
                                className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
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
                    </div>
                  )}

                  {/* VISTA B: PAGO DIVIDIDO (2 MÉTODOS DE PAGO) */}
                  {isSplitPayment && (
                    <div className="space-y-3.5 animate-in fade-in duration-150">
                      {/* Accesos rápidos de distribución */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500 font-semibold text-[11px]">Distribución rápida:</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const half = Math.round((activeCheckoutSale.total / 2) * 100) / 100;
                              const rest = Math.round((activeCheckoutSale.total - half) * 100) / 100;
                              setSplitPayment1Amount(half.toString());
                              setSplitPayment1Received(half.toString());
                              setSplitPayment2Amount(rest.toString());
                              setSplitPayment2Received(rest.toString());
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200 text-[11px] transition-colors"
                          >
                            50% / 50%
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const p1 = parseFloat(splitPayment1Amount) || 0;
                              const rest = Math.max(0, Math.round((activeCheckoutSale.total - p1) * 100) / 100);
                              setSplitPayment2Amount(rest.toString());
                              setSplitPayment2Received(rest.toString());
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-[11px] transition-colors"
                          >
                            Restante a Método 2
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
                                  if (m.id === "EFECTIVO" && !splitPayment1Received) {
                                    setSplitPayment1Received(splitPayment1Amount);
                                  }
                                }}
                                className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
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
                                  setSplitPayment1Amount(val);
                                  if (splitPayment1Method === "EFECTIVO") {
                                    setSplitPayment1Received(val);
                                  }
                                }}
                                className="w-full pl-6 pr-2.5 py-1.5 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          {splitPayment1Method === "EFECTIVO" ? (
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">Efectivo Recibido:</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={splitPayment1Received}
                                  onChange={(e) => setSplitPayment1Received(e.target.value)}
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
                      </div>

                      {/* Tarjeta Método 2 */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">2</span>
                            Segundo Medio de Pago
                          </span>
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
                                  if (m.id === "EFECTIVO" && !splitPayment2Received) {
                                    setSplitPayment2Received(splitPayment2Amount);
                                  }
                                }}
                                className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
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
                                  setSplitPayment2Amount(val);
                                  if (splitPayment2Method === "EFECTIVO") {
                                    setSplitPayment2Received(val);
                                  }
                                }}
                                className="w-full pl-6 pr-2.5 py-1.5 bg-white rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                          {splitPayment2Method === "EFECTIVO" ? (
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 block mb-1">Efectivo Recibido:</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={splitPayment2Received}
                                  onChange={(e) => setSplitPayment2Received(e.target.value)}
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
                      </div>

                      {/* Balance y Resumen de Asignación */}
                      <div
                        className={`p-3 rounded-2xl border text-xs flex flex-col gap-1.5 ${
                          isSplitBalanced
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
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

                  {/* Botón de Confirmación */}
                  <button
                    type="button"
                    onClick={handleProcessCashierCheckout}
                    disabled={isProcessingCheckout || (isSplitPayment && !isSplitBalanced)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 shrink-0"
                  >
                    {isProcessingCheckout ? (
                      <span>Procesando cobro...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>CONFIRMAR COBRO Y ENTREGAR PRENDAS</span>
                      </>
                    )}
                  </button>
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
                <h3 className="text-xl font-black text-slate-900">¡Cobro Completado con Éxito!</h3>
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
                  <span className="text-slate-500">Total Abonado:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(completedSaleResult.totalNet)}
                  </span>
                </div>
                {completedSaleResult.payments && completedSaleResult.payments.length > 0 && (
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
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ticket</span>
                </button>
                <button
                  onClick={() => setCompletedSaleResult(null)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
                <span className="text-xs font-semibold text-slate-400">Ventas POS</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Preventa Salón
                </h1>
                <span className="hidden sm:inline-flex bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300/50">
                  Notebook Salón 1
                </span>
              </div>
            </div>

            {/* Subview Pill & Cashier Link */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onNavigateSubView?.("cobrar")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs transition-all"
              >
                <Store className="w-3.5 h-3.5 text-amber-700" />
                <span>Cobrar en Caja</span>
                {pendingSales.length > 0 && (
                  <span className="ml-1 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {pendingSales.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => onNavigateSubView?.("historial")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all"
              >
                <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                <span>Historial POS</span>
              </button>
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
                        Todas las Categorías ({disciplineOptions.length})
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
          </div>
        </header>

        {/* Product Catalog Grid / List */}
        <main className="p-4 sm:p-6">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 max-w-md mx-auto my-12">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No se encontraron productos</h3>
              <p className="text-xs text-slate-500 mt-1">
                Intenta con otro término de búsqueda o limpia los filtros.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDiscipline("Todas");
                }}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : viewLayout === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4">
              {paginatedProducts.map((product) => {
                const totalSalonStock = product.variants.reduce(
                  (acc, v) => acc + (v.stockStore || 0),
                  0
                );
                const totalReservedStock = product.variants.reduce(
                  (acc, v) => acc + (v.stockReserved || 0),
                  0
                );
                const availableSalonStock = Math.max(0, totalSalonStock - totalReservedStock);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-3.5 sm:p-4 flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          {product.brand} • {product.category || product.discipline}
                        </span>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            availableSalonStock > 0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : "bg-rose-50 text-rose-700 border-rose-200/60"
                          }`}
                        >
                          {availableSalonStock > 0
                            ? `${availableSalonStock} en salón`
                            : "Sin stock"}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug line-clamp-2">
                        {product.name}
                      </h3>

                      {/* SKU & Price */}
                      <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100">
                        <span className="text-[11px] font-mono text-slate-400">
                          SKU: {product.modelCode || product.sku}
                        </span>
                        <span className="text-base font-black text-slate-900 font-mono">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                    </div>

                    {/* Variant Size Chips (Direct Add to Cart) */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Tocar talle para agregar:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 sm:max-h-28 overflow-y-auto pr-0.5 no-scrollbar">
                        {product.variants.map((v) => {
                          const vAvail = Math.max(
                            0,
                            v.stockStore - (v.stockReserved || 0)
                          );
                          const isOutOfStock = vAvail <= 0;

                          // Cuántos ya hay en carrito de esta variante
                          const inCart = cart.find((i) => i.variantId === v.id);
                          const inCartQty = inCart ? inCart.quantity : 0;

                          return (
                            <button
                              key={v.id || `${v.size}-${v.color}`}
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => handleAddVariantToCart(product, v)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 ${
                                isOutOfStock
                                  ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                                  : inCartQty > 0
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 active:scale-95"
                              }`}
                            >
                              <span>{v.size}</span>
                              <span
                                className={`text-[10px] font-medium opacity-80 ${
                                  inCartQty > 0 ? "text-emerald-100" : "text-slate-400"
                                }`}
                              >
                                ({vAvail})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Vista de Lista Compacta */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {paginatedProducts.map((product) => {
                const totalSalon = product.variants.reduce(
                  (acc, v) => acc + (v.stockStore || 0),
                  0
                );
                return (
                  <div
                    key={product.id}
                    className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {product.brand} • {product.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{product.name}</h4>
                      <span className="text-xs font-mono text-slate-400 block">
                        SKU: {product.modelCode || product.sku}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {formatCurrency(product.price)}
                      </span>

                      <div className="flex flex-wrap gap-1">
                        {product.variants.map((v) => {
                          const vAvail = Math.max(
                            0,
                            v.stockStore - (v.stockReserved || 0)
                          );
                          const disabled = vAvail <= 0;
                          return (
                            <button
                              key={v.id}
                              disabled={disabled}
                              onClick={() => handleAddVariantToCart(product, v)}
                              className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                                disabled
                                  ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed"
                                  : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 active:scale-95"
                              }`}
                            >
                              {v.size} ({vAvail})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <span>Vendedor: Lucas • Saavedra 241</span>
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
      {discountModalConfig && (
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
                className="text-slate-400 hover:text-slate-600"
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
                  onClick={() =>
                    setDiscountModalConfig({
                      ...discountModalConfig,
                      currentType: "PERCENTAGE",
                    })
                  }
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    discountModalConfig.currentType === "PERCENTAGE"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Porcentaje (%)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDiscountModalConfig({
                      ...discountModalConfig,
                      currentType: "FIXED",
                    })
                  }
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    discountModalConfig.currentType === "FIXED"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Monto Fijo ($ ARS)</span>
                </button>
              </div>

              {/* Input de Valor */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {discountModalConfig.currentType === "PERCENTAGE"
                    ? "Porcentaje de descuento (0 a 100%):"
                    : "Monto en pesos a descontar:"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    {discountModalConfig.currentType === "PERCENTAGE" ? "%" : "$"}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={discountModalConfig.currentType === "PERCENTAGE" ? "100" : undefined}
                    value={discountModalConfig.currentValue || ""}
                    onChange={(e) =>
                      setDiscountModalConfig({
                        ...discountModalConfig,
                        currentValue: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Botones Preset Rápidos */}
              {discountModalConfig.currentType === "PERCENTAGE" ? (
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
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 rounded-lg text-xs font-bold text-slate-700 border border-slate-200 transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {[1000, 2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() =>
                        setDiscountModalConfig({
                          ...discountModalConfig,
                          currentValue: amt,
                        })
                      }
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 rounded-lg text-xs font-bold text-slate-700 border border-slate-200 transition-colors font-mono"
                    >
                      ${amt / 1000}k
                    </button>
                  ))}
                </div>
              )}

              {/* Preview del descuento */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Precio base:</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(discountModalConfig.originalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Descuento estimado:</span>
                  <span className="font-mono">
                    -{" "}
                    {formatCurrency(
                      discountModalConfig.currentType === "PERCENTAGE"
                        ? (discountModalConfig.originalAmount *
                            Math.min(100, discountModalConfig.currentValue)) /
                            100
                        : Math.min(
                            discountModalConfig.originalAmount,
                            discountModalConfig.currentValue
                          )
                    )}
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
                  onClick={() =>
                    handleApplyDiscount(
                      discountModalConfig.currentType,
                      discountModalConfig.currentValue,
                      discountModalConfig.isGlobal,
                      discountModalConfig.targetRowId
                    )
                  }
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Aplicar Descuento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                onClick={() => setPreventaSuccessData(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulación de Ticket Térmico ESC/POS 80mm */}
            <div className="p-6 space-y-4">
              <div className="bg-[#fffdfa] border border-amber-200/80 rounded-2xl p-5 shadow-xs font-mono text-xs text-slate-800 space-y-3">
                {/* Logo & Header */}
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <h4 className="font-black text-base text-slate-900 tracking-tighter">
                    MATACOS DEPORTES
                  </h4>
                  <p className="text-[10px] text-slate-500">Saavedra 241, Formosa</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                    TICKET DE PREVENTA SALÓN
                  </p>
                </div>

                {/* Ticket Number & Customer */}
                <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-200/60">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase">
                    Número de Ticket para Caja
                  </span>
                  <span className="text-3xl font-black text-slate-950 font-mono tracking-widest">
                    {preventaSuccessData.ticketCode}
                  </span>
                </div>

                {/* Info Clientes */}
                <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cliente:</span>
                    <span className="font-bold">{preventaSuccessData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vendedor:</span>
                    <span>Lucas (Salón 1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha:</span>
                    <span>{formatDate(new Date())}</span>
                  </div>
                </div>

                {/* Ítems */}
                <div className="space-y-1 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                  {preventaSuccessData.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate max-w-[200px]">
                        {it.quantity}x {it.name} ({it.size})
                      </span>
                      <span className="font-bold">
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

                {/* Código de barras del Ticket */}
                <div className="pt-2 flex flex-col items-center justify-center">
                  <BarcodeSvg
                    value={preventaSuccessData.ticketCode.replace("#", "PRE-")}
                    width={180}
                    height={40}
                  />
                  <p className="text-[9px] text-slate-400 mt-1">
                    Dirija al cliente a la Caja Mostrador con este ticket
                  </p>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreventaSuccessData(null)}
                  className="flex-1 py-3 bg-[#00D615] hover:bg-[#00be13] text-slate-950 font-black rounded-xl text-xs transition-colors"
                >
                  Nueva Preventa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TOAST FLOTANTE                                               */}
      {/* ============================================================ */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
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
    </div>
  );
}
