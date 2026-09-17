"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Banknote,
  CreditCard,
  ArrowRight,
  Calculator,
  Coins,
  Barcode,
  Search,
  Loader2,
  AlertCircle,
  Receipt,
  Store,
  Sparkles,
  Package,
  Check,
  ChevronDown,
  ChevronUp,
  Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { processSale } from "@/server/actions/saleActions";
import { DetailedProductItem, ProductVariantItem } from "./types";

export interface SaleItemRow {
  id: string; // unique row key
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  sku?: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  stockStore: number;
  stockWarehouse: number;
}

export type PaymentMethodType = "EFECTIVO" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";

export interface SplitPaymentItem {
  id: string;
  method: PaymentMethodType;
  amount: number | "";
  receivedCash: number | "";
}

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: DetailedProductItem[];
  onSaleSuccess?: () => void;
  onOpenHistory?: (ticketNumber?: string) => void;
}

interface MatchedVariantInfo {
  variant: ProductVariantItem;
  sizeMatches: boolean;
  colorMatches: boolean;
  isExactMatch: boolean;
}

interface EnrichedSearchResult {
  product: DetailedProductItem;
  variants: MatchedVariantInfo[];
  allColors: string[];
  salonStockTotal: number;
  warehouseStockTotal: number;
  detectedSize: string | null;
  detectedColor: string | null;
}

