import React from "react";
import { Metadata } from "next";
import {
  Briefcase,
  Users,
  Sparkles,
  MapPin,
  Mail,
  CheckCircle2,
  Send,
} from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

export const metadata: Metadata = {
  title: "Trabajá con Nosotros • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Sumate al equipo de Matacos Deportes. Buscamos talentos apasionados por el deporte para ventas en mostrador, atención al cliente y logística ecommerce en Formosa Capital.",
};

const AREAS = [
  {
    title: "Ventas y Atención en Mostrador",
    description:
      "Asesoramiento técnico personalizado a deportistas, natación, calzado y manejo de caja en nuestro local central de Saavedra 241.",
    requirements: [
      "Vocación de servicio y proactividad.",
      "Conocimiento o interés en disciplinas deportivas.",
      "Buena comunicación interpersonal.",
    ],
  },
  {
    title: "Logística, Depósito y Despachos",
    description:
      "Control físico de stock, recepción de mercadería, armado de pedidos de la tienda online y preparación de paquetes para envíos nacionales.",
    requirements: [
      "Organización y atención al detalle.",
      "Manejo básico de herramientas informáticas.",
      "Capacidad para trabajo en equipo.",
    ],
  },
  {
    title: "Ecommerce y Soporte Digital",
    description:
      "Atención de consultas por WhatsApp, seguimiento de órdenes web y colaboración en la gestión del catálogo de productos.",
    requirements: [
      "Fluidez en canales de mensajería y redes sociales.",
      "Redacción clara y cordial.",
      "Orientación a la resolución rápida de dudas del cliente.",
    ],
  },
];

export default function TrabajaConNosotrosPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EcommerceHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#06241d] text-white py-14 sm:py-20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#00D615]/10 blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#00D615]">
              OPORTUNIDADES LABORALES
            </span>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tight uppercase">
              Trabajá con Nosotros
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-medium">
              Formá parte del equipo de Matacos Deportes. Crecé junto a la tienda líder en equipamiento deportivo de Formosa.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
          {/* Introducción */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  ¿Por qué sumarte a Matacos Deportes?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Un ambiente dinámico donde el compañerismo y el deporte van de la mano.
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              En Matacos Deportes valoramos el compromiso, la energía positiva y las ganas continuas de aprender. Buscamos personas que disfruten del contacto humano, compartan la pasión por el deporte y quieran aportar al crecimiento comercial de nuestro local físico y canal online.
            </p>
          </div>

          {/* Áreas de Trabajo */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-black italic uppercase text-slate-900 tracking-tight pb-2 border-b border-slate-200">
              Nuestras Áreas de Oportunidad
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {AREAS.map((area, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {area.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {area.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Perfil deseado:
                    </span>
                    {area.requirements.map((req, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00D615] shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cómo postularse */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#00D615]">
                ENVIO DE ANTECEDENTES
              </span>
              <h2 className="text-2xl font-black italic uppercase tracking-tight">
                ¿Te gustaría postularte?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Envianos tu Currículum Vitae actualizado indicando tu disponibilidad horaria y el área de tu preferencia. Nos pondremos en contacto cuando surja una búsqueda afín a tu perfil.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <a
                href="mailto:rrhh@matacosdeportes.com?subject=Postulaci%C3%B3n%20Laboral%20-%20Matacos%20Deportes"
                className="bg-white/10 hover:bg-white/20 border border-white/20 p-4 rounded-2xl flex items-center gap-3 transition-colors text-xs sm:text-sm font-semibold"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00D615] text-slate-950 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Vía Correo Electrónico</span>
                  <span className="text-white font-mono">rrhh@matacosdeportes.com</span>
                </div>
              </a>

              <div className="bg-white/10 border border-white/20 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">En forma presencial</span>
                  <span className="text-white font-medium">Saavedra 241, Formosa Capital</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EcommerceFooter />
    </div>
  );
}
