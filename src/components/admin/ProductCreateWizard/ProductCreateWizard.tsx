"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  WizardFormState,
  StepDefinition,
  StepStatus,
  SizeGuideItem,
} from "./types";
import { LiveProductPreview } from "./LiveProductPreview";
import { Step1Identification } from "./Step1Identification";
import { Step2Photos } from "./Step2Photos";
import { Step3Prices } from "./Step3Prices";
import { Step4TechSpecs } from "./Step4TechSpecs";
import { Step5SizeGuide } from "./Step5SizeGuide";
import { Step6VariantsStock } from "./Step6VariantsStock";
import { Step7Publishing } from "./Step7Publishing";
import {
  autoSaveDraftToPostgres,
  getLatestDraftFromPostgres,
  deleteProductDraft,
  publishProductFromWizard,
} from "@/server/actions/productDraftActions";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  ExternalLink,
  Save,
  Rocket,
  Trash2,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
  Maximize2,
  X,
  Menu,
  ChevronDown,
} from "lucide-react";

interface ProductCreateWizardProps {
  initialTaxonomies: {
    brands: { id: string; name: string }[];
    categories: {
      id: string;
      name: string;
      subcategories: { id: string; name: string }[];
    }[];
    disciplines: { id: string; name: string }[];
  };
  initialSizeGuides: SizeGuideItem[];
}

const STEPS: StepDefinition[] = [
  { id: 1, key: "identificacion", title: "Identificación", subtitle: "Nombre, SKU y Categoría" },
  { id: 2, key: "fotos", title: "Fotos", subtitle: "Galería y vistas color" },
  { id: 3, key: "precios", title: "Precios", subtitle: "Venta, cuotas e IVA" },
  { id: 4, key: "ficha", title: "Ficha Técnica", subtitle: "Descripción y detalles" },
  { id: 5, key: "talles", title: "Guía de Talles", subtitle: "Medidas y calce" },
  { id: 6, key: "variantes", title: "Variantes y Stock", subtitle: "Color × Talle dual" },
  { id: 7, key: "publicacion", title: "Envío y SEO", subtitle: "Logística y publicación" },
];

const INITIAL_FORM: WizardFormState = {
  name: "",
  skuModel: "",
  slug: "",
  brandId: "",
  gender: "UNISEX",
  disciplineId: "",
  categoryId: "",
  subcategoryId: "",
  tags: ["Nuevo"],

  generalImages: [],
  colorImages: {},

  price: 0,
  listPrice: null,
  costPrice: null,
  vatRate: 21,
  installments: 6,

  shortDescription: "",
  description: "",
  highlights: [],
  specs: {},

  useSizeGuide: true,
  sizeGuideId: null,

  variants: [],

  weightGrams: 500,
  dimensions: { length: 30, width: 20, height: 12 },
  status: "PUBLISHED",
};

