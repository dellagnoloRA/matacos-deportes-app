import { Metadata } from "next";
import { CheckoutView } from "@/components/ecommerce/checkout/CheckoutView";
import { getCurrentCustomerAction } from "@/server/actions/ecommerce/customerActions";

export const metadata: Metadata = {
  title: "Finalizar Compra y Pago • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Reservá tu pedido con stock garantizado en tiempo real y seleccioná tu medio de pago en Matacos Deportes.",
};

export const dynamic = "force-dynamic";

interface CheckoutPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleParam(val?: string | string[]): string | undefined {
  if (!val) return undefined;
  return Array.isArray(val) ? val[0] : val;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const initialOrderCode = getSingleParam(params.orden);
  const initialVerification = getSingleParam(params.verificacion);

  let initialCustomer = null;

  try {
    const res = await getCurrentCustomerAction();
    if (res.success && res.data) {
      initialCustomer = res.data;
    }
  } catch (err) {
    console.error("Error leyendo sesión de cliente en /checkout:", err);
  }

  return (
    <CheckoutView
      initialCustomer={initialCustomer}
      initialOrderCode={initialOrderCode}
      initialVerification={initialVerification}
    />
  );
}
