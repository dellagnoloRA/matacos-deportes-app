import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { Cookie, ShieldCheck, ArrowLeft, Settings, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Cookies • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Información transparente sobre el uso de cookies técnicas esenciales y almacenamiento local en Matacos Deportes.",
};

export default function PoliticaDeCookiesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <EcommerceHeader />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumb / Back button */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la tienda</span>
            </Link>
          </div>

          {/* Header Banner */}
          <div className="bg-[#041c16] text-white p-6 sm:p-10 rounded-2xl shadow-sm border border-emerald-950 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-[#00D615] text-xs font-bold uppercase tracking-wider">
                <Cookie className="w-3.5 h-3.5" />
                <span>Transparencia Tecnológica</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Política de Cookies y Almacenamiento Local
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Explicamos qué datos se almacenan en tu navegador para que la tienda online funcione de forma ágil, segura y personalizada.
              </p>
              <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400">
                <span>Versión: 1.0 (Noviembre 2026)</span>
                <span>•</span>
                <span>Principio: Privacidad por Defecto</span>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
            {/* 1. ¿Qué es una cookie? */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  1
                </span>
                ¿Qué son las Cookies y el Almacenamiento Local?
              </h2>
              <p>
                Una cookie es un pequeño archivo de texto que un sitio web guarda en tu computadora o dispositivo móvil cuando lo visitás. El almacenamiento local (*localStorage*) es una tecnología similar que permite conservar información en tu navegador sin transmitirla continuamente al servidor en cada petición.
              </p>
            </section>

            {/* 2. Qué cookies usamos */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  2
                </span>
                Cookies y Almacenamiento Utilizados en Matacos Deportes
              </h2>
              <p>
                Clasificamos los identificadores en dos categorías estrictas:
              </p>

              <div className="space-y-4 pt-2">
                {/* Esenciales */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Cookies y Almacenamiento Técnico Esencial (Obligatorias)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Siempre Activas</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Son indispensables para que la tienda online funcione técnicamente. Sin ellas, no podrías mantener artículos en el carrito de compras ni iniciar sesión de cliente.
                  </p>
                  <ul className="list-disc pl-5 text-[11px] text-slate-600 space-y-1 pt-1">
                    <li><code>matacos_customer_token</code>: Cookie de sesión cifrada (JWT <em>HttpOnly</em>, segura) que autentica al cliente registrado.</li>
                    <li><code>matacos-cart-storage</code>: Almacenamiento en <em>localStorage</em> para conservar los productos y talles seleccionados en tu carrito.</li>
                    <li><code>matacos_cookie_consent</code>: Almacena tu elección sobre el banner de cookies para no volver a mostrártelo innecesariamente.</li>
                  </ul>
                </div>

                {/* Analíticas */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Cookies Analíticas y de Rendimiento (Opcionales)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">Requieren Consentimiento</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Permiten medir de forma agregada y anónima el rendimiento de las páginas y la navegación en el catálogo. Matacos Deportes aplica el principio de <strong>Privacidad por Defecto</strong>: si no hacés clic en «Aceptar todas», estas cookies permanecen bloqueadas.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Desactivación en el navegador */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  3
                </span>
                ¿Cómo Administrar o Eliminar las Cookies?
              </h2>
              <p>
                Podés bloquear o eliminar las cookies en cualquier momento configurando las opciones de tu navegador:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
                <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad &amp; Seguridad &gt; Cookies y datos del sitio.</li>
                <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
                <li><strong>Microsoft Edge:</strong> Configuración &gt; Permisos del sitio &gt; Cookies y datos del sitio.</li>
              </ul>
              <p className="text-[11px] text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                Nota: Si bloqueás la totalidad de las cookies (incluidas las técnicas esenciales), es posible que no puedas añadir prendas al carrito ni completar compras online.
              </p>
            </section>
          </div>
        </div>
      </main>

      <EcommerceFooter />
    </div>
  );
}
