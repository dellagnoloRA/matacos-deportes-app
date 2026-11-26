import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME, JWT_SECRET_KEY } from "@/lib/authConfig";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
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

  // 1. Retiro de /login separado: redirigir al login unificado /cuenta o a /admin si ya es staff
  if (pathname === "/login") {
    if (isValidSession) {
      const target = searchParams.get("redirect");
      const safeTarget =
        target && (target.startsWith("/admin") || target.startsWith("/pos"))
          ? target
          : "/admin";
      return NextResponse.redirect(new URL(safeTarget, request.url));
    }

    const unifiedUrl = new URL("/cuenta", request.url);
    const requestedRedirect = searchParams.get("redirect");
    if (requestedRedirect) {
      unifiedUrl.searchParams.set("redirect", requestedRedirect);
    }
    const response = NextResponse.redirect(unifiedUrl);
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  // 2. Si un administrador/empleado ya autenticado visita /cuenta, enviarlo directo al panel
  if (pathname === "/cuenta" && isValidSession) {
    const requestedRedirect = searchParams.get("redirect");
    const safeTarget =
      requestedRedirect &&
      (requestedRedirect.startsWith("/admin") ||
        requestedRedirect.startsWith("/pos"))
        ? requestedRedirect
        : "/admin";
    return NextResponse.redirect(new URL(safeTarget, request.url));
  }

  // Si está en /cuenta pero la cookie de staff es inválida o expiró, limpiarla
  if (pathname === "/cuenta" && !isValidSession && token) {
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // 3. Rutas protegidas: /admin y /pos para personal interno -> redirigen al login unificado (/cuenta)
  const isProtectedRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/pos");

  if (isProtectedRoute && !isValidSession) {
    const loginUrl = new URL("/cuenta", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pos/:path*", "/login", "/cuenta"],
};
