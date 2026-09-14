"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowRightLeft,
  PlusCircle,
  MinusCircle,
  PackagePlus,
  RotateCcw,
  Store,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Layers,
  HelpCircle,
} from "lucide-react";
import { DetailedProductItem, ProductVariantItem } from "./types";
import {
  registerStockMovement,
  transferStockInternal,
  exchangeProductSize,
} from "@/server/actions/inventoryActions";

export interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: DetailedProductItem;
  onSuccess: () => void;
  initialOperationType?: OperationType;
  initialVariantId?: string;
}

export type OperationType =
  | "TRANSFERENCIA_INTERNA"
  | "INGRESO_COMPRA"
  | "AJUSTE_INGRESO"
  | "AJUSTE_EGRESO"
  | "DEVOLUCION_CLIENTE";

export function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  onSuccess,
  initialOperationType,
  initialVariantId,
}: StockAdjustmentModalProps) {
  const variants = product.variants || [];

  // Estados del formulario
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [exchangeVariantId, setExchangeVariantId] = useState<string>("");
  const [isExchangeMode, setIsExchangeMode] = useState<boolean>(true);
  const [operationType, setOperationType] = useState<OperationType>(
    initialOperationType || "TRANSFERENCIA_INTERNA"
  );
  const [targetLocation, setTargetLocation] = useState<"STORE" | "WAREHOUSE">("STORE");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [reason, setReason] = useState("");

  // Referencia al textarea de motivo para enfocar en caso de error
  const reasonInputRef = useRef<HTMLTextAreaElement>(null);

  // Estados de feedback, validación y confirmación
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inicializar la variante seleccionada y modo al abrir
  useEffect(() => {
    if (isOpen) {
      // Determinar variante inicial según prop o fallback a primera variante
      const matchedVariant = initialVariantId
        ? variants.find((v) => v.id === initialVariantId)
        : null;
      const targetId = matchedVariant?.id || (variants.length > 0 && variants[0].id ? variants[0].id : "");

      if (targetId) {
        setSelectedVariantId(targetId);
        const otherVariant = variants.find((v) => v.id !== targetId);
        setExchangeVariantId(otherVariant?.id || "");
      } else {
        setSelectedVariantId("");
        setExchangeVariantId("");
      }

      setIsExchangeMode(variants.length > 1);
      setOperationType(initialOperationType || "TRANSFERENCIA_INTERNA");
      setTargetLocation("STORE");
      setQuantity(1);
      setReason("");
      setHasAttemptedSubmit(false);
      setIsConfirmModalOpen(false);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, product, initialOperationType, initialVariantId]);

  // Manejar cambio del talle devuelto asegurando que el entregado no sea el mismo
  const handleReturnVariantChange = (newReturnId: string) => {
    setSelectedVariantId(newReturnId);
    if (exchangeVariantId === newReturnId) {
      const fallback = variants.find((v) => v.id !== newReturnId);
      if (fallback?.id) {
        setExchangeVariantId(fallback.id);
      }
    }
  };

  // Temporizador para auto-ocultar mensajes emergentes flotantes a los 5 segundos
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  if (!isOpen) return null;

  // Determinar si el cambio de talle dual está activo
  const isExchangeActive =
    operationType === "DEVOLUCION_CLIENTE" && isExchangeMode && variants.length > 1;

  // Determinar si el campo motivo es requerido por auditoría contable
  const isReasonRequired =
    operationType === "AJUSTE_EGRESO" ||
    operationType === "AJUSTE_INGRESO" ||
    operationType === "DEVOLUCION_CLIENTE";

  // Mostrar mensaje de error si se intentó enviar sin completar el motivo requerido
  const showReasonError = isReasonRequired && hasAttemptedSubmit && !reason.trim();

  // Variante principal (devuelta o a modificar)
  const currentVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const currentStoreStock = currentVariant?.stockStore || 0;
  const currentWarehouseStock = currentVariant?.stockWarehouse || 0;
  const numQty = typeof quantity === "number" ? quantity : 0;

  // Variante a entregar (para cambio de talle)
  const exchangeVariantsList = variants.filter((v) => v.id !== selectedVariantId);
  const exchangeVariant =
    variants.find((v) => v.id === exchangeVariantId && v.id !== selectedVariantId) ||
    exchangeVariantsList[0];

  const currentExchangeStoreStock = exchangeVariant?.stockStore || 0;
  const currentExchangeWarehouseStock = exchangeVariant?.stockWarehouse || 0;
  const currentExchangeLocStock =
    targetLocation === "STORE" ? currentExchangeStoreStock : currentExchangeWarehouseStock;

  const hasInsufficientExchangeStock =
    isExchangeActive && currentExchangeLocStock < numQty;

  // Calcular stock simulado resultante
  let simStore = currentStoreStock;
  let simWarehouse = currentWarehouseStock;
  let simExchangeStore = currentExchangeStoreStock;
  let simExchangeWarehouse = currentExchangeWarehouseStock;

  if (isExchangeActive) {
    if (targetLocation === "STORE") {
      simStore = currentStoreStock + numQty;
      simExchangeStore = Math.max(0, currentExchangeStoreStock - numQty);
    } else {
      simWarehouse = currentWarehouseStock + numQty;
      simExchangeWarehouse = Math.max(0, currentExchangeWarehouseStock - numQty);
    }
  } else if (operationType === "TRANSFERENCIA_INTERNA") {
    simStore = currentStoreStock + numQty;
    simWarehouse = Math.max(0, currentWarehouseStock - numQty);
  } else if (
    operationType === "INGRESO_COMPRA" ||
    operationType === "AJUSTE_INGRESO" ||
    operationType === "DEVOLUCION_CLIENTE"
  ) {
    if (targetLocation === "STORE") {
      simStore = currentStoreStock + numQty;
    } else {
      simWarehouse = currentWarehouseStock + numQty;
    }
  } else if (operationType === "AJUSTE_EGRESO") {
    if (targetLocation === "STORE") {
      simStore = Math.max(0, currentStoreStock - numQty);
    } else {
      simWarehouse = Math.max(0, currentWarehouseStock - numQty);
    }
  }

  // Ejecución atómica del Cambio de Talle tras la confirmación explícita
  const handleConfirmExchange = async () => {
    if (!exchangeVariant?.id) return;
    setIsSubmitting(true);
    try {
      const res = await exchangeProductSize({
        returnVariantId: selectedVariantId,
        exchangeVariantId: exchangeVariant.id,
        quantity: numQty,
        targetLocation,
        reason: reason.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || "No se pudo procesar el cambio de talle.");
        setIsSubmitting(false);
        setIsConfirmModalOpen(false);
        return;
      }

      setIsConfirmModalOpen(false);
      setSuccessMessage(res.message || "Cambio de talle procesado con éxito.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error("Error al procesar cambio de talle:", err);
      setErrorMessage("Ocurrió un error inesperado al procesar el cambio de talle.");
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedVariantId) {
      setErrorMessage("Por favor selecciona una variante (talle y color).");
      return;
    }

    if (numQty <= 0) {
      setErrorMessage("La cantidad debe ser un número entero mayor a 0.");
      return;
    }

    // Validar motivo obligatorio para auditoría contable con feedback visual en el campo
    if (isReasonRequired && !reason.trim()) {
      setHasAttemptedSubmit(true);
      reasonInputRef.current?.focus();
      setErrorMessage("Debes completar el motivo o número de ticket para la auditoría contable.");
      return;
    }

    // 1. Manejo específico para CAMBIO DE TALLE DUAL (Pide confirmación)
    if (isExchangeActive) {
      if (!exchangeVariant?.id) {
        setErrorMessage("Por favor selecciona el talle que se entregará al cliente.");
        return;
      }
      if (selectedVariantId === exchangeVariant.id) {
        setErrorMessage("El talle entregado no puede ser idéntico al talle devuelto.");
        return;
      }
      if (currentExchangeLocStock < numQty) {
        const locationName = targetLocation === "STORE" ? "Salón Saavedra 241" : "Depósito Central";
        setErrorMessage(
          `Stock insuficiente en ${locationName} para entregar el Talle ${exchangeVariant.size}. Disponible: ${currentExchangeLocStock} un., Solicitado: ${numQty} un.`
        );
        return;
      }

      // Abre el modal de confirmación
      setIsConfirmModalOpen(true);
      return;
    }

    // 2. Validaciones para operaciones tradicionales
    if (operationType === "TRANSFERENCIA_INTERNA") {
      if (currentWarehouseStock < numQty) {
        setErrorMessage(
          `Stock insuficiente en Depósito para transferir. Disponible: ${currentWarehouseStock} un., Solicitado: ${numQty} un.`
        );
        return;
      }
    }

    if (operationType === "AJUSTE_EGRESO") {
      const available = targetLocation === "STORE" ? currentStoreStock : currentWarehouseStock;
      const locationName = targetLocation === "STORE" ? "Salón Saavedra 241" : "Depósito Central";
      if (available < numQty) {
        setErrorMessage(
          `No se puede egresar más de lo disponible en ${locationName}. Disponible: ${available} un., Solicitado: ${numQty} un.`
        );
        return;
      }
    }

    // Validar motivo para auditoría contable
    if (
      (operationType === "AJUSTE_INGRESO" ||
        operationType === "AJUSTE_EGRESO" ||
        operationType === "DEVOLUCION_CLIENTE") &&
      !reason.trim()
    ) {
      setErrorMessage("Debes especificar el motivo o justificación para este tipo de movimiento.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (operationType === "TRANSFERENCIA_INTERNA") {
        const res = await transferStockInternal({
          variantId: selectedVariantId,
          quantity: numQty,
          reason: reason.trim() || `Reposición a Salón (${numQty} un.)`,
          fromLocation: "WAREHOUSE",
          toLocation: "STORE",
        });

        if (!res.success) {
          setErrorMessage(res.error || "No se pudo realizar el traslado interno.");
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage(res.message || "Traslado completado con éxito.");
      } else {
        const res = await registerStockMovement({
          variantId: selectedVariantId,
          type: operationType,
          quantity: numQty,
          targetLocation,
          reason: reason.trim() || `Movimiento manual: ${operationType}`,
        });

        if (!res.success) {
          setErrorMessage(res.error || "No se pudo registrar el movimiento de stock.");
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage(res.message || "Movimiento registrado con éxito.");
      }

      // Éxito: esperar un breve instante para feedback y refrescar
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error("Error al procesar movimiento de stock:", err);
      setErrorMessage("Ocurrió un error inesperado al actualizar el stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-xl rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ventanita Emergente Flotante (Toast) de Error con auto-cierre de 5s y botón X */}
        {errorMessage && (
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-50 animate-in slide-in-from-top-3 fade-in duration-200 shadow-2xl">
            <div className="p-3.5 bg-rose-950/95 backdrop-blur-md text-white rounded-2xl border border-rose-600/80 flex items-start justify-between gap-3 shadow-xl">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-rose-900 text-rose-200 border border-rose-700/60 shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-rose-100 flex items-center gap-2">
                    <span>Aviso de Inventario</span>
                    <span className="text-[10px] text-rose-300/80 font-normal bg-rose-900/60 px-1.5 py-0.5 rounded-md">
                      se cerrará en 5s
                    </span>
                  </div>
                  <div className="text-xs text-rose-200 font-medium mt-0.5 leading-snug">
                    {errorMessage}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 text-rose-300 hover:text-white hover:bg-rose-800/80 rounded-lg transition-colors shrink-0 active:scale-95"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Ventanita Emergente Flotante (Toast) de Éxito con auto-cierre de 5s y botón X */}
        {successMessage && (
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-50 animate-in slide-in-from-top-3 fade-in duration-200 shadow-2xl">
            <div className="p-3.5 bg-slate-950/95 backdrop-blur-md text-white rounded-2xl border border-emerald-500/60 flex items-start justify-between gap-3 shadow-xl">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-emerald-950 text-[#c2f25b] border border-emerald-700/60 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#c2f25b] flex items-center gap-2">
                    <span>Operación Exitosa</span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium mt-0.5 leading-snug">
                    {successMessage}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0 active:scale-95"
                title="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-emerald-950 text-[#c2f25b] flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Control y Movimientos de Stock
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                {product.name} ({product.brand})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* 1. Selector de Variante (Talle y Color) */}
          <div>
            <label className="text-slate-700 font-semibold mb-1.5 flex items-center justify-between">
              <span>
                {isExchangeActive
                  ? "1. Talle devuelto por el cliente (Reingresará al stock)"
                  : "Variante / Talle a Modificar"}{" "}
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                {variants.length} variante(s) disponibles
              </span>
            </label>

            <div className="grid grid-cols-1 gap-2">
              <select
                value={selectedVariantId}
                onChange={(e) => handleReturnVariantChange(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 font-semibold"
                required
              >
                {variants.map((v) => (
                  <option key={v.id || v.sku} value={v.id}>
                    Talle: {v.size} | Color: {v.color} — [Salón: {v.stockStore} un. | Depósito: {v.stockWarehouse} un.]
                  </option>
                ))}
              </select>
            </div>

            {/* Badge de stock actual de la variante seleccionada */}
            {currentVariant && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11.5px]">
                <div className="flex items-center gap-2 text-slate-600">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Código SKU: <strong className="font-mono text-slate-800">{currentVariant.sku || "N/A"}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">Salón: {currentStoreStock} un.</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-700 font-bold">Depósito: {currentWarehouseStock} un.</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Selector de Operación (Botones tipo Card) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2">
              Tipo de Movimiento <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Opción 1: Traslado Interno (Depósito -> Salón) - Ámbar */}
              <button
                type="button"
                onClick={() => setOperationType("TRANSFERENCIA_INTERNA")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  operationType === "TRANSFERENCIA_INTERNA"
                    ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>Traslado Interno</span>
                    <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                      Reposición
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Depósito Central ➔ Salón Saavedra 241
                  </div>
                </div>
              </button>

              {/* Opción 2: Ingreso por Compra - Verde esmeralda */}
              <button
                type="button"
                onClick={() => setOperationType("INGRESO_COMPRA")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  operationType === "INGRESO_COMPRA"
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Ingreso por Compra
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Reabastecimiento de proveedor (+ stock)
                  </div>
                </div>
              </button>

              {/* Opción 3: Ajuste Positivo - Teal */}
              <button
                type="button"
                onClick={() => setOperationType("AJUSTE_INGRESO")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  operationType === "AJUSTE_INGRESO"
                    ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-2 rounded-lg bg-teal-100 text-teal-800 shrink-0 mt-0.5">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Ajuste Conteo (+)
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Sobrante detectado en inventario físico
                  </div>
                </div>
              </button>

              {/* Opción 4: Ajuste Negativo / Merma - Rosa / Rojo */}
              <button
                type="button"
                onClick={() => setOperationType("AJUSTE_EGRESO")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  operationType === "AJUSTE_EGRESO"
                    ? "bg-rose-50 border-rose-500 ring-2 ring-rose-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-2 rounded-lg bg-rose-100 text-rose-800 shrink-0 mt-0.5">
                  <MinusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Merma / Ajuste (-)
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Pérdida, rotura o egreso justificado
                  </div>
                </div>
              </button>

              {/* Opción 5: Devolución de Cliente - Cian */}
              <button
                type="button"
                onClick={() => setOperationType("DEVOLUCION_CLIENTE")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 sm:col-span-2 ${
                  operationType === "DEVOLUCION_CLIENTE"
                    ? "bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-800 shrink-0 mt-0.5">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>Devolución de Cliente</span>
                    <span className="text-[9px] bg-cyan-200/80 text-cyan-900 px-1.5 py-0.2 rounded font-bold">
                      Cambio de Talle
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Reintegro por talle incorrecto o falla de fabricación
                  </div>
                </div>
              </button>
            </div>

            {/* Sub-selector de modalidad y talle a entregar para Devolución / Cambio de Talle */}
            {operationType === "DEVOLUCION_CLIENTE" && (
              <div className="mt-3 p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                    Modalidad en Mostrador
                  </span>
                  {variants.length <= 1 && (
                    <span className="text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full font-bold">
                      Talle Único (Solo Devolución)
                    </span>
                  )}
                </div>

                {variants.length > 1 ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsExchangeMode(true)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isExchangeMode
                          ? "bg-white border-amber-500 shadow-xs ring-2 ring-amber-500/20 text-slate-900 font-bold"
                          : "bg-amber-100/40 border-amber-200/80 text-amber-800 hover:bg-white"
                      }`}
                    >
                      <div className="text-xs flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Cambio de Talle</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500 mt-0.5 leading-tight">
                        Reingresa este talle y entrega otro del producto
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsExchangeMode(false)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        !isExchangeMode
                          ? "bg-white border-amber-500 shadow-xs ring-2 ring-amber-500/20 text-slate-900 font-bold"
                          : "bg-amber-100/40 border-amber-200/80 text-amber-800 hover:bg-white"
                      }`}
                    >
                      <div className="text-xs flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Solo Devolución</span>
                      </div>
                      <p className="text-[10px] font-normal text-slate-500 mt-0.5 leading-tight">
                        Reingresa a stock (sin entregar otro talle)
                      </p>
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800 leading-snug">
                    Este producto cuenta con una única variante de talle. Se registrará únicamente como reingreso al stock.
                  </p>
                )}

                {/* Si es Cambio de Talle: Selector del Talle a Entregar */}
                {isExchangeActive && (
                  <div className="pt-2.5 border-t border-amber-200/70 space-y-2">
                    <label className="text-slate-800 font-bold text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10.5px] font-bold shrink-0">
                          2
                        </span>
                        <span>
                          Talle a Entregar al Cliente (Se descontará del stock) <span className="text-rose-500">*</span>
                        </span>
                      </span>
                      <span className="text-[10.5px] font-normal text-slate-500">
                        {exchangeVariantsList.length} opción(es) disponibles
                      </span>
                    </label>

                    <select
                      value={exchangeVariant?.id || ""}
                      onChange={(e) => setExchangeVariantId(e.target.value)}
                      className="w-full bg-white text-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-semibold text-xs shadow-2xs"
                      required
                    >
                      {exchangeVariantsList.map((v) => {
                        const stockInLoc = targetLocation === "STORE" ? v.stockStore : v.stockWarehouse;
                        return (
                          <option key={v.id || v.sku} value={v.id}>
                            Talle: {v.size} | Color: {v.color} — [{targetLocation === "STORE" ? "Salón" : "Depósito"}: {stockInLoc} un. disponible(s)]
                          </option>
                        );
                      })}
                    </select>

                    {/* Badge de stock y verificación en tiempo real */}
                    {exchangeVariant && (
                      <div className="mt-1 flex items-center justify-between text-[11.5px] pt-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span className="font-semibold text-slate-700">Stock a entregar:</span>
                          <span className="text-emerald-700 font-bold">Salón: {exchangeVariant.stockStore} un.</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700 font-bold">Depósito: {exchangeVariant.stockWarehouse} un.</span>
                        </div>

                        {hasInsufficientExchangeStock ? (
                          <span className="text-rose-700 font-bold bg-rose-100/90 border border-rose-300 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            Sin stock en {targetLocation === "STORE" ? "Salón" : "Depósito"}
                          </span>
                        ) : (
                          <span className="text-emerald-800 font-bold bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Stock suficiente ({currentExchangeLocStock} un.)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Selector de Ubicación Destino (si no es transferencia fija) */}
          {operationType !== "TRANSFERENCIA_INTERNA" && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Ubicación del Movimiento <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetLocation("STORE")}
                  className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                    targetLocation === "STORE"
                      ? "bg-emerald-50 border-emerald-500 font-bold text-emerald-900"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Salón Saavedra 241</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetLocation("WAREHOUSE")}
                  className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 ${
                    targetLocation === "WAREHOUSE"
                      ? "bg-slate-900 border-slate-900 font-bold text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Depósito Central</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Cantidad & Quick Buttons */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Cantidad de Unidades <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-32 bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 font-bold text-sm text-center"
                required
              />

              {/* Botones de incremento rápido */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 5, 10, 20].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setQuantity(inc)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {inc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Motivo / Justificación */}
          <div>
            <label className="text-slate-700 font-semibold mb-1.5 flex items-center justify-between">
              <span>
                Motivo / Justificación{" "}
                {isReasonRequired ? (
                  <span className="text-rose-500 font-bold">* (Requerido para auditoría)</span>
                ) : (
                  <span className="text-slate-400 font-normal">(Opcional)</span>
                )}
              </span>
              {isReasonRequired && (
                <span className="text-[10px] text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                  Auditoría Contable
                </span>
              )}
            </label>

            <textarea
              ref={reasonInputRef}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (hasAttemptedSubmit && e.target.value.trim()) {
                  setErrorMessage(null);
                }
              }}
              rows={2}
              placeholder={
                isExchangeActive
                  ? "Ej: Cambio de talle M por L, Ticket #48291..."
                  : operationType === "TRANSFERENCIA_INTERNA"
                  ? "Ej: Reposición de fin de semana para vidriera Saavedra 241..."
                  : operationType === "DEVOLUCION_CLIENTE"
                  ? "Ej: Devolución directa de cliente Ticket #48291..."
                  : "Detalla la causa del ajuste de stock para registro contable..."
              }
              className={`w-full text-slate-900 px-3.5 py-2 rounded-xl border font-medium resize-none text-xs transition-all ${
                showReasonError
                  ? "bg-rose-50/50 border-rose-400 ring-2 ring-rose-400/20 focus:outline-none focus:border-rose-500 focus:bg-white"
                  : "bg-slate-50 border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500"
              }`}
            />

            {/* Mensaje de validación reactivo para auditoría */}
            {showReasonError ? (
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-[11px] mt-1.5 p-2 bg-rose-50 border border-rose-200/90 rounded-xl animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>
                  El campo de auditoría es obligatorio: ingresa el motivo o número de ticket para registrar el movimiento.
                </span>
              </div>
            ) : isReasonRequired ? (
              <div className="flex items-center gap-1 text-[10.5px] text-slate-400 mt-1">
                <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Obligatorio: quedará asentado en el historial de trazabilidad de stock.</span>
              </div>
            ) : null}
          </div>

          {/* 6. Previsualización del Stock Resultante */}
          {isExchangeActive ? (
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 rounded-2xl border border-emerald-200/90 text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                <span className="text-[10.5px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-700" />
                  Simulación Doble: Cambio de Talle
                </span>
                <span className="text-[10.5px] text-slate-500 font-medium">
                  Ubicación:{" "}
                  <strong className="text-slate-800 font-semibold">
                    {targetLocation === "STORE" ? "Salón Saavedra 241" : "Depósito Central"}
                  </strong>
                </span>
              </div>

              {/* Fila 1: Talle Devuelto */}
              <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                    +{numQty} REINGRESO
                  </span>
                  <span className="text-slate-800 font-bold">
                    Talle {currentVariant?.size || "-"} ({currentVariant?.color || "-"})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-[9.5px] text-slate-400 block">Antes</span>
                    <span className="text-slate-600 font-semibold">
                      {targetLocation === "STORE" ? currentStoreStock : currentWarehouseStock} un.
                    </span>
                  </div>
                  <span className="text-emerald-600 font-bold">➔</span>
                  <div>
                    <span className="text-[9.5px] text-emerald-600 block font-bold">Después</span>
                    <span className="font-bold text-emerald-800">
                      {targetLocation === "STORE" ? simStore : simWarehouse} un.
                    </span>
                  </div>
                </div>
              </div>

              {/* Fila 2: Talle Entregado */}
              <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-xl border border-rose-100 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-[10px]">
                    -{numQty} ENTREGA
                  </span>
                  <span className="text-slate-800 font-bold">
                    Talle {exchangeVariant?.size || "-"} ({exchangeVariant?.color || "-"})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-[9.5px] text-slate-400 block">Antes</span>
                    <span className="text-slate-600 font-semibold">{currentExchangeLocStock} un.</span>
                  </div>
                  <span className="text-rose-600 font-bold">➔</span>
                  <div>
                    <span className="text-[9.5px] text-rose-600 block font-bold">Después</span>
                    <span
                      className={`font-bold ${
                        hasInsufficientExchangeStock ? "text-rose-600" : "text-slate-800"
                      }`}
                    >
                      {targetLocation === "STORE" ? simExchangeStore : simExchangeWarehouse} un.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Simulación Stock Posterior
                </span>
                <span className="text-slate-500 text-[11px]">
                  {product.name} (Talle {currentVariant?.size || "-"})
                </span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="text-[10px] text-slate-500 block">Salón</span>
                  <span className="font-bold text-emerald-800 text-xs">{simStore} un.</span>
                </div>
                <div className="h-6 w-px bg-emerald-200" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Depósito</span>
                  <span className="font-bold text-slate-700 text-xs">{simWarehouse} un.</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Modal */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (isExchangeActive && hasInsufficientExchangeStock)}
              className={`font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                isExchangeActive && hasInsufficientExchangeStock
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-[#c2f25b] hover:bg-[#b0e838] active:scale-95 text-slate-950"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  {isExchangeActive ? (
                    <ArrowRightLeft className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isExchangeActive ? "Confirmar Cambio de Talle" : "Confirmar Movimiento"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Confirmación Flotante para Cambio de Talle */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-md rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">
                  ¿Confirmar Cambio de Talle?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {product.name} ({product.brand})
                </p>
              </div>
            </div>

            {/* Resumen del Movimiento Doble */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-slate-500 font-medium">Ubicación del intercambio:</span>
                <span className="font-bold text-slate-800">
                  {targetLocation === "STORE" ? "Salón Saavedra 241" : "Depósito Central"}
                </span>
              </div>

              <div className="h-px bg-slate-200/70" />

              {/* Talle que reingresa */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Reingresa al stock (+{numQty} un.):
                </span>
                <span className="font-bold text-slate-900">
                  Talle {currentVariant?.size} ({currentVariant?.color})
                </span>
              </div>

              {/* Talle que se entrega */}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Se entrega al cliente (-{numQty} un.):
                </span>
                <span className="font-bold text-slate-900">
                  Talle {exchangeVariant?.size} ({exchangeVariant?.color})
                </span>
              </div>

              <div className="h-px bg-slate-200/70" />

              {/* Motivo de Auditoría */}
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">
                  Motivo asentado en auditoría:
                </span>
                <p className="font-mono text-[11.5px] text-slate-800 bg-white p-2 rounded-lg border border-slate-200 mt-1 break-words">
                  {reason.trim()}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Esta operación descontará el stock entregado y sumará el devuelto de forma atómica e inmediata en el sistema.
            </p>

            {/* Botones de Confirmación */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all"
              >
                Volver a revisar
              </button>

              <button
                type="button"
                onClick={handleConfirmExchange}
                disabled={isSubmitting}
                className="bg-[#c2f25b] hover:bg-[#b0e838] active:scale-95 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sí, confirmar cambio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

