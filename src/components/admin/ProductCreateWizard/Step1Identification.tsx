"use client";

import React, { useState } from "react";
import { WizardFormState } from "./types";
import { Plus, Check, Tag } from "lucide-react";
import {
  createQuickBrand,
  createQuickCategory,
  createQuickDiscipline,
} from "@/server/actions/taxonomyActions";

interface Step1Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
  taxonomies: {
    brands: { id: string; name: string }[];
    categories: { id: string; name: string }[];
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

  const [isAddingDisc, setIsAddingDisc] = useState(false);
  const [newDiscName, setNewDiscName] = useState("");

  // Helper para autogenerar slug silenciosamente (opcional para el usuario)
  const handleNameChange = (newName: string) => {
    const slug = newName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const updates: Partial<WizardFormState> = {
      name: newName,
      slug: slug,
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
      updateForm({ categoryId: res.data.id });
      setNewCatName("");
      setIsAddingCat(false);
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

      {/* SKU / Código de Modelo */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">
          SKU / Código de Modelo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Ej: AS-NIMB-26"
          value={form.skuModel}
          onChange={(e) => updateForm({ skuModel: e.target.value.toUpperCase().replace(/\s+/g, "-") })}
          className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs"
        />
        <span className="text-[11px] text-slate-400 block">
          Identificador matriz del modelo (se sugiere automáticamente con el nombre).
        </span>
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

      {/* Grid: Marca, Disciplina y Categoría (3 columnas equilibradas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <span>{isAddingBrand ? "Cancelar" : "Nueva"}</span>
            </button>
          </div>

          {isAddingBrand ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Nombre marca"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="flex-1 h-10 px-2.5 rounded-lg border border-emerald-400 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateBrand}
                className="h-10 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
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
                className="flex-1 h-10 px-2.5 rounded-lg border border-emerald-400 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateDiscipline}
                className="h-10 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
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
                className="flex-1 h-10 px-2.5 rounded-lg border border-emerald-400 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="h-10 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
              >
                Guardar
              </button>
            </div>
          ) : (
            <select
              value={form.categoryId}
              onChange={(e) => updateForm({ categoryId: e.target.value })}
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
