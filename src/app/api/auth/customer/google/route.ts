import { NextRequest, NextResponse } from "next/server";

/**
 * Inicia el flujo OAuth 2.0 con Google para clientes de la tienda online (RF-29)
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";

  const redirectAfter = request.nextUrl.searchParams.get("redirect") || "/cuenta";
  const favsParam = request.nextUrl.searchParams.get("favs") || "";

  if (!clientId || clientId.includes("tu-client-id")) {
    const fallbackUrl = new URL("/cuenta", appUrl);
    fallbackUrl.searchParams.set(
      "error",
      "Credenciales de Google OAuth no configuradas en el servidor"
    );
    return NextResponse.redirect(fallbackUrl);
  }

  const callbackUrl = `${appUrl}/api/auth/customer/google/callback`;
  const statePayload = JSON.stringify({
    redirect: redirectAfter,
    favs: favsParam ? favsParam.split(",").filter(Boolean) : [],
  });
  const encodedState = Buffer.from(statePayload, "utf-8").toString("base64url");

  const googleAuthUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth"
  );
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", encodedState);

  return NextResponse.redirect(googleAuthUrl.toString());
}
