"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  ShoppingBag,
  Banknote,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Barcode,
  Check,
  ArrowRight,
  ArrowLeftRight,
  Clock,
  User,
  Percent,
  DollarSign,
  Sparkles,
  Layers,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  calculateSaleTotals,
  calculateItemDiscount,
  DiscountType,
  DiscountConfig,
} from "@/lib/discounts";
import {
  updatePendingSale,
  searchPosProducts,
} from "@/server/actions/posSaleActions";
import { DetailedProductItem, ProductVariantItem } from "./types";
import type { PendingSaleItemSummary } from "./PosView";
import type { UpdatePendingSaleInput } from "@/schemas/sale";

export interface EditPendingTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: PendingSaleItemSummary | null;
  catalogProducts: DetailedProductItem[];
  onSaveSuccess: (updatedSale: PendingSaleItemSummary, autoOpenCheckout?: boolean) => void;
  onCancelTicket?: (saleId: string, ticketCode: string | null) => void;
}

interface EditableItem {
  rowId: string;
  variantId: string;
  productId: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  sku?: string;
  barcode?: string;
  stockStore: number;
  stockReserved: number;
  originalPrice: number;
  quantity: number;
  discountType?: DiscountType | null;
  discountValue?: number | null;
  originalReservedInTicket: number;
  availableVariants: Array<{
    id: string;
    size: string;
    color: string;
    sku?: string;
    barcode?: string;
    stockStore: number;
    stockReserved?: number;
    price?: number | null;
  }>;
}

