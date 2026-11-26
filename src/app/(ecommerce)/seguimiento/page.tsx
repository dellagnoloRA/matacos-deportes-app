import { Metadata } from "next";
import { OrderTrackingView } from "@/components/ecommerce/tracking/OrderTrackingView";

export const metadata: Metadata = {
  title: "Seguimiento de Pedido • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Consultá el estado de preparación, retiro o despacho de tu pedido online en Matacos Deportes.",
};

interface SeguimientoPageProps {
  searchParams?: Promise<{
    codigo?: string;
    verificacion?: string;
  }>;
}

export default async function SeguimientoPage({
  searchParams,
}: SeguimientoPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const initialCode =
    typeof resolved.codigo === "string" ? resolved.codigo : "";
  const initialVerification =
    typeof resolved.verificacion === "string" ? resolved.verificacion : "";

  return (
    <OrderTrackingView
      initialCode={initialCode}
      initialVerification={initialVerification}
    />
  );
}
