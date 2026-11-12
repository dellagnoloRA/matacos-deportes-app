import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { MapPin, ShieldCheck, Trophy, Heart, ArrowRight } from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

export const metadata: Metadata = {
  title: "Acerca de Matacos Deportes | Saavedra 241, Formosa Capital",
  description:
    "Conocé la historia, trayectoria y compromiso de Matacos Deportes. Equipamiento técnico oficial para natación, vóley, calzado y disciplinas deportivas en Formosa y toda Argentina.",
};

export default function AcercaDePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EcommerceHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#06241d] text-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#00D615]/10 blur-3xl pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#00D615]">
              NUESTRA HISTORIA Y COMPROMISO
            </span>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tight uppercase">
              Acerca de Matacos Deportes
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              Desde Saavedra 241, Formosa Capital, acercando el mejor equipamiento técnico deportivo a atletas, instituciones y aficionados de toda la Argentina.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          {/* Historia y Propósito */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Pasión por el Deporte
              </span>
              <h2 className="text-2xl sm:text-3xl font-black italic text-slate-900 uppercase">
                Más de dos décadas impulsando el rendimiento
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Matacos Deportes nació en Formosa con una misión clara: brindar a la comunidad deportiva acceso directo a indumentaria, calzado y accesorios de marcas líderes a nivel mundial, garantizando calidad original y asesoramiento técnico especializado.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Somos referentes en disciplinas como <strong>Natación</strong> (Speedo), <strong>Vóley</strong> (Mikasa), <strong>Crocs</strong> originales, calzado urbano y fitness, acompañando tanto a nadadores profesionales y voleibolistas de competición como a quienes eligen el deporte como estilo de vida saludable.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#00D615]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Nuestro Local Físico</h3>
                  <p className="text-xs text-slate-500">Saavedra 241, Formosa Capital, Argentina</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ubicados en pleno centro comercial de la ciudad, contamos con stock físico en salón y depósito, probadores y atención personalizada para que encuentres tu talle exacto y la tecnología que tu entrenamiento requiere.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span>Lunes a Sábado</span>
                <span className="font-mono">8:00 - 12:30 / 17:00 - 21:00</span>
              </div>
            </div>
          </div>

          {/* Pilares Institucionales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Calidad Oficial Garantizada</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Todos nuestros artículos son 100% originales con garantía directa de fábrica y cambio asegurado.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Stock en Tiempo Real</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nuestra tienda web se sincroniza al instante con el mostrador de Saavedra 241 para evitar sobreventas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Compromiso Formoseño</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apoyamos a escuelas deportivas, clubes y deportistas locales con equipamiento de nivel competitivo.
              </p>
            </div>
          </div>

          {/* CTA Al Catálogo */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl font-bold uppercase tracking-tight">
                ¿Buscás equipamiento para tu disciplina?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Explorá todo nuestro catálogo online con opciones de retiro gratis en local o envíos a domicilio.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="px-6 py-3.5 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-lg"
            >
              <span>Ver Catálogo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <EcommerceFooter />
    </div>
  );
}
