import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { ShieldCheck, Lock, ArrowLeft, Eye, Database, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Políticas de Privacidad • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Tratamiento y protección de datos personales bajo la Ley N° 25.326 de la República Argentina y directivas de la AAIP.",
};

export default function PoliticasDePrivacidadPage() {
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
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Ley N° 25.326 de Protección de Datos Personales</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Política de Privacidad y Tratamiento de Datos
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                En Matacos Deportes valoramos tu confianza y garantizamos la seguridad, confidencialidad e inmutabilidad de tu información personal.
              </p>
              <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400">
                <span>Versión: 1.0 (Noviembre 2026)</span>
                <span>•</span>
                <span>Órgano de Control: AAIP (Agencia de Acceso a la Información Pública)</span>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
            {/* 1. Responsable del Tratamiento */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  1
                </span>
                Responsable del Archivo y Base de Datos
              </h2>
              <p>
                El responsable del tratamiento de los datos personales es <strong>Matacos Deportes</strong>, con sede central en <strong>Saavedra 241, Formosa Capital (CP 3600), Argentina</strong>. Los datos recolectados se incorporan a bases de datos seguras destinadas exclusivamente a la gestión operativa, logística y de facturación fiscal del comercio.
              </p>
            </section>

            {/* 2. Principio de Minimización */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  2
                </span>
                Principio de Calidad y Minimización (Art. 4 Ley 25.326)
              </h2>
              <p>
                Matacos Deportes aplica el principio de recolección mínima necesaria:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Nombre, Apellido y DNI:</strong> Exigidos por la normativa de facturación de AFIP/ARCA (comprobantes fiscales) y por las empresas logísticas (Correo Argentino y cadetería) para acreditar identidad en el acto de entrega.</li>
                <li><strong>Correo Electrónico:</strong> Necesario para el envío del comprobante de compra digital, confirmaciones de reserva y notificaciones sobre el estado del envío.</li>
                <li><strong>Teléfono / WhatsApp:</strong> Utilizado exclusivamente para la coordinación de la franja horaria de entrega y contingencias operativas.</li>
                <li><strong>Domicilio Postal:</strong> Se solicita <em>únicamente</em> si el comprador opta por envío a domicilio (Cadetería o Correo). Si se elige retiro en nuestro local físico de Saavedra 241, el domicilio no se solicita.</li>
              </ul>
            </section>

            {/* 3. Consentimiento Libre y Expreso */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  3
                </span>
                Consentimiento y Registro Inmutable de Auditoría
              </h2>
              <p>
                De acuerdo con el artículo 5 de la Ley 25.326, el consentimiento es libre, expreso e informado. Al tildar las casillas obligatorias en nuestros formularios, se genera un registro de auditoría digital inmutable que almacena la fecha/hora exacta, versión documental aceptada, dirección IP de origen y agente de usuario (*User-Agent*), garantizando la transparencia legal frente a reclamos o inspecciones.
              </p>
            </section>

            {/* 4. Cesión y Seguridad de Datos */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  4
                </span>
                Confidencialidad y Destino de la Información
              </h2>
              <p>
                Matacos Deportes <strong>no vende, alquila ni comercializa</strong> bajo ninguna circunstancia los datos de sus clientes. Los datos solo se transmiten a los proveedores estrictamente necesarios para cumplir con el contrato de compra: pasarela de pago homologada (Mercado Pago), Correo Argentino y servidores de infraestructura protegidos con cortafuegos y cifrado TLS 1.3.
              </p>
            </section>

            {/* 5. Derechos ARCO */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                  5
                </span>
                Ejercicio de Derechos ARCO (Acceso, Rectificación y Supresión)
              </h2>
              <p>
                El titular de los datos personales tiene derecho a acceder a los mismos en forma gratuita a intervalos no inferiores a seis meses (salvo interés legítimo acreditado), así como a solicitar su actualización, rectificación o supresión enviando un correo electrónico a <strong>ventas@matacosdeportes.com</strong> o mediante nota formal presentada en <strong>Saavedra 241, Formosa Capital</strong>.
              </p>
            </section>

            {/* 6. Leyenda Obligatoria AAIP */}
            <section className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aviso Oficial Exigido por la Autoridad de Aplicación (AAIP)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 italic">
                «El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.»
              </p>
              <div className="pt-1">
                <a
                  href="https://www.argentina.gob.ar/aaip/datospersonales"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-950 font-semibold underline text-[11px]"
                >
                  Visitar sitio oficial de la Agencia de Acceso a la Información Pública (AAIP) ↗
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <EcommerceFooter />
    </div>
  );
}
