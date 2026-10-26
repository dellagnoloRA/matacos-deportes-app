"use client";

import React, { useState } from "react";
import { WizardFormState, HighlightItem } from "./types";
import { Plus, Trash2, Sparkles, HelpCircle, Activity, Shield, Feather, Wind, Zap } from "lucide-react";

interface Step4Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
}

export const Step4TechSpecs: React.FC<Step4Props> = ({ form, updateForm }) => {
  const highlights = form.highlights || [];
  const specs = form.specs || {};

  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecVal, setNewSpecVal] = useState("");

  // Agregar característica destacada
  const handleAddHighlight = () => {
    if (highlights.length >= 5) return;
    const newH: HighlightItem = {
      icon: "zap",
      title: "Tecnología Amortiguación",
      text: "Absorbe el impacto en cada pisada para mayor confort.",
    };
    updateForm({ highlights: [...highlights, newH] });
  };

  const handleUpdateHighlight = (index: number, updates: Partial<HighlightItem>) => {
    const updated = highlights.map((h, i) => (i === index ? { ...h, ...updates } : h));
    updateForm({ highlights: updated });
  };

  const handleRemoveHighlight = (index: number) => {
    updateForm({ highlights: highlights.filter((_, i) => i !== index) });
  };

  // Agregar clave-valor de especificación técnica
  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    updateForm({
      specs: {
        ...specs,
        [newSpecKey.trim()]: newSpecVal.trim(),
      },
    });
    setNewSpecKey("");
    setNewSpecVal("");
  };

  const handleRemoveSpec = (keyToRemove: string) => {
    const copy = { ...specs };
    delete copy[keyToRemove];
    updateForm({ specs: copy });
  };

  // Plantillas sugeridas de especificaciones técnicas
  const handleLoadPresetSpecs = () => {
    updateForm({
      specs: {
        "Composición": "100% Poliéster reciclado transpirable",
        "Origen": "Nacional / Argentina",
        "Material de la Suela": "Goma AHAR+ de alta abrasión",
        "Ajuste": "Cordones tradicionales con ojales reforzados",
        "Instrucciones de Cuidado": "Lavar a mano con agua fría, no planchar ni usar secadora",
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">4. Descripción y Ficha Técnica</h2>
        <p className="text-xs text-slate-500">
          Redacta los textos comerciales, características clave y especificaciones técnicas.
        </p>
      </div>

      {/* Descripción Corta */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">
          Descripción Corta (Resumen Destacado) <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={2}
          placeholder="Ej: Calzado deportivo de alto rendimiento para entrenamientos intensos y fondo de larga distancia."
          value={form.shortDescription}
          onChange={(e) => updateForm({ shortDescription: e.target.value })}
          className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          maxLength={180}
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Se visualiza en los primeros renglones y alimenta los resultados de búsqueda.</span>
          <span>{form.shortDescription?.length || 0}/180</span>
        </div>
      </div>

      {/* Descripción Larga */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-900">
          Descripción Detallada
        </label>
        <textarea
          rows={5}
          placeholder="Detalla los beneficios, sensación al uso, tecnologías patentadas e información relevante para el cliente..."
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          className="w-full p-3 rounded-xl border border-slate-300 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>

      {/* Hasta 5 Características Destacadas */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Características Destacadas (Hasta 5)</span>
          </div>
          {highlights.length < 5 && (
            <button
              type="button"
              onClick={handleAddHighlight}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Característica ({highlights.length}/5)</span>
            </button>
          )}
        </div>

        {highlights.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400 bg-slate-50">
            No has agregado características destacadas todavía.
          </div>
        ) : (
          <div className="space-y-2.5">
            {highlights.map((h, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Título (Ej: Transpirable)"
                    value={h.title}
                    onChange={(e) => handleUpdateHighlight(idx, { title: e.target.value })}
                    className="h-8 px-2.5 rounded border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Explicación breve..."
                    value={h.text}
                    onChange={(e) => handleUpdateHighlight(idx, { text: e.target.value })}
                    className="h-8 px-2.5 rounded border border-slate-300 text-xs sm:col-span-2 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveHighlight(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ficha Técnica Dinámica */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900">
            Especificaciones de Ficha Técnica (Composición, Procedencia, etc.)
          </label>
          <button
            type="button"
            onClick={handleLoadPresetSpecs}
            className="text-[11px] text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
          >
            Cargar plantilla estándar
          </button>
        </div>

        {/* Inputs para agregar fila */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Campo (ej: Composición, Material)"
            value={newSpecKey}
            onChange={(e) => setNewSpecKey(e.target.value)}
            className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            placeholder="Valor (ej: 100% Algodón Peinado)"
            value={newSpecVal}
            onChange={(e) => setNewSpecVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSpec()}
            className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleAddSpec}
            className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
          >
            + Agregar
          </button>
        </div>

        {/* Lista de Specs cargadas */}
        {Object.keys(specs).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {Object.entries(specs).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{key}</span>
                  <span className="font-bold text-slate-900">{val}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(key)}
                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
