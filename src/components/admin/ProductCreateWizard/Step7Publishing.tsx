"use client";

import React from "react";
import { WizardFormState } from "./types";
import {
  Package,
  Globe,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Send,
  Eye,
  Layers,
  ArrowRight,
} from "lucide-react";

interface Step7Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
  onGoToStep: (stepNumber: number) => void;
}

export const Step7Publishing: React.FC<Step7Props> = ({ form, updateForm, onGoToStep }) => {
  const dimensions = form.dimensions || { length: 30, width: 20, height: 12 };

  // Checklist de Validación
  const checklist = [
    {
      id: 1,
      title: "Identificación básica",
      isValid: Boolean(form.name && form.skuModel && form.brandId && form.categoryId),
      description: form.name
        ? `${form.name} (${form.skuModel})`
        : "Falta nombre, SKU, marca o categoría.",
    },
    {
      id: 2,
      title: "Fotos del producto (Opcional)",
      isValid: true,
      description:
        (form.generalImages?.length || 0) > 0
          ? `${form.generalImages?.length} foto(s) cargada(s).`
          : "Sin fotos cargadas (opcional).",
    },
    {
      id: 3,
      title: "Precio de venta",
      isValid: Number(form.price) > 0,
      description: form.price > 0 ? `$ ${form.price}` : "El precio debe ser mayor a $0.",
    },
    {
      id: 4,
      title: "Descripción",
      isValid: Boolean(form.shortDescription && form.shortDescription.length > 5),
      description: form.shortDescription ? "Descripción corta cargada." : "Falta descripción corta.",
    },
    {
      id: 5,
      title: "Guía de Talles",
      isValid: !form.useSizeGuide || Boolean(form.sizeGuideId),
      description: !form.useSizeGuide ? "Producto sin guía de talles." : "Guía vinculada con éxito.",
    },
    {
      id: 6,
      title: "Variantes de Stock",
      isValid: (form.variants?.length || 0) > 0,
      description: `${form.variants?.length || 0} variante(s) de color/talle generadas.`,
    },
  ];

  const allPassed = checklist.every((c) => c.isValid);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">7. Logística, SEO y Publicación</h2>
        <p className="text-xs text-slate-500">
          Especifica datos de paquetería, visibilidad en buscadores y el estado del producto.
        </p>
      </div>

      {/* Resumen Final / Checklist de Publicación */}
      <div
        className={`p-4 rounded-2xl border ${
          allPassed
            ? "bg-emerald-50/70 border-emerald-300"
            : "bg-amber-50/70 border-amber-300"
        } space-y-3 shadow-xs`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {allPassed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
            <h3 className="text-sm font-extrabold text-slate-950">
              {allPassed
                ? "¡Todo listo para publicar en Matacos Deportes!"
                : "Requisitos pendientes antes de publicar"}
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-600">
            {checklist.filter((c) => c.isValid).length} de {checklist.length} requisitos cumplidos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`p-2.5 rounded-xl border flex items-center justify-between ${
                item.isValid
                  ? "bg-white border-emerald-200 text-emerald-950"
                  : "bg-white border-amber-200 text-amber-950"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                    item.isValid ? "bg-emerald-600" : "bg-amber-500"
                  }`}
                >
                  {item.isValid ? "✓" : "!"}
                </span>
                <div>
                  <strong className="block text-[11px]">{item.title}</strong>
                  <span className="text-[10px] text-slate-500">{item.description}</span>
                </div>
              </div>

              {!item.isValid && (
                <button
                  type="button"
                  onClick={() => onGoToStep(item.id)}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline flex items-center gap-0.5 cursor-pointer ml-2"
                >
                  <span>Completar</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Peso y Dimensiones de Envío */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Package className="w-4 h-4 text-emerald-600" />
          <span>Dimensiones y Peso para Paquetería (Andreani / Correo Argentino)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Peso (Gramos)</label>
            <input
              type="number"
              placeholder="Ej: 650"
              value={form.weightGrams || ""}
              onChange={(e) =>
                updateForm({ weightGrams: e.target.value ? parseInt(e.target.value) : null })
              }
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs"
              min={0}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Largo (cm)</label>
            <input
              type="number"
              placeholder="30"
              value={dimensions.length}
              onChange={(e) =>
                updateForm({
                  dimensions: { ...dimensions, length: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Ancho (cm)</label>
            <input
              type="number"
              placeholder="20"
              value={dimensions.width}
              onChange={(e) =>
                updateForm({
                  dimensions: { ...dimensions, width: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Alto (cm)</label>
            <input
              type="number"
              placeholder="12"
              value={dimensions.height}
              onChange={(e) =>
                updateForm({
                  dimensions: { ...dimensions, height: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Optimización SEO */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Globe className="w-4 h-4 text-blue-600" />
          <span>SEO y Posicionamiento en Buscadores</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Meta Título (Google)</label>
            <input
              type="text"
              placeholder={form.name ? `${form.name} | Matacos Deportes` : "Título para Google..."}
              value={form.metaTitle || ""}
              onChange={(e) => updateForm({ metaTitle: e.target.value })}
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs"
              maxLength={70}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Meta Descripción</label>
            <textarea
              rows={2}
              placeholder={
                form.shortDescription
                  ? form.shortDescription
                  : "Comprá online con 6 cuotas sin interés y retiro gratis en Saavedra 241, Formosa..."
              }
              value={form.metaDescription || ""}
              onChange={(e) => updateForm({ metaDescription: e.target.value })}
              className="w-full p-2 rounded-lg border border-slate-300 text-xs"
              maxLength={160}
            />
          </div>

          {/* Vista Previa Google Snippet */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 text-left font-sans">
            <span className="text-[10px] text-slate-400 block">
              https://matacosdeportes.com.ar/productos/{form.slug || "producto"}
            </span>
            <strong className="text-xs text-blue-700 block truncate">
              {form.metaTitle || form.name || "Título del Producto en Google"} | Matacos Deportes
            </strong>
            <p className="text-[11px] text-slate-600 line-clamp-2">
              {form.metaDescription ||
                form.shortDescription ||
                "Comprá online en Matacos Deportes Formosa. 6 cuotas sin interés, envíos a todo el país y retiro en local Saavedra 241."}
            </p>
          </div>
        </div>
      </div>

      {/* Estado de Publicación */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
        <label className="block text-xs font-bold text-slate-900">Estado de Publicación</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => updateForm({ status: "DRAFT" })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              form.status === "DRAFT"
                ? "bg-slate-950 text-white border-slate-950 shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <strong className="block text-xs">📝 Guardar como Borrador</strong>
            <span className="text-[10px] opacity-80">Visible solo en el panel de control.</span>
          </button>

          <button
            type="button"
            onClick={() => updateForm({ status: "PUBLISHED" })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              form.status === "PUBLISHED"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <strong className="block text-xs">🚀 Publicar Ahora</strong>
            <span className="text-[10px] opacity-80">
              Disponible de inmediato en la tienda y mostrador.
            </span>
          </button>

          <button
            type="button"
            onClick={() => updateForm({ status: "SCHEDULED" })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              form.status === "SCHEDULED"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <strong className="block text-xs">⏰ Programar Lanzamiento</strong>
            <span className="text-[10px] opacity-80">Se activará en fecha y hora fija.</span>
          </button>
        </div>

        {form.status === "SCHEDULED" && (
          <div className="pt-2">
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Fecha y Hora de Publicación
            </label>
            <input
              type="datetime-local"
              value={form.publishedAt || ""}
              onChange={(e) => updateForm({ publishedAt: e.target.value })}
              className="h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
};
