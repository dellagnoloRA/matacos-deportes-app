import { Metadata } from "next";
import { Suspense } from "react";
import { AuthView } from "@/components/auth/AuthView";
import {
  CustomerAccountView,
  type AccountTab,
} from "@/components/ecommerce/account/CustomerAccountView";
import {
  getCurrentCustomerAction,
  getCustomerOrdersAction,
  getCustomerFavoritesDetailsAction,
} from "@/server/actions/ecommerce/customerActions";

export const metadata: Metadata = {
  title: "Mi Cuenta • Matacos Deportes | Saavedra 241, Formosa",
  description:
    "Accedé a tu cuenta en Matacos Deportes, seguí el estado de tus pedidos online y gestioná tus datos de entrega.",
};

export const dynamic = "force-dynamic";

interface CuentaPageProps {
  searchParams?: Promise<{
    mode?: string;
    redirect?: string;
    error?: string;
    tab?: string;
  }>;
}

export default async function CuentaPage({ searchParams }: CuentaPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const initialMode = resolved.mode === "register" ? "register" : "login";
  const redirectTo =
    typeof resolved.redirect === "string" ? resolved.redirect : "/cuenta";
  const initialError =
    typeof resolved.error === "string" ? resolved.error : undefined;

  let currentCustomer = null;
  try {
    const customerRes = await getCurrentCustomerAction();
    if (customerRes.success && customerRes.data) {
      currentCustomer = customerRes.data;
    }
  } catch (err) {
    console.error("Error obteniendo sesión del cliente en /cuenta:", err);
  }

  // Si el cliente tiene sesión iniciada y viene con ?redirect=/checkout, o quiere ver su panel:
  if (currentCustomer) {
    const [ordersRes, favsRes] = await Promise.all([
      getCustomerOrdersAction(),
      getCustomerFavoritesDetailsAction(),
    ]);

    const initialTab: AccountTab =
      resolved.tab === "perfil" || resolved.tab === "favoritos"
        ? resolved.tab
        : "pedidos";

    return (
      <CustomerAccountView
        initialCustomer={currentCustomer}
        initialOrders={ordersRes.success && ordersRes.data ? ordersRes.data : []}
        initialFavorites={favsRes.success && favsRes.data ? favsRes.data : []}
        initialTab={initialTab}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-700">
          Cargando cuenta...
        </div>
      }
    >
      <AuthView
        initialMode={initialMode}
        redirectTo={redirectTo}
        initialError={initialError}
      />
    </Suspense>
  );
}
