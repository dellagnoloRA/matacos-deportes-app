"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Truck,
  Store,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  Building2,
  Banknote,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createGuestOrder } from "@/server/actions/ecommerce/checkoutActions";
import { createMercadoPagoPreference } from "@/server/actions/ecommerce/mercadopagoActions";
import { ShippingMethod } from "@/schemas/ecommerce";

interface CheckoutVariant {
  id: string;
  name: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

interface CheckoutClientProps {
  availableVariants: CheckoutVariant[];
}

export function CheckoutClient({ availableVariants }: CheckoutClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ítems en el checkout (por defecto precarga el primer producto activo con stock)
  const [selectedItems, setSelectedItems] = useState<
    Array<{ variant: CheckoutVariant; quantity: number }>
  >(() => {
    if (availableVariants.length > 0) {
      return [{ variant: availableVariants[0], quantity: 1 }];
    }
    return [];
  });

  // Datos del comprador
  const [customerName, setCustomerName] = useState("Nahir Agustín Fornari");
  const [customerDni, setCustomerDni] = useState("38.123.456");
  const [customerEmail, setCustomerEmail] = useState("nahir@test.com");
  const [customerPhone, setCustomerPhone] = useState("3704556677");

  // Método de entrega
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("RETIRO_LOCAL");
  const [shippingAddress, setShippingAddress] = useState("Saavedra 241");
  const [shippingCity, setShippingCity] = useState("Formosa Capital");
  const [shippingPostalCode, setShippingPostalCode] = useState("3600");

  // Método de pago
  const [paymentOption, setPaymentOption] = useState<
    "MERCADOPAGO" | "TRANSFERENCIA" | "EFECTIVO"
  >("MERCADOPAGO");

  // Cálculo de totales
  const subtotalProducts = selectedItems.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0
  );

  const FREE_SHIPPING_THRESHOLD = 100000;
  const isFreeShipping = subtotalProducts >= FREE_SHIPPING_THRESHOLD;

  let baseShippingCost = 0;
  if (shippingMethod === "CADETERIA_FORMOSA") baseShippingCost = 2500;
  if (shippingMethod === "CORREO_ARGENTINO") baseShippingCost = 7500;

  const effectiveShippingCost =
    shippingMethod === "RETIRO_LOCAL" || isFreeShipping ? 0 : baseShippingCost;
  const totalAmount = subtotalProducts + effectiveShippingCost;

