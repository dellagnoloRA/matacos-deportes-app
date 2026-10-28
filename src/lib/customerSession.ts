import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const CUSTOMER_COOKIE_NAME = "matacos_customer_token";

// 30 días de validez según SPEC-RF29
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const CUSTOMER_SECRET_STRING =
  process.env.CUSTOMER_JWT_SECRET ||
  "matacos_customer_jwt_secret_dev_2026_isolated_fallback!";

export const CUSTOMER_JWT_SECRET_KEY = new TextEncoder().encode(
  CUSTOMER_SECRET_STRING
);

export interface CustomerSessionPayload {
  customerId: string;
  email: string;
  name: string;
  role: "CUSTOMER"; // Marcador explícito de aislamiento frente a User interno
  [key: string]: unknown;
}

// Almacenamiento en memoria de respaldo para suites de prueba CLI fuera de contexto HTTP de Next.js
let testContextCustomerToken: string | null = null;

export function setTestContextCustomerToken(token: string | null): void {
  testContextCustomerToken = token;
}

export function getTestContextCustomerToken(): string | null {
  return testContextCustomerToken;
}

/**
 * Firma y cifra un token JWT HS256 válido por 30 días para un cliente de la tienda online
 */
export async function encryptCustomerSession(
  payload: CustomerSessionPayload,
  expirationTime: string | number = "30d"
): Promise<string> {
  return new SignJWT({ ...payload, role: "CUSTOMER" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(CUSTOMER_JWT_SECRET_KEY);
}

/**
 * Descifra y verifica el token JWT de un cliente web
 */
export async function decryptCustomerSession(
  token: string
): Promise<CustomerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, CUSTOMER_JWT_SECRET_KEY, {
      algorithms: ["HS256"],
    });
    if (
      !payload ||
      typeof payload.customerId !== "string" ||
      payload.role !== "CUSTOMER"
    ) {
      return null;
    }
    return payload as unknown as CustomerSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Establece la cookie HttpOnly `matacos_customer_token`
 */
export async function setCustomerSessionCookie(token: string): Promise<void> {
  testContextCustomerToken = token;
  try {
    const cookieStore = await cookies();
    cookieStore.set(CUSTOMER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
    });
  } catch {
    // Ejecución desde CLI / scripts de test fuera de Next.js Request Context
  }
}

/**
 * Elimina la cookie `matacos_customer_token`
 */
export async function deleteCustomerSessionCookie(): Promise<void> {
  testContextCustomerToken = null;
  try {
    const cookieStore = await cookies();
    cookieStore.set(CUSTOMER_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    cookieStore.delete(CUSTOMER_COOKIE_NAME);
  } catch {
    // Ejecución desde CLI / scripts de test fuera de Next.js Request Context
  }
}

/**
 * Obtiene la sesión activa del cliente web desde la cookie o desde el contexto de test
 */
export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (token) {
      return decryptCustomerSession(token);
    }
  } catch {
    // Fallback para scripts de prueba CLI
    if (testContextCustomerToken) {
      return decryptCustomerSession(testContextCustomerToken);
    }
  }
  return null;
}
