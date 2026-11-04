import { Metadata } from "next";
import { generateReceiptPayload } from "@/server/services/receiptService";
import { TicketPrintClient } from "./TicketPrintClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PrintPageProps {
  params: Promise<{
    saleId: string;
  }>;
  searchParams: Promise<{
    autoprint?: string;
  }>;
}

export async function generateMetadata({ params }: PrintPageProps): Promise<Metadata> {
  const { saleId } = await params;
  return {
    title: `Ticket ${saleId === "sample" ? "Muestra #042" : saleId} — Matacos Deportes`,
    description: "Impresión de ticket térmico de mostrador para Saavedra 241",
  };
}

export default async function PrintTicketPage({ params, searchParams }: PrintPageProps) {
  const { saleId } = await params;
  const { autoprint } = await searchParams;

  try {
    const receipt = await generateReceiptPayload(saleId);
    const shouldAutoPrint = autoprint !== "false";

    return <TicketPrintClient receipt={receipt} autoPrint={shouldAutoPrint} />;
  } catch (error: any) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Comprobante No Encontrado</h2>
          <p className="text-sm text-slate-600 mb-6">
            No se pudo generar el ticket para el identificador <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{saleId}</code>.
            {error?.message ? ` (${error.message})` : ""}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/pos/tickets/sample/print"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition"
            >
              Ver Ticket de Muestra (Foto Real)
            </Link>
            <Link
              href="/"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
