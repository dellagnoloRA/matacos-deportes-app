import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { ShieldCheck, FileText, ArrowLeft, Scale, Clock, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Términos y condiciones contractuales de compra, envíos, reservas de stock y garantías en Matacos Deportes.",
};

export default function TerminosYCondicionesPage() {
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
                <Scale className="w-3.5 h-3.5" />
                <span>Marco Contractual Oficial</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Términos y Condiciones de Contratación
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Reglas aplicables a las compras realizadas a través de la plataforma web de Matacos Deportes y en nuestro local físico de Saavedra 241, Formosa Capital, Argentina.
              </p>
              <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400">
                <span>Versión: 1.0 (Noviembre 2026)</span>
                <span>•</span>
                <span>Jurisdicción: Formosa, República Argentina</span>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
            {/* 1. Identificación */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  1
                </span>
                Identificación del Comercio
              </h2>
              <p>
                El presente sitio web es operado por <strong>Matacos Deportes</strong>, con domicilio comercial legal sito en <strong>Saavedra 241, Ciudad de Formosa (CP 3600), Provincia de Formosa, República Argentina</strong>. Contacto directo: ventas@matacosdeportes.com / WhatsApp: +54 9 370 400-0000.
              </p>
            </section>

            {/* 2. Aceptación de los Términos */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  2
                </span>
                Aceptación Plena de los Términos
              </h2>
              <p>
                Toda persona que navegue, cree una cuenta de usuario o concrete una orden de compra bajo la modalidad de invitado (*Guest Checkout*) declara conocer y aceptar de manera plena, libre e informada estos Términos y Condiciones y la Política de Privacidad vinculada.
              </p>
            </section>

            {/* 3. Catálogo, Precios y Facturación */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  3
                </span>
                Precios, Moneda y Transparencia Fiscal
              </h2>
              <p>
                Todos los precios exhibidos en la plataforma están expresados en <strong>Pesos Argentinos (ARS)</strong> e incluyen el Impuesto al Valor Agregado (IVA al 21%) conforme al régimen de Transparencia Fiscal exigido por la normativa impositiva de AFIP/ARCA. Matacos Deportes emite comprobantes fiscales oficiales (Factura B a Consumidor Final o comprobantes electrónicos autorizados con CAE) y comprobantes de entrega formal con código QR interoperable.
              </p>
            </section>

            {/* 4. Reserva de Stock (TTL) */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  4
                </span>
                Reserva Transaccional de Stock (Ventana de 15 Minutos)
              </h2>
              <p>
                Al iniciar el proceso de checkout y generar una orden en estado <em>Pendiente de Pago</em>, el sistema bloquea y reserva temporalmente las unidades físicas del inventario por un lapso estricto de <strong>15 minutos</strong> (*Time-To-Live*). Si la transacción en pasarela o transferencia no se perfecciona dentro de dicha ventana temporal, la reserva expira automáticamente restituyendo las existencias al catálogo para evitar sobreventas concurrentes con el salón de ventas.
              </p>
            </section>

            {/* 5. Medios de Pago */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  5
                </span>
                Medios de Pago Autorizados
              </h2>
              <p>
                Los pagos online se procesan de manera cifrada a través de:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Mercado Pago Checkout Pro:</strong> Tarjetas de crédito, débito y dinero en cuenta con protocolos PCI-DSS.</li>
                <li><strong>Transferencia Bancaria Directa:</strong> Sujeta a verificación manual del comprobante bancario adjuntado antes de la liberación y despacho del paquete.</li>
                <li><strong>Cobro en Mostrador:</strong> Efectivo, tarjetas y QR en Saavedra 241 para pedidos con retiro pactado en el local.</li>
              </ul>
            </section>

            {/* 6. Envíos y Logística */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  6
                </span>
                Modalidades de Entrega y Despacho
              </h2>
              <p>
                Matacos Deportes ofrece tres modalidades de entrega:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Retiro en Local (Gratis):</strong> En Saavedra 241, Formosa Capital, en horarios comerciales habituales presentando DNI y número de orden.</li>
                <li><strong>Cadetería en Formosa Capital:</strong> Entrega a domicilio coordinada por WhatsApp para el radio urbano (CP 3600).</li>
                <li><strong>Correo Argentino:</strong> Para envíos a todo el territorio provincial y nacional con código de guía y seguimiento oficial (*Track & Trace*).</li>
              </ul>
            </section>

            {/* 7. Garantía Legal */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  7
                </span>
                Garantía Legal (Ley 24.240 de Defensa del Consumidor)
              </h2>
              <p>
                Todos los productos nuevos comercializados por Matacos Deportes gozan de la garantía legal de <strong>6 meses</strong> prevista por el artículo 11 de la Ley 24.240 contra defectos de fabricación o fallas de confección que no provengan del desgaste natural por uso indebido.
              </p>
            </section>

            {/* 8. Jurisdicción */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  8
                </span>
                Ley Aplicable y Jurisdicción
              </h2>
              <p>
                Los presentes términos se rigen e interpretan conforme a las leyes de la <strong>República Argentina</strong>. Ante cualquier controversia derivada del contrato de consumo, las partes se someten a los Tribunales Ordinarios de la Primera Circunscripción Judicial de la Provincia de Formosa, o a la autoridad de Defensa del Consumidor competente.
              </p>
            </section>
          </div>
        </div>
      </main>

      <EcommerceFooter />
    </div>
  );
}
