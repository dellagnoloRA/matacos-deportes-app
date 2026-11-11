import React from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

export function EcommerceFooter() {
  return (
    <footer className="w-full bg-[#041c16] text-slate-300 border-t border-emerald-950/80 pt-16 pb-8 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
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
              Atención directa en nuestro local físico y tienda online oficial.
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

          {/* Column 2: Categorías & Disciplinas */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Navegación
            </h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>
                <Link href="/catalogo?category=calzado" className="hover:text-[#00D615] transition-colors">
                  Calzado Deportivo
                </Link>
              </li>
              <li>
                <Link href="/catalogo?category=indumentaria" className="hover:text-[#00D615] transition-colors">
                  Indumentaria & Camperas
                </Link>
              </li>
              <li>
                <Link href="/catalogo?category=accesorios" className="hover:text-[#00D615] transition-colors">
                  Accesorios & Mochilas
                </Link>
              </li>
              <li>
                <Link href="/seguimiento" className="hover:text-[#00D615] transition-colors">
                  Seguimiento de Pedidos
                </Link>
              </li>
              <li>
                <Link href="/cuenta" className="hover:text-[#00D615] transition-colors">
                  Mi Cuenta & Favoritos
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Marco Legal y Defensa del Consumidor */}
          <div className="space-y-3">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Marco Legal & Políticas
            </h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li>
                <Link
                  href="/terminos-y-condiciones"
                  className="hover:text-[#00D615] transition-colors flex items-center gap-1.5"
                >
                  <span>Términos y Condiciones</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/politicas-de-privacidad"
                  className="hover:text-[#00D615] transition-colors flex items-center gap-1.5"
                >
                  <span>Políticas de Privacidad (Ley 25.326)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-de-cookies"
                  className="hover:text-[#00D615] transition-colors flex items-center gap-1.5"
                >
                  <span>Política de Cookies</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-de-reembolso"
                  className="hover:text-[#00D615] transition-colors flex items-center gap-1.5"
                >
                  <span>Política de Reembolso y Cambios</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://www.argentina.gob.ar/produccion/defensadelconsumidor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#00D615] transition-colors flex items-center gap-1.5 text-slate-400"
                >
                  <span>Defensa de las y los Consumidores</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Transparencia Fiscal y Botón de Arrepentimiento */}
          <div className="space-y-4">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Protección al Consumidor
            </h4>

            {/* Botón de Arrepentimiento Oficial (Res. 271/2020) */}
            <div>
              <Link
                href="/arrepentimiento"
                className="group w-full flex items-center justify-between p-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-700/80 text-white transition-all shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#00D615] text-[#041c16] flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-black text-xs uppercase tracking-wider text-[#00D615]">
                      Botón de Arrepentimiento
                    </span>
                    <span className="text-[10px] text-slate-300">
                      Revocá tu compra online (10 días)
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Data Fiscal AFIP/ARCA (Formulario 960/D) */}
            <div className="pt-1 flex items-center gap-4">
              <a
                href="https://auth.afip.gob.ar/contribuyente_/login.xhtml?action=SYSTEM&system=denuncias"
                target="_blank"
                rel="noopener noreferrer"
                title="Data Fiscal"
                className="inline-block transition-opacity hover:opacity-80 shrink-0"
              >
                <img
                  src="/images/dataweb.jpg"
                  alt="Data Fiscal"
                  className="w-11 h-auto rounded shadow-xs"
                />
              </a>

              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:text-white transition-colors text-[11px]"
              >
                <span>Acceso Panel de Gestión / POS</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Legal Regulatory Notice (AAIP & Ley 25.326) */}
        <div className="pt-6 border-t border-emerald-950/80 text-[10px] text-slate-400 leading-relaxed space-y-2">
          <p>
            <strong className="text-slate-300">Ley N° 25.326 de Protección de Datos Personales:</strong> «El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La Dirección Nacional de Protección de Datos Personales (AAIP), Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.»
          </p>
        </div>

        {/* Bottom Bar: Copyright & Institutional */}
        <div className="pt-4 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Matacos Deportes. Todos los derechos reservados. Saavedra 241, Formosa Capital, Argentina.</p>
          <div className="flex items-center gap-1">
            <span>Desarrollado para PPS I — Universidad de la Cuenca del Plata</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
