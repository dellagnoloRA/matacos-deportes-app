"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { SerializedBanner } from "@/server/services/bannerService";

export interface HeroCarouselProps {
  banners?: SerializedBanner[];
  onExploreClick?: () => void;
  autoplayIntervalMs?: number;
  className?: string;
}

interface SlideItem {
  id: string;
  title: string;
  description: string | null;
  ctaText: string;
  ctaHref: string;
  imageUrl: string;
  mobileUrl?: string | null;
  isVideo: boolean;
}

const FALLBACK_SLIDES: SlideItem[] = [
  {
    id: "fallback-1",
    title: "EQUIPAMIENTO DEPORTIVO DE MÁXIMO RENDIMIENTO",
    description:
      "Más de 25 años acercando indumentaria, accesorios técnicos y las mejores marcas oficiales a Formosa y todo el país.",
    ctaText: "EXPLORAR CATÁLOGO",
    ctaHref: "/catalogo",
    imageUrl:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1920&q=80",
    isVideo: false,
  },
  {
    id: "fallback-2",
    title: "SUPERÁ TUS LÍMITES EN EL AGUA",
    description:
      "Mallas de competición, antiparras profesionales, gorras y accesorios acuáticos 100% originales con garantía.",
    ctaText: "VER LÍNEA NATACIÓN",
    ctaHref: "/catalogo?disciplina=natacion",
    imageUrl:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1920&q=80",
    isVideo: false,
  },
  {
    id: "fallback-3",
    title: "CONFORT Y ESTILO PARA TODO EL DÍA",
    description:
      "Descubrí nuestra colección de calzado urbano y tiempo libre en Saavedra 241. Calce ergonómico, ligereza y durabilidad.",
    ctaText: "VER CALZADO",
    ctaHref: "/catalogo?disciplina=crocs",
    imageUrl:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1920&q=80",
    isVideo: false,
  },
  {
    id: "fallback-4",
    title: "BALONES OFICIALES Y PROTECCIÓN DE IMPACTO",
    description:
      "Pelotas de juego reglamentarias, rodilleras de alto impacto e indumentaria técnica para clubes y atletas.",
    ctaText: "VER LÍNEA VÓLEY",
    ctaHref: "/catalogo?disciplina=voley",
    imageUrl:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1920&q=80",
    isVideo: false,
  },
];

