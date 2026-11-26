"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Flag,
  Loader2,
  MessageSquare,
  PanelLeft,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { ModerateReviewSchema, RespondToReviewSchema } from "@/schemas/review";
import {
  getAdminReviewsAction,
  moderateReviewAction,
  respondToReviewAction,
} from "@/server/actions/adminReviewActions";
import {
  STORE_PUBLIC_SIGNATURE,
  type AdminReviewItem,
  type AdminReviewsCounters,
  type AdminReviewTab,
  type FitFeedbackType,
  type ReviewReportReason,
  type ReviewStatusType,
} from "@/types/reviews";

const TAB_CONFIG: ReadonlyArray<{
  id: AdminReviewTab;
  label: string;
  counterKey: keyof AdminReviewsCounters;
}> = [
  { id: "ALL", label: "Todas", counterKey: "all" },
  {
    id: "PENDING_REPORTED",
    label: "Pendientes / Reportadas",
    counterKey: "pendingOrReported",
  },
  { id: "UNANSWERED", label: "Sin respuesta", counterKey: "unanswered" },
  { id: "HIDDEN", label: "Ocultas", counterKey: "hidden" },
];

const STATUS_BADGE: Record<
  ReviewStatusType,
  { label: string; className: string }
> = {
  PUBLICADA: {
    label: "Publicada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  EN_REVISION: {
    label: "En revisión",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  OCULTA: {
    label: "Oculta",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const FIT_LABEL: Record<FitFeedbackType, string> = {
  CHICO: "Calce chico",
  EXACTO: "Fiel al talle",
  HOLGADO: "Calce holgado",
};

const REPORT_REASON_LABEL: Record<ReviewReportReason, string> = {
  SPAM: "Spam / publicidad",
  LENGUAJE_INAPROPIADO: "Lenguaje inapropiado",
  INFORMACION_FALSA: "Información falsa",
  DATOS_PERSONALES: "Datos personales",
  OTRO: "Otro motivo",
};

const HIDE_REASON_PRESETS: readonly string[] = [
  "Lenguaje ofensivo o inapropiado",
  "Spam o publicidad no permitida",
  "Información falsa o ajena al producto",
  "Expone datos personales o de contacto",
];

const EMPTY_COUNTERS: AdminReviewsCounters = {
  all: 0,
  pendingOrReported: 0,
  unanswered: 0,
  hidden: 0,
};

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-500"
      role="img"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            n <= rating ? "fill-amber-500 text-amber-500" : "text-slate-300"
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

interface ReviewsManagementViewProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function ReviewsManagementView({
  isSidebarOpen = true,
  onToggleSidebar,
}: ReviewsManagementViewProps = {}) {
  const searchInputId = useId();
  const tabPanelId = useId();
  const [activeTab, setActiveTab] = useState<AdminReviewTab>("PENDING_REPORTED");
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [counters, setCounters] = useState<AdminReviewsCounters>(EMPTY_COUNTERS);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Estado del formulario inline de respuesta oficial
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isSavingReply, setIsSavingReply] = useState(false);

  // Estado del formulario inline para ocultar reseña con motivo obligatorio
  const [hidingReviewId, setHidingReviewId] = useState<string | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [hideError, setHideError] = useState<string | null>(null);
  const [busyModerationId, setBusyModerationId] = useState<string | null>(null);

  const requestSeqRef = useRef(0);
  const tabButtonRefs = useRef<Partial<Record<AdminReviewTab, HTMLButtonElement | null>>>({});
  const replyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hideReasonInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (replyingReviewId) {
      replyTextareaRef.current?.focus();
    }
  }, [replyingReviewId]);

  useEffect(() => {
    if (hidingReviewId) {
      hideReasonInputRef.current?.focus();
    }
  }, [hidingReviewId]);

  const loadReviews = useCallback(
    async (tab: AdminReviewTab, search: string, targetPage: number) => {
      const reqId = ++requestSeqRef.current;
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await getAdminReviewsAction({
          tab,
          search: search.trim() || null,
          page: targetPage,
          pageSize: 15,
        });
        if (reqId !== requestSeqRef.current) return;
        if (!res.success || !res.data) {
          setLoadError(
            res.error || "No se pudieron cargar las reseñas en este momento."
          );
          return;
        }
        setCounters(res.data.counters);
        setTotalFiltered(res.data.totalFiltered);
        setTotalPages(res.data.totalPages);
        if (targetPage > res.data.totalPages) {
          setPage(res.data.totalPages);
          return;
        }
        setItems(res.data.items);
      } catch {
        if (reqId !== requestSeqRef.current) return;
        setLoadError("Error de conexión al consultar reseñas.");
      } finally {
        if (reqId === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void loadReviews(activeTab, appliedSearch, page);
  }, [loadReviews, activeTab, appliedSearch, page]);

  const handleSelectTab = (tab: AdminReviewTab) => {
    setActiveTab(tab);
    setPage(1);
    setReplyingReviewId(null);
    setHidingReviewId(null);
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_CONFIG.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_CONFIG.length) % TAB_CONFIG.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = TAB_CONFIG.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = TAB_CONFIG[nextIndex];
      handleSelectTab(nextTab.id);
      tabButtonRefs.current[nextTab.id]?.focus();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchDraft.trim());
  };

  const handleClearSearch = () => {
    setSearchDraft("");
    setAppliedSearch("");
    setPage(1);
  };

  const openReplyForm = (review: AdminReviewItem) => {
    setHidingReviewId(null);
    setHideError(null);
    setReplyingReviewId(review.id);
    setReplyText(review.adminResponse ?? "");
    setReplyError(null);
  };

  const openHideForm = (review: AdminReviewItem) => {
    setReplyingReviewId(null);
    setReplyError(null);
    setHidingReviewId(review.id);
    setHideReason(review.moderationReason ?? "");
    setHideError(null);
  };

  const handleReplySubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    reviewId: string
  ) => {
    e.preventDefault();
    setFeedbackBanner(null);

    const parsed = RespondToReviewSchema.safeParse({
      reviewId,
      response: replyText,
    });
    if (!parsed.success) {
      setReplyError(
        parsed.error.issues[0]?.message || "Ingresá una respuesta válida."
      );
      return;
    }

    setReplyError(null);
    setIsSavingReply(true);
    try {
      const res = await respondToReviewAction({
        reviewId,
        response: parsed.data.response,
      });
      if (!res.success) {
        setReplyError(res.error || "No se pudo guardar la respuesta.");
        return;
      }

      setReplyingReviewId(null);
      setReplyText("");
      setFeedbackBanner({
        type: "success",
        message: `Respuesta guardada y publicada en la tienda firmada como "${STORE_PUBLIC_SIGNATURE}".`,
      });
      await loadReviews(activeTab, appliedSearch, page);
    } catch {
      setReplyError(
        "Error de conexión al guardar la respuesta. Intentá nuevamente."
      );
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleHideSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    reviewId: string
  ) => {
    e.preventDefault();
    setFeedbackBanner(null);

    const parsed = ModerateReviewSchema.safeParse({
      reviewId,
      status: "OCULTA",
      reason: hideReason,
    });
    if (!parsed.success) {
      setHideError(
        parsed.error.issues[0]?.message ||
          "Indicá un motivo de moderación válido."
      );
      return;
    }

    setHideError(null);
    setBusyModerationId(reviewId);
    try {
      const res = await moderateReviewAction({
        reviewId,
        status: "OCULTA",
        reason: parsed.data.reason,
      });
      if (!res.success) {
        setHideError(res.error || "No se pudo ocultar la reseña.");
        return;
      }

      setHidingReviewId(null);
      setHideReason("");
      setFeedbackBanner({
        type: "success",
        message:
          "La reseña fue ocultada y el promedio de calificación del producto se recalculó automáticamente.",
      });
      await loadReviews(activeTab, appliedSearch, page);
    } catch {
      setHideError(
        "Error de conexión al ocultar la reseña. Intentá nuevamente."
      );
    } finally {
      setBusyModerationId(null);
    }
  };

  const handleRestoreOrApprove = async (
    reviewId: string,
    dismissReportsOnly = false
  ) => {
    setFeedbackBanner(null);
    setBusyModerationId(reviewId);
    try {
      const res = await moderateReviewAction({
        reviewId,
        status: "PUBLICADA",
      });
      if (!res.success) {
        setFeedbackBanner({
          type: "error",
          message: res.error || "No se pudo aprobar o restaurar la reseña.",
        });
        return;
      }

      setFeedbackBanner({
        type: "success",
        message: dismissReportsOnly
          ? "Reportes descartados. La reseña permanece publicada y se conserva el historial de auditoría."
          : "Reseña aprobada y publicada nuevamente en la tienda (reportes reseteados y promedio actualizado).",
      });
      await loadReviews(activeTab, appliedSearch, page);
    } catch {
      setFeedbackBanner({
        type: "error",
        message:
          "Error de conexión al actualizar el estado de la reseña. Intentá nuevamente.",
      });
    } finally {
      setBusyModerationId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen select-text">
      {/* Cabecera fija del módulo */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Abrir menú lateral"
              className={`${
                isSidebarOpen ? "md:hidden" : "flex"
              } items-center justify-center p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer`}
            >
              <PanelLeft className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <span>Moderación de Reseñas Web</span>
            </h1>
            <p className="text-xs text-slate-500">
              Gestioná reportes, aprobá u ocultá comentarios y respondé oficialmente como{" "}
              <strong className="text-slate-700">{STORE_PUBLIC_SIGNATURE}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadReviews(activeTab, appliedSearch, page)}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span>Actualizar</span>
        </button>
      </div>

      <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Mensaje de estado accesible */}
        <div role="status" aria-live="polite">
          {feedbackBanner && (
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start justify-between gap-3 ${
                feedbackBanner.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="flex items-start gap-2">
                {feedbackBanner.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <span>{feedbackBanner.message}</span>
              </div>
              <button
                type="button"
                aria-label="Cerrar notificación"
                onClick={() => setFeedbackBanner(null)}
                className="p-0.5 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Pestañas de estado + barra de búsqueda */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-2xs">
          <div
            role="tablist"
            aria-label="Filtros de moderación de reseñas"
            className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 border-b border-slate-100"
          >
            {TAB_CONFIG.map((tab, index) => {
              const selected = activeTab === tab.id;
              const count = counters[tab.counterKey];
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabButtonRefs.current[tab.id] = el;
                  }}
                  id={`admin-reviews-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={tabPanelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => handleSelectTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-2 border transition-colors cursor-pointer border-transparent text-slate-600 hover:bg-slate-100 aria-selected:bg-slate-950 aria-selected:text-white"
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tabular-nums ${
                      selected
                        ? "bg-white/20 text-white"
                        : tab.id === "PENDING_REPORTED" && count > 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <search aria-label="Buscar reseñas por producto, cliente o contenido">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <label htmlFor={searchInputId} className="sr-only">
                Buscar por producto, cliente o texto de la reseña
              </label>
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id={searchInputId}
                  type="search"
                  maxLength={120}
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Buscar por producto, cliente, correo o texto..."
                  className="w-full min-h-10 pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-base sm:text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 min-h-10 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Buscar
                </button>
                {appliedSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-3 min-h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </form>
          </search>
        </div>

        {/* Contenido del listado */}
        <div
          id={tabPanelId}
          role="tabpanel"
          aria-labelledby={`admin-reviews-tab-${activeTab}`}
          className="space-y-4"
        >
          {loadError ? (
            <div
              role="alert"
              className="p-6 rounded-2xl bg-white border border-rose-200 text-center space-y-2"
            >
              <p className="text-sm font-bold text-rose-700">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadReviews(activeTab, appliedSearch, page)}
                className="px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : isLoading ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Cargando reseñas...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-2">
              <p className="text-sm font-bold text-slate-900">
                No hay reseñas en esta vista
              </p>
              <p className="text-xs text-slate-500">
                {appliedSearch
                  ? `No encontramos resultados para "${appliedSearch}".`
                  : "Cuando los clientes publiquen opiniones o reporten comentarios aparecerán aquí."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const badge = STATUS_BADGE[item.status];
                const isReplying = replyingReviewId === item.id;
                const isHiding = hidingReviewId === item.id;
                const isModeratingThis = busyModerationId === item.id;
                const replyFormId = `admin-reply-form-${item.id}`;
                const hideFormId = `admin-hide-form-${item.id}`;

                return (
                  <article
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
                  >
                    {/* Cabecera de tarjeta: Producto + Estado + Reportes */}
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-3 min-w-0">
                        {item.productImageUrl && (
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/productos/${item.productId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-extrabold text-slate-950 hover:text-emerald-700 inline-flex items-center gap-1"
                            >
                              <span className="truncate">{item.productName}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            </Link>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            {item.reportsCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                <Flag className="w-3 h-3" aria-hidden="true" />
                                {item.reportsCount}{" "}
                                {item.reportsCount === 1 ? "reporte" : "reportes"}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <StarRatingDisplay rating={item.rating} />
                            <span className="font-bold text-slate-900">
                              {item.customerName}
                            </span>
                            <span className="text-slate-400">({item.customerEmail})</span>
                            {item.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                                Comprador verificado
                              </span>
                            )}
                            {item.purchasedSize && (
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                Talle: {item.purchasedSize}
                              </span>
                            )}
                            {item.fitFeedback && (
                              <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded">
                                {FIT_LABEL[item.fitFeedback]}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              • {item.createdAtFormatted}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contenido de la reseña */}
                    <div className="space-y-1">
                      <h2 className="text-sm font-extrabold text-slate-950">
                        {item.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {item.comment}
                      </p>
                    </div>

                    {/* Motivo de moderación si existe */}
                    {item.moderationReason && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                        <strong>Motivo de moderación / filtro:</strong>{" "}
                        {item.moderationReason}
                      </div>
                    )}

                    {/* Detalle de reportes registrados (auditoría) */}
                    {item.reports.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                          Historial de reportes ({item.reports.length})
                        </p>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {item.reports.map((rep) => (
                            <li
                              key={rep.id}
                              className="flex flex-wrap items-center gap-1.5"
                            >
                              <span className="font-bold text-slate-900">
                                • {REPORT_REASON_LABEL[rep.reason]}
                              </span>
                              {rep.comment && (
                                <span className="text-slate-600">
                                  — &ldquo;{rep.comment}&rdquo;
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                ({rep.reporterName || "Visitante"} •{" "}
                                {rep.createdAtFormatted})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Respuesta oficial actual (si existe) */}
                    {item.adminResponse && !isReplying && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 border-l-4 border-l-emerald-600 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-extrabold text-slate-950">
                            Respuesta publicada como {item.publicSignature}
                            {item.adminResponseAtFormatted
                              ? ` • ${item.adminResponseAtFormatted}`
                              : ""}
                          </span>
                          {item.adminResponderName && (
                            <span className="text-slate-500">
                              Auditoría interna: {item.adminResponderName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-line">
                          {item.adminResponse}
                        </p>
                      </div>
                    )}

                    {/* Barra de acciones del administrador */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        aria-expanded={isReplying}
                        aria-controls={isReplying ? replyFormId : undefined}
                        onClick={() =>
                          isReplying ? setReplyingReviewId(null) : openReplyForm(item)
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {item.adminResponse ? "Editar respuesta" : "Responder"}
                        </span>
                      </button>

                      {(item.status !== "PUBLICADA" || item.reportsCount > 0) && (
                        <button
                          type="button"
                          disabled={isModeratingThis}
                          onClick={() =>
                            void handleRestoreOrApprove(
                              item.id,
                              item.status === "PUBLICADA" && item.reportsCount > 0
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          {item.status === "PUBLICADA" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : item.status === "EN_REVISION" ? (
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>
                            {item.status === "PUBLICADA"
                              ? "Descartar reportes"
                              : item.status === "EN_REVISION"
                              ? "Aprobar y publicar"
                              : "Restaurar reseña"}
                          </span>
                        </button>
                      )}

                      {item.status !== "OCULTA" && (
                        <button
                          type="button"
                          aria-expanded={isHiding}
                          aria-controls={isHiding ? hideFormId : undefined}
                          disabled={isModeratingThis}
                          onClick={() =>
                            isHiding ? setHidingReviewId(null) : openHideForm(item)
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Ocultar / Dar de baja</span>
                        </button>
                      )}
                    </div>

                    {/* Formulario inline de respuesta oficial */}
                    {isReplying && (
                      <form
                        id={replyFormId}
                        aria-label={`Responder reseña de ${item.customerName}`}
                        onSubmit={(e) => void handleReplySubmit(e, item.id)}
                        noValidate
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor={`reply-textarea-${item.id}`}
                            className="text-xs font-bold text-slate-900"
                          >
                            Respuesta oficial (se mostrará firmada como{" "}
                            <span className="text-emerald-700">
                              {STORE_PUBLIC_SIGNATURE}
                            </span>
                            )
                          </label>
                          <span className="text-[11px] text-slate-500 tabular-nums">
                            {replyText.length}/1500
                          </span>
                        </div>
                        <textarea
                          ref={replyTextareaRef}
                          id={`reply-textarea-${item.id}`}
                          rows={3}
                          required
                          minLength={5}
                          maxLength={1500}
                          value={replyText}
                          onChange={(e) => {
                            setReplyText(e.target.value);
                            if (replyError) setReplyError(null);
                          }}
                          aria-invalid={replyError ? "true" : "false"}
                          aria-describedby={
                            replyError ? `reply-error-${item.id}` : undefined
                          }
                          placeholder="Ej: ¡Muchas gracias por tu opinión! Te esperamos en Saavedra 241..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-base sm:text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900"
                        />
                        {replyError && (
                          <p
                            id={`reply-error-${item.id}`}
                            className="text-xs text-rose-700 font-medium flex items-center gap-1"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{replyError}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={isSavingReply}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                          >
                            {isSavingReply ? "Guardando..." : "Publicar respuesta"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingReviewId(null);
                              setReplyError(null);
                            }}
                            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Formulario inline para ocultar reseña con motivo */}
                    {isHiding && (
                      <form
                        id={hideFormId}
                        aria-label={`Ocultar reseña de ${item.customerName}`}
                        onSubmit={(e) => void handleHideSubmit(e, item.id)}
                        noValidate
                        className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3"
                      >
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`hide-reason-${item.id}`}
                            className="block text-xs font-bold text-rose-950"
                          >
                            Motivo para dar de baja / ocultar esta reseña *
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {HIDE_REASON_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setHideReason(preset);
                                  if (hideError) setHideError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 hover:border-rose-400 text-[11px] font-semibold text-rose-900 cursor-pointer"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                          <input
                            ref={hideReasonInputRef}
                            id={`hide-reason-${item.id}`}
                            type="text"
                            required
                            minLength={3}
                            maxLength={400}
                            value={hideReason}
                            onChange={(e) => {
                              setHideReason(e.target.value);
                              if (hideError) setHideError(null);
                            }}
                            aria-invalid={hideError ? "true" : "false"}
                            aria-describedby={
                              hideError ? `hide-error-${item.id}` : undefined
                            }
                            placeholder="Escribí o seleccioná un motivo de auditoría (mínimo 3 caracteres)"
                            className="w-full min-h-10 px-3 py-2 rounded-xl border border-rose-300 bg-white text-base sm:text-xs text-slate-900 focus-visible:outline-2 focus-visible:outline-rose-700"
                          />
                        </div>
                        {hideError && (
                          <p
                            id={`hide-error-${item.id}`}
                            className="text-xs text-rose-700 font-medium flex items-center gap-1"
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{hideError}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={isModeratingThis}
                            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                          >
                            {isModeratingThis ? "Ocultando..." : "Confirmar baja"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHidingReviewId(null);
                              setHideError(null);
                            }}
                            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                );
              })}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
                  <span>
                    Mostrando página <strong>{page}</strong> de{" "}
                    <strong>{totalPages}</strong> ({totalFiltered} reseñas)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 font-semibold cursor-pointer"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 font-semibold cursor-pointer"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
