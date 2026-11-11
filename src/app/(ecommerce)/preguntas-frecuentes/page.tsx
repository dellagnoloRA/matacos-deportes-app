import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  HelpCircle,
  Truck,
  CreditCard,
  RotateCcw,
  MessageCircle,
  Store,
  ShieldCheck,
} from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes & Ayuda • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Respondemos todas tus dudas sobre compras online, medios de pago (Mercado Pago, cuotas, transferencia), envíos a todo el país y políticas de cambios en Matacos Deportes.",
};

const FAQS = [
  {
    category: "Envíos y Retiro en Local",
    icon: Truck,
    questions: [
      {
        q: "¿Puedo retirar mi compra en el local físico?",
        a: "¡Sí! El retiro en nuestro local de Saavedra 241 (Formosa Capital) es 100% gratuito. Una vez confirmado tu pago, preparamos tu pedido en mostrador y te notificamos por email o WhatsApp para que pases a buscarlo con tu DNI y número de pedido.",
      },
      {
        q: "¿Hacen envíos a todo el país?",
        a: "Realizamos envíos a toda la República Argentina a través de servicios postales y expresos certificados (Correo Argentino, encomiendas). Podés calcular el costo y tiempo estimado ingresando tu código postal durante el checkout.",
      },
      {
        q: "¿Cuánto demora en llegar mi pedido?",
        a: "Para Formosa Capital y zonas aledañas, los pedidos suelen estar listos en el día o dentro de las 24 hs hábiles. Para envíos nacionales, el plazo habitual es de 3 a 7 días hábiles según la localidad de destino.",
      },
    ],
  },
  {
    category: "Medios de Pago y Facturación",
    icon: CreditCard,
    questions: [
      {
        q: "¿Qué medios de pago aceptan?",
        a: "Aceptamos Mercado Pago (tarjetas de crédito y débito Visa, Mastercard, Cabal), saldo en cuenta de Mercado Pago, transferencias bancarias directas con descuento especial y efectivo en el mostrador para pedidos con retiro local.",
      },
      {
        q: "¿Ofrecen cuotas sin interés?",
        a: "Sí, disponemos de promociones bancarias y cuotas con tarjetas seleccionadas a través de Mercado Pago. Las promociones vigentes se muestran detalladas en la pasarela de pago al momento de abonar.",
      },
      {
        q: "¿Emiten factura oficial?",
        a: "Sí, todas las operaciones de Matacos Deportes son respaldadas con facturación electrónica oficial AFIP/ARCA (Factura B o A según la condición fiscal del cliente).",
      },
    ],
  },
  {
    category: "Cambios y Garantía",
    icon: RotateCcw,
    questions: [
      {
        q: "¿Cómo realizo un cambio de talle o producto?",
        a: "Tenés hasta 30 días de corrido desde la recepción para solicitar un cambio. Si estás en Formosa, podés acercarte directamente a Saavedra 241 con la prenda en perfecto estado, sin uso y con sus etiquetas originales. Para cambios a distancia, contactanos por WhatsApp y coordinamos el reenvío.",
      },
      {
        q: "¿Los productos tienen garantía oficial?",
        a: "Absolutamente. Todos los productos comercializados en Matacos Deportes cuentan con garantía oficial de fabricante contra defectos de fabricación o fallas de confección.",
      },
    ],
  },
  {
    category: "Stock y Asesoramiento",
    icon: Store,
    questions: [
      {
        q: "¿El stock que veo en la página web es real?",
        a: "Sí, nuestro inventario está sincronizado en tiempo real con el sistema de ventas de nuestro salón físico. Cuando seleccionás un talle disponible, ese artículo existe físicamente en nuestro depósito o salón.",
      },
      {
        q: "¿Cómo sé qué talle elegir?",
        a: "En la ficha de cada calzado o indumentaria disponés de especificaciones y equivalencias de talle. Si tenés dudas entre dos talles, podés escribirnos por WhatsApp y nuestro equipo de Saavedra 241 te asesora con las medidas exactas en centímetros.",
      },
    ],
  },
];

export default function PreguntasFrecuentesPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EcommerceHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#06241d] text-white py-14 sm:py-20 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#00D615]/10 blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-[#00D615]">
              CENTRO DE AYUDA Y ATENCIÓN
            </span>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tight uppercase">
              Preguntas Frecuentes
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-medium">
              Todo lo que necesitás saber sobre envíos, pagos, cambios de talle y compras en Matacos Deportes.
            </p>
          </div>
        </section>

        {/* FAQs Content */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
          {FAQS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black italic uppercase text-slate-900 tracking-tight">
                    {section.category}
                  </h2>
                </div>

                <div className="space-y-3">
                  {section.questions.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2 transition-all hover:border-slate-300"
                    >
                      <h3 className="font-bold text-sm text-slate-900 flex items-start gap-2">
                        <span className="text-[#00D615] font-black shrink-0">Q.</span>
                        <span>{faq.q}</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Banner de Contacto Directo */}
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#00D615] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  ¿No encontraste lo que buscabas?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Escribinos por WhatsApp y nuestro equipo de Saavedra 241 te responderá al instante.
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/5493704000000?text=Hola%20Matacos%20Deportes!%20Tengo%20una%20consulta"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all shadow-xs"
            >
              Chatear por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <EcommerceFooter />
    </div>
  );
}
