"use client";

import React from "react";
import {
  Store,
  Bike,
  Truck,
  Building2,
  CheckCircle2,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import type { ShippingMethod } from "@/schemas/ecommerce";
import { formatCurrency } from "@/lib/utils";
import { PostalCodeShippingCalculator } from "./PostalCodeShippingCalculator";
import type { ShippingRateOption } from "@/schemas/shipping";

export interface ShippingAddressFields {
  street: string;
  number: string;
  floorApartment?: string;
  crossStreets: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface ShippingMethodSelectorProps {
  selectedMethod: ShippingMethod;
  onSelectMethod: (method: ShippingMethod, cost: number) => void;
  shippingCosts: Record<ShippingMethod, number>;
  cartItems?: Array<{ variantId: string; quantity: number }>;
  address: ShippingAddressFields;
  onAddressChange: (fields: Partial<ShippingAddressFields>) => void;
  errors?: Record<string, string>;
  className?: string;
}

export function ShippingMethodSelector({
  selectedMethod,
  onSelectMethod,
  shippingCosts,
  cartItems = [],
  address,
  onAddressChange,
  errors = {},
  className = "",
}: ShippingMethodSelectorProps) {
  const isDeliveryToHome =
    selectedMethod === "CADETERIA_FORMOSA" ||
    selectedMethod === "CORREO_ARGENTINO" ||
    selectedMethod === "CORREO_ARGENTINO_DOMICILIO";

  const isFormosaCity = address.postalCode.replace(/\D/g, "") === "3600";

  const handleCalculatorOptionSelect = (opt: ShippingRateOption) => {
    onSelectMethod(opt.method as ShippingMethod, opt.price);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Header de Sección */}
      <div className="space-y-1">
        <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#00A811]" />
          <span>Opciones de Entrega y Envío</span>
        </h3>
        <p className="text-xs text-slate-500">
          Seleccioná cómo querés recibir o retirar tu compra.
        </p>
      </div>

      {/* 2. Radio Cards de Opciones de Envío (Subtarea 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Opción 1: Retiro en Saavedra 241 (GRATIS) */}
        <div
          onClick={() => onSelectMethod("RETIRO_LOCAL", 0)}
          className={`relative p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedMethod === "RETIRO_LOCAL"
              ? "bg-emerald-50/40 border-[#00A811] shadow-xs ring-2 ring-[#00A811]/40"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                GRATIS EN TIENDA
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Retiro en Saavedra 241
              </h4>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Saavedra 241, Formosa Capital (CP 3600)
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <Clock className="w-3.5 h-3.5 text-[#00A811]" />
                <span>Lun a Sáb 8:00–12:30 / 17:00–21:00 hs</span>
              </div>
            </div>

            {/* Instrucción de DNI */}
            <div className="p-2.5 rounded-xl bg-emerald-950/5 text-[11px] text-emerald-950 border border-emerald-900/10 space-y-0.5">
              <span className="font-bold block">Requisitos para el retiro:</span>
              <p className="text-slate-600">
                Presentar DNI del titular o persona autorizada y el código #WEB-XXXX recibido por email o WhatsApp.
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Costo de preparación:</span>
            <span className="text-sm font-black text-[#00A811]">GRATIS</span>
          </div>
        </div>

        {/* Opción 2: Cadetería Local Formosa Capital (CP 3600) */}
        <div
          onClick={() =>
            onSelectMethod("CADETERIA_FORMOSA", shippingCosts.CADETERIA_FORMOSA || 2500)
          }
          className={`relative p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedMethod === "CADETERIA_FORMOSA"
              ? "bg-blue-50/40 border-blue-600 shadow-xs ring-2 ring-blue-600/40"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                EN EL DÍA / 24 HS
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Cadetería en Moto (Formosa)
              </h4>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Entrega puerta a puerta en radio urbano de Formosa Capital.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Tarifa plana para CP 3600</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/5 text-[11px] text-blue-950 border border-blue-900/10">
              <span className="text-slate-600">
                Te contactamos por WhatsApp para coordinar la franja horaria exacta de entrega.
              </span>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Tarifa plana local:</span>
            <span className="text-sm font-black text-slate-900">
              {formatCurrency(shippingCosts.CADETERIA_FORMOSA || 2500)}
            </span>
          </div>
        </div>

        {/* Opción 3: Correo Argentino a Domicilio */}
        <div
          onClick={() =>
            onSelectMethod(
              "CORREO_ARGENTINO_DOMICILIO",
              shippingCosts.CORREO_ARGENTINO_DOMICILIO || 7900
            )
          }
          className={`relative p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedMethod === "CORREO_ARGENTINO_DOMICILIO" ||
            selectedMethod === "CORREO_ARGENTINO"
              ? "bg-amber-50/40 border-amber-500 shadow-xs ring-2 ring-amber-500/40"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                A TODO EL PAÍS
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Correo Argentino a Domicilio
              </h4>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Despacho oficial con entrega en mano en cualquier localidad argentina.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>3 a 6 días hábiles con código de seguimiento</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Costo estimado:</span>
            <span className="text-sm font-black text-slate-900">
              {formatCurrency(shippingCosts.CORREO_ARGENTINO_DOMICILIO || 7900)}
            </span>
          </div>
        </div>

        {/* Opción 4: Correo Argentino a Sucursal */}
        <div
          onClick={() =>
            onSelectMethod(
              "CORREO_ARGENTINO_SUCURSAL",
              shippingCosts.CORREO_ARGENTINO_SUCURSAL || 5800
            )
          }
          className={`relative p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedMethod === "CORREO_ARGENTINO_SUCURSAL"
              ? "bg-purple-50/40 border-purple-600 shadow-xs ring-2 ring-purple-600/40"
              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                TARIFA REDUCIDA
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Retiro en Sucursal Correo
              </h4>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Retirá en la sucursal más cercana de Correo Argentino.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>3 a 5 días hábiles</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Tarifa en sucursal:</span>
            <span className="text-sm font-black text-slate-900">
              {formatCurrency(shippingCosts.CORREO_ARGENTINO_SUCURSAL || 5800)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Calculador en vivo de Código Postal (Subtarea 2) */}
      <PostalCodeShippingCalculator
        initialPostalCode={address.postalCode}
        cartItems={cartItems}
        selectedMethod={selectedMethod}
        onSelectOption={handleCalculatorOptionSelect}
        onShippingCalculated={(res) => {
          if (res.postalCode) {
            onAddressChange({ postalCode: res.postalCode });
          }
        }}
      />

      {/* 4. Formulario Condicional de Domicilio de Entrega (Subtarea 5) */}
      {isDeliveryToHome && (
        <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white space-y-4 animate-in fade-in">
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00A811]" />
              <span>Dirección de Entrega a Domicilio</span>
            </h4>
            <p className="text-xs text-slate-500">
              Ingresá los datos exactos del destino para asegurar una entrega exitosa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Calle */}
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Calle *
              </label>
              <input
                type="text"
                value={address.street}
                onChange={(e) => onAddressChange({ street: e.target.value })}
                placeholder="Ej: Av. 25 de Mayo, Fontana, Saavedra..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors ${
                  errors.street
                    ? "border-red-500 bg-red-50/30 focus:border-red-600"
                    : "border-slate-300 focus:border-slate-950"
                }`}
              />
              {errors.street && (
                <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                  {errors.street}
                </span>
              )}
            </div>

            {/* Altura / Número */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Altura / Número *
              </label>
              <input
                type="text"
                value={address.number}
                onChange={(e) => onAddressChange({ number: e.target.value })}
                placeholder="Ej: 241"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors ${
                  errors.number
                    ? "border-red-500 bg-red-50/30 focus:border-red-600"
                    : "border-slate-300 focus:border-slate-950"
                }`}
              />
              {errors.number && (
                <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                  {errors.number}
                </span>
              )}
            </div>

            {/* Piso / Depto */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Piso / Depto <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={address.floorApartment || ""}
                onChange={(e) => onAddressChange({ floorApartment: e.target.value })}
                placeholder="Ej: 4to B"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-slate-950 transition-colors"
              />
            </div>

            {/* Entrecalles */}
            <div className="sm:col-span-8">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Entrecalles o Referencias *
              </label>
              <input
                type="text"
                value={address.crossStreets}
                onChange={(e) => onAddressChange({ crossStreets: e.target.value })}
                placeholder="Ej: Entre Moreno y Rivadavia / Portón negro"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors ${
                  errors.crossStreets
                    ? "border-red-500 bg-red-50/30 focus:border-red-600"
                    : "border-slate-300 focus:border-slate-950"
                }`}
              />
              {errors.crossStreets && (
                <span className="text-[11px] text-red-600 font-semibold mt-1 block">
                  {errors.crossStreets}
                </span>
              )}
            </div>

            {/* Ciudad / Localidad */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ciudad / Localidad *
              </label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => onAddressChange({ city: e.target.value })}
                placeholder="Ej: Formosa Capital"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-slate-950 transition-colors"
              />
            </div>

            {/* Provincia */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Provincia *
              </label>
              <input
                type="text"
                value={address.province}
                onChange={(e) => onAddressChange({ province: e.target.value })}
                placeholder="Ej: Formosa"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-slate-950 transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
