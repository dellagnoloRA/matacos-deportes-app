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
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Type,
  ArrowLeft,
  ArrowRight,
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
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [editingBanner, setEditingBanner] = useState<SerializedBanner | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<SerializedBanner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

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
    setModalStep(1);
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
    setModalStep(1);
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
      showToast(
        "success",
        editingBanner
          ? "¡Banner modificado exitosamente!"
          : "¡Banner creado y publicado en la tienda online!"
      );
      setIsModalOpen(false);
      resetForm();
      loadBanners();
    } else {
      showToast("error", res.error || "No se pudo guardar el banner.");
    }
  };

  const handleToggleActive = async (banner: SerializedBanner) => {
    const res = await updateBanner(banner.id, { active: !banner.active });
    if (res.success) {
      showToast("info", banner.active ? "Banner pausado." : "Banner activado en la tienda online.");
      loadBanners();
    } else {
      showToast("error", res.error || "No se pudo actualizar el estado del banner");
    }
  };

  const handleDeleteClick = (banner: SerializedBanner) => {
    setBannerToDelete(banner);
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    setDeleting(true);
    try {
      const res = await deleteBanner(bannerToDelete.id);
      if (res.success) {
        showToast("success", `El banner "${bannerToDelete.title}" fue eliminado correctamente.`);
        setBannerToDelete(null);
        loadBanners();
      } else {
        showToast("error", res.error || "No se pudo eliminar el banner");
      }
    } catch {
      showToast("error", "Error inesperado al intentar eliminar el banner");
    } finally {
      setDeleting(false);
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
        <div className="mx-4 lg:mx-8 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 cursor-pointer">
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
                      onClick={() => handleDeleteClick(banner)}
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
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingBanner ? "Modificar Banner Promocional" : "Crear Nuevo Banner Promocional"}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {editingBanner
                    ? "Actualizá los textos, archivo multimedia o enlace del banner existente"
                    : "Configurá y publicá un nuevo banner destacado en la portada de la tienda"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-2 rounded-xl text-base transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* Barra de Pasos / Secciones Guiadas */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  modalStep === 1
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200/90 ring-2 ring-emerald-500/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    modalStep === 1
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  1
                </div>
                <span className="hidden sm:inline">1. Título y Frase</span>
                <span className="sm:hidden">Textos</span>
              </button>

              <div className="w-6 h-px bg-slate-200 hidden sm:block" />

              <button
                type="button"
                onClick={() => {
                  if (!title.trim()) {
                    setErrorMessage("Por favor completá el título en la Sección 1.");
                    return;
                  }
                  setErrorMessage(null);
                  setModalStep(2);
                }}
                className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  modalStep === 2
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200/90 ring-2 ring-emerald-500/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    modalStep === 2
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  2
                </div>
                <span className="hidden sm:inline">2. Archivos e Imágenes</span>
                <span className="sm:hidden">Multimedia</span>
              </button>

              <div className="w-6 h-px bg-slate-200 hidden sm:block" />

              <button
                type="button"
                onClick={() => {
                  if (!title.trim()) {
                    setErrorMessage("Por favor completá el título en la Sección 1.");
                    setModalStep(1);
                    return;
                  }
                  if (!imageUrl) {
                    setErrorMessage("Por favor subí o seleccioná el archivo multimedia en la Sección 2.");
                    setModalStep(2);
                    return;
                  }
                  setErrorMessage(null);
                  setModalStep(3);
                }}
                className={`flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  modalStep === 3
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200/90 ring-2 ring-emerald-500/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    modalStep === 3
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  3
                </div>
                <span className="hidden sm:inline">3. Redirección y Fechas</span>
                <span className="sm:hidden">Destino</span>
              </button>
            </div>

            {/* Aviso de Error */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-sm font-semibold shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-500 hover:text-rose-800 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-7 space-y-6 overflow-y-auto flex-1">
              {/* ========================================================= */}
              {/* SECCIÓN 1: TÍTULO + SUBTÍTULO / FRASE                      */}
              {/* ========================================================= */}
              {modalStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="border-b border-slate-100 pb-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <Type className="w-4 h-4" /> Sección 1 de 3
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Textos y Campaña Promocional
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Definí el título principal de impacto y la frase secundaria que acompañarán este banner.
                    </p>
                  </div>

                  {/* Título */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 block">
                        Título de la Campaña / Promoción <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-slate-400 font-mono">
                        {title.length}/60 caracteres
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Temporada Natación 2026"
                      maxLength={60}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:border-[#00D615] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Subtítulo */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 block">
                        Subtítulo o Frase Destacada <span className="text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      <span className="text-xs text-slate-400 font-mono">
                        {subtitle.length}/100 caracteres
                      </span>
                    </div>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ej: Hasta 6 cuotas sin interés y 15% OFF abonando por transferencia"
                      maxLength={100}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:border-[#00D615] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Checkbox Activo */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <label className="flex items-center gap-3 text-sm font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                        className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span>Mostrar activamente en el carrusel de la portada web</span>
                    </label>
                    <p className="text-xs text-slate-500 mt-1 pl-8">
                      Si está desmarcado, el banner se guardará en borrador sin mostrarse al público en la tienda.
                    </p>
                  </div>

                  {/* Vista Previa de Textos */}
                  {title.trim() && (
                    <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl space-y-1.5 border border-emerald-900/60 shadow-inner">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#00D615]">
                        Previsualización de Textos
                      </span>
                      <h4 className="text-base sm:text-lg font-black italic uppercase tracking-tight text-white drop-shadow-xs">
                        {title}
                      </h4>
                      {subtitle && (
                        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Botones de Paso 1 */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!title.trim()) {
                          setErrorMessage("Por favor ingresá el título del banner para continuar.");
                          return;
                        }
                        setErrorMessage(null);
                        setModalStep(2);
                      }}
                      className="px-6 py-3 rounded-xl text-sm font-bold bg-[#00D615] hover:bg-[#00b812] active:scale-95 text-slate-950 cursor-pointer shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Siguiente: Archivos e Imágenes</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* SECCIÓN 2: ARCHIVOS DE IMÁGENES / VIDEOS                   */}
              {/* ========================================================= */}
              {modalStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="border-b border-slate-100 pb-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> Sección 2 de 3
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Archivos Multimedia e Imágenes
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Cargá el contenido visual para computadoras y celulares según las resoluciones recomendadas.
                    </p>
                  </div>

                  {/* Tarjeta de Guía de Resoluciones y Formatos */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Resoluciones Recomendadas para una Visualización Óptima</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div className="bg-white/95 p-3.5 rounded-xl border border-emerald-200/80 space-y-1">
                        <p className="font-bold text-slate-900">🖥️ Desktop (Computadora):</p>
                        <p className="text-emerald-900 font-bold text-sm sm:text-base">1920 × 800 px <span className="font-normal text-xs text-slate-500">(o 1920 × 1080 px)</span></p>
                        <p className="text-slate-500 text-xs">Imágenes WebP, PNG, JPG (hasta 5MB) o Videos MP4 (hasta 30MB).</p>
                      </div>
                      <div className="bg-white/95 p-3.5 rounded-xl border border-emerald-200/80 space-y-1">
                        <p className="font-bold text-slate-900">📱 Mobile (Celular - Opcional):</p>
                        <p className="text-emerald-900 font-bold text-sm sm:text-base">1080 × 1350 px <span className="font-normal text-xs text-slate-500">(4:5) o 1080 × 1920 px</span></p>
                        <p className="text-slate-500 text-xs">Si no se sube versión móvil, el sistema adapta automáticamente la de computadora.</p>
                      </div>
                    </div>
                  </div>

                  {/* Media Principal Desktop (Imagen o Video) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 block">
                        Archivo Desktop Principal (Imagen o Video) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Requerido
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#00D615] rounded-xl p-3.5 flex items-center justify-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-all text-sm font-semibold text-slate-700">
                        <Upload className="w-5 h-5 text-emerald-600" />
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
                        className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-white font-medium focus:outline-none focus:border-[#00D615]"
                      >
                        <option value="">🎬 Elegir video institucional de stock...</option>
                        {STOCK_VIDEOS.map((v) => (
                          <option key={v.id} value={v.url}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vista Previa Multimedia */}
                    {imageUrl && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-medium">
                          <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                            {isVideoMedia(imageUrl) ? (
                              <>
                                <Video className="w-4 h-4 text-emerald-600" /> Video seleccionado
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-4 h-4 text-emerald-600" /> Imagen seleccionada
                              </>
                            )}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="truncate max-w-[240px] text-slate-500 font-mono text-xs">
                              {imageUrl}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setImageUrl("");
                                showToast("info", "Archivo multimedia principal removido.");
                              }}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                              title="Quitar archivo seleccionado"
                            >
                              <X className="w-4 h-4" /> Quitar
                            </button>
                          </div>
                        </div>

                        <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner">
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
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-800 block">
                        Versión Adaptada para Celular <span className="text-slate-400 font-normal">(Opcional)</span>
                      </label>
                      {mobileUrl && (
                        <button
                          type="button"
                          onClick={() => setMobileUrl("")}
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                        >
                          Quitar versión móvil
                        </button>
                      )}
                    </div>

                    <label className="border-2 border-dashed border-slate-300 hover:border-[#00D615] rounded-xl p-3 flex items-center justify-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-emerald-50/40 transition-all text-sm font-semibold text-slate-600">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Subir archivo vertical para celular (4:5 o 9:16)</span>
                      <input
                        type="file"
                        accept="image/webp,image/png,image/jpeg,image/jpg,video/mp4,video/webm"
                        onChange={(e) => handleFileUpload(e, "mobile")}
                        className="hidden"
                      />
                    </label>

                    {mobileUrl && (
                      <p className="text-xs text-emerald-800 font-mono truncate bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        ✓ {mobileUrl}
                      </p>
                    )}
                  </div>

                  {/* Botones de Paso 2 */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver a Textos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!imageUrl) {
                          setErrorMessage("Por favor subí o seleccioná el archivo multimedia principal para continuar.");
                          return;
                        }
                        setErrorMessage(null);
                        setModalStep(3);
                      }}
                      className="px-6 py-3 rounded-xl text-sm font-bold bg-[#00D615] hover:bg-[#00b812] active:scale-95 text-slate-950 cursor-pointer shadow-md transition-all flex items-center gap-2"
                    >
                      <span>Siguiente: Redirección y Fechas</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* SECCIÓN 3: REDIRECCIÓN + FECHAS DE VIGENCIA                */}
              {/* ========================================================= */}
              {modalStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="border-b border-slate-100 pb-3.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4" /> Sección 3 de 3
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Destino de Redirección y Fechas de Vigencia
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Configurá a qué página dirigirá el clic del cliente y las fechas de vigencia de la campaña.
                    </p>
                  </div>

                  {/* Enlace al hacer clic con selector intuitivo */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800 block">
                      ¿A dónde debe ir el cliente al hacer clic en el banner? <span className="text-rose-500">*</span>
                    </label>

                    <select
                      value={selectedLinkPreset}
                      onChange={(e) => setSelectedLinkPreset(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-semibold bg-white focus:outline-none focus:border-[#00D615] focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {LINK_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>

                    {/* Explicación amigable del destino seleccionado */}
                    {currentPresetInfo && selectedLinkPreset !== "custom" && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        ℹ️ {currentPresetInfo.description} (Ruta interna: <code className="font-mono text-emerald-700 font-bold">{currentPresetInfo.url}</code>)
                      </p>
                    )}

                    {/* Campo libre si eligió "Personalizado" */}
                    {selectedLinkPreset === "custom" && (
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        <input
                          type="text"
                          required
                          value={customLinkUrl}
                          onChange={(e) => setCustomLinkUrl(e.target.value)}
                          placeholder="Ej: /catalogo?marca=nike o https://instagram.com/matacosdeportes"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 font-medium focus:outline-none focus:border-[#00D615]"
                        />
                        <p className="text-xs text-slate-400">
                          Podés colocar una ruta interna (ej. /catalogo) o una URL web externa completa.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fechas de Vigencia */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Programación de Vigencia (Opcional)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Desde (Fecha de Inicio)
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#00D615]"
                        />
                        <p className="text-xs text-slate-400">Vacío = inicio inmediato.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Hasta (Fecha de Fin)
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#00D615]"
                        />
                        <p className="text-xs text-slate-400">Vacío = vigencia indefinida.</p>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Final de Configuración */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm space-y-1.5 text-slate-600">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Campaña:</span>
                      <span className="truncate max-w-[280px] text-emerald-700 font-bold">{title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Destino:</span>
                      <span className="font-mono text-slate-700">
                        {selectedLinkPreset === "custom" ? customLinkUrl || "(sin definir)" : currentPresetInfo?.url}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estado:</span>
                      <span className={active ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                        {active ? "Activo en tienda" : "Guardado en borrador"}
                      </span>
                    </div>
                  </div>

                  {/* Botones de Paso 3 (Submit Final) */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalStep(2)}
                      className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer flex items-center gap-2 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver a Imágenes</span>
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || uploadingImage}
                      className="px-7 py-3 rounded-xl text-sm font-bold bg-[#00D615] hover:bg-[#00b812] active:scale-95 text-slate-950 disabled:opacity-50 cursor-pointer shadow-md transition-all flex items-center gap-2.5"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Guardando banner...</span>
                        </>
                      ) : editingBanner ? (
                        <span>Guardar Cambios</span>
                      ) : (
                        <span>Guardar y Publicar Banner</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">¿Eliminar este banner?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Se quitará definitivamente del carrusel principal de la tienda online. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {/* Mini ficha previa del banner */}
            <div className="my-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3.5">
              <div className="w-16 h-12 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-slate-200">
                {bannerToDelete.imageUrl && (
                  isVideoMedia(bannerToDelete.imageUrl) ? (
                    <video src={bannerToDelete.imageUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={bannerToDelete.imageUrl} alt="" className="w-full h-full object-cover" />
                  )
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{bannerToDelete.title}</p>
                {bannerToDelete.subtitle && (
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{bannerToDelete.subtitle}</p>
                )}
                <span
                  className={`inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${
                    bannerToDelete.active
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {bannerToDelete.active ? "Actualmente Activo" : "Pausado"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setBannerToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-sm shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Banner</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación Flotante Elegante (Toast) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-auto">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === "success"
                ? "bg-slate-900/95 text-white border-emerald-500/40 shadow-emerald-950/20"
                : toast.type === "error"
                ? "bg-slate-900/95 text-white border-rose-500/40 shadow-rose-950/20"
                : "bg-slate-900/95 text-white border-slate-700 shadow-slate-950/20"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span className="text-xs font-semibold">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2 cursor-pointer"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
