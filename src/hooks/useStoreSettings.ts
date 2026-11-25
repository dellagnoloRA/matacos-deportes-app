"use client";

import { useEffect, useState } from "react";
import {
  getStoreSettings,
  type StoreSettingsOutput,
} from "@/server/actions/storeSettingsActions";
import {
  DEFAULT_PHONE_NUMBER,
  DEFAULT_WHATSAPP_NUMBER,
  sanitizeWhatsAppNumber,
} from "@/config/company";

export interface ClientStoreSettings {
  storeName: string;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  storeAddress: string;
  storeCity: string;
  businessHours: string;
}

const DEFAULT_CLIENT_SETTINGS: ClientStoreSettings = {
  storeName: "Matacos Deportes",
  whatsappNumber: sanitizeWhatsAppNumber(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER
  ),
  contactPhone: DEFAULT_PHONE_NUMBER,
  contactEmail: "ventas@matacosdeportes.com",
  storeAddress: "Saavedra 241",
  storeCity: "Formosa Capital",
  businessHours: "Lunes a Sábado: 8:00 - 12:30 / 17:00 - 21:00",
};

let cachedSettings: ClientStoreSettings | null = null;
let pendingRequest: Promise<ClientStoreSettings> | null = null;
const listeners = new Set<(settings: ClientStoreSettings) => void>();

function normalizeSettings(data: StoreSettingsOutput): ClientStoreSettings {
  return {
    storeName: data.storeName || DEFAULT_CLIENT_SETTINGS.storeName,
    whatsappNumber: sanitizeWhatsAppNumber(
      data.whatsappNumber || DEFAULT_CLIENT_SETTINGS.whatsappNumber
    ),
    contactPhone: data.contactPhone || DEFAULT_CLIENT_SETTINGS.contactPhone,
    contactEmail: data.contactEmail || DEFAULT_CLIENT_SETTINGS.contactEmail,
    storeAddress: data.storeAddress || DEFAULT_CLIENT_SETTINGS.storeAddress,
    storeCity: data.storeCity || DEFAULT_CLIENT_SETTINGS.storeCity,
    businessHours: data.businessHours || DEFAULT_CLIENT_SETTINGS.businessHours,
  };
}

function fetchStoreSettingsOnce(force = false): Promise<ClientStoreSettings> {
  if (cachedSettings && !force) {
    return Promise.resolve(cachedSettings);
  }
  if (!pendingRequest || force) {
    pendingRequest = getStoreSettings()
      .then((res) => {
        const next =
          res.success && res.data
            ? normalizeSettings(res.data)
            : DEFAULT_CLIENT_SETTINGS;
        cachedSettings = next;
        listeners.forEach((fn) => fn(next));
        return next;
      })
      .catch(() => cachedSettings ?? DEFAULT_CLIENT_SETTINGS)
      .finally(() => {
        pendingRequest = null;
      });
  }
  return pendingRequest;
}

/**
 * Actualiza el caché en memoria cuando se guarda una nueva configuración en /admin.
 */
export function broadcastStoreSettingsUpdate(data: StoreSettingsOutput): void {
  const next = normalizeSettings(data);
  cachedSettings = next;
  listeners.forEach((fn) => fn(next));
}

/**
 * Hook compartido para leer la configuración comercial dinámica desde PostgreSQL (StoreSettings)
 * con una única consulta en caché por sesión de navegador y sincronización ante cambios en /admin.
 */
export function useStoreSettings(): ClientStoreSettings {
  const [settings, setSettings] = useState<ClientStoreSettings>(
    () => cachedSettings ?? DEFAULT_CLIENT_SETTINGS
  );

  useEffect(() => {
    listeners.add(setSettings);
    void fetchStoreSettingsOnce().then((next) => {
      setSettings(next);
    });

    const handleSettingsUpdated = () => {
      void fetchStoreSettingsOnce(true).then((next) => {
        setSettings(next);
      });
    };
    window.addEventListener("store-settings-updated", handleSettingsUpdated);

    return () => {
      listeners.delete(setSettings);
      window.removeEventListener("store-settings-updated", handleSettingsUpdated);
    };
  }, []);

  return settings;
}
