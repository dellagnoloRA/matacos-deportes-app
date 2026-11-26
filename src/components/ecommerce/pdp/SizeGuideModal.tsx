"use client";

import React, { useState, useEffect } from "react";
import { X, Ruler, Footprints, Shirt, HelpCircle, Info } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import type { PublicSizeGuide } from "@/types/ecommerce";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  gender?: "HOMBRE" | "MUJER" | "NINO" | "UNISEX";
  defaultTab?: "hombre" | "mujer" | "medidas" | "indumentaria" | "calzado";
  sizeGuide?: PublicSizeGuide | null;
}

type TabKey = "producto" | "hombre" | "mujer" | "medidas" | "indumentaria";

function resolveInitialTab(
  sizeGuide: PublicSizeGuide | null | undefined,
  defaultTab: SizeGuideModalProps["defaultTab"],
  gender: NonNullable<SizeGuideModalProps["gender"]>
): TabKey {
  if (sizeGuide && (sizeGuide.columns.length > 0 || sizeGuide.guideImage)) {
    return "producto";
  }
  if (defaultTab === "indumentaria") return "indumentaria";
  if (defaultTab === "calzado") return gender === "MUJER" ? "mujer" : "hombre";
  if (gender === "MUJER") return "mujer";
  if (gender === "HOMBRE") return "hombre";
  return "medidas";
}

