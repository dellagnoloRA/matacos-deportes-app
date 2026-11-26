"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Building2,
  Activity,
  Award,
  ShoppingBag,
  Users,
  Store,
  ArrowRight,
  ImageIcon,
  ChevronRight,
  Home,
} from "lucide-react";
import { FadeInOnScroll } from "@/components/ui/FadeInOnScroll";

// Componente para visualizar cada fotografía histórica con soporte responsivo y fallback elegante
function StoreHistoricalPhotoCard({
  src,
  alt,
  tag,
  title,
  description,
  address,
  timeframe,
  isCurrent = false,
}: {
  src: string;
  alt: string;
  tag: string;
  title: string;
  description: string;
  address: string;
  timeframe: string;
  isCurrent?: boolean;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group relative rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col h-full ${
        isCurrent
          ? "bg-slate-900 border-[#00D615]/40 shadow-xl shadow-emerald-950/20"
          : "bg-slate-900 border-slate-700/80 shadow-lg"
      }`}
    >
      {/* Marco de Imagen con proporción natural preservada */}
      <div className="relative aspect-4/3 sm:aspect-16/10 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* Ambient glow */}
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isCurrent ? "bg-[#00D615]/25" : "bg-emerald-500/15"
          }`}
        />

        {!imageError ? (
          <>
            {/* Fondo ambiental difuminado para dar coherencia y profundidad estética sin recortar */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-lg opacity-35 scale-110 pointer-events-none"
            />
            {/* Fotografía principal con proporciones originales respetadas y sin recortes */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onError={() => setImageError(true)}
              className="relative z-10 w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-102"
            />
          </>
        ) : (
          // Fallback visual arquitectónico en caso de error
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white relative z-10 space-y-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                isCurrent
                  ? "bg-[#00D615] text-slate-950 shadow-[#00D615]/25"
                  : "bg-slate-800 text-slate-200 border border-slate-700"
              }`}
            >
              <Store className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <span
                className={`text-[11px] font-black uppercase tracking-widest block ${
                  isCurrent ? "text-[#00D615]" : "text-slate-300"
                }`}
              >
                {address}
              </span>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 font-medium">
                {timeframe}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[10px] text-slate-300 font-semibold backdrop-blur-xs">
              <ImageIcon className="w-3 h-3 text-[#00D615]" />
              <span>Fotografía del local ({tag})</span>
            </div>
          </div>
        )}

        {/* Badge temporal flotante sobre la imagen */}
        <div className="absolute top-4 left-4 z-20">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md backdrop-blur-md ${
              isCurrent
                ? "bg-[#00D615] text-slate-950 shadow-[#00D615]/30"
                : "bg-black/75 text-white border border-white/20"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{tag}</span>
          </span>
        </div>

        {/* Indicador de vigencia / período */}
        <div className="absolute bottom-4 right-4 z-20">
          <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[11px] font-bold text-slate-200 border border-white/10">
            {timeframe}
          </span>
        </div>
      </div>

      {/* Contenido descriptivo de la etapa */}
      <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 bg-white border-t border-slate-100 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md ${
                isCurrent
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {isCurrent ? "ETAPA ACTUAL" : "TRAYECTORIA HISTÓRICA"}
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-slate-950">
            {title}
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {description}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Building2 className="w-3.5 h-3.5 text-[#00A811]" />
            <span>{address}</span>
          </span>
          <span>Formosa Capital</span>
        </div>
      </div>
    </div>
  );
}

export function OurHistoryView() {
  return (
    <div className="w-full bg-white">
      {/* Breadcrumbs de navegación */}
      <div className="bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-[#00A811] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Sobre Nosotros</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-16">
        {/* -------------------------------------------------------- */}
        {/* 1. BLOQUE DE INTRODUCCIÓN                                */}
        {/* -------------------------------------------------------- */}
        <FadeInOnScroll direction="up" delayMs={50} className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black tracking-widest uppercase shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#00A811]" />
            <span>1999 – ACTUALIDAD</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black italic tracking-tight text-slate-950 uppercase leading-none">
            Nuestra historia
          </h1>

          <p className="text-lg sm:text-2xl font-black tracking-tight text-slate-800 uppercase italic">
            Más de 25 años{" "}
            <span className="text-[#00A811]">creciendo junto al deporte.</span>
          </p>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal pt-1 max-w-3xl">
            Matacos Deportes nació en septiembre de 1999, en Formosa Capital, como un emprendimiento familiar impulsado por Sandra Mujica y Miguel Ángel Marchi. Lo que comenzó como un pequeño comercio de indumentaria urbana fue evolucionando hasta convertirse en un espacio dedicado al deporte y a quienes lo practican.
          </p>
        </FadeInOnScroll>

        {/* -------------------------------------------------------- */}
        {/* 2. BLOQUE «LOS PRIMEROS PASOS» Y «UNA NUEVA OPORTUNIDAD»  */}
        {/* -------------------------------------------------------- */}
        <FadeInOnScroll direction="up" delayMs={100}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Bloque: «Los primeros pasos» */}
            <div className="relative rounded-3xl bg-slate-50 border border-slate-200/90 p-7 sm:p-9 space-y-5 flex flex-col justify-between shadow-xs hover:border-emerald-300 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-white text-xs font-black uppercase tracking-wider">
                    <Calendar className="w-3 h-3 text-[#00D615]" />
                    <span>1999</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Etapa Inicial
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-slate-950">
                  Todo comenzó con un emprendimiento familiar
                </h2>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  En septiembre de 1999, Sandra Mujica y Miguel Ángel Marchi dieron inicio a este proyecto comercial en el Paseo de Compras de la calle San Martín, conocido popularmente como “el Mercadito”. Bajo el nombre M y M, el negocio comenzó dedicado a la venta de indumentaria urbana unisex.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <Users className="w-4 h-4 text-[#00A811]" />
                <span>Paseo San Martín (“el Mercadito”) • Proyecto M y M</span>
              </div>
            </div>

            {/* Bloque: «Una nueva oportunidad» */}
            <div className="relative rounded-3xl bg-slate-50 border border-slate-200/90 p-7 sm:p-9 space-y-5 flex flex-col justify-between shadow-xs hover:border-emerald-300 transition-colors">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                    <Activity className="w-3 h-3 text-[#00A811]" />
                    <span>TRANSFORMACIÓN TÉCNICA</span>
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Visión Deportiva
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-slate-950">
                  Una nueva forma de entender el deporte
                </h2>

                <div className="space-y-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  <p>
                    A partir de la experiencia previa de Sandra en comercios deportivos de Resistencia, Chaco, los fundadores identificaron una necesidad en Formosa: ofrecer una mayor variedad de artículos y accesorios técnicos para distintas disciplinas deportivas.
                  </p>
                  <p>
                    Esta oportunidad impulsó una transformación en el negocio, que amplió su propuesta para acompañar a deportistas, profesores y aficionados de diferentes actividades.
                  </p>
                </div>
              </div>

              {/* Valores destacados */}
              <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider shadow-2xs">
                  # Deporte
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider shadow-2xs">
                  # Diversidad
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider shadow-2xs">
                  # Crecimiento
                </span>
              </div>
            </div>
          </div>
        </FadeInOnScroll>

        {/* -------------------------------------------------------- */}
        {/* 3. BLOQUE «EL NACIMIENTO DE MATACOS»                     */}
        {/* -------------------------------------------------------- */}
        <FadeInOnScroll direction="up" delayMs={100}>
          <div className="rounded-3xl bg-emerald-50/60 border border-emerald-200/90 p-8 sm:p-12 relative overflow-hidden space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Texto y narrativa */}
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-black tracking-widest uppercase shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-[#00A811]" />
                  <span>IDENTIDAD Y RAÍCES DEL GRAN CHACO</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-slate-950">
                  Una identidad propia
                </h2>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                  Con esta nueva orientación, el emprendimiento adoptó el nombre <strong>Matacos</strong>, elegido como una forma de diferenciarse de otros comercios y rendir homenaje a las raíces culturales de los pueblos originarios de la región del Gran Chaco.
                </p>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                  Con el tiempo, la identidad gráfica de la marca también fue evolucionando. Su logotipo inicial, de tonalidades amarillas y con una silueta representativa, dio paso a una identidad centrada en el verde, un color asociado al deporte, la actividad al aire libre, el fitness y la vida saludable.
                </p>
              </div>

              {/* Logotipo oficial actual con protagonismo institucional */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-emerald-200 shadow-md space-y-3 text-center">
                <div className="relative w-48 sm:w-56 h-16 flex items-center justify-center">
                  <Image
                    src="/matacos-deportes-logo.png"
                    alt="Logotipo Oficial de Matacos Deportes"
                    width={220}
                    height={56}
                    className="object-contain max-h-14 w-auto"
                    priority={false}
                  />
                </div>
                <div className="text-center space-y-0.5">
                  <span className="block text-[11px] font-black tracking-widest uppercase text-[#00A811]">
                    MATACOS DEPORTES
                  </span>
                  <span className="block text-[10px] text-slate-500 font-semibold uppercase">
                    Identidad visual oficial
                  </span>
                </div>
              </div>
            </div>
          </div>
        </FadeInOnScroll>

        {/* -------------------------------------------------------- */}
        {/* 4. BLOQUE VISUAL PRINCIPAL: NUESTRA EVOLUCIÓN (COMPARACIÓN) */}
        {/* -------------------------------------------------------- */}
        <FadeInOnScroll direction="up" delayMs={100} className="space-y-8 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#00A811]">
              EVOLUCIÓN EN EL CENTRO DE FORMOSA
            </span>
            <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight text-slate-950 uppercase">
              Una historia que sigue creciendo
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              De nuestros primeros locales a nuestro espacio actual.
            </p>
          </div>

          {/* Comparación visual de dos columnas en escritorio, apiladas en móvil */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch relative">
            {/* IMAGEN 1: LOCAL ANTERIOR (Saavedra 238) */}
            <StoreHistoricalPhotoCard
              src="/images/historia-local-anterior.jpg"
              alt="Local anterior de Matacos Deportes en Saavedra 238"
              tag="Saavedra 238"
              title="Una etapa de crecimiento: Saavedra 238"
              description="En su camino de expansión, Matacos se instaló en Saavedra 238, donde desarrolló sus actividades durante aproximadamente diez años."
              address="Saavedra 238"
              timeframe="Aproximadamente 10 años"
              isCurrent={false}
            />

            {/* IMAGEN 2: LOCAL ACTUAL (Saavedra 241) */}
            <StoreHistoricalPhotoCard
              src="/images/historia-local-actual.jpg"
              alt="Local actual de Matacos Deportes en Saavedra 241"
              tag="Saavedra 241"
              title="Nuestro presente: Saavedra 241"
              description="En 2019, el comercio se trasladó a su ubicación actual en Saavedra 241, Formosa Capital, donde continúa desarrollando su actividad y acompañando a deportistas y clientes de la región."
              address="Saavedra 241"
              timeframe="Desde 2019 hasta la actualidad"
              isCurrent={true}
            />
          </div>
        </FadeInOnScroll>

        {/* -------------------------------------------------------- */}
        {/* 5. BLOQUE FINAL: MATACOS HOY Y REGRESO AL CATÁLOGO       */}
        {/* -------------------------------------------------------- */}
        <FadeInOnScroll direction="up" delayMs={100}>
          <div className="relative rounded-3xl bg-[#041c16] bg-gradient-to-br from-[#06241d] via-[#041c16] to-[#02130e] text-white p-8 sm:p-14 shadow-2xl border border-emerald-800/80 overflow-hidden text-center space-y-8">
            {/* Ambient blur lighting */}
            <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full bg-[#00D615]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full bg-[#00D615]/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#00D615] text-xs font-black uppercase tracking-widest">
                <Store className="w-3.5 h-3.5" />
                <span>MATACOS HOY</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tight text-white leading-tight">
                Seguimos acompañando al deporte
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Más de 25 años después, Matacos Deportes continúa formando parte del comercio local de Formosa, manteniendo su compromiso con la variedad, la calidad y la atención a sus clientes. Desde su local de Saavedra 241, sigue ofreciendo indumentaria, calzado y equipamiento para distintas disciplinas deportivas.
              </p>

              {/* Frase destacada con gran protagonismo visual */}
              <div className="py-6 px-6 sm:px-10 rounded-2xl bg-black/40 border border-emerald-500/30 backdrop-blur-xs">
                <p className="text-lg sm:text-2xl font-black italic text-[#00D615] tracking-tight uppercase leading-snug">
                  «El compromiso sigue siendo el mismo: acompañar a quienes viven el deporte.»
                </p>
              </div>

              {/* Botón «Explorar catálogo» que navega a /catalogo */}
              <div className="pt-2 flex justify-center">
                <Link
                  href="/catalogo"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#00D615] hover:bg-[#00ba13] active:scale-98 text-[#041c16] font-black text-sm uppercase tracking-wider shadow-lg shadow-[#00D615]/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.4]" />
                  <span>Explorar catálogo</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.4]" />
                </Link>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </div>
  );
}