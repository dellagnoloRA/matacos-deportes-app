"use client";

import React, { useState } from "react";
import { WizardFormState } from "./types";
import {
  UploadCloud,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

interface Step2Props {
  form: WizardFormState;
  updateForm: (updates: Partial<WizardFormState>) => void;
}

export const Step2Photos: React.FC<Step2Props> = ({ form, updateForm }) => {
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [selectedColorForPhoto, setSelectedColorForPhoto] = useState("");

  const photos = form.generalImages || [];
  const photoCount = photos.length;
  const hasMinimumPhotos = photoCount >= 3;

  // Lista de colores disponibles
  const availableColors = React.useMemo(() => {
    const list = new Set<string>();
    form.variants.forEach((v) => {
      if (v.color) list.add(v.color);
    });
    return Array.from(list);
  }, [form.variants]);

  // Manejador para agregar URL directa
  const handleAddUrl = () => {
    if (!imageUrlInput.trim()) return;

    const newImage = {
      url: imageUrlInput.trim(),
      isPrimary: photos.length === 0,
      order: photos.length,
      color: selectedColorForPhoto || undefined,
    };

    updateForm({ generalImages: [...photos, newImage] });
    setImageUrlInput("");
  };

  // Manejador para subir archivos locales desde la PC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos = [...photos];
    Array.from(files).forEach((file) => {
      if (file.size > 12 * 1024 * 1024) {
        alert(`La imagen ${file.name} supera el límite de 12 MB.`);
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      newPhotos.push({
        url: objectUrl,
        isPrimary: newPhotos.length === 0,
        order: newPhotos.length,
        color: selectedColorForPhoto || undefined,
      });
    });

    updateForm({ generalImages: newPhotos });
    e.target.value = "";
  };

  // Marcar como foto principal
  const handleSetPrimary = (index: number) => {
    const updated = photos.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    updateForm({ generalImages: updated });
  };

  // Eliminar foto
  const handleRemove = (index: number) => {
    const updated = photos.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
      updated[0].isPrimary = true;
    }
    updateForm({ generalImages: updated });
  };

  // Mover orden arriba / abajo
  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const copy = [...photos];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const updated = copy.map((img, idx) => ({ ...img, order: idx }));
    updateForm({ generalImages: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-950">2. Galería de Fotos y Vistas por Color</h2>
        <p className="text-xs text-slate-500">
          Carga las fotos del producto. Mínimo 3 fotos recomendadas para tienda online.
        </p>
      </div>

      {/* Indicador de cumplimiento de fotos mínimas */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
          hasMinimumPhotos
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}
      >
        <div className="flex items-center gap-2">
          {hasMinimumPhotos ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>
            {hasMinimumPhotos
              ? `¡Excelente! Tienes ${photoCount} fotos cargadas (cumple el mínimo de 3).`
              : `Has cargado ${photoCount} foto(s). Te faltan ${3 - photoCount} para el mínimo recomendado.`}
          </span>
        </div>
        <span className="text-[11px] font-mono font-semibold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
          Máx. 12 MB · Formato WebP/JPG/PNG
        </span>
      </div>

      {/* Zona de Subida y URL */}
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 hover:bg-slate-100/70 transition-all text-center space-y-4">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-600">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-900 hover:text-emerald-700 cursor-pointer underline">
              <span>Haz clic aquí para seleccionar imágenes desde tu equipo</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Arrastra o selecciona varias fotos a la vez. Se optimizan automáticamente.
            </p>
          </div>
        </div>

        {/* Carga por URL directa */}
        <div className="pt-2 border-t border-slate-200/80 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="O pega una URL directa de imagen (https://...)"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
              className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {availableColors.length > 0 && (
              <select
                value={selectedColorForPhoto}
                onChange={(e) => setSelectedColorForPhoto(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none"
              >
                <option value="">Color General</option>
                {availableColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={handleAddUrl}
              className="h-9 px-3.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold cursor-pointer"
            >
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Grilla de Fotos Cargadas con Controles */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Fotos del Producto ({photos.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">
              La foto marcada con ⭐ será la portada principal.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((img, idx) => (
              <div
                key={idx}
                className={`relative group bg-white rounded-xl border p-2 flex flex-col space-y-2 transition-all shadow-xs ${
                  img.isPrimary ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200"
                }`}
              >
                {/* Portada Badge */}
                {img.isPrimary && (
                  <div className="absolute top-3 left-3 z-10 bg-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-white" />
                    <span>Portada</span>
                  </div>
                )}

                {/* Color Badge si tiene asignado */}
                {img.color && (
                  <div className="absolute bottom-12 left-3 z-10 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                    {img.color}
                  </div>
                )}

                {/* Imagen */}
                <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center border border-slate-100">
                  <img src={img.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-contain" />
                </div>

                {/* Controles de Foto */}
                <div className="flex items-center justify-between pt-1 text-slate-600">
                  {/* Reordenar */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "up")}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Mover antes"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === photos.length - 1}
                      onClick={() => handleMove(idx, "down")}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Mover después"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Acciones principales */}
                  <div className="flex items-center gap-1">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
                        title="Marcar como foto principal"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
