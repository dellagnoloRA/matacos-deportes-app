import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, JWT_SECRET_KEY } from "@/lib/authConfig";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isValidSession = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET_KEY, { algorithms: ["HS256"] });
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  // 1. Si intenta ir a /login estando ya autenticado, enviarlo a su panel
  if (pathname === "/login" && isValidSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Si está en /login pero la cookie es vieja o inválida, limpiarla
  if (pathname === "/login" && !isValidSession && token) {
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // 2. Rutas protegidas: /admin y /pos para personal interno
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pos");

  if (isProtectedRoute && !isValidSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Limpiar cookie corrupta o expirada
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/pos/:path*",
    "/login",
  ],
};
