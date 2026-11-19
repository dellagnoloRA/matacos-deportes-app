import React from "react";
import { Metadata } from "next";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import { OurHistoryView } from "@/components/ecommerce/OurHistoryView";

export const metadata: Metadata = {
  title: "Sobre Nosotros y Nuestra Historia | Matacos Deportes - Formosa",
  description:
    "Conocé la historia, trayectoria de más de 25 años y evolución de Matacos Deportes. Desde sus orígenes en 1999 hasta su actual salón en Saavedra 241, Formosa Capital.",
};

export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <EcommerceHeader />
      <main className="flex-1">
        <OurHistoryView />
      </main>
      <EcommerceFooter />
    </div>
  );
}