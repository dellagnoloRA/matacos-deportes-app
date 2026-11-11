"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  MessageCircle,
} from "lucide-react";
import { getStoreSettings } from "@/server/actions/storeSettingsActions";
import { getDisciplines } from "@/server/actions/categoryActions";

interface FooterLinkItem {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_DISCIPLINES: FooterLinkItem[] = [
  { id: "disc-1", name: "Natación", slug: "natacion" },
  { id: "disc-2", name: "Vóley", slug: "voley" },
  { id: "disc-3", name: "Crocs", slug: "crocs" },
  { id: "disc-4", name: "Fitness & Entrenamiento", slug: "fitness" },
  { id: "disc-5", name: "Indumentaria", slug: "indumentaria" },
];

export function EcommerceFooter() {
  const [contactInfo, setContactInfo] = useState({
    storeName: "Matacos Deportes",
    storeAddress: "Saavedra 241",
    storeCity: "Formosa Capital",
    businessHours: "Lunes a Sábado: 8:00 - 12:30 / 17:00 - 21:00",
    contactPhone: "+54 (370) 400-0000",
    contactEmail: "ventas@matacosdeportes.com",
    whatsappNumber: "5493704000000",
  });

  const [disciplines, setDisciplines] = useState<FooterLinkItem[]>(DEFAULT_DISCIPLINES);

  useEffect(() => {
    let isMounted = true;

    const loadFooterData = () => {
      getStoreSettings()
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setContactInfo({
              storeName: res.data.storeName || "Matacos Deportes",
              storeAddress: res.data.storeAddress || "Saavedra 241",
              storeCity: res.data.storeCity || "Formosa Capital",
              businessHours:
                res.data.businessHours ||
                "Lunes a Sábado: 8:00 - 12:30 / 17:00 - 21:00",
              contactPhone: res.data.contactPhone || "+54 (370) 400-0000",
              contactEmail: res.data.contactEmail || "ventas@matacosdeportes.com",
              whatsappNumber: res.data.whatsappNumber || "5493704000000",
            });
          }
        })
        .catch(() => {});

      getDisciplines()
        .then((res) => {
          if (isMounted && res.success && res.data && res.data.length > 0) {
            setDisciplines(
              res.data.map((d: { id: string; name: string; slug: string }) => ({
                id: d.id,
                name: d.name,
                slug: d.slug,
              }))
            );
          }
        })
        .catch(() => {});
    };

    loadFooterData();

    const handleSettingsUpdated = () => loadFooterData();
    window.addEventListener("store-settings-updated", handleSettingsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("store-settings-updated", handleSettingsUpdated);
    };
  }, []);

  const locationDisplay = contactInfo.storeCity
    ? `${contactInfo.storeAddress}, ${contactInfo.storeCity}, Argentina`
    : `${contactInfo.storeAddress}, Argentina`;

  return (
    <footer className="w-full bg-[#041c16] text-slate-300 border-t border-emerald-950/80 pt-16 pb-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Footer Grid: 3 Columnas Equilibradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Column 1: Brand & Contact Info */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="font-black italic text-2xl text-[#00D615] tracking-tighter leading-none">
                MATACOS
              </span>
              <span className="font-black italic text-[11px] text-white tracking-[0.2em] leading-none uppercase mt-1">
                DEPORTES
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Equipamiento técnico, calzado e indumentaria para todas tus disciplinas.
              Atención directa en nuestro local físico y tienda online.
            </p>

            <div className="space-y-2 pt-2 text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#00D615] shrink-0 mt-0.5" />
                <span>{locationDisplay}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#00D615] shrink-0 mt-0.5" />
                <span>{contactInfo.businessHours}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#00D615] shrink-0" />
                <span>{contactInfo.contactPhone}</span>
              </div>
              {contactInfo.contactEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#00D615] shrink-0" />
                  <span>{contactInfo.contactEmail}</span>
                </div>
              )}
            </div>

            {/* Redes Sociales: Síguenos */}
            <div className="pt-3 border-t border-emerald-950/70 space-y-2">
              <span className="font-extrabold text-white text-[11px] uppercase tracking-wider block">
                Síguenos en Redes
              </span>
              <div className="flex items-center gap-2.5">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/matacosdeportes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-800/60 hover:border-[#00D615] hover:bg-[#00D615] hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs"
                  title="Instagram: @matacosdeportes"
                  aria-label="Instagram de Matacos Deportes"
                >
                  <Instagram className="w-4 h-4" />
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/matacosdeportes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-800/60 hover:border-[#00D615] hover:bg-[#00D615] hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs"
                  title="Facebook: Matacos Deportes"
                  aria-label="Facebook de Matacos Deportes"
                >
                  <Facebook className="w-4 h-4" />
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${contactInfo.whatsappNumber}?text=Hola%20Matacos%20Deportes!%20Quiero%20hacer%20una%20consulta`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-800/60 hover:border-[#00D615] hover:bg-[#00D615] hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs"
                  title="WhatsApp de Atención al Cliente"
                  aria-label="WhatsApp de Matacos Deportes"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@matacosdeportes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-800/60 hover:border-[#00D615] hover:bg-[#00D615] hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-xs"
                  title="TikTok: @matacosdeportes"
                  aria-label="TikTok de Matacos Deportes"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43c.04-.04.08-.07.11-.11V11.2a8.16 8.16 0 0 0 5.62 2.24V9.99a4.84 4.84 0 0 1-3-.97v-.03c1.01-.76 1.76-1.84 2-3.3z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Disciplinas */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Disciplinas
            </h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              {disciplines.slice(0, 6).map((disc) => (
                <li key={disc.id}>
                  <Link
                    href={`/catalogo?disciplina=${encodeURIComponent(disc.slug)}`}
                    className="hover:text-[#00D615] transition-colors"
                  >
                    {disc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Información de la Empresa (Estilo Adidas) */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Información de la Empresa
            </h4>
            <ul className="space-y-2.5 text-slate-400 font-medium">
              <li>
                <Link
                  href="/acerca-de"
                  className="hover:text-[#00D615] transition-colors flex items-center gap-1.5"
                >
                  <span>Acerca de Matacos Deportes</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/preguntas-frecuentes"
                  className="hover:text-[#00D615] transition-colors flex items-center gap-1.5"
                >
                  <span>Preguntas Frecuentes</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/trabaja-con-nosotros"
                  className="hover:text-[#00D615] transition-colors flex items-center gap-1.5"
                >
                  <span>Trabajá con nosotros</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Location */}
        <div className="pt-8 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {contactInfo.storeName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1 font-medium">
            <span>{contactInfo.storeAddress}, {contactInfo.storeCity} — Argentina</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
