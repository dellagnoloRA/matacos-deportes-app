import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWebOrderById } from "@/server/actions/ecommerce/checkoutActions";
import { OrderDetailView } from "@/components/ecommerce/order/OrderDetailView";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface OrderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { id } = await params;
  const sParams = await searchParams;

  const res = await getWebOrderById(id);

  if (!res.success || !res.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <EcommerceHeader />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Orden Web No Encontrada
          </h1>
          <p className="text-xs text-slate-500 mt-2 max-w-sm">
            No se encontró ninguna orden con el código o identificador proporcionado:{" "}
            <code className="font-mono text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded">
              {id}
            </code>
          </p>
          <Link
            href="/catalogo"
            className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </Link>
        </main>
        <EcommerceFooter />
      </div>
    );
  }

  const simulatedSuccess = sParams.status === "approved" || sParams.payment_simulated === "true";

  return (
    <OrderDetailView
      order={res.data}
      simulatedSuccess={simulatedSuccess}
    />
  );
}

