"use client";

import React from "react";
import Link from "next/link";
import { Store, Truck, CreditCard, RefreshCw, ArrowRight } from "lucide-react";

interface BenefitItem {
  id: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  subtext: string;
  linkText?: string;
  linkHref?: string;
}

const COMMERCIAL_BENEFITS: BenefitItem[] = [
  {
    id: "local-saavedra",
    icon: Store,
    badge: "GRATIS EN TIENDA",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    title: "Local en Saavedra 241",
    description: "Retiro sin costo en nuestro local de Formosa Capital y atención personalizada para elegir tu talle exacto.",
    subtext: "Lun a Sáb 8:00–12:30 / 17:00–21:00 hs",
    linkText: "Ver ubicación y horarios",
    linkHref: "/#nosotros",
  },
  {
    id: "envios-nacionales",
    icon: Truck,
    badge: "A TODO EL PAÍS",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    title: "Envíos Nacionales y Cadetería",
    description: "Despacho ágil por Correo Argentino (a domicilio o sucursal) y cadetería en moto en el día para Formosa (CP 3600).",
    subtext: "Seguimiento online en tiempo real",
    linkText: "Seguir mi pedido",
    linkHref: "/seguimiento",
  },
  {
    id: "medios-pago",
    icon: CreditCard,
    badge: "MERCADO PAGO Y TRANSFERENCIA",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    title: "Medios de Pago",
    description: "Aboná con Mercado Pago, tarjetas de crédito/débito o transferencias inmediatas por CBU/Alias.",
    subtext: "Cobro protegido e instantáneo",
    linkText: "Ver medios de pago",
    linkHref: "/medios-de-pago",
  },
];

export function CommercialBenefitsBanner() {
  return (
    <section
      aria-label="Beneficios y propuesta de valor comercial"
      className="w-full bg-slate-50/80 border-y border-slate-200/80 py-8 sm:py-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {COMMERCIAL_BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top: Icon + Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#00A811] group-hover:bg-[#00D615] group-hover:text-slate-950 flex items-center justify-center transition-colors shadow-2xs">
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border tracking-wide ${b.badgeColor}`}
                    >
                      {b.badge}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                      {b.description}
                    </p>
                  </div>
                </div>

                {/* Bottom: Subtext & Link */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium truncate">
                    {b.subtext}
                  </span>
                  {b.linkHref && (
                    <Link
                      href={b.linkHref}
                      className="inline-flex items-center gap-0.5 font-bold text-emerald-700 hover:text-emerald-900 hover:underline shrink-0 ml-2"
                    >
                      <span>Ver</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
