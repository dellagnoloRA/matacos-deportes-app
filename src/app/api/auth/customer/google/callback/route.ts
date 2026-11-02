import { NextRequest, NextResponse } from "next/server";
import { loginOrRegisterGoogleCustomer } from "@/server/actions/ecommerce/customerActions";
import {
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_SESSION_MAX_AGE_SECONDS,
} from "@/lib/customerSession";

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  sub?: string;
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Callback OAuth 2.0 de Google para clientes de la tienda online (RF-29)
 * URI: http://localhost:3000/api/auth/customer/google/callback
 */
export async function GET(request: NextRequest) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";

  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  let redirectPath = "/cuenta";
  let guestFavorites: string[] = [];

  if (stateParam) {
    try {
      const decoded = JSON.parse(
        Buffer.from(stateParam, "base64url").toString("utf-8")
      ) as { redirect?: string; favs?: string[] };
      if (decoded.redirect && decoded.redirect.startsWith("/")) {
        redirectPath = decoded.redirect;
      }
      if (Array.isArray(decoded.favs)) {
        guestFavorites = decoded.favs;
      }
    } catch {
      // Ignorar state malformado
    }
  }

  if (errorParam || !code) {
    const errUrl = new URL("/cuenta", appUrl);
    errUrl.searchParams.set(
      "error",
      "Inicio de sesión con Google cancelado o no autorizado"
    );
    return NextResponse.redirect(errUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const callbackUrl = `${appUrl}/api/auth/customer/google/callback`;

  try {
    // 1. Intercambiar el código de autorización por access_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenRes.ok || !tokenData.access_token) {
      const errUrl = new URL("/cuenta", appUrl);
      errUrl.searchParams.set(
        "error",
        "No se pudo validar la autorización con Google"
      );
      return NextResponse.redirect(errUrl);
    }

    // 2. Obtener perfil verificado del cliente en Google
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const userInfo = (await userRes.json()) as GoogleUserInfo;
    const googleId = userInfo.sub || userInfo.id;
    const email = userInfo.email;

    if (!googleId || !email) {
      const errUrl = new URL("/cuenta", appUrl);
      errUrl.searchParams.set(
        "error",
        "La cuenta de Google no proporcionó un correo electrónico válido"
      );
      return NextResponse.redirect(errUrl);
    }

    // 3. Registrar o iniciar sesión en la tabla Customer (vinculando pedidos previos y favoritos)
    const authResult = await loginOrRegisterGoogleCustomer({
      googleId,
      email,
      name: userInfo.name || email.split("@")[0] || "Cliente",
      avatarUrl: userInfo.picture || null,
      guestFavorites,
    });

    if (!authResult.success || !authResult.data) {
      const errUrl = new URL("/cuenta", appUrl);
      errUrl.searchParams.set(
        "error",
        authResult.error || "Error al iniciar sesión con Google"
      );
      return NextResponse.redirect(errUrl);
    }

    const destinationUrl = new URL(redirectPath, appUrl);
    const response = NextResponse.redirect(destinationUrl);

    response.cookies.set(CUSTOMER_COOKIE_NAME, authResult.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Error en Google OAuth Callback:", error);
    const errUrl = new URL("/cuenta", appUrl);
    errUrl.searchParams.set(
      "error",
      "Ocurrió un error inesperado al conectar con Google"
    );
    return NextResponse.redirect(errUrl);
  }
}
