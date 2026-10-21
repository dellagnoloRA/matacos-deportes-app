import { Metadata } from "next";
import { Suspense } from "react";
import { AuthView } from "@/components/auth/AuthView";

export const metadata: Metadata = {
  title: "Iniciar Sesión / Registrarse — Matacos Deportes",
  description: "Accedé a tu cuenta en Matacos Deportes o registrate para comprar online.",
};

interface LoginPageProps {
  searchParams?: Promise<{
    mode?: "login" | "register";
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const initialMode = resolved.mode === "register" ? "register" : "login";

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#d9d9d9] flex items-center justify-center">Cargando...</div>}>
      <AuthView initialMode={initialMode} />
    </Suspense>
  );
}
