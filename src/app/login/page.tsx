import { redirect } from "next/navigation";

interface LegacyLoginPageProps {
  searchParams?: Promise<{ redirect?: string }>;
}

/**
 * La pantalla de login separada para gestión fue reemplazada por el Login Unificado en /cuenta.
 */
export default async function LegacyLoginRedirectPage({
  searchParams,
}: LegacyLoginPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const redirectTarget =
    typeof resolved.redirect === "string" && resolved.redirect.startsWith("/")
      ? resolved.redirect
      : null;

  redirect(
    redirectTarget
      ? `/cuenta?redirect=${encodeURIComponent(redirectTarget)}`
      : "/cuenta"
  );
}
