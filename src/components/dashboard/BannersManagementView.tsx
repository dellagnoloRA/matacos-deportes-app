"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Upload,
  Calendar,
  Sparkles,
  Video,
  Film,
  Info,
  Link2,
} from "lucide-react";
import {
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "@/server/actions/bannerActions";
import type { SerializedBanner } from "@/server/services/bannerService";

interface LinkPreset {
  id: string;
  label: string;
  url: string;
  description: string;
}

const LINK_PRESETS: LinkPreset[] = [
  {
    id: "catalogo",
    label: "🏷️ Todo el Catálogo de Productos",
    url: "/catalogo",
    description: "Lleva al cliente al catálogo general con todos los productos disponibles.",
  },
  {
    id: "ofertas",
    label: "🔥 Ofertas y Descuentos Especiales",
    url: "/catalogo?soloOfertas=true",
    description: "Filtra automáticamente solo los artículos con promociones y rebajas activas.",
  },
  {
    id: "novedades",
    label: "✨ Novedades / Nuevos Ingresos",
    url: "/catalogo?sort=newest",
    description: "Muestra primero los últimos productos y colecciones ingresados al sistema.",
  },
  {
    id: "natacion",
    label: "🏊 Disciplina: Natación",
    url: "/catalogo?disciplineSlug=natacion",
    description: "Lleva directamente a la vitrina de antiparras, mallas, gorras y accesorios.",
  },
  {
    id: "voley",
    label: "🏐 Disciplina: Vóley",
    url: "/catalogo?disciplineSlug=voley",
    description: "Lleva a rodilleras, pelotas, redes, calzado e indumentaria de vóley.",
  },
  {
    id: "calzado",
    label: "👟 Disciplina: Calzado Deportivo",
    url: "/catalogo?disciplineSlug=calzado",
    description: "Vitrina de zapatillas de running, entrenamiento, trekking y deportes.",
  },
  {
    id: "crocs",
    label: "🐊 Disciplina: Crocs & Urbano",
    url: "/catalogo?disciplineSlug=crocs-urbano",
    description: "Catálogo exclusivo de sandalias y clogs Crocs originales y línea urbana.",
  },
  {
    id: "fitness",
    label: "🏋️ Disciplina: Fitness & Gimnasio",
    url: "/catalogo?disciplineSlug=fitness-gimnasio",
    description: "Accesorios para entrenamiento, pesas, bandas elásticas y ropa deportiva.",
  },
  {
    id: "whatsapp",
    label: "💬 WhatsApp Oficial de Atención",
    url: "https://wa.me/5493704000000?text=Hola%20Matacos%20Deportes!%20Quiero%20consultar%20por%20una%20promoci%C3%B3n",
    description: "Abre una conversación directa por WhatsApp con el equipo de Saavedra 241.",
  },
  {
    id: "custom",
    label: "⚙️ Enlace Personalizado / Ruta Libre...",
    url: "",
    description: "Permite escribir o pegar manualmente cualquier dirección o URL externa.",
  },
];

const STOCK_VIDEOS = [
  {
    id: "hero1",
    label: "🎬 Video 1: Equipate para salir (Outdoor / Aventura)",
    url: "/videos/hero1.mp4",
  },
  {
    id: "hero2",
    label: "🎬 Video 2: Alto rendimiento (Entrenamiento / Running)",
    url: "/videos/hero2.mp4",
  },
  {
    id: "hero3",
    label: "🎬 Video 3: Espíritu outdoor (Trekking / Travesías)",
    url: "/videos/hero3.mp4",
  },
];

function isVideoMedia(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".ogg") ||
    clean.includes("/videos/")
  );
}