export const ProductCreateWizard: React.FC<ProductCreateWizardProps> = ({
  initialTaxonomies,
  initialSizeGuides,
}) => {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<WizardFormState>(INITIAL_FORM);
  const [taxonomies, setTaxonomies] = useState(initialTaxonomies);
  const [sizeGuides, setSizeGuides] = useState<SizeGuideItem[]>(initialSizeGuides);

  // Estados de guardado
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Transmitir datos en tiempo real a la ventana independiente de Vista Previa
  useEffect(() => {
    const payload = {
      form,
      brandName: taxonomies.brands.find((b) => b.id === form.brandId)?.name,
      categoryName: taxonomies.categories.find((c) => c.id === form.categoryId)?.name,
      selectedSizeGuide: sizeGuides.find((g) => g.id === form.sizeGuideId),
    };

    // Guardar en localStorage para carga inicial instantánea o recarga
    try {
      localStorage.setItem('matacos_product_preview_data', JSON.stringify(payload));
    } catch {
      // ignore
    }

    // BroadcastChannel para sincronización inmediata (<1ms) entre ventanas
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('matacos_product_preview');
      channel.postMessage({ type: 'PREVIEW_DATA_UPDATE', payload });

      channel.onmessage = (event) => {
        if (event.data?.type === 'REQUEST_INITIAL_SYNC') {
          channel?.postMessage({ type: 'PREVIEW_DATA_UPDATE', payload });
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (channel) channel.close();
    };
  }, [form, taxonomies.brands, taxonomies.categories, sizeGuides]);

  // Abrir o enfocar ventana independiente del sistema operativo
  const handleOpenIndependentPreview = () => {
    if (typeof window === 'undefined') return;

    const width = 1040;
    const height = Math.min(window.screen.availHeight - 60, 940);
    const left = Math.max(20, window.screen.availWidth - width - 30);
    const top = 30;

    const popup = window.open(
      '/admin/productos/preview',
      'matacos_product_standalone_preview',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`
    );

    if (popup) {
      popup.focus();
    }
  };
  // Timer para autoguardado con debounce de 2 segundos en PostgreSQL
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateForm = useCallback((updates: Partial<WizardFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  // Cargar borrador previo de PostgreSQL al montar si existe
  useEffect(() => {
    async function loadDraft() {
      try {
        const res = await getLatestDraftFromPostgres();
        if (res.success && res.draft) {
          // Si el borrador tiene datos, cargarlo
          setForm((prev) => ({
            ...prev,
            ...res.draft.data,
            draftId: res.draft.id,
          }));
          if (res.draft.step && res.draft.step >= 1 && res.draft.step <= 7) {
            setCurrentStep(res.draft.step);
          }
          if (res.draft.updatedAt) {
            setLastSavedTime(
              new Date(res.draft.updatedAt).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            );
          }
        }
      } catch (err) {
        console.error("Error al cargar borrador inicial:", err);
      }
    }
    loadDraft();
  }, []);

  // Efecto de Autoguardado con Debounce en PostgreSQL
  useEffect(() => {
    // No autoguardar si aún está vacío
    if (!form.name && !form.price && (!form.variants || form.variants.length === 0)) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setIsSavingDraft(true);
      const res = await autoSaveDraftToPostgres(form, currentStep);
      setIsSavingDraft(false);

      if (res.success && res.draftId) {
        if (!form.draftId) {
          setForm((prev) => ({ ...prev, draftId: res.draftId }));
        }
        setLastSavedTime(
          new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
        );
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form, currentStep]);

  // Refrescar taxonomías (categorías, marcas, etc.)
  const handleRefreshTaxonomies = async () => {
    const { getTaxonomies } = await import("@/server/actions/taxonomyActions");
    const res = await getTaxonomies();
    if (res.success && res.data) {
      setTaxonomies(res.data);
    }
  };

  // Refrescar guías de talles
  const handleRefreshSizeGuides = async () => {
    const { getSizeGuides } = await import("@/server/actions/sizeGuideActions");
    const res = await getSizeGuides();
    if (res.success && res.data) {
      setSizeGuides(res.data);
    }
  };

  // Calcular estado de cada paso
  const getStepStatus = (stepId: number): StepStatus => {
    if (currentStep === stepId) return "current";

    switch (stepId) {
      case 1:
        return form.name && form.skuModel && form.brandId && form.categoryId
          ? "complete"
          : "pending";
      case 2:
        return (form.generalImages?.length || 0) >= 3 ? "complete" : "pending";
      case 3:
        return Number(form.price) > 0 ? "complete" : "pending";
      case 4:
        return form.shortDescription?.trim() ? "complete" : "pending";
      case 5:
        return !form.useSizeGuide || Boolean(form.sizeGuideId) ? "complete" : "pending";
      case 6:
        return (form.variants?.length || 0) > 0 ? "complete" : "pending";
      case 7:
        return "pending";
      default:
        return "pending";
    }
  };

  // Porcentaje general de progreso
  const completedCount = [1, 2, 3, 4, 5, 6].filter((s) => getStepStatus(s) === "complete").length;
  const progressPercent = Math.round((completedCount / 6) * 100);

  // Descartar borrador
  const handleDiscardDraft = async () => {
    if (window.confirm("¿Seguro que deseas descartar este borrador? Se perderán los cambios.")) {
      if (form.draftId) {
        await deleteProductDraft(form.draftId);
      }
      setForm(INITIAL_FORM);
      setCurrentStep(1);
      setLastSavedTime(null);
    }
  };

  // Guardado manual de borrador
  const handleManualSaveDraft = async () => {
    setIsSavingDraft(true);
    const res = await autoSaveDraftToPostgres(form, currentStep);
    setIsSavingDraft(false);
    if (res.success && res.draftId) {
      setForm((prev) => ({ ...prev, draftId: res.draftId }));
      setLastSavedTime(
        new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
      );
      alert("Borrador guardado correctamente en la base de datos PostgreSQL.");
    }
  };

  // Publicar producto final
  const handlePublish = async () => {
    setErrorMessage(null);
    setIsPublishing(true);

    try {
      const res = await publishProductFromWizard(form);
      setIsPublishing(false);

      if (!res.success) {
        setErrorMessage(res.error || "Ocurrió un error al publicar el producto.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      alert("¡Producto publicado con éxito en el catálogo de Matacos Deportes!");
      router.push("/admin");
    } catch (err) {
      setIsPublishing(false);
      setErrorMessage("Error de conexión al guardar el producto.");
    }
  };

  // Nombres asociados para la Live Preview
  const selectedBrand = taxonomies.brands.find((b) => b.id === form.brandId)?.name;
  const selectedCategory = taxonomies.categories.find((c) => c.id === form.categoryId)?.name;
  const selectedSizeGuide = sizeGuides.find((g) => g.id === form.sizeGuideId);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* ================= TOP BAR FIJO ================= */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/admin"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
            title="Volver al panel"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-xs sm:text-base font-extrabold text-slate-950 truncate max-w-[120px] xs:max-w-[180px] sm:max-w-xs md:max-w-md">
                {form.name || "Nuevo Producto"}
              </h1>
              <span className="bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded border border-slate-200 shrink-0">
                {form.status === "PUBLISHED" ? "Publicado" : "Borrador"}
              </span>
            </div>

            {/* Indicador de Autoguardado en PostgreSQL */}
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-medium truncate">
                    Autoguardando...
                  </span>
                </>
              ) : lastSavedTime ? (
                <>
                  <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">Guardado a las {lastSavedTime}</span>
                </>
              ) : (
                <span className="hidden sm:inline">Los cambios se guardan automáticamente</span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de Acción Superiores */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Botón Vista Previa en Ventana Independiente */}
          <button
            type="button"
            onClick={handleOpenIndependentPreview}
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/90 active:scale-95 text-emerald-950 font-bold text-[11px] sm:text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs select-none"
            title="Abrir vista previa en una ventana independiente"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5] shrink-0" />
            <span className="hidden xs:inline sm:inline">Vista Previa</span>
          </button>

          <button
            type="button"
            onClick={handleDiscardDraft}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-slate-500 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer hidden md:flex items-center gap-1"
            title="Descartar borrador"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Descartar</span>
          </button>

          <button
            type="button"
            onClick={handleManualSaveDraft}
            disabled={isSavingDraft}
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">Guardar Borrador</span>
            <span className="sm:hidden">Guardar</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] text-white text-[11px] sm:text-xs font-extrabold shadow-sm hover:shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <Rocket className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="hidden sm:inline">Publicar Producto</span>
            <span className="sm:hidden">Publicar</span>
          </button>
        </div>
      </header>

      {/* Barra de Progreso General */}
      <div className="w-full bg-slate-200 h-1">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Alerta de Error si falló la publicación */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between text-xs text-red-900 font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-900 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================= BARRA SUPERIOR MOBILE Y TABLET (< lg) CON BOTÓN DE SIDEBAR ================= */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 shadow-2xs sticky top-[56px] sm:top-[64px] z-30">
        <div className="flex items-center justify-between gap-2">
          {/* Botón para abrir el Sidebar lateral de pasos */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:scale-98 transition-all cursor-pointer text-xs min-w-0"
            aria-label="Abrir panel lateral de pasos"
          >
            <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
              <Menu className="w-3.5 h-3.5 text-slate-700" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 text-left">
              <span className="font-extrabold text-slate-900 shrink-0">Paso {currentStep}:</span>
              <span className="font-bold text-emerald-800 truncate max-w-[130px] xs:max-w-[200px] sm:max-w-[280px]">
                {STEPS.find((s) => s.id === currentStep)?.title}
              </span>
            </div>
          </button>

          {/* Porcentaje y completitud */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold">
            <span className="text-emerald-700 font-extrabold">{progressPercent}%</span>
            <span className="text-[10px] text-slate-400 font-normal hidden xs:inline">
              ({completedCount}/6 listos)
            </span>
          </div>
        </div>
      </div>

      {/* ================= SIDEBAR LATERAL DESLIZABLE (DRAWER MOBILE / TABLET) ================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop oscuro translúcido */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Panel Lateral que entra desde la izquierda */}
          <aside className="fixed top-0 bottom-0 left-0 w-[300px] sm:w-[340px] max-w-[85vw] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-250 ease-out">
            {/* Header del Sidebar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Completitud del Producto
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-black text-slate-950">{progressPercent}%</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {completedCount} de 6 pasos listos
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                aria-label="Cerrar panel de pasos"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de progreso rápida */}
            <div className="w-full bg-slate-100 h-1">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Lista de pasos del Sidebar */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {STEPS.map((s) => {
                const status = getStepStatus(s.id);
                const isActive = currentStep === s.id;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setCurrentStep(s.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                      isActive
                        ? "bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold shadow-2xs"
                        : "hover:bg-slate-50 text-slate-700 border border-transparent"
                    }`}
                  >
                    {/* Círculo indicador de estado */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-all ${
                        status === "complete"
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {status === "complete" ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        s.id
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs block truncate ${
                          isActive ? "font-extrabold text-slate-950" : "font-bold text-slate-800"
                        }`}
                      >
                        {s.id}. {s.title}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {s.subtitle}
                      </span>
                    </div>

                    {status === "complete" && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                        Listo
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer explicativo */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 text-center">
              Selecciona un paso para navegar directamente
            </div>
          </aside>
        </div>
      )}

      {/* ================= CUERPO PRINCIPAL (STEPPER + FORM) ================= */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= STEPPER LATERAL DESKTOP (Cols: 3) ================= */}
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs lg:sticky lg:top-24 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Completitud del Producto
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-extrabold text-slate-950">{progressPercent}%</span>
              <span className="text-xs font-bold text-emerald-700">
                {completedCount} de 6 pasos listos
              </span>
            </div>
          </div>

          {/* Lista de Pasos */}
          <nav className="space-y-1">
            {STEPS.map((s) => {
              const status = getStepStatus(s.id);
              const isActive = currentStep === s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(s.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${
                    isActive
                      ? "bg-emerald-50/80 border border-emerald-300 text-emerald-950 font-bold shadow-2xs"
                      : "hover:bg-slate-50 text-slate-600 border border-transparent"
                  }`}
                >
                  {/* Círculo indicador de estado */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 transition-all ${
                      status === "complete"
                        ? "bg-emerald-600 text-white"
                        : isActive
                        ? "bg-emerald-700 text-white ring-2 ring-emerald-300"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {status === "complete" ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.id}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs block truncate ${
                        isActive ? "font-extrabold text-slate-950" : "font-bold text-slate-800"
                      }`}
                    >
                      {s.title}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">{s.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ================= FORMULARIO DEL PASO ACTIVO (Cols: 9 en desktop, 12 en mobile) ================= */}
        <main className="lg:col-span-9 w-full min-w-0 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-7 shadow-xs space-y-6">
          {currentStep === 1 && (
            <Step1Identification
              form={form}
              updateForm={updateForm}
              taxonomies={taxonomies}
              refreshTaxonomies={handleRefreshTaxonomies}
            />
          )}

          {currentStep === 2 && <Step2Photos form={form} updateForm={updateForm} />}

          {currentStep === 3 && <Step3Prices form={form} updateForm={updateForm} />}

          {currentStep === 4 && <Step4TechSpecs form={form} updateForm={updateForm} />}

          {currentStep === 5 && (
            <Step5SizeGuide
              form={form}
              updateForm={updateForm}
              sizeGuides={sizeGuides}
              refreshSizeGuides={handleRefreshSizeGuides}
              brands={taxonomies.brands}
            />
          )}

          {currentStep === 6 && <Step6VariantsStock form={form} updateForm={updateForm} />}

          {currentStep === 7 && (
            <Step7Publishing
              form={form}
              updateForm={updateForm}
              onGoToStep={(stepNum) => setCurrentStep(stepNum)}
            />
          )}

          {/* Navegación Inferior entre Pasos */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 gap-2">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
            >
              <span className="hidden xs:inline">← Paso Anterior</span>
              <span className="xs:hidden">← Anterior</span>
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(7, s + 1))}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-extrabold shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <span className="hidden xs:inline">Siguiente Paso →</span>
                <span className="xs:hidden">Siguiente →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Publicar Producto</span>
                <span className="xs:hidden">Publicar</span>
              </button>
            )}
          </div>
        </main>


      </div>
    </div>
  );
};
