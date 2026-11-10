"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Loader2,
  Truck,
} from "lucide-react";
import {
  getStoreSettings,
  updateStoreSettings,
  type StoreSettingsOutput,
} from "@/server/actions/storeSettingsActions";

interface StoreSettingsViewProps {
  initialSettings?: StoreSettingsOutput | null;
}

export function StoreSettingsView({ initialSettings }: StoreSettingsViewProps) {
  const [isLoadingInitial, setIsLoadingInitial] = useState(!initialSettings);
  const [settings, setSettings] = useState({
    storeName: initialSettings?.storeName || "Matacos Deportes",
    whatsappNumber: initialSettings?.whatsappNumber || "5493704000000",
    contactPhone: initialSettings?.contactPhone || "+54 370 4429999",
    contactEmail: initialSettings?.contactEmail || "ventas@matacosdeportes.com",
    notificationsEmail: initialSettings?.notificationsEmail || "",
    storeAddress: initialSettings?.storeAddress || "Saavedra 241",
    storeCity: initialSettings?.storeCity || "Formosa Capital",
    storePostalCode: initialSettings?.storePostalCode || "3600",
    businessHours:
      initialSettings?.businessHours ||
      "Lunes a Sábado de 08:30 a 12:30 y de 16:30 a 20:30 hs",
    instagramHandle: initialSettings?.instagramHandle || "@matacosdeportes",
    cadeteriaCost: initialSettings?.cadeteriaCost ?? 2500,
  });

  useEffect(() => {
    if (!initialSettings) {
      getStoreSettings().then((res) => {
        if (res.success && res.data) {
          setSettings({
            storeName: res.data.storeName,
            whatsappNumber: res.data.whatsappNumber,
            contactPhone: res.data.contactPhone,
            contactEmail: res.data.contactEmail,
            notificationsEmail: res.data.notificationsEmail || "",
            storeAddress: res.data.storeAddress,
            storeCity: res.data.storeCity,
            storePostalCode: res.data.storePostalCode,
            businessHours: res.data.businessHours,
            instagramHandle: res.data.instagramHandle || "",
            cadeteriaCost: res.data.cadeteriaCost ?? 2500,
          });
        }
        setIsLoadingInitial(false);
      });
    }
  }, [initialSettings]);

  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await updateStoreSettings(settings);

      if (res.success && res.data) {
        setSuccessMessage(
          "¡Configuración comercial actualizada con éxito! Los canales de contacto se sincronizaron en toda la plataforma."
        );
        setSettings({
          storeName: res.data.storeName,
          whatsappNumber: res.data.whatsappNumber,
          contactPhone: res.data.contactPhone,
          contactEmail: res.data.contactEmail,
          notificationsEmail: res.data.notificationsEmail || "",
          storeAddress: res.data.storeAddress,
          storeCity: res.data.storeCity,
          storePostalCode: res.data.storePostalCode,
          businessHours: res.data.businessHours,
          instagramHandle: res.data.instagramHandle || "",
          cadeteriaCost: res.data.cadeteriaCost,
        });
      } else {
        setErrorMessage(
          res.error || "Ocurrió un error al guardar los cambios."
        );
      }
    });
  };

  // Preview dinámico del enlace wa.me generado
  const previewWhatsappDigits = settings.whatsappNumber.replace(/\D/g, "");
  const previewWaUrl = `https://wa.me/${previewWhatsappDigits}`;

  if (isLoadingInitial) {
    return (
      <div className="w-full max-w-4xl mx-auto p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-500">Cargando configuración comercial...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Configuración de Tienda y Canales de Contacto
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Modificá el WhatsApp comercial, correos y datos del local. Los cambios impactan de inmediato en la tienda online y comprobantes sin reiniciar el sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Canales Digitales de Contacto */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Canales Digitales (WhatsApp y Correos de Notificación)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Utilizados por los clientes para consultas directas y por el sistema para enviar confirmaciones de compra.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>WhatsApp Oficial de Ventas y Envíos</span>
                <span className="text-emerald-600 text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded font-bold">wa.me</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="whatsappNumber"
                  value={settings.whatsappNumber}
                  onChange={handleChange}
                  placeholder="Ej: 5493704223344 o 3704223344"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent font-mono"
                  required
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                <span>Validación: 10 a 13 dígitos numéricos.</span>
                {previewWhatsappDigits && (
                  <a
                    href={previewWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Probar enlace</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Teléfono Fijo / Mostrador */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Teléfono Fijo o Mostrador Local</span>
              </label>
              <input
                type="text"
                name="contactPhone"
                value={settings.contactPhone}
                onChange={handleChange}
                placeholder="Ej: +54 370 4429999"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent"
                required
              />
              <span className="text-[11px] text-slate-400">
                Impreso al pie de los tickets de mostrador y facturas fiscales.
              </span>
            </div>

            {/* Correo Electrónico Principal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Correo de Contacto y Atención</span>
              </label>
              <input
                type="email"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleChange}
                placeholder="ventas@matacosdeportes.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent"
                required
              />
              <span className="text-[11px] text-slate-400">
                Visible para consultas de clientes y remitente de correos.
              </span>
            </div>

            {/* Correo de Notificaciones Administrativas */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Correo de Notificaciones (Opcional)</span>
              </label>
              <input
                type="email"
                name="notificationsEmail"
                value={settings.notificationsEmail}
                onChange={handleChange}
                placeholder="notificaciones@matacosdeportes.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent"
              />
              <span className="text-[11px] text-slate-400">
                Copia oculta o avisos internos de órdenes web para el personal.
              </span>
            </div>
          </div>
        </div>

        {/* Sección 2: Datos de Identidad Física y Sucursal */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Sucursal Saavedra 241 y Horarios de Atención</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Información de retiro en local, ubicación geográfica y redes sociales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nombre Comercial */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-slate-700">Nombre Comercial</label>
              <input
                type="text"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent font-bold"
                required
              />
            </div>

            {/* Dirección */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Dirección Física</label>
              <input
                type="text"
                name="storeAddress"
                value={settings.storeAddress}
                onChange={handleChange}
                placeholder="Saavedra 241"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent"
                required
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-slate-700">Ciudad / Localidad</label>
              <input
                type="text"
                name="storeCity"
                value={settings.storeCity}
                onChange={handleChange}
                placeholder="Formosa Capital"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent"
                required
              />
            </div>

            {/* Código Postal */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-slate-700">Código Postal</label>
              <input
                type="text"
                name="storePostalCode"
                value={settings.storePostalCode}
                onChange={handleChange}
                placeholder="3600"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent"
                required
              />
            </div>

            {/* Instagram */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-500" />
                <span>Instagram</span>
              </label>
              <input
                type="text"
                name="instagramHandle"
                value={settings.instagramHandle}
                onChange={handleChange}
                placeholder="@matacosdeportes"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent"
              />
            </div>

            {/* Horarios de Atención */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Horarios de Atención Comercial</span>
              </label>
              <input
                type="text"
                name="businessHours"
                value={settings.businessHours}
                onChange={handleChange}
                placeholder="Lunes a Sábado de 08:30 a 12:30 y de 16:30 a 20:30 hs"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Logística Urbana y Cadetería (RF-19) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Logística Urbana y Cadetería (Formosa Capital)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tarifa plana aplicable a entregas en moto/cadete dentro del radio de Formosa Capital (CP 3600).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-slate-700">Costo Fijo de Cadetería ($ ARS)</label>
              <input
                type="number"
                name="cadeteriaCost"
                value={settings.cadeteriaCost}
                onChange={handleChange}
                min={0}
                step={100}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-transparent font-bold"
                required
              />
              <span className="text-[11px] text-slate-400">
                Monto cobrado al cliente al seleccionar Cadetería local en el checkout.
              </span>
            </div>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-xl bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#00D615]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? "Guardando cambios..." : "Guardar Configuración"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
