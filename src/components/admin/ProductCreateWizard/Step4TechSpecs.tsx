"use client";

import React, { useState, useEffect, useRef } from "react";
import { WizardFormState, HighlightItem } from "./types";
import { Plus, Trash2, Sparkles } from "lucide-react";
import {
  HighlightIcon,
  getSmartHighlightIcon,
  AVAILABLE_HIGHLIGHT_ICONS,
} from "./highlightIcons";
import { RichTextEditor } from "./RichTextEditor";

interface Step4Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
}

export const Step4TechSpecs: React.FC<Step4Props> = ({ form, updateForm }) => {
  const highlights = form.highlights || [];
  const specs = form.specs || {};

  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecVal, setNewSpecVal] = useState("");
  const [openIconPickerIdx, setOpenIconPickerIdx] = useState<number | null>(null);

  const pickerRef = useRef<HTMLDivElement>(null);

  // Cerrar selector al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpenIconPickerIdx(null);
      }
    }
    if (openIconPickerIdx !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openIconPickerIdx]);

  // Agregar característica destacada
  const handleAddHighlight = () => {
    if (highlights.length >= 5) return;
    const defaultTitle = "Tecnología Amortiguación";
    const defaultText = "Absorbe el impacto en cada pisada para mayor confort.";
    const smartIcon = getSmartHighlightIcon(defaultTitle, defaultText);

    const newH: HighlightItem = {
      icon: smartIcon,
      title: defaultTitle,
      text: defaultText,
    };
    updateForm({ highlights: [...highlights, newH] });
  };

  const handleUpdateHighlight = (index: number, updates: Partial<HighlightItem>) => {
    const updated = highlights.map((h, i) => (i === index ? { ...h, ...updates } : h));
    updateForm({ highlights: updated });
  };

  // Modificación intuitiva en base al texto escrito
  const handleTitleChange = (index: number, newTitle: string) => {
    const current = highlights[index];
    const smartIcon = getSmartHighlightIcon(newTitle, current?.text || "");
    handleUpdateHighlight(index, {
      title: newTitle,
      icon: smartIcon,
      isCustomIcon: false,
    });
  };

  const handleTextChange = (index: number, newText: string) => {
    const current = highlights[index];
    const smartIcon = getSmartHighlightIcon(current?.title || "", newText);
    handleUpdateHighlight(index, {
      text: newText,
      icon: smartIcon,
      isCustomIcon: false,
    });
  };

  const handleRemoveHighlight = (index: number) => {
    updateForm({ highlights: highlights.filter((_, i) => i !== index) });
    if (openIconPickerIdx === index) {
      setOpenIconPickerIdx(null);
    }
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

      {/* Descripción Detallada con TinyMCE */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-900">
            Descripción Detallada
          </label>
          <span className="text-[11px] text-slate-400">Editor con formato enriquecido (WYSIWYG)</span>
        </div>
        <RichTextEditor
          value={form.description || ""}
          onChange={(newVal) => updateForm({ description: newVal })}
          placeholder="Detalla los beneficios, sensación al uso, tecnologías patentadas e información relevante para el cliente..."
          height={260}
        />
      </div>

      {/* Hasta 5 Características Destacadas con íconos dinámicos e intuitivos */}
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
          <div className="space-y-2.5" ref={pickerRef}>
            {highlights.map((h, idx) => {
              const isOpen = openIconPickerIdx === idx;
              // Si el usuario fijó manualmente un ícono en el selector se respeta, sino se deduce en vivo del texto
              const displayIcon =
                h.isCustomIcon && h.icon
                  ? h.icon
                  : getSmartHighlightIcon(h.title, h.text);

              return (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-start gap-2.5 relative"
                >
                  {/* Selector interactivo y dinámico de ícono */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenIconPickerIdx(isOpen ? null : idx)}
                      className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center mt-0.5 transition-all border border-emerald-200/60 shadow-2xs hover:scale-105 cursor-pointer group"
                      title="Ícono intuitivo automático (clic para cambiar símbolo manualmente)"
                    >
                      <HighlightIcon
                        icon={displayIcon}
                        className="w-4 h-4 group-hover:scale-110 transition-transform"
                      />
                    </button>

                    {/* Popover con catálogo de símbolos deportivos */}
                    {isOpen && (
                      <div className="absolute left-0 top-10 z-40 w-64 p-2.5 bg-white rounded-xl shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-700">
                          <span>Símbolo de la característica</span>
                          <button
                            type="button"
                            onClick={() => {
                              const autoIcon = getSmartHighlightIcon(h.title, h.text);
                              handleUpdateHighlight(idx, {
                                icon: autoIcon,
                                isCustomIcon: false,
                              });
                              setOpenIconPickerIdx(null);
                            }}
                            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                            title="Restablecer detección automática por texto"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Auto</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                          {AVAILABLE_HIGHLIGHT_ICONS.map((item) => {
                            const IconComp = item.component;
                            const isSelected = displayIcon === item.key;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                  handleUpdateHighlight(idx, {
                                    icon: item.key,
                                    isCustomIcon: true,
                                  });
                                  setOpenIconPickerIdx(null);
                                }}
                                className={`p-1.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-all text-center cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white font-bold shadow-xs"
                                    : "bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900"
                                }`}
                                title={item.label}
                              >
                                <IconComp className="w-4 h-4" />
                                <span className="text-[9px] truncate w-full block leading-none">
                                  {item.label.split("/")[0]?.trim()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Título (Ej: Transpirable, Amortiguación...)"
                      value={h.title}
                      onChange={(e) => handleTitleChange(idx, e.target.value)}
                      className="h-8 px-2.5 rounded border border-slate-300 text-xs font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Explicación breve..."
                      value={h.text}
                      onChange={(e) => handleTextChange(idx, e.target.value)}
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
              );
            })}
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
