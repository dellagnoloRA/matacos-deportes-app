"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Tag,
  FolderTree,
  Trophy,
  Palette,
  Plus,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Sliders,
  Boxes,
} from "lucide-react";
import {
  getBrandsWithStats,
  getCategoriesWithStats,
  getDisciplinesWithStats,
  getColorsWithStats,
  createBrand,
  updateBrand,
  deleteBrand,
  createCategory,
  updateCategory,
  deleteCategory,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  createColor,
  updateColor,
  deleteColor,
} from "@/server/actions/categoryActions";
import { slugify } from "@/lib/textUtils";

export type DetailSubcategory = "marcas" | "categorias" | "disciplinas" | "colores";

interface ItemData {
  id: string;
  name: string;
  slug?: string;
  hexCode?: string;
  _count?: {
    products?: number;
    variants?: number;
  };
}

interface ProductDetailsManagerViewProps {
  initialSubcategory?: DetailSubcategory;
  onSubcategoryChange?: (sub: DetailSubcategory) => void;
}

export function ProductDetailsManagerView({
  initialSubcategory = "marcas",
  onSubcategoryChange,
}: ProductDetailsManagerViewProps) {
  const [activeTab, setActiveTab] = useState<DetailSubcategory>(initialSubcategory);

  // Sync with initialSubcategory when prop changes
  useEffect(() => {
    setActiveTab(initialSubcategory);
  }, [initialSubcategory]);

  // Data states
  const [brands, setBrands] = useState<ItemData[]>([]);
  const [categories, setCategories] = useState<ItemData[]>([]);
  const [disciplines, setDisciplines] = useState<ItemData[]>([]);
  const [colors, setColors] = useState<ItemData[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemData | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formHex, setFormHex] = useState("#10b981");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ id: string; title: string; desc?: string; type?: "success" | "error" } | null>(null);

  const showToast = (title: string, desc?: string, type: "success" | "error" = "success") => {
    const id = Date.now().toString();
    setToast({ id, title, desc, type });
    setTimeout(() => {
      setToast((c) => (c?.id === id ? null : c));
    }, 4000);
  };

  // Load all catalogs
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [resBrands, resCats, resDiscs, resCols] = await Promise.all([
        getBrandsWithStats(),
        getCategoriesWithStats(),
        getDisciplinesWithStats(),
        getColorsWithStats(),
      ]);

      if (resBrands.success && resBrands.data) setBrands(resBrands.data);
      if (resCats.success && resCats.data) setCategories(resCats.data);
      if (resDiscs.success && resDiscs.data) setDisciplines(resDiscs.data);
      if (resCols.success && resCols.data) setColors(resCols.data);
    } catch (err) {
      console.error("Error al cargar detalles de producto:", err);
      showToast("Error", "No se pudieron cargar todos los catálogos", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectTab = (tab: DetailSubcategory) => {
    setActiveTab(tab);
    setSearchQuery("");
    if (onSubcategoryChange) {
      onSubcategoryChange(tab);
    }
  };

  // Current active list
  const currentList = useMemo(() => {
    switch (activeTab) {
      case "marcas":
        return brands;
      case "categorias":
        return categories;
      case "disciplinas":
        return disciplines;
      case "colores":
        return colors;
      default:
        return [];
    }
  }, [activeTab, brands, categories, disciplines, colors]);

  // Filtered list
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.slug && item.slug.toLowerCase().includes(q))
    );
  }, [currentList, searchQuery]);

  // Tab metadata
  const tabConfig = {
    marcas: {
      singular: "Marca",
      plural: "Marcas",
      icon: Tag,
      description: "Marcas de indumentaria, calzado y equipamiento",
    },
    categorias: {
      singular: "Categoría",
      plural: "Categorías",
      icon: FolderTree,
      description: "Clasificación de productos (Calzado, Mallas, Accesorios)",
    },
    disciplinas: {
      singular: "Disciplina",
      plural: "Disciplinas",
      icon: Trophy,
      description: "Deportes y actividades principales (Natación, Vóley, Fitness)",
    },
    colores: {
      singular: "Color",
      plural: "Colores",
      icon: Palette,
      description: "Paleta de colores disponible para variantes de productos",
    },
  }[activeTab];

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormName("");
    setFormSlug("");
    setFormHex("#10b981");
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: ItemData) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormSlug(item.slug || slugify(item.name));
    setFormHex(item.hexCode || "#10b981");
    setFormError(null);
  };

  // Handle Save (Create / Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("El nombre es requerido");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        // UPDATE
        let res: { success: boolean; error?: string };
        if (activeTab === "marcas") {
          res = await updateBrand(editingItem.id, { name: formName, slug: formSlug });
        } else if (activeTab === "categorias") {
          res = await updateCategory(editingItem.id, { name: formName, slug: formSlug });
        } else if (activeTab === "disciplinas") {
          res = await updateDiscipline(editingItem.id, { name: formName, slug: formSlug });
        } else {
          res = await updateColor(editingItem.id, { name: formName, hexCode: formHex });
        }

        if (!res.success) {
          setFormError(res.error || "No se pudo actualizar");
          return;
        }

        showToast(`${tabConfig.singular} actualizada`, `Se guardaron los cambios para "${formName}".`);
        setEditingItem(null);
        await loadAllData();
      } else {
        // CREATE
        let res: { success: boolean; error?: string };
        if (activeTab === "marcas") {
          res = await createBrand({ name: formName, slug: formSlug });
        } else if (activeTab === "categorias") {
          res = await createCategory({ name: formName, slug: formSlug });
        } else if (activeTab === "disciplinas") {
          res = await createDiscipline({ name: formName, slug: formSlug });
        } else {
          res = await createColor({ name: formName, hexCode: formHex });
        }

        if (!res.success) {
          setFormError(res.error || "No se pudo crear");
          return;
        }

        showToast(`${tabConfig.singular} creada`, `Se agregó "${formName}" correctamente.`);
        setIsCreateModalOpen(false);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
      setFormError("Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);

    try {
      let res: { success: boolean; error?: string };
      if (activeTab === "marcas") {
        res = await deleteBrand(itemToDelete.id);
      } else if (activeTab === "categorias") {
        res = await deleteCategory(itemToDelete.id);
      } else if (activeTab === "disciplinas") {
        res = await deleteDiscipline(itemToDelete.id);
      } else {
        res = await deleteColor(itemToDelete.id);
      }

      if (!res.success) {
        showToast("No se pudo eliminar", res.error, "error");
        setItemToDelete(null);
        return;
      }

      showToast(
        `${tabConfig.singular} eliminada`,
        `Se eliminó "${itemToDelete.name}" del catálogo.`
      );
      setItemToDelete(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Error", "Error al procesar la eliminación", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAssociatedCount = (item: ItemData) => {
    if (activeTab === "colores") {
      return item._count?.variants || 0;
    }
    return item._count?.products || 0;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 select-none">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-5 max-w-sm">
          {toast.type === "error" ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#00D615] shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h5 className="font-bold text-xs">{toast.title}</h5>
            {toast.desc && <p className="text-[11px] text-slate-300 mt-0.5">{toast.desc}</p>}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-[#00D615] flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Detalles de Producto
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Administración de marcas, categorías, disciplinas y paleta de colores conectadas a la base de datos
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            title="Recargar datos"
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 text-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva {tabConfig.singular}</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => handleSelectTab("marcas")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "marcas"
              ? "bg-[#06241d] text-white border-emerald-500/50 shadow-md scale-[1.01]"
              : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">Marcas</span>
            <Tag className={`w-4 h-4 ${activeTab === "marcas" ? "text-[#00D615]" : "text-slate-400"}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{brands.length}</span>
            <span className="text-[10.5px] opacity-70">registradas</span>
          </div>
        </div>

        <div
          onClick={() => handleSelectTab("categorias")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "categorias"
              ? "bg-[#06241d] text-white border-emerald-500/50 shadow-md scale-[1.01]"
              : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">Categorías</span>
            <FolderTree className={`w-4 h-4 ${activeTab === "categorias" ? "text-[#00D615]" : "text-slate-400"}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{categories.length}</span>
            <span className="text-[10.5px] opacity-70">registradas</span>
          </div>
        </div>

        <div
          onClick={() => handleSelectTab("disciplinas")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "disciplinas"
              ? "bg-[#06241d] text-white border-emerald-500/50 shadow-md scale-[1.01]"
              : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">Disciplinas</span>
            <Trophy className={`w-4 h-4 ${activeTab === "disciplinas" ? "text-[#00D615]" : "text-slate-400"}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{disciplines.length}</span>
            <span className="text-[10.5px] opacity-70">registradas</span>
          </div>
        </div>

        <div
          onClick={() => handleSelectTab("colores")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "colores"
              ? "bg-[#06241d] text-white border-emerald-500/50 shadow-md scale-[1.01]"
              : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/80 text-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold opacity-80">Colores</span>
            <Palette className={`w-4 h-4 ${activeTab === "colores" ? "text-[#00D615]" : "text-slate-400"}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black">{colors.length}</span>
            <span className="text-[10.5px] opacity-70">en catálogo</span>
          </div>
        </div>
      </div>

      {/* Subcategory Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-fit overflow-x-auto custom-scrollbar">
        <button
          onClick={() => handleSelectTab("marcas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "marcas"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Marcas</span>
          <span className="ml-1 text-[10.5px] font-mono px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-500">
            {brands.length}
          </span>
        </button>

        <button
          onClick={() => handleSelectTab("categorias")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "categorias"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-emerald-600" />
          <span>Categorías</span>
          <span className="ml-1 text-[10.5px] font-mono px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-500">
            {categories.length}
          </span>
        </button>

        <button
          onClick={() => handleSelectTab("disciplinas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "disciplinas"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
          <span>Disciplinas</span>
          <span className="ml-1 text-[10.5px] font-mono px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-500">
            {disciplines.length}
          </span>
        </button>

        <button
          onClick={() => handleSelectTab("colores")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "colores"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-emerald-600" />
          <span>Colores</span>
          <span className="ml-1 text-[10.5px] font-mono px-1.5 py-0.2 bg-slate-100 rounded-full text-slate-500">
            {colors.length}
          </span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar ${tabConfig.plural.toLowerCase()}...`}
            className="w-full pl-9 pr-8 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00D615]/40 focus:border-[#00D615] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 self-end sm:self-center">
          Mostrando <strong className="text-slate-900">{filteredList.length}</strong> de {currentList.length} {tabConfig.plural.toLowerCase()}
        </div>
      </div>

      {/* Table Container with native horizontal scroll */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar touch-pan-x select-text">
          <table className="w-full text-left text-xs min-w-[620px] border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px] tracking-wider">
              <tr>
                {activeTab === "colores" ? (
                  <>
                    <th className="py-3 px-5 min-w-[80px]">MUESTRA</th>
                    <th className="py-3 px-4 min-w-[200px]">NOMBRE DEL COLOR</th>
                    <th className="py-3 px-4 min-w-[140px]">CÓDIGO HEX</th>
                    <th className="py-3 px-4 min-w-[150px]">VARIANTES VINCULADAS</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-5 min-w-[220px]">NOMBRE</th>
                    <th className="py-3 px-4 min-w-[180px]">SLUG / IDENTIFICADOR</th>
                    <th className="py-3 px-4 min-w-[160px]">PRODUCTOS ASOCIADOS</th>
                  </>
                )}
                <th className="py-3 px-5 min-w-[130px] text-right sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]">
                  ACCIONES
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "colores" ? 5 : 4} className="text-center py-12 px-4">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Boxes className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs">No se encontraron resultados</h4>
                      <p className="text-slate-400 text-[11px]">
                        {searchQuery
                          ? `No hay coincidencias para "${searchQuery}".`
                          : `No hay ${tabConfig.plural.toLowerCase()} registradas.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const associatedCount = getAssociatedCount(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      {activeTab === "colores" ? (
                        <>
                          {/* Color Swatch */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs shrink-0"
                                style={{ backgroundColor: item.hexCode || "#10b981" }}
                              />
                            </div>
                          </td>

                          {/* Color Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-xs">
                            {item.name}
                          </td>

                          {/* Hex Code */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {item.hexCode || "#10b981"}
                            </span>
                          </td>

                          {/* Linked Variants */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                associatedCount > 0
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {associatedCount} {associatedCount === 1 ? "variante" : "variantes"}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Name */}
                          <td className="py-3.5 px-5 font-bold text-slate-900 text-xs">
                            {item.name}
                          </td>

                          {/* Slug */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                            {item.slug || slugify(item.name)}
                          </td>

                          {/* Associated Products */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                associatedCount > 0
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {associatedCount} {associatedCount === 1 ? "producto" : "productos"}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/90 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title={`Modificar ${tabConfig.singular}`}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(item)}
                            title={`Eliminar ${tabConfig.singular}`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL CREAR / EDITAR                                      */}
      {/* ========================================================= */}
      {(isCreateModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  <tabConfig.icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? `Modificar ${tabConfig.singular}` : `Nueva ${tabConfig.singular}`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de {tabConfig.singular} *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingItem && activeTab !== "colores") {
                      setFormSlug(slugify(e.target.value));
                    }
                  }}
                  placeholder={`Ej: ${activeTab === "colores" ? "Azul Marino" : activeTab === "marcas" ? "Nike Pro" : "Accesorios"}`}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00D615]/40 focus:border-[#00D615]"
                  autoFocus
                />
              </div>

              {/* Slug (Para Marcas, Categorías, Disciplinas) */}
              {activeTab !== "colores" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Slug / Identificador URL
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="identificador-unico"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00D615]/40 focus:border-[#00D615]"
                  />
                  <span className="text-[10.5px] text-slate-400 mt-1 block">
                    Se genera automáticamente según el nombre.
                  </span>
                </div>
              )}

              {/* Selector de Color (Exclusivo para Colores) */}
              {activeTab === "colores" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Muestra y Código Hexadecimal
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formHex}
                      onChange={(e) => setFormHex(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-200 p-0.5 cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={formHex}
                      onChange={(e) => setFormHex(e.target.value)}
                      placeholder="#10b981"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00D615]/40 focus:border-[#00D615]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {["#0f172a", "#ffffff", "#dc2626", "#2563eb", "#10b981", "#f59e0b", "#9333ea"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormHex(c)}
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL ELIMINAR (CON PROTECCIÓN DE INTEGRIDAD REFERENCIAL)  */}
      {/* ========================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Eliminar {tabConfig.singular}
                </h3>
                <p className="text-[11px] text-slate-400">Confirmación de seguridad</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              ¿Estás seguro de que deseas eliminar permanentemente <strong>"{itemToDelete.name}"</strong>?
            </p>

            {/* Advertencia si hay productos o variantes vinculadas */}
            {getAssociatedCount(itemToDelete) > 0 ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Elemento en uso
                </div>
                <p className="text-[11.5px] leading-relaxed">
                  Hay <strong>{getAssociatedCount(itemToDelete)}</strong> {activeTab === "colores" ? "variante(s)" : "producto(s)"} asociados a este elemento. Para proteger la consistencia de tu stock y ventas, debes reasignar los productos antes de poder eliminarlo.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                Este elemento no está en uso por ningún producto actualmente. Puede eliminarse de manera segura.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting || getAssociatedCount(itemToDelete) > 0}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
