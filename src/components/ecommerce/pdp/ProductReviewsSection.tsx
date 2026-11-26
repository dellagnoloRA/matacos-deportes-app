"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Flag,
  MessageSquare,
  ShieldCheck,
  Star,
  ThumbsUp,
} from "lucide-react";
import { CreateOrUpdateReviewSchema } from "@/schemas/review";
import {
  createOrUpdateReviewAction,
  getCustomerReviewContextAction,
  getProductReviewsAction,
  reportReviewAction,
  voteReviewHelpfulAction,
} from "@/server/actions/ecommerce/reviewActions";
import type {
  CustomerReviewContext,
  FitFeedbackType,
  ProductReviewsSummary,
  PublicProductReviewsResponse,
  ReviewReportReason,
  ReviewSortOption,
} from "@/types/reviews";

const CUSTOM_SIZE_OPTION = "__CUSTOM__";

const STAR_LABELS: Record<number, string> = {
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
};

const FIT_OPTIONS: ReadonlyArray<{
  value: FitFeedbackType;
  label: string;
  shortLabel: string;
}> = [
  { value: "CHICO", label: "Calce chico (pedir un talle más)", shortLabel: "Calce chico" },
  { value: "EXACTO", label: "Fiel al talle (calce perfecto)", shortLabel: "Fiel al talle" },
  { value: "HOLGADO", label: "Calce holgado (pedir un talle menos)", shortLabel: "Calce holgado" },
];

const REPORT_REASONS: ReadonlyArray<{ value: ReviewReportReason; label: string }> = [
  { value: "SPAM", label: "Spam o publicidad" },
  { value: "LENGUAJE_INAPROPIADO", label: "Lenguaje ofensivo o inapropiado" },
  { value: "INFORMACION_FALSA", label: "Información falsa o engañosa" },
  { value: "DATOS_PERSONALES", label: "Expone datos personales" },
  { value: "OTRO", label: "Otro motivo" },
];

const EMPTY_SUMMARY: ProductReviewsSummary = {
  ratingAverage: null,
  reviewsCount: 0,
  starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  fitSummary: {
    totalResponses: 0,
    chicoCount: 0,
    exactoCount: 0,
    holgadoCount: 0,
    chicoPct: 0,
    exactoPct: 0,
    holgadoPct: 0,
  },
};

function getFitShortLabel(fit: FitFeedbackType): string {
  return FIT_OPTIONS.find((opt) => opt.value === fit)?.shortLabel ?? fit;
}

function resolveSizeSelectState(
  rawSize: string | null | undefined,
  normalizedSizes: readonly string[]
): { option: string; customText: string } {
  const size = rawSize?.trim() ?? "";
  if (!size) return { option: "", customText: "" };
  if (normalizedSizes.includes(size)) {
    return { option: size, customText: "" };
  }
  return { option: CUSTOM_SIZE_OPTION, customText: size };
}

function validateFieldWithSchema(
  schema:
    | typeof CreateOrUpdateReviewSchema.shape.title
    | typeof CreateOrUpdateReviewSchema.shape.comment,
  value: string
): string | undefined {
  const res = schema.safeParse(value);
  return res.success ? undefined : res.error.issues[0]?.message;
}

