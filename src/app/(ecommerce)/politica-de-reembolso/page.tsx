import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { RotateCcw, ShieldCheck, ArrowLeft, Store, Globe, AlertTriangle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Reembolso y Devoluciones • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Condiciones de cambios, devoluciones de dinero en local y derecho de arrepentimiento web bajo la Ley 24.240.",
};

export default function PoliticaDeReembolsoPage() {
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
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Garantía de Satisfacción y Defensa del Consumidor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Política de Reembolso, Cambios y Devoluciones
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Reglas claras, transparentes y justas tanto para tus compras en la tienda online como en nuestro local de Saavedra 241, Formosa.
              </p>
              <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-400">
                <span>Versión: 1.0 (Noviembre 2026)</span>
                <span>•</span>
                <span>Ley 24.240 y CCCN Art. 1110</span>
              </div>
            </div>
          </div>

          {/* Callout Botón de Arrepentimiento */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950 border border-emerald-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#00D615] uppercase tracking-wider">
                ¿Hiciste una compra web en los últimos 10 días?
              </span>
              <p className="text-xs text-slate-200">
                Podés tramitar tu revocación y reembolso del 100% de manera directa desde nuestro portal oficial.
              </p>
            </div>
            <Link
              href="/arrepentimiento"
              className="px-4 py-2 rounded-xl bg-[#00D615] hover:bg-[#00bf13] text-[#041c16] font-bold text-xs uppercase tracking-wider transition-all shrink-0 shadow-xs"
            >
              Ir al Botón de Arrepentimiento →
            </Link>
          </div>

          {/* Content Sections */}
          <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xs space-y-8 text-xs sm:text-sm leading-relaxed text-slate-700">
            {/* 1. Compras Online */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
                1. Compras Web — Derecho de Revocación y Arrepentimiento Legal
              </h2>
              <p>
                Conforme al artículo 34 de la Ley 24.240 de Defensa del Consumidor, el artículo 1110 del Código Civil y Comercial de la Nación y la Resolución 271/2020 de la Secretaría de Comercio Interior:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Plazo Legal de 10 Días:</strong> El comprador tiene derecho irrenunciable a revocar la compra durante un plazo de <strong>diez (10) días corridos</strong> contados a partir de la fecha en que se entregue el producto.
                </li>
                <li>
                  <strong>Logística Inversa sin Cargo:</strong> Los gastos de devolución corren por cuenta exclusiva de Matacos Deportes. En Formosa Capital se coordina retiro por cadetería o entrega en local; en el resto del país se provee una guía prepaga de Correo Argentino.
                </li>
                <li>
                  <strong>Inspección y Reembolso del 100%:</strong> Una vez recibido el paquete en Saavedra 241 y constatado el estado de la prenda dentro de las 48 horas hábiles, se reintegra el 100% del dinero abonado mediante el mismo medio de pago original (reversión en Mercado Pago o transferencia bancaria).
                </li>
              </ul>
            </section>

            {/* 2. Compras en Local Físico */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600 shrink-0" />
                2. Compras en Local Físico (Saavedra 241, Formosa)
              </h2>
              <p>
                Para las compras efectuadas presencialmente en nuestro local de Saavedra 241:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Política Amplia sin Límite Estricto de Días:</strong> Admitimos la devolución de dinero o cambio de producto sin un límite estricto de tiempo, supeditado exclusivamente a la presentación del ticket de compra y a que la prenda conserve su estado original inmaculado con las etiquetas adheridas.
                </li>
                <li>
                  <strong>Modalidad de Reintegro:</strong> El cliente puede optar libremente entre la devolución del dinero por el mismo medio de pago abonado o la emisión de un <strong>Vale de Compra</strong> (saldo a favor para futuras compras en el local).
                </li>
              </ul>
            </section>

            {/* 3. Condiciones de Admisión y Exclusiones */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                3. Condiciones Generales y Exclusiones Sanitarias
              </h2>
              <p>
                Para cualquier cambio o devolución rigen las siguientes condiciones indispensables:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>El producto debe encontrarse sin uso, sin lavado, sin olores ni manchas, y con todas sus etiquetas y envoltorios originales intactos.</li>
                <li>Es requisito indispensable presentar el ticket impreso de compra o el código digital de pedido web.</li>
                <li>
                  <strong>Exclusiones Sanitarias:</strong> Por estrictas normas de higiene y salubridad pública, prendas de contacto íntimo (ropa interior deportiva, calzas íntimas), mallas/bikinis y medias <strong>no admiten cambio ni devolución</strong> bajo ningún concepto, salvo vicios o fallas de fábrica evidentes.
                </li>
              </ul>
            </section>

            {/* 4. Protocolo de Rechazo y Abandono */}
            <section className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Protocolo de Rechazo por Deterioro y Custodia de Mercadería</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Si un producto devuelto por correo llega a Saavedra 241 con signos evidentes de uso, desgaste, suciedad, roturas o sin etiquetas, <strong>la devolución de dinero será rechazada</strong> con fundamentación técnica y registro fotográfico respaldatorio, notificándose de inmediato al comprador.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Plazo de Guarda de 60 Días:</strong> La prenda rechazada quedará en custodia en Saavedra 241 durante un plazo máximo de 60 días corridos para que el cliente la retire o abone el flete de reenvío a su domicilio. Si el cliente manifiesta expresamente su renuncia, o si transcurren los 60 días sin ser retirada, la mercadería se considerará en <strong>situación de abandono</strong> y Matacos Deportes dispondrá de la misma (donación benéfica o reciclaje), sin derecho a reintegro económico.
              </p>
            </section>
          </div>
        </div>
      </main>

      <EcommerceFooter />
    </div>
  );
}
