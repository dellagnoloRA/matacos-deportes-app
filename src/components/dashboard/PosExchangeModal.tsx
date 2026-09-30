"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  ArrowLeftRight,
  Search,
  Check,
  AlertCircle,
  Package,
  RotateCcw,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Palette,
  Ruler,
  Store,
  DollarSign,
  CreditCard,
  QrCode,
  Ticket,
  AlertTriangle,
  Receipt,
  HelpCircle,
} from "lucide-react";
import { DetailedProductItem, ProductVariantItem } from "./types";
import { processPosProductExchange } from "@/server/actions/posSaleActions";
import { formatCurrency } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";

interface PosExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: DetailedProductItem[];
  cashShiftId?: string | null;
  cashierId?: string | null;
  onExchangeSuccess?: (message: string, extraData?: unknown) => void;
}

const COMMON_REASONS = [
  "Talle chico",
  "Talle grande",
  "Preferencia de color",
  "Cambio por regalo",
  "Falla de fábrica / defecto",
];

export function PosExchangeModal({
  isOpen,
  onClose,
  products,
  cashShiftId,
  cashierId,
  onExchangeSuccess,
}: PosExchangeModalProps) {
  // -------------------------------------------------------------
  // ESTADOS - PASO 1: PRENDA DEVUELTA
  // -------------------------------------------------------------
  const [returnSearch, setReturnSearch] = useState("");
  const [selectedReturnProduct, setSelectedReturnProduct] = useState<DetailedProductItem | null>(null);
  const [selectedReturnVariant, setSelectedReturnVariant] = useState<ProductVariantItem | null>(null);

  // Filtros facetados para variantes de la prenda devuelta
  const [returnVariantSearch, setReturnVariantSearch] = useState("");
  const [returnColorFilter, setReturnColorFilter] = useState("ALL");
  const [returnSizeFilter, setReturnSizeFilter] = useState("ALL");

  // -------------------------------------------------------------
  // ESTADOS - PASO 2: PRENDA A ENTREGAR
  // -------------------------------------------------------------
  const [isDifferentProduct, setIsDifferentProduct] = useState(false);
  const [exchangeSearch, setExchangeSearch] = useState("");
  const [selectedExchangeProduct, setSelectedExchangeProduct] = useState<DetailedProductItem | null>(null);
  const [selectedExchangeVariant, setSelectedExchangeVariant] = useState<ProductVariantItem | null>(null);

  // Filtros facetados para variantes de la prenda a entregar
  const [exchangeVariantSearch, setExchangeVariantSearch] = useState("");
  const [exchangeColorFilter, setExchangeColorFilter] = useState("ALL");
  const [exchangeSizeFilter, setExchangeSizeFilter] = useState("ALL");
  const [exchangeStockFilter, setExchangeStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");

  // -------------------------------------------------------------
  // ESTADOS - CANTIDAD Y MOTIVO
  // -------------------------------------------------------------
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("Talle chico");
  const [customReason, setCustomReason] = useState("");

  // -------------------------------------------------------------
  // ESTADOS - PASO 3: LIQUIDACIÓN ECONÓMICA Y MEDIOS DE PAGO
  // -------------------------------------------------------------
  // Escenario B: Cobro de diferencia
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [cardBrand, setCardBrand] = useState("VISA");
  const [cardVoucher, setCardVoucher] = useState("");
  const [installments, setInstallments] = useState(1);
  const [referenceCode, setReferenceCode] = useState("");

  // Escenario C: Saldo a favor del cliente
  const [resolutionType, setResolutionType] = useState<"STORE_CREDIT_VOUCHER" | "CASH_REFUND">("STORE_CREDIT_VOUCHER");
  const [customerName, setCustomerName] = useState("");
  const [customerDni, setCustomerDni] = useState("");
  const [showCashRefundConfirm, setShowCashRefundConfirm] = useState(false);

  // Estado de envío y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // BÚSQUEDA INTELIGENTE DE PRODUCTOS (CON AUTO-DETECCIÓN DE VARIANTE POR PISTOLA USB)
  // -------------------------------------------------------------
  const handleReturnSearchChange = (val: string) => {
    setReturnSearch(val);
    const q = val.trim();
    if (!q) return;

    // Si el usuario escanea un código de barras exacto de variante con pistola USB:
    for (const prod of products) {
      const matchedVariant = prod.variants.find(
        (v) => v.barcode && v.barcode.toLowerCase() === q.toLowerCase()
      );
      if (matchedVariant) {
        setSelectedReturnProduct(prod);
        setSelectedReturnVariant(matchedVariant);
        setReturnSearch("");
        return;
      }
    }
  };

  const returnSearchResults = useMemo(() => {
    const q = returnSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        const matchesVariant = p.variants.some(
          (v) =>
            v.barcode?.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q) ||
            v.color?.toLowerCase().includes(q) ||
            v.size.toLowerCase().includes(q)
        );
        return matchesName || matchesBrand || matchesSku || matchesBarcode || matchesVariant;
      })
      .slice(0, 8);
  }, [products, returnSearch]);

  const handleExchangeSearchChange = (val: string) => {
    setExchangeSearch(val);
    const q = val.trim();
    if (!q) return;

    // Si el usuario escanea un código de barras exacto de variante con pistola USB:
    for (const prod of products) {
      const matchedVariant = prod.variants.find(
        (v) => v.barcode && v.barcode.toLowerCase() === q.toLowerCase()
      );
      if (matchedVariant) {
        setSelectedExchangeProduct(prod);
        setSelectedExchangeVariant(matchedVariant);
        setExchangeSearch("");
        return;
      }
    }
  };

  const exchangeSearchResults = useMemo(() => {
    if (!isDifferentProduct) return [];
    const q = exchangeSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.toLowerCase().includes(q);
        return matchesName || matchesBrand || matchesSku || matchesBarcode;
      })
      .slice(0, 8);
  }, [products, exchangeSearch, isDifferentProduct]);

  // Si no es un producto diferente, el modelo a entregar es el mismo que el devuelto
  const targetExchangeProduct = isDifferentProduct ? selectedExchangeProduct : selectedReturnProduct;

  // -------------------------------------------------------------
  // FILTROS FACETADOS DE VARIANTES - PRENDA DEVUELTA
  // -------------------------------------------------------------
  const returnAvailableColors = useMemo(() => {
    if (!selectedReturnProduct) return [];
    const map = new Map<string, number>();
    selectedReturnProduct.variants.forEach((v) => {
      const c = (v.color || "").trim();
      if (c) map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).map(([color, count]) => ({ color, count }));
  }, [selectedReturnProduct]);

  const returnAvailableSizes = useMemo(() => {
    if (!selectedReturnProduct) return [];
    const map = new Map<string, number>();
    selectedReturnProduct.variants.forEach((v) => {
      const s = (v.size || "").trim();
      if (s) map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([size, count]) => ({ size, count }));
  }, [selectedReturnProduct]);

  const filteredReturnVariants = useMemo(() => {
    if (!selectedReturnProduct) return [];
    return selectedReturnProduct.variants.filter((v) => {
      if (returnColorFilter !== "ALL" && (v.color || "").trim().toLowerCase() !== returnColorFilter.toLowerCase()) {
        return false;
      }
      if (returnSizeFilter !== "ALL" && (v.size || "").trim().toLowerCase() !== returnSizeFilter.toLowerCase()) {
        return false;
      }
      if (returnVariantSearch.trim() !== "") {
        const q = returnVariantSearch.trim().toLowerCase();
        const matchesSize = v.size.toLowerCase().includes(q);
        const matchesColor = (v.color || "").toLowerCase().includes(q);
        const matchesBarcode = (v.barcode || "").toLowerCase().includes(q);
        const matchesSku = (v.sku || "").toLowerCase().includes(q);
        if (!matchesSize && !matchesColor && !matchesBarcode && !matchesSku) return false;
      }
      return true;
    });
  }, [selectedReturnProduct, returnColorFilter, returnSizeFilter, returnVariantSearch]);

  // -------------------------------------------------------------
  // FILTROS FACETADOS DE VARIANTES - PRENDA A ENTREGAR
  // -------------------------------------------------------------
  const exchangeAvailableColors = useMemo(() => {
    if (!targetExchangeProduct) return [];
    const map = new Map<string, number>();
    targetExchangeProduct.variants.forEach((v) => {
      const c = (v.color || "").trim();
      if (c) map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries()).map(([color, count]) => ({ color, count }));
  }, [targetExchangeProduct]);

  const exchangeAvailableSizes = useMemo(() => {
    if (!targetExchangeProduct) return [];
    const map = new Map<string, number>();
    targetExchangeProduct.variants.forEach((v) => {
      const s = (v.size || "").trim();
      if (s) map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([size, count]) => ({ size, count }));
  }, [targetExchangeProduct]);

  const filteredExchangeVariants = useMemo(() => {
    if (!targetExchangeProduct) return [];
    return targetExchangeProduct.variants.filter((v) => {
      if (exchangeColorFilter !== "ALL" && (v.color || "").trim().toLowerCase() !== exchangeColorFilter.toLowerCase()) {
        return false;
      }
      if (exchangeSizeFilter !== "ALL" && (v.size || "").trim().toLowerCase() !== exchangeSizeFilter.toLowerCase()) {
        return false;
      }
      if (exchangeStockFilter === "IN_STOCK" && v.stockStore <= 0) {
        return false;
      }
      if (exchangeStockFilter === "OUT_OF_STOCK" && v.stockStore > 0) {
        return false;
      }
      if (exchangeVariantSearch.trim() !== "") {
        const q = exchangeVariantSearch.trim().toLowerCase();
        const matchesSize = v.size.toLowerCase().includes(q);
        const matchesColor = (v.color || "").toLowerCase().includes(q);
        const matchesBarcode = (v.barcode || "").toLowerCase().includes(q);
        const matchesSku = (v.sku || "").toLowerCase().includes(q);
        if (!matchesSize && !matchesColor && !matchesBarcode && !matchesSku) return false;
      }
      return true;
    });
  }, [targetExchangeProduct, exchangeColorFilter, exchangeSizeFilter, exchangeStockFilter, exchangeVariantSearch]);

  // -------------------------------------------------------------
  // CÁLCULO EN TIEMPO REAL DE PRECIOS Y BALANCE ECONÓMICO
  // -------------------------------------------------------------
  const returnUnitPrice = useMemo(() => {
    if (!selectedReturnVariant || !selectedReturnProduct) return 0;
    const vPrice = selectedReturnVariant.price !== null && selectedReturnVariant.price !== undefined
      ? Number(selectedReturnVariant.price)
      : null;
    return vPrice !== null && vPrice > 0 ? vPrice : Number(selectedReturnProduct.price);
  }, [selectedReturnVariant, selectedReturnProduct]);

  const exchangeUnitPrice = useMemo(() => {
    if (!selectedExchangeVariant || !targetExchangeProduct) return 0;
    const vPrice = selectedExchangeVariant.price !== null && selectedExchangeVariant.price !== undefined
      ? Number(selectedExchangeVariant.price)
      : null;
    return vPrice !== null && vPrice > 0 ? vPrice : Number(targetExchangeProduct.price);
  }, [selectedExchangeVariant, targetExchangeProduct]);

  const totalReturn = returnUnitPrice * quantity;
  const totalExchange = exchangeUnitPrice * quantity;
  const balance = totalExchange - totalReturn;

  const isSamePrice = Math.abs(balance) < 0.01;
  const isMoreExpensive = balance > 0.01;
  const isCheaper = balance < -0.01;
  const absDifference = Math.abs(balance);

  // Vuelto en efectivo para Escenario B
  const cashChange = useMemo(() => {
    if (paymentMethod !== "EFECTIVO" || !isMoreExpensive) return 0;
    const received = parseFloat(receivedAmount) || 0;
    return Math.max(0, received - balance);
  }, [paymentMethod, isMoreExpensive, receivedAmount, balance]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleSelectReturnProduct = (product: DetailedProductItem) => {
    setSelectedReturnProduct(product);
    setSelectedReturnVariant(null);
    setSelectedExchangeVariant(null);
    setReturnSearch("");
    setReturnVariantSearch("");
    setReturnColorFilter("ALL");
    setReturnSizeFilter("ALL");
  };

  const handleSelectReturnVariant = (variant: ProductVariantItem) => {
    setSelectedReturnVariant(variant);
    setSelectedExchangeVariant(null);
    setErrorMessage(null);
  };

  const handleSelectExchangeVariant = (variant: ProductVariantItem) => {
    setSelectedExchangeVariant(variant);
    setErrorMessage(null);
  };

  const resetForm = () => {
    setSelectedReturnProduct(null);
    setSelectedReturnVariant(null);
    setIsDifferentProduct(false);
    setSelectedExchangeProduct(null);
    setSelectedExchangeVariant(null);
    setReturnSearch("");
    setExchangeSearch("");
    setReturnVariantSearch("");
    setReturnColorFilter("ALL");
    setReturnSizeFilter("ALL");
    setExchangeVariantSearch("");
    setExchangeColorFilter("ALL");
    setExchangeSizeFilter("ALL");
    setExchangeStockFilter("ALL");
    setQuantity(1);
    setReason("Talle chico");
    setCustomReason("");
    setPaymentMethod("EFECTIVO");
    setReceivedAmount("");
    setCardBrand("VISA");
    setCardVoucher("");
    setInstallments(1);
    setReferenceCode("");
    setResolutionType("STORE_CREDIT_VOUCHER");
    setCustomerName("");
    setCustomerDni("");
    setShowCashRefundConfirm(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // -------------------------------------------------------------
  // ENVÍO DEL FORMULARIO CON PROCESAMIENTO ATÓMICO EN SERVIDOR
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedReturnVariant?.id) {
      setErrorMessage("Por favor selecciona la prenda a devolver.");
      return;
    }
    if (!selectedExchangeVariant?.id) {
      setErrorMessage("Por favor selecciona el nuevo talle o prenda a entregar.");
      return;
    }
    if (selectedReturnVariant.id === selectedExchangeVariant.id) {
      setErrorMessage("La prenda devuelta y la prenda a entregar no pueden ser el mismo talle y color.");
      return;
    }

    const availableStock = selectedExchangeVariant.stockStore;
    if (availableStock < quantity) {
      setErrorMessage(
        `No hay suficiente stock en Salón Saavedra para entregar el Talle ${selectedExchangeVariant.size}. Disponible: ${availableStock} un., Solicitado: ${quantity} un.`
      );
      return;
    }

    const finalReason = reason === "Otro" ? customReason.trim() : reason;
    if (!finalReason) {
      setErrorMessage("Debes especificar un motivo para el cambio.");
      return;
    }

    // Validaciones de liquidación económica
    if (isMoreExpensive) {
      if (paymentMethod === "EFECTIVO") {
        const received = parseFloat(receivedAmount) || 0;
        if (received < balance - 0.05) {
          setErrorMessage(`El monto recibido ($ ${received.toFixed(2)}) es menor a la diferencia a cobrar ($ ${balance.toFixed(2)}).`);
          return;
        }
      }
    }

    if (isCheaper && resolutionType === "CASH_REFUND" && !showCashRefundConfirm) {
      setErrorMessage("Por favor confirma la autorización de reintegro en efectivo de la caja registradora.");
      return;
    }

    setIsSubmitting(true);
    try {
      const settlementType = isSamePrice
        ? "EQUAL"
        : isMoreExpensive
        ? "PAY_DIFFERENCE"
        : resolutionType;

      const res = await processPosProductExchange({
        returnVariantId: selectedReturnVariant.id,
        exchangeVariantId: selectedExchangeVariant.id,
        quantity,
        reason: finalReason,
        settlementType,
        differenceAmount: balance,
        paymentMethod: isMoreExpensive ? paymentMethod : undefined,
        receivedAmount: isMoreExpensive && paymentMethod === "EFECTIVO" ? (parseFloat(receivedAmount) || balance) : undefined,
        change: isMoreExpensive && paymentMethod === "EFECTIVO" ? cashChange : undefined,
        cardBrand: isMoreExpensive ? cardBrand : undefined,
        cardVoucher: isMoreExpensive ? cardVoucher : undefined,
        installments: isMoreExpensive ? installments : undefined,
        referenceCode: isMoreExpensive ? referenceCode : undefined,
        customerName: isCheaper ? customerName : undefined,
        customerDni: isCheaper ? customerDni : undefined,
        cashShiftId,
        cashierId,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Ocurrió un error al procesar el cambio.");
        return;
      }

      onExchangeSuccess?.(res.message || "Cambio procesado exitosamente.", res);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al conectar con el servidor.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[500px] max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Encabezado */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Devolución / Cambio de Productos
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
                  Salón Saavedra 241
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Intercambio de prendas con liquidación económica (mismo valor, mayor valor o vales de compra)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Visual de Progreso */}
        <div className="bg-slate-100/90 px-6 py-2.5 border-b border-slate-200/80 grid grid-cols-3 gap-2 shrink-0 select-none">
          <div className={`flex items-center gap-2 text-xs font-bold ${selectedReturnVariant ? "text-emerald-700" : "text-slate-900"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${selectedReturnVariant ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}`}>
              {selectedReturnVariant ? <Check className="w-3 h-3 stroke-[3]" /> : "1"}
            </span>
            <span className="truncate">Prenda Devuelta</span>
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold ${selectedExchangeVariant ? "text-emerald-700" : selectedReturnVariant ? "text-slate-900" : "text-slate-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${selectedExchangeVariant ? "bg-emerald-600 text-white" : selectedReturnVariant ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
              {selectedExchangeVariant ? <Check className="w-3 h-3 stroke-[3]" /> : "2"}
            </span>
            <span className="truncate">Prenda a Entregar</span>
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold ${selectedReturnVariant && selectedExchangeVariant ? "text-slate-900" : "text-slate-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${selectedReturnVariant && selectedExchangeVariant ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
              3
            </span>
            <span className="truncate">Liquidación</span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

          {/* ========================================================= */}
          {/* PASO 1: PRENDA DEVUELTA */}
          {/* ========================================================= */}
          <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-rose-600" />
                  Prenda que el cliente devuelve (Reingreso a Salón)
                </h4>
              </div>
              {selectedReturnProduct && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReturnProduct(null);
                    setSelectedReturnVariant(null);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                >
                  Cambiar producto
                </button>
              )}
            </div>

            {!selectedReturnProduct ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={returnSearch}
                    onChange={(e) => handleReturnSearchChange(e.target.value)}
                    placeholder="Escanear código de barras de la prenda (USB) o buscar por nombre / SKU..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                    autoFocus
                  />
                </div>

                {returnSearchResults.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                    {returnSearchResults.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectReturnProduct(prod)}
                        className="w-full p-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between transition-colors text-xs cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{prod.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {prod.brand} • SKU: {prod.sku} • {prod.variants.length} variantes
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(prod.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Producto Seleccionado</span>
                    <h5 className="text-sm font-bold text-slate-900">{selectedReturnProduct.name}</h5>
                    <p className="text-xs text-slate-500">
                      {selectedReturnProduct.brand} • SKU: {selectedReturnProduct.sku}
                    </p>
                  </div>
                  <span className="text-sm font-black font-mono text-slate-900">
                    {formatCurrency(selectedReturnProduct.price)}
                  </span>
                </div>

                {/* Buscador y Filtros Facetados de Variantes (igual a Editar Producto) */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Búsqueda rápida de variante */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={returnVariantSearch}
                        onChange={(e) => setReturnVariantSearch(e.target.value)}
                        placeholder="Buscar talle, color, SKU..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Filtro Color */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                      <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        value={returnColorFilter}
                        onChange={(e) => setReturnColorFilter(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                      >
                        <option value="ALL">Color: Todos ({returnAvailableColors.length})</option>
                        {returnAvailableColors.map((c) => (
                          <option key={c.color} value={c.color}>
                            {c.color} ({c.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro Talle */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                      <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        value={returnSizeFilter}
                        onChange={(e) => setReturnSizeFilter(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                      >
                        <option value="ALL">Talle: Todos ({returnAvailableSizes.length})</option>
                        {returnAvailableSizes.map((s) => (
                          <option key={s.size} value={s.size}>
                            Talle {s.size} ({s.count})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Grilla de Variantes para seleccionar la devuelta */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Selecciona el talle / color físico que el cliente trajo para devolver:
                  </label>
                  {filteredReturnVariants.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No hay variantes que coincidan con los filtros de búsqueda.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredReturnVariants.map((v) => {
                        const isSelected = selectedReturnVariant?.id === v.id;
                        const vPrice = v.price ? Number(v.price) : Number(selectedReturnProduct.price);
                        return (
                          <button
                            key={v.id || `${v.size}-${v.color}`}
                            type="button"
                            onClick={() => handleSelectReturnVariant(v)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                              isSelected
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Talle {v.size}</span>
                              {v.color && <span className="opacity-80">({v.color})</span>}
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-[10px] font-mono opacity-75">
                              Valor: {formatCurrency(vPrice)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Guía visual de pasos pendientes cuando aún no se seleccionó la prenda devuelta */}
          {!selectedReturnVariant && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-200">
              <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-200/80 text-slate-500 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                  2
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-700">Prenda a entregar al cliente</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Se habilitará automáticamente tras escanear o seleccionar el producto y variante devuelta arriba.
                  </p>
                </div>
              </div>

              <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/40 flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-200/60 text-slate-400 flex items-center justify-center shrink-0 font-bold text-xs font-mono">
                  3
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-500">Liquidación económica y comprobante</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Cálculo de diferencia (mismo valor, cobro en caja o emisión de vale de compra).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 2: PRENDA A ENTREGAR */}
          {/* ========================================================= */}
          {selectedReturnVariant && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    Nuevo talle o prenda a entregar al cliente (Egreso de Salón)
                  </h4>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={isDifferentProduct}
                    onChange={(e) => {
                      setIsDifferentProduct(e.target.checked);
                      setSelectedExchangeProduct(null);
                      setSelectedExchangeVariant(null);
                      setExchangeVariantSearch("");
                      setExchangeColorFilter("ALL");
                      setExchangeSizeFilter("ALL");
                      setExchangeStockFilter("ALL");
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Cambiar por otro modelo</span>
                </label>
              </div>

              {/* Búsqueda de modelo diferente */}
              {isDifferentProduct && !selectedExchangeProduct && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={exchangeSearch}
                      onChange={(e) => handleExchangeSearchChange(e.target.value)}
                      placeholder="Escanear código de barras USB o buscar modelo a entregar..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>

                  {exchangeSearchResults.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                      {exchangeSearchResults.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => {
                            setSelectedExchangeProduct(prod);
                            setSelectedExchangeVariant(null);
                            setExchangeSearch("");
                            setExchangeVariantSearch("");
                            setExchangeColorFilter("ALL");
                            setExchangeSizeFilter("ALL");
                            setExchangeStockFilter("ALL");
                          }}
                          className="w-full p-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between transition-colors text-xs cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{prod.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {prod.brand} • SKU: {prod.sku} • {prod.variants.length} variantes
                            </p>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(prod.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {targetExchangeProduct && (
                <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  {isDifferentProduct && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400">Modelo a Entregar</span>
                        <h5 className="text-sm font-bold text-slate-900">{targetExchangeProduct.name}</h5>
                        <p className="text-xs text-slate-500">{targetExchangeProduct.brand} • SKU: {targetExchangeProduct.sku}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExchangeProduct(null);
                          setSelectedExchangeVariant(null);
                        }}
                        className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Cambiar modelo
                      </button>
                    </div>
                  )}

                  {/* Barra de Filtros Facetados para Variantes de la prenda a entregar */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      {/* Búsqueda rápida */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={exchangeVariantSearch}
                          onChange={(e) => setExchangeVariantSearch(e.target.value)}
                          placeholder="Buscar talle, color, SKU..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Filtro Color */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={exchangeColorFilter}
                          onChange={(e) => setExchangeColorFilter(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                        >
                          <option value="ALL">Color: Todos ({exchangeAvailableColors.length})</option>
                          {exchangeAvailableColors.map((c) => (
                            <option key={c.color} value={c.color}>
                              {c.color} ({c.count})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtro Talle */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={exchangeSizeFilter}
                          onChange={(e) => setExchangeSizeFilter(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                        >
                          <option value="ALL">Talle: Todos ({exchangeAvailableSizes.length})</option>
                          {exchangeAvailableSizes.map((s) => (
                            <option key={s.size} value={s.size}>
                              Talle {s.size} ({s.count})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filtro Stock Salón */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          value={exchangeStockFilter}
                          onChange={(e) => setExchangeStockFilter(e.target.value as "ALL" | "IN_STOCK" | "OUT_OF_STOCK")}
                          className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer min-w-0"
                        >
                          <option value="ALL">Stock: Todos</option>
                          <option value="IN_STOCK">🟢 Con stock salón (&gt;0)</option>
                          <option value="OUT_OF_STOCK">❌ Sin stock salón (0)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Selección de Variante a entregar */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                      Selecciona la prenda que se lleva el cliente:
                    </label>
                    {filteredExchangeVariants.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No hay variantes que coincidan con los filtros seleccionados.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {filteredExchangeVariants.map((v) => {
                          const isSameAsReturned = v.id === selectedReturnVariant.id;
                          const hasStock = v.stockStore > 0;
                          const isSelected = selectedExchangeVariant?.id === v.id;
                          const isDisabled = isSameAsReturned || !hasStock;
                          const vPrice = v.price ? Number(v.price) : Number(targetExchangeProduct.price);

                          return (
                            <button
                              key={v.id || `${v.size}-${v.color}`}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => handleSelectExchangeVariant(v)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                  : isDisabled
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                                  : "bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Talle {v.size}</span>
                                {v.color && <span className="opacity-80">({v.color})</span>}
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                                <span>
                                  {isSameAsReturned
                                    ? "Prenda devuelta"
                                    : hasStock
                                    ? `Salón: ${v.stockStore} un.`
                                    : "Agotado en salón"}
                                </span>
                                <span className="font-bold">{formatCurrency(vPrice)}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 3: MOTIVO DEL CAMBIO */}
          {/* ========================================================= */}
          {selectedReturnVariant && selectedExchangeVariant && (
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 animate-in fade-in">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center font-mono">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Motivo del cambio
                </h4>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      setCustomReason("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      reason === r
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setReason("Otro")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    reason === "Otro"
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Otro motivo
                </button>
              </div>

              {reason === "Otro" && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Escribí el motivo del cambio..."
                  className="w-full px-3.5 py-2 bg-white text-xs text-slate-900 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  autoFocus
                />
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 4: LIQUIDACIÓN ECONÓMICA (ESCENARIOS A, B Y C) */}
          {/* ========================================================= */}
          {selectedReturnVariant && selectedExchangeVariant && (
            <div className="space-y-3 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                    4
                  </div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Liquidación Económica del Cambio
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {quantity} unidad(es)
                </span>
              </div>

              {/* Comparador de Precios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-center p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Prenda Devuelta</span>
                  <p className="font-bold text-slate-800 truncate">{selectedReturnProduct?.name}</p>
                  <p className="text-rose-700 font-mono font-black text-sm">
                    -{formatCurrency(totalReturn)}
                  </p>
                </div>

                <div className="text-center py-1 sm:border-x border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Prenda Entregada</span>
                  <p className="font-bold text-slate-800 truncate">{targetExchangeProduct?.name}</p>
                  <p className="text-emerald-700 font-mono font-black text-sm">
                    +{formatCurrency(totalExchange)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Neto</span>
                  <p
                    className={`font-mono font-black text-base ${
                      isSamePrice
                        ? "text-slate-700"
                        : isMoreExpensive
                        ? "text-blue-700"
                        : "text-purple-700"
                    }`}
                  >
                    {isSamePrice ? "$ 0,00" : formatCurrency(balance)}
                  </p>
                  <span className="text-[10px] font-bold text-slate-500">
                    {isSamePrice
                      ? "Mismo valor (Mano a mano)"
                      : isMoreExpensive
                      ? "A favor del negocio"
                      : "A favor del cliente"}
                  </span>
                </div>
              </div>

              {/* ESCENARIO A: MISMO VALOR */}
              {isSamePrice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>
                    <strong>Cambio mano a mano:</strong> Las dos prendas tienen el mismo valor de lista. No hay movimiento de dinero en caja.
                  </span>
                </div>
              )}

              {/* ESCENARIO B: PRODUCTO NUEVO MÁS CARO (COBRO DE DIFERENCIA) */}
              {isMoreExpensive && (
                <div className="space-y-3.5 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span>Cobro de Diferencia al Cliente:</span>
                    </div>
                    <span className="text-sm font-black font-mono text-blue-800 bg-blue-100/80 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {formatCurrency(balance)}
                    </span>
                  </div>

                  {/* Selector de Medio de Pago */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {(
                      [
                        { id: "EFECTIVO", label: "Efectivo", icon: DollarSign },
                        { id: "DEBITO", label: "Débito", icon: CreditCard },
                        { id: "CREDITO", label: "Crédito", icon: CreditCard },
                        { id: "TRANSFERENCIA", label: "Transferencia", icon: ArrowLeftRight },
                        { id: "QR_MERCADOPAGO", label: "QR Mercado Pago", icon: QrCode },
                      ] as const
                    ).map((m) => {
                      const Icon = m.icon;
                      const isSelected = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[11px] truncate">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detalle si es Efectivo: cálculo de vuelto */}
                  {paymentMethod === "EFECTIVO" && (
                    <div className="bg-white p-3 rounded-xl border border-blue-200/80 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Monto recibido del cliente:
                          </label>
                          <div className="relative">
                            <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                              $
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={receivedAmount}
                              onChange={(e) => setReceivedAmount(e.target.value)}
                              placeholder={balance.toString()}
                              className="w-full pl-7 pr-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-900 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                            Vuelto a entregar
                          </span>
                          <span className="text-base font-black font-mono text-emerald-800">
                            {formatCurrency(cashChange)}
                          </span>
                        </div>
                      </div>

                      {/* Atajos de billetes rápidos */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Rápido:</span>
                        <button
                          type="button"
                          onClick={() => setReceivedAmount(balance.toString())}
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          Exacto
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReceivedAmount((Math.ceil(balance / 1000) * 1000).toString())
                          }
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          Redondeo $1.000
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReceivedAmount((Math.ceil(balance / 5000) * 5000).toString())
                          }
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          Redondeo $5.000
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Detalle si es Tarjeta */}
                  {(paymentMethod === "DEBITO" || paymentMethod === "CREDITO") && (
                    <div className="bg-white p-3 rounded-xl border border-blue-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Tarjeta:</label>
                        <select
                          value={cardBrand}
                          onChange={(e) => setCardBrand(e.target.value)}
                          className="w-full p-1.5 bg-slate-50 text-xs font-bold rounded-lg border border-slate-200"
                        >
                          <option value="VISA">Visa</option>
                          <option value="MASTERCARD">Mastercard</option>
                          <option value="CABAL">Cabal</option>
                          <option value="AMEX">American Express</option>
                          <option value="OTRA">Otra</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Nº Cupón / Lote:</label>
                        <input
                          type="text"
                          value={cardVoucher}
                          onChange={(e) => setCardVoucher(e.target.value)}
                          placeholder="Ej: 048219"
                          className="w-full p-1.5 bg-slate-50 text-xs font-bold rounded-lg border border-slate-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Cuotas:</label>
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          className="w-full p-1.5 bg-slate-50 text-xs font-bold rounded-lg border border-slate-200"
                        >
                          <option value={1}>1 Cuota</option>
                          <option value={3}>3 Cuotas</option>
                          <option value={6}>6 Cuotas</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Detalle si es Transferencia o QR */}
                  {(paymentMethod === "TRANSFERENCIA" || paymentMethod === "QR_MERCADOPAGO") && (
                    <div className="bg-white p-3 rounded-xl border border-blue-200/80">
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Código de Referencia / Comprobante:
                      </label>
                      <input
                        type="text"
                        value={referenceCode}
                        onChange={(e) => setReferenceCode(e.target.value)}
                        placeholder="Ej: MP-98124801 o Nº Transferencia"
                        className="w-full p-1.5 bg-slate-50 text-xs font-bold rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ESCENARIO C: PRODUCTO NUEVO MÁS BARATO (SALDO A FAVOR DEL CLIENTE) */}
              {isCheaper && (
                <div className="space-y-3.5 p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-950 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Saldo a Favor del Cliente:</span>
                    </div>
                    <span className="text-sm font-black font-mono text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-lg border border-purple-200">
                      {formatCurrency(absDifference)}
                    </span>
                  </div>

                  {/* Selector de Resolución */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionType("STORE_CREDIT_VOUCHER");
                        setShowCashRefundConfirm(false);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        resolutionType === "STORE_CREDIT_VOUCHER"
                          ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Ticket className="w-4 h-4" />
                        <span className="font-bold text-xs">Emitir Vale de Compra</span>
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-extrabold ml-auto">
                          Recomendado
                        </span>
                      </div>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          resolutionType === "STORE_CREDIT_VOUCHER" ? "text-purple-100" : "text-slate-500"
                        }`}
                      >
                        Voucher térmico con código único sin vencimiento. No retira dinero de la caja física.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionType("CASH_REFUND")}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        resolutionType === "CASH_REFUND"
                          ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold text-xs">Reintegrar Efectivo</span>
                        <span className="text-[10px] bg-rose-200/50 text-rose-900 px-1.5 py-0.2 rounded font-extrabold ml-auto">
                          Excepcional
                        </span>
                      </div>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          resolutionType === "CASH_REFUND" ? "text-rose-100" : "text-slate-500"
                        }`}
                      >
                        Entrega dinero físico al cliente. Registra egreso formal en el arqueo del turno.
                      </p>
                    </button>
                  </div>

                  {/* Panel de Datos para Vale de Compra */}
                  {resolutionType === "STORE_CREDIT_VOUCHER" && (
                    <div className="bg-white p-3 rounded-xl border border-purple-200/80 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            Nombre del Cliente (Opcional):
                          </label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Ej. Juan Pérez"
                            className="w-full p-1.5 bg-slate-50 text-xs font-bold rounded-lg border border-slate-200 focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">
                            DNI del Cliente (Opcional):
                          </label>
                          <input
                            type="text"
                            value={customerDni}
                            onChange={(e) => setCustomerDni(e.target.value)}
                            placeholder="Ej. 38192842"
                            className="w-full p-1.5 bg-slate-50 text-xs font-bold rounded-lg border border-slate-200 focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-purple-900 bg-purple-50 p-2 rounded-lg">
                        <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 stroke-[3]" />
                        <span>
                          El vale se imprimirá con código de barras y <strong>sin fecha de vencimiento</strong> para su canje en mostrador.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Panel de Advertencia para Reintegro en Efectivo */}
                  {resolutionType === "CASH_REFUND" && (
                    <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 space-y-2">
                      <div className="flex items-start gap-2.5 text-rose-900 text-xs">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">⚠️ Advertencia de Caja Registradora:</strong>
                          <p className="mt-0.5 leading-relaxed text-rose-800">
                            Estás a punto de retirar dinero en efectivo (<strong>{formatCurrency(absDifference)}</strong>) de la caja registradora de Saavedra 241. Esta operación quedará registrada en el turno actual como egreso y se descontará del arqueo final.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 pt-1 text-xs font-bold text-rose-950 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showCashRefundConfirm}
                          onChange={(e) => setShowCashRefundConfirm(e.target.checked)}
                          className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                        />
                        <span>Confirmo la entrega física de dinero de la caja registradora</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          </div>

          {/* ========================================================= */}
          {/* FOOTER ACTIONS - PINNED TOOLBAR                           */}
          {/* ========================================================= */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 select-none">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedReturnVariant ||
                !selectedExchangeVariant ||
                (isCheaper && resolutionType === "CASH_REFUND" && !showCashRefundConfirm)
              }
              className={`flex-1 py-3 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 ${
                !selectedReturnVariant || !selectedExchangeVariant
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : isMoreExpensive
                  ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                  : isCheaper && resolutionType === "STORE_CREDIT_VOUCHER"
                  ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                  : isCheaper && resolutionType === "CASH_REFUND"
                  ? "bg-rose-700 hover:bg-rose-800 text-white cursor-pointer"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Procesando cambio...</span>
                </>
              ) : !selectedReturnVariant ? (
                <>
                  <Search className="w-4 h-4" />
                  <span>Paso 1: Selecciona la prenda a devolver</span>
                </>
              ) : !selectedExchangeVariant ? (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Paso 2: Selecciona la prenda a entregar</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {isSamePrice
                      ? "Confirmar Cambio de Prenda ($ 0,00)"
                      : isMoreExpensive
                      ? `Cobrar ${formatCurrency(balance)} y Confirmar Cambio`
                      : resolutionType === "STORE_CREDIT_VOUCHER"
                      ? `Emitir Vale por ${formatCurrency(absDifference)} y Confirmar`
                      : `Reintegrar ${formatCurrency(absDifference)} en Efectivo y Confirmar`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
