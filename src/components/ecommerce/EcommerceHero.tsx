"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface EcommerceHeroProps {
  onExploreClick?: () => void;
}

const HERO_SLIDES = [
  {
    id: 1,
    video: "/videos/hero1.mp4",
    tag: "EQUIPATE PARA SALIR",
    title: "Viví el deporte. Viví el aire libre.",
    desc: "Encontrá lo que necesitás para moverte, entrenar y llegar más lejos. Tu próxima aventura empieza acá.",
    ctaText: "EXPLORAR PRODUCTOS",
  },
  {
    id: 2,
    video: "/videos/hero2.mp4",
    tag: "ALTO RENDIMIENTO",
    title: "Superá tus propios límites.",
    desc: "Calzado técnico, indumentaria transpirable y accesorios diseñados para potenciar cada uno de tus entrenamientos.",
    ctaText: "VER NOVEDADES",
  },
  {
    id: 3,
    video: "/videos/hero3.mp4",
    tag: "ESPÍRITU OUTDOOR",
    title: "La aventura te está esperando.",
    desc: "Equipamiento técnico para trekking, camping y travesías en Formosa y todo el país.",
    ctaText: "EQUIPATE AHORA",
  },
];

export function EcommerceHero({ onExploreClick }: EcommerceHeroProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [failedVideos, setFailedVideos] = useState<Record<number, boolean>>({});

  const totalSlides = HERO_SLIDES.length;

  const handleNext = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Rotación automática cada 7 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 7000);

    return () => clearInterval(timer);
  }, [handleNext, currentIdx]);

  const currentSlide = HERO_SLIDES[currentIdx];
  const isCurrentVideoFailed = failedVideos[currentIdx];

  return (
    <section className="relative w-full h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-slate-950 select-none">
      {/* 1. Background Video / Media Container */}
      <div className="absolute inset-0 overflow-hidden bg-slate-950">
        {!isCurrentVideoFailed && (
          <video
            key={currentSlide.video}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => {
              setFailedVideos((prev) => ({ ...prev, [currentIdx]: true }));
            }}
            className="absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-700"
          >
            <source src={currentSlide.video} type="video/mp4" />
          </video>
        )}

        {/* Fallback Poster Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center -z-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1920&q=80')`,
          }}
        />

        {/* Dark Contrast Overlays: Opacidad y gradiente para contraste perfecto del texto */}
        <div className="absolute inset-0 bg-black/45 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div
          key={currentSlide.id}
          className="max-w-2xl space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2">
            <span className="text-[#00D615] font-black tracking-[0.25em] text-xs sm:text-sm uppercase drop-shadow-xs">
              {currentSlide.tag}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
            {currentSlide.title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-200 font-medium leading-relaxed max-w-xl">
            {currentSlide.desc}
          </p>

          {/* CTA Button */}
          <div className="pt-2 sm:pt-4 flex items-center gap-4">
            <a
              href="#productos"
              onClick={onExploreClick}
              className="inline-flex items-center gap-3 bg-[#00D615] hover:bg-[#00b812] active:scale-95 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl shadow-lg shadow-[#00D615]/20 hover:shadow-[#00D615]/40 transition-all duration-200"
            >
              <span>{currentSlide.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. Navigation Arrows at both ends */}
      <button
        onClick={handlePrev}
        className="group absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md shadow-2xl hover:scale-110 active:scale-90 transition-all duration-200"
        title="Video anterior"
        aria-label="Video anterior"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={handleNext}
        className="group absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/75 border border-white/20 text-white backdrop-blur-md shadow-2xl hover:scale-110 active:scale-90 transition-all duration-200"
        title="Siguiente video"
        aria-label="Siguiente video"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 4. Bottom Switcher Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-8 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={`transition-all rounded-full ${
              currentIdx === idx
                ? "w-7 h-2 bg-[#00D615] shadow-xs"
                : "w-2 h-2 bg-white/40 hover:bg-white/80"
            }`}
            title={`Slide ${idx + 1}`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