function StarRow({
  rating,
  sizeClass = "w-3.5 h-3.5",
}: {
  rating: number;
  sizeClass?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-500"
      role="img"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sizeClass} ${
            n <= Math.round(rating) ? "fill-amber-500 text-amber-500" : "text-slate-300"
          }`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

interface ReviewListFilters {
  starFilter: number | null;
  onlyVerified: boolean;
  sort: ReviewSortOption;
}

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  availableSizes: readonly string[];
  initialReviewsData?: PublicProductReviewsResponse | null;
  onSummaryChange?: (summary: ProductReviewsSummary) => void;
  onReviewsDataSync?: (data: PublicProductReviewsResponse | null) => void;
}

interface ReviewFormErrors {
  rating?: string;
  title?: string;
  comment?: string;
}

export function ProductReviewsSection({
  productId,
  productName,
  availableSizes,
  initialReviewsData,
  onSummaryChange,
  onReviewsDataSync,
}: ProductReviewsSectionProps) {
  const formPanelId = useId();
  const formHeadingId = useId();
  const ratingErrorId = useId();
  const titleInputId = useId();
  const titleHintId = useId();
  const titleErrorId = useId();
  const commentInputId = useId();
  const commentHintId = useId();
  const commentErrorId = useId();
  const sizeSelectId = useId();
  const customSizeInputId = useId();
  const sortSelectId = useId();
  const verifiedCheckId = useId();

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const firstStarRadioRef = useRef<HTMLInputElement | null>(null);

  // Estabilizar lista de talles por valor para no reiniciar efectos ante re-renders del padre
  const sizesKey = availableSizes
    .map((s) => s.trim())
    .filter(Boolean)
    .join("|");
  const normalizedSizes = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const part of sizesKey.split("|")) {
      if (part && !seen.has(part)) {
        seen.add(part);
        list.push(part);
      }
    }
    return list;
  }, [sizesKey]);
  const normalizedSizesRef = useRef<readonly string[]>(normalizedSizes);
  normalizedSizesRef.current = normalizedSizes;

  // Estado de lista y filtros agrupados
  const [reviewsData, setReviewsData] = useState<PublicProductReviewsResponse>(
    initialReviewsData ?? { summary: EMPTY_SUMMARY, reviews: [] }
  );
  const [isLoadingReviews, setIsLoadingReviews] = useState(!initialReviewsData);
  const [filters, setFilters] = useState<ReviewListFilters>({
    starFilter: null,
    onlyVerified: false,
    sort: "recent",
  });
  const fetchRequestIdRef = useRef(0);
  const hadInitialDataAtMountRef = useRef(Boolean(initialReviewsData));

  // Contexto del cliente autenticado
  const [customerContext, setCustomerContext] = useState<CustomerReviewContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  // Formulario inline desplegable arriba de los comentarios
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [selectedSizeOption, setSelectedSizeOption] = useState("");
  const [customSizeText, setCustomSizeText] = useState("");
  const [fitFeedback, setFitFeedback] = useState<FitFeedbackType | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ReviewFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Votos útiles y reportes inline por reseña
  const [votedReviewIds, setVotedReviewIds] = useState<Set<string>>(() => new Set());
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<ReviewReportReason>("SPAM");
  const [reportComment, setReportComment] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportFeedbackByReview, setReportFeedbackByReview] = useState<
    Record<string, { type: "success" | "error"; message: string }>
  >({});

  const onSummaryChangeRef = useRef(onSummaryChange);
  onSummaryChangeRef.current = onSummaryChange;
  const onReviewsDataSyncRef = useRef(onReviewsDataSync);
  onReviewsDataSyncRef.current = onReviewsDataSync;

  const fetchReviews = useCallback(
    async (activeFilters: ReviewListFilters) => {
      const reqId = ++fetchRequestIdRef.current;
      setIsLoadingReviews(true);
      try {
        const res = await getProductReviewsAction({
          productId,
          starFilter: activeFilters.starFilter,
          onlyVerified: activeFilters.onlyVerified,
          sort: activeFilters.sort,
        });
        if (reqId !== fetchRequestIdRef.current) return;
        if (res.success && res.data) {
          setReviewsData(res.data);
          onSummaryChangeRef.current?.(res.data.summary);
          const isDefaultQuery =
            activeFilters.starFilter === null &&
            !activeFilters.onlyVerified &&
            activeFilters.sort === "recent";
          if (isDefaultQuery) {
            onReviewsDataSyncRef.current?.(res.data);
          }
        }
      } finally {
        if (reqId === fetchRequestIdRef.current) {
          setIsLoadingReviews(false);
        }
      }
    },
    [productId]
  );

  const hydrateFormFromContext = useCallback((ctx: CustomerReviewContext) => {
    const sizes = normalizedSizesRef.current;
    if (ctx.existingReview) {
      setRating(ctx.existingReview.rating);
      setTitle(ctx.existingReview.title);
      setComment(ctx.existingReview.comment);
      setFitFeedback(ctx.existingReview.fitFeedback);
      const sizeState = resolveSizeSelectState(ctx.existingReview.purchasedSize, sizes);
      setSelectedSizeOption(sizeState.option);
      setCustomSizeText(sizeState.customText);
    } else if (ctx.verifiedPurchasedSize) {
      const sizeState = resolveSizeSelectState(ctx.verifiedPurchasedSize, sizes);
      setSelectedSizeOption(sizeState.option);
      setCustomSizeText(sizeState.customText);
    }
  }, []);

  const loadCustomerContext = useCallback(
    async (applyToForm: boolean) => {
      setIsLoadingContext(true);
      try {
        const ctx = await getCustomerReviewContextAction(productId);
        setCustomerContext(ctx);
        if (applyToForm) {
          hydrateFormFromContext(ctx);
        }
      } finally {
        setIsLoadingContext(false);
      }
    },
    [productId, hydrateFormFromContext]
  );

  // Cargar reseñas ante cambios de filtros u orden (sin re-disparar por initialReviewsData)
  const isFirstFilterRunRef = useRef(true);
  useEffect(() => {
    if (isFirstFilterRunRef.current) {
      isFirstFilterRunRef.current = false;
      if (!hadInitialDataAtMountRef.current) {
        void fetchReviews(filters);
      }
      return;
    }
    void fetchReviews(filters);
  }, [fetchReviews, filters]);

  // Cargar contexto del cliente una única vez por productId
  useEffect(() => {
    void loadCustomerContext(true);
  }, [loadCustomerContext]);

  const openForm = () => {
    setSubmitError(null);
    setSubmitNotice(null);
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setSubmitError(null);
    setFieldErrors({});
    setIsFormOpen(false);
  };

  const handleToggleForm = () => {
    if (isFormOpen) closeForm();
    else openForm();
  };

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitNotice(null);

    const nextErrors: ReviewFormErrors = {};
    const ratingCheck = CreateOrUpdateReviewSchema.shape.rating.safeParse(rating);
    if (!ratingCheck.success) {
      nextErrors.rating =
        ratingCheck.error.issues[0]?.message ||
        "Seleccioná una calificación entre 1 y 5 estrellas.";
    }
    const titleErr = validateFieldWithSchema(CreateOrUpdateReviewSchema.shape.title, title);
    if (titleErr) nextErrors.title = titleErr;
    const commentErr = validateFieldWithSchema(
      CreateOrUpdateReviewSchema.shape.comment,
      comment
    );
    if (commentErr) nextErrors.comment = commentErr;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.rating) firstStarRadioRef.current?.focus();
      else if (nextErrors.title) titleInputRef.current?.focus();
      else if (nextErrors.comment) commentInputRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const resolvedSize =
      selectedSizeOption === CUSTOM_SIZE_OPTION
        ? customSizeText.trim() || null
        : selectedSizeOption.trim() || null;

    try {
      const res = await createOrUpdateReviewAction({
        productId,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        purchasedSize: resolvedSize,
        fitFeedback,
      });

      if (!res.success || !res.data) {
        setSubmitError(res.error || "No se pudo guardar tu reseña. Intentá nuevamente.");
        return;
      }

      if (res.data.status === "EN_REVISION") {
        setSubmitNotice(
          "Recibimos tu reseña y quedó en revisión por el equipo de Matacos Deportes antes de publicarse."
        );
      } else {
        setSubmitNotice(
          res.data.wasUpdated
            ? "¡Actualizamos tu reseña con éxito!"
            : "¡Gracias por compartir tu experiencia! Tu reseña ya está publicada."
        );
      }

      onReviewsDataSyncRef.current?.(null);
      setIsFormOpen(false);
      await Promise.all([fetchReviews(filters), loadCustomerContext(true)]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    if (votedReviewIds.has(reviewId)) return;
    const res = await voteReviewHelpfulAction(reviewId);
    if (res.success && res.data) {
      const nextVotes = res.data.helpfulVotes;
      setVotedReviewIds((prev) => {
        const next = new Set(prev);
        next.add(reviewId);
        return next;
      });
      setReviewsData((prev) => {
        const nextData: PublicProductReviewsResponse = {
          ...prev,
          reviews: prev.reviews.map((item) =>
            item.id === reviewId ? { ...item, helpfulVotes: nextVotes } : item
          ),
        };
        const isDefaultQuery =
          filters.starFilter === null &&
          !filters.onlyVerified &&
          filters.sort === "recent";
        onReviewsDataSyncRef.current?.(isDefaultQuery ? nextData : null);
        return nextData;
      });
    }
  };

  const handleSubmitReport = async (
    e: React.FormEvent<HTMLFormElement>,
    reviewId: string
  ) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      const res = await reportReviewAction({
        reviewId,
        reason: reportReason,
        comment: reportComment.trim() || null,
      });

      if (!res.success) {
        setReportFeedbackByReview((prev) => ({
          ...prev,
          [reviewId]: {
            type: "error",
            message: res.error || "No se pudo registrar el reporte.",
          },
        }));
        return;
      }

      setReportFeedbackByReview((prev) => ({
        ...prev,
        [reviewId]: {
          type: "success",
          message: res.data?.movedToModeration
            ? "Gracias por avisarnos. Esta reseña pasó a revisión por moderación."
            : "Gracias por avisarnos. Registramos tu reporte para el equipo de moderación.",
        },
      }));
      setReportingReviewId(null);
      setReportComment("");
      setReportReason("SPAM");

      if (res.data?.movedToModeration) {
        onReviewsDataSyncRef.current?.(null);
        await fetchReviews(filters);
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const { summary, reviews } = reviewsData;
  const hasFiltersActive = filters.starFilter !== null || filters.onlyVerified;
  const isEditingExisting = Boolean(customerContext?.existingReview);
  const isReviewModeratedHidden = customerContext?.existingReview?.status === "OCULTA";

  return (
    <div className="space-y-8 max-w-4xl">
      <h3 className="sr-only">Valoraciones y reseñas de clientes</h3>

      {/* 1. CABECERA Y RESUMEN DE VALORACIONES */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-slate-200 items-start">
        {/* Bloque Promedio + Botón CTA */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-3.5">
            <span className="text-4xl font-extrabold text-slate-950 tabular-nums">
              {summary.ratingAverage !== null ? summary.ratingAverage.toFixed(1) : "—"}
            </span>
            <div className="space-y-0.5">
              <StarRow rating={summary.ratingAverage ?? 0} sizeClass="w-4 h-4" />
              <p className="text-xs text-slate-600 font-medium">
                {summary.reviewsCount === 0
                  ? "Todavía no hay opiniones publicadas"
                  : summary.reviewsCount === 1
                  ? "Basado en 1 opinión"
                  : `Basado en ${summary.reviewsCount} opiniones`}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-expanded={isFormOpen}
            aria-controls={formPanelId}
            onClick={handleToggleForm}
            className="px-5 py-2.5 rounded-lg border border-slate-900 bg-slate-950 text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>{isEditingExisting ? "Editar mi reseña" : "Escribir una reseña"}</span>
            {isFormOpen ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Distribución por Estrellas + Métrica de Calce */}
        <div className="md:col-span-7 space-y-5">
          {/* Barras por estrella (5 -> 1) */}
          <div className="space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary.starDistribution[star];
              const pct =
                summary.reviewsCount > 0
                  ? Math.round((count / summary.reviewsCount) * 100)
                  : 0;
              const isSelected = filters.starFilter === star;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      starFilter: isSelected ? null : star,
                    }))
                  }
                  aria-pressed={isSelected}
                  aria-label={`Filtrar por ${star} ${star === 1 ? "estrella" : "estrellas"} (${count} opiniones)`}
                  className={`w-full flex items-center gap-2.5 text-xs rounded-md px-1.5 py-0.5 transition-colors cursor-pointer ${
                    isSelected ? "bg-slate-100 font-bold" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="w-10 text-left font-semibold text-slate-700 shrink-0" aria-hidden="true">
                    {star} ★
                  </span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-600 tabular-nums shrink-0" aria-hidden="true">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Resumen de Calce agregado */}
          {summary.fitSummary.totalResponses > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-extrabold text-slate-900 uppercase tracking-tight">
                  Opiniones sobre el calce
                </span>
                <span className="text-[11px] text-slate-500">
                  {summary.fitSummary.totalResponses}{" "}
                  {summary.fitSummary.totalResponses === 1 ? "respuesta" : "respuestas"}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                {summary.fitSummary.chicoPct > 0 && (
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${summary.fitSummary.chicoPct}%` }}
                    title={`Calce chico: ${summary.fitSummary.chicoPct}%`}
                  />
                )}
                {summary.fitSummary.exactoPct > 0 && (
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${summary.fitSummary.exactoPct}%` }}
                    title={`Fiel al talle: ${summary.fitSummary.exactoPct}%`}
                  />
                )}
                {summary.fitSummary.holgadoPct > 0 && (
                  <div
                    className="h-full bg-sky-500"
                    style={{ width: `${summary.fitSummary.holgadoPct}%` }}
                    title={`Calce holgado: ${summary.fitSummary.holgadoPct}%`}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                <span>
                  Chico: <strong className="text-slate-950">{summary.fitSummary.chicoPct}%</strong>
                </span>
                <span>
                  Fiel al talle:{" "}
                  <strong className="text-emerald-700">{summary.fitSummary.exactoPct}%</strong>
                </span>
                <span>
                  Holgado:{" "}
                  <strong className="text-slate-950">{summary.fitSummary.holgadoPct}%</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anuncio accesible de resultado de envío */}
      <div role="status" aria-live="polite">
        {submitNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{submitNotice}</span>
          </div>
        )}
      </div>

      {/* 2. FORMULARIO INLINE DESPLEGABLE ARRIBA DE LOS COMENTARIOS */}
      {isFormOpen && (
        <div
          id={formPanelId}
          className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-5"
        >
          {isLoadingContext ? (
            <p className="text-xs text-slate-600">Verificando tu sesión...</p>
          ) : !customerContext?.isAuthenticated ? (
            <div className="space-y-3">
              <h4 id={formHeadingId} className="text-sm sm:text-base font-extrabold text-slate-950">
                Iniciá sesión para escribir una reseña
              </h4>
              <p className="text-xs sm:text-sm text-slate-600">
                Para opinar sobre <strong>{productName}</strong> necesitás
                ingresar con tu cuenta de cliente con la que compraste el producto.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/cuenta?mode=login"
                  className="px-4 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Iniciar sesión
                </Link>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : !customerContext?.hasVerifiedPurchase ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <h4 id={formHeadingId} className="text-sm font-bold text-amber-950">
                    Compra no registrada
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Solo los clientes que hayan comprado <strong>{productName}</strong> en nuestra tienda online o local físico pueden dejar una reseña para garantizar valoraciones 100% auténticas y de confianza.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : isReviewModeratedHidden ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Tu reseña para este producto fue moderada por el equipo de Matacos Deportes y no
                puede editarse.
              </span>
            </div>
          ) : (
            <form
              aria-labelledby={formHeadingId}
              onSubmit={handleReviewSubmit}
              noValidate
              className="space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4
                    id={formHeadingId}
                    className="text-sm sm:text-base font-extrabold text-slate-950"
                  >
                    {isEditingExisting ? "Editá tu reseña" : `Contanos tu opinión sobre ${productName}`}
                  </h4>
                  {customerContext.hasVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      Compra verificada
                      {customerContext.verifiedPurchasedSize
                        ? ` • Talle ${customerContext.verifiedPurchasedSize}`
                        : ""}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* 1. Calificación general (1 a 5 estrellas con radios nativos) */}
              <fieldset
                aria-invalid={fieldErrors.rating ? "true" : "false"}
                aria-describedby={fieldErrors.rating ? ratingErrorId : undefined}
                className="space-y-2"
              >
                <legend className="text-xs font-bold text-slate-900">
                  Calificación general <span aria-hidden="true" className="text-red-600">*</span>
                </legend>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const active = (hoveredStar ?? rating) >= starValue;
                    return (
                      <label
                        key={starValue}
                        onMouseEnter={() => setHoveredStar(starValue)}
                        onMouseLeave={() => setHoveredStar(null)}
                        className="relative inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 bg-white hover:border-amber-400 focus-within:ring-2 focus-within:ring-slate-900 cursor-pointer transition-colors"
                      >
                        <input
                          ref={starValue === 1 ? firstStarRadioRef : undefined}
                          type="radio"
                          name="rating"
                          value={starValue}
                          checked={rating === starValue}
                          onChange={() => {
                            setRating(starValue);
                            if (fieldErrors.rating) {
                              setFieldErrors((prev) => ({ ...prev, rating: undefined }));
                            }
                          }}
                          className="sr-only"
                        />
                        <Star
                          className={`w-5 h-5 ${
                            active ? "fill-amber-500 text-amber-500" : "text-slate-300"
                          }`}
                          aria-hidden="true"
                        />
                        <span className="sr-only">
                          {starValue} {starValue === 1 ? "estrella" : "estrellas"} —{" "}
                          {STAR_LABELS[starValue]}
                        </span>
                      </label>
                    );
                  })}
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {STAR_LABELS[hoveredStar ?? rating]}
                  </span>
                </div>
                {fieldErrors.rating && (
                  <p
                    id={ratingErrorId}
                    className="text-xs text-red-700 font-medium flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{fieldErrors.rating}</span>
                  </p>
                )}
              </fieldset>

              {/* 2. Talle comprado o probado + Calce */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={sizeSelectId} className="block text-xs font-bold text-slate-900">
                    Talle comprado o probado (opcional)
                  </label>
                  <select
                    id={sizeSelectId}
                    name="purchasedSize"
                    value={selectedSizeOption}
                    onChange={(e) => setSelectedSizeOption(e.target.value)}
                    className="w-full min-h-11 px-3 py-2 rounded-lg border border-slate-300 bg-white text-base sm:text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900"
                  >
                    <option value="">No especificar</option>
                    {normalizedSizes.map((sz) => (
                      <option key={sz} value={sz}>
                        Talle {sz}
                      </option>
                    ))}
                    <option value={CUSTOM_SIZE_OPTION}>Otro talle...</option>
                  </select>
                  {selectedSizeOption === CUSTOM_SIZE_OPTION && (
                    <div className="pt-1.5">
                      <label htmlFor={customSizeInputId} className="sr-only">
                        Ingresá tu talle
                      </label>
                      <input
                        id={customSizeInputId}
                        type="text"
                        name="customPurchasedSize"
                        value={customSizeText}
                        onChange={(e) => setCustomSizeText(e.target.value)}
                        maxLength={30}
                        placeholder="Ej: 41.5, XL, Único"
                        className="w-full min-h-11 px-3 py-2 rounded-lg border border-slate-300 bg-white text-base sm:text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900"
                      />
                    </div>
                  )}
                </div>

                <fieldset className="space-y-1.5">
                  <legend className="text-xs font-bold text-slate-900">
                    ¿Cómo te resultó el calce? (opcional)
                  </legend>
                  <div className="grid grid-cols-1 gap-1.5">
                    {FIT_OPTIONS.map((opt) => {
                      const checked = fitFeedback === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            checked
                              ? "border-slate-950 bg-slate-950 text-white font-bold"
                              : "border-slate-300 bg-white text-slate-800 hover:border-slate-500"
                          }`}
                        >
                          <input
                            type="radio"
                            name="fitFeedback"
                            value={opt.value}
                            checked={checked}
                            onChange={() => setFitFeedback(opt.value)}
                            className="accent-emerald-600"
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {fitFeedback && (
                    <button
                      type="button"
                      onClick={() => setFitFeedback(null)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Quitar selección de calce
                    </button>
                  )}
                </fieldset>
              </div>

              {/* 3. Título de la reseña */}
              <div className="space-y-1">
                <label htmlFor={titleInputId} className="block text-xs font-bold text-slate-900">
                  Título de tu reseña <span aria-hidden="true" className="text-red-600">*</span>
                </label>
                <p id={titleHintId} className="text-[11px] text-slate-500">
                  Resumí tu experiencia en pocas palabras (entre 3 y 120 caracteres).
                </p>
                <input
                  ref={titleInputRef}
                  id={titleInputId}
                  name="title"
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={title}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setTitle(nextVal);
                    if (
                      fieldErrors.title &&
                      !validateFieldWithSchema(CreateOrUpdateReviewSchema.shape.title, nextVal)
                    ) {
                      setFieldErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  onBlur={() => {
                    if (title.length > 0) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        title: validateFieldWithSchema(
                          CreateOrUpdateReviewSchema.shape.title,
                          title
                        ),
                      }));
                    }
                  }}
                  aria-invalid={fieldErrors.title ? "true" : "false"}
                  aria-describedby={
                    fieldErrors.title ? `${titleHintId} ${titleErrorId}` : titleHintId
                  }
                  placeholder="Ej: Excelente agarre y comodidad"
                  className={`w-full min-h-11 px-3 py-2 rounded-lg border bg-white text-base sm:text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900 ${
                    fieldErrors.title ? "border-red-500 bg-red-50/40" : "border-slate-300"
                  }`}
                />
                {fieldErrors.title && (
                  <p
                    id={titleErrorId}
                    className="text-xs text-red-700 font-medium flex items-center gap-1 pt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{fieldErrors.title}</span>
                  </p>
                )}
              </div>

              {/* 4. Comentario detallado */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={commentInputId}
                    className="block text-xs font-bold text-slate-900"
                  >
                    Tu comentario <span aria-hidden="true" className="text-red-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {comment.length}/1500
                  </span>
                </div>
                <p id={commentHintId} className="text-[11px] text-slate-500">
                  Contanos qué te pareció la calidad, comodidad o uso deportivo (mínimo 10
                  caracteres).
                </p>
                <textarea
                  ref={commentInputRef}
                  id={commentInputId}
                  name="comment"
                  required
                  minLength={10}
                  maxLength={1500}
                  rows={4}
                  value={comment}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setComment(nextVal);
                    if (
                      fieldErrors.comment &&
                      !validateFieldWithSchema(
                        CreateOrUpdateReviewSchema.shape.comment,
                        nextVal
                      )
                    ) {
                      setFieldErrors((prev) => ({ ...prev, comment: undefined }));
                    }
                  }}
                  onBlur={() => {
                    if (comment.length > 0) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        comment: validateFieldWithSchema(
                          CreateOrUpdateReviewSchema.shape.comment,
                          comment
                        ),
                      }));
                    }
                  }}
                  aria-invalid={fieldErrors.comment ? "true" : "false"}
                  aria-describedby={
                    fieldErrors.comment ? `${commentHintId} ${commentErrorId}` : commentHintId
                  }
                  placeholder="Ej: Las uso para entrenar 3 veces por semana y la amortiguación es impecable..."
                  className={`w-full px-3 py-2.5 rounded-lg border bg-white text-base sm:text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-slate-900 ${
                    fieldErrors.comment ? "border-red-500 bg-red-50/40" : "border-slate-300"
                  }`}
                />
                {fieldErrors.comment && (
                  <p
                    id={commentErrorId}
                    className="text-xs text-red-700 font-medium flex items-center gap-1 pt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{fieldErrors.comment}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {isSubmitting
                    ? "Publicando..."
                    : isEditingExisting
                    ? "Guardar cambios"
                    : "Publicar reseña"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. BARRA DE FILTROS Y ORDENAMIENTO */}
      <search
        aria-label="Filtrar y ordenar reseñas"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-700 mr-1">Filtrar:</span>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, starFilter: null }))}
            aria-pressed={filters.starFilter === null}
            className={`px-2.5 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
              filters.starFilter === null
                ? "bg-slate-950 text-white border-slate-950"
                : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
            }`}
          >
            Todas
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  starFilter: prev.starFilter === star ? null : star,
                }))
              }
              aria-pressed={filters.starFilter === star}
              aria-label={`Filtrar por ${star} ${star === 1 ? "estrella" : "estrellas"}`}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                filters.starFilter === star
                  ? "bg-slate-950 text-white border-slate-950"
                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
              }`}
            >
              <span aria-hidden="true">★ {star}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label
            htmlFor={verifiedCheckId}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <input
              id={verifiedCheckId}
              type="checkbox"
              checked={filters.onlyVerified}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, onlyVerified: e.target.checked }))
              }
              className="w-4 h-4 accent-slate-950 cursor-pointer"
            />
            <span>Solo compradores verificados</span>
          </label>

          <div className="flex items-center gap-2">
            <label htmlFor={sortSelectId} className="text-xs font-bold text-slate-700">
              Ordenar:
            </label>
            <select
              id={sortSelectId}
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sort: e.target.value as ReviewSortOption,
                }))
              }
              className="min-h-9 px-2.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-800 cursor-pointer"
            >
              <option value="recent">Más recientes</option>
              <option value="rating_high">Calificación más alta</option>
              <option value="rating_low">Calificación más baja</option>
            </select>
          </div>
        </div>
      </search>

      {/* 4. LISTADO DE RESEÑAS PUBLICADAS */}
      {isLoadingReviews ? (
        <div className="py-10 text-center text-xs text-slate-500">
          Cargando reseñas de clientes...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 px-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-center space-y-3">
          <p className="text-sm font-bold text-slate-900">
            {hasFiltersActive
              ? "No encontramos reseñas con los filtros seleccionados."
              : "Todavía no hay reseñas para este producto."}
          </p>
          <p className="text-xs text-slate-600">
            {hasFiltersActive
              ? "Probá quitando alguno de los filtros para ver todas las opiniones."
              : "Sé el primero en compartir tu experiencia sobre calidad, comodidad y calce."}
          </p>
          {hasFiltersActive ? (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({ ...prev, starFilter: null, onlyVerified: false }))
              }
              className="px-4 py-2 rounded-lg border border-slate-900 text-slate-900 hover:bg-slate-950 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          ) : (
            !isReviewModeratedHidden && (
              <button
                type="button"
                onClick={openForm}
                className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {isEditingExisting ? "Ver o editar mi reseña" : "Escribir la primera reseña"}
              </button>
            )
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {reviews.map((review) => {
            const hasVoted = votedReviewIds.has(review.id);
            const isReporting = reportingReviewId === review.id;
            const reportFormId = `report-form-${review.id}`;
            const reportFeedback = reportFeedbackByReview[review.id];

            return (
              <article key={review.id} className="py-6 first:pt-2 space-y-3">
                {/* Encabezado: Estrellas, autor, fecha y badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <StarRow rating={review.rating} />
                  <span className="text-xs font-black text-slate-950">
                    {review.authorDisplayName}
                  </span>
                  {review.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded font-bold">
                      <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                      Comprador verificado
                    </span>
                  )}
                  {review.purchasedSize && (
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                      Talle: {review.purchasedSize}
                    </span>
                  )}
                  {review.fitFeedback && (
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200/80 px-1.5 py-0.5 rounded">
                      Calce: {getFitShortLabel(review.fitFeedback)}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500">
                    • {review.createdAtFormatted}
                  </span>
                </div>

                {/* Título y texto */}
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-950">
                    {review.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {review.comment}
                  </p>
                </div>

                {/* Respuesta oficial institucional de Matacos Deportes */}
                {review.adminReply && (
                  <div className="mt-3 ml-2 sm:ml-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-emerald-600 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <MessageSquare
                        className="w-3.5 h-3.5 text-emerald-700 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="font-extrabold text-slate-950">
                        Respuesta de {review.adminReply.authorName}
                      </span>
                      <span className="text-slate-500">
                        • {review.adminReply.repliedAtFormatted}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {review.adminReply.message}
                    </p>
                  </div>
                )}

                {/* Acciones: Útil + Reportar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>¿Te resultó útil?</span>
                    <button
                      type="button"
                      disabled={hasVoted}
                      aria-pressed={hasVoted}
                      aria-label={`Marcar esta reseña como útil (${review.helpfulVotes} ${review.helpfulVotes === 1 ? "voto" : "votos"})`}
                      onClick={() => void handleVoteHelpful(review.id)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                        hasVoted
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold"
                          : "border-slate-200 bg-white hover:border-slate-400 text-slate-700 cursor-pointer"
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" aria-hidden="true" />
                      <span aria-hidden="true">{review.helpfulVotes}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-expanded={isReporting}
                    aria-controls={reportFormId}
                    onClick={() => {
                      setReportingReviewId(isReporting ? null : review.id);
                      setReportReason("SPAM");
                      setReportComment("");
                    }}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <Flag className="w-3 h-3" aria-hidden="true" />
                    <span>Reportar</span>
                  </button>
                </div>

                {/* Feedback de reporte */}
                {reportFeedback && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`text-xs font-medium ${
                      reportFeedback.type === "success" ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    {reportFeedback.message}
                  </p>
                )}

                {/* Formulario inline discreto de reporte */}
                {isReporting && (
                  <form
                    id={reportFormId}
                    aria-label="Reportar esta reseña"
                    onSubmit={(e) => void handleSubmitReport(e, review.id)}
                    className="mt-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label
                          htmlFor={`report-reason-${review.id}`}
                          className="block text-[11px] font-bold text-slate-800"
                        >
                          Motivo del reporte
                        </label>
                        <select
                          id={`report-reason-${review.id}`}
                          value={reportReason}
                          onChange={(e) =>
                            setReportReason(e.target.value as ReviewReportReason)
                          }
                          className="w-full min-h-10 px-2.5 rounded-lg border border-slate-300 bg-white text-base sm:text-xs text-slate-900"
                        >
                          {REPORT_REASONS.map((reasonOpt) => (
                            <option key={reasonOpt.value} value={reasonOpt.value}>
                              {reasonOpt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor={`report-comment-${review.id}`}
                          className="block text-[11px] font-bold text-slate-800"
                        >
                          Detalle (opcional)
                        </label>
                        <input
                          id={`report-comment-${review.id}`}
                          type="text"
                          maxLength={400}
                          value={reportComment}
                          onChange={(e) => setReportComment(e.target.value)}
                          placeholder="Contanos brevemente el motivo"
                          className="w-full min-h-10 px-2.5 rounded-lg border border-slate-300 bg-white text-base sm:text-xs text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingReport}
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold text-xs cursor-pointer"
                      >
                        {isSubmittingReport ? "Enviando..." : "Enviar reporte"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportingReviewId(null)}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
