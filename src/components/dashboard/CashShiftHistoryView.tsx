"use client";

import React, { useState, useEffect } from "react";
import {
  listCashShifts,
  getCashShiftSummary,
} from "@/server/actions/cashShiftActions";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Printer,
  Calendar,
  Lock,
  Unlock,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  CashShiftTicketModal,
} from "./CashShiftModals";
import { CashShiftTicketReceipt } from "@/server/services/cashShiftService";

export function CashShiftHistoryView() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [terminalFilter, setTerminalFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal de Ticket Térmico
  const [selectedReceipt, setSelectedReceipt] = useState<CashShiftTicketReceipt | null>(null);
  const [loadingShiftId, setLoadingShiftId] = useState<string | null>(null);

  const fetchShifts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCashShifts({
        terminalId: terminalFilter || undefined,
        status: (statusFilter as any) || undefined,
        limit: 50,
        offset: 0,
      });

      if (res.success && Array.isArray(res.items)) {
        setShifts(res.items);
      } else {
        setError(res.error || "Error al cargar turnos");
      }
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [terminalFilter, statusFilter]);

  const handleViewReceipt = async (shiftId: string) => {
    setLoadingShiftId(shiftId);
    try {
      const res = await getCashShiftSummary(shiftId);
      if (res.success && res.receipt) {
        setSelectedReceipt(res.receipt);
      } else {
        alert("No se pudo obtener el comprobante del turno");
      }
    } catch (err: any) {
      alert("Error al cargar comprobante");
    } finally {
      setLoadingShiftId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            Historial de Cajas y Arqueos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro inmutable de turnos de caja, fondo inicial, ventas y conciliación física.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filtro Terminal */}
          <select
            value={terminalFilter}
            onChange={(e) => setTerminalFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las Terminales</option>
            <option value="TERMINAL_1_SALON">Terminal 1 (Salón)</option>
            <option value="TERMINAL_2_CAJA">Terminal 2 (Caja)</option>
            <option value="CAJA_MOSTRADOR">Caja Mostrador General</option>
          </select>

          {/* Filtro Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los Estados</option>
            <option value="ABIERTA">🟢 Abiertas</option>
            <option value="CERRADA">⚪ Cerradas</option>
          </select>

          {/* Botón Refrescar */}
          <button
            onClick={fetchShifts}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            title="Actualizar listado"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabla de Turnos Históricos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Cargando historial de turnos...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : shifts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No se encontraron turnos de caja registrados con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Terminal</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Apertura</th>
                  <th className="py-3 px-4">Cierre</th>
                  <th className="py-3 px-4 text-right">Fondo Inicial</th>
                  <th className="py-3 px-4 text-right">Efectivo Esp.</th>
                  <th className="py-3 px-4 text-right">Efectivo Real</th>
                  <th className="py-3 px-4 text-right">Diferencia</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((shift) => {
                  const isOpen = shift.status === "ABIERTA";
                  const diff = shift.differenceCash !== null ? Number(shift.differenceCash) : null;
                  const isBalanced = diff !== null && Math.abs(diff) <= 0.05;

                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/80 transition">
                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isOpen
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isOpen ? (
                            <>
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              Abierta
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-slate-500" />
                              Cerrada
                            </>
                          )}
                        </span>
                      </td>

                      {/* Terminal */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {shift.terminalId}
                      </td>

                      {/* Responsable */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {shift.user?.name || "Sin asignar"}
                      </td>

                      {/* Apertura */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(shift.openedAt)}
                      </td>

                      {/* Cierre */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {shift.closedAt ? formatDate(shift.closedAt) : "—"}
                      </td>

                      {/* Fondo Inicial */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(Number(shift.initialAmount))}
                      </td>

                      {/* Efectivo Esperado */}
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {shift.expectedCash !== null
                          ? formatCurrency(Number(shift.expectedCash))
                          : "—"}
                      </td>

                      {/* Efectivo Real */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {shift.actualCash !== null
                          ? formatCurrency(Number(shift.actualCash))
                          : "—"}
                      </td>

                      {/* Diferencia */}
                      <td className="py-3 px-4 text-right font-mono">
                        {diff === null ? (
                          <span className="text-slate-400">—</span>
                        ) : isBalanced ? (
                          <span className="text-emerald-700 font-bold">$ 0,00</span>
                        ) : diff > 0 ? (
                          <span className="text-blue-600 font-bold">
                            +{formatCurrency(diff)}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold">
                            {formatCurrency(diff)}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleViewReceipt(shift.id)}
                          disabled={loadingShiftId === shift.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-60"
                          title="Visualizar detalle completo y comprobante del turno"
                        >
                          {loadingShiftId === shift.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                              <span>Cargando...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-indigo-700" />
                              <span>Ver Detalle</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Tique Térmico */}
      <CashShiftTicketModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