export function BannersManagementView() {
  const [banners, setBanners] = useState<SerializedBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<SerializedBanner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Formulario
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileUrl, setMobileUrl] = useState("");
  const [selectedLinkPreset, setSelectedLinkPreset] = useState("catalogo");
  const [customLinkUrl, setCustomLinkUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getAllBannersAdmin();
      if (res.success && res.data) {
        setBanners(res.data);
      } else {
        setErrorMessage(res.error || "No se pudieron cargar los banners");
      }
    } catch {
      setErrorMessage("Error de conexión al obtener los banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  const resetForm = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setMobileUrl("");
    setSelectedLinkPreset("catalogo");
    setCustomLinkUrl("");
    setStartDate("");
    setEndDate("");
    setActive(true);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: SerializedBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || "");
    setImageUrl(banner.imageUrl);
    setMobileUrl(banner.mobileUrl || "");

    const matchingPreset = LINK_PRESETS.find(
      (p) => p.id !== "custom" && p.url === banner.linkUrl
    );

    if (matchingPreset) {
      setSelectedLinkPreset(matchingPreset.id);
      setCustomLinkUrl("");
    } else {
      setSelectedLinkPreset("custom");
      setCustomLinkUrl(banner.linkUrl || "");
    }

    setStartDate(banner.startDate ? banner.startDate.slice(0, 10) : "");
    setEndDate(banner.endDate ? banner.endDate.slice(0, 10) : "");
    setActive(banner.active);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    variant: "desktop" | "mobile"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.toLowerCase().startsWith("video/");
    const maxSizeBytes = isVideo ? 30 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setErrorMessage(
        isVideo
          ? "El video supera el límite de 30 MB permitido."
          : "La imagen supera el límite de 5 MB permitido."
      );
      return;
    }

    setUploadingImage(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "banner");
      formData.append("title", title || "banner");
      formData.append("variant", variant);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Error al subir archivo");
      }

      if (variant === "desktop") {
        setImageUrl(json.url);
      } else {
        setMobileUrl(json.url);
      }
      setSuccessMessage(
        isVideo
          ? `Video ${variant} subido correctamente.`
          : `Imagen ${variant} optimizada y cargada.`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al procesar archivo";
      setErrorMessage(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setErrorMessage("Debés subir o seleccionar el archivo principal del banner.");
      return;
    }

    const effectiveLinkUrl =
      selectedLinkPreset === "custom"
        ? customLinkUrl.trim() || null
        : LINK_PRESETS.find((p) => p.id === selectedLinkPreset)?.url || "/catalogo";

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      imageUrl,
      mobileUrl: mobileUrl || null,
      linkUrl: effectiveLinkUrl,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      active,
    };

    let res;
    if (editingBanner) {
      res = await updateBanner(editingBanner.id, payload);
    } else {
      res = await createBanner(payload);
    }

    setSubmitting(false);

    if (res.success) {
      setSuccessMessage(
        editingBanner
          ? "¡Banner modificado exitosamente!"
          : "¡Banner creado y publicado en la Landing!"
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      setIsModalOpen(false);
      resetForm();
      loadBanners();
    } else {
      setErrorMessage(res.error || "No se pudo guardar el banner.");
    }
  };

  const handleToggleActive = async (banner: SerializedBanner) => {
    const res = await updateBanner(banner.id, { active: !banner.active });
    if (res.success) {
      loadBanners();
    } else {
      setErrorMessage(res.error || "No se pudo actualizar el estado del banner");
    }
  };

  const handleDelete = async (id: string, bannerTitle: string) => {
    if (!confirm(`¿Eliminar el banner "${bannerTitle}" definitivamente?`)) {
      return;
    }

    const res = await deleteBanner(id);
    if (res.success) {
      setSuccessMessage("Banner eliminado.");
      setTimeout(() => setSuccessMessage(null), 3000);
      loadBanners();
    } else {
      setErrorMessage(res.error || "No se pudo eliminar el banner");
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];
    if (!currentBanner || !targetBanner) return;

    const newItems = banners.map((b, i) => {
      if (i === index) return { id: b.id, order: targetBanner.order };
      if (i === targetIndex) return { id: b.id, order: currentBanner.order };
      return { id: b.id, order: b.order };
    });

    const res = await reorderBanners(newItems);
    if (res.success) {
      loadBanners();
    } else {
      setErrorMessage(res.error || "Error al reordenar banners");
    }
  };

  const currentPresetInfo = LINK_PRESETS.find((p) => p.id === selectedLinkPreset);

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>Gestión de Banners y Carrusel de Landing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrá imágenes y videos promocionales, enlaces de destino y vigencia del carrusel principal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBanners}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <span>Ver Tienda</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D615] hover:bg-[#00b812] active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Banner</span>
          </button>
        </div>
      </div>

      {/* Alertas */}
      {errorMessage && (
        <div className="mx-4 lg:mx-8 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mx-4 lg:mx-8 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800">
            ✕
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {loading && banners.length === 0 ? (
          <div className="py-20 text-center text-sm font-semibold text-slate-400">
            Cargando banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ImageIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No hay banners cargados</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Actualmente la Landing muestra el video por defecto. Creá un banner con imagen o video para destacar campañas, colecciones o liquidaciones.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white hover:bg-slate-800 font-bold text-xs rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear el primer banner</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {banners.map((banner, index) => {
              const statusColor =
                banner.validityStatus === "VIGENTE"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : banner.validityStatus === "PROGRAMADO"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : banner.validityStatus === "EXPIRADO"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200";

              const isVideo = isVideoMedia(banner.imageUrl);

              return (
                <div
                  key={banner.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Imagen/Video y Datos Principales */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200 relative">
                      {isVideo ? (
                        <video
                          src={banner.imageUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {isVideo && (
                        <span className="absolute top-1 left-1 bg-black/75 text-emerald-400 font-black text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Film className="w-2.5 h-2.5" /> Video
                        </span>
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white font-black text-[9px] px-1.5 py-0.5 rounded">
                        #{banner.order}
                      </span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}
                        >
                          {banner.validityStatus}
                        </span>
                        {banner.linkUrl && (
                          <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs flex items-center gap-1">
                            <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
                            {banner.linkUrl}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                        {banner.title}
                      </h3>

                      {banner.subtitle && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {banner.subtitle}
                        </p>
                      )}

                      {(banner.startDate || banner.endDate) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {banner.startDate ? new Date(banner.startDate).toLocaleDateString("es-AR") : "Siempre"}
                            {" → "}
                            {banner.endDate ? new Date(banner.endDate).toLocaleDateString("es-AR") : "Sin límite"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones de Orden, Modificar, Activación y Borrado */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(index, "up")}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                        title="Subir prioridad"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === banners.length - 1}
                        onClick={() => handleMoveOrder(index, "down")}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                        title="Bajar prioridad"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(banner)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                      title="Editar contenido del banner"
                    >
                      <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Modificar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(banner)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        banner.active
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                      title={banner.active ? "Desactivar" : "Activar"}
                    >
                      {banner.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{banner.active ? "Activo" : "Pausado"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(banner.id, banner.title)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                      title="Eliminar banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Crear / Modificar Banner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingBanner ? "Modificar Banner Promocional" : "Crear Nuevo Banner"}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingBanner
                    ? "Actualizá la imagen, video o enlace del banner existente"
                    : "Publicá una imagen o video promocional en la portada web"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Tarjeta de Guía de Resoluciones y Formatos */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Resoluciones Recomendadas para una Visualización Óptima</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/60 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🖥️ Para Computadora (Desktop):</span>
                    </p>
                    <p className="text-emerald-900 font-semibold">
                      1920 × 800 px <span className="font-normal text-slate-500">(o 1920 × 1080 px)</span>
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      Imágenes (WebP, PNG, JPG hasta 5MB) o Videos (MP4, WebM hasta 30MB).
                    </p>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/60 space-y-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>📱 Para Celular (Mobile - Opcional):</span>
                    </p>
                    <p className="text-emerald-900 font-semibold">
                      1080 × 1350 px <span className="font-normal text-slate-500">(4:5) o 1080 × 1920 px</span>
                    </p>
                    <p className="text-slate-500 text-[10px]">
                      Si no se sube versión móvil, se adapta automáticamente la de computadora.
                    </p>
                  </div>
                </div>
              </div>

              {/* Título */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Título de la Campaña / Promoción *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Temporada Natación 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#00D615]"
                />
              </div>

              {/* Subtítulo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Subtítulo o Frase Destacada (Opcional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Hasta 6 cuotas sin interés y 15% OFF abonando por transferencia"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#00D615]"
                />
              </div>

              {/* Media Principal Desktop (Imagen o Video) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    Archivo Multimedia Desktop (Imagen o Video) *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    MP4 / WebM (máx 30MB) • WebP / PNG / JPG (máx 5MB)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="border border-dashed border-slate-300 hover:border-[#00D615] rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all text-xs font-semibold text-slate-700">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>{uploadingImage ? "Subiendo archivo..." : "Subir archivo desde PC"}</span>
                    <input
                      type="file"
                      accept="image/webp,image/png,image/jpeg,image/jpg,video/mp4,video/webm,video/quicktime"
                      onChange={(e) => handleFileUpload(e, "desktop")}
                      className="hidden"
                    />
                  </label>

                  {/* Selector rápido de videos de stock preexistentes */}
                  <select
                    value={STOCK_VIDEOS.some((v) => v.url === imageUrl) ? imageUrl : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setImageUrl(e.target.value);
                      }
                    }}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-white font-medium focus:outline-none focus:border-[#00D615]"
                  >
                    <option value="">🎬 Elegir video institucional...</option>
                    {STOCK_VIDEOS.map((v) => (
                      <option key={v.id} value={v.url}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vista Previa Multimedia */}
                {imageUrl && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono truncate">
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        {isVideoMedia(imageUrl) ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-emerald-600" /> Video seleccionado
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Imagen seleccionada
                          </>
                        )}
                      </span>
                      <span className="truncate max-w-[200px] text-slate-400">{imageUrl}</span>
                    </div>

                    <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-950 border border-slate-200">
                      {isVideoMedia(imageUrl) ? (
                        <video
                          src={imageUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={imageUrl}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Media Mobile Opcional */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Archivo Adaptado para Celular (Opcional - Proporción 4:5 o 9:16)
                  </label>
                  {mobileUrl && (
                    <button
                      type="button"
                      onClick={() => setMobileUrl("")}
                      className="text-[10px] text-rose-500 hover:underline"
                    >
                      Quitar móvil
                    </button>
                  )}
                </div>

                <label className="border border-dashed border-slate-300 hover:border-[#00D615] rounded-xl p-2.5 flex items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all text-xs font-semibold text-slate-600">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Subir versión vertical para celular</span>
                  <input
                    type="file"
                    accept="image/webp,image/png,image/jpeg,image/jpg,video/mp4,video/webm"
                    onChange={(e) => handleFileUpload(e, "mobile")}
                    className="hidden"
                  />
                </label>

                {mobileUrl && (
                  <p className="text-[11px] text-emerald-700 font-mono truncate bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    ✓ {mobileUrl}
                  </p>
                )}
              </div>

              {/* Enlace al hacer clic con selector intuitivo */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 block">
                  ¿A dónde debe ir el cliente al hacer clic en el banner? *
                </label>

                <select
                  value={selectedLinkPreset}
                  onChange={(e) => setSelectedLinkPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-semibold bg-white focus:outline-none focus:border-[#00D615]"
                >
                  {LINK_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>

                {/* Explicación amigable del destino seleccionado */}
                {currentPresetInfo && selectedLinkPreset !== "custom" && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    ℹ️ {currentPresetInfo.description} (Ruta: <code className="font-mono text-emerald-700">{currentPresetInfo.url}</code>)
                  </p>
                )}

                {/* Campo libre si eligió "Personalizado" */}
                {selectedLinkPreset === "custom" && (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <input
                      type="text"
                      required
                      value={customLinkUrl}
                      onChange={(e) => setCustomLinkUrl(e.target.value)}
                      placeholder="Ej: /catalogo?marca=nike o https://instagram.com/matacosdeportes"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#00D615]"
                    />
                    <p className="text-[10px] text-slate-400">
                      Podés colocar una ruta interna (ej. /catalogo) o una URL web completa (ej. https://...).
                    </p>
                  </div>
                )}
              </div>

              {/* Fechas de Vigencia */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Desde (Fecha de Inicio)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Dejar vacío para iniciar ya.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Hasta (Fecha de Fin)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">Dejar vacío para vigencia indefinida.</p>
                </div>
              </div>

              {/* Checkbox Activo */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Mostrar activamente en el carrusel de la tienda</span>
                </label>
              </div>

              {/* Botones de Acción */}
              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00D615] hover:bg-[#00b812] active:scale-95 text-slate-950 disabled:opacity-50 cursor-pointer shadow-sm transition-all"
                >
                  {submitting
                    ? "Guardando..."
                    : editingBanner
                    ? "Guardar Cambios"
                    : "Guardar y Publicar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
