"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Tag,
  Layers,
  Boxes,
  Plus,
  Edit3,
  Trash2,
  Search,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  getDisciplines,
  getCategories,
  getBrands,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  createCategory,
  updateCategory,
  deleteCategory,
  createBrand,
  updateBrand,
  deleteBrand,
} from "@/server/actions/categoryActions";
import { slugify } from "@/lib/textUtils";

export type MasterTabType = "brands" | "disciplines" | "categories";

export interface MasterItem {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
}

interface MasterCategoriesManagerProps {
  initialTab?: MasterTabType;
  onTabChange?: (tab: MasterTabType) => void;
  onBackToInventory?: () => void;
  onDataModified?: () => void;
}

export function MasterCategoriesManager({
  initialTab = "brands",
  onTabChange,
  onBackToInventory,
  onDataModified,
}: MasterCategoriesManagerProps) {
  const [activeTab, setActiveTab] = useState<MasterTabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Datos
  const [disciplines, setDisciplines] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [brands, setBrands] = useState<MasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de modales y operaciones
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MasterItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modales de eliminación
  const [deleteTarget, setDeleteTarget] = useState<MasterItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blockedDeleteTarget, setBlockedDeleteTarget] = useState<{
    item: MasterItem;
    count: number;
  } | null>(null);

  // Feedback Toast temporal
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (title: string, description: string, type: "success" | "error" = "success") => {
    setToastMessage({ title, description, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

  // Cargar todos los clasificadores desde la base de datos
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [discRes, catRes, brandRes] = await Promise.all([
        getDisciplines(),
        getCategories(),
        getBrands(),
      ]);

      if (discRes.success && Array.isArray(discRes.data)) {
        setDisciplines(discRes.data as MasterItem[]);
      }
      if (catRes.success && Array.isArray(catRes.data)) {
        setCategories(catRes.data as MasterItem[]);
      }
      if (brandRes.success && Array.isArray(brandRes.data)) {
        setBrands(brandRes.data as MasterItem[]);
      }
    } catch (err) {
      console.error("Error al cargar clasificadores maestros:", err);
      showToast("Error de conexión", "No se pudieron obtener los clasificadores del servidor.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Sincronizar pestaña con prop si cambia externamente
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSwitchTab = (tab: MasterTabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    if (onTabChange) onTabChange(tab);
  };

  // Determinar listado activo
  const activeList = useMemo(() => {
    switch (activeTab) {
      case "brands":
        return brands;
      case "disciplines":
        return disciplines;
      case "categories":
        return categories;
    }
  }, [activeTab, brands, disciplines, categories]);

  // Filtrado reactivo por buscador
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeList;
    return activeList.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q)
    );
  }, [activeList, searchQuery]);

  // Nombres singulares y plurales dinámicos
  const entityLabel = useMemo(() => {
    switch (activeTab) {
      case "brands":
        return { singular: "Marca", plural: "Marcas", icon: Tag, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "disciplines":
        return { singular: "Disciplina", plural: "Disciplinas", icon: Layers, color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
      case "categories":
        return { singular: "Categoría", plural: "Categorías", icon: Boxes, color: "text-amber-700 bg-amber-50 border-amber-200" };
    }
  }, [activeTab]);

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setItemToEdit(null);
    setFormName("");
    setFormSlug("");
    setIsSlugManual(false);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (item: MasterItem) => {
    setItemToEdit(item);
    setFormName(item.name);
    setFormSlug(item.slug);
    setIsSlugManual(true);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Manejo de cambio de nombre con autogeneración de slug
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!isSlugManual) {
      setFormSlug(slugify(val));
    }
  };

  // Guardar (Crear o Actualizar)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanSlug = formSlug.trim() || slugify(cleanName);

    if (!cleanName || cleanName.length < 2) {
      setFormError(`El nombre de la ${entityLabel.singular.toLowerCase()} debe tener al menos 2 caracteres.`);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (itemToEdit) {
        // Modo Actualización
        let res;
        if (activeTab === "brands") {
          res = await updateBrand({ id: itemToEdit.id, name: cleanName, slug: cleanSlug });
        } else if (activeTab === "disciplines") {
          res = await updateDiscipline({ id: itemToEdit.id, name: cleanName, slug: cleanSlug });
        } else {
          res = await updateCategory({ id: itemToEdit.id, name: cleanName, slug: cleanSlug });
        }

        if (res.success && res.data) {
          showToast(
            `${entityLabel.singular} actualizada`,
            `Se guardaron los cambios en "${cleanName}".`
          );
          setIsEditModalOpen(false);
          await loadAllData();
          if (onDataModified) onDataModified();
        } else {
          setFormError(res.error || `No se pudo actualizar la ${entityLabel.singular.toLowerCase()}.`);
        }
      } else {
        // Modo Creación
        let res;
        if (activeTab === "brands") {
          res = await createBrand({ name: cleanName, slug: cleanSlug });
        } else if (activeTab === "disciplines") {
          res = await createDiscipline({ name: cleanName, slug: cleanSlug });
        } else {
          res = await createCategory({ name: cleanName, slug: cleanSlug });
        }

        if (res.success && res.data) {
          showToast(
            `${entityLabel.singular} creada`,
            `Se registró exitosamente "${cleanName}".`
          );
          setIsEditModalOpen(false);
          await loadAllData();
          if (onDataModified) onDataModified();
        } else {
          setFormError(res.error || `No se pudo crear la ${entityLabel.singular.toLowerCase()}.`);
        }
      }
    } catch (err) {
      console.error("Error al guardar clasificador:", err);
      setFormError("Ocurrió un error inesperado en el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  // Manejador del clic de eliminar con chequeo de integridad referencial
  const handleDeleteClick = (item: MasterItem) => {
    const productsCount = item._count?.products ?? 0;
    if (productsCount > 0) {
      // Bloquear eliminación mostrando aviso informativo
      setBlockedDeleteTarget({ item, count: productsCount });
    } else {
      // Permitir confirmación de eliminación segura
      setDeleteTarget(item);
      setIsDeleteModalOpen(true);
    }
  };

  // Confirmar eliminación segura
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      let res;
      if (activeTab === "brands") {
        res = await deleteBrand(deleteTarget.id);
      } else if (activeTab === "disciplines") {
        res = await deleteDiscipline(deleteTarget.id);
      } else {
        res = await deleteCategory(deleteTarget.id);
      }

      if (res.success) {
        showToast(
          `${entityLabel.singular} eliminada`,
          `Se eliminó "${deleteTarget.name}" del catálogo.`
        );
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        await loadAllData();
        if (onDataModified) onDataModified();
      } else {
        showToast("No se pudo eliminar", res.error || "Error al eliminar el elemento.", "error");
      }
    } catch (err) {
      console.error("Error al eliminar clasificador:", err);
      showToast("Error inesperado", "Ocurrió un error al procesar la baja.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification Flotante */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-rose-950 text-white border-rose-800"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-[#00D615] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <div>
            <h5 className="font-bold text-xs">{toastMessage.title}</h5>
            <p className="text-[11px] text-slate-300">{toastMessage.description}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header Superior con Botón de Regreso y Título */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {onBackToInventory && (
            <button
              type="button"
              onClick={onBackToInventory}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 font-bold transition-all active:scale-95 shadow-2xs"
              title="Volver a Productos y Stock"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestión de Tablas Maestras
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Administración de Marcas, Disciplinas y Categorías para filtros del POS y E-commerce.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAllData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs disabled:opacity-50"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl border border-emerald-400/40 shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-2 select-none"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.2]" />
            <span>Nueva {entityLabel.singular}</span>
          </button>
        </div>
      </div>

      {/* 2. Pestañas de Clasificadores con Contadores */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
        {/* Pestaña Marcas */}
        <button
          type="button"
          onClick={() => handleSwitchTab("brands")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "brands"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Tag className="w-4 h-4 text-emerald-500" />
          <span>Marcas</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "brands" ? "bg-slate-800 text-emerald-400" : "bg-slate-100 text-slate-600"
            }`}
          >
            {brands.length}
          </span>
        </button>

        {/* Pestaña Disciplinas */}
        <button
          type="button"
          onClick={() => handleSwitchTab("disciplines")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "disciplines"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Disciplinas</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "disciplines" ? "bg-slate-800 text-indigo-300" : "bg-slate-100 text-slate-600"
            }`}
          >
            {disciplines.length}
          </span>
        </button>

        {/* Pestaña Categorías */}
        <button
          type="button"
          onClick={() => handleSwitchTab("categories")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "categories"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Boxes className="w-4 h-4 text-amber-500" />
          <span>Categorías</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "categories" ? "bg-slate-800 text-amber-300" : "bg-slate-100 text-slate-600"
            }`}
          >
            {categories.length}
          </span>
        </button>
      </div>

      {/* 3. Barra de Búsqueda y Resumen */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar ${entityLabel.plural.toLowerCase()} por nombre o slug...`}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
          <span>
            Mostrando <strong>{filteredList.length}</strong> de {activeList.length} {entityLabel.plural.toLowerCase()}
          </span>
        </div>
      </div>

      {/* 4. Tabla Centralizada de Clasificadores */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Nombre de {entityLabel.singular}</th>
                <th className="py-3.5 px-4">Slug URL / SEO</th>
                <th className="py-3.5 px-4 text-center">Productos Vinculados</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <span className="text-xs font-medium">Cargando {entityLabel.plural.toLowerCase()}...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 px-4">
                    <div className="max-w-xs mx-auto space-y-2 text-slate-400">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <entityLabel.icon className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-700 text-xs">
                        {searchQuery
                          ? `No se encontraron ${entityLabel.plural.toLowerCase()} para "${searchQuery}"`
                          : `No hay ${entityLabel.plural.toLowerCase()} registradas`}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {searchQuery
                          ? "Intente con otro término de búsqueda."
                          : `Comience creando una nueva ${entityLabel.singular.toLowerCase()} para asociarla a sus productos.`}
                      </p>
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 mt-2"
                        >
                          Limpiar filtro
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] px-3.5 py-1.5 rounded-xl mt-2 shadow-xs border border-emerald-400/40"
                        >
                          <Plus className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                          Crear {entityLabel.singular}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const productsCount = item._count?.products ?? 0;
                  const hasLinkedProducts = productsCount > 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Nombre */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${entityLabel.color}`}>
                            <entityLabel.icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-xs">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* 2. Slug */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.slug}
                        </span>
                      </td>

                      {/* 3. Cantidad de Productos Vinculados */}
                      <td className="py-3.5 px-4 text-center">
                        {hasLinkedProducts ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                            title={`${productsCount} producto(s) del catálogo dependen de este clasificador`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {productsCount} {productsCount === 1 ? "producto" : "productos"}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200"
                            title="No tiene productos vinculados. Puede eliminarse de forma segura."
                          >
                            Sin productos
                          </span>
                        )}
                      </td>

                      {/* 4. Acciones */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            title={`Editar ${entityLabel.singular.toLowerCase()}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              hasLinkedProducts
                                ? "text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                                : "text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                            }`}
                            title={
                              hasLinkedProducts
                                ? `Bloqueado: asociada a ${productsCount} producto(s)`
                                : `Eliminar ${entityLabel.singular.toLowerCase()}`
                            }
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

      {/* ======================================================== */}
      {/* MODAL 1: ALTA Y MODIFICACIÓN DE CLASIFICADOR */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${entityLabel.color}`}>
                  <entityLabel.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {itemToEdit ? `Editar ${entityLabel.singular}` : `Nueva ${entityLabel.singular}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {itemToEdit
                      ? `Modificar nombre y slug de "${itemToEdit.name}"`
                      : `Crear clasificador en la tabla maestra del catálogo`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Campo Nombre */}
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">
                  Nombre de {entityLabel.singular} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={`Ej: ${activeTab === "brands" ? "Nike, Topper" : activeTab === "disciplines" ? "Pádel, Tenis" : "Indumentaria, Pelotas"}`}
                  autoFocus
                  disabled={isSaving}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              {/* Campo Slug (Autogenerado / Editable) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-bold text-xs">
                    Slug amigable (URL / SEO)
                  </label>
                  {!isSlugManual && formName && (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Autogenerado
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 font-mono text-xs select-none">
                    /
                  </span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => {
                      setFormSlug(e.target.value);
                      setIsSlugManual(true);
                    }}
                    placeholder="slug-amigable"
                    disabled={isSaving}
                    className="w-full pl-6 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">
                  Identificador único en minúsculas y sin acentos para URLs y filtros de catálogo.
                </p>
              </div>

              {/* Footer de Acciones */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !formName.trim()}
                  className="bg-gradient-to-b from-[#16a34a] to-[#0f6f36] hover:from-[#15803d] hover:to-[#0c592b] active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-2xl border border-emerald-400/40 shadow-[0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{itemToEdit ? "Guardar Cambios" : `Crear ${entityLabel.singular}`}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: AVISO DE BLOQUEO POR INTEGRIDAD REFERENCIAL */}
      {/* ======================================================== */}
      {blockedDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                Protección de Integridad Referencial
              </span>
              <h3 className="text-base font-black text-slate-900 mt-2">
                No es posible eliminar "{blockedDeleteTarget.item.name}"
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Esta {entityLabel.singular.toLowerCase()} está asociada actualmente a{" "}
                <strong className="text-slate-900 font-bold">
                  {blockedDeleteTarget.count} producto(s)
                </strong>{" "}
                en el catálogo. Para prevenir inconsistencias en ventas, arqueos y reportes, el sistema impide su baja.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">¿Cómo proceder?</span>
              <p className="text-[11px] text-slate-500">
                1. Reasigne los productos vinculados a otra {entityLabel.singular.toLowerCase()}, o
              </p>
              <p className="text-[11px] text-slate-500">
                2. Si los productos ya no se comercializan, deles de baja desde el inventario.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setBlockedDeleteTarget(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN SEGURA (0 PRODUCTOS) */}
      {/* ======================================================== */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                ¿Eliminar {entityLabel.singular.toLowerCase()} "{deleteTarget.name}"?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Este clasificador no tiene ningún producto asociado. La eliminación será definitiva y no se podrá deshacer.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteTarget(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, eliminar definitivamente</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

