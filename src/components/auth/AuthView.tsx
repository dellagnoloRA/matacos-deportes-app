"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  loginCustomerAction,
  registerCustomerAction,
} from "@/server/actions/ecommerce/customerActions";
import { useCustomerStore } from "@/store/customerStore";

interface AuthViewProps {
  initialMode?: "login" | "register";
  redirectTo?: string;
  initialError?: string;
}

export function AuthView({
  initialMode = "login",
  redirectTo = "/cuenta",
  initialError,
}: AuthViewProps) {
  const router = useRouter();
  const { setCustomer } = useCustomerStore();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [acceptTermsLogin, setAcceptTermsLogin] = useState(true);

  // Form states - Register
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regDni, setRegDni] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTermsRegister, setAcceptTermsRegister] = useState(true);

  // Notification state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(
    initialError ? { type: "error", message: initialError } : null
  );

  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") ? redirectTo : "/cuenta";

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!loginEmail.trim() || !loginPassword) {
      setNotification({
        type: "error",
        message: "Por favor ingresá tu correo electrónico y contraseña.",
      });
      return;
    }

    if (!acceptTermsLogin) {
      setNotification({
        type: "error",
        message: "Debés aceptar los Términos del servicio para continuar.",
      });
      return;
    }

    startTransition(async () => {
      const res = await loginCustomerAction({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (!res.success || !res.data) {
        setNotification({
          type: "error",
          message:
            res.error || "No se pudo iniciar sesión. Verificá tus credenciales.",
        });
        return;
      }

      setCustomer(res.data.customer);
      const linkedMsg =
        res.data.linkedOrdersCount > 0
          ? ` Se vincularon ${res.data.linkedOrdersCount} pedido(s) previo(s).`
          : "";

      setNotification({
        type: "success",
        message: `¡Bienvenido/a, ${res.data.customer.name}!${linkedMsg}`,
      });

      router.push(safeRedirect);
      router.refresh();
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const fullName = `${regNombre.trim()} ${regApellido.trim()}`.trim();
    if (!regNombre.trim() || !regApellido.trim() || !regEmail.trim() || !regPassword) {
      setNotification({
        type: "error",
        message: "Por favor completá los campos obligatorios del registro.",
      });
      return;
    }

    if (!acceptTermsRegister) {
      setNotification({
        type: "error",
        message: "Debés aceptar los términos y condiciones para registrarte.",
      });
      return;
    }

    startTransition(async () => {
      const cleanDni = regDni.replace(/[.\-\s]/g, "").trim();
      const res = await registerCustomerAction({
        name: fullName,
        email: regEmail.trim(),
        password: regPassword,
        dni: cleanDni || null,
        phone: regPhone.trim() || null,
      });

      if (!res.success || !res.data) {
        setNotification({
          type: "error",
          message:
            res.error || "No se pudo registrar la cuenta. Revisá los datos.",
        });
        return;
      }

      setCustomer(res.data.customer);
      const linkedMsg =
        res.data.linkedOrdersCount > 0
          ? ` Vinculamos ${res.data.linkedOrdersCount} compra(s) anterior(es) a tu perfil.`
          : "";

      setNotification({
        type: "success",
        message: `¡Cuenta creada con éxito, ${regNombre.trim()}!${linkedMsg}`,
      });

      router.push(safeRedirect);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col justify-between p-3 sm:p-4 lg:p-5 font-sans selection:bg-slate-900 selection:text-white">
      {/* Botón Volver */}
      <div className="w-full max-w-5xl mx-auto pt-1 sm:pt-1.5 flex items-center justify-between">
        <Link
          href={safeRedirect === "/checkout" ? "/checkout" : "/"}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100 active:bg-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>
            {safeRedirect === "/checkout" ? "Volver al Checkout" : "Volver a la tienda"}
          </span>
        </Link>

        <Link
          href="/seguimiento"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline py-1 px-2.5"
        >
          Seguir pedido sin cuenta →
        </Link>
      </div>

      {/* Main Center Container */}
      <main className="w-full max-w-[420px] sm:max-w-[440px] mx-auto flex flex-col items-center justify-center my-auto py-6 px-3 sm:px-0">
        {/* LOGO */}
        <Link href="/" className="mb-3 sm:mb-4 text-center block">
          <img
            src="/matacos-deportes-logo.png"
            alt="Matacos Deportes"
            className="h-9 sm:h-10 w-auto object-contain mx-auto"
          />
        </Link>

        {/* Notificación de estado */}
        {notification && (
          <div
            className={`mb-3.5 w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 ${
              notification.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            <span className="leading-snug">{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white ml-2 text-xs shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* MODO 1: INICIAR SESIÓN */}
        {mode === "login" ? (
          <div className="w-full animate-in fade-in duration-200">
            <div className="mb-3.5 sm:mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Iniciar sesión como cliente
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingresá a tu cuenta para agilizar tus compras y seguir tus pedidos
              </p>
            </div>

            {/* Botón Continuar con Google */}
            <a
              href={`/api/auth/customer/google?redirect=${encodeURIComponent(safeRedirect)}`}
              className="w-full py-2 sm:py-2.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-medium flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </a>

            <div className="relative flex py-2.5 items-center my-0.5">
              <div className="grow border-t border-slate-200"></div>
              <span className="shrink-0 px-2 text-slate-400 text-xs">
                o con tu correo
              </span>
              <div className="grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  disabled={isPending}
                  className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Contraseña
                  </label>
                  <a
                    href="https://wa.me/5493704000000?text=Hola%20Matacos%20Deportes!%20Necesito%20ayuda%20para%20recuperar%20mi%20contrase%C3%B1a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-slate-500 hover:text-slate-900 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Ingresá tu contraseña"
                    disabled={isPending}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white pr-9 shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-0.5">
                <label className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTermsLogin}
                    onChange={(e) => setAcceptTermsLogin(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-500 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="leading-tight">
                    Acepto los términos del servicio y políticas de privacidad
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-slate-900 hover:bg-black disabled:opacity-60 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer active:scale-[0.99] mt-1 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isPending ? "Ingresando..." : "Iniciar sesión"}</span>
              </button>
            </form>

            <div className="text-center mt-4 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                ¿No tenés cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setNotification(null);
                    setMode("register");
                  }}
                  className="font-bold text-slate-900 hover:underline cursor-pointer ml-0.5"
                >
                  Registrate gratis aquí
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MODO 2: REGISTRARSE */
          <div className="w-full animate-in fade-in duration-200">
            <div className="mb-3.5 sm:mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Crear cuenta de cliente
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Guardá tus datos de envío y accedé al historial de tus compras online
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-2.5 sm:space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="Ej: Martín"
                    disabled={isPending}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={regApellido}
                    onChange={(e) => setRegApellido(e.target.value)}
                    placeholder="Ej: Gómez"
                    disabled={isPending}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">
                    DNI (opcional)
                  </label>
                  <input
                    type="text"
                    value={regDni}
                    onChange={(e) => setRegDni(e.target.value)}
                    placeholder="Ej: 38999111"
                    disabled={isPending}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Ej: 3704556677"
                    disabled={isPending}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  disabled={isPending}
                  className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">
                  Contraseña (mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Creá tu contraseña"
                    minLength={6}
                    disabled={isPending}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white pr-9 shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-0.5">
                <label className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTermsRegister}
                    onChange={(e) => setAcceptTermsRegister(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-500 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="leading-tight">
                    Sí, acepto los términos y condiciones del servicio
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-slate-900 hover:bg-black disabled:opacity-60 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer active:scale-[0.99] mt-1 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isPending ? "Creando cuenta..." : "Crear cuenta"}</span>
              </button>
            </form>

            <div className="text-center mt-3.5 pt-2.5 border-t border-slate-100">
              <span className="text-xs text-slate-600">
                ¿Ya tenés una cuenta?{" "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setNotification(null);
                  setMode("login");
                }}
                className="text-xs font-bold text-slate-900 hover:underline cursor-pointer ml-0.5"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-5xl mx-auto text-center py-2 text-[11px] text-slate-400">
        <span>Matacos Deportes • Saavedra 241, Formosa Capital</span>
      </footer>
    </div>
  );
}
