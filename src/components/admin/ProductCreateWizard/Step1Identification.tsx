"use client";

import React, { useState } from "react";
import { WizardFormState } from "./types";
import { Plus, Check, Sparkles, Tag, Layers, Compass, HelpCircle } from "lucide-react";
import {
  createQuickBrand,
  createQuickCategory,
  createQuickSubcategory,
  createQuickDiscipline,
} from "@/server/actions/taxonomyActions";

interface Step1Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
  taxonomies: {
    brands: { id: string; name: string }[];
    categories: { id: string; name: string; subcategories: { id: string; name: string }[] }[];
    disciplines: { id: string; name: string }[];
  };
  refreshTaxonomies: () => Promise<void>;
}

export const Step1Identification: React.FC<Step1Props> = ({
  form,
  updateForm,
  taxonomies,
  refreshTaxonomies,
}) => {
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [isAddingSubcat, setIsAddingSubcat] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState("");

  const [isAddingDisc, setIsAddingDisc] = useState(false);
  const [newDiscName, setNewDiscName] = useState("");

  // Subcategorías de la categoría elegida
  const currentCategory = taxonomies.categories.find((c) => c.id === form.categoryId);
  const subcategories = currentCategory?.subcategories || [];

  // Helper para autogenerar slug
  const handleNameChange = (newName: string) => {
    const slug = newName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const updates: Partial<WizardFormState> = {
      name: newName,
      slug: form.slug ? form.slug : slug,
    };

    // Si aún no hay SKU, sugerir uno
    if (!form.skuModel && newName.length >= 3) {
      const code = newName
        .split(" ")
        .slice(0, 3)
        .map((w) => w.slice(0, 3).toUpperCase())
        .join("-");
      updates.skuModel = code;
    }

    updateForm(updates);
  };

  // Crear marca rápida
  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    const res = await createQuickBrand(newBrandName.trim());
    if (res.success && res.data) {
      await refreshTaxonomies();
      updateForm({ brandId: res.data.id });
      setNewBrandName("");
      setIsAddingBrand(false);
    }
  };

  // Crear categoría rápida
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await createQuickCategory(newCatName.trim());
    if (res.success && res.data) {
      await refreshTaxonomies();
      updateForm({ categoryId: res.data.id, subcategoryId: "" });
      setNewCatName("");
      setIsAddingCat(false);
    }
  };

  // Crear subcategoría rápida
  const handleCreateSubcategory = async () => {
    if (!newSubcatName.trim() || !form.categoryId) return;
    const res = await createQuickSubcategory(form.categoryId, newSubcatName.trim());
    if (res.success && res.data) {
      await refreshTaxonomies();
      updateForm({ subcategoryId: res.data.id });
      setNewSubcatName("");
      setIsAddingSubcat(false);
    }
  };

  // Crear disciplina rápida
  const handleCreateDiscipline = async () => {
    if (!newDiscName.trim()) return;
    const res = await createQuickDiscipline(newDiscName.trim());
    if (res.success && res.data) {
      await refreshTaxonomies();
      updateForm({ disciplineId: res.data.id });
      setNewDiscName("");
      setIsAddingDisc(false);
    }
  };

  // Toggle de tags
  const handleToggleTag = (tag: string) => {
    const current = form.tags || [];
    if (current.includes(tag)) {
      updateForm({ tags: current.filter((t) => t !== tag) });
    } else {
      updateForm({ tags: [...current, tag] });
    }
  };

  const COMMERCIAL_TAGS = ["Nuevo", "Más vendido", "Oferta", "Últimos talles", "Edición Limitada"];
  const GENDERS = ["Hombre", "Mujer", "Unisex", "Niños"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">1. Identificación del Producto</h2>
        <p className="text-xs text-slate-500">
          Completa los datos principales de clasificación y nomenclatura del catálogo.
        </p>
      </div>

      {/* Nombre del Producto */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">
          Nombre del Producto <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Ej: Zapatillas Gel-Nimbus 26 Running"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-2xs font-medium"
          maxLength={120}
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>El nombre público tal como aparecerá en la tienda y buscadores.</span>
          <span>{form.name.length}/120</span>
        </div>
      </div>

      {/* Grid: SKU Modelo y Slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SKU / Código Modelo */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">
            SKU / Código de Modelo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ej: AS-NIMB-26"
            value={form.skuModel}
            onChange={(e) => updateForm({ skuModel: e.target.value.toUpperCase().replace(/\s+/g, "-") })}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
          <span className="text-[10px] text-slate-400 block">Identificador matriz del modelo.</span>
        </div>

        {/* Slug URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-900">
            Slug URL <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center rounded-lg border border-slate-300 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-emerald-500">
            <span className="px-2.5 text-xs text-slate-400 bg-slate-50 border-r border-slate-200 select-none">
              /productos/
            </span>
            <input
              type="text"
              placeholder="zapatillas-gel-nimbus-26"
              value={form.slug}
              onChange={(e) =>
                updateForm({
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, ""),
                })
              }
              className="w-full h-10 px-2.5 text-xs font-mono focus:outline-none bg-white"
            />
          </div>
          <span className="text-[10px] text-slate-400 block">Dirección amigable para SEO.</span>
        </div>
      </div>

      {/* Género (Pills) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">
          Género <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {GENDERS.map((g) => {
            const isSelected = form.gender.toLowerCase() === g.toLowerCase();
            return (
              <button
                key={g}
                type="button"
                onClick={() => updateForm({ gender: g.toUpperCase() })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-950 text-white shadow-xs scale-102"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Marca y Disciplina */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Marca */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900">
              Marca <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingBrand(!isAddingBrand)}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingBrand ? "Cancelar" : "Nueva Marca"}</span>
            </button>
          </div>

          {isAddingBrand ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Nombre de la marca"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="flex-1 h-9 px-2.5 rounded-lg border border-emerald-400 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateBrand}
                className="h-9 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          ) : (
            <select
              value={form.brandId}
              onChange={(e) => updateForm({ brandId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
            >
              <option value="">-- Seleccionar Marca --</option>
              {taxonomies.brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Disciplina */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900">
              Disciplina / Deporte <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingDisc(!isAddingDisc)}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingDisc ? "Cancelar" : "Nueva"}</span>
            </button>
          </div>

          {isAddingDisc ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Ej: Pádel, Hockey"
                value={newDiscName}
                onChange={(e) => setNewDiscName(e.target.value)}
                className="flex-1 h-9 px-2.5 rounded-lg border border-emerald-400 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateDiscipline}
                className="h-9 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          ) : (
            <select
              value={form.disciplineId}
              onChange={(e) => updateForm({ disciplineId: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
            >
              <option value="">-- Seleccionar Disciplina --</option>
              {taxonomies.disciplines.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grid: Categoría y Subcategoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Categoría */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900">
              Categoría <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setIsAddingCat(!isAddingCat)}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{isAddingCat ? "Cancelar" : "Nueva"}</span>
            </button>
          </div>

          {isAddingCat ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Ej: Calzado, Indumentaria"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 h-9 px-2.5 rounded-lg border border-emerald-400 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="h-9 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          ) : (
            <select
              value={form.categoryId}
              onChange={(e) => updateForm({ categoryId: e.target.value, subcategoryId: "" })}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-medium"
            >
              <option value="">-- Seleccionar Categoría --</option>
              {taxonomies.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Subcategoría */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900">Subcategoría</label>
            {form.categoryId && (
              <button
                type="button"
                onClick={() => setIsAddingSubcat(!isAddingSubcat)}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{isAddingSubcat ? "Cancelar" : "Nueva"}</span>
              </button>
            )}
          </div>

          {isAddingSubcat ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Ej: Zapatillas de Running"
                value={newSubcatName}
                onChange={(e) => setNewSubcatName(e.target.value)}
                className="flex-1 h-9 px-2.5 rounded-lg border border-emerald-400 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateSubcategory}
                className="h-9 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          ) : (
            <select
              value={form.subcategoryId || ""}
              onChange={(e) => updateForm({ subcategoryId: e.target.value })}
              disabled={!form.categoryId}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 font-medium"
            >
              <option value="">
                {form.categoryId ? "-- Seleccionar Subcategoría --" : "(Elige categoría primero)"}
              </option>
              {subcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Etiquetas comerciales */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
          <Tag className="w-3.5 h-3.5 text-slate-600" />
          <span>Etiquetas Comerciales (Badges en Tienda)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {COMMERCIAL_TAGS.map((tag) => {
            const isChecked = form.tags?.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isChecked
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
