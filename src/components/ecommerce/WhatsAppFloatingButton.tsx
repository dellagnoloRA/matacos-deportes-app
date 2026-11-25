"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function WhatsAppFloatingButton({
  phoneNumber,
  defaultMessage = "Hola Matacos Deportes! Tengo consultas de la tienda online",
}: WhatsAppFloatingButtonProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const storeSettings = useStoreSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar en el panel de administración, el sistema POS de caja o login
  if (
    !mounted ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/pos") ||
    pathname?.startsWith("/login")
  ) {
    return null;
  }

  const effectivePhone = phoneNumber || storeSettings.whatsappNumber;
  const cleanPhone = effectivePhone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  return (
    <aside
      aria-label="Asistencia directa por WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex items-center select-none print:hidden"
    >
      <div className="relative group flex items-center">
        {/* Tooltip elegante que aparece exclusivamente al pasar el cursor (hover) */}
        <div
          role="tooltip"
          className="pointer-events-none absolute right-full mr-3 hidden sm:group-hover:flex items-center whitespace-nowrap rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white shadow-xl border border-slate-800 animate-in fade-in slide-in-from-right-1 duration-200"
        >
          <span>{"¿Tenés dudas? ¡Escribinos a nuestro WhatsApp!"}</span>
          {/* Flechita apuntando al botón */}
          <span
            aria-hidden="true"
            className="absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rotate-45 bg-slate-950 border-r border-t border-slate-800"
          />
        </div>

        {/* Botón flotante de WhatsApp limpio y fijo */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar a Matacos Deportes por WhatsApp"
          className="flex h-14 w-14 sm:h-15 sm:w-15 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_20px_rgba(37,211,102,0.4)] transition-all duration-200 hover:scale-105 hover:bg-[#20ba5a] hover:shadow-[0_12px_24px_rgba(37,211,102,0.55)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 cursor-pointer"
        >
          {/* Ícono oficial SVG de WhatsApp */}
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 sm:h-8 sm:w-8 fill-white transition-transform group-hover:scale-110"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.414z" />
          </svg>
        </a>
      </div>
    </aside>
  );
}
