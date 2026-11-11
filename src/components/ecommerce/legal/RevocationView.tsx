"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  RotateCcw,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Package,
  Clock,
  Phone,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import {
  submitRevocationRequestAction,
  getRevocationStatusAction,
  type RevocationActionResult,
} from "@/server/actions/ecommerce/legalActions";
import { LegalConsentCheckboxGroup } from "./LegalConsentCheckboxGroup";

export function RevocationView() {
  const [activeTab, setActiveTab] = useState<"solicitar" | "consultar">("solicitar");

  // Form states
  const [orderCode, setOrderCode] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reason, setReason] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  // Status query states
  const [queryCode, setQueryCode] = useState("");
  const [queryEmail, setQueryEmail] = useState("");
  const [queryResult, setQueryResult] = useState<{
    code: string;
    orderCode: string;
    status: string;
    createdAt: Date;
    rejectionReason: string | null;
    totalAmount: number | null;
  } | null>(null);

  // Common UI states
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<RevocationActionResult["data"] | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!orderCode.trim() || !customerEmail.trim()) {
      setErrorMessage("Por favor completá los datos obligatorios del pedido.");
      return;
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setErrorMessage("Debés aceptar los Términos y Condiciones y las Políticas de Privacidad.");
      return;
    }

    startTransition(async () => {
      const res = await submitRevocationRequestAction({
        orderCode: orderCode.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || null,
        reason: reason.trim() || null,
        acceptedTerms: true,
        acceptedPrivacy: true,
      });

      if (!res.success) {
        setErrorMessage(res.error || "No se pudo procesar la solicitud.");
        return;
      }

      setSuccessData(res.data);
    });
  };

  const handleQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setQueryResult(null);

    if (!queryCode.trim() || !queryEmail.trim()) {
      setErrorMessage("Ingresá el código de trámite y el correo electrónico.");
      return;
    }

    startTransition(async () => {
      const res = await getRevocationStatusAction(queryCode.trim(), queryEmail.trim());
      if (!res.success || !res.data) {
        setErrorMessage(res.error || "No se encontró el trámite de revocación.");
        return;
      }
      setQueryResult(res.data);
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la tienda</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-[#041c16] text-white p-6 sm:p-10 rounded-2xl shadow-sm border border-emerald-950 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-[#00D615] text-xs font-bold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resolución 271/2020 Secretaría de Comercio Interior</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Botón de Arrepentimiento
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Tenés derecho a revocar tu compra online dentro de los 10 días corridos desde la recepción del producto. Te otorgamos un código único de gestión para coordinar el retiro y reintegro del 100% de tu dinero.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab("solicitar");
            setErrorMessage(null);
          }}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "solicitar"
              ? "border-[#00D615] text-[#041c16]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Solicitar Arrepentimiento / Revocación
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("consultar");
            setErrorMessage(null);
          }}
          className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === "consultar"
              ? "border-[#00D615] text-[#041c16]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Consultar Estado de Trámite
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* TAB 1: SOLICITAR */}
      {activeTab === "solicitar" && (
        <>
          {successData ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-6 text-slate-700">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="w-7 h-7" />
                <h2 className="text-lg sm:text-xl font-bold">
                  ¡Solicitud de Arrepentimiento Registrada!
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs text-slate-500 font-medium">Código identificador de trámite:</span>
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                    {successData.revocationCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(successData.revocationCode)}
                    className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Copiar código"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Orden vinculada: <strong>{successData.orderCode}</strong>
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
                <h3 className="font-bold text-slate-900">¿Cuáles son los pasos siguientes?</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                  <li>
                    <strong>Contacto de Coordinación:</strong> Nuestro equipo de atención al cliente se pondrá en contacto dentro de las próximas 24 horas hábiles al correo ingresado o por WhatsApp.
                  </li>
                  <li>
                    <strong>Envío de la Prenda:</strong> En Formosa Capital coordinamos cadetería o entrega en Saavedra 241; en el interior o resto del país te proporcionamos una etiqueta prepaga de Correo Argentino (sin cargo para vos).
                  </li>
                  <li>
                    <strong>Inspección y Reembolso:</strong> Una vez recibido el paquete en Saavedra 241 y constatado que la prenda se encuentre sin uso y con sus etiquetas originales, se emitirá el reintegro total del 100% de tu dinero dentro de las 48 hs hábiles.
                  </li>
                </ol>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-all shadow-xs"
                >
                  Volver al Catálogo
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessData(null);
                    setOrderCode("");
                    setCustomerEmail("");
                    setReason("");
                    setAcceptedTerms(false);
                    setAcceptedPrivacy(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cargar otra solicitud
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Formulario de Revocación de Compra
                </h2>
                <p className="text-xs text-slate-500">
                  Ingresá los datos del comprobante de tu pedido web para iniciar el trámite de devolución.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Código de Pedido o Tique *
                  </label>
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="Ej: WEB-2026-0001"
                    disabled={isPending}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors uppercase"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Figurá en el comprobante que recibiste por correo.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Correo Electrónico de la Compra *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    disabled={isPending}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Teléfono / WhatsApp de Contacto (opcional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 3704556677"
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Motivo de la revocación (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Contanos brevemente el motivo para ayudarnos a mejorar (no es obligatorio según la ley)..."
                  disabled={isPending}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors resize-none"
                />
              </div>

              {/* Legal Checkboxes Group */}
              <div className="pt-2 border-t border-slate-100">
                <LegalConsentCheckboxGroup
                  acceptedTerms={acceptedTerms}
                  acceptedPrivacy={acceptedPrivacy}
                  onTermsChange={setAcceptedTerms}
                  onPrivacyChange={setAcceptedPrivacy}
                  disabled={isPending}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-[#041c16] hover:bg-black text-[#00D615] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 uppercase tracking-wider"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin text-[#00D615]" />}
                <span>{isPending ? "Procesando trámite..." : "Enviar Solicitud de Arrepentimiento"}</span>
              </button>
            </form>
          )}
        </>
      )}

      {/* TAB 2: CONSULTAR */}
      {activeTab === "consultar" && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Seguimiento de Trámite de Revocación
            </h2>
            <p className="text-xs text-slate-500">
              Ingresá el código identificador (ej: <code>REV-123456</code>) y tu correo para ver el estado de tu reclamo.
            </p>
          </div>

          <form onSubmit={handleQuery} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Código de Trámite (REV-XXXXXX) *
              </label>
              <input
                type="text"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                placeholder="REV-XXXXXX"
                disabled={isPending}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm uppercase focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                value={queryEmail}
                onChange={(e) => setQueryEmail(e.target.value)}
                placeholder="tu@correo.com"
                disabled={isPending}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <Search className="w-4 h-4" />
                <span>Consultar Estado</span>
              </button>
            </div>
          </form>

          {queryResult && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Trámite: {queryResult.code}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {queryResult.status.replace("_", " ")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>Pedido: <strong>{queryResult.orderCode}</strong></div>
                <div>Fecha de solicitud: <strong>{new Date(queryResult.createdAt).toLocaleDateString("es-AR")}</strong></div>
              </div>
              {queryResult.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  <strong>Motivo de rechazo:</strong> {queryResult.rejectionReason}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
