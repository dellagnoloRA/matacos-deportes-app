import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Banknote,
  CheckCircle2,
  Clock,
  Lock,
  FileText,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { buildWhatsAppChatUrl } from "@/lib/whatsapp";
import { getStoreSettings } from "@/server/actions/storeSettingsActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Financiación y Medios de Pago • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Conocé todos los medios de pago disponibles en Matacos Deportes: hasta 6 cuotas con Mercado Pago, transferencias directas con descuento y pago en efectivo en nuestro local de Saavedra 241, Formosa.",
};

export default async function MediosDePagoPage() {
  const { data: settings } = await getStoreSettings();
  const whatsappUrl = buildWhatsAppChatUrl(
    settings.whatsappNumber,
    "Hola Matacos Deportes! Quiero consultar por promociones vigentes con tarjetas y medios de pago."
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <EcommerceHeader />

      <main className="flex-1 py-8 sm:py-12">
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
          <div className="bg-[#041c16] text-white p-6 sm:p-10 rounded-3xl shadow-sm border border-emerald-950 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[#00D615]/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-[#00D615] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#00D615]" />
                <span>Transparencia y Seguridad en tus Compras</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black italic tracking-tight text-white uppercase">
                Financiación y Medios de Pago
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed font-normal">
                Elegí la opción más conveniente para abonar tu equipamiento en Matacos Deportes. Operamos con pasarelas oficiales de pago seguro, promociones bancarias en cuotas y transferencias directas.
              </p>
            </div>
          </div>

          {/* Métodos de Pago Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mercado Pago */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                    <CreditCard className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                    HASTA 6 CUOTAS
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase">
                    Mercado Pago
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Aboná de forma simple y segura con la plataforma de pagos líder de Argentina.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Tarjetas de crédito:</strong> Visa, Mastercard, Cabal y American Express. Cuotas fijas y promociones bancarias según tu entidad.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Tarjetas de débito:</strong> Débito bancario inmediato sin cargos ocultos.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Dinero en cuenta de Mercado Pago:</strong> Acreditación al instante.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cifrado SSL de 256 bits y protección total de tus datos financieros.</span>
              </div>
            </div>

            {/* Transferencia Bancaria */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <Building2 className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    DESCUENTO EXCLUSIVO
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase">
                    Transferencia Bancaria Directa
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Aboná de forma ágil desde el home banking de cualquier entidad bancaria o billetera virtual.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>CBU y Alias oficial:</strong> Al seleccionar este medio en el checkout, recibirás en pantalla los datos de la cuenta oficial.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Reserva de stock por 15 minutos:</strong> Tus artículos quedan apartados para darte tiempo a realizar la transferencia.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Carga de comprobante:</strong> Adjuntá la foto del comprobante o envíala por WhatsApp para acelerar la preparación de tu orden.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Validación ágil durante el horario comercial de Saavedra 241.</span>
              </div>
            </div>

            {/* Efectivo en Mostrador */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                    <Banknote className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    RETIRO EN SALÓN
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase">
                    Efectivo en Mostrador (Saavedra 241)
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Aboná en mano al momento de retirar tu pedido en nuestro local comercial de Formosa Capital.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Retiro 100% gratuito:</strong> Sin costo de envío ni cargos de preparación.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Comprobante fiscal al instante:</strong> Ticket fiscal oficial emitido en caja.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Prueba de talle en el momento:</strong> Podés verificar el calce de tus artículos en nuestros probadores.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500">
                <span>Horarios: Lun a Sáb 8:00–12:30 / 17:00–21:00 hs</span>
              </div>
            </div>

            {/* Facturación y Seguridad */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                    <FileText className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    AFIP / ARCA OFICIAL
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase">
                    Facturación Electrónica Oficial
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Todas las transacciones en Matacos Deportes se emiten con respaldo tributario oficial.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 pt-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Factura B:</strong> Para consumidores finales con DNI.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Factura A:</strong> Para responsables inscriptos o empresas (indicando CUIT en el checkout).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A811] shrink-0 mt-0.5" />
                    <span>
                      <strong>Envío por email:</strong> Recibirás tu comprobante digital en formato PDF directamente en tu casilla de correo.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Garantía de compra y defensa de los derechos del consumidor.</span>
              </div>
            </div>
          </div>

          {/* Callout de Asesoramiento */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-bold text-[#00D615] uppercase tracking-wider">
                ¿Tenés dudas sobre cuotas o promociones de tu banco?
              </span>
              <p className="text-xs sm:text-sm text-slate-300">
                Escribinos por WhatsApp y nuestro equipo de Saavedra 241 te asesora con las mejores opciones de pago.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Consultar por WhatsApp</span>
              </a>
              <Link
                href="/catalogo"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <span>Ir al Catálogo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <EcommerceFooter />
    </div>
  );
}