  // Manejador del submit de compra
  const handleProceedToPayment = () => {
    setErrorMessage(null);

    if (selectedItems.length === 0) {
      setErrorMessage("No hay productos seleccionados para comprar.");
      return;
    }

    if (!customerName || !customerDni || !customerEmail || !customerPhone) {
      setErrorMessage("Por favor completá todos los datos de contacto.");
      return;
    }

    if (
      shippingMethod !== "RETIRO_LOCAL" &&
      (!shippingAddress || !shippingCity)
    ) {
      setErrorMessage("Por favor indicá tu dirección de entrega y localidad.");
      return;
    }

    startTransition(async () => {
      try {
        // 1. Crear la orden web en estado PENDIENTE_PAGO
        const orderRes = await createGuestOrder({
          customerName,
          customerDni,
          customerEmail,
          customerPhone,
          shippingMethod,
          shippingAddress:
            shippingMethod === "RETIRO_LOCAL" ? "Saavedra 241" : shippingAddress,
          shippingCity:
            shippingMethod === "RETIRO_LOCAL" ? "Formosa" : shippingCity,
          shippingPostalCode: shippingPostalCode || "3600",
          items: selectedItems.map((item) => ({
            variantId: item.variant.id,
            quantity: item.quantity,
          })),
        });

        if (!orderRes.success || !orderRes.data) {
          setErrorMessage(orderRes.error || "No se pudo generar la orden.");
          return;
        }

        const saleId = orderRes.data.saleId;

        // 2. Si eligió Mercado Pago, generar la preferencia y redirigir
        if (paymentOption === "MERCADOPAGO") {
          const prefRes = await createMercadoPagoPreference(saleId);

          if (!prefRes.success || !prefRes.data) {
            setErrorMessage(
              prefRes.error || "Error al conectar con la pasarela de Mercado Pago."
            );
            return;
          }

          const redirectUrl =
            prefRes.data.sandboxInitPoint || prefRes.data.initPoint;

          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          } else {
            setErrorMessage("No se obtuvo la URL de pago de Mercado Pago.");
            return;
          }
        }

        // Si eligió efectivo o transferencia (simulado en esta etapa)
        router.push(
          `/checkout/resultado?orderCode=${orderRes.data.orderCode}&status=pending`
        );
      } catch (err: any) {
        console.error("Error al procesar checkout:", err);
        setErrorMessage(err.message || "Ocurrió un error inesperado.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header simple */}
      <header className="bg-slate-950 text-white border-b border-slate-800 py-4 px-6 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la tienda</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-wider text-white">
              MATACOS
            </span>
            <span className="text-[#00D615] font-black text-lg tracking-wider">
              DEPORTES
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#00D615]" />
            <span>Compra 100% Segura</span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Finalizar Compra
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Completá tus datos para coordinar la entrega y proceder al pago seguro.
        </p>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-bold">No pudimos procesar la orden:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda: Formulario (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Bloque 1: Contacto */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center text-xs font-black">
                  1
                </span>
                Datos del Comprador (Guest Checkout)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    DNI / CUIT
                  </label>
                  <input
                    type="text"
                    value={customerDni}
                    onChange={(e) => setCustomerDni(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                    placeholder="38.123.456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                    placeholder="juan@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                    placeholder="3704 556677"
                  />
                </div>
              </div>
            </div>

            {/* Bloque 2: Entrega */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center text-xs font-black">
                  2
                </span>
                Forma de Entrega
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* Opción Retiro */}
                <button
                  type="button"
                  onClick={() => setShippingMethod("RETIRO_LOCAL")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    shippingMethod === "RETIRO_LOCAL"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Retiro Local
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Saavedra 241</span>
                  <span className="text-xs font-black text-[#00A811] mt-1">
                    GRATIS
                  </span>
                </button>

                {/* Opción Cadetería */}
                <button
                  type="button"
                  onClick={() => setShippingMethod("CADETERIA_FORMOSA")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    shippingMethod === "CADETERIA_FORMOSA"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Cadetería
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Formosa Capital</span>
                  <span className="text-xs font-black text-slate-900 mt-1">
                    {isFreeShipping ? "¡GRATIS!" : "$ 2.500,00"}
                  </span>
                </button>

                {/* Opción Correo */}
                <button
                  type="button"
                  onClick={() => setShippingMethod("CORREO_ARGENTINO")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    shippingMethod === "CORREO_ARGENTINO"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      Correo Arg.
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">Nacional</span>
                  <span className="text-xs font-black text-slate-900 mt-1">
                    {isFreeShipping ? "¡GRATIS!" : "$ 7.500,00"}
                  </span>
                </button>
              </div>

              {shippingMethod !== "RETIRO_LOCAL" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Dirección (Calle y Número)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                      placeholder="Av. 25 de Mayo 450"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      C. Postal
                    </label>
                    <input
                      type="text"
                      value={shippingPostalCode}
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D615]"
                      placeholder="3600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bloque 3: Medio de Pago */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center text-xs font-black">
                  3
                </span>
                Medio de Pago
              </h2>

              <div className="space-y-3">
                {/* Opción Mercado Pago */}
                <label
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentOption === "MERCADOPAGO"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === "MERCADOPAGO"}
                      onChange={() => setPaymentOption("MERCADOPAGO")}
                      className="w-4 h-4 text-[#00D615] focus:ring-[#00D615]"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Mercado Pago Checkout Pro
                        <span className="text-[10px] font-black uppercase tracking-wider bg-[#00D615] text-slate-950 px-2 py-0.5 rounded-full">
                          Oficial
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Tarjetas de crédito (cuotas), débito o dinero en cuenta.
                      </p>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </label>

                {/* Opción Transferencia */}
                <label
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    paymentOption === "TRANSFERENCIA"
                      ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentOption === "TRANSFERENCIA"}
                      onChange={() => setPaymentOption("TRANSFERENCIA")}
                      className="w-4 h-4 text-[#00D615] focus:ring-[#00D615]"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Transferencia Bancaria Directa
                        <span className="text-[10px] font-semibold text-slate-500">
                          (RF-17)
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Pago a CBU/Alias y carga de comprobante.
                      </p>
                    </div>
                  </div>
                  <Building2 className="w-5 h-5 text-slate-400" />
                </label>

                {/* Opción Efectivo */}
                {shippingMethod === "RETIRO_LOCAL" && (
                  <label
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentOption === "EFECTIVO"
                        ? "border-[#00D615] bg-[#00D615]/5 ring-2 ring-[#00D615]"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentOption"
                        checked={paymentOption === "EFECTIVO"}
                        onChange={() => setPaymentOption("EFECTIVO")}
                        className="w-4 h-4 text-[#00D615] focus:ring-[#00D615]"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Efectivo al Retirar en Mostrador
                        </p>
                        <p className="text-xs text-slate-500">
                          Abonás al momento de retirar en Saavedra 241.
                        </p>
                      </div>
                    </div>
                    <Banknote className="w-5 h-5 text-slate-400" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Resumen de Compra (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-24 space-y-5">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Resumen de Compra
              </h2>

              {/* Lista de productos */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {selectedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-2 border-b border-slate-50"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {item.variant.name}
                      </p>
                      <p className="text-slate-500">
                        Talle {item.variant.size} • {item.variant.color} • x
                        {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.variant.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Banner Envío Gratis */}
              {isFreeShipping ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Tu compra califica para Envío Gratis!</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  Agregá{" "}
                  <strong className="text-slate-900">
                    {formatCurrency(FREE_SHIPPING_THRESHOLD - subtotalProducts)}
                  </strong>{" "}
                  más para obtener envío gratis general.
                </div>
              )}

              {/* Totales */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos:</span>
                  <span>{formatCurrency(subtotalProducts)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Costo de envío:</span>
                  <span
                    className={
                      effectiveShippingCost === 0 ? "text-[#00A811] font-bold" : ""
                    }
                  >
                    {effectiveShippingCost === 0
                      ? "GRATIS"
                      : formatCurrency(effectiveShippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-100">
                  <span>Total Final:</span>
                  <span className="text-base text-slate-950">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Botón de acción */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={isPending || selectedItems.length === 0}
                className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : paymentOption === "MERCADOPAGO" ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar con Mercado Pago</span>
                  </>
                ) : (
                  <span>Confirmar Pedido</span>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Al confirmar tu compra, el inventario quedará reservado por 15
                minutos mientras completás el pago.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