export function EditPendingTicketModal({
  isOpen,
  onClose,
  ticket,
  catalogProducts,
  onSaveSuccess,
  onCancelTicket,
}: EditPendingTicketModalProps) {
  if (!isOpen || !ticket) return null;

  // -------------------------------------------------------------
  // ESTADOS DEL FORMULARIO
  // -------------------------------------------------------------
  const [customerName, setCustomerName] = useState(ticket.customerName || "");
  const [notes, setNotes] = useState(ticket.notes || "");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<DiscountConfig | null>(
    ticket.discountType && ticket.discountValue
      ? { type: ticket.discountType, value: Number(ticket.discountValue) }
      : null
  );

  // Estados de búsqueda / escaneo para añadir artículos
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modal dedicado de Descuento (Prenda individual o Global del Ticket)
  const [discountModalConfig, setDiscountModalConfig] = useState<{
    isOpen: boolean;
    isGlobal: boolean;
    rowId?: string;
    productName: string;
    originalAmount: number;
    currentType: DiscountType;
    currentValue: number;
  } | null>(null);

  // Estado de guardado y feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState(false);

  // -------------------------------------------------------------
  // INICIALIZACIÓN DE ÍTEMS DESDE EL TICKET
  // -------------------------------------------------------------
  useEffect(() => {
    if (!ticket) return;

    setCustomerName(ticket.customerName || "");
    setNotes(ticket.notes || "");
    setGlobalDiscount(
      ticket.discountType && ticket.discountValue
        ? { type: ticket.discountType, value: Number(ticket.discountValue) }
        : null
    );

    const mappedItems: EditableItem[] = ticket.items.map((it, idx) => {
      // Intentar encontrar las variantes hermanas en catalogProducts o dentro del payload
      let siblingVariants: EditableItem["availableVariants"] = [];
      const catalogProd = catalogProducts.find(
        (p) => p.id === it.variant.product.id || p.name.toLowerCase() === it.variant.product.name.toLowerCase()
      );

      if (catalogProd && catalogProd.variants && catalogProd.variants.length > 0) {
        siblingVariants = catalogProd.variants.map((v) => ({
          id: v.id || "",
          size: v.size,
          color: v.color,
          sku: v.sku,
          barcode: v.barcode,
          stockStore: v.stockStore,
          stockReserved: v.stockReserved || 0,
          price: v.price ? Number(v.price) : Number(catalogProd.price),
        }));
      } else if (it.variant.product.variants && it.variant.product.variants.length > 0) {
        siblingVariants = it.variant.product.variants.map((v) => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          barcode: v.barcode,
          stockStore: v.stockStore,
          stockReserved: v.stockReserved || 0,
          price: v.price ? Number(v.price) : undefined,
        }));
      } else {
        siblingVariants = [
          {
            id: it.variant.id,
            size: it.variant.size,
            color: it.variant.color,
            sku: it.variant.sku,
            barcode: it.variant.barcode,
            stockStore: it.variant.stockStore,
            stockReserved: it.variant.stockReserved || 0,
            price: Number(it.originalPrice || it.unitPrice),
          },
        ];
      }

      const origPrice = Number(it.originalPrice || it.unitPrice);
      const unitP = Number(it.unitPrice);

      let dType: DiscountType | null = it.discountType || null;
      let dVal: number | null = it.discountValue ? Number(it.discountValue) : null;
      if (!dType && origPrice > unitP) {
        dType = "FIXED";
        dVal = Math.round((origPrice - unitP) * 100) / 100;
      }

      return {
        rowId: `${it.id}-${idx}`,
        variantId: it.variant.id,
        productId: it.variant.product.id,
        name: it.variant.product.name,
        brand: it.variant.product.brand?.name || "",
        category: it.variant.product.category?.name || "",
        size: it.variant.size,
        color: it.variant.color,
        sku: it.variant.sku,
        barcode: it.variant.barcode,
        stockStore: it.variant.stockStore,
        stockReserved: it.variant.stockReserved || 0,
        originalPrice: origPrice,
        quantity: it.quantity,
        discountType: dType,
        discountValue: dVal,
        originalReservedInTicket: it.quantity,
        availableVariants: siblingVariants,
      };
    });

    setItems(mappedItems);
    setSaveError(null);
  }, [ticket, catalogProducts]);

  // Enfocar input de búsqueda al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // -------------------------------------------------------------
  // CÁLCULO REACTIVO Y DETERMINISTA DE TOTALES (RF-08)
  // -------------------------------------------------------------
  const totals = useMemo(() => {
    return calculateSaleTotals(
      items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        originalPrice: i.originalPrice,
        discountType: i.discountType,
        discountValue: i.discountValue,
      })),
      globalDiscount
    );
  }, [items, globalDiscount]);

  // -------------------------------------------------------------
  // BÚSQUEDA EN TIEMPO REAL / ESCÁNER USB DE PRODUCTOS
  // -------------------------------------------------------------
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // 1. Filtrar primero en catálogo local en memoria (ultra rápido)
        const lowerQ = q.toLowerCase();
        const localMatches: any[] = [];

        for (const prod of catalogProducts) {
          for (const variant of prod.variants) {
            const isBarcodeMatch = variant.barcode && variant.barcode === q;
            const isSkuMatch = variant.sku && variant.sku.toLowerCase() === lowerQ;
            const isNameMatch = prod.name.toLowerCase().includes(lowerQ);
            const isBrandMatch = prod.brand.toLowerCase().includes(lowerQ);
            const isSizeMatch = variant.size.toLowerCase() === lowerQ;
            const isColorMatch = variant.color.toLowerCase().includes(lowerQ);

            if (isBarcodeMatch || isSkuMatch || isNameMatch || isBrandMatch || isSizeMatch || isColorMatch) {
              const effPrice = variant.price ? Number(variant.price) : Number(prod.price);
              const avail = Math.max(0, variant.stockStore - (variant.stockReserved || 0));
              localMatches.push({
                variantId: variant.id || "",
                productId: prod.id,
                name: prod.name,
                brand: prod.brand,
                category: prod.category,
                size: variant.size,
                color: variant.color,
                barcode: variant.barcode,
                sku: variant.sku,
                price: effPrice,
                stockStore: variant.stockStore,
                stockReserved: variant.stockReserved || 0,
                stockAvailable: avail,
                availableVariants: prod.variants.map((v) => ({
                  id: v.id || "",
                  size: v.size,
                  color: v.color,
                  sku: v.sku,
                  barcode: v.barcode,
                  stockStore: v.stockStore,
                  stockReserved: v.stockReserved || 0,
                  price: v.price ? Number(v.price) : Number(prod.price),
                })),
              });
            }
          }
        }

        if (localMatches.length > 0) {
          setSearchResults(localMatches.slice(0, 15));
          setIsSearching(false);
          return;
        }

        // 2. Si no encontró en catálogo local, consultar base de datos en servidor
        const res = await searchPosProducts(q);
        if (res.success && res.items) {
          setSearchResults(res.items);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error en búsqueda:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, catalogProducts]);

  // Manejo de Enter en el input de búsqueda (escáner USB o teclado)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0) {
        // Añadir el primer resultado
        handleAddItemFromSearch(searchResults[0]);
      }
    }
  };

  // -------------------------------------------------------------
  // ACCIONES SOBRE LOS ÍTEMS DEL TICKET
  // -------------------------------------------------------------

  // Añadir ítem desde el buscador
  const handleAddItemFromSearch = (productItem: any) => {
    const variantId = productItem.variantId;
    const existingIndex = items.findIndex((i) => i.variantId === variantId);

    // Calcular disponibilidad considerando lo ya reservado en este ticket
    const currentQtyInTicket = existingIndex >= 0 ? items[existingIndex].quantity : 0;
    const origReserved = existingIndex >= 0 ? items[existingIndex].originalReservedInTicket : 0;
    const maxAvailable = productItem.stockStore - productItem.stockReserved + origReserved;

    if (currentQtyInTicket + 1 > maxAvailable) {
      setSaveError(
        `No hay más stock disponible en salón para "${productItem.name}" (Talle ${productItem.size}). Máximo: ${maxAvailable}`
      );
      return;
    }

    if (existingIndex >= 0) {
      // Incrementar cantidad existente
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      // Insertar nuevo ítem al inicio
      const newItem: EditableItem = {
        rowId: `new-${variantId}-${Date.now()}`,
        variantId: variantId,
        productId: productItem.productId,
        name: productItem.name,
        brand: productItem.brand,
        category: productItem.category,
        size: productItem.size,
        color: productItem.color,
        sku: productItem.sku,
        barcode: productItem.barcode,
        stockStore: productItem.stockStore,
        stockReserved: productItem.stockReserved,
        originalPrice: productItem.price,
        quantity: 1,
        discountType: null,
        discountValue: null,
        originalReservedInTicket: 0,
        availableVariants: productItem.availableVariants || [
          {
            id: variantId,
            size: productItem.size,
            color: productItem.color,
            sku: productItem.sku,
            barcode: productItem.barcode,
            stockStore: productItem.stockStore,
            stockReserved: productItem.stockReserved,
            price: productItem.price,
          },
        ],
      };
      setItems((prev) => [newItem, ...prev]);
    }

    setSearchQuery("");
    setSearchResults([]);
    setSaveError(null);
    searchInputRef.current?.focus();
  };

  // Cambiar cantidad (+, -, o valor numérico)
  const handleUpdateQuantity = (rowId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(rowId);
      return;
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;

        const maxAvailable = it.stockStore - it.stockReserved + it.originalReservedInTicket;
        if (newQuantity > maxAvailable) {
          setSaveError(
            `Stock insuficiente en salón para "${it.name}" (Talle ${it.size}). Disponible: ${maxAvailable}`
          );
          return it;
        }

        setSaveError(null);
        return { ...it, quantity: newQuantity };
      })
    );
  };

  // Cambiar talle/variante del mismo producto
  const handleSwapVariant = (rowId: string, newVariantId: string) => {
    const item = items.find((i) => i.rowId === rowId);
    if (!item) return;

    const targetVariant = item.availableVariants.find((v) => v.id === newVariantId);
    if (!targetVariant) return;

    // Verificar si esta variante ya está en otro renglón
    const duplicateRow = items.find((i) => i.variantId === newVariantId && i.rowId !== rowId);
    if (duplicateRow) {
      setSaveError(
        `El talle ${targetVariant.size} ya está en el ticket. Modifica la cantidad en ese renglón.`
      );
      return;
    }

    const origReserved = targetVariant.id === item.variantId ? item.originalReservedInTicket : 0;
    const maxAvailable =
      targetVariant.stockStore - (targetVariant.stockReserved || 0) + origReserved;

    if (maxAvailable <= 0) {
      setSaveError(
        `El talle ${targetVariant.size} no tiene stock disponible en salón (0 un.).`
      );
      return;
    }

    const safeQty = Math.min(item.quantity, maxAvailable);
    const newPrice = targetVariant.price ? Number(targetVariant.price) : item.originalPrice;

    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        return {
          ...it,
          variantId: targetVariant.id,
          size: targetVariant.size,
          color: targetVariant.color,
          sku: targetVariant.sku,
          barcode: targetVariant.barcode,
          stockStore: targetVariant.stockStore,
          stockReserved: targetVariant.stockReserved || 0,
          originalPrice: newPrice,
          quantity: safeQty,
          originalReservedInTicket: origReserved,
        };
      })
    );
    setSaveError(null);
  };

  // Quitar ítem
  const handleRemoveItem = (rowId: string) => {
    if (items.length <= 1) {
      setSaveError(
        "El ticket no puede quedar vacío. Si el cliente no va a llevar nada, utiliza 'Cancelar Preventa'."
      );
      return;
    }

    setItems((prev) => prev.filter((i) => i.rowId !== rowId));
    setSaveError(null);
  };

  // Abrir modal de descuento para una prenda individual
  const handleOpenRowDiscountModal = (item: EditableItem) => {
    setDiscountModalConfig({
      isOpen: true,
      isGlobal: false,
      rowId: item.rowId,
      productName: `${item.name} (Talle ${item.size}${item.color ? ` - ${item.color}` : ""})`,
      originalAmount: item.originalPrice,
      currentType: item.discountType || "PERCENTAGE",
      currentValue: item.discountValue || 0,
    });
  };

  // Abrir modal de descuento global para todo el ticket
  const handleOpenGlobalDiscountModal = () => {
    const subtotalAfterItems = Math.max(0, totals.subtotalGross - totals.totalItemDiscounts);
    setDiscountModalConfig({
      isOpen: true,
      isGlobal: true,
      productName: `Ticket ${ticket.ticketCode || "Preventa"} (Total del Ticket)`,
      originalAmount: subtotalAfterItems,
      currentType: globalDiscount?.type || "PERCENTAGE",
      currentValue: globalDiscount?.value || 0,
    });
  };

  // Aplicar o quitar descuento desde el modal dedicado
  const handleApplyDiscountFromModal = (
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
        sanitizedValue = Math.min(totals.subtotalAfterItems, sanitizedValue);
      }
      if (sanitizedValue > 0) {
        setGlobalDiscount({
          type,
          value: sanitizedValue,
        });
      } else {
        setGlobalDiscount(null);
      }
    } else if (targetRowId) {
      setItems((prev) =>
        prev.map((it) => {
          if (it.rowId !== targetRowId) return it;
          const finalVal =
            type === "FIXED"
              ? Math.min(it.originalPrice, sanitizedValue)
              : sanitizedValue;
          return {
            ...it,
            discountType: finalVal > 0 ? type : null,
            discountValue: finalVal > 0 ? finalVal : null,
          };
        })
      );
    }
    setDiscountModalConfig(null);
  };

  // -------------------------------------------------------------
  // GUARDAR CAMBIOS EN EL SERVIDOR (updatePendingSale)
  // -------------------------------------------------------------
  const handleSaveTicket = async (autoOpenCheckout: boolean = false) => {
    if (items.length === 0) {
      setSaveError("El ticket debe contener al menos 1 producto.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload: UpdatePendingSaleInput = {
        saleId: ticket.id,
        customerName: customerName.trim() || undefined,
        items: items.map((it) => {
          const calcItem = totals.items.find((ci) => ci.variantId === it.variantId);
          const unitPrice = calcItem ? calcItem.unitPrice : it.originalPrice;
          const unitDiscount = calcItem ? calcItem.unitDiscount : 0;

          return {
            variantId: it.variantId,
            quantity: it.quantity,
            originalPrice: it.originalPrice,
            discountType: it.discountType || undefined,
            discountValue: it.discountValue || undefined,
            discountAmount: unitDiscount * it.quantity,
            unitPrice: unitPrice,
          };
        }),
        globalDiscount: globalDiscount && globalDiscount.value > 0 ? globalDiscount : undefined,
        notes: notes.trim() || undefined,
      };

      const res = await updatePendingSale(payload);

      if (!res.success || !res.data) {
        throw new Error(res.error || "No se pudo actualizar la preventa");
      }

      // Preparar objeto de ticket actualizado
      const updatedTicket: PendingSaleItemSummary = res.data.sale
        ? (res.data.sale as PendingSaleItemSummary)
        : {
            ...ticket,
            customerName: customerName.trim() || ticket.customerName,
            total: res.data.totalNet,
            subtotalGross: res.data.subtotalGross,
            discount: res.data.totalDiscount,
            discountType: globalDiscount?.type || null,
            discountValue: globalDiscount?.value || null,
            notes: notes || null,
            items: items.map((it, idx) => {
              const calcItem = totals.items.find((ci) => ci.variantId === it.variantId);
              const uPrice = calcItem ? calcItem.unitPrice : it.originalPrice;
              const sub = calcItem ? calcItem.subtotal : uPrice * it.quantity;
              return {
                id: `updated-item-${idx}`,
                quantity: it.quantity,
                unitPrice: uPrice,
                price: uPrice,
                subtotal: sub,
                originalPrice: it.originalPrice,
                discount: calcItem ? calcItem.unitDiscount : 0,
                discountType: it.discountType,
                discountValue: it.discountValue,
                variant: {
                  id: it.variantId,
                  size: it.size,
                  color: it.color,
                  sku: it.sku,
                  barcode: it.barcode,
                  stockStore: it.stockStore,
                  stockReserved: it.stockReserved,
                  price: it.originalPrice,
                  product: {
                    id: it.productId,
                    name: it.name,
                    brand: { name: it.brand },
                    category: { name: it.category },
                    variants: it.availableVariants,
                  },
                },
              };
            }),
          };

      onSaveSuccess(updatedTicket, autoOpenCheckout);
    } catch (err: any) {
      console.error("Error al guardar modificaciones:", err);
      setSaveError(err.message || "Ocurrió un error al guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* ========================================================= */}
        {/* CABECERA OSCURA DE ALTO CONTRASTE                         */}
        {/* ========================================================= */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-black bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg shadow-xs">
              {ticket.ticketCode || "#000"}
            </span>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Modificar Ticket en Caja</span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  Edición de Artículos
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Añade prendas, cambia talles o quita artículos. El stock se rebalancea automáticamente en Saavedra 241.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            title="Cerrar sin guardar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* CUERPO DEL MODAL                                          */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 bg-slate-50/40">
          {/* Mensaje de error si hubo fallo en validación o stock */}
          {saveError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{saveError}</p>
              </div>
              <button
                onClick={() => setSaveError(null)}
                className="text-rose-500 hover:text-rose-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* BARRA SUPERIOR: DATOS DEL CLIENTE Y TIEMPO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="sm:col-span-2 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Cliente / Alias
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Consumidor Final"
                  className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none border-b border-transparent focus:border-emerald-500 py-0.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
              {ticket.seller && (
                <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-bold">
                  {ticket.seller.name}
                </span>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* BUSCADOR Y ESCÁNER USB PARA AÑADIR NUEVAS PRENDAS          */}
          {/* ========================================================= */}
          <div className="relative space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-emerald-600" />
                <span>Añadir Artículo al Ticket</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                Usa el lector de código de barras USB o escribe nombre/talle
              </span>
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Escanear código de barras o buscar producto (ej: Crocs, Zapatillas, Talle 42, SKU)..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* DROPDOWN DE RESULTADOS DE BÚSQUEDA */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-100">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Buscando coincidencias en el catálogo...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No se encontraron productos con <span className="font-bold">"{searchQuery}"</span>
                  </div>
                ) : (
                  searchResults.map((resItem) => {
                    const isOutOfStock = resItem.stockAvailable <= 0;
                    return (
                      <div
                        key={resItem.variantId}
                        className={`p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors ${
                          isOutOfStock ? "opacity-60 bg-slate-50/50" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">
                              {resItem.name}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              {resItem.brand}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">
                              Talle {resItem.size}
                            </span>
                            {resItem.color && <span>• Color {resItem.color}</span>}
                            <span>• SKU: {resItem.sku || "N/A"}</span>
                            {resItem.barcode && <span>• Barcode: {resItem.barcode}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900 block">
                              {formatCurrency(resItem.price)}
                            </span>
                            <span
                              className={`text-[10px] font-semibold ${
                                isOutOfStock ? "text-rose-600" : "text-emerald-700"
                              }`}
                            >
                              {isOutOfStock
                                ? "Sin stock salón"
                                : `${resItem.stockAvailable} disp. salón`}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddItemFromSearch(resItem)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* TABLA INTERACTIVA DE ARTÍCULOS EN EL TICKET               */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-0">
            <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-slate-600" />
                <span>Prendas en el Ticket ({items.length})</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Modifica talles, cantidades o quita renglones
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {items.map((it) => {
                const maxAvailable = it.stockStore - it.stockReserved + it.originalReservedInTicket;
                const calcItem = totals.items.find((ci) => ci.variantId === it.variantId);
                const effectiveUnitPrice = calcItem ? calcItem.unitPrice : it.originalPrice;
                const rowSubtotal = calcItem ? calcItem.subtotal : effectiveUnitPrice * it.quantity;
                const hasDiscount = (calcItem && calcItem.unitDiscount > 0) || false;

                return (
                  <div key={it.rowId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors">
                    {/* Información básica del producto */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[13px] truncate">
                          {it.name}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                          {it.brand}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        {it.color && <span>Color: {it.color} •</span>}
                        <span>Precio lista: {formatCurrency(it.originalPrice)}</span>
                        {hasDiscount && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Desc: -{formatCurrency(calcItem!.unitDiscount)} c/u
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SELECTOR DE TALLE / VARIANTE */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Talle</span>
                        {it.availableVariants && it.availableVariants.length > 1 ? (
                          <select
                            value={it.variantId}
                            onChange={(e) => handleSwapVariant(it.rowId, e.target.value)}
                            className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            title="Cambiar talle por otra variante del mismo producto"
                          >
                            {it.availableVariants.map((v) => {
                              const origRes = v.id === it.variantId ? it.originalReservedInTicket : 0;
                              const avail = v.stockStore - (v.stockReserved || 0) + origRes;
                              const isCur = v.id === it.variantId;
                              return (
                                <option key={v.id} value={v.id} disabled={avail <= 0 && !isCur}>
                                  Talle {v.size} ({avail} disp. {isCur ? "• Actual" : ""})
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-800 border border-slate-200">
                            Talle {it.size}
                          </span>
                        )}
                      </div>

                      {/* CONTROL DE CANTIDAD CON BOTONES E INPUT NUMÉRICO DIRECTO */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Cantidad</span>
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(it.rowId, it.quantity - 1)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded transition-colors"
                            title="Disminuir cantidad"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={maxAvailable}
                            value={it.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                handleUpdateQuantity(it.rowId, val);
                              }
                            }}
                            className="w-10 text-center font-mono font-bold text-xs text-slate-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={it.quantity >= maxAvailable}
                            onClick={() => handleUpdateQuantity(it.rowId, it.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-emerald-600 disabled:opacity-30 rounded transition-colors"
                            title="Aumentar cantidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* BOTÓN DE DESCUENTO POR RENGLÓN */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Desc.</span>
                        <button
                          type="button"
                          onClick={() => handleOpenRowDiscountModal(it)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            hasDiscount
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                              : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                          }`}
                          title={hasDiscount ? "Modificar o quitar descuento" : "Aplicar descuento a este renglón"}
                        >
                          <Percent className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* SUB-TOTAL */}
                      <div className="flex flex-col items-end min-w-[75px]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Subtotal</span>
                        <span className="font-mono font-bold text-slate-950 text-xs mt-1">
                          {formatCurrency(rowSubtotal)}
                        </span>
                      </div>

                      {/* QUITAR RENGLÓN */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(it.rowId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors mt-3 sm:mt-0"
                        title="Quitar prenda del ticket y liberar stock"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* NOTAS Y DESCUENTO GLOBAL                                  */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Observaciones del Ticket:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Cliente probó y cambió de talle en mostrador..."
                className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">
                  Descuento Global del Ticket
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {globalDiscount && globalDiscount.value > 0
                    ? `${globalDiscount.type === "PERCENTAGE" ? `${globalDiscount.value}%` : formatCurrency(globalDiscount.value)} aplicado`
                    : "Sin descuento global"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenGlobalDiscountModal}
                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{globalDiscount ? "Modificar" : "+ Añadir"}</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RESUMEN ECONÓMICO DESTACADO                               */}
          {/* ========================================================= */}
          <div className="bg-emerald-950 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-emerald-800">
            <div className="space-y-1 text-xs text-emerald-200">
              <div className="flex items-center gap-3">
                <span>Subtotal Bruto:</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(totals.subtotalGross)}
                </span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex items-center gap-3 text-emerald-300 font-semibold">
                  <span>Descuentos Aplicados:</span>
                  <span className="font-mono">-{formatCurrency(totals.totalDiscount)}</span>
                </div>
              )}
              <div className="text-[11px] text-emerald-300/80">
                {items.length} prenda{items.length !== 1 ? "s" : ""} • {items.reduce((acc, i) => acc + i.quantity, 0)} unidades
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-emerald-800/80">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                Nuevo Total a Cobrar
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#00D615] tracking-tight">
                {formatCurrency(totals.totalNet)}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BARRA INFERIOR DE ACCIONES                                */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {onCancelTicket && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setConfirmCancelModal(true)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                title="Descartar el ticket y devolver todo el stock reservado al salón"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Cancelar Preventa Completa</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Descartar Cambios
            </button>

            <button
              type="button"
              disabled={isSaving || items.length === 0}
              onClick={() => handleSaveTicket(false)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {isSaving ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Guardar Cambios</span>
            </button>

            <button
              type="button"
              disabled={isSaving || items.length === 0}
              onClick={() => handleSaveTicket(true)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Banknote className="w-4 h-4" />
              <span>Guardar y Cobrar</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN PARA CANCELAR PREVENTA */}
      {confirmCancelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                ¿Cancelar Preventa {ticket.ticketCode}?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Esta acción eliminará el ticket de la caja y liberará inmediatamente todo el stock reservado en el salón de Saavedra 241.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmCancelModal(false);
                  if (onCancelTicket) {
                    onCancelTicket(ticket.id, ticket.ticketCode);
                  }
                  onClose();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Sí, Cancelar Preventa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEDICADO DE DESCUENTO (PRENDA INDIVIDUAL O GLOBAL) */}
      {discountModalConfig && (
        <DiscountDialog
          config={discountModalConfig}
          onClose={() => setDiscountModalConfig(null)}
          onApply={handleApplyDiscountFromModal}
        />
      )}
    </div>
  );
}

// =========================================================================
// SUBCOMPONENTE MODAL DEDICADO DE DESCUENTO
// =========================================================================
interface DiscountDialogProps {
  config: {
    isOpen: boolean;
    isGlobal: boolean;
    rowId?: string;
    productName: string;
    originalAmount: number;
    currentType: DiscountType;
    currentValue: number;
  };
  onClose: () => void;
  onApply: (
    type: DiscountType,
    value: number,
    isGlobal: boolean,
    rowId?: string
  ) => void;
}

function DiscountDialog({ config, onClose, onApply }: DiscountDialogProps) {
  const [type, setType] = useState<DiscountType>(config.currentType);
  const [valueInput, setValueInput] = useState<string>(
    config.currentValue > 0 ? String(config.currentValue) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const numVal = parseFloat(valueInput) || 0;
  const isOverPercentage = type === "PERCENTAGE" && numVal > 100;
  const isOverFixed = type === "FIXED" && numVal > config.originalAmount;
  const isNegative = numVal < 0;
  const hasValidationError = isOverPercentage || isOverFixed || isNegative;

  // Cálculo en vivo
  let calculatedDiscount = 0;
  if (type === "PERCENTAGE") {
    const pct = Math.min(100, Math.max(0, numVal));
    calculatedDiscount = Math.round(((config.originalAmount * pct) / 100) * 100) / 100;
  } else {
    calculatedDiscount = Math.min(config.originalAmount, Math.max(0, numVal));
  }
  const finalAmount = Math.max(0, config.originalAmount - calculatedDiscount);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isNegative) {
      setError("El descuento no puede ser negativo.");
      return;
    }
    if (isOverPercentage) {
      setError("El porcentaje no puede ser mayor al 100%.");
      return;
    }
    if (isOverFixed) {
      setError(`El descuento fijo no puede superar el monto original (${formatCurrency(config.originalAmount)}).`);
      return;
    }

    onApply(type, numVal, config.isGlobal, config.rowId);
  };

  const percentagePresets = [5, 10, 15, 20, 25, 50];
  const fixedPresets = [500, 1000, 2000, 5000, 10000].filter(
    (p) => p <= config.originalAmount
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-70 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5">
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                config.isGlobal
                  ? "bg-purple-100 text-purple-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {config.isGlobal ? (
                <Tag className="w-5 h-5" />
              ) : (
                <Percent className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {config.isGlobal
                  ? "Descuento Global del Ticket"
                  : "Descuento por Prenda"}
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {config.productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selector de Tipo (Tabs) */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase">
            Tipo de Descuento
          </label>
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                if (type !== "PERCENTAGE") {
                  setType("PERCENTAGE");
                  setValueInput("");
                  setError(null);
                }
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === "PERCENTAGE"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Porcentaje (%)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (type !== "FIXED") {
                  setType("FIXED");
                  setValueInput("");
                  setError(null);
                }
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                type === "FIXED"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Monto Fijo ($)</span>
            </button>
          </div>
        </div>

        {/* Formulario y Campo de Entrada */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                {type === "PERCENTAGE" ? "Porcentaje de Descuento" : "Monto a Descontar"}
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Base: {formatCurrency(config.originalAmount)}
              </span>
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                step="any"
                min="0"
                max={type === "PERCENTAGE" ? 100 : config.originalAmount}
                value={valueInput}
                onChange={(e) => {
                  setValueInput(e.target.value);
                  setError(null);
                }}
                placeholder={type === "PERCENTAGE" ? "Ej: 15" : "Ej: 2000"}
                className={`w-full text-base font-bold font-mono px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  hasValidationError
                    ? "border-rose-400 focus:ring-rose-500 text-rose-700 bg-rose-50/30"
                    : "border-slate-200 focus:ring-emerald-500"
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {type === "PERCENTAGE" ? "%" : "ARS"}
              </div>
            </div>
            {isOverPercentage && (
              <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                El porcentaje no puede ser mayor al 100%.
              </p>
            )}
            {isOverFixed && (
              <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                El descuento fijo no puede superar el monto original ({formatCurrency(config.originalAmount)}).
              </p>
            )}
            {error && !isOverPercentage && !isOverFixed && (
              <p className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>

          {/* Atajos / Presets */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {type === "PERCENTAGE"
              ? percentagePresets.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setValueInput(String(pct));
                      setError(null);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                      numVal === pct
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200"
                    }`}
                  >
                    {pct}%
                  </button>
                ))
              : fixedPresets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setValueInput(String(amt));
                      setError(null);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold font-mono rounded-lg border transition-colors ${
                      numVal === amt
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200"
                    }`}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
          </div>

          {/* Tarjeta de Cálculo Resultante en Vivo */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Monto Base:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(config.originalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
              <span>Descuento Calculado:</span>
              <span className="font-mono">-{formatCurrency(calculatedDiscount)}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Total Resultante:</span>
              <span className="font-mono text-emerald-600 text-sm">
                {formatCurrency(finalAmount)}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {config.currentValue > 0 && (
                <button
                  type="button"
                  onClick={() => onApply(type, 0, config.isGlobal, config.rowId)}
                  className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                >
                  Quitar Descuento
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={hasValidationError || numVal <= 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                Aplicar Descuento
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