export function QuickSaleModal({
  isOpen,
  onClose,
  products,
  onSaleSuccess,
  onOpenHistory,
}: QuickSaleModalProps) {
  // Estado del carrito de la venta
  const [cart, setCart] = useState<SaleItemRow[]>([]);

  // Búsqueda inteligente de productos (nombre, marca, SKU, talle o color)
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtro: solo productos con existencias disponibles
  const [onlyInStock, setOnlyInStock] = useState(true);

  // Filtro de color manual por producto: { [productId]: selectedColor }
  const [selectedColorByProduct, setSelectedColorByProduct] = useState<Record<string, string>>({});

  // Despliegue de variantes agotadas por producto: { [productId]: boolean }
  const [expandedOutOfStock, setExpandedOutOfStock] = useState<Record<string, boolean>>({});

  // Estados financieros y de pago (Sin QR: solo Efectivo, Débito, Crédito, Transferencia)
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("EFECTIVO");
  const [receivedCash, setReceivedCash] = useState<number | "">("");
  const receivedCashInputRef = useRef<HTMLInputElement>(null);

  // Modo de cobro dividido (múltiples medios de pago simultáneos)
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPaymentItem[]>([
    { id: "split-1", method: "EFECTIVO", amount: "", receivedCash: "" },
    { id: "split-2", method: "TRANSFERENCIA", amount: "", receivedCash: "" },
  ]);

  // Estados de procesamiento
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado de comprobante completado (Ticket digital en pantalla)
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  // Auto-focus en el buscador al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      setErrorMessage(null);
      setCompletedSale(null);
    } else {
      setCart([]);
      setSearchQuery("");
      setReceivedCash("");
      setDiscount(0);
      setIsSplitPayment(false);
      setSplitPayments([
        { id: "split-1", method: "EFECTIVO", amount: "", receivedCash: "" },
        { id: "split-2", method: "TRANSFERENCIA", amount: "", receivedCash: "" },
      ]);
      setErrorMessage(null);
      setCompletedSale(null);
      setSelectedColorByProduct({});
      setExpandedOutOfStock({});
    }
  }, [isOpen]);

  // =================================================================
  // MOTOR DE BÚSQUEDA INTELIGENTE CON PREDICTOR DE TALLE Y COLOR
  // Y PRIORIZACIÓN DE STOCK EN SALÓN SAAVEDRA 241
  // =================================================================
  const searchResults = useMemo<EnrichedSearchResult[]>(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    if (!rawQuery) return [];

    const tokens = rawQuery.split(/\s+/).filter(Boolean);
    const matchedProducts: EnrichedSearchResult[] = [];

    for (const p of products) {
      if (p.active === false) continue;

      const pVariants = p.variants || [];
      const prodName = (p.name || "").toLowerCase();
      const prodBrand = (p.brand || "").toLowerCase();
      const prodSku = (p.sku || "").toLowerCase();
      const prodModel = (p.modelCode || "").toLowerCase();
      const prodBarcode = (p.barcode || "").toLowerCase();

      // Extraer lista única de colores y talles del producto
      const uniqueColors = Array.from(
        new Set(pVariants.map((v) => v.color?.trim()).filter(Boolean))
      );
      const uniqueSizes = Array.from(
        new Set(pVariants.map((v) => v.size?.trim()).filter(Boolean))
      );

      // Detectar si algún token del usuario coincide con talle o color del producto
      let detectedSize: string | null = null;
      let detectedColor: string | null = null;
      const generalTokens: string[] = [];

      for (const token of tokens) {
        // ¿Coincide con algún talle de este producto?
        const matchedSize = uniqueSizes.find(
          (s) =>
            s.toLowerCase() === token ||
            s.toLowerCase() === token.replace(/talle/i, "").trim()
        );
        if (matchedSize && !detectedSize) {
          detectedSize = matchedSize;
          continue;
        }

        // ¿Coincide con algún color de este producto?
        const matchedColor = uniqueColors.find(
          (c) =>
            c.toLowerCase() === token ||
            c.toLowerCase().includes(token) ||
            token.includes(c.toLowerCase())
        );
        if (matchedColor && !detectedColor) {
          detectedColor = matchedColor;
          continue;
        }

        // Token general (nombre de prenda, marca, SKU, etc.)
        generalTokens.push(token);
      }

      // Validar si los tokens generales coinciden con la información del producto
      const matchesGeneral =
        generalTokens.length === 0 ||
        generalTokens.every(
          (gt) =>
            prodName.includes(gt) ||
            prodBrand.includes(gt) ||
            prodSku.includes(gt) ||
            prodModel.includes(gt) ||
            prodBarcode.includes(gt) ||
            pVariants.some(
              (v) =>
                (v.barcode && v.barcode.toLowerCase().includes(gt)) ||
                (v.sku && v.sku.toLowerCase().includes(gt))
            )
        );

      if (!matchesGeneral && generalTokens.length > 0) {
        continue;
      }

      // Evaluar cada variante del producto
      const enrichedVariants: MatchedVariantInfo[] = pVariants.map((v) => {
        const vSize = (v.size || "").toLowerCase().trim();
        const vColor = (v.color || "").toLowerCase().trim();

        const sizeMatches = detectedSize
          ? vSize === detectedSize.toLowerCase().trim()
          : true;

        const colorMatches = detectedColor
          ? vColor.includes(detectedColor.toLowerCase().trim()) ||
            detectedColor.toLowerCase().trim().includes(vColor)
          : true;

        const isExactMatch =
          Boolean(detectedSize && sizeMatches) &&
          Boolean(detectedColor ? colorMatches : true);

        return {
          variant: v,
          sizeMatches,
          colorMatches,
          isExactMatch,
        };
      });

      // Si el usuario tipeó talle o color, filtramos a las variantes que coinciden
      let relevantVariants = enrichedVariants;
      if (detectedSize || detectedColor) {
        const strictlyMatched = enrichedVariants.filter(
          (ev) =>
            (detectedSize ? ev.sizeMatches : true) &&
            (detectedColor ? ev.colorMatches : true)
        );
        if (strictlyMatched.length > 0) {
          relevantVariants = strictlyMatched;
        }
      }

      // Ordenar las variantes:
      // 1° Coincidencias exactas de búsqueda
      // 2° Stock en Salón Saavedra 241 (>0)
      // 3° Stock en Depósito Central (>0)
      // 4° Agotados (0)
      relevantVariants.sort((a, b) => {
        if (a.isExactMatch && !b.isExactMatch) return -1;
        if (!a.isExactMatch && b.isExactMatch) return 1;

        if (a.variant.stockStore > 0 && b.variant.stockStore <= 0) return -1;
        if (a.variant.stockStore <= 0 && b.variant.stockStore > 0) return 1;

        const totalA = a.variant.stockStore + a.variant.stockWarehouse;
        const totalB = b.variant.stockStore + b.variant.stockWarehouse;
        if (totalA > 0 && totalB <= 0) return -1;
        if (totalA <= 0 && totalB > 0) return 1;

        return a.variant.size.localeCompare(b.variant.size, undefined, { numeric: true });
      });

      const salonStockTotal = pVariants.reduce((sum, v) => sum + (v.stockStore || 0), 0);
      const warehouseStockTotal = pVariants.reduce((sum, v) => sum + (v.stockWarehouse || 0), 0);

      // Si el filtro "Solo con existencias" está activo, descartar productos sin ninguna unidad
      if (onlyInStock && salonStockTotal + warehouseStockTotal <= 0) {
        continue;
      }

      matchedProducts.push({
        product: p,
        variants: relevantVariants,
        allColors: uniqueColors,
        salonStockTotal,
        warehouseStockTotal,
        detectedSize,
        detectedColor,
      });
    }

    // Ordenar productos: primero aquellos que tienen stock en Salón Saavedra 241
    matchedProducts.sort((a, b) => {
      if (a.salonStockTotal > 0 && b.salonStockTotal <= 0) return -1;
      if (a.salonStockTotal <= 0 && b.salonStockTotal > 0) return 1;

      const totalA = a.salonStockTotal + a.warehouseStockTotal;
      const totalB = b.salonStockTotal + b.warehouseStockTotal;
      if (totalA > 0 && totalB <= 0) return -1;
      if (totalA <= 0 && totalB > 0) return 1;

      return a.product.name.localeCompare(b.product.name);
    });

    return matchedProducts.slice(0, 6);
  }, [searchQuery, products, onlyInStock]);

  // Manejador para agregar una variante al carrito
  const handleAddVariant = (
    product: DetailedProductItem,
    variant: ProductVariantItem
  ) => {
    if (!variant.id) return;

    const totalAvailable = variant.stockStore + variant.stockWarehouse;
    if (totalAvailable <= 0) {
      setErrorMessage(
        `Sin existencias para "${product.name}" (Talle ${variant.size}).`
      );
      return;
    }

    setErrorMessage(null);
    const existing = cart.find((item) => item.variantId === variant.id);

    if (existing) {
      if (existing.quantity >= totalAvailable) {
        setErrorMessage(
          `Stock máximo alcanzado para Talle ${variant.size} (Disponible: ${totalAvailable} un.).`
        );
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newRow: SaleItemRow = {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        brand: product.brand,
        sku: variant.sku || product.sku,
        size: variant.size,
        color: variant.color,
        price: variant.price ?? product.price,
        quantity: 1,
        stockStore: variant.stockStore,
        stockWarehouse: variant.stockWarehouse,
      };
      setCart((prev) => [...prev, newRow]);
    }

    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  // Detección automática al presionar Enter en el buscador:
  // Si escanea código de barras o si el filtro arroja una sola variante con stock, la añade en 1 paso
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      const clean = searchQuery.trim().toLowerCase();

      // 1. Coincidencia directa con código de barras USB
      for (const p of products) {
        if (p.variants) {
          const matchedVariant = p.variants.find(
            (v) => v.barcode && v.barcode.toLowerCase() === clean
          );
          if (matchedVariant) {
            handleAddVariant(p, matchedVariant);
            return;
          }
        }
        if (p.barcode && p.barcode.toLowerCase() === clean && p.variants && p.variants.length === 1) {
          handleAddVariant(p, p.variants[0]);
          return;
        }
      }

      // 2. Si el predictor acotó a un único producto con una sola variante disponible con stock
      if (searchResults.length === 1) {
        const singleProd = searchResults[0];
        const inStockVars = singleProd.variants.filter(
          (v) => v.variant.stockStore + v.variant.stockWarehouse > 0
        );
        if (inStockVars.length === 1) {
          handleAddVariant(singleProd.product, inStockVars[0].variant);
        }
      }
    }
  };

  // Modificar cantidad
  const handleUpdateQty = (rowId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === rowId) {
            const totalAvailable = item.stockStore + item.stockWarehouse;
            const nextQty = item.quantity + delta;
            if (nextQty > totalAvailable) {
              setErrorMessage(
                `Stock insuficiente para "${item.name}" Talle ${item.size}. Máximo disponible: ${totalAvailable} un.`
              );
              return item;
            }
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SaleItemRow[]
    );
  };

  // Quitar fila
  const handleRemoveRow = (rowId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== rowId));
  };

  // Cálculos de totales
  const grossTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const netTotal = Math.max(0, grossTotal - discount);
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Cálculo de cubierto en pago dividido
  const totalSplitCovered = useMemo(() => {
    return splitPayments.reduce(
      (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
      0
    );
  }, [splitPayments]);

  const splitDifference = netTotal - totalSplitCovered;

  // Cálculo de vuelto para cobro en efectivo
  const numReceived = typeof receivedCash === "number" ? receivedCash : 0;
  const changeDue = Math.max(0, numReceived - netTotal);

  // Atajos de billetes rápidos
  const handleAddCash = (amount: number) => {
    setReceivedCash((prev) =>
      typeof prev === "number" ? prev + amount : amount
    );
  };

  const handleExactCash = () => {
    setReceivedCash(netTotal);
  };

  // Helper para asignar el saldo restante en pago dividido
  const handleAssignRemaining = (rowId: string) => {
    const otherCovered = splitPayments
      .filter((p) => p.id !== rowId)
      .reduce((sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0), 0);
    const rem = Math.max(0, netTotal - otherCovered);
    setSplitPayments((prev) =>
      prev.map((p) =>
        p.id === rowId
          ? {
              ...p,
              amount: rem,
              receivedCash: p.method === "EFECTIVO" ? rem : p.receivedCash,
            }
          : p
      )
    );
  };

  // =================================================================
  // CONFIRMACIÓN Y EJECUCIÓN ATÓMICA DE LA VENTA EN EL BACKEND
  // =================================================================
  const handleConfirmSale = async () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage("Debes añadir al menos un producto a la venta.");
      return;
    }

    let paymentsPayload: Array<{
      method: PaymentMethodType;
      amount: number;
      receivedAmount?: number;
      change?: number;
    }> = [];

    if (isSplitPayment) {
      // 1. Validar líneas de pago dividido
      if (splitPayments.length === 0) {
        setErrorMessage("Debes configurar al menos un medio de pago.");
        return;
      }

      for (const p of splitPayments) {
        if (p.amount === "" || typeof p.amount !== "number" || p.amount <= 0) {
          setErrorMessage("Todos los medios de pago deben tener un importe mayor a $ 0.");
          return;
        }

        if (p.method === "EFECTIVO") {
          const rec = typeof p.receivedCash === "number" ? p.receivedCash : 0;
          if (p.receivedCash === "" || rec <= 0) {
            setErrorMessage(
              "Para la cuota en efectivo es obligatorio ingresar con cuánto abona el cliente para calcular el vuelto."
            );
            return;
          }
          if (rec < p.amount) {
            setErrorMessage(
              `El efectivo ingresado (${formatCurrency(
                rec
              )}) no cubre la cuota en efectivo asignada (${formatCurrency(p.amount)}).`
            );
            return;
          }
        }
      }

      if (Math.abs(splitDifference) > 0.01) {
        setErrorMessage(
          splitDifference > 0
            ? `Faltan asignar ${formatCurrency(splitDifference)} para cubrir el total de ${formatCurrency(netTotal)}.`
            : `Los montos asignados superan el total a cobrar por ${formatCurrency(-splitDifference)}.`
        );
        return;
      }

      paymentsPayload = splitPayments.map((p) => {
        const amt = Number(p.amount);
        const isCash = p.method === "EFECTIVO";
        const rec = isCash ? Number(p.receivedCash || amt) : amt;
        const chg = isCash ? Math.max(0, rec - amt) : 0;
        return {
          method: p.method,
          amount: amt,
          receivedAmount: rec,
          change: chg,
        };
      });
    } else {
      // 2. Validar pago simple
      if (paymentMethod === "EFECTIVO") {
        if (receivedCash === "" || typeof receivedCash !== "number" || receivedCash <= 0) {
          setErrorMessage(
            "Para ventas en efectivo es obligatorio completar el campo 'Pagó con' para calcular el vuelto y registrar con cuánto se abonó."
          );
          receivedCashInputRef.current?.focus();
          return;
        }

        if (receivedCash < netTotal) {
          const remaining = netTotal - receivedCash;
          setErrorMessage(
            `El monto ingresado en 'Pagó con' (${formatCurrency(
              receivedCash
            )}) no cubre el total a cobrar (${formatCurrency(netTotal)}). Faltan abonar: ${formatCurrency(remaining)}.`
          );
          receivedCashInputRef.current?.focus();
          return;
        }
      }

      paymentsPayload = [
        {
          method: paymentMethod,
          amount: netTotal,
          receivedAmount: paymentMethod === "EFECTIVO" ? numReceived : netTotal,
          change: paymentMethod === "EFECTIVO" ? changeDue : 0,
        },
      ];
    }

    setIsSubmitting(true);

    try {
      const salePayload = {
        channel: "MOSTRADOR",
        discount: Number(discount) || 0,
        items: cart.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        payments: paymentsPayload,
      };

      const res = await processSale(salePayload);

      if (!res.success || !res.data) {
        setErrorMessage(res.error || "No se pudo procesar la venta.");
        setIsSubmitting(false);
        return;
      }

      setCompletedSale(res.data);
      onSaleSuccess?.();
    } catch (err) {
      console.error("Error al procesar la venta de mostrador:", err);
      setErrorMessage("Ocurrió un error inesperado al procesar la venta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150">
        {/* ========================================================= */}
        {/* HEADER DEL MODAL                                          */}
        {/* ========================================================= */}
        <div className="px-5 py-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/40 flex items-center justify-center text-white font-bold shadow-xs">
              <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Registrar Venta de Mostrador
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Multiproducto
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Saavedra 241 — Descuento prioritario de Salón con auditoría de ticket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
                title="Consultar historial de ventas y tickets"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Tickets</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CASO: TICKET DIGITAL COMPLETADO (PANTALLA DE ÉXITO)       */}
        {/* ========================================================= */}
        {completedSale ? (
          <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-slate-50 items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 text-center shadow-xl border border-slate-200 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  ¡Venta Registrada con Éxito!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  El stock fue descontado y se generó el comprobante oficial.
                </p>
              </div>

              {/* Tarjeta del Ticket */}
              <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-4 text-left space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 uppercase font-sans text-[11px] font-bold">
                    Comprobante:
                  </span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {completedSale.invoiceNumber}
                  </span>
                </div>

                {Number(completedSale.discount) > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-rose-600">
                    <span>Descuento aplicado:</span>
                    <span className="font-bold font-mono">
                      -{formatCurrency(Number(completedSale.discount))}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Total cobrado:</span>
                  <span className="font-bold text-slate-900 text-xs font-mono">
                    {formatCurrency(Number(completedSale.total))}
                  </span>
                </div>

                {/* Formas de Pago Registradas */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                    Forma(s) de Cobro:
                  </span>
                  {completedSale.payments?.map((p: any, idx: number) => {
                    const isCash = p.method === "EFECTIVO";
                    const hasCashDetail =
                      isCash && p.receivedAmount != null && Number(p.receivedAmount) > 0;

                    return (
                      <div
                        key={idx}
                        className="bg-slate-100 p-2 rounded-xl border border-slate-200 text-[11px] space-y-1 font-mono"
                      >
                        <div className="flex items-center justify-between text-slate-800">
                          <span className="font-bold font-sans uppercase">{p.method}:</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(Number(p.amount))}
                          </span>
                        </div>
                        {hasCashDetail && (
                          <div className="pt-1 border-t border-dashed border-slate-200 flex items-center justify-between text-[10.5px] text-slate-600">
                            <span>
                              Pagó con: <strong>{formatCurrency(Number(p.receivedAmount))}</strong>
                            </span>
                            {p.change != null && Number(p.change) > 0 ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Vuelto: {formatCurrency(Number(p.change))}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Pago exacto</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 text-center font-sans">
                  {completedSale.items?.length || totalUnits} prendas registradas en mostrador
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2 pt-2">
                {onOpenHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      const tkt = completedSale.invoiceNumber;
                      onClose();
                      onOpenHistory(tkt);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Ver Detalle del Ticket en Historial</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCompletedSale(null);
                    setCart([]);
                    setSearchQuery("");
                    setReceivedCash("");
                    setDiscount(0);
                    searchInputRef.current?.focus();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Registrar Otra Venta
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Cerrar y Volver al Inventario
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* CUERPO DE 2 COLUMNAS (INTERFAZ C: GRILLA + COBRO)         */
          /* ========================================================= */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* ------------------------------------------------------- */}
            {/* COLUMNA IZQUIERDA (60%): BÚSQUEDA Y GRILLA DE ARTÍCULOS */}
            {/* ------------------------------------------------------- */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto bg-slate-50/50">
              {/* Buscador inteligente con predictor de talle y color */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Buscar por producto, marca, talle o color (ej: 'crocs 42 negro')..."
                      className="w-full text-xs text-slate-900 placeholder-slate-400 pl-10 pr-8 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Toggle para mostrar solo existencias activas */}
                  <button
                    type="button"
                    onClick={() => setOnlyInStock(!onlyInStock)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
                      onlyInStock
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    }`}
                    title={
                      onlyInStock
                        ? "Ocultando variantes sin stock en local"
                        : "Mostrando todos los talles incluyendo agotados"
                    }
                  >
                    <Check
                      className={`w-3.5 h-3.5 ${
                        onlyInStock ? "text-emerald-700 stroke-[3]" : "text-slate-400"
                      }`}
                    />
                    <span className="hidden sm:inline">Solo con stock</span>
                    <span className="sm:hidden">Stock</span>
                  </button>
                </div>

                {/* Tip sutil de ayuda */}
                <div className="flex items-center justify-between text-[10.5px] text-slate-400 px-1">
                  <span>
                    💡 <strong>Predictor activo:</strong> Podés tipear el producto más el talle o color (ej: <em>&quot;crocs 42&quot;</em> o <em>&quot;remera azul l&quot;</em>).
                  </span>
                  {searchQuery && searchResults.length > 0 && (
                    <span className="text-emerald-700 font-bold">
                      {searchResults.length} {searchResults.length === 1 ? "coincidencia" : "coincidencias"}
                    </span>
                  )}
                </div>

                {/* Menú flotante de resultados en vivo con selector dinámico */}
                {searchQuery && (
                  <div className="relative">
                    <div className="absolute top-0 left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto animate-in fade-in zoom-in-98 duration-100">
                      {searchResults.length > 0 ? (
                        searchResults.map((result) => {
                          const prod = result.product;
                          const activeColorFilter = selectedColorByProduct[prod.id] || null;

                          // Filtrar variantes según el color seleccionado en el chip si no se filtró por texto
                          let displayVariants = result.variants;
                          if (activeColorFilter) {
                            displayVariants = displayVariants.filter(
                              (v) =>
                                (v.variant.color || "").toLowerCase().trim() ===
                                activeColorFilter.toLowerCase().trim()
                            );
                          }

                          // Separar en existencias vs agotados
                          const inStockVariants = displayVariants.filter(
                            (v) => v.variant.stockStore + v.variant.stockWarehouse > 0
                          );
                          const outOfStockVariants = displayVariants.filter(
                            (v) => v.variant.stockStore + v.variant.stockWarehouse <= 0
                          );

                          const isExpanded = Boolean(expandedOutOfStock[prod.id]);

                          return (
                            <div
                              key={prod.id}
                              className="p-3.5 hover:bg-emerald-50/20 transition-colors"
                            >
                              {/* Fila Principal de Producto */}
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900">
                                    {prod.name}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-500">
                                    ({prod.brand})
                                  </span>
                                  {prod.modelCode && (
                                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                      Mod: {prod.modelCode}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-black text-emerald-700 whitespace-nowrap">
                                  {formatCurrency(prod.price)}
                                </div>
                              </div>

                              {/* Indicadores de stock y predictores activos */}
                              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                <div className="flex items-center gap-1.5 text-[10.5px]">
                                  {result.salonStockTotal > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                      {result.salonStockTotal} en salón Saavedra 241
                                    </span>
                                  ) : result.warehouseStockTotal > 0 ? (
                                    <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      Solo en depósito ({result.warehouseStockTotal} un.)
                                    </span>
                                  ) : (
                                    <span className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                      Sin existencias
                                    </span>
                                  )}

                                  {result.detectedSize && (
                                    <span className="inline-flex items-center gap-1 bg-slate-900 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                                      🎯 Talle: {result.detectedSize}
                                    </span>
                                  )}
                                  {result.detectedColor && (
                                    <span className="inline-flex items-center gap-1 bg-slate-900 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                                      🎨 Color: {result.detectedColor}
                                    </span>
                                  )}
                                </div>

                                {/* Selector rápido de colores si hay más de 1 color y no se especificó en el buscador */}
                                {!result.detectedColor && result.allColors.length > 1 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      Color:
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedColorByProduct((prev) => ({
                                          ...prev,
                                          [prod.id]: "",
                                        }))
                                      }
                                      className={`text-[9.5px] px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                        !activeColorFilter
                                          ? "bg-slate-800 text-white border-slate-800"
                                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                      }`}
                                    >
                                      Todos
                                    </button>
                                    {result.allColors.slice(0, 4).map((c) => (
                                      <button
                                        key={c}
                                        type="button"
                                        onClick={() =>
                                          setSelectedColorByProduct((prev) => ({
                                           ...prev,
                                            [prod.id]: c,
                                          }))
                                        }
                                        className={`text-[9.5px] px-1.5 py-0.5 rounded border font-semibold transition-colors cursor-pointer ${
                                          activeColorFilter === c
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                      >
                                        {c}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Chips de variantes (Talles / Colores / Stock) */}
                              <div className="flex flex-wrap gap-1.5">
                                {inStockVariants.length > 0 ? (
                                  inStockVariants.map((item, idx) => {
                                    const v = item.variant;
                                    const inSalon = v.stockStore > 0;
                                    return (
                                      <button
                                        key={v.id || idx}
                                        type="button"
                                        onClick={() => handleAddVariant(prod, v)}
                                        className={`text-[10px] px-2.5 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                          item.isExactMatch
                                            ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/40"
                                            : inSalon
                                            ? "bg-white hover:bg-emerald-50 hover:border-emerald-400 border-slate-200 text-slate-800"
                                            : "bg-amber-50 hover:bg-amber-100 hover:border-amber-400 border-amber-200 text-amber-900"
                                        }`}
                                        title={`Talle ${v.size} (${v.color}) — Salón Saavedra: ${v.stockStore} un., Depósito: ${v.stockWarehouse} un.`}
                                      >
                                        <span>Talle {v.size}</span>
                                        {v.color && (
                                          <span className="opacity-75 text-[9.5px] font-normal">
                                            ({v.color})
                                          </span>
                                        )}
                                        <span
                                          className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono ${
                                            inSalon
                                              ? item.isExactMatch
                                                ? "bg-emerald-700 text-white"
                                                : "bg-emerald-100 text-emerald-800"
                                              : "bg-amber-200/80 text-amber-900"
                                          }`}
                                        >
                                          {inSalon ? `${v.stockStore} salón` : `${v.stockWarehouse} dep.`}
                                        </span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <span className="text-[10.5px] text-slate-400 italic">
                                    No hay talles con stock para el filtro seleccionado.
                                  </span>
                                )}

                                {/* Variantes agotadas desplegables si existen */}
                                {outOfStockVariants.length > 0 && !isExpanded && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedOutOfStock((prev) => ({
                                        ...prev,
                                        [prod.id]: true,
                                      }))
                                    }
                                    className="text-[10px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg border border-dashed border-slate-200 hover:border-slate-300 font-medium cursor-pointer"
                                  >
                                    + {outOfStockVariants.length} sin stock
                                  </button>
                                )}

                                {outOfStockVariants.length > 0 && isExpanded && (
                                  outOfStockVariants.map((item, idx) => {
                                    const v = item.variant;
                                    return (
                                      <button
                                        key={v.id || idx}
                                        type="button"
                                        disabled
                                        className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 line-through font-normal cursor-not-allowed opacity-60"
                                        title={`Talle ${v.size} agotado en todas las ubicaciones`}
                                      >
                                        Talle {v.size} ({v.color || "Sin stock"})
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No se encontraron productos coincidentes con &quot;{searchQuery}&quot;
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje de Error / Alerta */}
              {errorMessage && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{errorMessage}</span>
                </div>
              )}

              {/* Grilla / Planilla de Productos Añadidos a la Venta */}
              <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs flex flex-col">
                <div className="overflow-y-auto flex-1 max-h-[360px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10.5px] uppercase sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Artículo / Talle</th>
                        <th className="py-2.5 px-2 text-center">Salón</th>
                        <th className="py-2.5 px-2 text-center">Cant</th>
                        <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <Package className="w-9 h-9 mx-auto stroke-1 mb-2 text-slate-300" />
                            <p className="text-xs font-bold text-slate-700">
                              La venta está vacía
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Escribí el nombre de un producto arriba o escaneá un código de barras.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        cart.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 leading-tight">
                                {item.name}
                              </div>
                              <div className="text-[10.5px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span className="bg-slate-100 text-slate-800 font-bold px-1.5 py-0.2 rounded border border-slate-200">
                                  Talle {item.size}
                                </span>
                                {item.color && <span>{item.color}</span>}
                                {item.sku && (
                                  <span className="font-mono text-slate-400 text-[10px]">
                                    ({item.sku})
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <span
                                className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                  item.stockStore > 0
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-amber-50 text-amber-800"
                                }`}
                                title={`Salón: ${item.stockStore} | Depósito: ${item.stockWarehouse}`}
                              >
                                {item.stockStore}
                              </span>
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.id, -1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded active:scale-90 cursor-pointer"
                                  title="Restar unidad"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="w-5 text-center font-black text-xs text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQty(item.id, 1)}
                                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:bg-white rounded active:scale-90 cursor-pointer"
                                  title="Sumar unidad"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </td>

                            <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-xs">
                              {formatCurrency(item.price)}
                            </td>

                            <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono text-xs">
                              {formatCurrency(item.price * item.quantity)}
                            </td>

                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer de la grilla */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>{cart.length} líneas de venta</span>
                  <span>Total prendas: {totalUnits}</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* COLUMNA DERECHA (40%): PANEL DE COBRO FÍSICO / CAJA     */}
            {/* ------------------------------------------------------- */}
            <div className="w-full lg:w-84 xl:w-96 bg-slate-900 text-white p-4 sm:p-5 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[85vh]">
              <div className="space-y-3.5">
                {/* Visor de Total a Cobrar */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center shadow-inner">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                    Total a Cobrar
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                    {formatCurrency(netTotal)}
                  </span>
                  {grossTotal > 0 && discount > 0 && (
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-center gap-2">
                      <span>Subtotal: {formatCurrency(grossTotal)}</span>
                      <span className="text-rose-400 font-semibold">
                        (-{formatCurrency(discount)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Apartado de Descuento Aplicado */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-rose-400" />
                      Descuento aplicado:
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono font-bold text-slate-500">$</span>
                      <input
                        type="number"
                        min={0}
                        max={grossTotal}
                        value={discount || ""}
                        onChange={(e) => {
                          const val = e.target.value
                            ? Math.max(0, Math.min(grossTotal, Number(e.target.value)))
                            : 0;
                          setDiscount(val);
                        }}
                        placeholder="0"
                        className="w-28 text-right bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-rose-300 font-black font-mono focus:border-rose-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Presets rápidos de descuento en porcentaje */}
                  <div className="grid grid-cols-5 gap-1 pt-0.5">
                    {[0, 5, 10, 15, 20].map((pct) => {
                      const isCurrent =
                        pct === 0
                          ? discount === 0
                          : grossTotal > 0 && Math.round((discount / grossTotal) * 100) === pct;
                      return (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            if (pct === 0) setDiscount(0);
                            else setDiscount(Math.round((grossTotal * pct) / 100));
                          }}
                          className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/50 font-black"
                              : "bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-700 hover:text-white"
                          }`}
                        >
                          {pct === 0 ? "Sin desc." : `${pct}%`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selector de Medios de Pago (Simple vs Dividido) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Medio de Cobro
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isSplitPayment;
                        setIsSplitPayment(next);
                        if (next) {
                          const half = Math.round(netTotal / 2);
                          setSplitPayments([
                            {
                              id: `split-${Date.now()}-1`,
                              method: "EFECTIVO",
                              amount: half,
                              receivedCash: half,
                            },
                            {
                              id: `split-${Date.now()}-2`,
                              method: "TRANSFERENCIA",
                              amount: netTotal - half,
                              receivedCash: "",
                            },
                          ]);
                        }
                      }}
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        isSplitPayment
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black shadow-2xs"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
                      }`}
                      title={
                        isSplitPayment
                          ? "Volver a cobrar con un único medio de pago"
                          : "Habilitar múltiples medios de pago combinados"
                      }
                    >
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span>{isSplitPayment ? "Modo Dividido" : "+ Dividir Medios"}</span>
                    </button>
                  </div>

                  {!isSplitPayment ? (
                    /* =================================================== */
                    /* MODO 1: PAGO SIMPLE (1 ÚNICO MEDIO DE PAGO)         */
                    /* =================================================== */
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: "EFECTIVO", label: "Efectivo", icon: Banknote },
                          { id: "DEBITO", label: "Débito", icon: CreditCard },
                          { id: "CREDITO", label: "Crédito", icon: CreditCard },
                          { id: "TRANSFERENCIA", label: "Transferencia", icon: Store },
                        ].map((m) => {
                          const Icon = m.icon;
                          const isSel = paymentMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setPaymentMethod(m.id as any)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                                isSel
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span className="text-[10.5px] truncate max-w-full">
                                {m.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Teclas Rápidas de Billetes Físicos y Vuelto (Solo para Efectivo Simple) */}
                      {paymentMethod === "EFECTIVO" && (
                        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-400" />
                              Billetes recibidos:
                            </span>
                            <button
                              type="button"
                              onClick={() => setReceivedCash("")}
                              className="text-[10px] text-slate-500 hover:text-white underline cursor-pointer"
                            >
                              Limpiar
                            </button>
                          </div>

                          {/* Botones de billetes argentinos comunes */}
                          <div className="grid grid-cols-4 gap-1">
                            {[10000, 20000, 50000].map((b) => (
                              <button
                                key={b}
                                type="button"
                                onClick={() => handleAddCash(b)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg py-1.5 text-[10.5px] font-bold cursor-pointer active:scale-95"
                              >
                                +${b / 1000}k
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handleExactCash}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg py-1.5 text-[10.5px] cursor-pointer active:scale-95"
                            >
                              Exacto
                            </button>
                          </div>

                          {/* Input manual de billetes y cálculo de vuelto */}
                          <div className="pt-2 border-t border-slate-800 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <label
                                  htmlFor="cash-received-input"
                                  className="text-amber-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Pagó con</span>
                                  <span className="text-rose-400 font-black" title="Campo obligatorio">*</span>:
                                </label>
                                <span className="text-[9.5px] font-extrabold text-amber-400/90 uppercase tracking-wider block">
                                  (Obligatorio)
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  id="cash-received-input"
                                  ref={receivedCashInputRef}
                                  type="number"
                                  min={netTotal}
                                  step="any"
                                  value={receivedCash}
                                  onChange={(e) =>
                                    setReceivedCash(
                                      e.target.value ? Number(e.target.value) : ""
                                    )
                                  }
                                  placeholder="$ 0,00"
                                  className={`w-36 text-right rounded-xl px-3 py-1.5 text-xs text-white font-black font-mono transition-all focus:outline-none ${
                                    receivedCash === ""
                                      ? "bg-slate-900 border-2 border-amber-500/80 focus:border-amber-400 ring-2 ring-amber-400/20"
                                      : numReceived < netTotal
                                      ? "bg-slate-900 border-2 border-rose-500 focus:border-rose-400 ring-2 ring-rose-400/20 text-rose-200"
                                      : "bg-slate-900 border-2 border-emerald-500 focus:border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/20"
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Mensajes dinámicos según el valor ingresado */}
                            {receivedCash === "" ? (
                              <div className="text-[10px] text-amber-300/90 flex items-center gap-1.5 pt-0.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>Ingresá el efectivo del cliente o presioná <strong>Exacto</strong>.</span>
                              </div>
                            ) : numReceived < netTotal ? (
                              <div className="text-[11px] text-rose-300 font-semibold flex items-center justify-between p-2 rounded-xl bg-rose-950/40 border border-rose-800/60">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  Faltan abonar:
                                </span>
                                <span className="font-mono font-bold text-rose-200">
                                  {formatCurrency(netTotal - numReceived)}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-950/50 border border-emerald-500/40">
                                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                                  <Coins className="w-4 h-4 text-emerald-400" />
                                  Vuelto a entregar:
                                </span>
                                <span className="text-sm font-black text-emerald-300 font-mono">
                                  {formatCurrency(changeDue)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* =================================================== */
                    /* MODO 2: PAGO DIVIDIDO / MIXTO (MÚLTIPLES MEDIOS)    */
                    /* =================================================== */
                    <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2.5 max-h-64 overflow-y-auto">
                      {/* Estado del balance del pago dividido */}
                      <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-800">
                        <span className="text-slate-400 font-bold">Estado asignación:</span>
                        {Math.abs(splitDifference) < 0.01 ? (
                          <span className="text-emerald-400 font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            100% Cubierto
                          </span>
                        ) : splitDifference > 0 ? (
                          <span className="text-rose-400 font-bold flex items-center gap-1 font-mono">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Faltan {formatCurrency(splitDifference)}
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold flex items-center gap-1 font-mono">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Excede {formatCurrency(-splitDifference)}
                          </span>
                        )}
                      </div>

                      {/* Lista de Medios de Pago Divididos */}
                      <div className="space-y-2">
                        {splitPayments.map((p, idx) => {
                          const isCash = p.method === "EFECTIVO";
                          const pAmountNum = typeof p.amount === "number" ? p.amount : 0;
                          const pReceivedNum = typeof p.receivedCash === "number" ? p.receivedCash : 0;
                          const pChange = Math.max(0, pReceivedNum - pAmountNum);

                          return (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-500 w-3.5">
                                  #{idx + 1}
                                </span>
                                {/* Selector de método */}
                                <select
                                  value={p.method}
                                  onChange={(e) => {
                                    const m = e.target.value as PaymentMethodType;
                                    setSplitPayments((prev) =>
                                      prev.map((item) =>
                                        item.id === p.id
                                          ? {
                                              ...item,
                                              method: m,
                                              receivedCash: m === "EFECTIVO" ? item.amount : "",
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className="text-[11px] bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-bold focus:border-emerald-500 focus:outline-none cursor-pointer shrink-0"
                                >
                                  <option value="EFECTIVO">Efectivo</option>
                                  <option value="DEBITO">Débito</option>
                                  <option value="CREDITO">Crédito</option>
                                  <option value="TRANSFERENCIA">Transferencia</option>
                                </select>

                                {/* Input de Monto */}
                                <div className="relative flex-1">
                                  <input
                                    type="number"
                                    min={0}
                                    value={p.amount}
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : "";
                                      setSplitPayments((prev) =>
                                        prev.map((item) =>
                                          item.id === p.id
                                            ? {
                                                ...item,
                                                amount: val,
                                                receivedCash:
                                                  item.method === "EFECTIVO" && (item.receivedCash === "" || item.receivedCash === item.amount)
                                                    ? val
                                                    : item.receivedCash,
                                              }
                                            : item
                                        )
                                      );
                                    }}
                                    placeholder="Monto $"
                                    className="w-full text-right bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                                  />
                                </div>

                                {/* Botón "Resto" para auto-completar el saldo pendiente */}
                                <button
                                  type="button"
                                  onClick={() => handleAssignRemaining(p.id)}
                                  title="Asignar el saldo restante a este medio"
                                  className="px-1.5 py-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer active:scale-95"
                                >
                                  Resto
                                </button>

                                {/* Eliminar medio (si hay más de 1) */}
                                {splitPayments.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSplitPayments((prev) =>
                                        prev.filter((item) => item.id !== p.id)
                                      )
                                    }
                                    className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                                    title="Quitar este medio de pago"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Si este medio es EFECTIVO, exigir "Pagó con" y calcular vuelto */}
                              {isCash && (
                                <div className="pt-1.5 border-t border-slate-800/80 space-y-1 text-xs">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-[10.5px] text-amber-300 font-bold flex items-center gap-0.5">
                                      Pagó con <span className="text-rose-400">*</span>:
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={pAmountNum}
                                        value={p.receivedCash}
                                        onChange={(e) => {
                                          const val = e.target.value ? Number(e.target.value) : "";
                                          setSplitPayments((prev) =>
                                            prev.map((item) =>
                                              item.id === p.id
                                                ? { ...item, receivedCash: val }
                                                : item
                                            )
                                          );
                                        }}
                                        placeholder="Efectivo $"
                                        className={`w-24 text-right bg-slate-950 border rounded-lg px-2 py-0.5 text-xs font-mono font-bold focus:outline-none ${
                                          p.receivedCash === "" || pReceivedNum < pAmountNum
                                            ? "border-rose-500 text-rose-300"
                                            : "border-emerald-500 text-emerald-300"
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSplitPayments((prev) =>
                                            prev.map((item) =>
                                              item.id === p.id
                                                ? { ...item, receivedCash: item.amount }
                                                : item
                                            )
                                          );
                                        }}
                                        className="px-1.5 py-0.5 text-[9.5px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded cursor-pointer"
                                      >
                                        Exacto
                                      </button>
                                    </div>
                                  </div>

                                  {/* Estado de vuelto para la porción de efectivo */}
                                  {pReceivedNum > pAmountNum && pAmountNum > 0 && (
                                    <div className="flex items-center justify-between text-[10px] text-emerald-300 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                                      <span>Vuelto en efectivo:</span>
                                      <span className="font-bold">{formatCurrency(pChange)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Botón para agregar otra forma de pago */}
                      {splitPayments.length < 4 && (
                        <button
                          type="button"
                          onClick={() => {
                            const otherCovered = splitPayments.reduce(
                              (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
                              0
                            );
                            const rem = Math.max(0, netTotal - otherCovered);
                            setSplitPayments((prev) => [
                              ...prev,
                              {
                                id: `split-${Date.now()}-${prev.length + 1}`,
                                method: "TRANSFERENCIA",
                                amount: rem > 0 ? rem : "",
                                receivedCash: "",
                              },
                            ]);
                          }}
                          className="w-full py-1.5 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-[10.5px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar otro medio de cobro</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Principal de Confirmación */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <button
                  type="button"
                  disabled={cart.length === 0 || isSubmitting}
                  onClick={handleConfirmSale}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Procesando venta...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        Cobrar y Registrar Venta ({formatCurrency(netTotal)})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
