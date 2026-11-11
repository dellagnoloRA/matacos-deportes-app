"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ShieldCheck } from "lucide-react";
import { getStoreSettings } from "@/server/actions/storeSettingsActions";
import { getCategories, getDisciplines } from "@/server/actions/categoryActions";

interface FooterLinkItem {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_CATEGORIES: FooterLinkItem[] = [
  { id: "cat-1", name: "Calzado", slug: "calzado" },
  { id: "cat-2", name: "Antiparras", slug: "antiparras" },
  { id: "cat-3", name: "Mallas", slug: "mallas" },
  { id: "cat-4", name: "Pelotas", slug: "pelotas" },
  { id: "cat-5", name: "Accesorios", slug: "accesorios" },
];

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

  const [categories, setCategories] = useState<FooterLinkItem[]>(DEFAULT_CATEGORIES);
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

      getCategories()
        .then((res) => {
          if (isMounted && res.success && res.data && res.data.length > 0) {
            setCategories(
              res.data.map((c: { id: string; name: string; slug: string }) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
              }))
            );
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
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
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
          </div>

          {/* Column 2: Categorías Rápidas */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Categorías
            </h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/catalogo?categoria=${encodeURIComponent(cat.slug)}`}
                    className="hover:text-[#00D615] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Disciplinas */}
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

          {/* Column 4: Seguridad y Medios de Pago */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Compra Segura
            </h4>
            <div className="space-y-3 text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00D615]" />
                <span className="text-white font-semibold">
                  Garantía oficial y cambio en el local
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Aceptamos Mercado Pago, tarjetas de crédito (Visa, Mastercard, Cabal) en 3 y 6 cuotas, y transferencias directas con descuento.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Institutional */}
        <div className="pt-8 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {contactInfo.storeName}. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Desarrollado para PPS I — Universidad de la Cuenca del Plata</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
