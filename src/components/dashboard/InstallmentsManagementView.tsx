"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Calculator,
  RotateCcw,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getAllInstallmentPlansAdmin,
  createInstallmentPlan,
  updateInstallmentPlan,
  deleteInstallmentPlan,
  reorderInstallmentPlans,
  restoreDefaultInstallmentPlans,
} from "@/server/actions/installmentActions";
import type { SerializedInstallmentPlan } from "@/server/services/installmentService";
import {
  calculateInstallmentPlanAmounts,
  resolveCardBrandsForGroup,
  CARD_BRAND_META,
  type CardBrandCode,
  type CardGroup,
} from "@/schemas/installment";

const AR_TIMEZONE = "America/Argentina/Buenos_Aires";

function formatArDateInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatArShortDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: AR_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function buildSuggestedPlanName(
  inst: number,
  planZ: boolean,
  withInterest: boolean,
  rate: number
): string {
  if (planZ) {
    return "Plan Z (3 cuotas cero interés)";
  }
  if (inst === 1) {
    return withInterest && rate > 0
      ? `1 pago (+${rate}% interés)`
      : "1 pago sin interés";
  }
  return withInterest && rate > 0
    ? `${inst} cuotas fijas (+${rate}% interés)`
    : `${inst} cuotas sin interés`;
}

function getPlanHeadline(plan: SerializedInstallmentPlan): string {
  if (plan.isPlanZ) return "Plan Z";
  if (plan.installments === 1) return "1 pago";
  return `${plan.installments} cuotas`;
}

function getScheduleLabel(plan: SerializedInstallmentPlan): string | null {
  if (plan.validityStatus === "PROGRAMADO" && plan.startDate) {
    return `Empieza el ${formatArShortDate(plan.startDate)}`;
  }
  if (plan.validityStatus === "EXPIRADO" && plan.endDate) {
    return `Venció el ${formatArShortDate(plan.endDate)}`;
  }
  if (plan.startDate && plan.endDate) {
    return `Del ${formatArShortDate(plan.startDate)} al ${formatArShortDate(plan.endDate)}`;
  }
  if (plan.endDate) {
    return `Hasta el ${formatArShortDate(plan.endDate)}`;
  }
  if (plan.startDate) {
    return `Desde el ${formatArShortDate(plan.startDate)}`;
  }
  return null;
}

