import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from "lucide-react";

export function EcommerceFooter() {
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
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#00D615] shrink-0" />
                <span>Saavedra 241, Formosa Capital, Argentina</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#00D615] shrink-0" />
                <span>Lunes a Sábado: 8:00 - 12:30 / 17:00 - 21:00</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#00D615] shrink-0" />
                <span>+54 (370) 400-0000</span>
              </div>
            </div>
          </div>

          {/* Column 2: Categorías Rápidas */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Categorías
            </h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>
                <a href="#productos" className="hover:text-[#00D615] transition-colors">
                  Calzado Deportivo
                </a>
              </li>
              <li>
                <a href="#productos" className="hover:text-[#00D615] transition-colors">
                  Indumentaria & Camperas
                </a>
              </li>
              <li>
                <a href="#productos" className="hover:text-[#00D615] transition-colors">
                  Mochilas & Bolsos
                </a>
              </li>
              <li>
                <a href="#productos" className="hover:text-[#00D615] transition-colors">
                  Carpas & Trekking
                </a>
              </li>
              <li>
                <a href="#productos" className="hover:text-[#00D615] transition-colors">
                  Accesorios & Relojes
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Disciplinas */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Disciplinas
            </h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>
                <a href="#disciplinas" className="hover:text-[#00D615] transition-colors">
                  Fútbol & Futsal
                </a>
              </li>
              <li>
                <a href="#disciplinas" className="hover:text-[#00D615] transition-colors">
                  Running & Maratón
                </a>
              </li>
              <li>
                <a href="#disciplinas" className="hover:text-[#00D615] transition-colors">
                  Outdoor & Camping
                </a>
              </li>
              <li>
                <a href="#disciplinas" className="hover:text-[#00D615] transition-colors">
                  Fitness & Musculación
                </a>
              </li>
              <li>
                <a href="#disciplinas" className="hover:text-[#00D615] transition-colors">
                  Básquet & Vóley
                </a>
              </li>
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
                <span className="text-white font-semibold">Garantía oficial y cambio en el local</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Aceptamos Mercado Pago, tarjetas de crédito (Visa, Mastercard, Cabal) en 3 y 6 cuotas, y transferencias directas con descuento.
              </p>
              <div className="pt-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:text-white transition-colors text-[11px]"
                >
                  <span>Acceso Panel de Gestión / POS</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Institutional */}
        <div className="pt-8 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Matacos Deportes. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Desarrollado para PPS I — Universidad de la Cuenca del Plata</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
