/**
 * Configuración centralizada de seguridad y sesiones para Matacos Deportes
 */

export const SESSION_COOKIE_NAME = "matacos_session";

// Duración de sesión: 12 horas (cubre la jornada completa de apertura a cierre en Saavedra 241)
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export const SESSION_SECRET_STRING =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "matacos_secret_key_saavedra_241_formosa_secure_session_2026!";

export const JWT_SECRET_KEY = new TextEncoder().encode(SESSION_SECRET_STRING);
