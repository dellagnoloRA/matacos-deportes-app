"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Store,
} from "lucide-react";
import { buildWhatsAppChatUrl } from "@/lib/whatsapp";
import { companyConfig } from "@/config/company";
import { FadeInOnScroll } from "@/components/ui/FadeInOnScroll";

export function AboutStoreSection() {
  const whatsappUrl = buildWhatsAppChatUrl(
    companyConfig.whatsappNumber,
    "Hola Matacos Deportes! Quiero consultar por asesoramiento en el local de Saavedra 241."
  );

  return (
    <section
      id="nosotros"
      aria-label="Sobre nosotros y trayectoria de Matacos Deportes"
      className="w-full py-14 sm:py-20 bg-white border-b border-slate-200/70 scroll-mt-24 sm:scroll-mt-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Narrative (7 cols) */}
          <FadeInOnScroll direction="up" delayMs={50} className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#00A811]" />
                <span>MÁS DE 25 AÑOS EN FORMOSA CAPITAL</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black italic tracking-tight text-slate-950 uppercase leading-tight">
                Referentes del deporte y el rendimiento en el Nordeste
              </h2>
            </div>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Desde nuestro emblemático salón ubicado en <strong>Saavedra 241</strong>, Matacos Deportes nació con un compromiso inquebrantable: acercar a atletas, clubes e instituciones del nordeste argentino indumentaria, accesorios deportivos y la línea oficial Crocs de primeras marcas internacionales, garantizando <strong>calidad 100% original</strong> y asesoramiento técnico genuino.
            </p>

            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Somos especialistas y referentes en disciplinas clave como <strong>Natación de competición</strong> (Speedo), <strong>Vóley profesional</strong> (Mikasa), la línea oficial <strong>Crocs</strong>, y equipamiento de <strong>Fitness & Gimnasio</strong>.
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-center space-y-1">
                <span className="block text-2xl font-black text-slate-950">25+</span>
                <span className="block text-[11px] font-bold text-slate-600 uppercase">
                  Años de Trayectoria
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-center space-y-1">
                <span className="block text-2xl font-black text-emerald-700">100%</span>
                <span className="block text-[11px] font-bold text-slate-600 uppercase">
                  Original Garantizado
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-center space-y-1">
                <span className="block text-2xl font-black text-slate-950">4</span>
                <span className="block text-[11px] font-bold text-slate-600 uppercase">
                  Disciplinas Insignia
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-center space-y-1">
                <span className="block text-2xl font-black text-[#00A811]">CP 3600</span>
                <span className="block text-[11px] font-bold text-slate-600 uppercase">
                  Despacho en el Día
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#25D366]/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Consultar por WhatsApp con un Asesor</span>
              </a>

              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                <span>Explorar Todo el Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeInOnScroll>

          {/* Right Column: Physical Store Card (5 cols) */}
          <FadeInOnScroll direction="up" delayMs={150} className="lg:col-span-5">
            <div className="relative rounded-3xl bg-[#041c16] bg-gradient-to-br from-[#06241d] via-[#041c16] to-[#02130e] text-white p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 overflow-hidden border border-emerald-800/80 space-y-5">
              {/* Subtle ambient blur */}
              <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#00D615]/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                {/* Header: Store badge & title (Línea divisoria debajo, sin etiqueta "Abierto ahora", solo "Salón Central") */}
                <div className="flex items-center gap-3.5 border-b border-emerald-800/60 pb-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#00D615] text-[#041c16] flex items-center justify-center font-black shadow-md shadow-[#00D615]/20 shrink-0">
                    <Store className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-wide text-white uppercase leading-none">
                      MATACOS DEPORTES
                    </h3>
                    <p className="text-xs text-[#00D615] font-semibold mt-1">
                      Salón Central
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Address (Línea divisoria debajo y texto "En pleno centro") */}
                  <div className="flex items-start gap-3.5 pb-4 border-b border-emerald-800/50">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950/90 border border-emerald-800/80 text-[#00D615] flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <strong className="block text-white font-extrabold text-xs uppercase tracking-wide">
                        Saavedra 241, Formosa Capital
                      </strong>
                      <span className="text-slate-300 text-xs block mt-0.5 font-normal">
                        CP 3600 — En pleno centro
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-normal">
                        A metros de Av. 25 de Mayo
                      </span>
                    </div>
                  </div>

                  {/* Hours (Línea divisoria debajo) */}
                  <div className="flex items-start gap-3.5 pb-4 border-b border-emerald-800/50">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950/90 border border-emerald-800/80 text-[#00D615] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <strong className="block text-white font-extrabold text-xs uppercase tracking-wide">
                        Horarios de Atención
                      </strong>
                      <span className="text-slate-300 text-xs block mt-0.5 font-normal">
                        Lunes a Sábado: 8:00 a 12:30 y 17:00 a 21:00 hs.
                      </span>
                      <span className="text-[11px] text-[#00D615] font-semibold block mt-0.5">
                        Retiro de compras web sin costo
                      </span>
                    </div>
                  </div>

                  {/* Customer Service note (Tipografía más tenue que el blanco puro) */}
                  <div className="p-4 rounded-2xl bg-[#062c22] border border-[#00D615]/20 text-xs space-y-1.5 shadow-inner">
                    <div className="flex items-center gap-2 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-[#00D615] shrink-0" />
                      <span className="text-white font-extrabold text-xs uppercase tracking-wider">
                        Atención Personalizada y Probadores
                      </span>
                    </div>
                    <p className="text-slate-300/85 text-xs leading-relaxed font-normal">
                      Contamos con probadores y asesoramiento en el salón para elegir tu talle exacto de Crocs y equipamiento técnico.
                    </p>
                  </div>
                </div>

                {/* Footer Actions (Línea divisoria superior y botón con flecha diagonal) */}
                <div className="pt-4 border-t border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <a
                    href="https://maps.google.com/?q=Saavedra+241+Formosa+Argentina"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00D615] hover:bg-[#00ba13] text-[#041c16] font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-[#00D615]/20 cursor-pointer active:scale-98"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Ver en Google Maps</span>
                  </a>

                  {/* Botón «Descubrí nuestra historia» que navega a la pantalla completa /sobre-nosotros */}
                  <Link
                    href="/sobre-nosotros"
                    className="inline-flex items-center gap-1.5 text-xs text-white hover:text-[#00D615] font-bold transition-colors py-1 cursor-pointer group"
                  >
                    <span>Descubrí nuestra historia</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#00D615] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}