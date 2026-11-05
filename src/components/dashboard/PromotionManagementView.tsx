"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Tag,
  Percent,
  Plus,
  Play,
  Pause,
  Trash2,
  Pencil,
  RefreshCw,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Clock,
  Layers,
  ChevronRight,
  TrendingDown,
  Info,
  X,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getPromoCampaigns,
  setProductDiscount,
  applyCategoryDiscount,
  previewCategoryDiscount,
  removeCategoryDiscount,
  searchProductsForPromotion,
  getPromotionTaxonomies,
  toggleProductDiscountActive,
} from "@/server/actions/ecommerce/promotionActions";

export interface PromoCampaignItem {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryName: string;
  brandName: string;
  disciplineName: string;
  regularPrice: number;
  costPrice: number | null;
  discountPercentage: number;
  discountPrice: number;
  discountActive: boolean;
  discountStartDate: string | null;
  discountEndDate: string | null;
  status: "ACTIVA" | "PROGRAMADA" | "EXPIRADA" | "PAUSADA";
  marginPercentage: number | null;
  isBelowCost: boolean;
}

interface TaxonomyOption {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export function PromotionManagementView() {
  const [campaigns, setCampaigns] = useState<PromoCampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "scheduled" | "expired" | "paused">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Taxonomías para modales
  const [categories, setCategories] = useState<TaxonomyOption[]>([]);
  const [disciplines, setDisciplines] = useState<TaxonomyOption[]>([]);

  // Modales
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);

  // Estado para Modal Individual
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [singleDiscountPct, setSingleDiscountPct] = useState<number>(10);
  const [singleStartDate, setSingleStartDate] = useState<string>("");
  const [singleEndDate, setSingleEndDate] = useState<string>("");
  const [allowBelowCost, setAllowBelowCost] = useState<boolean>(false);
  const [savingSingle, setSavingSingle] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Estado para Modal Masivo
  const [bulkTargetType, setBulkTargetType] = useState<"category" | "discipline">("category");
  const [selectedBulkTargetId, setSelectedBulkTargetId] = useState<string>("");
  const [bulkDiscountPct, setBulkDiscountPct] = useState<number>(15);
  const [bulkStartDate, setBulkStartDate] = useState<string>("");
  const [bulkEndDate, setBulkEndDate] = useState<string>("");
  const [bulkAllowBelowCost, setBulkAllowBelowCost] = useState<boolean>(false);
  const [previewingBulk, setPreviewingBulk] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<{
    totalEvaluated: number;
    willApplyCount: number;
    willSkipCount: number;
    skippedProducts: Array<{
      productId: string;
      productName: string;
      regularPrice: number;
      costPrice: number;
      attemptedDiscountPrice: number;
      reason: string;
    }>;
  } | null>(null);
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [bulkReport, setBulkReport] = useState<any | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Estado para Modal Reversión
  const [revertTargetType, setRevertTargetType] = useState<"category" | "discipline">("category");
  const [selectedRevertTargetId, setSelectedRevertTargetId] = useState<string>("");
  const [reverting, setReverting] = useState(false);
  const [revertError, setRevertError] = useState<string | null>(null);