function CardBrandMiniBadges({ brands }: { brands: CardBrandCode[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {brands.map((brand) => {
        if (brand === "VISA") {
          return (
            <span
              key={brand}
              className="inline-flex items-center h-5 px-1.5 rounded bg-[#1a1f71] text-white font-black text-[9px] tracking-wider"
            >
              VISA
            </span>
          );
        }
        if (brand === "MASTERCARD") {
          return (
            <span
              key={brand}
              className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-slate-900 text-white font-bold text-[9px]"
            >
              <span className="inline-flex items-center">
                <span className="w-2 h-2 rounded-full bg-[#EB001B]" />
                <span className="w-2 h-2 rounded-full bg-[#F79E1B] -ml-1" />
              </span>
              <span>Mastercard</span>
            </span>
          );
        }
        if (brand === "CABAL") {
          return (
            <span
              key={brand}
              className="inline-flex items-center h-5 px-1.5 rounded bg-[#004a98] text-white font-black text-[9px] tracking-wider"
            >
              CABAL
            </span>
          );
        }
        return (
          <span
            key={brand}
            className="inline-flex items-center h-5 px-1.5 rounded bg-[#ff6200] text-white font-bold text-[9px]"
          >
            Naranja X
          </span>
        );
      })}
    </div>
  );
}

interface MinimalPlanCardProps {
  plan: SerializedInstallmentPlan;
  isFirst: boolean;
  isLast: boolean;
  showBrands: boolean;
  onToggleActive: (plan: SerializedInstallmentPlan) => void;
  onEdit: (plan: SerializedInstallmentPlan) => void;
  onDelete: (plan: SerializedInstallmentPlan) => void;
  onMove: (planId: string, direction: "up" | "down") => void;
}

function MinimalPlanCard({
  plan,
  isFirst,
  isLast,
  showBrands,
  onToggleActive,
  onEdit,
  onDelete,
  onMove,
}: MinimalPlanCardProps) {
  const hasInterest = plan.interestRate > 0;
  const scheduleLabel = getScheduleLabel(plan);
  const standardName = buildSuggestedPlanName(
    plan.installments,
    plan.isPlanZ,
    hasInterest,
    plan.interestRate
  );
  const hasCustomName =
    plan.name.trim().toLowerCase() !== standardName.trim().toLowerCase();

  return (
    <article
      className={`bg-white rounded-3xl border transition-all flex flex-col justify-between p-6 min-h-[210px] ${
        plan.isCurrentlyVisible
          ? "border-slate-200 hover:border-slate-300 shadow-xs"
          : "border-slate-200/80 bg-slate-50/70 opacity-75"
      }`}
    >
      <div className="space-y-4">
        {/* Fila superior: cuotas + interés + switch estado */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {getPlanHeadline(plan)}
              </h3>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  hasInterest
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {hasInterest ? `+${plan.interestRate}% interés` : "Sin interés"}
              </span>
            </div>

            {hasCustomName && (
              <p className="text-sm font-medium text-slate-500 truncate">
                {plan.name}
              </p>
            )}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={plan.active}
            onClick={() => onToggleActive(plan)}
            title={plan.active ? "Pausar plan" : "Activar plan"}
            className="inline-flex items-center gap-2.5 shrink-0 cursor-pointer group"
          >
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800">
              {plan.active ? "Activo" : "Pausado"}
            </span>
            <span
              className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                plan.active ? "bg-[#00D615]" : "bg-slate-300"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  plan.active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        </div>

        {/* Regla principal: monto mínimo */}
        <div className="pt-1 space-y-1">
          <p className="text-base font-bold text-slate-800">
            {plan.minAmount > 0
              ? `Desde ${formatCurrency(plan.minAmount)}`
              : "Sin compra mínima"}
          </p>
          {plan.isPlanZ && (
            <p className="text-sm text-slate-500">
              1 a 3 cuotas cero interés en resumen Naranja X
            </p>
          )}
          {scheduleLabel && (
            <p
              className={`text-sm pt-0.5 inline-flex items-center gap-1.5 font-medium ${
                plan.validityStatus === "EXPIRADO"
                  ? "text-rose-600"
                  : plan.validityStatus === "PROGRAMADO"
                  ? "text-amber-700"
                  : "text-slate-500"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{scheduleLabel}</span>
            </p>
          )}
        </div>

        {showBrands && (
          <div className="pt-0.5">
            <CardBrandMiniBadges brands={plan.cardBrands} />
          </div>
        )}
      </div>

      {/* Pie de tarjeta */}
      <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {!(isFirst && isLast) && (
            <>
              <button
                type="button"
                disabled={isFirst}
                onClick={() => onMove(plan.id, "up")}
                title="Mostrar antes"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={() => onMove(plan.id, "down")}
                title="Mostrar después"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(plan)}
            title="Eliminar plan"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

interface PlanSectionProps {
  title: string;
  subtitle: string;
  accentDotClass: string;
  plans: SerializedInstallmentPlan[];
  showBrandsOnCards?: boolean;
  emptyText: string;
  onCreateInGroup: () => void;
  onToggleActive: (plan: SerializedInstallmentPlan) => void;
  onEdit: (plan: SerializedInstallmentPlan) => void;
  onDelete: (plan: SerializedInstallmentPlan) => void;
  onMove: (planId: string, direction: "up" | "down") => void;
}

function PlanSection({
  title,
  subtitle,
  accentDotClass,
  plans,
  showBrandsOnCards = false,
  emptyText,
  onCreateInGroup,
  onToggleActive,
  onEdit,
  onDelete,
  onMove,
}: PlanSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full shrink-0 ${accentDotClass}`} />
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {title}
            </h2>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-slate-400">
          {plans.length} {plans.length === 1 ? "plan" : "planes"}
        </span>
      </div>

      {plans.length === 0 ? (
        <div className="bg-white/70 border border-dashed border-slate-300 rounded-3xl p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{emptyText}</p>
          <button
            type="button"
            onClick={onCreateInGroup}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plans.map((plan, index) => (
            <MinimalPlanCard
              key={plan.id}
              plan={plan}
              isFirst={index === 0}
              isLast={index === plans.length - 1}
              showBrands={showBrandsOnCards}
              onToggleActive={onToggleActive}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function InstallmentsManagementView() {
  const [plans, setPlans] = useState<SerializedInstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulador en modal bajo demanda
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorAmount, setSimulatorAmount] = useState<number>(85000);
  const [simulatorBrand, setSimulatorBrand] = useState<CardBrandCode>("VISA");

  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] =
    useState<SerializedInstallmentPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customNameEdited, setCustomNameEdited] = useState(false);

  // Modales auxiliares
  const [planToDelete, setPlanToDelete] =
    useState<SerializedInstallmentPlan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: "success" | "error" | "info", message: string) => {
      setToast({ type, message });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 4000);
    },
    []
  );

  // Campos del formulario
  const [name, setName] = useState("3 cuotas sin interés");
  const [description, setDescription] = useState("");
  const [cardGroup, setCardGroup] = useState<CardGroup>("BANCARIZADAS");
  const [cardBrands, setCardBrands] = useState<CardBrandCode[]>([
    "VISA",
    "MASTERCARD",
    "CABAL",
  ]);
  const [installments, setInstallments] = useState<number>(3);
  const [isPlanZ, setIsPlanZ] = useState<boolean>(false);
  const [hasInterestToggle, setHasInterestToggle] = useState<boolean>(false);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [minAmount, setMinAmount] = useState<number>(30000);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [active, setActive] = useState<boolean>(true);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getAllInstallmentPlansAdmin();
      if (res.success && res.data) {
        setPlans(res.data);
      } else {
        setErrorMessage(
          res.error || "No se pudieron cargar los planes de cuotas"
        );
      }
    } catch {
      setErrorMessage("Error de conexión al obtener los planes de cuotas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const openCreateModal = (defaultGroup: CardGroup = "BANCARIZADAS") => {
    setEditingPlan(null);
    const initialInstallments = defaultGroup === "NARANJA_X" ? 4 : 3;
    const initialMinAmount = defaultGroup === "NARANJA_X" ? 80000 : 30000;
    const initialBrands = resolveCardBrandsForGroup(defaultGroup);

    setCardGroup(defaultGroup);
    setCardBrands(initialBrands);
    setInstallments(initialInstallments);
    setIsPlanZ(false);
    setHasInterestToggle(false);
    setInterestRate(0);
    setMinAmount(initialMinAmount);
    setName(buildSuggestedPlanName(initialInstallments, false, false, 0));
    setDescription("");
    setStartDate("");
    setEndDate("");
    setActive(true);
    setCustomNameEdited(false);
    setShowAdvancedOptions(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: SerializedInstallmentPlan) => {
    const hasInterest = plan.interestRate > 0;
    const suggested = buildSuggestedPlanName(
      plan.installments,
      plan.isPlanZ,
      hasInterest,
      plan.interestRate
    );
    const hasDates = Boolean(plan.startDate || plan.endDate);
    const hasCustomName =
      plan.name.trim().toLowerCase() !== suggested.trim().toLowerCase();

    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description || "");
    setCardGroup(plan.cardGroup);
    setCardBrands(plan.cardBrands);
    setInstallments(plan.installments);
    setIsPlanZ(plan.isPlanZ);
    setHasInterestToggle(hasInterest);
    setInterestRate(plan.interestRate);
    setMinAmount(plan.minAmount);
    setStartDate(formatArDateInput(plan.startDate));
    setEndDate(formatArDateInput(plan.endDate));
    setActive(plan.active);
    setCustomNameEdited(hasCustomName);
    setShowAdvancedOptions(hasDates || Boolean(plan.description) || hasCustomName);
    setIsModalOpen(true);
  };

  const syncAutoName = (
    nextInst: number,
    nextPlanZ: boolean,
    nextHasInt: boolean,
    nextRate: number
  ) => {
    if (!customNameEdited) {
      setName(buildSuggestedPlanName(nextInst, nextPlanZ, nextHasInt, nextRate));
    }
  };

  const handleSelectCardGroup = (group: CardGroup) => {
    setCardGroup(group);
    const resolved = resolveCardBrandsForGroup(group, cardBrands);
    setCardBrands(resolved);

    const supportsPlanZ =
      group === "NARANJA_X" ||
      group === "TODAS" ||
      (group === "ESPECIFICAS" && resolved.includes("NARANJA_X"));

    if (!supportsPlanZ && isPlanZ) {
      setIsPlanZ(false);
      syncAutoName(installments, false, hasInterestToggle, interestRate);
    }
  };

  const handleToggleBrand = (brand: CardBrandCode) => {
    setCardBrands((prev) => {
      const exists = prev.includes(brand);
      if (exists && prev.length === 1) return prev;
      const next = exists ? prev.filter((b) => b !== brand) : [...prev, brand];
      if (!next.includes("NARANJA_X") && isPlanZ) {
        setIsPlanZ(false);
        syncAutoName(installments, false, hasInterestToggle, interestRate);
      }
      return next;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveInterestRate = hasInterestToggle
      ? Math.max(0.01, Number(interestRate) || 0)
      : 0;
    const effectiveInstallments = isPlanZ ? 3 : Math.max(1, installments);
    const finalName =
      name.trim() ||
      buildSuggestedPlanName(
        effectiveInstallments,
        isPlanZ,
        hasInterestToggle,
        effectiveInterestRate
      );

    const effectiveBrands = resolveCardBrandsForGroup(cardGroup, cardBrands);

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name: finalName,
      description: description.trim() || null,
      cardGroup,
      cardBrands: effectiveBrands,
      installments: effectiveInstallments,
      isPlanZ,
      interestRate: effectiveInterestRate,
      minAmount: Math.max(0, Number(minAmount) || 0),
      startDate: startDate ? new Date(`${startDate}T00:00:00-03:00`) : null,
      endDate: endDate ? new Date(`${endDate}T23:59:59-03:00`) : null,
      active,
    };

    const res = editingPlan
      ? await updateInstallmentPlan(editingPlan.id, payload)
      : await createInstallmentPlan(payload);

    setSubmitting(false);

    if (res.success) {
      showToast(
        "success",
        editingPlan
          ? "Plan actualizado correctamente."
          : "Plan creado y guardado."
      );
      setIsModalOpen(false);
      void loadPlans();
    } else {
      showToast("error", res.error || "No se pudo guardar el plan de cuotas.");
    }
  };

  const handleToggleActive = async (plan: SerializedInstallmentPlan) => {
    const res = await updateInstallmentPlan(plan.id, { active: !plan.active });
    if (res.success) {
      showToast(
        "info",
        plan.active ? `"${plan.name}" pausado.` : `"${plan.name}" activado.`
      );
      void loadPlans();
    } else {
      showToast("error", res.error || "No se pudo cambiar el estado del plan");
    }
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteInstallmentPlan(planToDelete.id);
      if (res.success) {
        showToast("success", `Plan "${planToDelete.name}" eliminado.`);
        setPlanToDelete(null);
        void loadPlans();
      } else {
        showToast("error", res.error || "No se pudo eliminar el plan");
      }
    } catch {
      showToast("error", "Error inesperado al eliminar el plan");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmRestoreDefaults = async () => {
    setRestoring(true);
    try {
      const res = await restoreDefaultInstallmentPlans();
      if (res.success && res.data) {
        setPlans(res.data);
        setIsRestoreModalOpen(false);
        showToast("success", "Planes base de Matacos Deportes restaurados.");
      } else {
        showToast("error", res.error || "No se pudieron restaurar los planes");
      }
    } catch {
      showToast("error", "Error al restaurar los planes por defecto");
    } finally {
      setRestoring(false);
    }
  };

  const bancarizadasPlans = useMemo(
    () => plans.filter((p) => p.cardGroup === "BANCARIZADAS"),
    [plans]
  );

  const naranjaPlans = useMemo(
    () => plans.filter((p) => p.cardGroup === "NARANJA_X"),
    [plans]
  );

  const otherPlans = useMemo(
    () =>
      plans.filter(
        (p) => p.cardGroup !== "BANCARIZADAS" && p.cardGroup !== "NARANJA_X"
      ),
    [plans]
  );

  const handleMoveInSection = async (
    sectionPlans: SerializedInstallmentPlan[],
    planId: string,
    direction: "up" | "down"
  ) => {
    const idx = sectionPlans.findIndex((p) => p.id === planId);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectionPlans.length) return;

    const currentPlan = sectionPlans[idx];
    const targetPlan = sectionPlans[targetIdx];
    if (!currentPlan || !targetPlan) return;

    const newItems = plans.map((p) => {
      if (p.id === currentPlan.id) return { id: p.id, order: targetPlan.order };
      if (p.id === targetPlan.id) return { id: p.id, order: currentPlan.order };
      return { id: p.id, order: p.order };
    });

    const res = await reorderInstallmentPlans(newItems);
    if (res.success) {
      void loadPlans();
    } else {
      showToast("error", res.error || "Error al cambiar el orden");
    }
  };

  // Simulador en modal
  const simulatedPlans = useMemo(() => {
    const activeForBrand = plans.filter(
      (p) => p.isCurrentlyVisible && p.cardBrands.includes(simulatorBrand)
    );
    return activeForBrand.map((p) => ({
      plan: p,
      calc: calculateInstallmentPlanAmounts(simulatorAmount, p),
    }));
  }, [plans, simulatorBrand, simulatorAmount]);

  // Resumen en vivo dentro del modal de alta/edición
  const modalPreviewSample = Math.max(minAmount || 0, 60000);
  const modalPreviewCalc = calculateInstallmentPlanAmounts(modalPreviewSample, {
    installments: isPlanZ ? 3 : Math.max(1, installments),
    interestRate: hasInterestToggle ? interestRate : 0,
    minAmount,
    isPlanZ,
  });

  const canUsePlanZ =
    cardGroup === "NARANJA_X" ||
    cardGroup === "TODAS" ||
    (cardGroup === "ESPECIFICAS" && cardBrands.includes("NARANJA_X"));

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
      {/* Cabecera simple */}
      <header className="bg-white border-b border-slate-200 px-5 lg:px-10 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Planes de Cuotas</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Definí cuotas, interés y montos mínimos para el Checkout Web y Caja POS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadPlans()}
            disabled={loading}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsSimulatorOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-slate-500" />
            <span>Probar cuotas</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRestoreModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            title="Restaurar configuración base de Matacos Deportes"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Restaurar base</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal("BANCARIZADAS")}
            className="px-5 py-2.5 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-bold text-sm inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo plan</span>
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="p-5 lg:p-10 max-w-7xl w-full mx-auto space-y-10">
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadPlans()}
              className="underline cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading && plans.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-52 rounded-3xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-5 max-w-xl mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900">
                Todavía no hay planes de cuotas
              </h2>
              <p className="text-sm text-slate-500">
                Creá tu primer plan o cargá los planes base de Matacos Deportes (3 sin interés Bancarizadas y 4 sin interés / Plan Z Naranja X).
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(true)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cargar planes base</span>
              </button>
              <button
                type="button"
                onClick={() => openCreateModal("BANCARIZADAS")}
                className="px-5 py-2.5 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo plan</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <PlanSection
              title="Tarjetas Bancarizadas"
              subtitle="Visa, Mastercard y Cabal"
              accentDotClass="bg-[#1a1f71]"
              plans={bancarizadasPlans}
              emptyText="No hay planes configurados para tarjetas bancarizadas."
              onCreateInGroup={() => openCreateModal("BANCARIZADAS")}
              onToggleActive={handleToggleActive}
              onEdit={handleOpenEdit}
              onDelete={setPlanToDelete}
              onMove={(id, dir) =>
                void handleMoveInSection(bancarizadasPlans, id, dir)
              }
            />

            <PlanSection
              title="Tarjeta Naranja X"
              subtitle="Cuotas y Plan Z"
              accentDotClass="bg-[#ff6200]"
              plans={naranjaPlans}
              emptyText="No hay planes configurados para Naranja X."
              onCreateInGroup={() => openCreateModal("NARANJA_X")}
              onToggleActive={handleToggleActive}
              onEdit={handleOpenEdit}
              onDelete={setPlanToDelete}
              onMove={(id, dir) =>
                void handleMoveInSection(naranjaPlans, id, dir)
              }
            />

            {otherPlans.length > 0 && (
              <PlanSection
                title="Otras combinaciones de tarjetas"
                subtitle="Planes aplicados a todas las tarjetas o marcas específicas"
                accentDotClass="bg-emerald-600"
                plans={otherPlans}
                showBrandsOnCards
                emptyText=""
                onCreateInGroup={() => openCreateModal("TODAS")}
                onToggleActive={handleToggleActive}
                onEdit={handleOpenEdit}
                onDelete={setPlanToDelete}
                onMove={(id, dir) =>
                  void handleMoveInSection(otherPlans, id, dir)
                }
              />
            )}
          </>
        )}
      </main>

      {/* Modal Simulador ("Probar cuotas") */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Probar cuotas por monto
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Monto de compra
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={simulatorAmount || ""}
                      onChange={(e) =>
                        setSimulatorAmount(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {[20000, 35000, 85000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSimulatorAmount(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                          simulatorAmount === preset
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {formatCurrency(preset)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Tarjeta del cliente
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      ["VISA", "MASTERCARD", "CABAL", "NARANJA_X"] as CardBrandCode[]
                    ).map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setSimulatorBrand(brand)}
                        className={`h-11 px-3 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                          simulatorBrand === brand
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {CARD_BRAND_META[brand].shortLabel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {simulatedPlans.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-7 bg-slate-50 rounded-2xl border border-slate-200">
                    No hay planes activos para {CARD_BRAND_META[simulatorBrand].shortLabel}.
                  </p>
                ) : (
                  simulatedPlans.map(({ plan, calc }) => (
                    <div
                      key={plan.id}
                      className={`px-5 py-3.5 rounded-2xl border flex items-center justify-between gap-4 ${
                        calc.meetsMinAmount
                          ? "bg-white border-slate-200"
                          : "bg-slate-50 border-slate-200/70 opacity-60"
                      }`}
                    >
                      <div>
                        <p className="text-base font-bold text-slate-900">
                          {getPlanHeadline(plan)}
                          <span className="ml-2 text-sm font-semibold text-emerald-700">
                            {calc.hasInterest
                              ? `+${plan.interestRate}%`
                              : "Sin interés"}
                          </span>
                        </p>
                        {!calc.meetsMinAmount && (
                          <p className="text-xs text-amber-700 font-medium mt-0.5">
                            Faltan {formatCurrency(calc.missingForMinAmount)} para
                            llegar al mínimo ({formatCurrency(plan.minAmount)})
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-slate-950">
                          {calc.installments} x{" "}
                          {formatCurrency(calc.installmentAmount)}
                        </p>
                        {calc.hasInterest && (
                          <p className="text-xs text-slate-500">
                            Total {formatCurrency(calc.totalFinanced)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Plan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPlan ? "Editar plan de cuotas" : "Nuevo plan de cuotas"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="p-7 overflow-y-auto space-y-6"
            >
              {/* 1. Tarjeta */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">
                    1. ¿Con qué tarjetas aplica?
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectCardGroup(
                        cardGroup === "ESPECIFICAS" || cardGroup === "TODAS"
                          ? "BANCARIZADAS"
                          : "ESPECIFICAS"
                      )
                    }
                    className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    {cardGroup === "ESPECIFICAS" || cardGroup === "TODAS"
                      ? "Volver a opciones simples"
                      : "Elegir tarjetas puntuales"}
                  </button>
                </div>

                {cardGroup === "BANCARIZADAS" || cardGroup === "NARANJA_X" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectCardGroup("BANCARIZADAS")}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        cardGroup === "BANCARIZADAS"
                          ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">
                        Bancarizadas
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Visa, Mastercard y Cabal
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCardGroup("NARANJA_X")}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        cardGroup === "NARANJA_X"
                          ? "border-orange-500 bg-orange-50/70 ring-1 ring-orange-500"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">
                        Naranja X
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cuotas fijas y Plan Z
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          "VISA",
                          "MASTERCARD",
                          "CABAL",
                          "NARANJA_X",
                        ] as CardBrandCode[]
                      ).map((brand) => {
                        const checked =
                          cardGroup === "TODAS" || cardBrands.includes(brand);
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => {
                              if (cardGroup === "TODAS") {
                                setCardGroup("ESPECIFICAS");
                                setCardBrands(
                                  (
                                    [
                                      "VISA",
                                      "MASTERCARD",
                                      "CABAL",
                                      "NARANJA_X",
                                    ] as CardBrandCode[]
                                  ).filter((b) => b !== brand)
                                );
                              } else {
                                handleToggleBrand(brand);
                              }
                            }}
                            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
                              checked
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            {CARD_BRAND_META[brand].shortLabel}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => handleSelectCardGroup("TODAS")}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors ${
                          cardGroup === "TODAS"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        Todas
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Cantidad de cuotas */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-800 block">
                  2. Cantidad de cuotas
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 4, 6, 9, 12].map((qty) => {
                    const selected = !isPlanZ && installments === qty;
                    return (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => {
                          setIsPlanZ(false);
                          setInstallments(qty);
                          syncAutoName(
                            qty,
                            false,
                            hasInterestToggle,
                            interestRate
                          );
                        }}
                        className={`h-11 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          selected
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {qty === 1 ? "1 pago" : `${qty} cuotas`}
                      </button>
                    );
                  })}

                  {canUsePlanZ && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlanZ(true);
                        setInstallments(3);
                        setHasInterestToggle(false);
                        setInterestRate(0);
                        syncAutoName(3, true, false, 0);
                      }}
                      className={`h-11 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                        isPlanZ
                          ? "bg-[#ff6200] text-white border-[#ff6200]"
                          : "bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100"
                      }`}
                    >
                      Plan Z
                    </button>
                  )}

                  {!isPlanZ && (
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={installments || ""}
                      onChange={(e) => {
                        const val = Math.min(
                          24,
                          Math.max(1, Number(e.target.value) || 1)
                        );
                        setInstallments(val);
                        syncAutoName(
                          val,
                          false,
                          hasInterestToggle,
                          interestRate
                        );
                      }}
                      title="Otra cantidad de cuotas"
                      placeholder="Otra"
                      className="w-20 h-11 px-3 rounded-xl border border-slate-200 text-center text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  )}
                </div>
              </div>

              {/* 3. Interés */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-800 block">
                  3. Financiación
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setHasInterestToggle(false);
                      setInterestRate(0);
                      syncAutoName(installments, isPlanZ, false, 0);
                    }}
                    className={`h-11 px-5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                      !hasInterestToggle
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Sin interés
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextRate = interestRate > 0 ? interestRate : 15;
                      setIsPlanZ(false);
                      setHasInterestToggle(true);
                      setInterestRate(nextRate);
                      syncAutoName(installments, false, true, nextRate);
                    }}
                    className={`h-11 px-5 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                      hasInterestToggle
                        ? "border-amber-500 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Con recargo
                  </button>

                  {hasInterestToggle && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0.1}
                        max={300}
                        step={0.5}
                        value={interestRate || ""}
                        onChange={(e) => {
                          const rate = Math.max(0, Number(e.target.value) || 0);
                          setInterestRate(rate);
                          syncAutoName(installments, false, true, rate);
                        }}
                        className="w-24 h-11 px-3 rounded-xl border border-amber-300 text-base font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                      />
                      <span className="text-sm font-bold text-slate-600">
                        %
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Monto mínimo */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-800 block">
                  4. Compra mínima para habilitarlo
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-44">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={minAmount}
                      onChange={(e) =>
                        setMinAmount(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  {[
                    { label: "Sin mínimo", value: 0 },
                    { label: "$ 30.000", value: 30000 },
                    { label: "$ 50.000", value: 50000 },
                    { label: "$ 80.000", value: 80000 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setMinAmount(preset.value)}
                      className={`h-11 px-3.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                        minAmount === preset.value
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opciones avanzadas colapsables */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions((prev) => !prev)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-sm font-semibold text-slate-700 cursor-pointer transition-colors"
                >
                  <span>Opciones avanzadas (nombre, vigencia y estado)</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      showAdvancedOptions ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showAdvancedOptions && (
                  <div className="p-4 space-y-4 bg-white border-t border-slate-200">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        Nombre visible del plan
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setCustomNameEdited(true);
                          setName(e.target.value);
                        }}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                        Aclaración opcional (solo si hace falta)
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej. Válido únicamente los viernes"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                          Fecha inicio
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                          Fecha fin
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span>Dejar activo inmediatamente al guardar</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Resumen corto de 1 línea */}
              <div className="px-4 py-3.5 rounded-2xl bg-slate-900 text-white text-sm flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-300">
                  {isPlanZ
                    ? "Plan Z"
                    : installments === 1
                    ? "1 pago"
                    : `${installments} cuotas`}{" "}
                  {hasInterestToggle ? `(+${interestRate}% interés)` : "sin interés"}{" "}
                  ·{" "}
                  {minAmount > 0
                    ? `Desde ${formatCurrency(minAmount)}`
                    : "Sin mínimo"}
                </span>
                <span className="font-bold text-[#00D615]">
                  Ej. {formatCurrency(modalPreviewSample)} →{" "}
                  {modalPreviewCalc.installments} x{" "}
                  {formatCurrency(modalPreviewCalc.installmentAmount)}
                </span>
              </div>

              {/* Acciones modal */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-bold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingPlan ? "Guardar cambios" : "Crear plan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ¿Eliminar plan de cuotas?
                </h3>
                <p className="text-sm text-slate-500">
                  Dejará de mostrarse en el Checkout Web y en la Caja POS.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
              <p className="font-bold text-slate-900">{planToDelete.name}</p>
              <p className="text-slate-500">
                {planToDelete.minAmount > 0
                  ? `Desde ${formatCurrency(planToDelete.minAmount)}`
                  : "Sin compra mínima"}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPlanToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleConfirmDelete()}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Restauración */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Restaurar planes base
                </h3>
                <p className="text-sm text-slate-500">
                  Se restablecerá la configuración estándar de la tienda:
                </p>
              </div>
            </div>

            <ul className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-2 text-slate-700">
              <li>
                • <strong>Bancarizadas:</strong> 1 pago sin interés y{" "}
                <strong>3 cuotas sin interés</strong> desde{" "}
                <strong>$ 30.000,00</strong>.
              </li>
              <li>
                • <strong>Naranja X:</strong> 1 pago sin interés,{" "}
                <strong>Plan Z</strong> y <strong>4 cuotas sin interés</strong>{" "}
                desde <strong>$ 80.000,00</strong>.
              </li>
            </ul>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={restoring}
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={restoring}
                onClick={() => void handleConfirmRestoreDefaults()}
                className="px-5 py-2.5 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                {restoring && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Restaurar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-4">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
              toast.type === "success"
                ? "bg-[#06241d] text-white border-emerald-700"
                : toast.type === "error"
                ? "bg-rose-950 text-white border-rose-700"
                : "bg-slate-900 text-white border-slate-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#00D615] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
