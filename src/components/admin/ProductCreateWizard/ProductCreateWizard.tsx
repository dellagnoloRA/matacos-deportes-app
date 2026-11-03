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
  Save,
  Rocket,
  Trash2,
  CheckCircle2,
  Loader2,
  Clock,
  Sparkles,
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

  // Modal / Drawer de Live Preview en pantallas < 1280px (laptops/móviles)
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);

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
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
            title="Volver al panel"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-950 truncate max-w-xs sm:max-w-md">
                {form.name || "Nuevo Producto (Plantilla en Blanco)"}
              </h1>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-slate-200">
                {form.status === "PUBLISHED" ? "Publicado" : "Borrador"}
              </span>
            </div>

            {/* Indicador de Autoguardado en PostgreSQL */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              {isSavingDraft ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                  <span className="text-emerald-700 font-medium">
                    Autoguardando en PostgreSQL...
                  </span>
                </>
              ) : lastSavedTime ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Guardado en PostgreSQL a las {lastSavedTime}</span>
                </>
              ) : (
                <span>Los cambios se guardan automáticamente en PostgreSQL</span>
              )}
            </div>
          </div>
        </div>

        {/* Botones de Acción Superiores */}
        <div className="flex items-center gap-2">
          {/* Botón flotante para ver preview en pantallas medianas / chicas (<1280px) */}
          <button
            type="button"
            onClick={() => setIsPreviewDrawerOpen(true)}
            className="xl:hidden h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            title="Ver vista previa cliente"
          >
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Vista Previa</span>
          </button>

          <button
            type="button"
            onClick={handleDiscardDraft}
            className="h-9 px-3 rounded-xl text-slate-500 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer hidden sm:flex items-center gap-1"
            title="Descartar borrador"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Descartar</span>
          </button>

          <button
            type="button"
            onClick={handleManualSaveDraft}
            disabled={isSavingDraft}
            className="h-9 px-3.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Guardar Borrador</span>
            <span className="sm:hidden">Guardar</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="h-9 px-4 rounded-xl bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] text-white text-xs font-extrabold shadow-sm hover:shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Rocket className="w-3.5 h-3.5" />
            )}
            <span>Publicar Producto</span>
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

      {/* ================= CUERPO PRINCIPAL (STEPPER + FORM + PREVIEW) ================= */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= STEPPER LATERAL (Cols: 3) ================= */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs sticky top-24 space-y-4">
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

        {/* ================= FORMULARIO DEL PASO ACTIVO (Cols: 5 o 9 según pantalla) ================= */}
        <main className="lg:col-span-9 xl:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
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
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              ← Paso Anterior
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(7, s + 1))}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-extrabold shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span>Siguiente Paso →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Publicar Producto</span>
              </button>
            )}
          </div>
        </main>

        {/* ================= LIVE PREVIEW DERECHA (PANTALLAS >= 1280px) ================= */}
        <section className="hidden xl:block xl:col-span-4 sticky top-24 h-[calc(100vh-8rem)]">
          <LiveProductPreview
            form={form}
            brandName={selectedBrand}
            categoryName={selectedCategory}
            selectedSizeGuide={selectedSizeGuide}
          />
        </section>
      </div>

      {/* ================= MODAL / DRAWER FLOTANTE DE LIVE PREVIEW (< 1280px) ================= */}
      {isPreviewDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end xl:hidden">
          <div className="w-full max-w-2xl bg-slate-100 h-full p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 shrink-0">
              <span className="text-sm font-extrabold text-slate-950">
                Vista Previa Ficha de Producto
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-300 font-bold text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <LiveProductPreview
                form={form}
                brandName={selectedBrand}
                categoryName={selectedCategory}
                selectedSizeGuide={selectedSizeGuide}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
