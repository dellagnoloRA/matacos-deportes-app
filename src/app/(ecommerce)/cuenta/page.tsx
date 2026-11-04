import { Metadata } from "next";
import { Suspense } from "react";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "Mi Cuenta • Matacos Deportes | Saavedra 241, Formosa",
  description: "Accedé a tu cuenta en Matacos Deportes o registrate para comprar online y gestionar tus pedidos.",
};

interface CuentaPageProps {
  searchParams?: Promise<{
    mode?: "login" | "register";
  }>;
}

export default async function CuentaPage({ searchParams }: CuentaPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const initialMode = resolved.mode === "register" ? "register" : "login";

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-700">Cargando cuenta...</div>}>
      <AuthView initialMode={initialMode} />
    </Suspense>
  );
}