  // Cargar campañas
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getPromoCampaigns(filterStatus);
      if (res.success && res.data) {
        setCampaigns(res.data);
      } else {
        setErrorMessage(res.error || "No se pudieron cargar las promociones.");
      }
    } catch {
      setErrorMessage("Error de conexión al cargar las promociones.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  // Cargar taxonomías
  const loadTaxonomies = useCallback(async () => {
    try {
      const res = await getPromotionTaxonomies();
      if (res.success && res.data) {
        setCategories(res.data.categories);
        setDisciplines(res.data.disciplines);
      }
    } catch (e) {
      console.warn("No se pudieron cargar taxonomías:", e);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
    loadTaxonomies();
  }, [loadCampaigns, loadTaxonomies]);

  // Mensaje temporizador de auto-cierre
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  // Métricas superiores (KPIs)
  const metrics = useMemo(() => {
    const activeCount = campaigns.filter((c) => c.status === "ACTIVA").length;
    const scheduledCount = campaigns.filter((c) => c.status === "PROGRAMADA").length;
    const expiredCount = campaigns.filter((c) => c.status === "EXPIRADA").length;
    const belowCostCount = campaigns.filter((c) => c.isBelowCost).length;
    const margins = campaigns
      .filter((c) => c.marginPercentage !== null)
      .map((c) => c.marginPercentage!);
    const avgMargin =
      margins.length > 0
        ? Math.round((margins.reduce((a, b) => a + b, 0) / margins.length) * 10) / 10
        : null;

    return { activeCount, scheduledCount, expiredCount, belowCostCount, avgMargin };
  }, [campaigns]);

  // Filtro de texto
  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.categoryName.toLowerCase().includes(q) ||
        c.brandName.toLowerCase().includes(q) ||
        c.disciplineName.toLowerCase().includes(q)
    );
  }, [campaigns, searchQuery]);

  // Alternar pausa / reanudación
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await toggleProductDiscountActive(id, !currentActive);
      if (res.success) {
        setSuccessMessage(
          currentActive ? "Promoción pausada exitosamente." : "Promoción reanudada exitosamente."
        );
        loadCampaigns();
      } else {
        setErrorMessage(res.error || "No se pudo cambiar el estado de la promoción.");
      }
    } catch {
      setErrorMessage("Error de conexión al cambiar estado.");
    }
  };

  // Quitar descuento por completo
  const handleRemoveSingleDiscount = async (productId: string, productName: string) => {
    if (!window.confirm(`¿Quitar la promoción del producto "${productName}" y restaurar precio regular?`)) {
      return;
    }
    try {
      const res = await setProductDiscount(productId, {
        discountActive: false,
        discountPercentage: null,
        discountPrice: null,
        discountStartDate: null,
        discountEndDate: null,
      });
      if (res.success) {
        setSuccessMessage(`Promoción de "${productName}" removida exitosamente.`);
        loadCampaigns();
      } else {
        setErrorMessage(res.error || "No se pudo remover la promoción.");
      }
    } catch {
      setErrorMessage("Error al remover la promoción.");
    }
  };

  // Búsqueda de productos en modal individual
  useEffect(() => {
    const q = productSearch.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchProductsForPromotion(q);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Guardar Descuento Individual
  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setSingleError("Debes seleccionar un producto.");
      return;
    }
    setSavingSingle(true);
    setSingleError(null);

    try {
      const res = await setProductDiscount(
        selectedProduct.id,
        {
          discountPercentage: singleDiscountPct,
          discountActive: true,
          discountStartDate: singleStartDate ? new Date(singleStartDate) : null,
          discountEndDate: singleEndDate ? new Date(singleEndDate) : null,
          allowBelowCost,
        }
      );

      if (res.success) {
        setSuccessMessage(`Promoción fijada con éxito para "${selectedProduct.name}".`);
        setIsSingleModalOpen(false);
        setSelectedProduct(null);
        setProductSearch("");
        loadCampaigns();
      } else {
        if (res.code === "DISCOUNT_BELOW_COST") {
          setSingleError(
            `El precio con descuento quiebra el costo de reposición. Si tienes los permisos necesarios, marca "Autorizar venta bajo costo".`
          );
        } else {
          setSingleError(res.error || "No se pudo guardar la promoción.");
        }
      }
    } catch (err: any) {
      setSingleError(err.message || "Error al procesar la solicitud.");
    } finally {
      setSavingSingle(false);
    }
  };

  // Previsualizar Descuento Masivo
  const handlePreviewBulk = async () => {
    if (!selectedBulkTargetId) {
      setBulkError("Debes seleccionar una Categoría o Disciplina de destino.");
      return;
    }
    setPreviewingBulk(true);
    setBulkError(null);
    setBulkPreview(null);
    setBulkReport(null);

    try {
      const payload: any = {
        discountPercentage: bulkDiscountPct,
        discountStartDate: bulkStartDate ? new Date(bulkStartDate) : null,
        discountEndDate: bulkEndDate ? new Date(bulkEndDate) : null,
        allowBelowCost: bulkAllowBelowCost,
      };
      if (bulkTargetType === "category") {
        payload.categoryId = selectedBulkTargetId;
      } else {
        payload.disciplineId = selectedBulkTargetId;
      }

      const res = await previewCategoryDiscount(payload);
      if (res.success && res.data) {
        setBulkPreview(res.data);
      } else {
        setBulkError(res.error || "Error al previsualizar impacto.");
      }
    } catch {
      setBulkError("Error de conexión al previsualizar.");
    } finally {
      setPreviewingBulk(false);
    }
  };

  // Aplicar Descuento Masivo (Reporte 2B)
  const handleApplyBulk = async () => {
    if (!selectedBulkTargetId) {
      setBulkError("Debes seleccionar una Categoría o Disciplina de destino.");
      return;
    }
    setApplyingBulk(true);
    setBulkError(null);

    try {
      const payload: any = {
        discountPercentage: bulkDiscountPct,
        discountStartDate: bulkStartDate ? new Date(bulkStartDate) : null,
        discountEndDate: bulkEndDate ? new Date(bulkEndDate) : null,
        allowBelowCost: bulkAllowBelowCost,
      };
      if (bulkTargetType === "category") {
        payload.categoryId = selectedBulkTargetId;
      } else {
        payload.disciplineId = selectedBulkTargetId;
      }

      const res = await applyCategoryDiscount(payload);
      if (res.success && res.data) {
        setBulkReport(res.data);
        setSuccessMessage(
          `Descuento masivo aplicado a ${res.data.appliedCount} productos. (${res.data.skippedCount} omitidos por resguardo de costo).`
        );
        loadCampaigns();
      } else {
        setBulkError(res.error || "Error al aplicar descuento masivo.");
      }
    } catch {
      setBulkError("Error de conexión al aplicar descuento.");
    } finally {
      setApplyingBulk(false);
    }
  };

  // Ejecutar Reversión Masiva
  const handleExecuteRevert = async () => {
    if (!selectedRevertTargetId) {
      setRevertError("Debes seleccionar un rubro para revertir.");
      return;
    }
    setReverting(true);
    setRevertError(null);

    try {
      const payload: any = {};
      if (revertTargetType === "category") {
        payload.categoryId = selectedRevertTargetId;
      } else {
        payload.disciplineId = selectedRevertTargetId;
      }

      const res = await removeCategoryDiscount(payload);
      if (res.success) {
        setSuccessMessage(`Se restableció el precio regular en ${res.count} productos.`);
        setIsRevertModalOpen(false);
        loadCampaigns();
      } else {
        setRevertError(res.error || "Error al revertir promociones.");
      }
    } catch {
      setRevertError("Error de conexión al revertir.");
    } finally {
      setReverting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                Campañas & Descuentos Promocionales
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                RF-27
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Gestión omnicanal de ofertas individuales, masivas por rubro y salvaguarda de costos de reposición.
            </p>
          </div>
        </div>

        {/* Botones de acción principales */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadCampaigns}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsRevertModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Revertir Rubro</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setBulkPreview(null);
              setBulkReport(null);
              setBulkError(null);
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Descuento Masivo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProduct(null);
              setProductSearch("");
              setSingleError(null);
              setIsSingleModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00A811] hover:bg-[#00920f] active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#00A811]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Oferta</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="mx-4 lg:mx-8 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mx-4 lg:mx-8 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 lg:p-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Ofertas Activas
              </span>
              <span className="text-xl font-black text-slate-900">
                {metrics.activeCount}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Programadas
              </span>
              <span className="text-xl font-black text-blue-700">
                {metrics.scheduledCount}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Expiradas / Históricas
              </span>
              <span className="text-xl font-black text-slate-700">
                {metrics.expiredCount}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              metrics.belowCostCount > 0
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-slate-50 border-slate-100 text-slate-600"
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Margen Promedio
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900">
                  {metrics.avgMargin !== null ? `${metrics.avgMargin}%` : "N/A"}
                </span>
                {metrics.belowCostCount > 0 && (
                  <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                    {metrics.belowCostCount} bajo costo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filtros de Estado y Búsqueda */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {(
              [
                { id: "all", label: "Todas" },
                { id: "active", label: "Activas" },
                { id: "scheduled", label: "Programadas" },
                { id: "paused", label: "Pausadas" },
                { id: "expired", label: "Expiradas" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto, marca o rubro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Tabla de Promociones */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Cargando promociones...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Tag className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No se encontraron productos con promoción</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery
                  ? "No hay promociones que coincidan con la búsqueda ingresada."
                  : "Comienza creando una nueva oferta individual o aplicando un descuento masivo por rubro."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Rubro</th>
                    <th className="py-3 px-4 text-right">Precio Regular</th>
                    <th className="py-3 px-4 text-center">Descuento</th>
                    <th className="py-3 px-4 text-right">Precio Oferta</th>
                    <th className="py-3 px-4 text-right">Costo & Margen</th>
                    <th className="py-3 px-4 text-center">Vigencia</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCampaigns.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Producto */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl || "/placeholder-product.svg"}
                            alt={item.name}
                            className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                            }}
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-xs">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {item.brandName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rubro */}
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium">{item.categoryName}</span>
                        <span className="text-[10px] text-slate-400 block">{item.disciplineName}</span>
                      </td>

                      {/* Precio Regular */}
                      <td className="py-3 px-4 text-right font-medium text-slate-500 line-through">
                        {formatCurrency(item.regularPrice)}
                      </td>

                      {/* % Descuento */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full font-black text-[11px] bg-emerald-100 text-emerald-800">
                          {item.discountPercentage}% OFF
                        </span>
                      </td>

                      {/* Precio Oferta */}
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        {formatCurrency(item.discountPrice)}
                      </td>

                      {/* Costo & Margen */}
                      <td className="py-3 px-4 text-right">
                        {item.costPrice !== null ? (
                          <div>
                            <span className="text-[10px] text-slate-400 block">
                              Costo: {formatCurrency(item.costPrice)}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                item.isBelowCost
                                  ? "text-rose-600 font-black"
                                  : (item.marginPercentage ?? 0) < 15
                                  ? "text-amber-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {item.isBelowCost ? "⚠️ Bajo Costo" : `+${item.marginPercentage}% margen`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Sin costo informado</span>
                        )}
                      </td>

                      {/* Vigencia */}
                      <td className="py-3 px-4 text-center text-[11px] text-slate-600">
                        {item.discountStartDate || item.discountEndDate ? (
                          <div className="space-y-0.5">
                            {item.discountStartDate && (
                              <span className="block text-[10px]">
                                Desde: {new Date(item.discountStartDate).toLocaleDateString("es-AR")}
                              </span>
                            )}
                            {item.discountEndDate && (
                              <span className="block text-[10px]">
                                Hasta: {new Date(item.discountEndDate).toLocaleDateString("es-AR")}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Permanente</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.status === "ACTIVA"
                              ? "bg-[#00D615]/20 text-[#006e0b] border border-[#00D615]/30"
                              : item.status === "PROGRAMADA"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : item.status === "PAUSADA"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Play / Pause */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(item.id, item.discountActive)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.discountActive
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={item.discountActive ? "Pausar oferta" : "Reanudar oferta"}
                          >
                            {item.discountActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(item);
                              setSingleDiscountPct(item.discountPercentage);
                              setSingleStartDate(
                                item.discountStartDate ? item.discountStartDate.slice(0, 16) : ""
                              );
                              setSingleEndDate(
                                item.discountEndDate ? item.discountEndDate.slice(0, 16) : ""
                              );
                              setAllowBelowCost(item.isBelowCost);
                              setSingleError(null);
                              setIsSingleModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Editar parámetros"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Quitar promoción */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSingleDiscount(item.id, item.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar promoción"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ASIGNACIÓN INDIVIDUAL DE DESCUENTO                              */}
      {/* ========================================================================= */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedProduct ? "Modificar Promoción Individual" : "Nueva Promoción Individual"}
                </h3>
              </div>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {singleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{singleError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSingle} className="space-y-4">
              {/* Selector de Producto si aún no está seleccionado */}
              {!selectedProduct ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Buscar Producto *
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Escribe el nombre o código de barras..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white shadow-lg">
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            if (p.discountPercentage) {
                              setSingleDiscountPct(p.discountPercentage);
                            }
                            setSearchResults([]);
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {p.brandName} • {p.categoryName}
                            </span>
                          </div>
                          <span className="font-black text-slate-900">
                            {formatCurrency(p.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Producto Seleccionado */
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProduct.imageUrl || "/placeholder-product.svg"}
                      alt={selectedProduct.name}
                      className="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200 p-1"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">
                        {selectedProduct.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Regular: {formatCurrency(selectedProduct.price || selectedProduct.regularPrice)}
                        {selectedProduct.costPrice && ` • Costo: ${formatCurrency(selectedProduct.costPrice)}`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              {/* Porcentaje de Descuento */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">Porcentaje de Descuento (1% al 90%) *</label>
                  <span className="font-black text-emerald-700 text-sm">{singleDiscountPct}% OFF</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={singleDiscountPct}
                  onChange={(e) => setSingleDiscountPct(Number(e.target.value))}
                  className="w-full accent-[#00A811]"
                />
              </div>

              {/* Cálculo en vivo */}
              {selectedProduct && (
                (() => {
                  const reg = Number(selectedProduct.price || selectedProduct.regularPrice || 0);
                  const cost = selectedProduct.costPrice !== null ? Number(selectedProduct.costPrice) : null;
                  const discountVal = Math.round(((reg * singleDiscountPct) / 100) * 100) / 100;
                  const finalVal = Math.max(0, Math.round((reg - discountVal) * 100) / 100);
                  const isBelow = cost !== null && finalVal < cost;
                  const margin = cost !== null && cost > 0 ? Math.round((((finalVal - cost) / cost) * 100) * 10) / 10 : null;

                  return (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Precio regular:</span>
                        <span className="line-through">{formatCurrency(reg)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800">
                        <span>Precio bonificado resultante:</span>
                        <span className="text-base font-black">{formatCurrency(finalVal)}</span>
                      </div>
                      {cost !== null && (
                        <div className="flex justify-between text-[11px] pt-1 border-t border-emerald-200/60">
                          <span>Margen de rentabilidad:</span>
                          <span className={isBelow ? "text-rose-600 font-bold" : "text-emerald-700 font-bold"}>
                            {isBelow ? "⚠️ QUIEBRA COSTO DE REPOSICIÓN" : `+${margin}% sobre costo`}
                          </span>
                        </div>
                      )}

                      {isBelow && (
                        <div className="pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-rose-800 font-bold text-[11px]">
                            <input
                              type="checkbox"
                              checked={allowBelowCost}
                              onChange={(e) => setAllowBelowCost(e.target.checked)}
                              className="rounded text-rose-600 focus:ring-rose-500"
                            />
                            <span>Autorizar venta bajo costo (Requiere rol Administrador)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Rango de Fechas Exactas (Huso Horario Argentina) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Inicio (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={singleStartDate}
                    onChange={(e) => setSingleStartDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Fin / Expiración (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={singleEndDate}
                    onChange={(e) => setSingleEndDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSingle || !selectedProduct}
                  className="px-5 py-2.5 rounded-xl bg-[#00A811] hover:bg-[#00920f] active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                >
                  {savingSingle ? "Guardando..." : "Guardar Promoción"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DESCUENTO MASIVO POR RUBRO CON REPORTE 2B                        */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Descuento Masivo por Rubro
                </h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bulkError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{bulkError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Selector de Tipo de Rubro */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkTargetType("category");
                    setSelectedBulkTargetId("");
                    setBulkPreview(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bulkTargetType === "category"
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Por Categoría ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkTargetType("discipline");
                    setSelectedBulkTargetId("");
                    setBulkPreview(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bulkTargetType === "discipline"
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Por Disciplina ({disciplines.length})
                </button>
              </div>

              {/* Selector de Rubro Específico */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Seleccionar {bulkTargetType === "category" ? "Categoría" : "Disciplina"} *
                </label>
                <select
                  value={selectedBulkTargetId}
                  onChange={(e) => {
                    setSelectedBulkTargetId(e.target.value);
                    setBulkPreview(null);
                  }}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Seleccionar --</option>
                  {(bulkTargetType === "category" ? categories : disciplines).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.productCount} productos)
                    </option>
                  ))}
                </select>
              </div>

              {/* Porcentaje de Descuento */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">Porcentaje a Aplicar *</label>
                  <span className="font-black text-emerald-700 text-sm">{bulkDiscountPct}% OFF</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={bulkDiscountPct}
                  onChange={(e) => {
                    setBulkDiscountPct(Number(e.target.value));
                    setBulkPreview(null);
                  }}
                  className="w-full accent-[#00A811]"
                />
              </div>

              {/* Fechas Opcionales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Inicio (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Fin (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={bulkEndDate}
                    onChange={(e) => setBulkEndDate(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Botón de Previsualización */}
              <button
                type="button"
                onClick={handlePreviewBulk}
                disabled={previewingBulk || !selectedBulkTargetId}
                className="w-full py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
              >
                {previewingBulk ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sliders className="w-3.5 h-3.5" />
                )}
                <span>Previsualizar Impacto Financiero</span>
              </button>

              {/* Resultados de la Previsualización */}
              {bulkPreview && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-600">Total productos evaluados:</span>
                    <span className="text-slate-900">{bulkPreview.totalEvaluated}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-emerald-100/70 text-emerald-900 rounded-xl">
                      <span className="block text-base font-black">{bulkPreview.willApplyCount}</span>
                      <span className="text-[10px] font-bold">Se aplicarán con margen seguro</span>
                    </div>
                    <div className="p-2 bg-rose-100/70 text-rose-900 rounded-xl">
                      <span className="block text-base font-black">{bulkPreview.willSkipCount}</span>
                      <span className="text-[10px] font-bold">Se omitirán (quiebran costo)</span>
                    </div>
                  </div>

                  {bulkPreview.skippedProducts.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-rose-700 block">
                        Detalle de productos protegidos de pérdida:
                      </span>
                      <div className="max-h-32 overflow-y-auto divide-y divide-slate-200 bg-white rounded-xl border border-slate-200 p-2 text-[11px]">
                        {bulkPreview.skippedProducts.map((p) => (
                          <div key={p.productId} className="py-1 flex justify-between">
                            <span className="font-semibold truncate max-w-xs">{p.productName}</span>
                            <span className="text-rose-600 font-bold shrink-0">
                              Costo: {formatCurrency(p.costPrice)} &gt; Oferta: {formatCurrency(p.attemptedDiscountPrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bulkPreview.willSkipCount > 0 && (
                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-rose-800 font-bold text-[11px]">
                        <input
                          type="checkbox"
                          checked={bulkAllowBelowCost}
                          onChange={(e) => setBulkAllowBelowCost(e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>Forzar aplicación incluso en artículos bajo costo (Requiere perfil Administrador)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de Confirmación */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulk}
                  disabled={applyingBulk || !selectedBulkTargetId}
                  className="px-5 py-2.5 rounded-xl bg-[#00A811] hover:bg-[#00920f] active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                >
                  {applyingBulk ? "Aplicando..." : "Confirmar y Aplicar Ofertas"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REVERSIÓN MASIVA DE RUBRO                                        */}
      {/* ========================================================================= */}
      {isRevertModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Revertir Promociones de un Rubro
                </h3>
              </div>
              <button
                onClick={() => setIsRevertModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {revertError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{revertError}</span>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Esta acción eliminará inmediatamente los descuentos activos y programados en todos los productos del rubro seleccionado, restableciendo sus precios regulares de lista.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRevertTargetType("category");
                    setSelectedRevertTargetId("");
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    revertTargetType === "category"
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Categoría
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRevertTargetType("discipline");
                    setSelectedRevertTargetId("");
                  }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    revertTargetType === "discipline"
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Disciplina
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rubro a restablecer *
                </label>
                <select
                  value={selectedRevertTargetId}
                  onChange={(e) => setSelectedRevertTargetId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Seleccionar --</option>
                  {(revertTargetType === "category" ? categories : disciplines).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.productCount} productos)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRevertModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRevert}
                  disabled={reverting || !selectedRevertTargetId}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                >
                  {reverting ? "Revirtiendo..." : "Restablecer Precios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
