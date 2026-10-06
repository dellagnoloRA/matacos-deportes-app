"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  AlertTriangle,
  Lock,
  Unlock,
  Printer,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Calculator,
  User,
  Store,
  FileText,
  CreditCard,
  QrCode,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  openCashShift,
  registerCashMovement,
  closeCashShift,
  getCashShiftSummary,
} from "@/server/actions/cashShiftActions";
import { CashShiftTicketReceipt } from "@/server/services/cashShiftService";

// -------------------------------------------------------------------
// 1. MODAL: APERTURA DE TURNO DE CAJA
// -------------------------------------------------------------------
interface OpenCashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalId: string;
  onSuccess: () => void;
  defaultCashiers?: string[];
}

export function OpenCashShiftModal({
  isOpen,
  onClose,
  terminalId,
  onSuccess,
  defaultCashiers = ["Cajero 1", "Cajero Mostrador"],
}: OpenCashShiftModalProps) {
  const [cashierName, setCashierName] = useState(defaultCashiers[0] || "");
  const [isCustomName, setIsCustomName] = useState(false);
  const [initialAmount, setInitialAmount] = useState<string>("10000");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(initialAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError("El fondo inicial debe ser un número mayor o igual a 0.");
      return;
    }

    if (!cashierName.trim()) {
      setError("Debe especificar el nombre del cajero responsable.");
      return;
    }

    setLoading(true);
    try {
      const res = await openCashShift({
        terminalId,
        userName: cashierName.trim(),
        initialAmount: parsedAmount,
        notes: notes.trim() || null,
      });

      if (!res.success) {
        setError(res.error || "Error al abrir la caja");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Unlock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Apertura de Turno de Caja</h2>
              <p className="text-emerald-100 text-xs font-mono">Terminal: {terminalId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Cajero */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Responsable / Cajero
            </label>
            {!isCustomName ? (
              <div className="space-y-2">
                <select
                  value={cashierName}
                  onChange={(e) => {
                    if (e.target.value === "__OTHER__") {
                      setIsCustomName(true);
                      setCashierName("");
                    } else {
                      setCashierName(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {defaultCashiers.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="__OTHER__">+ Ingresar otro nombre...</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre y Apellido"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomName(false);
                    setCashierName(defaultCashiers[0] || "");
                  }}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                >
                  Volver a lista
                </button>
              </div>
            )}
          </div>

          {/* Fondo de Cambio Inicial */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Fondo de Cambio Inicial (Efectivo en Cajón)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="10000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Dinero en billetes y monedas con el que se arranca el turno para dar vuelto.
            </p>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Observaciones (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Turno mañana Saavedra 241"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Botones */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              {loading ? "Abriendo..." : "Abrir Caja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 2. MODAL: MOVIMIENTOS INTERMEDIOS DE CAJA (GASTOS / RETIROS / INGRESOS)
// -------------------------------------------------------------------
interface CashMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashShiftId: string;
  currentAvailableCash: number;
  onSuccess: () => void;
  defaultPerformedBy?: string;
}

export function CashMovementModal({
  isOpen,
  onClose,
  cashShiftId,
  currentAvailableCash,
  onSuccess,
  defaultPerformedBy = "Cajero",
}: CashMovementModalProps) {
  const [type, setType] = useState<"GASTO_MENOR" | "RETIRO_CAJA_FUERTE" | "INGRESO_EXTRAORDINARIO">(
    "GASTO_MENOR"
  );
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [receiptNumber, setReceiptNumber] = useState<string>("");
  const [performedBy, setPerformedBy] = useState<string>(defaultPerformedBy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isWithdrawal = type === "GASTO_MENOR" || type === "RETIRO_CAJA_FUERTE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser un número mayor a 0.");
      return;
    }

    if (isWithdrawal && parsedAmount > currentAvailableCash + 0.05) {
      setError(
        `Fondo insuficiente: El egreso ($ ${parsedAmount.toFixed(
          2
        )}) supera el efectivo disponible en caja (${formatCurrency(currentAvailableCash)}).`
      );
      return;
    }

    if (!reason.trim()) {
      setError("El motivo del movimiento es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerCashMovement({
        cashShiftId,
        type,
        amount: parsedAmount,
        reason: reason.trim(),
        receiptNumber: receiptNumber.trim() || null,
        performedBy: performedBy.trim() || "Cajero",
      });

      if (!res.success) {
        setError(res.error || "Error al asentar el movimiento");
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="bg-indigo-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Movimiento de Caja</h2>
              <p className="text-indigo-100 text-xs">Egresos, Retiros e Ingresos Extraordinarios</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Efectivo Disponible en Cajón */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-900">Efectivo en Cajón actual:</span>
          <span className="text-sm font-extrabold text-indigo-700 font-mono">
            {formatCurrency(currentAvailableCash)}
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("GASTO_MENOR")}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === "GASTO_MENOR"
                    ? "bg-rose-50 border-rose-300 text-rose-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <span>Gasto Menor</span>
              </button>
              <button
                type="button"
                onClick={() => setType("RETIRO_CAJA_FUERTE")}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === "RETIRO_CAJA_FUERTE"
                    ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Caja Fuerte</span>
              </button>
              <button
                type="button"
                onClick={() => setType("INGRESO_EXTRAORDINARIO")}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                  type === "INGRESO_EXTRAORDINARIO"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Ingreso Extra</span>
              </button>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Importe en Pesos (ARS)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                $
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Motivo Obligatorio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Motivo / Concepto Obligatorio
            </label>
            <input
              type="text"
              placeholder="Ej: Pago de flete encomienda Topper / Compra de insumos limpieza"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Nro de Comprobante / Recibo y Responsable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                N° Comprobante (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: FAC-000123"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Responsable
              </label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Botones */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? "Asentando..." : "Registrar Movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 3. MODAL: CIERRE Y ARQUEO CIEGO DE CAJA ("BLIND AUDIT")
// -------------------------------------------------------------------
interface CloseCashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashShiftId: string;
  terminalId: string;
  onSuccess: (receipt: CashShiftTicketReceipt) => void;
}

export function CloseCashShiftModal({
  isOpen,
  onClose,
  cashShiftId,
  terminalId,
  onSuccess,
}: CloseCashShiftModalProps) {
  // Conteo ciego
  const [actualCash, setActualCash] = useState<string>("");
  const [actualDebit, setActualDebit] = useState<string>("");
  const [actualCredit, setActualCredit] = useState<string>("");
  const [actualTransfer, setActualTransfer] = useState<string>("");
  const [actualQr, setActualQr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Calculadora de Denominaciones de Billetes
  const [showDenominationCalc, setShowDenominationCalc] = useState(false);
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    20000: 0,
    10000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Actualizar total cuando cambia la calculadora
  const handleDenominationChange = (denom: number, count: number) => {
    const next = { ...denominations, [denom]: Math.max(0, count) };
    setDenominations(next);

    const total = Object.entries(next).reduce(
      (sum, [val, qty]) => sum + Number(val) * qty,
      0
    );
    setActualCash(total > 0 ? total.toString() : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cashNum = parseFloat(actualCash);
    if (isNaN(cashNum) || cashNum < 0) {
      setError("Debe ingresar el conteo físico de efectivo (mayor o igual a 0).");
      return;
    }

    setLoading(true);
    try {
      const res = await closeCashShift({
        cashShiftId,
        actualCash: cashNum,
        actualDebit: actualDebit ? parseFloat(actualDebit) : null,
        actualCredit: actualCredit ? parseFloat(actualCredit) : null,
        actualTransfer: actualTransfer ? parseFloat(actualTransfer) : null,
        actualQr: actualQr ? parseFloat(actualQr) : null,
        notes: notes.trim() || null,
      });

      if (!res.success) {
        setError(res.error || "Error al realizar el arqueo de caja.");
      } else {
        onSuccess(res.receipt!);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-8">
        {/* Cabecera */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Cierre y Arqueo Ciego de Caja</h2>
              <p className="text-slate-400 text-xs font-mono">Terminal: {terminalId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advertencia Arqueo Ciego */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            <strong>Auditoría a ciegas:</strong> Declare los montos reales contados físicamente en el
            cajón y cupones de terminales. El sistema revelará las diferencias al confirmar.
          </span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Conteo de Efectivo */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Efectivo Contado en Cajón (Obligatorio)
              </label>
              <button
                type="button"
                onClick={() => setShowDenominationCalc(!showDenominationCalc)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Calculator className="w-3.5 h-3.5" />
                {showDenominationCalc ? "Ocultar Calculadora" : "Desglosar Billetes"}
              </button>
            </div>

            {/* Calculadora por Denominación */}
            {showDenominationCalc && (
              <div className="mb-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-inner grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[20000, 10000, 2000, 1000, 500, 200, 100].map((denom) => (
                  <div key={denom} className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      $ {denom.toLocaleString("es-AR")}
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={denominations[denom] || ""}
                      onChange={(e) =>
                        handleDenominationChange(denom, parseInt(e.target.value) || 0)
                      }
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 text-center focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                $
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Medios Electrónicos y Cupones */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Cupones de Tarjeta y Medios Electrónicos (Cierre de Lote / Terminal)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  Cupones Débito ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={actualDebit}
                  onChange={(e) => setActualDebit(e.target.value)}
                  placeholder="Total Posnet Débito"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  Cupones Crédito ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={actualCredit}
                  onChange={(e) => setActualCredit(e.target.value)}
                  placeholder="Total Posnet Crédito"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  Transferencias Bancarias ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={actualTransfer}
                  onChange={(e) => setActualTransfer(e.target.value)}
                  placeholder="Total Transferencias"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-sky-600" />
                  QR Mercado Pago ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={actualQr}
                  onChange={(e) => setActualQr(e.target.value)}
                  placeholder="Total Cobros QR"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Observaciones / Justificación */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Observaciones del Cierre (Mandatorio si hay diferencia &gt; $500)
            </label>
            <textarea
              rows={2}
              placeholder="Explique aquí si hubo sobrante o faltante de cambio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* Botones */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              {loading ? "Auditando y Cerrando..." : "Cerrar y Auditar Caja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// 4. MODAL: COMPROBANTE TÉRMICO DE ARQUEO DE CAJA (80mm)
// -------------------------------------------------------------------
interface CashShiftTicketModalProps {
  receipt: CashShiftTicketReceipt | null;
  onClose: () => void;
}

export function CashShiftTicketModal({ receipt, onClose }: CashShiftTicketModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const isBalanced = receipt.summary.cashBalance.statusLabel === "CUADRADO";
  const isSurplus = receipt.summary.cashBalance.statusLabel === "SOBRANTE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col my-6">
        {/* Barra superior de acciones */}
        <div className="bg-slate-800 px-5 py-3.5 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-sm">Comprobante de Cierre de Caja</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm transition flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir (80mm)
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tique Térmico 80mm simulado */}
        <div
          id="cash-shift-ticket-content"
          className="p-6 font-mono text-[12px] leading-tight text-slate-800 bg-white print:p-0 print:text-[11px]"
        >
          {/* Encabezado Comercio */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h1 className="font-black text-sm uppercase">{receipt.company.tradeName}</h1>
            <p className="text-[11px] text-slate-600">{receipt.company.name}</p>
            <p className="text-[10px] text-slate-500">{receipt.company.address}</p>
            <p className="text-[10px] text-slate-500">{receipt.company.city}</p>
            <p className="text-[10px] text-slate-500">CUIT: {receipt.company.cuit}</p>
            <p className="text-[10px] text-slate-500">{receipt.company.ivaCondition}</p>
          </div>

          {/* Metadatos del Turno */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
            <div className="font-bold text-center text-xs pb-1 uppercase tracking-wide">
              ARQUEO Y CIERRE DE CAJA
            </div>
            <div>
              <span className="text-slate-500">Terminal: </span>
              <strong>{receipt.shift.terminalId}</strong>
            </div>
            <div>
              <span className="text-slate-500">Cajero: </span>
              <strong>{receipt.shift.cashierName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Apertura: </span>
              {receipt.shift.openedAt}
            </div>
            {receipt.shift.closedAt && (
              <div>
                <span className="text-slate-500">Cierre: </span>
                {receipt.shift.closedAt}
              </div>
            )}
            <div>
              <span className="text-slate-500">Fondo Inicial: </span>
              <strong>{receipt.shift.initialAmountFormatted}</strong>
            </div>
          </div>

          {/* Resumen de Ventas por Medio de Pago */}
          <div className="py-2.5 border-b border-dashed border-slate-300">
            <div className="font-bold pb-1 text-slate-700">VENTAS POR MEDIO DE PAGO:</div>
            <div className="space-y-1">
              {receipt.summary.byPaymentMethod.map((pm) => (
                <div key={pm.method} className="flex justify-between">
                  <span>{pm.label}:</span>
                  <span className="font-bold">{pm.expectedFormatted}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-1 font-extrabold border-t border-slate-200 mt-1">
              <span>TOTAL VENTAS ({receipt.summary.salesCount} ops):</span>
              <span>{receipt.summary.salesTotalFormatted}</span>
            </div>
          </div>

          {/* Movimientos de Caja */}
          {receipt.summary.movements.length > 0 && (
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="font-bold pb-1 text-slate-700">EGRESOS / INGRESOS EXTRA:</div>
              <div className="space-y-1 text-[10px]">
                {receipt.summary.movements.map((mov, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate max-w-[200px]">
                      {mov.type === "GASTO_MENOR" ? "[-] " : mov.type === "RETIRO_CAJA_FUERTE" ? "[RETIRO] " : "[+] "}
                      {mov.reason}
                    </span>
                    <span className="font-bold">{mov.amountFormatted}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conciliación Física de Efectivo */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
            <div className="font-bold pb-1 text-slate-700">CONCILIACIÓN DE EFECTIVO:</div>
            <div className="flex justify-between">
              <span>Fondo Inicial:</span>
              <span>{receipt.summary.cashBalance.initialFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span>(+) Ventas Efectivo:</span>
              <span>{receipt.summary.cashBalance.cashSalesFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span>(+) Ingresos Extra:</span>
              <span>{receipt.summary.cashBalance.cashIncomeFormatted}</span>
            </div>
            <div className="flex justify-between">
              <span>(-) Egresos / Retiros:</span>
              <span>{receipt.summary.cashBalance.cashExpensesFormatted}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-0.5">
              <span>Efectivo Esperado:</span>
              <span>{receipt.summary.cashBalance.expectedCashFormatted}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Efectivo Real Contado:</span>
              <span>{receipt.summary.cashBalance.actualCashFormatted}</span>
            </div>

            {/* Resultado Balance */}
            <div
              className={`p-2 rounded-lg text-center font-black mt-2 text-xs border ${
                isBalanced
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                  : isSurplus
                  ? "bg-blue-50 border-blue-300 text-blue-800"
                  : "bg-rose-50 border-rose-300 text-rose-800"
              }`}
            >
              {isBalanced ? (
                "CAJA CUADRADA EXACTAMENTE ($ 0,00)"
              ) : (
                <>
                  {receipt.summary.cashBalance.statusLabel}:{" "}
                  {receipt.summary.cashBalance.differenceCashFormatted}
                </>
              )}
            </div>
          </div>

          {/* Notas */}
          {receipt.shift.notes && (
            <div className="py-2 border-b border-dashed border-slate-300 text-[10px]">
              <span className="text-slate-500 font-bold">Observaciones: </span>
              {receipt.shift.notes}
            </div>
          )}

          {/* Pie para firma */}
          <div className="pt-6 pb-2 text-center text-[10px] text-slate-500 space-y-4">
            <div className="w-48 mx-auto border-t border-slate-400 pt-1">
              Firma del Cajero Responsable
            </div>
            <p className="text-[9px]">
              Comprobante de Control Interno y Auditoría — Saavedra 241, Formosa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