function isVideoUrl(url?: string | null): boolean {
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

export function HeroCarousel({
  banners,
  onExploreClick,
  autoplayIntervalMs = 6500,
  className = "",
}: HeroCarouselProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Mapeo unificado de diapositivas (DB banners o Fallback branded)
  const slides: SlideItem[] = React.useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.subtitle,
        ctaText: b.linkUrl ? "VER PROMOCIÓN" : "EXPLORAR TIENDA",
        ctaHref: b.linkUrl || "#productos",
        imageUrl: b.imageUrl,
        mobileUrl: b.mobileUrl,
        isVideo: isVideoUrl(b.imageUrl) || isVideoUrl(b.mobileUrl),
      }));
    }
    return FALLBACK_SLIDES;
  }, [banners]);

  const totalSlides = slides.length;
  const safeIdx = totalSlides > 0 ? currentIdx % totalSlides : 0;

  const handleNext = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx: number) => {
    setCurrentIdx(idx);
  };

  // Subtarea 1: Autoplay con pausa al pasar el cursor (hover)
  useEffect(() => {
    if (totalSlides <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoplayIntervalMs);

    return () => clearInterval(timer);
  }, [handleNext, isPaused, autoplayIntervalMs, totalSlides]);

  // Touch Swipe para dispositivos móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 50; // 50px de desplazamiento mínimo

    if (diff > threshold) {
      // Swipe hacia la izquierda -> siguiente
      handleNext();
    } else if (diff < -threshold) {
      // Swipe hacia la derecha -> anterior
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Teclado accesible
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    }
  };

  const activeSlide = slides[safeIdx];
  const isExternalLink =
    activeSlide?.ctaHref.startsWith("http://") ||
    activeSlide?.ctaHref.startsWith("https://");

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Promociones y novedades destacadas de Matacos Deportes"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-[480px] sm:h-[540px] lg:h-[620px] overflow-hidden bg-slate-950 select-none focus-visible:outline-none ${className}`}
    >
      {/* 1. Diapositivas de fondo con next/image optimizado para LCP */}
      <div className="absolute inset-0 overflow-hidden bg-slate-950">
        {slides.map((slide, idx) => {
          const isActive = idx === safeIdx;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              {slide.isVideo ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload={isActive ? "auto" : "none"}
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  {slide.mobileUrl && isVideoUrl(slide.mobileUrl) && (
                    <source src={slide.mobileUrl} media="(max-width: 640px)" />
                  )}
                  <source src={slide.imageUrl} />
                </video>
              ) : (
                <div className="relative w-full h-full">
                  {/* Imagen Móvil opcional (solo si existe y es diferente) */}
                  {slide.mobileUrl && (
                    <div className="block sm:hidden absolute inset-0 w-full h-full">
                      <Image
                        src={slide.mobileUrl}
                        alt={slide.title}
                        fill
                        priority={idx === 0}
                        sizes="100vw"
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Imagen Desktop / General */}
                  <div
                    className={`${
                      slide.mobileUrl ? "hidden sm:block" : "block"
                    } absolute inset-0 w-full h-full`}
                  >
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title}
                      fill
                      priority={idx === 0}
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 2. Capas de gradiente de alto contraste sobre la imagen (z-[15] válido en Tailwind v3) */}
        <div className="absolute inset-0 bg-black/30 z-[15] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/15 z-[15] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 z-[15] pointer-events-none" />
      </div>

      {/* 3. Contenedor de Texto y CTA institucional */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div
          key={activeSlide?.id || safeIdx}
          className="max-w-2xl space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
        >
          {/* Título Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.06] uppercase [text-shadow:0_4px_24px_rgba(0,0,0,0.75),0_2px_6px_rgba(0,0,0,0.65)]">
            {activeSlide?.title}
          </h1>

          {/* Subtítulo / Descripción */}
          {activeSlide?.description && (
            <p className="text-sm sm:text-base lg:text-lg text-white/95 font-medium leading-relaxed max-w-xl [text-shadow:0_2px_14px_rgba(0,0,0,0.85),0_1px_4px_rgba(0,0,0,0.75)]">
              {activeSlide.description}
            </p>
          )}

          {/* Botón de Acción Principal (CTA) */}
          <div className="pt-2 sm:pt-4 flex items-center gap-4">
            {activeSlide?.ctaHref.startsWith("#") || isExternalLink ? (
              <a
                href={activeSlide?.ctaHref}
                onClick={
                  activeSlide?.ctaHref.startsWith("#")
                    ? onExploreClick
                    : undefined
                }
                target={isExternalLink ? "_blank" : undefined}
                rel={isExternalLink ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2.5 bg-[#00D615] hover:bg-[#00ba13] active:scale-95 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl shadow-lg shadow-[#00D615]/25 hover:shadow-[#00D615]/40 transition-all duration-200 cursor-pointer"
              >
                <span>{activeSlide?.ctaText}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </a>
            ) : (
              <Link
                href={activeSlide?.ctaHref || "/catalogo"}
                className="inline-flex items-center gap-2.5 bg-[#00D615] hover:bg-[#00ba13] active:scale-95 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl shadow-lg shadow-[#00D615]/25 hover:shadow-[#00D615]/40 transition-all duration-200 cursor-pointer"
              >
                <span>{activeSlide?.ctaText}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 4. Flechas de Navegación Lateral (Accesibles con Hover) */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="group absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Diapositiva anterior"
            title="Diapositiva anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="group absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Siguiente diapositiva"
            title="Siguiente diapositiva"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* 5. Dots Indicadores con Barra de Progreso */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-8 z-30 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  safeIdx === idx
                    ? "w-8 h-2 bg-[#00D615] shadow-xs"
                    : "w-2 h-2 bg-white/40 hover:bg-white/80"
                }`}
                aria-label={`Ir a la diapositiva ${idx + 1}`}
                aria-current={safeIdx === idx ? "true" : undefined}
                title={`Diapositiva ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
