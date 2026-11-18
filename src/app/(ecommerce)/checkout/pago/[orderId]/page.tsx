import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  PaymentMethodSelectionView,
  type WebOrderPaymentDetails,
} from "@/components/ecommerce/checkout/PaymentMethodSelectionView";
import { CheckoutHeader } from "@/components/ecommerce/checkout/CheckoutHeader";
import {
  AlertTriangle,
  ArrowLeft,
  ShoppingBag,
  HelpCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { buildWhatsAppChatUrl } from "@/lib/whatsapp";
import { companyConfig } from "@/config/company";

export const metadata: Metadata = {
  title: "Completar Pago — Matacos Deportes",
  description:
    "Seleccioná tu medio de pago para abonar tu pedido en Matacos Deportes Saavedra 241.",
};

interface CheckoutPagoPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function CheckoutPagoPage({
  params,
}: CheckoutPagoPageProps) {
  const { orderId } = await params;
  const decodedOrderId = decodeURIComponent(orderId).trim();

  // 1. Buscar la orden de venta en PostgreSQL por ID UUID o Código WEB
  const sale = await prisma.sale.findFirst({
    where: {
      OR: [
        { id: decodedOrderId },
        { invoiceNumber: decodedOrderId },
        { ticketCode: decodedOrderId },
      ],
    },
    include: {
      customer: true,
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // 2. Si la orden ya está completada/pagada, redirigir al resultado aprobado
  if (sale && sale.status === "COMPLETADA") {
    const code = sale.invoiceNumber || sale.id;
    redirect(`/checkout/resultado?orderCode=${encodeURIComponent(code)}&status=approved`);
  }

  // 3. Si la orden no existe en el sistema
  if (!sale) {
    const whatsappHelpUrl = buildWhatsAppChatUrl(
      companyConfig.whatsappNumber,
      `Hola Matacos Deportes! Tengo dudas con un pedido que no encuentro en el sistema (referencia: ${decodedOrderId}).`
    );

    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
        <CheckoutHeader />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Pedido no encontrado
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                No pudimos localizar ninguna orden pendiente de pago con la referencia{" "}
                <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {decodedOrderId}
                </span>
                . Es posible que haya expirado o sido completada previamente.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/catalogo"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#00A811] hover:bg-[#008f0e] active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#00A811]/20 transition-all text-center"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Explorar Catálogo</span>
              </Link>

              <a
                href={whatsappHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all text-center"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 4. Si la orden fue cancelada o expiró su ventana de reserva
  if (sale.status === "CANCELADA") {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
        <CheckoutHeader />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 py-16 flex items-center justify-center">
          <div className="w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                La reserva de este pedido expiró
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                El tiempo límite de 15 minutos para concretar el pago del pedido{" "}
                <span className="font-mono font-bold text-slate-800">
                  {sale.invoiceNumber || sale.id}
                </span>{" "}
                ha caducado y el inventario fue liberado para mantener la exactitud
                del stock en salón y web.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/catalogo"
                className="w-full py-3.5 px-6 rounded-2xl bg-[#00A811] hover:bg-[#008f0e] active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-[#00A811]/20 transition-all text-center"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver a armar mi carrito</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 5. Serializar la orden para el componente cliente
  const orderData: WebOrderPaymentDetails = {
    id: sale.id,
    orderCode: sale.invoiceNumber || `WEB-${sale.id.slice(0, 8).toUpperCase()}`,
    customerName:
      sale.customerName ||
      sale.customer?.name ||
      "Comprador",
    customerEmail: sale.customerEmail || sale.customer?.email || "",
    customerPhone: sale.customerPhone || sale.customer?.phone || null,
    shippingMethod: sale.shippingMethod || "RETIRO_LOCAL",
    shippingAddress: sale.shippingAddress || null,
    subtotal: Number(sale.subtotalGross || 0),
    shippingCost: Number(sale.shippingCost || 0),
    total: Number(sale.total || 0),
    status: sale.status,
    items: sale.items.map((item) => ({
      id: item.id,
      productName: item.variant?.product?.name || "Artículo Deportivo",
      size: item.variant?.size || null,
      color: item.variant?.color || null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice || item.price || 0),
    })),
  };

  return <PaymentMethodSelectionView order={orderData} />;
}
