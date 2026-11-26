import React from "react";
import { Metadata } from "next";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { RevocationView } from "@/components/ecommerce/legal/RevocationView";

export const metadata: Metadata = {
  title: "Botón de Arrepentimiento • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Trámite oficial de revocación de compra online y reembolso del 100% bajo la Resolución 271/2020 y Ley 24.240.",
};

export default function ArrepentimientoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <EcommerceHeader />
      <main className="flex-1">
        <RevocationView />
      </main>
      <EcommerceFooter />
    </div>
  );
}
