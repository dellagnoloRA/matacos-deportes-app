"use client";

import React from "react";
import { WizardFormState } from "./types";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  Clock,
  Rocket,
  FileText,
  ArrowRight,
} from "lucide-react";

interface Step7Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
  onGoToStep: (stepNumber: number) => void;
}

export const Step7Publishing: React.FC<Step7Props> = ({ form, updateForm, onGoToStep }) => {
  const dimensions = form.dimensions || {};

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
        <h2 className="text-lg font-extrabold text-slate-950">7. Logística y Publicación</h2>
        <p className="text-xs text-slate-500">
          Especifica datos opcionales de paquetería para envíos y define el estado de publicación del producto.
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

      {/* Peso y Dimensiones de Envío (Opcional) */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Dimensiones y Peso para Paquetería (Andreani / Correo Argentino)</span>
          </div>
          <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Opcional
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">Peso (Gramos)</label>
              <span className="text-[10px] text-slate-400">Opcional</span>
            </div>
            <input
              type="number"
              placeholder="Ej: 500"
              value={form.weightGrams ?? ""}
              onChange={(e) =>
                updateForm({ weightGrams: e.target.value === "" ? null : parseInt(e.target.value) })
              }
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
              min={0}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">Largo (cm)</label>
              <span className="text-[10px] text-slate-400">Opcional</span>
            </div>
            <input
              type="number"
              placeholder="Ej: 30"
              value={dimensions.length ?? ""}
              onChange={(e) =>
                updateForm({
                  dimensions: {
                    ...dimensions,
                    length: e.target.value === "" ? undefined : parseInt(e.target.value),
                  },
                })
              }
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
              min={0}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">Ancho (cm)</label>
              <span className="text-[10px] text-slate-400">Opcional</span>
            </div>
            <input
              type="number"
              placeholder="Ej: 20"
              value={dimensions.width ?? ""}
              onChange={(e) =>
                updateForm({
                  dimensions: {
                    ...dimensions,
                    width: e.target.value === "" ? undefined : parseInt(e.target.value),
                  },
                })
              }
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
              min={0}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700">Alto (cm)</label>
              <span className="text-[10px] text-slate-400">Opcional</span>
            </div>
            <input
              type="number"
              placeholder="Ej: 12"
              value={dimensions.height ?? ""}
              onChange={(e) =>
                updateForm({
                  dimensions: {
                    ...dimensions,
                    height: e.target.value === "" ? undefined : parseInt(e.target.value),
                  },
                })
              }
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Estado de Publicación */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
        <label className="block text-xs font-bold text-slate-900">Estado de Publicación</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => updateForm({ status: "DRAFT" })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
              form.status === "DRAFT"
                ? "bg-slate-950 text-white border-slate-950 shadow-xs ring-1 ring-slate-950"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                form.status === "DRAFT"
                  ? "bg-white/15 text-white"
                  : "bg-white border border-slate-200 text-slate-600 shadow-2xs"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <strong className="block text-xs font-bold">Guardar como Borrador</strong>
              <span className="text-[10px] opacity-80 block leading-tight">
                Visible solo en el panel de control.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateForm({ status: "PUBLISHED" })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
              form.status === "PUBLISHED"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-600"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                form.status === "PUBLISHED"
                  ? "bg-white/15 text-white"
                  : "bg-white border border-slate-200 text-emerald-600 shadow-2xs"
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <strong className="block text-xs font-bold">Publicar Ahora</strong>
              <span className="text-[10px] opacity-80 block leading-tight">
                Disponible de inmediato en la tienda y mostrador.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => updateForm({ status: "SCHEDULED" })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
              form.status === "SCHEDULED"
                ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-600"
                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                form.status === "SCHEDULED"
                  ? "bg-white/15 text-white"
                  : "bg-white border border-slate-200 text-blue-600 shadow-2xs"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <strong className="block text-xs font-bold">Programar Lanzamiento</strong>
              <span className="text-[10px] opacity-80 block leading-tight">
                Se activará en fecha y hora fija.
              </span>
            </div>
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