export function SizeGuideModal({
  isOpen,
  onClose,
  gender = "UNISEX",
  defaultTab,
  sizeGuide,
}: SizeGuideModalProps) {
  const storeSettings = useStoreSettings();
  const hasCustomGuide = Boolean(
    sizeGuide && (sizeGuide.columns.length > 0 || sizeGuide.guideImage)
  );

  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    resolveInitialTab(sizeGuide, defaultTab, gender)
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(resolveInitialTab(sizeGuide, defaultTab, gender));
    }
  }, [isOpen, sizeGuide, defaultTab, gender]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="size-guide-modal-title"
                className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight"
              >
                {hasCustomGuide && sizeGuide ? sizeGuide.name : "Guía Oficial de Talles y Medidas"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Matacos Deportes • Saavedra 241, Formosa Capital
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Opciones de guía de talles"
          className="flex border-b border-slate-200 px-4 sm:px-6 pt-3 gap-2 sm:gap-4 bg-white overflow-x-auto text-xs"
        >
          {hasCustomGuide && sizeGuide && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "producto"}
              onClick={() => setActiveTab("producto")}
              className={`pb-3 font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "producto"
                  ? "border-[#00D615] text-slate-950 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Tabla del Producto</span>
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "hombre"}
            onClick={() => setActiveTab("hombre")}
            className={`pb-3 font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "hombre"
                ? "border-[#00D615] text-slate-950 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Calzado Hombre</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "mujer"}
            onClick={() => setActiveTab("mujer")}
            className={`pb-3 font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "mujer"
                ? "border-[#00D615] text-slate-950 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Calzado Mujer</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "medidas"}
            onClick={() => setActiveTab("medidas")}
            className={`pb-3 font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "medidas"
                ? "border-[#00D615] text-slate-950 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Cómo medir tu pie?</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "indumentaria"}
            onClick={() => setActiveTab("indumentaria")}
            className={`pb-3 font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "indumentaria"
                ? "border-[#00D615] text-slate-950 font-black"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Indumentaria</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-600">
          {/* 0. Guía específica vinculada al producto en BD */}
          {activeTab === "producto" && sizeGuide && (
            <div className="space-y-4">
              {sizeGuide.fitNote && (
                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Nota de calce:</strong> {sizeGuide.fitNote}
                  </span>
                </div>
              )}

              {sizeGuide.guideImage && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                  <img
                    src={sizeGuide.guideImage}
                    alt={sizeGuide.name}
                    className="w-full max-h-80 object-contain rounded-xl"
                  />
                </div>
              )}

              {sizeGuide.columns.length > 0 && sizeGuide.rows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                      <tr>
                        {sizeGuide.columns.map((col) => (
                          <th key={col} className="p-2.5 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {sizeGuide.rows.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"}>
                          {sizeGuide.columns.map((col, cIdx) => (
                            <td
                              key={col}
                              className={`p-2.5 whitespace-nowrap ${cIdx === 0 ? "font-bold text-slate-950" : "font-medium"}`}
                            >
                              {row[col] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-[11px] text-slate-500">
                Medidas expresadas en <strong>{sizeGuide.unit || "cm"}</strong> • {sizeGuide.type.replace("_", " ")}
              </p>
            </div>
          )}

          {/* 1. Calzado Hombre */}
          {activeTab === "hombre" && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src="/images/talles/guia-talles-hombre.jpg"
                  alt="Tabla de talles Hombre - Matacos Deportes"
                  className="w-full max-h-96 object-contain rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-500 italic text-center">
                Tabla de equivalencias oficiales para calzados deportivos masculinos (Topper, Puma, Crocs, etc.).
              </p>
            </div>
          )}

          {/* 2. Calzado Mujer */}
          {activeTab === "mujer" && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src="/images/talles/guia-talles-mujer.jpg"
                  alt="Tabla de talles Mujer - Matacos Deportes"
                  className="w-full max-h-96 object-contain rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-500 italic text-center">
                Tabla de equivalencias oficiales para calzados deportivos femeninos y sandalias Crocs.
              </p>
            </div>
          )}

          {/* 3. ¿Cómo medir tu pie? */}
          {activeTab === "medidas" && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-3">
                <img
                  src="/images/talles/guia-talles-medidas.png"
                  alt="Instructivo para medir tu pie - Matacos Deportes"
                  className="w-full max-h-80 object-contain rounded-xl"
                />
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wide">
                  Pasos sencillos para medir tu pie en casa:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Colocá una hoja de papel en el suelo pegada a la pared.</li>
                  <li>Poné tu pie descalzo sobre la hoja con el talón apoyado firmemente contra la pared.</li>
                  <li>Con un lápiz en posición vertical, marcá hasta dónde llega tu dedo más largo.</li>
                  <li>Medí con regla la distancia entre el borde de la hoja y la marca (en centímetros).</li>
                  <li>Compará la medida obtenida con las tablas de Hombre o Mujer de las pestañas anteriores.</li>
                </ol>
              </div>
            </div>
          )}

          {/* 4. Indumentaria */}
          {activeTab === "indumentaria" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Medidas corporales de referencia para remeras, shorts, mallas de competición y pantalones:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2.5">Talle</th>
                      <th className="p-2.5">Pecho (cm)</th>
                      <th className="p-2.5">Cintura (cm)</th>
                      <th className="p-2.5">Cadera (cm)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="p-2.5 font-bold">XS</td>
                      <td className="p-2.5">80 - 85</td>
                      <td className="p-2.5">60 - 65</td>
                      <td className="p-2.5">85 - 90</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-bold">S</td>
                      <td className="p-2.5">86 - 91</td>
                      <td className="p-2.5">66 - 71</td>
                      <td className="p-2.5">91 - 96</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">M</td>
                      <td className="p-2.5">92 - 97</td>
                      <td className="p-2.5">72 - 77</td>
                      <td className="p-2.5">97 - 102</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-bold">L</td>
                      <td className="p-2.5">98 - 103</td>
                      <td className="p-2.5">78 - 83</td>
                      <td className="p-2.5">103 - 108</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">XL</td>
                      <td className="p-2.5">104 - 110</td>
                      <td className="p-2.5">84 - 90</td>
                      <td className="p-2.5">109 - 115</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-bold">XXL</td>
                      <td className="p-2.5">111 - 118</td>
                      <td className="p-2.5">91 - 98</td>
                      <td className="p-2.5">116 - 122</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-[11px] text-emerald-950">
            <div>
              <strong>¿Tenés dudas con tu talle?</strong> Acercate al local de Saavedra 241 para probarte sin compromiso o consultanos directamente por WhatsApp.
            </div>
            <a
              href={`https://wa.me/${storeSettings.whatsappNumber}?text=Hola%20Matacos!%20Tengo%20dudas%20con%20el%20talle%20de%20un%20producto`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black rounded-lg uppercase tracking-wider shrink-0 transition-colors shadow-xs"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
