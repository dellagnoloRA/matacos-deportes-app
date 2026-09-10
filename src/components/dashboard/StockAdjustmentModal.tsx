"use client";

import React, { useState, useEffect } from "react";
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
} from "@/server/actions/inventoryActions";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: DetailedProductItem;
  onSuccess: () => void;
}

type OperationType =
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
}: StockAdjustmentModalProps) {
  const variants = product.variants || [];

  // Estados del formulario
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [operationType, setOperationType] = useState<OperationType>("TRANSFERENCIA_INTERNA");
  const [targetLocation, setTargetLocation] = useState<"STORE" | "WAREHOUSE">("STORE");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [reason, setReason] = useState("");

  // Estados de feedback y envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Inicializar la variante seleccionada al abrir
  useEffect(() => {
    if (isOpen) {
      if (variants.length > 0 && variants[0].id) {
        setSelectedVariantId(variants[0].id);
      } else {
        setSelectedVariantId("");
      }
      setOperationType("TRANSFERENCIA_INTERNA");
      setTargetLocation("STORE");
      setQuantity(1);
      setReason("");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, product]);

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

  const currentVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const currentStoreStock = currentVariant?.stockStore || 0;
  const currentWarehouseStock = currentVariant?.stockWarehouse || 0;
  const numQty = typeof quantity === "number" ? quantity : 0;

  // Calcular stock simulado resultante
  let simStore = currentStoreStock;
  let simWarehouse = currentWarehouseStock;

  if (operationType === "TRANSFERENCIA_INTERNA") {
    simStore = currentStoreStock + numQty;
    simWarehouse = Math.max(0, currentWarehouseStock - numQty);
  } else if (operationType === "INGRESO_COMPRA" || operationType === "AJUSTE_INGRESO" || operationType === "DEVOLUCION_CLIENTE") {
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

    // Validar stock disponible para transferencias o egresos
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
              <span>Variante / Talle a Modificar <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">
                {variants.length} variante(s) disponibles
              </span>
            </label>

            <div className="grid grid-cols-1 gap-2">
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
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
              {/* Opción 1: Traslado Interno (Depósito -> Salón) */}
              <button
                type="button"
                onClick={() => setOperationType("TRANSFERENCIA_INTERNA")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  operationType === "TRANSFERENCIA_INTERNA"
                    ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>Traslado a Salón</span>
                    <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                      Reposición
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Depósito Central ➔ Salón Saavedra 241
                  </div>
                </div>
              </button>

              {/* Opción 2: Ingreso por Compra */}
              <button
                type="button"
                onClick={() => setOperationType("INGRESO_COMPRA")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  operationType === "INGRESO_COMPRA"
                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800 shrink-0 mt-0.5">
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

              {/* Opción 3: Ajuste Positivo */}
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

              {/* Opción 4: Ajuste Negativo / Merma */}
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

              {/* Opción 5: Devolución de Cliente */}
              <button
                type="button"
                onClick={() => setOperationType("DEVOLUCION_CLIENTE")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 sm:col-span-2 ${
                  operationType === "DEVOLUCION_CLIENTE"
                    ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Devolución / Cambio de Talle
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">
                    Reingreso de producto retornado por cliente en mostrador
                  </div>
                </div>
              </button>
            </div>
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
                {operationType === "AJUSTE_EGRESO" ||
                operationType === "AJUSTE_INGRESO" ||
                operationType === "DEVOLUCION_CLIENTE" ? (
                  <span className="text-rose-500">* (Requerido para auditoría)</span>
                ) : (
                  <span className="text-slate-400 font-normal">(Opcional)</span>
                )}
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder={
                operationType === "TRANSFERENCIA_INTERNA"
                  ? "Ej: Reposición de fin de semana para vidriera Saavedra 241..."
                  : operationType === "DEVOLUCION_CLIENTE"
                  ? "Ej: Cambio de talle Ticket #48291..."
                  : "Detalla la causa del ajuste de stock para registro contable..."
              }
              className="w-full bg-slate-50 text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium resize-none text-xs"
              required={
                operationType === "AJUSTE_EGRESO" ||
                operationType === "AJUSTE_INGRESO" ||
                operationType === "DEVOLUCION_CLIENTE"
              }
            />
          </div>

          {/* 6. Previsualización del Stock Resultante */}
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
              disabled={isSubmitting}
              className="bg-[#c2f25b] hover:bg-[#b0e838] active:scale-95 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Movimiento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

