"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  Package,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  User,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  CreditCard,
  Landmark,
  Store,
  Lock,
  Sparkles,
  XCircle,
  Mail,
  Phone,
  Home,
  Building2,
  ChevronRight,
  ChevronLeft,
  Pencil,
} from "lucide-react";
import { EcommerceHeader } from "@/components/ecommerce/EcommerceHeader";
import { EcommerceFooter } from "@/components/ecommerce/EcommerceFooter";
import {
  validateCartItems,
  createGuestOrder,
  cancelGuestOrder,
  getWebOrderForCheckoutPayment,
  processWebOrderPayment,
  type CartValidationResult,
  type GuestOrderCreatedResult,
  type WebOrderPaymentResult,
} from "@/server/actions/ecommerce/checkoutActions";
import { createMercadoPagoPreference } from "@/server/actions/ecommerce/mercadopagoActions";
import {
  calculateShippingCostAction,
  getAgenciesAction,
} from "@/server/actions/ecommerce/shippingActions";
import type { CorreoArgentinoAgency } from "@/schemas/shipping";
import type { CustomerProfileDTO } from "@/server/actions/ecommerce/customerActions";
import type {
  ShippingMethod,
  WebPaymentOption,
  WebCardBrand,
} from "@/schemas/ecommerce";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useCustomerStore } from "@/store/customerStore";

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

const ACTIVE_CHECKOUT_SESSION_KEY = "matacos-active-checkout-order";

interface StoredCheckoutSession {
  orderCode: string;
  verification: string;
}

interface CheckoutViewProps {
  initialCustomer: CustomerProfileDTO | null;
  initialOrderCode?: string;
  initialVerification?: string;
}

const SHIPPING_OPTIONS: Array<{
  method: ShippingMethod;
  title: string;
  subtitle: string;
  cost: number;
  badge?: string;
}> = [
  {
    method: "RETIRO_LOCAL",
    title: "Retiro gratis en el local",
    subtitle: "Saavedra 241, Formosa Capital • Listo para retirar en el día",
    cost: 0,
    badge: "SIN CARGO",
  },
  {
    method: "CADETERIA_FORMOSA",
    title: "Cadetería en Moto (Formosa Capital)",
    subtitle: "Entrega rápida a domicilio dentro de Formosa Capital (CP 3600)",
    cost: 2500,
  },
  {
    method: "CORREO_ARGENTINO_SUCURSAL",
    title: "Retiro en Sucursal Correo Argentino",
    subtitle: "Retirá en la sucursal oficial más cercana a tu domicilio (30% a 40% de ahorro)",
    cost: 5800,
  },
  {
    method: "CORREO_ARGENTINO_DOMICILIO",
    title: "Envío a Domicilio por Correo Argentino",
    subtitle: "Entrega puerta a puerta en cualquier punto del territorio nacional",
    cost: 7900,
  },
];

const ARGENTINE_PROVINCES = [
  "Formosa",
  "Chaco",
  "Corrientes",
  "Misiones",
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires (CABA)",
  "Santa Fe",
  "Córdoba",
  "Entre Ríos",
  "Mendoza",
  "Tucumán",
  "Salta",
  "Jujuy",
  "Santiago del Estero",
  "San Juan",
  "San Luis",
  "La Rioja",
  "Catamarca",
  "La Pampa",
  "Neuquén",
  "Río Negro",
  "Chubut",
  "Santa Cruz",
  "Tierra del Fuego",
];

const CARD_BRANDS: Array<{ id: WebCardBrand; label: string }> = [
  { id: "VISA", label: "Visa" },
  { id: "MASTERCARD", label: "Mastercard" },
  { id: "NARANJA_X", label: "Naranja X" },
  { id: "CABAL", label: "Cabal" },
];

const CREDIT_INSTALLMENTS = [
  { count: 1, label: "1 pago sin interés" },
  { count: 3, label: "3 cuotas sin interés" },
  { count: 6, label: "6 cuotas sin interés" },
];

function formatCardNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
}

function formatCardExpiryInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCountdown(secondsRemaining: number): string {
  const safe = Math.max(0, secondsRemaining);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function CheckoutView({
  initialCustomer,
  initialOrderCode,
  initialVerification,
}: CheckoutViewProps) {
  const {
    items,
    hasHydrated,
    updateQuantity,
    removeItem,
    syncValidatedItems,
    clearCart,
  } = useCartStore();
  const { customer: storeCustomer, setCustomer } = useCustomerStore();

  const activeCustomer = storeCustomer ?? initialCustomer;

  useEffect(() => {
    if (initialCustomer && !storeCustomer) {
      setCustomer(initialCustomer);
    }
  }, [initialCustomer, storeCustomer, setCustomer]);

  // =========================================================================
  // CONTROL DEL WIZARD SECUENCIAL (PASOS 1, 2, 3, 4)
  // 1: Contacto | 2: Dirección | 3: Entrega | 4: Pago
  // =========================================================================
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Paso 1: Datos de Contacto
  const initialNameParts = (activeCustomer?.name ?? "").trim().split(" ");
  const [customerFirstName, setCustomerFirstName] = useState(
    initialNameParts[0] ?? ""
  );
  const [customerLastName, setCustomerLastName] = useState(
    initialNameParts.slice(1).join(" ") ?? ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    activeCustomer?.email ?? ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    activeCustomer?.phone ?? ""
  );
  const [customerDni, setCustomerDni] = useState(activeCustomer?.dni ?? "");

  // Paso 2: Dirección y Ubicación
  const [shippingStreet, setShippingStreet] = useState(
    activeCustomer?.defaultAddress ?? ""
  );
  const [shippingNumber, setShippingNumber] = useState("");
  const [shippingFloorDept, setShippingFloorDept] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState(
    activeCustomer?.defaultPostalCode ?? "3600"
  );
  const [shippingProvince, setShippingProvince] = useState("Formosa");
  const [shippingCity, setShippingCity] = useState(
    activeCustomer?.defaultCity ?? "Formosa"
  );

  // Paso 3: Método de Entrega
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("RETIRO_LOCAL");
  const [shippingBranchCode, setShippingBranchCode] = useState("");
  const [shippingBranchName, setShippingBranchName] = useState("");
  const [agencies, setAgencies] = useState<CorreoArgentinoAgency[]>([]);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
  const [shippingOptions, setShippingOptions] = useState(SHIPPING_OPTIONS);
  const [isQuotingShipping, setIsQuotingShipping] = useState(false);
  const [notes, setNotes] = useState("");

  const customerName = `${customerFirstName.trim()} ${customerLastName.trim()}`.trim();
  const shippingAddress = `${shippingStreet.trim()} ${shippingNumber.trim()}${
    shippingFloorDept.trim() ? `, ${shippingFloorDept.trim()}` : ""
  }`.trim();

  // Cotización dinámica de envío al modificar código postal o artículos del carrito (RF-19)
  useEffect(() => {
    const cleanCP = shippingPostalCode.replace(/\D/g, "");
    if (cleanCP.length >= 4 && items.length > 0) {
      let isCancelled = false;
      setIsQuotingShipping(true);

      calculateShippingCostAction({
        postalCode: cleanCP,
        method: shippingMethod,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        agencyCode: shippingBranchCode || undefined,
      }).then((res) => {
        if (isCancelled) return;
        setIsQuotingShipping(false);
        if (res.success && res.options.length > 0) {
          setShippingOptions((prev) =>
            prev.map((opt) => {
              const matched = res.options.find(
                (o) =>
                  o.method === opt.method ||
                  (opt.method === "CORREO_ARGENTINO" && o.method === "CORREO_ARGENTINO_DOMICILIO")
              );
              if (matched) {
                return {
                  ...opt,
                  cost: matched.price,
                  subtitle: matched.deliveryEstimateText || opt.subtitle,
                };
              }
              return opt;
            })
          );
        }
      });

      return () => {
        isCancelled = true;
      };
    }
  }, [shippingPostalCode, items, shippingMethod, shippingBranchCode]);

  // Consulta de sucursales cuando se selecciona Retiro en Sucursal Correo Argentino
  useEffect(() => {
    if (shippingMethod === "CORREO_ARGENTINO_SUCURSAL") {
      const cleanCP = shippingPostalCode.replace(/\D/g, "") || "3600";
      setIsLoadingAgencies(true);
      getAgenciesAction(undefined, cleanCP).then((res) => {
        setIsLoadingAgencies(false);
        if (res.success && res.agencies.length > 0) {
          setAgencies(res.agencies);
          const currentValid = res.agencies.some((a) => a.code === shippingBranchCode);
          if (!currentValid || !shippingBranchCode) {
            setShippingBranchCode(res.agencies[0]!.code);
            setShippingBranchName(
              `${res.agencies[0]!.name} (${res.agencies[0]!.address.streetName} ${res.agencies[0]!.address.streetNumber})`
            );
          }
        } else {
          setAgencies([]);
          setShippingBranchCode("");
          setShippingBranchName("");
        }
      });
    }
  }, [shippingMethod, shippingPostalCode]);

  useEffect(() => {
    if (!activeCustomer) return;
    const parts = (activeCustomer.name || "").trim().split(" ");
    setCustomerFirstName((prev) => prev || parts[0] || "");
    setCustomerLastName((prev) => prev || parts.slice(1).join(" ") || "");
    setCustomerDni((prev) => prev || activeCustomer.dni || "");
    setCustomerEmail((prev) => prev || activeCustomer.email || "");
    setCustomerPhone((prev) => prev || activeCustomer.phone || "");
    if (activeCustomer.defaultAddress) {
      setShippingStreet((prev) => prev || activeCustomer.defaultAddress || "");
    }
    if (activeCustomer.defaultCity) {
      setShippingCity((prev) =>
        prev === "Formosa" && activeCustomer.defaultCity
          ? activeCustomer.defaultCity
          : prev
      );
    }
    if (activeCustomer.defaultPostalCode) {
      setShippingPostalCode((prev) =>
        prev === "3600" && activeCustomer.defaultPostalCode
          ? activeCustomer.defaultPostalCode
          : prev
      );
    }
  }, [activeCustomer]);

  // Carga asíncrona no bloqueante del SDK oficial de Mercado Pago v2 para tokenización de tarjetas
  useEffect(() => {
    if (typeof window === "undefined" || window.MercadoPago) return;
    const mpKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    if (!mpKey) return;

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Validación de stock y precios en vivo (Paso 1)
  const [validation, setValidation] = useState<CartValidationResult | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);
  const [priceChangeBanner, setPriceChangeBanner] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // =========================================================================
  // ESTADO DE RESERVA ACTIVA (PASO 2) Y RESULTADO DE PAGO (PASO 3)
  // =========================================================================
  const [isResumingOrder, setIsResumingOrder] = useState(
    Boolean(initialOrderCode && initialVerification)
  );
  const [isSubmittingReservation, startReservationTransition] = useTransition();
  const [isProcessingPayment, startPaymentTransition] = useTransition();
  const [isCancellingOrder, startCancelTransition] = useTransition();

  const [createdOrder, setCreatedOrder] =
    useState<GuestOrderCreatedResult | null>(null);
  const [paymentResult, setPaymentResult] =
    useState<WebOrderPaymentResult | null>(null);

  // Campos del Paso 2: Selección y Ejecución de Pago
  const [paymentOption, setPaymentOption] =
    useState<WebPaymentOption>("MERCADOPAGO");
  const [cardBrand, setCardBrand] = useState<WebCardBrand>("VISA");
  const [installments, setInstallments] = useState<number>(3);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [transferReference, setTransferReference] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Countdown en vivo de la reserva (en segundos)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = async (text: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldKey ? null : prev));
      }, 2200);
    } catch {
      // Fallback silencioso
    }
  };

  // =========================================================================
  // RECUPERAR ORDEN PENDIENTE POR URL (?orden=...&verificacion=...) O REFRESH
  // =========================================================================
  useEffect(() => {
    if (!hasHydrated) return;

    let targetCode = initialOrderCode?.trim();
    let targetVerif = initialVerification?.trim();

    // Si no viene por URL y el carrito está vacío (ej: refresh en Paso 2), buscar en sessionStorage
    if (!targetCode && items.length === 0 && !createdOrder) {
      try {
        const raw = window.sessionStorage.getItem(ACTIVE_CHECKOUT_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredCheckoutSession;
          if (parsed.orderCode && parsed.verification) {
            targetCode = parsed.orderCode;
            targetVerif = parsed.verification;
          }
        }
      } catch {
        // Ignorar errores de sessionStorage
      }
    }

    if (!targetCode || !targetVerif) {
      setIsResumingOrder(false);
      return;
    }

    let cancelled = false;
    setIsResumingOrder(true);

    void (async () => {
      const res = await getWebOrderForCheckoutPayment(targetCode!, targetVerif!);
      if (cancelled) return;

      if (res.success && res.data) {
        setCreatedOrder(res.data.order);
        setCardHolderName(res.data.order.customer.name.toUpperCase());
        if (res.data.completedPayment) {
          setPaymentResult(res.data.completedPayment);
          try {
            window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
          } catch {
            // Ignorar
          }
        }
      } else {
        try {
          window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
        } catch {
          // Ignorar
        }
        if (initialOrderCode && res.error) {
          setFormError(res.error);
        }
      }
      setIsResumingOrder(false);
    })();

    return () => {
      cancelled = true;
    };
    // Solo ejecutar al hidratar o si cambian los query params iniciales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, initialOrderCode, initialVerification]);

  // =========================================================================
  // COUNTDOWN EN VIVO DE LOS 15 MINUTOS DE RESERVA
  // =========================================================================
  useEffect(() => {
    if (!createdOrder || paymentResult?.status === "COMPLETADA") {
      setSecondsLeft(null);
      return;
    }

    const updateTimer = () => {
      const expiresMs = new Date(createdOrder.reservation.expiresAt).getTime();
      const diffSeconds = Math.max(
        0,
        Math.floor((expiresMs - Date.now()) / 1000)
      );
      setSecondsLeft(diffSeconds);
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [createdOrder, paymentResult]);

  // Ajustar opción de pago si el pedido no es RETIRO_LOCAL y estaba en PAGO_LOCAL
  useEffect(() => {
    if (
      createdOrder &&
      createdOrder.shipping.method !== "RETIRO_LOCAL" &&
      paymentOption === "PAGO_LOCAL"
    ) {
      setPaymentOption("TARJETA_CREDITO");
    }
  }, [createdOrder, paymentOption]);

  // =========================================================================
  // VALIDACIÓN DE CARRITO EN VIVO (PASO 1)
  // =========================================================================
  const runLiveValidation = useCallback(async () => {
    if (!hasHydrated || items.length === 0 || createdOrder) {
      setValidation(null);
      return;
    }

    setIsValidating(true);
    try {
      const res = await validateCartItems(
        items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          expectedUnitPrice: i.price,
        }))
      );

      if (res.success && res.data) {
        setValidation(res.data);
        if (res.data.hasPriceChanges) {
          setPriceChangeBanner(true);
          syncValidatedItems(res.data.items);
        }
      } else if (res.error) {
        setFormError(res.error);
      }
    } catch (err) {
      console.error("Error validando carrito en vivo:", err);
    } finally {
      setIsValidating(false);
    }
  }, [hasHydrated, items, createdOrder, syncValidatedItems]);

  useEffect(() => {
    void runLiveValidation();
  }, [runLiveValidation]);

  const selectedShippingOption =
    shippingOptions.find((opt) => opt.method === shippingMethod) ??
    shippingOptions[0]!;

  const subtotalProducts = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const totalSavings = items.reduce((acc, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return acc + (item.originalPrice - item.price) * item.quantity;
    }
    return acc;
  }, 0);
  const shippingCost = selectedShippingOption.cost;
  const totalOrder = subtotalProducts + shippingCost;

  const requiresAddress =
    shippingMethod === "CADETERIA_FORMOSA" ||
    shippingMethod === "CORREO_ARGENTINO" ||
    shippingMethod === "CORREO_ARGENTINO_DOMICILIO";

  // =========================================================================
  // NAVEGACIÓN Y VALIDACIÓN SECUENCIAL ENTRE PASOS DEL WIZARD
  // =========================================================================
  const handleProceedToStep2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail.trim())) {
      setFormError("Por favor ingresá un correo electrónico válido para recibir el comprobante.");
      return;
    }
    if (customerFirstName.trim().length < 2) {
      setFormError("Por favor ingresá tu nombre (mínimo 2 letras).");
      return;
    }
    if (customerLastName.trim().length < 2) {
      setFormError("Por favor ingresá tu apellido (mínimo 2 letras).");
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 6) {
      setFormError("Por favor ingresá un número de teléfono o WhatsApp de contacto válido.");
      return;
    }
    const cleanDni = customerDni.replace(/\D/g, "");
    if (cleanDni.length < 7 || cleanDni.length > 11) {
      setFormError("Por favor ingresá un DNI o CUIT válido (entre 7 y 11 números).");
      return;
    }

    setWizardStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProceedToStep3 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (shippingStreet.trim().length < 2) {
      setFormError("Por favor ingresá el nombre de la calle.");
      return;
    }
    if (shippingNumber.trim().length < 1) {
      setFormError("Por favor ingresá la altura o número de calle.");
      return;
    }
    const cleanCP = shippingPostalCode.replace(/\D/g, "");
    if (cleanCP.length < 4) {
      setFormError("Por favor ingresá un código postal válido de al menos 4 dígitos.");
      return;
    }
    if (!shippingProvince.trim()) {
      setFormError("Por favor seleccioná tu provincia.");
      return;
    }
    if (shippingCity.trim().length < 2) {
      setFormError("Por favor ingresá tu localidad o ciudad.");
      return;
    }

    setWizardStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =========================================================================
  // ACCIÓN PASO 3 -> PASO 4: CREAR ORDEN EN PENDIENTE_PAGO Y RESERVAR STOCK
  // =========================================================================
  const handleReserveAndGoToPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError("Tu carrito está vacío.");
      return;
    }

    if (validation?.hasStockIssues) {
      setFormError(
        "Algunos artículos de tu carrito superan el stock disponible. Ajustá las cantidades antes de continuar al pago."
      );
      return;
    }

    if (shippingMethod === "CORREO_ARGENTINO_SUCURSAL" && !shippingBranchCode) {
      setFormError(
        "Por favor seleccioná una sucursal oficial de Correo Argentino para retirar tu pedido."
      );
      return;
    }

    startReservationTransition(async () => {
      const res = await createGuestOrder({
        customerName: customerName.trim(),
        customerDni: customerDni.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingMethod,
        shippingAddress:
          shippingMethod === "RETIRO_LOCAL"
            ? null
            : shippingMethod === "CORREO_ARGENTINO_SUCURSAL"
            ? shippingBranchName.trim() || "Sucursal Correo Argentino"
            : shippingAddress.trim(),
        shippingCity:
          shippingMethod === "CADETERIA_FORMOSA"
            ? "Formosa"
            : shippingCity.trim() || "Formosa",
        shippingPostalCode:
          shippingMethod === "CADETERIA_FORMOSA"
            ? "3600"
            : shippingPostalCode.trim() || "3600",
        shippingBranchCode:
          shippingMethod === "CORREO_ARGENTINO_SUCURSAL"
            ? shippingBranchCode.trim() || null
            : null,
        shippingBranchName:
          shippingMethod === "CORREO_ARGENTINO_SUCURSAL"
            ? shippingBranchName.trim() || null
            : null,
        shippingCost,
        customerId: activeCustomer?.id ?? null,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          expectedUnitPrice: i.price,
        })),
      });

      if (!res.success || !res.data) {
        setFormError(
          res.error ||
            "No pudimos reservar la orden. Revisá los datos e intentá nuevamente."
        );
        void runLiveValidation();
        return;
      }

      const order = res.data;
      setCreatedOrder(order);
      setWizardStep(4);
      setPaymentResult(null);
      setPaymentError(null);
      setCardHolderName(order.customer.name.toUpperCase());

      try {
        const sessionPayload: StoredCheckoutSession = {
          orderCode: order.orderCode,
          verification: order.customer.dni || order.customer.email,
        };
        window.sessionStorage.setItem(
          ACTIVE_CHECKOUT_SESSION_KEY,
          JSON.stringify(sessionPayload)
        );
      } catch {
        // Ignorar errores de sessionStorage
      }

      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // =========================================================================
  // HELPERS DE AUTOCOMPLETADO PARA PROBAR TARJETA APROBADA VS RECHAZADA
  // =========================================================================
  const handleFillApprovedDemoCard = () => {
    setPaymentError(null);
    setCardBrand("VISA");
    setCardNumber("4509 9535 6623 3704");
    setCardHolderName(
      (createdOrder?.customer.name || customerName || "JUAN PEREZ").toUpperCase()
    );
    setCardExpiry("12/29");
    setCardCvv("123");
    setSimulateDecline(false);
  };

  const handleFillDeclinedDemoCard = () => {
    setPaymentError(null);
    setCardBrand("VISA");
    setCardNumber("4509 9500 0000 0000");
    setCardHolderName(
      (createdOrder?.customer.name || customerName || "TARJETA RECHAZADA").toUpperCase()
    );
    setCardExpiry("08/28");
    setCardCvv("999");
    setSimulateDecline(true);
  };

  // =========================================================================
  // ACCIÓN PASO 2 -> PASO 3: EJECUTAR EL PAGO DE LA RESERVA
  // =========================================================================
  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrder) return;

    setPaymentError(null);

    if (secondsLeft !== null && secondsLeft <= 0) {
      setPaymentError(
        "El tiempo de reserva de 15 minutos expiró. Cancelá o volvé al catálogo para iniciar una nueva compra."
      );
      return;
    }

    if (paymentOption === "MERCADOPAGO") {
      startPaymentTransition(async () => {
        const prefRes = await createMercadoPagoPreference(
          createdOrder.orderCode
        );

        if (!prefRes.success || !prefRes.data) {
          setPaymentError(
            prefRes.error ||
              "No se pudo generar la preferencia en Mercado Pago. Revisá tus credenciales."
          );
          return;
        }

        const targetUrl =
          prefRes.data.initPoint || prefRes.data.sandboxInitPoint;

        if (!targetUrl) {
          setPaymentError(
            "No se obtuvo la URL de pago de Mercado Pago Sandbox."
          );
          return;
        }

        window.location.href = targetUrl;
      });
      return;
    }

    const isCard =
      paymentOption === "TARJETA_CREDITO" || paymentOption === "TARJETA_DEBITO";

    const cleanCardDigits = cardNumber.replace(/\D/g, "");
    const cleanExpiryDigits = cardExpiry.replace(/\D/g, "");
    const cleanCvvDigits = cardCvv.replace(/\D/g, "");

    if (isCard) {
      if (cleanCardDigits.length < 15) {
        setPaymentError(
          "Ingresá los 16 dígitos de la tarjeta (o usá los botones de prueba rápida arriba)."
        );
        return;
      }
      if (cardHolderName.trim().length < 3) {
        setPaymentError("Ingresá el nombre y apellido del titular de la tarjeta.");
        return;
      }
      if (cleanExpiryDigits.length !== 4) {
        setPaymentError("Ingresá el vencimiento en formato MM/AA (ej: 12/29).");
        return;
      }
      const expMonth = parseInt(cleanExpiryDigits.slice(0, 2), 10);
      if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
        setPaymentError("El mes de vencimiento de la tarjeta debe estar entre 01 y 12.");
        return;
      }
      if (cleanCvvDigits.length < 3) {
        setPaymentError("Ingresá el código de seguridad (CVV) de 3 o 4 dígitos.");
        return;
      }
    }

    const effectiveInstallments =
      paymentOption === "TARJETA_CREDITO" ? installments : 1;

    // Detectar si es una tarjeta demo para testing rápido en desarrollo
    const isDemoCard =
      simulateDecline ||
      cleanCardDigits === "4509953566233704" ||
      cleanCardDigits === "4509950000000000" ||
      cardHolderName.toUpperCase().includes("DEMO") ||
      cardHolderName.toUpperCase().includes("RECHAZ");

    startPaymentTransition(async () => {
      let cardToken: string | undefined = undefined;

      // Si es tarjeta real y la SDK de Mercado Pago está disponible, tokenizar en el navegador
      if (
        isCard &&
        !isDemoCard &&
        typeof window !== "undefined" &&
        window.MercadoPago &&
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
      ) {
        try {
          const mp = new window.MercadoPago(
            process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
            { locale: "es-AR" }
          );
          const expMonthStr = cleanExpiryDigits.slice(0, 2);
          const expYearStr = "20" + cleanExpiryDigits.slice(2, 4);

          const tokenResult = await mp.createCardToken({
            cardNumber: cleanCardDigits,
            cardholderName: cardHolderName.trim(),
            cardExpirationMonth: expMonthStr,
            cardExpirationYear: expYearStr,
            securityCode: cleanCvvDigits,
            identificationType: "DNI",
            identificationNumber:
              createdOrder.customer.dni.replace(/\D/g, "") || "11111111",
          });

          if (tokenResult?.id) {
            cardToken = tokenResult.id;
          }
        } catch (tokenErr: any) {
          console.warn("Mercado Pago createCardToken error:", tokenErr);
          if (tokenErr?.message) {
            setPaymentError(`Validación de tarjeta: ${tokenErr.message}`);
            return;
          }
        }
      }

      const res = await processWebOrderPayment({
        orderCode: createdOrder.orderCode,
        verification: createdOrder.customer.dni || createdOrder.customer.email,
        paymentOption,
        cardBrand: isCard ? cardBrand : undefined,
        cardHolderName: isCard ? cardHolderName.trim() : undefined,
        cardLast4: isCard ? cleanCardDigits.slice(-4) : undefined,
        cardToken,
        paymentMethodId: isCard ? cardBrand.toLowerCase() : undefined,
        installments: effectiveInstallments,
        simulateDecline: isCard ? simulateDecline : false,
        transferReference:
          paymentOption === "TRANSFERENCIA"
            ? transferReference.trim() || null
            : null,
      });

      if (!res.success || !res.data) {
        setPaymentError(
          res.error ||
            "No pudimos procesar el pago. Tu stock continúa reservado para que intentes nuevamente."
        );
        if (res.code === "ORDER_EXPIRED") {
          try {
            window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
          } catch {
            // Ignorar
          }
        }
        return;
      }

      setPaymentResult(res.data);

      if (res.data.status === "COMPLETADA") {
        try {
          window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
        } catch {
          // Ignorar
        }
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // =========================================================================
  // CANCELAR RESERVA DESDE EL PASO 2 Y LIBERAR STOCK INMEDIATAMENTE
  // =========================================================================
  const handleCancelReservation = () => {
    if (!createdOrder) return;
    setPaymentError(null);

    startCancelTransition(async () => {
      const res = await cancelGuestOrder(
        createdOrder.orderCode,
        "Reserva cancelada voluntariamente por el cliente en la pantalla de pago"
      );

      if (!res.success) {
        setPaymentError(res.error || "No se pudo cancelar la reserva.");
        return;
      }

      try {
        window.sessionStorage.removeItem(ACTIVE_CHECKOUT_SESSION_KEY);
      } catch {
        // Ignorar
      }

      setCreatedOrder(null);
      setPaymentResult(null);
      setWizardStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  // Determinar paso actual para el Stepper visual (1, 2, 3 o 4)
  const isOrderFullyCompleted = Boolean(paymentResult);
  const activeStepNum: 1 | 2 | 3 | 4 = isOrderFullyCompleted
    ? 4
    : createdOrder
      ? 4
      : wizardStep;

  const renderCheckoutStepper = () => {
    const steps: Array<{ num: 1 | 2 | 3 | 4; title: string; subtitle: string }> = [
      {
        num: 1,
        title: "Contacto",
        subtitle: "Datos y email",
      },
      {
        num: 2,
        title: "Dirección",
        subtitle: "Ubicación de entrega",
      },
      {
        num: 3,
        title: "Entrega",
        subtitle: "Método y cotización",
      },
      {
        num: 4,
        title: "Pago",
        subtitle: "Reserva por 15 min",
      },
    ];

    return (
      <nav
        aria-label="Progreso de compra"
        className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm"
      >
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {steps.map((step) => {
            const isCompleted =
              isOrderFullyCompleted || activeStepNum > step.num;
            const isActive =
              !isOrderFullyCompleted && activeStepNum === step.num;
            const canNavigateBack = !createdOrder && step.num < wizardStep;

            return (
              <li
                key={step.num}
                onClick={() => {
                  if (canNavigateBack) {
                    setFormError(null);
                    setWizardStep(step.num);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? "border-[#00A811] bg-emerald-50/60 ring-1 ring-[#00A811]"
                    : isCompleted
                      ? "border-emerald-200 bg-emerald-50/25"
                      : "border-slate-100 bg-slate-50/60 opacity-60"
                } ${canNavigateBack ? "cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50" : ""}`}
                title={
                  canNavigateBack
                    ? `Volver al paso ${step.num}: ${step.title}`
                    : undefined
                }
              >
                <span
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? "bg-[#00D615] text-slate-950"
                      : isActive
                        ? "bg-slate-950 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-black uppercase tracking-wide text-slate-900 truncate flex items-center gap-1">
                    <span>{step.title}</span>
                    {canNavigateBack && (
                      <Pencil className="w-2.5 h-2.5 text-slate-400 hidden sm:inline" />
                    )}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 truncate hidden xs:block">
                    {step.subtitle}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  // =========================================================================
  // ESTADOS DE CARGA INICIAL / HIDRATACIÓN
  // =========================================================================
  if (!hasHydrated || isResumingOrder) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <EcommerceHeader />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="flex items-center gap-2.5 text-sm font-bold text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin text-[#00A811]" />
            <span>
              {isResumingOrder
                ? "Recuperando tu reserva de compra..."
                : "Cargando tu carrito..."}
            </span>
          </div>
        </main>
        <EcommerceFooter />
      </div>
    );
  }

  // =========================================================================
  // PASO 3: PANTALLA FINAL DIFERENCIADA (PAGO APROBADO VS PAGO PENDIENTE)
  // =========================================================================
  if (createdOrder && paymentResult) {
    const isPaid = paymentResult.status === "COMPLETADA";

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
        <EcommerceHeader />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {renderCheckoutStepper()}

          <div
            className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
              isPaid ? "border-emerald-200" : "border-amber-300"
            }`}
          >
            {/* Cabecera diferenciada: VERDE solo si el pago fue aprobado; ÁMBAR si está pendiente */}
            {isPaid ? (
              <div className="bg-[#06241d] text-white p-6 sm:p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#00D615] text-slate-950 mx-auto flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00D615] block">
                  ¡PAGO APROBADO • COMPRA CONFIRMADA!
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  ¡Gracias por tu compra, {createdOrder.customer.name}!
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/85 max-w-lg mx-auto">
                  Tu pago fue acreditado con éxito y descontamos las unidades de nuestro inventario. Nuestro equipo de Saavedra 241 ya está preparando tu pedido.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3">
                    <div className="text-left">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                        Código de Orden
                      </span>
                      <span className="text-xl font-black tracking-wider text-white">
                        {createdOrder.orderCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyText(createdOrder.orderCode, "orderCode")
                      }
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedField === "orderCode" ? (
                        <Check className="w-4 h-4 text-[#00D615]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {paymentResult.voucherCode && (
                    <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-400/30 rounded-2xl px-4 py-3 text-left">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                          Cód. Autorización
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#00D615]">
                          {paymentResult.voucherCode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-950 text-white p-6 sm:p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-400 text-slate-950 mx-auto flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 block">
                  PEDIDO RESERVADO • PAGO PENDIENTE DE ACREDITACIÓN
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Reservamos tus productos, {createdOrder.customer.name}
                </h1>
                <p className="text-xs sm:text-sm text-amber-100/90 max-w-xl mx-auto">
                  <strong>Importante:</strong> tu compra aún no registra pago acreditado. Mantenemos tus artículos separados hasta las{" "}
                  <strong>{formatDate(createdOrder.reservation.expiresAt)}</strong> para que completes la operación.
                </p>

                <div className="pt-2">
                  <div className="inline-flex items-center gap-3 bg-white/10 border border-amber-300/30 rounded-2xl px-5 py-3">
                    <div className="text-left">
                      <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                        Código de Reserva Web
                      </span>
                      <span className="text-xl font-black tracking-wider text-white">
                        {createdOrder.orderCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyText(createdOrder.orderCode, "orderCode")
                      }
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Copiar código"
                    >
                      {copiedField === "orderCode" ? (
                        <Check className="w-4 h-4 text-amber-300" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cuerpo del comprobante / instrucciones */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Bloque específico según resultado de pago */}
              {isPaid ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#00A811] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-extrabold">
                        Medio de pago:{" "}
                        {paymentResult.paymentOption === "TARJETA_CREDITO"
                          ? "Tarjeta de Crédito"
                          : "Tarjeta de Débito"}{" "}
                        {paymentResult.cardBrand ?? ""}{" "}
                        {paymentResult.cardLast4
                          ? `terminada en ${paymentResult.cardLast4}`
                          : ""}
                      </p>
                      <p className="text-emerald-800">
                        Plan:{" "}
                        {paymentResult.installments === 1
                          ? `1 pago de ${formatCurrency(paymentResult.totalAmount)}`
                          : `${paymentResult.installments} cuotas sin interés de ${formatCurrency(paymentResult.installmentAmount)}`}
                        {" • "}Estado logístico: <strong>EN PREPARACIÓN</strong>
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#00D615] text-slate-950 font-black text-[11px] uppercase self-start sm:self-center">
                    Pagado
                  </span>
                </div>
              ) : paymentResult.paymentOption === "TRANSFERENCIA" &&
                paymentResult.bankDetails ? (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 space-y-4 text-xs text-slate-800">
                  <div className="flex items-start gap-3">
                    <Landmark className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-amber-950">
                        Instrucciones para completar tu Transferencia Bancaria
                      </p>
                      <p className="text-amber-900">
                        Transferí exactamente{" "}
                        <strong>{formatCurrency(paymentResult.totalAmount)}</strong>{" "}
                        desde tu billetera virtual o homebanking a la cuenta oficial de Matacos Deportes y enviá el comprobante por WhatsApp para confirmar tu pedido:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white rounded-xl p-4 border border-amber-200/80">
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Alias CBU
                        </span>
                        <span className="font-black text-slate-950 text-sm">
                          {paymentResult.bankDetails.alias}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            paymentResult.bankDetails!.alias,
                            "alias"
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === "alias" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00A811]" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          CBU (22 dígitos)
                        </span>
                        <span className="font-black text-slate-950 text-xs sm:text-sm break-all">
                          {paymentResult.bankDetails.cbu}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            paymentResult.bankDetails!.cbu,
                            "cbu"
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedField === "cbu" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00A811]" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Titular / Razón Social
                      </span>
                      <span className="font-bold text-slate-900">
                        {paymentResult.bankDetails.accountHolder}
                      </span>
                    </div>

                    <div className="p-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        CUIT • Entidad
                      </span>
                      <span className="font-bold text-slate-900">
                        {paymentResult.bankDetails.cuit} •{" "}
                        {paymentResult.bankDetails.bankName}
                      </span>
                    </div>
                  </div>

                  {paymentResult.transferReference && (
                    <p className="text-[11px] font-bold text-amber-900">
                      Comprobante informado: {paymentResult.transferReference} (sujeto a verificación en administración)
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 space-y-2 text-xs text-amber-950">
                  <div className="flex items-start gap-3">
                    <Store className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-black">
                        Abonás al retirar en Caja — Saavedra 241, Formosa Capital
                      </p>
                      <p className="text-amber-900 leading-relaxed">
                        Presentate en mostrador indicando tu código{" "}
                        <strong>{createdOrder.orderCode}</strong> y DNI{" "}
                        <strong>{createdOrder.customer.dni}</strong> antes de las{" "}
                        <strong>
                          {formatDate(createdOrder.reservation.expiresAt)}
                        </strong>
                        . Al registrar el cobro en nuestra terminal POS tu compra pasará a confirmada.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Artículos del Pedido */}
              <div className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Detalle de Artículos ({createdOrder.items.length})
                </h2>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl px-4">
                  {createdOrder.items.map((item) => (
                    <div
                      key={item.variantId}
                      className="py-3 flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {item.quantity}x {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Talle: {item.size} • Color: {item.color} • SKU:{" "}
                          {item.sku}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900 shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comprador y Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Comprador
                  </span>
                  <p className="font-bold text-slate-900">
                    {createdOrder.customer.name}
                  </p>
                  <p className="text-slate-600">
                    DNI/CUIT: {createdOrder.customer.dni}
                  </p>
                  <p className="text-slate-600">
                    {createdOrder.customer.email}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Modalidad de Entrega
                  </span>
                  <p className="font-bold text-slate-900">
                    {createdOrder.shipping.method === "RETIRO_LOCAL"
                      ? "Retiro en Sucursal Saavedra 241"
                      : createdOrder.shipping.method === "CADETERIA_FORMOSA"
                        ? "Cadetería en Formosa Capital"
                        : createdOrder.shipping.method === "CORREO_ARGENTINO_SUCURSAL"
                          ? "Retiro en Sucursal Correo Argentino"
                          : "Envío a Domicilio por Correo Argentino"}
                  </p>
                  <p className="text-slate-600">
                    {createdOrder.shipping.address}
                  </p>
                  <p className="text-slate-600">
                    {createdOrder.shipping.city} (CP{" "}
                    {createdOrder.shipping.postalCode})
                  </p>
                </div>
              </div>

              {/* Totales */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal productos</span>
                  <span>
                    {formatCurrency(createdOrder.totals.subtotalProducts)}
                  </span>
                </div>
                {createdOrder.totals.discount && createdOrder.totals.discount > 0 ? (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Ahorro en ofertas</span>
                    <span>- {formatCurrency(createdOrder.totals.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-300">
                  <span>Costo de entrega</span>
                  <span>
                    {createdOrder.totals.shippingCost === 0
                      ? "Gratis"
                      : formatCurrency(createdOrder.totals.shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-base font-black pt-2 border-t border-slate-800">
                  <span>{isPaid ? "TOTAL ABONADO" : "TOTAL A ABONAR"}</span>
                  <span
                    className={`text-xl ${
                      isPaid ? "text-[#00D615]" : "text-amber-400"
                    }`}
                  >
                    {formatCurrency(createdOrder.totals.total)}
                  </span>
                </div>
              </div>

              {/* Acciones Pos-Checkout */}
              <div className="space-y-3 pt-2">
                {!isPaid && (
                  <>
                    <a
                      href={paymentResult.whatsappActionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {paymentResult.paymentOption === "TRANSFERENCIA"
                          ? "Enviar Comprobante de Transferencia por WhatsApp"
                          : "Coordinar Retiro y Pago por WhatsApp"}
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentOption("TARJETA_CREDITO");
                        setPaymentResult(null);
                      }}
                      className="w-full py-3.5 px-5 rounded-xl border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        ¿Preferís confirmación inmediata? Pagar ahora con Tarjeta
                      </span>
                    </button>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeCustomer ? (
                    <Link
                      href="/cuenta?tab=pedidos"
                      className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Ver en Mis Pedidos</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/seguimiento?codigo=${encodeURIComponent(
                        createdOrder.orderCode
                      )}&verificacion=${encodeURIComponent(
                        createdOrder.customer.dni
                      )}`}
                      className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Seguir Estado del Pedido</span>
                    </Link>
                  )}

                  <Link
                    href="/catalogo"
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Seguir Comprando</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        <EcommerceFooter />
      </div>
    );
  }

  // =========================================================================
  // PASO 2: SELECCIÓN Y EJECUCIÓN DEL MEDIO DE PAGO (CON STOCK RESERVADO)
  // =========================================================================
  if (createdOrder) {
    const isExpired = secondsLeft !== null && secondsLeft <= 0;
    const isPickup = createdOrder.shipping.method === "RETIRO_LOCAL";
    const isCardSelected =
      paymentOption === "TARJETA_CREDITO" ||
      paymentOption === "TARJETA_DEBITO";

    const effectiveInstallments =
      paymentOption === "TARJETA_CREDITO" ? installments : 1;
    const installmentAmount =
      createdOrder.totals.total / effectiveInstallments;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
        <EcommerceHeader />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {renderCheckoutStepper()}

          {/* Barra superior de Reserva Activa con Timer 15:00 */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isExpired
                ? "bg-red-50 border-red-300 text-red-950"
                : "bg-[#06241d] border-emerald-800 text-white"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black ${
                  isExpired
                    ? "bg-red-600 text-white"
                    : "bg-[#00D615] text-slate-950"
                }`}
              >
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {isExpired
                      ? "Tiempo de reserva vencido"
                      : `Stock reservado • Orden ${createdOrder.orderCode}`}
                  </span>
                  {!isExpired && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400/20 text-[#00D615] border border-[#00D615]/30">
                      Precio congelado
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs ${
                    isExpired ? "text-red-800" : "text-emerald-100/85"
                  }`}
                >
                  {isExpired
                    ? "La ventana de 15 minutos finalizó y las unidades volvieron a estar disponibles."
                    : "Tus productos ya están separados en inventario. Elegí cómo querés abonar para completar la operación."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
              {secondsLeft !== null && !isExpired && (
                <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                    Tiempo restante
                  </span>
                  <span className="text-lg font-black tabular-nums text-[#00D615]">
                    {formatCountdown(secondsLeft)}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCancelReservation}
                disabled={isCancellingOrder || isProcessingPayment}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isExpired
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                }`}
              >
                {isCancellingOrder ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>
                  {isExpired ? "Volver a empezar" : "Cancelar reserva"}
                </span>
              </button>
            </div>
          </div>

          {paymentError && (
            <div className="bg-red-50 border border-red-300 text-red-900 rounded-2xl p-4 flex items-start gap-3 text-xs font-semibold">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-black text-red-950">
                  No se pudo confirmar el pago
                </p>
                <p>{paymentError}</p>
              </div>
            </div>
          )}

          {/* Layout de 2 Columnas para el Paso 2 */}
          <form
            onSubmit={handleExecutePayment}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
          >
            {/* Columna Izquierda: Selector y Formulario de Pago (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-slate-950 text-white text-xs font-black flex items-center justify-center">
                      4
                    </span>
                    <div>
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-slate-950">
                        ¿Cómo querés pagar tu compra?
                      </h1>
                      <p className="text-[11px] text-slate-500">
                        Paso 4 de 4 • Stock reservado por 15 minutos para la orden {createdOrder.orderCode}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <Lock className="w-3.5 h-3.5" />
                    Operación segura
                  </span>
                </div>

                {/* Opciones de Medio de Pago */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opción Destacada: Mercado Pago Checkout Pro (Sandbox) */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("MERCADOPAGO");
                      setPaymentError(null);
                    }}
                    className={`sm:col-span-2 p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      paymentOption === "MERCADOPAGO"
                        ? "border-[#009ee3] bg-sky-50/70 ring-2 ring-[#009ee3]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#009ee3] text-white flex items-center justify-center font-black text-xs shrink-0">
                          MP
                        </span>
                        <div>
                          <p className="text-xs sm:text-sm font-black text-slate-900">
                            Mercado Pago Checkout Pro (Sandbox)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Tarjetas de prueba oficiales, dinero en cuenta o efectivo en puntos de cobro
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#009ee3]/15 text-[#0074a6] shrink-0">
                        Oficial Sandbox
                      </span>
                    </div>
                  </button>

                  {/* Opción 1: Tarjeta de Crédito */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("TARJETA_CREDITO");
                      setPaymentError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      paymentOption === "TARJETA_CREDITO"
                        ? "border-[#00A811] bg-emerald-50/50 ring-1 ring-[#00A811]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-5 h-5 text-[#00A811]" />
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Hasta 6 sin interés
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Tarjeta de Crédito Directa
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Acreditación instantánea • Confirmación en el acto
                    </p>
                  </button>

                  {/* Opción 2: Tarjeta de Débito */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("TARJETA_DEBITO");
                      setPaymentError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      paymentOption === "TARJETA_DEBITO"
                        ? "border-[#00A811] bg-emerald-50/50 ring-1 ring-[#00A811]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-5 h-5 text-slate-800" />
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Inmediato
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Tarjeta de Débito Directa
                    </p>
                    <p className="text-[11px] text-slate-500">
                      1 pago sin recargo • Confirmación en el acto
                    </p>
                  </button>

                  {/* Opción 3: Transferencia Bancaria */}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentOption("TRANSFERENCIA");
                      setPaymentError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      paymentOption === "TRANSFERENCIA"
                        ? "border-[#00A811] bg-emerald-50/50 ring-1 ring-[#00A811]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Landmark className="w-5 h-5 text-blue-700" />
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Requiere validación
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Transferencia CBU / Alias
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Billeteras virtuales o banco • Reserva sujeta a comprobante
                    </p>
                  </button>

                  {/* Opción 4: Pago en Mostrador (solo RETIRO_LOCAL) */}
                  <button
                    type="button"
                    disabled={!isPickup}
                    onClick={() => {
                      if (!isPickup) return;
                      setPaymentOption("PAGO_LOCAL");
                      setPaymentError(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-1.5 ${
                      !isPickup
                        ? "border-slate-100 bg-slate-50 opacity-55 cursor-not-allowed"
                        : paymentOption === "PAGO_LOCAL"
                          ? "border-[#00A811] bg-emerald-50/50 ring-1 ring-[#00A811] cursor-pointer"
                          : "border-slate-200 hover:border-slate-300 bg-white cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Store className="w-5 h-5 text-amber-700" />
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {isPickup ? "Saavedra 241" : "Solo retiro"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      Abonar al Retirar en Local
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isPickup
                        ? "Efectivo, tarjetas o QR en caja de Saavedra 241"
                        : "Disponible únicamente eligiendo Retiro en el local"}
                    </p>
                  </button>
                </div>

                {/* Formulario dinámico según medio de pago seleccionado */}
                {paymentOption === "MERCADOPAGO" && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-5 space-y-3.5 text-xs text-sky-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-black text-sm text-[#0074a6]">
                          <span>Pasarela Oficial Mercado Pago Checkout Pro</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#009ee3] text-white">
                          Sandbox
                        </span>
                      </div>
                      <p className="text-sky-900 leading-relaxed">
                        Al presionar <strong>PAGAR CON MERCADO PAGO</strong> se creará una preferencia oficial en tiempo real y te redirigiremos a la pasarela protegida de Mercado Pago.
                      </p>

                      {/* Tarjetas de prueba oficiales de la guía */}
                      <div className="bg-white rounded-2xl p-4 border border-sky-200/80 space-y-2.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                          Tarjetas de Prueba Oficiales para Sandbox (Argentina)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                            <span className="font-black text-emerald-800 block text-[10px] uppercase">
                              Pago Aprobado (Éxito)
                            </span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              4000 0000 0000 0001
                            </span>
                            <p className="text-[10px] text-slate-500">
                              Vto: Futura (ej. 12/28) • CVV: 123 • Titular: APRO
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-0.5">
                            <span className="font-black text-red-800 block text-[10px] uppercase">
                              Rechazado (Fondos)
                            </span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              4000 0000 0000 0002
                            </span>
                            <p className="text-[10px] text-slate-500">
                              Vto: Futura (ej. 12/28) • CVV: 123 • Titular: RECH
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-0.5">
                            <span className="font-black text-amber-800 block text-[10px] uppercase">
                              Pendiente Acreditación
                            </span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              4000 0000 0000 0003
                            </span>
                            <p className="text-[10px] text-slate-500">
                              Vto: Futura (ej. 12/28) • CVV: 123 • Titular: PEND
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-sky-800">
                        Al completar el pago, Mercado Pago te retornará automáticamente a <strong>/checkout/resultado</strong> actualizando el estado de tu orden y vaciando el carrito.
                      </p>
                    </div>
                  </div>
                )}

                {isCardSelected && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    {/* Botonera de prueba rápida para entorno local y testing */}
                    {process.env.NODE_ENV !== "production" && (
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                            <Sparkles className="w-3.5 h-3.5 text-[#00A811]" />
                            <span>Entorno de Pruebas (Dev / Sandbox)</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            Dual Mode Activo
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Podés autocompletar una tarjeta simulada para probar el flujo sin costo, o ingresar una tarjeta real para validar la tokenización transparente directa con Mercado Pago.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={handleFillApprovedDemoCard}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Autocompletar Tarjeta Aprobada
                          </button>
                          <button
                            type="button"
                            onClick={handleFillDeclinedDemoCard}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Simular Tarjeta Rechazada
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Marca de Tarjeta */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Seleccioná la entidad / marca *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CARD_BRANDS.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setCardBrand(b.id)}
                            className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                              cardBrand === b.id
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cuotas (solo Crédito) */}
                    {paymentOption === "TARJETA_CREDITO" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Cantidad de cuotas *
                        </label>
                        <div className="space-y-2">
                          {CREDIT_INSTALLMENTS.map((plan) => {
                            const perInstallment =
                              createdOrder.totals.total / plan.count;
                            const isPlanSelected = installments === plan.count;
                            return (
                              <label
                                key={plan.count}
                                onClick={() => setInstallments(plan.count)}
                                className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isPlanSelected
                                    ? "border-[#00A811] bg-emerald-50/40 font-bold"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="radio"
                                    name="installments"
                                    checked={isPlanSelected}
                                    onChange={() => setInstallments(plan.count)}
                                    className="text-[#00A811] cursor-pointer"
                                  />
                                  <span className="text-slate-900">
                                    {plan.label}
                                  </span>
                                </div>
                                <span className="font-black text-slate-950">
                                  {plan.count} x{" "}
                                  {formatCurrency(perInstallment)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Datos de la Tarjeta */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Número de tarjeta *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={(e) => {
                            const formatted = formatCardNumberInput(
                              e.target.value
                            );
                            setCardNumber(formatted);
                            const cleanDigits = formatted.replace(/\D/g, "");
                            setSimulateDecline(cleanDigits.endsWith("0000"));

                            // Detección automática de la franquicia/marca
                            if (cleanDigits.startsWith("4")) {
                              setCardBrand("VISA");
                            } else if (
                              /^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(
                                cleanDigits
                              )
                            ) {
                              setCardBrand("MASTERCARD");
                            } else if (
                              cleanDigits.startsWith("589562") ||
                              cleanDigits.startsWith("58")
                            ) {
                              setCardBrand("NARANJA_X");
                            } else if (/^(6042|6043|5896)/.test(cleanDigits)) {
                              setCardBrand("CABAL");
                            }
                          }}
                          placeholder="4509 9535 6623 3704"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nombre y apellido como figura en la tarjeta *
                        </label>
                        <input
                          type="text"
                          value={cardHolderName}
                          onChange={(e) =>
                            setCardHolderName(e.target.value.toUpperCase())
                          }
                          placeholder="EJ: MARTÍN GÓMEZ"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm uppercase focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Vencimiento (MM/AA) *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardExpiry}
                          onChange={(e) =>
                            setCardExpiry(formatCardExpiryInput(e.target.value))
                          }
                          placeholder="12/29"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Código de seguridad (CVV) *
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="123"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:border-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentOption === "TRANSFERENCIA" && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs text-amber-950">
                      <p className="font-extrabold">
                        Datos oficiales de cuenta para transferir{" "}
                        {formatCurrency(createdOrder.totals.total)}:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white rounded-xl p-3 border border-amber-200/70">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              Alias
                            </span>
                            <span className="font-black text-slate-900">
                              MATACOS.DEPORTES.FSA
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyText(
                                "MATACOS.DEPORTES.FSA",
                                "step2-alias"
                              )
                            }
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Copiar Alias"
                          >
                            {copiedField === "step2-alias" ? (
                              <Check className="w-3.5 h-3.5 text-[#00A811]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">
                              CBU
                            </span>
                            <span className="font-black text-slate-900 text-[11px] break-all">
                              0110263720026300489124
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopyText(
                                "0110263720026300489124",
                                "step2-cbu"
                              )
                            }
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 shrink-0 cursor-pointer"
                            title="Copiar CBU"
                          >
                            {copiedField === "step2-cbu" ? (
                              <Check className="w-3.5 h-3.5 text-[#00A811]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Titular
                          </span>
                          <span className="font-bold text-slate-800">
                            MUJICA SANDRA ISABEL
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            CUIT
                          </span>
                          <span className="font-bold text-slate-800">
                            27-18036080-3
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-800">
                        Al continuar, tu pedido quedará en estado{" "}
                        <strong>Pago Pendiente</strong> (no confirmado aún) hasta verificar la acreditación del comprobante.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Número de comprobante / operación (opcional si ya transferiste)
                      </label>
                      <input
                        type="text"
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        placeholder="Ej: COELSA-98441230"
                        maxLength={80}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                )}

                {paymentOption === "PAGO_LOCAL" && (
                  <div className="pt-4 border-t border-slate-100">
                    <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-950">
                      <div className="flex items-center gap-2 font-extrabold">
                        <Store className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          Pago presencial al retirar en Saavedra 241, Formosa Capital
                        </span>
                      </div>
                      <p className="text-amber-900 leading-relaxed">
                        Tu pedido quedará registrado como{" "}
                        <strong>Reserva con Pago Pendiente</strong>. Al acercarte a nuestro local presentando el código{" "}
                        <strong>{createdOrder.orderCode}</strong> y tu DNI podrás abonar en caja con Efectivo, Tarjetas o QR.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Columna Derecha: Resumen Congelado de la Reserva y Botón de Pago (5 cols) */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                      Orden {createdOrder.orderCode}
                    </span>
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-950">
                      Resumen Reservado
                    </h2>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#00A811]" />
                </div>

                {/* Lista de ítems reservados */}
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {createdOrder.items.map((item) => (
                    <div
                      key={item.variantId}
                      className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {item.quantity}x {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Talle {item.size} • {item.color}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Entrega seleccionada */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Entrega configurada
                  </span>
                  <p className="font-bold text-slate-900">
                    {createdOrder.shipping.address}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Comprador: {createdOrder.customer.name} (DNI{" "}
                    {createdOrder.customer.dni})
                  </p>
                </div>

                {/* Desglose de importes */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Productos</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(createdOrder.totals.subtotalProducts)}
                    </span>
                  </div>
                  {createdOrder.totals.discount && createdOrder.totals.discount > 0 ? (
                    <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-bold">
                      <span>Ahorro en ofertas:</span>
                      <span className="font-black text-emerald-700">- {formatCurrency(createdOrder.totals.discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-slate-600">
                    <span>Envío / Entrega</span>
                    <span className="font-bold text-emerald-700">
                      {createdOrder.totals.shippingCost === 0
                        ? "Gratis"
                        : formatCurrency(createdOrder.totals.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-base font-black text-slate-950 pt-3 border-t border-slate-200">
                    <span>TOTAL</span>
                    <span className="text-2xl text-[#00A811]">
                      {formatCurrency(createdOrder.totals.total)}
                    </span>
                  </div>
                  {paymentOption === "TARJETA_CREDITO" && installments > 1 && (
                    <p className="text-[11px] text-right font-bold text-emerald-700">
                      En {installments} cuotas sin interés de{" "}
                      {formatCurrency(installmentAmount)}
                    </p>
                  )}
                </div>

                {/* Botón de Ejecución del Pago */}
                <button
                  type="submit"
                  disabled={isProcessingPayment || isCancellingOrder || isExpired}
                  className={`w-full py-4 px-6 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed ${
                    paymentOption === "MERCADOPAGO"
                      ? "bg-[#009ee3] hover:bg-[#008ac7] text-white shadow-[#009ee3]/20 disabled:bg-slate-200 disabled:text-slate-400"
                      : "bg-[#00D615] hover:bg-[#00b812] text-slate-950 shadow-[#00D615]/20 disabled:bg-slate-200 disabled:text-slate-400"
                  }`}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {paymentOption === "MERCADOPAGO"
                          ? "Conectando con Mercado Pago Sandbox..."
                          : isCardSelected
                            ? "Autorizando pago con tarjeta..."
                            : "Registrando modalidad de pago..."}
                      </span>
                    </>
                  ) : paymentOption === "MERCADOPAGO" ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        PAGAR CON MERCADO PAGO ({formatCurrency(createdOrder.totals.total)})
                      </span>
                    </>
                  ) : isCardSelected ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        PAGAR {formatCurrency(createdOrder.totals.total)} AHORA
                      </span>
                    </>
                  ) : paymentOption === "TRANSFERENCIA" ? (
                    <>
                      <Landmark className="w-4 h-4" />
                      <span>REGISTRAR PAGO POR TRANSFERENCIA</span>
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>MANTENER RESERVA PARA ABONAR EN CAJA</span>
                    </>
                  )}
                </button>
              </div>
            </aside>
          </form>
        </main>

        <EcommerceFooter />
      </div>
    );
  }

  // =========================================================================
  // CARRITO VACÍO (SIN RESERVA ACTIVA)
  // =========================================================================
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <EcommerceHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
            {formError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 text-xs font-semibold text-left">
                {formError}
              </div>
            )}
            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-slate-900">
              Tu carrito está vacío
            </h1>
            <p className="text-xs text-slate-500">
              Agregá productos desde nuestro catálogo para iniciar tu compra online.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explorar Catálogo</span>
            </Link>
          </div>
        </main>
        <EcommerceFooter />
      </div>
    );
  }

  // =========================================================================
  // PASO 1: CONTACTO, MODALIDAD DE ENTREGA Y RESERVA DE STOCK
  // =========================================================================
  const validatedMap = new Map(
    (validation?.items ?? []).map((v) => [v.variantId, v])
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <EcommerceHeader />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Seguir comprando en el catálogo</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight">
              Iniciar Compra
            </h1>
          </div>

          <button
            type="button"
            onClick={() => void runLiveValidation()}
            disabled={isValidating}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isValidating ? "animate-spin text-[#00A811]" : ""}`}
            />
            <span>
              {isValidating ? "Verificando stock..." : "Stock verificado en vivo"}
            </span>
          </button>
        </div>

        {renderCheckoutStepper()}

        {/* Identity Banner: Logged-in vs Guest */}
        {activeCustomer ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-950">
              <div className="w-8 h-8 rounded-full bg-[#00D615] text-slate-950 flex items-center justify-center font-black shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold">
                  Sesión iniciada como {activeCustomer.name} ({activeCustomer.email})
                </p>
                <p className="text-emerald-800 text-[11px]">
                  Este pedido quedará vinculado automáticamente al historial de tu cuenta.
                </p>
              </div>
            </div>
            <Link
              href="/cuenta?tab=perfil"
              className="text-xs font-bold text-emerald-900 underline hover:text-emerald-700 shrink-0"
            >
              Editar perfil
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <User className="w-4 h-4 text-[#00A811] shrink-0" />
              <span>
                ¿Tenés cuenta en Matacos Deportes? Iniciá sesión para autocompletar tus datos o continuá abajo como{" "}
                <strong>invitado sin registrarte</strong>.
              </span>
            </div>
            <Link
              href="/cuenta?redirect=/checkout"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 text-center transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* Alerts */}
        {priceChangeBanner && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Actualizamos el importe de uno o más artículos según la lista de precios vigente en tienda.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPriceChangeBanner(false)}
              className="text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 flex items-start gap-2.5 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Main 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Form according to wizardStep (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* ============================================================= */}
            {/* PASO 1: DATOS DE CONTACTO */}
            {/* ============================================================= */}
            {wizardStep === 1 && (
              <form
                onSubmit={handleProceedToStep2}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-slate-950 text-white text-xs font-black flex items-center justify-center">
                      1
                    </span>
                    <div>
                      <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950">
                        Datos de Contacto
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Paso 1 de 4 • ¿A quién contactamos y enviamos el comprobante?
                      </p>
                    </div>
                  </div>
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Te enviaremos el comprobante de compra y el código de seguimiento a este email.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={customerFirstName}
                        onChange={(e) => setCustomerFirstName(e.target.value)}
                        placeholder="Ej: Martín"
                        required
                        minLength={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={customerLastName}
                        onChange={(e) => setCustomerLastName(e.target.value)}
                        placeholder="Ej: Gómez"
                        required
                        minLength={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ej: 3704556677"
                        required
                        minLength={6}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Para avisarte ante novedades o coordinar la entrega.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        DNI o CUIT *
                      </label>
                      <input
                        type="text"
                        value={customerDni}
                        onChange={(e) => setCustomerDni(e.target.value)}
                        placeholder="Ej: 38999111"
                        required
                        minLength={7}
                        maxLength={11}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Requerido para retirar en sucursal o emitir la factura.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Completá tus datos para avanzar al paso de dirección.
                  </p>
                  <button
                    type="submit"
                    className="w-full sm:w-auto ml-auto py-3 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Continuar a Dirección</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================= */}
            {/* PASO 2: DIRECCIÓN Y UBICACIÓN */}
            {/* ============================================================= */}
            {wizardStep === 2 && (
              <form
                onSubmit={handleProceedToStep3}
                className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-slate-950 text-white text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950">
                        Dirección y Ubicación
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Paso 2 de 4 • ¿Dónde te entregamos o cuál es tu domicilio de facturación?
                      </p>
                    </div>
                  </div>
                  <Home className="w-5 h-5 text-slate-400" />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Calle *
                      </label>
                      <input
                        type="text"
                        value={shippingStreet}
                        onChange={(e) => setShippingStreet(e.target.value)}
                        placeholder="Ej: Av. 25 de Mayo o Saavedra"
                        required
                        minLength={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Número / Altura *
                      </label>
                      <input
                        type="text"
                        value={shippingNumber}
                        onChange={(e) => setShippingNumber(e.target.value)}
                        placeholder="Ej: 850"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Piso y Departamento (opcional)
                      </label>
                      <input
                        type="text"
                        value={shippingFloorDept}
                        onChange={(e) => setShippingFloorDept(e.target.value)}
                        placeholder="Ej: Piso 2 Depto B"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                        placeholder="Ej: 3600"
                        required
                        minLength={4}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Utilizado para cotizar envíos y buscar sucursales de Correo Argentino.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Provincia *
                      </label>
                      <select
                        value={shippingProvince}
                        onChange={(e) => setShippingProvince(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900 bg-white"
                      >
                        {ARGENTINE_PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Localidad o Ciudad *
                      </label>
                      <input
                        type="text"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        placeholder="Ej: Formosa"
                        required
                        minLength={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setWizardStep(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a Contacto</span>
                  </button>

                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Continuar a Método de Entrega</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================= */}
            {/* PASO 3: MÉTODO DE ENTREGA */}
            {/* ============================================================= */}
            {wizardStep === 3 && (
              <form
                onSubmit={handleReserveAndGoToPayment}
                className="space-y-6"
              >
                {/* Resumen previo de Contacto y Dirección con botón para editar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                        <span>Datos de Contacto</span>
                      </div>
                      <p className="font-extrabold text-slate-900 truncate">
                        {customerName}
                      </p>
                      <p className="text-slate-500 truncate">
                        DNI {customerDni} • {customerEmail}
                      </p>
                      <p className="text-slate-500 truncate">
                        Tel: {customerPhone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setWizardStep(1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-600 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Editar datos de contacto"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase text-[10px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span>Dirección de Entrega</span>
                      </div>
                      <p className="font-extrabold text-slate-900 truncate">
                        {shippingAddress || `${shippingStreet} ${shippingNumber}`}
                      </p>
                      <p className="text-slate-500 truncate">
                        {shippingCity}, {shippingProvince}
                      </p>
                      <p className="text-slate-500 truncate">
                        Código Postal: {shippingPostalCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setWizardStep(2);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-600 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Editar dirección"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>

                {/* Selección del Método de Entrega */}
                <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-slate-950 text-white text-xs font-black flex items-center justify-center">
                        3
                      </span>
                      <div>
                        <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-slate-950">
                          Método de Entrega
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Paso 3 de 4 • Elegí cómo querés recibir o retirar tu compra
                        </p>
                      </div>
                    </div>
                    {isQuotingShipping && (
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Cotizando...</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {shippingOptions.map((option) => {
                      const isSelected = shippingMethod === option.method;
                      return (
                        <label
                          key={option.method}
                          onClick={() => setShippingMethod(option.method)}
                          className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#00A811] bg-emerald-50/40 ring-1 ring-[#00A811]"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={option.method}
                              checked={isSelected}
                              onChange={() => setShippingMethod(option.method)}
                              className="mt-1 text-[#00A811] focus:ring-[#00A811] cursor-pointer"
                            />
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                  {option.title}
                                </span>
                                {option.badge && (
                                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                    {option.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                {option.subtitle}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs sm:text-sm font-black text-slate-900 shrink-0">
                            {option.cost === 0
                              ? "Gratis"
                              : formatCurrency(option.cost)}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Campos condicionales según modalidad de entrega */}
                  {shippingMethod === "RETIRO_LOCAL" && (
                    <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 flex items-start gap-3 text-xs text-slate-800">
                      <MapPin className="w-5 h-5 text-[#00A811] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-950 font-bold text-xs mb-0.5">
                          Punto de Retiro Oficial en Formosa Capital
                        </strong>
                        <span>
                          Retirás sin costo presentando tu DNI ({customerDni}) y código de orden en{" "}
                          <strong>Saavedra 241</strong> (Lun a Sáb 8:00–12:30 y 17:00–21:00).
                        </span>
                      </div>
                    </div>
                  )}

                  {shippingMethod === "CADETERIA_FORMOSA" && (
                    <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/70 flex items-start gap-3 text-xs text-amber-900">
                      <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="block text-amber-950 font-bold text-xs">
                          Cadetería en Moto — Formosa Capital
                        </strong>
                        <span>
                          Despachamos tu pedido directo a <strong>{shippingAddress}</strong> ({shippingCity}).
                        </span>
                        {shippingPostalCode.trim() !== "3600" && (
                          <p className="text-amber-800 font-semibold text-[11px] pt-1">
                            Nota: este servicio opera exclusivamente dentro del ejido urbano de Formosa Capital (CP 3600). Tu código postal actual es {shippingPostalCode}.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {shippingMethod === "CORREO_ARGENTINO_SUCURSAL" && (
                    <div className="pt-3 border-t border-slate-100 space-y-4">
                      <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200/70 flex items-start gap-2.5 text-xs text-blue-900">
                        <Store className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-blue-950 font-bold text-xs mb-0.5">
                            Retiro en Sucursal Oficial Correo Argentino (CP {shippingPostalCode})
                          </strong>
                          <span>
                            Elegí la sucursal más cercana. Tendrás 5 días hábiles desde que arribe para retirar con tu DNI ({customerDni}).
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Sucursal Oficial de Retiro *
                        </label>
                        {isLoadingAgencies ? (
                          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-500 bg-slate-50">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Buscando sucursales oficiales para el CP {shippingPostalCode}...</span>
                          </div>
                        ) : agencies.length > 0 ? (
                          <select
                            value={shippingBranchCode}
                            onChange={(e) => {
                              const code = e.target.value;
                              setShippingBranchCode(code);
                              const found = agencies.find((a) => a.code === code);
                              if (found) {
                                setShippingBranchName(
                                  `${found.name} (${found.address.streetName} ${found.address.streetNumber})`
                                );
                              }
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900 bg-white"
                          >
                            {agencies.map((agency) => (
                              <option key={agency.code} value={agency.code}>
                                {agency.name} — {agency.address.streetName} {agency.address.streetNumber}, {agency.address.city} (CP {agency.address.postalCode})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="px-3.5 py-2.5 rounded-xl border border-amber-200 text-xs text-amber-800 bg-amber-50">
                            No se encontraron sucursales oficiales para el CP {shippingPostalCode}. Podés modificar el código postal en el paso anterior o elegir Envío a Domicilio.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(shippingMethod === "CORREO_ARGENTINO" ||
                    shippingMethod === "CORREO_ARGENTINO_DOMICILIO") && (
                    <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 flex items-start gap-3 text-xs text-slate-800">
                      <Truck className="w-5 h-5 text-[#00A811] shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-slate-950 font-bold text-xs mb-0.5">
                          Envío Puerta a Puerta por Correo Argentino
                        </strong>
                        <span>
                          Tu pedido será entregado en <strong>{shippingAddress}</strong>, {shippingCity}, {shippingProvince} (CP {shippingPostalCode}).
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notas adicionales sobre el pedido o entrega (opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Retira un familiar / Timbre roto, llamar al llegar..."
                      maxLength={500}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-slate-900 resize-none"
                    />
                  </div>
                </section>

                {/* Información de Reserva */}
                <section className="bg-emerald-50/70 rounded-3xl border border-emerald-200/90 p-5 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-extrabold text-emerald-950">
                    <ShieldCheck className="w-4 h-4 text-[#00A811] shrink-0" />
                    <span>¿Cómo protegemos tu stock mientras pagás?</span>
                  </div>
                  <p className="leading-relaxed text-slate-600">
                    Al hacer clic en <strong>Continuar al Pago y Reservar Stock</strong>, bloquearemos tus unidades durante{" "}
                    <strong>15 minutos</strong> en nuestro inventario para que nadie más pueda comprarlas mientras completás el pago con Tarjeta, Mercado Pago, Transferencia o en Caja.
                  </p>
                </section>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setWizardStep(2);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a Dirección</span>
                  </button>

                  <button
                    type="submit"
                    disabled={
                      isSubmittingReservation ||
                      isValidating ||
                      Boolean(validation?.hasStockIssues)
                    }
                    className="py-3.5 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmittingReservation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Reservando stock por 15 min...</span>
                      </>
                    ) : (
                      <>
                        <span>Continuar al Pago y Reservar Stock</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-950">
                  Resumen de tu Carrito ({items.reduce((s, i) => s + i.quantity, 0)})
                </h2>
                <Truck className="w-4 h-4 text-[#00A811]" />
              </div>

              {/* Cart Items in Checkout */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {items.map((item) => {
                  const vInfo = validatedMap.get(item.variantId);
                  const hasIssue = vInfo && !vInfo.hasEnoughStock;

                  return (
                    <div
                      key={item.variantId}
                      className={`p-3 rounded-2xl border space-y-2 ${
                        hasIssue
                          ? "border-red-300 bg-red-50/50"
                          : "border-slate-100 bg-slate-50/70"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 p-1.5 shrink-0 flex items-center justify-center">
                          <img
                            src={item.imageUrl || "/placeholder-product.svg"}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-product.svg";
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                {item.brand}
                              </p>
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Talle {item.size} • {item.color}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.variantId)}
                              className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Quitar artículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center border border-slate-200 bg-white rounded-lg">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.variantId, -1)
                                }
                                className="p-1 text-slate-600 hover:text-slate-900 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.variantId, 1)
                                }
                                disabled={item.quantity >= item.availableStock}
                                className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-35 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right">
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-[10px] text-slate-400 line-through block font-medium">
                                  {formatCurrency(item.originalPrice * item.quantity)}
                                </span>
                              )}
                              <span className="text-xs font-black text-slate-900 block">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {hasIssue && vInfo?.issueMessage && (
                        <p className="text-[11px] font-bold text-red-700 bg-red-100/80 px-2.5 py-1.5 rounded-lg">
                          {vInfo.issueMessage}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal productos</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(subtotalProducts)}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-bold">
                    <span>Ahorro en ofertas:</span>
                    <span className="font-black text-emerald-700">
                      - {formatCurrency(totalSavings)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>
                    {wizardStep === 3
                      ? selectedShippingOption.title
                      : "Costo de entrega"}
                  </span>
                  <span
                    className={`font-bold ${
                      wizardStep === 3
                        ? "text-emerald-700"
                        : "text-slate-400 italic text-[11px]"
                    }`}
                  >
                    {wizardStep === 3
                      ? shippingCost === 0
                        ? "Gratis"
                        : formatCurrency(shippingCost)
                      : "Se calcula según entrega"}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-base font-black text-slate-950 pt-3 border-t border-slate-200">
                  <span>TOTAL</span>
                  <span className="text-2xl text-[#00A811]">
                    {formatCurrency(wizardStep === 3 ? totalOrder : subtotalProducts)}
                  </span>
                </div>
              </div>

              {/* Contextual Action Button */}
              {wizardStep === 1 && (
                <button
                  type="button"
                  onClick={() => handleProceedToStep2()}
                  disabled={isValidating || Boolean(validation?.hasStockIssues)}
                  className="w-full py-4 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Continuar a Dirección</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {wizardStep === 2 && (
                <button
                  type="button"
                  onClick={() => handleProceedToStep3()}
                  disabled={isValidating || Boolean(validation?.hasStockIssues)}
                  className="w-full py-4 px-6 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Continuar a Método de Entrega</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {wizardStep === 3 && (
                <button
                  type="button"
                  onClick={() => handleReserveAndGoToPayment()}
                  disabled={
                    isSubmittingReservation ||
                    isValidating ||
                    Boolean(validation?.hasStockIssues)
                  }
                  className="w-full py-4 px-6 rounded-xl bg-[#00D615] hover:bg-[#00b812] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmittingReservation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reservando stock por 15 min...</span>
                    </>
                  ) : (
                    <>
                      <span>CONTINUAR AL PAGO Y RESERVAR STOCK</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                {wizardStep === 1
                  ? "Paso 1 de 4 • Datos de contacto del comprador."
                  : wizardStep === 2
                  ? "Paso 2 de 4 • Ubicación de entrega y facturación."
                  : "Paso 3 de 4 • Al continuar, tu stock queda reservado por 15 min."}
              </p>
            </div>
          </aside>
        </div>
      </main>

      <EcommerceFooter />
    </div>
  );
}
