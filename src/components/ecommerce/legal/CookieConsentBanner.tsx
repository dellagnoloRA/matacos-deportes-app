"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "matacos_cookie_consent";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existingConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!existingConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  const handleAcceptEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "essential");
    setIsVisible(false);
  };

  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Aviso de Cookies y Privacidad"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#041c16] text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-emerald-900/80 backdrop-blur-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-900/80 flex items-center justify-center text-[#00D615] shrink-0">
              <Cookie className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-[#00D615]">
              Privacidad & Cookies
            </span>
          </div>
          <button
            type="button"
            onClick={handleAcceptEssentialOnly}
            className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
            aria-label="Cerrar aviso y usar solo esenciales"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
          Utilizamos cookies esenciales para el funcionamiento del carrito y tu sesión. Podés aceptar todas las mejoras analíticas o continuar únicamente con las estrictamente necesarias. Más información en nuestra{" "}
          <Link
            href="/politica-de-cookies"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00D615] underline hover:text-white transition-colors font-medium"
          >
            Política de Cookies
          </Link>
          .
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 py-2 px-3 rounded-lg bg-[#00D615] hover:bg-[#00bf13] text-[#041c16] text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
          >
            Aceptar todas
          </button>
          <button
            type="button"
            onClick={handleAcceptEssentialOnly}
            className="py-2 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/80 text-slate-200 text-xs font-medium transition-colors cursor-pointer text-center"
          >
            Solo esenciales
          </button>
        </div>
      </div>
    </div>
  );
}
