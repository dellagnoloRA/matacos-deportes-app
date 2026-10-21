"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

interface AuthViewProps {
  initialMode?: "login" | "register";
}

export function AuthView({ initialMode = "login" }: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTermsLogin, setAcceptTermsLogin] = useState(true);

  // Form states - Register
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regFechaNac, setRegFechaNac] = useState("");
  const [regSexo, setRegSexo] = useState<"Masculino" | "Femenino" | "Otro">("Masculino");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [acceptTermsRegister, setAcceptTermsRegister] = useState(true);

  // Notification state
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setNotification({
        type: "error",
        message: "Por favor ingrese su correo electrónico y contraseña.",
      });
      return;
    }
    if (!acceptTermsLogin) {
      setNotification({
        type: "error",
        message: "Debe aceptar los Términos del servicio para continuar.",
      });
      return;
    }
    setNotification({
      type: "success",
      message: "¡Bienvenido a Matacos Deportes! Sesión iniciada correctamente.",
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre || !regApellido || !regEmail || !regPassword) {
      setNotification({
        type: "error",
        message: "Por favor complete los campos obligatorios del registro.",
      });
      return;
    }
    if (!acceptTermsRegister) {
      setNotification({
        type: "error",
        message: "Debe aceptar los términos de condiciones y servicios para registrarse.",
      });
      return;
    }
    setNotification({
      type: "success",
      message: `¡Cuenta creada con éxito, ${regNombre}! Ya podés iniciar sesión.`,
    });
    setTimeout(() => {
      setMode("login");
      setLoginEmail(regEmail);
    }, 1500);
  };

  return (
    <div className="min-h-screen sm:h-screen bg-white relative flex flex-col justify-between p-3 sm:p-4 lg:p-5 font-sans selection:bg-slate-900 selection:text-white overflow-y-auto sm:overflow-hidden">
      {/* Botón Volver a la tienda en la esquina superior izquierda */}
      <div className="w-full max-w-5xl mx-auto pt-1 sm:pt-1.5 flex justify-start">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100 active:bg-slate-200"
          title="Volver a la tienda"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Volver a la tienda</span>
        </Link>
      </div>

      {/* Main Center Container (Diseño compacto y responsive que entra sin scroll) */}
      <main className="w-full max-w-[420px] sm:max-w-[440px] mx-auto flex flex-col items-center justify-center my-auto px-3 sm:px-0">
        {/* LOGO estático (No es un toggle ni enlace) */}
        <div className="mb-2.5 sm:mb-3 text-center select-none pointer-events-none">
          <img
            src="/matacos-deportes-logo.png"
            alt="Matacos Deportes"
            className="h-8 sm:h-9 w-auto object-contain mx-auto"
          />
        </div>

        {/* Notificación de estado */}
        {notification && (
          <div
            className={`mb-3 w-full p-2.5 rounded-lg text-xs font-semibold flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 ${
              notification.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            <span className="leading-snug">{notification.message}</span>
            <button
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
            {/* Encabezado compacto */}
            <div className="mb-3.5 sm:mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Iniciar sesión
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Inicia sesión o crea una cuenta
              </p>
            </div>

            {/* Botón Continuar con Google */}
            <button
              type="button"
              onClick={() =>
                alert("Inicio de sesión con Google disponible próximamente.")
              }
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
            </button>

            {/* Separador con "o" */}
            <div className="relative flex py-2 items-center my-0.5">
              <div className="grow border-t border-slate-200"></div>
              <span className="shrink-0 px-2 text-slate-400 text-xs">o</span>
              <div className="grow border-t border-slate-200"></div>
            </div>

            {/* Formulario compacto */}
            <form onSubmit={handleLoginSubmit} className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Ingrese su correo electrónico"
                  className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      alert("Por favor comunicate con administración al WhatsApp de Saavedra 241.")
                    }
                    className="text-[11px] text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white pr-9 shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkboxes: Novedades y Términos */}
              <div className="pt-0.5 space-y-1.5">
                <label className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-500 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="leading-tight">
                    Enviarme novedades y ofertas por correo electrónico
                  </span>
                </label>

                <label className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTermsLogin}
                    onChange={(e) => setAcceptTermsLogin(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-500 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="leading-tight">
                    Acepto los{" "}
                    <span className="underline hover:text-slate-900">
                      Términos del servicio
                    </span>{" "}
                    y políticas de privacidad
                  </span>
                </label>
              </div>

              {/* Botón Iniciar Sesión */}
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer active:scale-[0.99] mt-1"
              >
                Iniciar sesión
              </button>
            </form>

            {/* Cambio a registrarse */}
            <div className="text-center mt-3 pt-2.5 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setNotification(null);
                    setMode("register");
                  }}
                  className="font-bold text-slate-900 hover:underline cursor-pointer ml-0.5"
                >
                  Regístrate aquí
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MODO 2: REGISTRARSE (con la misma estética compacta y responsive sin scroll) */
          <div className="w-full animate-in fade-in duration-200">
            {/* Encabezado */}
            <div className="mb-3.5 sm:mb-4">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Registrarse
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Crea tu cuenta para comprar online en Matacos Deportes
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-2.5 sm:space-y-3">
              {/* Fila Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="Ingrese Nombre"
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={regApellido}
                    onChange={(e) => setRegApellido(e.target.value)}
                    placeholder="Ingrese Apellido"
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Fila Fecha y Sexo */}
              <div className="grid grid-cols-2 gap-2.5 items-start">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="text"
                    value={regFechaNac}
                    onChange={(e) => setRegFechaNac(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">
                    Sexo
                  </label>
                  <div className="pt-0.5">
                    <div className="flex items-center gap-2.5">
                      <label className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="reg-sexo"
                          value="Masculino"
                          checked={regSexo === "Masculino"}
                          onChange={() => setRegSexo("Masculino")}
                          className="w-3 h-3 text-slate-900 focus:ring-slate-500 cursor-pointer"
                        />
                        <span>Masc.</span>
                      </label>
                      <label className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="reg-sexo"
                          value="Femenino"
                          checked={regSexo === "Femenino"}
                          onChange={() => setRegSexo("Femenino")}
                          className="w-3 h-3 text-slate-900 focus:ring-slate-500 cursor-pointer"
                        />
                        <span>Fem.</span>
                      </label>
                      <label className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="reg-sexo"
                          value="Otro"
                          checked={regSexo === "Otro"}
                          onChange={() => setRegSexo("Otro")}
                          className="w-3 h-3 text-slate-900 focus:ring-slate-500 cursor-pointer"
                        />
                        <span>Otro</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Ingrese su correo electrónico"
                  className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white shadow-2xs"
                  required
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors bg-white pr-9 shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Términos y condiciones */}
              <div className="pt-0.5">
                <label className="flex items-start gap-2 text-[11px] sm:text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTermsRegister}
                    onChange={(e) => setAcceptTermsRegister(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-500 mt-0.5 cursor-pointer shrink-0"
                  />
                  <span className="leading-tight">
                    Sí, acepto los términos de condiciones y servicios
                  </span>
                </label>
              </div>

              {/* Botón Crear cuenta */}
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs cursor-pointer active:scale-[0.99] mt-1"
              >
                Crear cuenta
              </button>
            </form>

            {/* Volver a iniciar sesión */}
            <div className="text-center mt-3 pt-2.5 border-t border-slate-100">
              <span className="text-xs text-slate-600">
                ¿Ya tienes una cuenta?{" "}
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

      {/* Footer minimalista: Política de privacidad */}
      <footer className="w-full max-w-5xl mx-auto text-center py-2 text-[11px] text-slate-400 hover:text-slate-600">
        <span className="cursor-pointer hover:underline">
          Política de privacidad
        </span>
      </footer>
    </div>
  );
}
