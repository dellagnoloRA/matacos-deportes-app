import { Metadata } from "next";
import { Suspense } from "react";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "Registrarse — Matacos Deportes",
  description: "Creá tu cuenta en Matacos Deportes para comprar online y gestionar tus pedidos.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#d9d9d9] flex items-center justify-center">Cargando...</div>}>
      <AuthView initialMode="register" />
    </Suspense>
  );
}
