import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  JWT_SECRET_KEY,
} from "./authConfig";

export { SESSION_COOKIE_NAME };

/**
 * Determina si la petición actual se sirve sobre HTTPS (vía proxy Caddy/Nginx o URL pública).
 * Evita marcar cookies como `Secure` cuando se opera por HTTP (ej. IP temporal de VPS o LAN local),
 * ya que los navegadores descartan cookies `Secure` sobre HTTP y rompen el inicio de sesión.
 */
export async function isHttpsRequest(): Promise<boolean> {
  try {
    const headerStore = await headers();
    const forwardedProto = headerStore.get("x-forwarded-proto");
    if (forwardedProto) {
      return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
    }
    const origin = headerStore.get("origin") || headerStore.get("referer");
    if (origin) {
      return origin.startsWith("https://");
    }
  } catch {
    // Ejecución desde scripts CLI fuera de Next.js Request Context
  }
  const appUrl =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  return appUrl.startsWith("https://");
}

export interface SessionPayload {
  userId: string;
  name: string;
  username: string | null;
  email: string;
  profileId: string | null;
  profileName: string | null;
  level: number;
  permissions: string[];
  [key: string]: unknown;
}

/**
 * Cifra el payload en un token JWT firmado válido por 12 horas (jornada comercial completa)
 */
export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(JWT_SECRET_KEY);
}

/**
 * Descifra y valida la integridad criptográfica y expiración del token JWT
 */
export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Guarda la cookie de sesión cifrada HttpOnly y protegida contra XSS/CSRF
 */
export async function setSessionCookie(token: string): Promise<void> {
  try {
    const [cookieStore, secure] = await Promise.all([
      cookies(),
      isHttpsRequest(),
    ]);
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS, // 12 horas
    });
  } catch {
    // Ejecución desde scripts CLI fuera de Next.js Request Context
  }
}

/**
 * Elimina la cookie de sesión de forma definitiva en todos los navegadores
 */
export async function deleteSessionCookie(): Promise<void> {
  try {
    const [cookieStore, secure] = await Promise.all([
      cookies(),
      isHttpsRequest(),
    ]);
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {
    // Ejecución desde scripts CLI fuera de Next.js Request Context
  }
}

/**
 * Obtiene la sesión actual desde las cookies del servidor
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return decryptSession(token);
  } catch {
    return null;
  }
}
