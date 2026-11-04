"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Building2,
  Truck,
  MapPin,
  Lock,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  Loader2,
  FileUp,
  Tag,
  Copy,
  Plus,
  Percent,
  ExternalLink,
} from "lucide-react";
import { CheckoutHeader } from "@/components/ecommerce/checkout/CheckoutHeader";
import { useCart, useCartStore } from "@/stores/cartStore";
import { formatCurrency } from "@/lib/utils";
import { createGuestOrder } from "@/server/actions/ecommerce/checkoutActions";
import { createMercadoPagoPreference } from "@/server/actions/ecommerce/mercadopagoActions";
import { ShippingMethod } from "@/schemas/ecommerce";
import { getProvinces, getLocalitiesForProvince } from "@/data/argentinaLocations";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

const SHIPPING_RATES: Record<ShippingMethod, { title: string; desc: string; cost: number }> = {
  RETIRO_LOCAL: {
    title: "Retiro gratis en local",
    desc: "Saavedra 241, Formosa Capital (Lunes a Sábado)",
    cost: 0,
  },
  CADETERIA_FORMOSA: {
    title: "Cadetería en Formosa Capital",
    desc: "Entrega puerta a puerta en el día dentro del radio urbano",
    cost: 2500,
  },
  CORREO_ARGENTINO: {
    title: "Envío por Correo Argentino",
    desc: "Envío seguro a domicilio o sucursal a todo el país (3 a 6 días)",
    cost: 7500,
  },
};

type PaymentMethodType = "CREDITO" | "DEBITO" | "MERCADO_PAGO" | "TRANSFERENCIA";

// Cross-selling complementary accessories ("Completá tu compra" style Asics)
const COMPLEMENTARY_ITEMS = [
  {
    id: "cross-1",
    name: "Visera Running Aerotech Matacos",
    brand: "Matacos Pro",
    discountTag: "35% OFF",
    price: 18500,
    originalPrice: 28500,
    image: "/placeholder-product.svg",
  },
  {
    id: "cross-2",
    name: "Cinturón Portacelular Running",
    brand: "Matacos Pro",
    discountTag: "25% OFF",
    price: 16900,
    originalPrice: 22500,
    image: "/placeholder-product.svg",
  },
  {
    id: "cross-3",
    name: "Mochila Deportiva Training 35L",
    brand: "Speedo Racing",
    discountTag: "20% OFF",
    price: 52000,
    originalPrice: 65000,
    image: "/placeholder-product.svg",
  },
  {
    id: "cross-4",
    name: "Bolso Bandolera Crossbody Pro",
    brand: "Topper",
    discountTag: "15% OFF",
    price: 33900,
    originalPrice: 39900,
    image: "/placeholder-product.svg",
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();

  // Active step in the Asics progressive stepper: 1 | 2 | 3
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [step1Completed, setStep1Completed] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);

  // ==========================================================
  // STEP 1: IDENTIFICACIÓN
  // ==========================================================
  const [email, setEmail] = useState("");
  const [emailConfirmed, setEmailConfirmed] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Granular errors per field for custom inline validation (Asics style)
  const [errorsStep1, setErrorsStep1] = useState<{
    email?: string;
    emailConfirmed?: string;
    firstName?: string;
    lastName?: string;
    dni?: string;
    phone?: string;
  }>({});

  // ==========================================================
  // STEP 2: MÉTODO DE ENTREGA
  // ==========================================================
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("RETIRO_LOCAL");
  const [postalCode, setPostalCode] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floorApt, setFloorApt] = useState("");
  const [province, setProvince] = useState("Formosa");
  const [city, setCity] = useState("Formosa Capital");
  const [recipientName, setRecipientName] = useState("");
  const [step2Error, setStep2Error] = useState<string | null>(null);

  const [errorsStep2, setErrorsStep2] = useState<{
    postalCode?: string;
    street?: string;
    streetNumber?: string;
    province?: string;
    city?: string;
    recipientName?: string;
  }>({});

  // ==========================================================
  // STEP 3: FORMA DE PAGO
  // ==========================================================
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CREDITO");

  const [errorsStep3, setErrorsStep3] = useState<{
    cardNumber?: string;
    cardHolder?: string;
    cardCvv?: string;
    cardExp?: string;
  }>({});

  // Current year & month for card expiration validation (e.g. Oct 2026 -> year 26, month 10)
  const currentYearShort = useMemo(() => new Date().getFullYear() % 100, []);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const availableYears = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => String(currentYearShort + i));
  }, [currentYearShort]);

  // Tarjeta de Crédito State
  const [creditCardNumber, setCreditCardNumber] = useState("");
  const [creditCardHolder, setCreditCardHolder] = useState("");
  const [creditCardExpMonth, setCreditCardExpMonth] = useState("12");
  const [creditCardExpYear, setCreditCardExpYear] = useState("28");
  const [creditCardCvv, setCreditCardCvv] = useState("");
  const [creditInstallments, setCreditInstallments] = useState<1 | 3 | 6>(1);
  const [sameBillingAddress, setSameBillingAddress] = useState(true);

  // Tarjeta de Débito State
  const [debitCardNumber, setDebitCardNumber] = useState("");
  const [debitCardHolder, setDebitCardHolder] = useState("");
  const [debitCardExpMonth, setDebitCardExpMonth] = useState("12");
  const [debitCardExpYear, setDebitCardExpYear] = useState("28");
  const [debitCardCvv, setDebitCardCvv] = useState("");

  // Transferencia State
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // General notes
  const [notes, setNotes] = useState("");

  // Discount coupon
  const [couponInput, setCouponInput] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponNotice, setCouponNotice] = useState<string | null>(null);

  // Form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Provinces and Localities dataset
  const allProvinces = useMemo(() => getProvinces(), []);
  const localitiesForSelectedProvince = useMemo(() => {
    return getLocalitiesForProvince(province);
  }, [province]);

  // Sync recipient name with Step 1 names
  useEffect(() => {
    if (firstName || lastName) {
      setRecipientName(`${firstName.trim()} ${lastName.trim()}`.trim());
    }
  }, [firstName, lastName]);

  // When province changes, default locality to first of that province
  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    const locs = getLocalitiesForProvince(newProvince);
    if (locs.length > 0) {
      setCity(locs[0]);
    } else {
      setCity("");
    }
  };

  // Validations for Step 1
  const isEmailValid = email.includes("@") && email.includes(".");
  const isFirstNameValid = firstName.trim().length >= 2;
  const isLastNameValid = lastName.trim().length >= 2;
  const cleanDni = dni.replace(/\D/g, "");
  const isDniValid = cleanDni.length >= 7 && cleanDni.length <= 11;
  const cleanPhone = phone.replace(/\D/g, "");
  const isPhoneValid = cleanPhone.length >= 6;

  // Validation for Step 2
  const cleanPostalCode = postalCode.replace(/\D/g, "");
  const isPostalCodeEntered = cleanPostalCode.length === 4;

  // Scroll smoothly and immediately to the header of a step
  const scrollToStep = (stepNumber: 1 | 2 | 3) => {
    // Small timeout allows React to re-render collapsing/expanding sections first
    setTimeout(() => {
      const el = document.getElementById(`step-${stepNumber}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  // Format card number with spaces (#### #### #### ####)
  const formatCardInput = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    return raw.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // Detect card issuer
  const detectCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "Mastercard";
    if (/^(34|37)/.test(clean)) return "Amex";
    if (/^(5896|6042|6043)/.test(clean)) return "Cabal";
    return null;
  };

  // Granular validator for Step 1
  const validateStep1 = () => {
    const errs: typeof errorsStep1 = {};

    // Email
    if (!email.trim()) {
      errs.email = "Este campo es obligatorio.";
    } else if (!email.includes("@") || !email.includes(".")) {
      errs.email = "Introduzca un correo electrónico válido, por favor.";
    }

    // Email confirmation
    if (!emailConfirmed) {
      errs.emailConfirmed = "Debes confirmar que el mail ingresado es correcto.";
    }

    // First Name
    if (!firstName.trim()) {
      errs.firstName = "Este campo es obligatorio.";
    } else if (firstName.trim().length < 2) {
      errs.firstName = "El nombre debe tener al menos 2 caracteres.";
    }

    // Last Name
    if (!lastName.trim()) {
      errs.lastName = "Este campo es obligatorio.";
    } else if (lastName.trim().length < 2) {
      errs.lastName = "El apellido debe tener al menos 2 caracteres.";
    }

    // DNI (sin puntos ni espacios)
    const cleanDniVal = dni.replace(/\D/g, "");
    if (!cleanDniVal) {
      errs.dni = "Este campo es obligatorio.";
    } else if (cleanDniVal.length < 7 || cleanDniVal.length > 11) {
      errs.dni = "Revisá haber cargado al menos 7 dígitos";
    }

    // Teléfono / Celular
    const cleanPhoneVal = phone.replace(/\D/g, "");
    if (!cleanPhoneVal) {
      errs.phone = "Este campo es obligatorio.";
    } else if (cleanPhoneVal.length < 6) {
      errs.phone = "Introduzca un número de teléfono válido, por favor.";
    }

    return errs;
  };

  // Granular validator for Step 2
  const validateStep2 = () => {
    const errs: typeof errorsStep2 = {};

    if (shippingMethod === "CORREO_ARGENTINO") {
      const cleanPostal = postalCode.replace(/\D/g, "");
      if (!cleanPostal) {
        errs.postalCode = "Este campo es obligatorio.";
      } else if (cleanPostal.length !== 4) {
        errs.postalCode = "El código postal debe contener exactamente 4 números (ej: 3600).";
      }

      if (!street.trim()) {
        errs.street = "Este campo es obligatorio.";
      }
      if (!streetNumber.trim()) {
        errs.streetNumber = "Este campo es obligatorio.";
      }
      if (!province.trim()) {
        errs.province = "Este campo es obligatorio.";
      }
      if (!city.trim()) {
        errs.city = "Este campo es obligatorio.";
      }
      if (!recipientName.trim()) {
        errs.recipientName = "Este campo es obligatorio.";
      }
    } else if (shippingMethod === "CADETERIA_FORMOSA") {
      if (!street.trim()) {
        errs.street = "Este campo es obligatorio.";
      }
      if (!streetNumber.trim()) {
        errs.streetNumber = "Este campo es obligatorio.";
      }
    }

    return errs;
  };

  // Granular validator for Step 3
  const validateStep3 = () => {
    const errs: typeof errorsStep3 = {};

    if (paymentMethod === "CREDITO") {
      const cleanNum = creditCardNumber.replace(/\D/g, "");
      if (!cleanNum) {
        errs.cardNumber = "Este campo es obligatorio.";
      } else if (cleanNum.length < 15) {
        errs.cardNumber = "Introduzca un número de tarjeta válido, por favor.";
      }

      if (!creditCardHolder.trim()) {
        errs.cardHolder = "Este campo es obligatorio.";
      }

      const cleanCvv = creditCardCvv.replace(/\D/g, "");
      if (!cleanCvv) {
        errs.cardCvv = "Este campo es obligatorio.";
      } else if (cleanCvv.length < 3) {
        errs.cardCvv = "Introduzca un código de seguridad válido, por favor.";
      }

      // Validar fecha de vencimiento crédito
      const expMonth = parseInt(creditCardExpMonth, 10);
      const expYear = parseInt(creditCardExpYear, 10);
      if (
        expYear < currentYearShort ||
        (expYear === currentYearShort && expMonth < currentMonth)
      ) {
        errs.cardExp = "La tarjeta se encuentra vencida. Ingrese una fecha válida.";
      }
    } else if (paymentMethod === "DEBITO") {
      const cleanNum = debitCardNumber.replace(/\D/g, "");
      if (!cleanNum) {
        errs.cardNumber = "Este campo es obligatorio.";
      } else if (cleanNum.length < 15) {
        errs.cardNumber = "Introduzca un número de tarjeta de débito válido, por favor.";
      }

      if (!debitCardHolder.trim()) {
        errs.cardHolder = "Este campo es obligatorio.";
      }

      const cleanCvv = debitCardCvv.replace(/\D/g, "");
      if (!cleanCvv) {
        errs.cardCvv = "Este campo es obligatorio.";
      } else if (cleanCvv.length < 3) {
        errs.cardCvv = "Introduzca un código de seguridad válido, por favor.";
      }

      // Validar fecha de vencimiento débito
      const expMonth = parseInt(debitCardExpMonth, 10);
      const expYear = parseInt(debitCardExpYear, 10);
      if (
        expYear < currentYearShort ||
        (expYear === currentYearShort && expMonth < currentMonth)
      ) {
        errs.cardExp = "La tarjeta se encuentra vencida. Ingrese una fecha válida.";
      }
    }

    return errs;
  };

  // Handler Step 1 -> Step 2
  const handleContinueStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error(null);

    const errs = validateStep1();
    setErrorsStep1(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setStep1Completed(true);
    setActiveStep(2);
    scrollToStep(2);
  };

  // Handler Step 2 -> Step 3
  const handleContinueStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error(null);

    const errs = validateStep2();
    setErrorsStep2(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setStep2Completed(true);
    setActiveStep(3);
    scrollToStep(3);
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Coupon apply
  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (code === "MATACOS10" || code === "ASICS10") {
      setDiscountPercent(10);
      setCouponNotice("¡Cupón del 10% de descuento aplicado con éxito!");
    } else if (code) {
      setDiscountPercent(0);
      setCouponNotice("El cupón ingresado no es válido o ha expirado.");
    }
  };

  // Cost calculations
  const rawSubtotal = cart.subtotal;
  const discountAmount = discountPercent > 0 ? (rawSubtotal * discountPercent) / 100 : 0;
  const subtotalWithDiscount = rawSubtotal - discountAmount;
  const currentShippingCost = SHIPPING_RATES[shippingMethod].cost;
  const totalAmount = subtotalWithDiscount + currentShippingCost;

  // Cuotas amounts for credit card
  const cuota1Monto = totalAmount;
  const cuota3Monto = totalAmount / 3;
  const cuota6Monto = totalAmount / 6;

  // Final Order Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    const errs = validateStep3();
    setErrorsStep3(errs);

    if (Object.keys(errs).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const shippingCost = SHIPPING_RATES[shippingMethod].cost;

      // Format combined delivery address
      let formattedAddress = "Saavedra 241, Formosa Capital";
      if (shippingMethod === "CORREO_ARGENTINO" || shippingMethod === "CADETERIA_FORMOSA") {
        formattedAddress = `${street.trim()} ${streetNumber.trim()}${
          floorApt.trim() ? `, Piso/Dpto ${floorApt.trim()}` : ""
        }`;
      }

      // Prepare items payload
      const cartItemsPayload = cart.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        expectedUnitPrice: item.unitPrice,
      }));

      // Build notes string including payment & card summary
      let paymentNotes = `Método: ${paymentMethod}`;
      if (paymentMethod === "CREDITO") {
        const last4 = creditCardNumber.replace(/\D/g, "").slice(-4);
        paymentNotes += ` | Tarjeta Crédito (**** ${last4}) en ${creditInstallments} cuota(s) fija(s)`;
      } else if (paymentMethod === "DEBITO") {
        const last4 = debitCardNumber.replace(/\D/g, "").slice(-4);
        paymentNotes += ` | Tarjeta Débito (**** ${last4}) 1 pago`;
      } else if (paymentMethod === "TRANSFERENCIA" && receiptFileName) {
        paymentNotes += ` | Comprobante adjunto: ${receiptFileName}`;
      }

      if (notes.trim()) {
        paymentNotes += ` | Indicaciones: ${notes.trim()}`;
      }

      // Call transactional Server Action with atomic stock reservation (RF-15)
      const res = await createGuestOrder({
        customerName: fullName,
        customerDni: cleanDni,
        customerEmail: email.trim().toLowerCase(),
        customerPhone: phone.trim(),
        shippingMethod,
        shippingAddress: formattedAddress,
        shippingCity: city || "Formosa Capital",
        shippingProvince: province || "Formosa",
        shippingPostalCode: cleanPostalCode || "3600",
        shippingCost,
        paymentMethod: paymentMethod === "CREDITO" ? "TARJETA_CREDITO" : paymentMethod === "DEBITO" ? "TARJETA_DEBITO" : paymentMethod,
        installments: paymentMethod === "CREDITO" ? creditInstallments : 1,
        notes: paymentNotes,
        items: cartItemsPayload,
      });

      if (!res.success || !res.data) {
        setSubmissionError(res.error || "No se pudo procesar tu orden. Por favor verificá los datos.");
        setIsSubmitting(false);
        return;
      }

      const orderData = res.data;

      // Clear cart from Zustand store
      useCartStore.getState().clearCart();

      // If Mercado Pago was selected, initiate Checkout Pro preference
      if (paymentMethod === "MERCADO_PAGO") {
        const mpRes = await createMercadoPagoPreference({
          orderCode: orderData.orderCode,
          saleId: orderData.saleId,
          items: cart.items.map((i) => ({
            title: `${i.name} (Talle ${i.size})`,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
          shippingCost,
          customerEmail: email.trim().toLowerCase(),
          customerName: fullName,
        });

        if (mpRes.success && mpRes.initPoint) {
          if (mpRes.initPoint.startsWith("/")) {
            router.push(mpRes.initPoint);
          } else {
            window.location.href = mpRes.initPoint;
          }
          return;
        }
      }

      // Default or Card/Transferencia -> go to Order confirmation page
      router.push(`/pedido/${orderData.saleId}`);
    } catch (err) {
      console.error("Error al finalizar orden:", err);
      setSubmissionError("Error de conexión al procesar la compra. Por favor reintentá en unos instantes.");
      setIsSubmitting(false);
    }
  };

  // If store is hydrating
  if (!cart.isReady) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col font-sans">
        <CheckoutHeader />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#00A811] animate-spin" />
        </div>
      </div>
    );
  }

  // If cart is empty
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex flex-col font-sans">
        <CheckoutHeader />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-white shadow-xs flex items-center justify-center mb-5 border border-slate-200">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tu carrito está vacío
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-sm">
            Para continuar con el proceso de compra, agregá algún producto desde nuestro catálogo oficial.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 px-6 py-3 rounded-full bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 shadow-lg shadow-[#00D615]/20"
          >
            <span>Ir al Catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. Header (Logo on Left, Compra Segura on Right, Sub-bar with Volver & Breadcrumbs) */}
      <CheckoutHeader />

      {/* 2. Top Promotional Bar (Matacos Deportes Brand Style: Deep Green + #00D615 + #c2f25b) */}
      <div className="bg-[#06241d] text-white py-3 px-4 border-b border-emerald-950/80 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3 sm:gap-8 text-center text-xs font-sans antialiased uppercase">
          <div className="flex items-center gap-2">
            <Percent className="w-3.5 h-3.5 text-[#00D615] shrink-0" />
            <span className="text-[#00D615] font-black tracking-wider text-xs sm:text-sm">
              3 Y 6 CUOTAS SIN INTERÉS
            </span>
            <span className="text-emerald-100/90 font-medium tracking-wide text-[11px] sm:text-xs hidden md:inline">
              | CON TODAS LAS TARJETAS BANCARIAS
            </span>
          </div>

          <span className="text-emerald-800 hidden sm:inline">•</span>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#00D615] shrink-0" />
            <span className="text-slate-100 font-bold tracking-wide text-xs">
              RETIRO GRATIS EN SAAVEDRA 241
            </span>
            <span className="text-[#c2f25b] font-black tracking-wider text-xs">
              (FORMOSA CAPITAL)
            </span>
          </div>

          <span className="text-emerald-800 hidden lg:inline">•</span>

          <div className="hidden lg:flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#00D615] shrink-0" />
            <span className="text-slate-100 font-bold tracking-wide text-xs">
              ENVÍOS A TODO EL PAÍS
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Stepper Checkout Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Global Error Banner */}
        {submissionError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm font-semibold">{submissionError}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Progressive Stepper (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* ========================================================== */}
            {/* STEP 1: IDENTIFICACIÓN (ASICS STYLE) */}
            {/* ========================================================== */}
            <div
              id="step-1"
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all scroll-mt-28 sm:scroll-mt-32"
            >
              {/* Step 1 Header */}
              <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      step1Completed
                        ? "bg-[#00A811] text-white"
                        : "bg-[#06241d] text-[#00D615] ring-2 ring-[#00D615]/30"
                    }`}
                  >
                    {step1Completed ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Identificación
                    </h2>
                  </div>
                </div>

                {step1Completed && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep(1);
                      scrollToStep(1);
                    }}
                    className="text-xs font-bold text-[#00A811] hover:underline cursor-pointer"
                  >
                    Modificar
                  </button>
                )}

                {activeStep === 1 && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    * campos requeridos
                  </span>
                )}
              </div>

              {/* Step 1 Expanded Body */}
              {activeStep === 1 ? (
                <form noValidate onSubmit={handleContinueStep1} className="p-5 sm:p-6 space-y-4">
                  <p className="text-xs text-slate-500">
                    Solicitamos únicamente la información esencial para finalizar la compra.
                  </p>

                  {step1Error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{step1Error}</span>
                    </div>
                  )}

                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errorsStep1.email) setErrorsStep1((prev) => ({ ...prev, email: undefined }));
                        }}
                        placeholder="tu-correo@ejemplo.com"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium text-slate-900 bg-white transition-colors focus:outline-none ${
                          errorsStep1.email
                            ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                            : "border-slate-300 focus:ring-2 focus:ring-[#00D615] focus:border-[#00D615]"
                        }`}
                      />
                      {isEmailValid && !errorsStep1.email && (
                        <div className="absolute right-3 top-2.5 text-[#00A811]">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    {errorsStep1.email && (
                      <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                        {errorsStep1.email}
                      </p>
                    )}
                  </div>

                  {/* Confirm Email Checkbox */}
                  <div>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={emailConfirmed}
                        onChange={(e) => {
                          setEmailConfirmed(e.target.checked);
                          if (errorsStep1.emailConfirmed) {
                            setErrorsStep1((prev) => ({ ...prev, emailConfirmed: undefined }));
                          }
                        }}
                        className={`rounded text-[#00A811] focus:ring-[#00D615] ${
                          errorsStep1.emailConfirmed ? "border-red-500" : ""
                        }`}
                      />
                      <span className={errorsStep1.emailConfirmed ? "text-red-500 font-medium" : ""}>
                        Confirmo que el mail ingresado es correcto *
                      </span>
                    </label>
                    {errorsStep1.emailConfirmed && (
                      <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                        {errorsStep1.emailConfirmed}
                      </p>
                    )}
                  </div>

                  {/* Name and Last Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value);
                            if (errorsStep1.firstName) setErrorsStep1((prev) => ({ ...prev, firstName: undefined }));
                          }}
                          placeholder="Ej: Juan"
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium text-slate-900 bg-white transition-colors focus:outline-none ${
                            errorsStep1.firstName
                              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                              : "border-slate-300 focus:ring-2 focus:ring-[#00D615] focus:border-[#00D615]"
                          }`}
                        />
                        {isFirstNameValid && !errorsStep1.firstName && (
                          <div className="absolute right-3 top-2.5 text-[#00A811]">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {errorsStep1.firstName && (
                        <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                          {errorsStep1.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Apellidos *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value);
                            if (errorsStep1.lastName) setErrorsStep1((prev) => ({ ...prev, lastName: undefined }));
                          }}
                          placeholder="Ej: Pérez"
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium text-slate-900 bg-white transition-colors focus:outline-none ${
                            errorsStep1.lastName
                              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                              : "border-slate-300 focus:ring-2 focus:ring-[#00D615] focus:border-[#00D615]"
                          }`}
                        />
                        {isLastNameValid && !errorsStep1.lastName && (
                          <div className="absolute right-3 top-2.5 text-[#00A811]">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {errorsStep1.lastName && (
                        <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                          {errorsStep1.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DNI and Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        DNI (sin puntos ni espacios) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={dni}
                          onChange={(e) => {
                            setDni(e.target.value);
                            if (errorsStep1.dni) setErrorsStep1((prev) => ({ ...prev, dni: undefined }));
                          }}
                          placeholder="Ej: 35123456"
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium text-slate-900 bg-white transition-colors focus:outline-none ${
                            errorsStep1.dni
                              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                              : "border-slate-300 focus:ring-2 focus:ring-[#00D615] focus:border-[#00D615]"
                          }`}
                        />
                        {isDniValid && !errorsStep1.dni && (
                          <div className="absolute right-3 top-2.5 text-[#00A811]">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {errorsStep1.dni ? (
                        <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                          {errorsStep1.dni}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Revisá haber cargado al menos 7 dígitos
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teléfono / Celular *
                      </label>
                      <div className="flex gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-2 rounded-lg border bg-slate-100 text-xs font-mono font-bold ${
                            errorsStep1.phone ? "border-red-500 text-red-500" : "border-slate-300 text-slate-600"
                          }`}
                        >
                          +54
                        </span>
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              if (errorsStep1.phone) setErrorsStep1((prev) => ({ ...prev, phone: undefined }));
                            }}
                            placeholder="3704123456"
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-medium text-slate-900 bg-white transition-colors focus:outline-none ${
                              errorsStep1.phone
                                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                : "border-slate-300 focus:ring-2 focus:ring-[#00D615] focus:border-[#00D615]"
                            }`}
                          />
                          {isPhoneValid && !errorsStep1.phone && (
                            <div className="absolute right-3 top-2.5 text-[#00A811]">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                      {errorsStep1.phone && (
                        <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                          {errorsStep1.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Newsletter & Legal Disclaimer */}
                  <div className="pt-2 space-y-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={subscribeNewsletter}
                        onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                        className="rounded text-[#00A811] focus:ring-[#00D615]"
                      />
                      <span>Enterate de todas nuestras ofertas y novedades por e-mail.</span>
                    </label>

                    <p className="text-[11px] text-slate-400">
                      Al enviar los datos, acepto los Términos y Condiciones de Matacos Deportes.
                    </p>
                  </div>

                  {/* Continuar Button (Matacos Green Style) */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full sm:w-64 py-3.5 px-6 rounded-full bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all cursor-pointer"
                    >
                      <span>Continuar</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </form>
              ) : step1Completed ? (
                /* Step 1 Collapsed Summary */
                <div className="p-4 sm:p-5 text-xs text-slate-600 bg-emerald-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900">
                      {firstName} {lastName}
                    </span>{" "}
                    (DNI: {cleanDni}) • <span className="text-slate-700">{email}</span> •{" "}
                    <span className="font-mono text-slate-800">Cel: +54 {phone}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ========================================================== */}
            {/* STEP 2: MÉTODO DE ENTREGA (ASICS & CORREO ARGENTINO STYLE) */}
            {/* ========================================================== */}
            <div
              id="step-2"
              className={`bg-white rounded-2xl border transition-all scroll-mt-28 sm:scroll-mt-32 ${
                !step1Completed
                  ? "border-slate-200/60 opacity-80"
                  : "border-slate-200 shadow-2xs"
              }`}
            >
              {/* Step 2 Header */}
              <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      step2Completed
                        ? "bg-[#00A811] text-white"
                        : activeStep === 2
                        ? "bg-[#06241d] text-[#00D615] ring-2 ring-[#00D615]/30"
                        : "border border-slate-300 text-slate-400 bg-white"
                    }`}
                  >
                    {step2Completed ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
                  </div>
                  <div>
                    <h2
                      className={`text-base sm:text-lg font-bold tracking-tight ${
                        !step1Completed ? "text-slate-400" : "text-slate-900"
                      }`}
                    >
                      Método de entrega
                    </h2>
                  </div>
                </div>

                {step2Completed && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep(2);
                      scrollToStep(2);
                    }}
                    className="text-xs font-bold text-[#00A811] hover:underline cursor-pointer"
                  >
                    Modificar
                  </button>
                )}
              </div>

              {/* Step 2 Expanded Body (Only if step1Completed and activeStep === 2) */}
              {step1Completed && activeStep === 2 ? (
                <form noValidate onSubmit={handleContinueStep2} className="p-5 sm:p-6 space-y-5">
                  {step2Error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{step2Error}</span>
                    </div>
                  )}

                  {/* 3 Shipping Options */}
                  <div className="space-y-3">
                    {(Object.keys(SHIPPING_RATES) as ShippingMethod[]).map((method) => {
                      const rate = SHIPPING_RATES[method];
                      const isSelected = shippingMethod === method;

                      return (
                        <label
                          key={method}
                          onClick={() => {
                            setShippingMethod(method);
                            setErrorsStep2({});
                          }}
                          className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#00D615] bg-emerald-50/40 ring-1 ring-[#00D615]"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={isSelected}
                              onChange={() => {
                                setShippingMethod(method);
                                setErrorsStep2({});
                              }}
                              className="mt-1 text-[#00A811] focus:ring-[#00D615]"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                {method === "RETIRO_LOCAL" ? (
                                  <MapPin className="w-4 h-4 text-[#00A811]" />
                                ) : (
                                  <Truck className="w-4 h-4 text-slate-700" />
                                )}
                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                  {rate.title}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{rate.desc}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs sm:text-sm font-black ${
                                rate.cost === 0 ? "text-[#00A811]" : "text-slate-900"
                              }`}
                            >
                              {rate.cost === 0 ? "GRATIS" : formatCurrency(rate.cost)}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Correo Argentino Progressive Flow (CP First -> Form Fields with Searchable Province/Locality) */}
                  {shippingMethod === "CORREO_ARGENTINO" && (
                    <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Código postal *
                        </label>
                        <div className="relative max-w-xs">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            value={postalCode}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                              setPostalCode(digits);
                              if (errorsStep2.postalCode) {
                                setErrorsStep2((prev) => ({ ...prev, postalCode: undefined }));
                              }
                            }}
                            placeholder="Ej: 3600"
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-xs font-mono font-medium text-slate-900 transition-colors focus:outline-none ${
                              errorsStep2.postalCode
                                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                : "border-slate-300 focus:ring-2 focus:ring-[#00D615] focus:border-[#00D615]"
                            }`}
                          />
                          {isPostalCodeEntered && !errorsStep2.postalCode && (
                            <div className="absolute right-3 top-2.5 text-[#00A811]">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        {/* Link to Correo Argentino official CPA */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                          <a
                            href="https://www.correoargentino.com.ar/formularios/cpa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-700 hover:text-sky-900 font-semibold underline inline-flex items-center gap-1"
                          >
                            <span>No sé mi código postal</span>
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </div>
                        {errorsStep2.postalCode && (
                          <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                            {errorsStep2.postalCode}
                          </p>
                        )}
                      </div>

                      {/* Display delivery address inputs once CP is entered */}
                      {isPostalCodeEntered ? (
                        <div className="space-y-3.5 pt-2 border-t border-slate-100 animate-in fade-in zoom-in-98 duration-200">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Complete su dirección de entrega
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Calle *
                              </label>
                              <input
                                type="text"
                                value={street}
                                onChange={(e) => {
                                  setStreet(e.target.value);
                                  if (errorsStep2.street) {
                                    setErrorsStep2((prev) => ({ ...prev, street: undefined }));
                                  }
                                }}
                                placeholder="Nombre de calle o avenida"
                                className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none ${
                                  errorsStep2.street
                                    ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                    : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                                }`}
                              />
                              {errorsStep2.street && (
                                <p className="text-red-500 text-[11px] mt-1 font-medium animate-in fade-in duration-150">
                                  {errorsStep2.street}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Número *
                              </label>
                              <input
                                type="text"
                                value={streetNumber}
                                onChange={(e) => {
                                  setStreetNumber(e.target.value);
                                  if (errorsStep2.streetNumber) {
                                    setErrorsStep2((prev) => ({ ...prev, streetNumber: undefined }));
                                  }
                                }}
                                placeholder="1234"
                                className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none ${
                                  errorsStep2.streetNumber
                                    ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                    : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                                }`}
                              />
                              {errorsStep2.streetNumber && (
                                <p className="text-red-500 text-[11px] mt-1 font-medium animate-in fade-in duration-150">
                                  {errorsStep2.streetNumber}
                                </p>
                              )}
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Piso o departamento (Opcional)
                              </label>
                              <input
                                type="text"
                                value={floorApt}
                                onChange={(e) => setFloorApt(e.target.value)}
                                placeholder="Ej: Piso 2 Dpto B"
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00D615] text-xs text-slate-900"
                              />
                            </div>

                            {/* Searchable Province Dropdown */}
                            <div className="sm:col-span-3">
                              <SearchableSelect
                                label="Provincia"
                                required
                                options={allProvinces}
                                value={province}
                                onChange={(newProv) => {
                                  handleProvinceChange(newProv);
                                  if (errorsStep2.province) {
                                    setErrorsStep2((prev) => ({ ...prev, province: undefined }));
                                  }
                                }}
                                placeholder="Selecciona una provincia"
                                error={errorsStep2.province}
                              />
                            </div>

                            {/* Searchable City/Locality Dropdown */}
                            <div className="sm:col-span-3">
                              <SearchableSelect
                                label="Ciudad / Localidad"
                                required
                                options={localitiesForSelectedProvince}
                                value={city}
                                onChange={(newCity) => {
                                  setCity(newCity);
                                  if (errorsStep2.city) {
                                    setErrorsStep2((prev) => ({ ...prev, city: undefined }));
                                  }
                                }}
                                placeholder={
                                  province
                                    ? "Selecciona una localidad"
                                    : "Primero selecciona una provincia"
                                }
                                disabled={!province}
                                allowCustomValue={true}
                                error={errorsStep2.city}
                              />
                            </div>

                            {/* Destinatario */}
                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Destinatario *
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={recipientName}
                                  onChange={(e) => {
                                    setRecipientName(e.target.value);
                                    if (errorsStep2.recipientName) {
                                      setErrorsStep2((prev) => ({ ...prev, recipientName: undefined }));
                                    }
                                  }}
                                  placeholder="Nombre completo de quien recibe"
                                  className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 uppercase font-semibold transition-colors focus:outline-none ${
                                    errorsStep2.recipientName
                                      ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                      : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                                  }`}
                                />
                                {recipientName.trim().length >= 3 && !errorsStep2.recipientName && (
                                  <div className="absolute right-3 top-2 text-[#00A811]">
                                    <Check className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              {errorsStep2.recipientName && (
                                <p className="text-red-500 text-[11px] mt-1 font-medium animate-in fade-in duration-150">
                                  {errorsStep2.recipientName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Ingresá tu código postal para habilitar los casilleros de dirección y provincia.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cadetería en Formosa Capital Address Fields */}
                  {shippingMethod === "CADETERIA_FORMOSA" && (
                    <div className="pt-4 border-t border-slate-100 space-y-3.5 animate-in fade-in duration-200">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Dirección para cadetería en Formosa Capital
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Calle *
                          </label>
                          <input
                            type="text"
                            value={street}
                            onChange={(e) => {
                              setStreet(e.target.value);
                              if (errorsStep2.street) {
                                setErrorsStep2((prev) => ({ ...prev, street: undefined }));
                              }
                            }}
                            placeholder="Ej: Av. 25 de Mayo"
                            className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none ${
                              errorsStep2.street
                                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                            }`}
                          />
                          {errorsStep2.street && (
                            <p className="text-red-500 text-[11px] mt-1 font-medium animate-in fade-in duration-150">
                              {errorsStep2.street}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Número *
                          </label>
                          <input
                            type="text"
                            value={streetNumber}
                            onChange={(e) => {
                              setStreetNumber(e.target.value);
                              if (errorsStep2.streetNumber) {
                                setErrorsStep2((prev) => ({ ...prev, streetNumber: undefined }));
                              }
                            }}
                            placeholder="1234"
                            className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 transition-colors focus:outline-none ${
                              errorsStep2.streetNumber
                                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                            }`}
                          />
                          {errorsStep2.streetNumber && (
                            <p className="text-red-500 text-[11px] mt-1 font-medium animate-in fade-in duration-150">
                              {errorsStep2.streetNumber}
                            </p>
                          )}
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Piso o departamento (Opcional)
                          </label>
                          <input
                            type="text"
                            value={floorApt}
                            onChange={(e) => setFloorApt(e.target.value)}
                            placeholder="Ej: Dpto 2B"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00D615] text-xs text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Continuar al Pago Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full sm:w-64 py-3.5 px-6 rounded-full bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D615]/20 transition-all cursor-pointer"
                    >
                      <span>Continuar al Pago</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </form>
              ) : step2Completed ? (
                /* Step 2 Collapsed Summary */
                <div className="p-4 sm:p-5 text-xs text-slate-600 bg-emerald-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900">
                      {SHIPPING_RATES[shippingMethod].title}
                    </span>{" "}
                    ({SHIPPING_RATES[shippingMethod].cost === 0 ? "Gratis" : formatCurrency(SHIPPING_RATES[shippingMethod].cost)})
                    {shippingMethod !== "RETIRO_LOCAL" && street && (
                      <span className="block sm:inline text-slate-500">
                        {" "}
                        • {street} {streetNumber}
                        {floorApt ? ` (${floorApt})` : ""}, {city} (CP {postalCode || "3600"})
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* ========================================================== */}
            {/* STEP 3: PAGO (ASICS STYLE: CRÉDITO, DÉBITO, MP, TRANSF) */}
            {/* ========================================================== */}
            <div
              id="step-3"
              className={`bg-white rounded-2xl border transition-all scroll-mt-28 sm:scroll-mt-32 ${
                !step2Completed
                  ? "border-slate-200/60 opacity-80"
                  : "border-slate-200 shadow-2xs"
              }`}
            >
              {/* Step 3 Header */}
              <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      activeStep === 3
                        ? "bg-[#06241d] text-[#00D615] ring-2 ring-[#00D615]/30"
                        : "border border-slate-300 text-slate-400 bg-white"
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <h2
                      className={`text-base sm:text-lg font-bold tracking-tight ${
                        !step2Completed ? "text-slate-400" : "text-slate-900"
                      }`}
                    >
                      Pago
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="w-3.5 h-3.5 text-[#00A811]" />
                  <span>Transacción Encriptada</span>
                </div>
              </div>

              {/* Step 3 Expanded Body */}
              {step2Completed && activeStep === 3 && (
                <form noValidate onSubmit={handleFinalSubmit} className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
                  {/* Payment Methods Tabs (4 Grid Buttons - Asics Style) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* 1. Tarjeta de Crédito */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("CREDITO");
                        setErrorsStep3({});
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        paymentMethod === "CREDITO"
                          ? "border-[#00D615] bg-emerald-50/50 ring-2 ring-[#00D615] text-slate-950 font-bold"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 mb-1.5 ${paymentMethod === "CREDITO" ? "text-[#00A811]" : "text-slate-500"}`} />
                      <span className="text-xs">Tarjeta de crédito</span>
                      <span className="text-[10px] text-emerald-700 font-extrabold mt-0.5">3 y 6 cuotas</span>
                    </button>

                    {/* 2. Tarjeta de Débito */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("DEBITO");
                        setErrorsStep3({});
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        paymentMethod === "DEBITO"
                          ? "border-[#00D615] bg-emerald-50/50 ring-2 ring-[#00D615] text-slate-950 font-bold"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 mb-1.5 ${paymentMethod === "DEBITO" ? "text-[#00A811]" : "text-slate-500"}`} />
                      <span className="text-xs">Tarjeta de débito</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">1 pago directo</span>
                    </button>

                    {/* 3. Mercado Pago */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("MERCADO_PAGO");
                        setErrorsStep3({});
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        paymentMethod === "MERCADO_PAGO"
                          ? "border-[#00D615] bg-emerald-50/50 ring-2 ring-[#00D615] text-slate-950 font-bold"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                      }`}
                    >
                      <div className="w-5 h-5 mb-1.5 rounded-full bg-sky-500 text-white flex items-center justify-center font-black text-[10px]">
                        MP
                      </div>
                      <span className="text-xs">Mercado Pago</span>
                      <span className="text-[10px] text-sky-700 font-semibold mt-0.5">Checkout Pro</span>
                    </button>

                    {/* 4. Transferencia Bancaria */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod("TRANSFERENCIA");
                        setErrorsStep3({});
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        paymentMethod === "TRANSFERENCIA"
                          ? "border-[#00D615] bg-emerald-50/50 ring-2 ring-[#00D615] text-slate-950 font-bold"
                          : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                      }`}
                    >
                      <Building2 className={`w-5 h-5 mb-1.5 ${paymentMethod === "TRANSFERENCIA" ? "text-[#00A811]" : "text-slate-500"}`} />
                      <span className="text-xs">Transferencia</span>
                      <span className="text-[10px] text-emerald-800 font-semibold mt-0.5">CBU / Alias</span>
                    </button>
                  </div>

                  {/* ================================================== */}
                  {/* OPTION A: TARJETA DE CRÉDITO */}
                  {/* ================================================== */}
                  {paymentMethod === "CREDITO" && (
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800">
                          Datos de la Tarjeta de Crédito
                        </span>
                        {detectCardBrand(creditCardNumber) && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black">
                            {detectCardBrand(creditCardNumber)}
                          </span>
                        )}
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Número de tarjeta *
                        </label>
                        <input
                          type="text"
                          value={creditCardNumber}
                          onChange={(e) => {
                            setCreditCardNumber(formatCardInput(e.target.value));
                            if (errorsStep3.cardNumber) {
                              setErrorsStep3((prev) => ({ ...prev, cardNumber: undefined }));
                            }
                          }}
                          placeholder="0000 0000 0000 0000"
                          className={`w-full px-3 py-2 rounded-lg border text-xs font-mono tracking-widest text-slate-900 bg-white transition-colors focus:outline-none ${
                            errorsStep3.cardNumber
                              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                              : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                          }`}
                        />
                        {errorsStep3.cardNumber && (
                          <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                            {errorsStep3.cardNumber}
                          </p>
                        )}
                      </div>

                      {/* Cuotas Disponibles Selector (Requested explicitly by user) */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Cuotas disponibles *
                        </label>
                        <select
                          value={creditInstallments}
                          onChange={(e) => setCreditInstallments(Number(e.target.value) as 1 | 3 | 6)}
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00D615] text-xs font-bold text-slate-900 bg-white cursor-pointer"
                        >
                          <option value={1}>
                            1 cuota de {formatCurrency(cuota1Monto)} — Total: {formatCurrency(totalAmount)}
                          </option>
                          <option value={3}>
                            3 cuotas fijas de {formatCurrency(cuota3Monto)} — Total: {formatCurrency(totalAmount)}
                          </option>
                          <option value={6}>
                            6 cuotas fijas de {formatCurrency(cuota6Monto)} — Total: {formatCurrency(totalAmount)}
                          </option>
                        </select>
                      </div>

                      {/* Cardholder Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nombre y Apellido como figura en la tarjeta *
                        </label>
                        <input
                          type="text"
                          value={creditCardHolder}
                          onChange={(e) => {
                            setCreditCardHolder(e.target.value.toUpperCase());
                            if (errorsStep3.cardHolder) {
                              setErrorsStep3((prev) => ({ ...prev, cardHolder: undefined }));
                            }
                          }}
                          placeholder="JUAN PEREZ"
                          className={`w-full px-3 py-2 rounded-lg border text-xs uppercase font-medium text-slate-900 bg-white transition-colors focus:outline-none ${
                            errorsStep3.cardHolder
                              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                              : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                          }`}
                        />
                        {errorsStep3.cardHolder && (
                          <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                            {errorsStep3.cardHolder}
                          </p>
                        )}
                      </div>

                      {/* Expiration & CVV */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Fecha de Vencimiento *
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={creditCardExpMonth}
                              onChange={(e) => {
                                setCreditCardExpMonth(e.target.value);
                                if (errorsStep3.cardExp) {
                                  setErrorsStep3((prev) => ({ ...prev, cardExp: undefined }));
                                }
                              }}
                              className={`w-1/2 px-2 py-2 rounded-lg border text-xs font-bold text-slate-900 bg-white transition-colors focus:outline-none ${
                                errorsStep3.cardExp
                                  ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                  : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                              }`}
                            >
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(
                                (m) => {
                                  const isExpired =
                                    Number(creditCardExpYear) === currentYearShort &&
                                    Number(m) < currentMonth;
                                  return (
                                    <option key={m} value={m} disabled={isExpired}>
                                      {m} {isExpired ? "(Vencido)" : ""}
                                    </option>
                                  );
                                }
                              )}
                            </select>
                            <span className="text-slate-400 font-bold">/</span>
                            <select
                              value={creditCardExpYear}
                              onChange={(e) => {
                                const newYear = e.target.value;
                                setCreditCardExpYear(newYear);
                                if (
                                  Number(newYear) === currentYearShort &&
                                  Number(creditCardExpMonth) < currentMonth
                                ) {
                                  setCreditCardExpMonth(String(currentMonth).padStart(2, "0"));
                                }
                                if (errorsStep3.cardExp) {
                                  setErrorsStep3((prev) => ({ ...prev, cardExp: undefined }));
                                }
                              }}
                              className={`w-1/2 px-2 py-2 rounded-lg border text-xs font-bold text-slate-900 bg-white transition-colors focus:outline-none ${
                                errorsStep3.cardExp
                                  ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                  : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                              }`}
                            >
                              {availableYears.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </div>
                          {errorsStep3.cardExp && (
                            <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                              {errorsStep3.cardExp}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Código de Seguridad *
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={creditCardCvv}
                            onChange={(e) => {
                              setCreditCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
                              if (errorsStep3.cardCvv) {
                                setErrorsStep3((prev) => ({ ...prev, cardCvv: undefined }));
                              }
                            }}
                            placeholder="CVV"
                            className={`w-full px-3 py-2 rounded-lg border text-xs font-mono text-slate-900 bg-white transition-colors focus:outline-none ${
                              errorsStep3.cardCvv
                                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                            }`}
                          />
                          {errorsStep3.cardCvv && (
                            <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                              {errorsStep3.cardCvv}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Same billing address checkbox */}
                      <label className="flex items-center gap-2 text-xs text-slate-600 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameBillingAddress}
                          onChange={(e) => setSameBillingAddress(e.target.checked)}
                          className="rounded text-[#00A811] focus:ring-[#00D615]"
                        />
                        <span>La dirección de la factura de la tarjeta es la misma que la de entrega</span>
                      </label>
                    </div>
                  )}

                  {/* ================================================== */}
                  {/* OPTION B: TARJETA DE DÉBITO */}
                  {/* ================================================== */}
                  {paymentMethod === "DEBITO" && (
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800">
                          Datos de la Tarjeta de Débito (1 Pago Directo)
                        </span>
                        {detectCardBrand(debitCardNumber) && (
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black">
                            {detectCardBrand(debitCardNumber)}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Número de tarjeta de débito *
                        </label>
                        <input
                          type="text"
                          value={debitCardNumber}
                          onChange={(e) => {
                            setDebitCardNumber(formatCardInput(e.target.value));
                            if (errorsStep3.cardNumber) {
                              setErrorsStep3((prev) => ({ ...prev, cardNumber: undefined }));
                            }
                          }}
                          placeholder="0000 0000 0000 0000"
                          className={`w-full px-3 py-2 rounded-lg border text-xs font-mono tracking-widest text-slate-900 bg-white transition-colors focus:outline-none ${
                            errorsStep3.cardNumber
                              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                              : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                          }`}
                        />
                        {errorsStep3.cardNumber && (
                          <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                            {errorsStep3.cardNumber}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Titular como figura en la tarjeta *
                        </label>
                        <input
                          type="text"
                          value={debitCardHolder}
                          onChange={(e) => {
                            setDebitCardHolder(e.target.value.toUpperCase());
                            if (errorsStep3.cardHolder) {
                              setErrorsStep3((prev) => ({ ...prev, cardHolder: undefined }));
                            }
                          }}
                          placeholder="JUAN PEREZ"
                          className={`w-full px-3 py-2 rounded-lg border text-xs uppercase font-medium text-slate-900 bg-white transition-colors focus:outline-none ${
                            errorsStep3.cardHolder
                              ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                              : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                          }`}
                        />
                        {errorsStep3.cardHolder && (
                          <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                            {errorsStep3.cardHolder}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Vencimiento *
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={debitCardExpMonth}
                              onChange={(e) => {
                                setDebitCardExpMonth(e.target.value);
                                if (errorsStep3.cardExp) {
                                  setErrorsStep3((prev) => ({ ...prev, cardExp: undefined }));
                                }
                              }}
                              className={`w-1/2 px-2 py-2 rounded-lg border text-xs font-bold text-slate-900 bg-white transition-colors focus:outline-none ${
                                errorsStep3.cardExp
                                  ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                  : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                              }`}
                            >
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(
                                (m) => {
                                  const isExpired =
                                    Number(debitCardExpYear) === currentYearShort &&
                                    Number(m) < currentMonth;
                                  return (
                                    <option key={m} value={m} disabled={isExpired}>
                                      {m} {isExpired ? "(Vencido)" : ""}
                                    </option>
                                  );
                                }
                              )}
                            </select>
                            <span className="text-slate-400 font-bold">/</span>
                            <select
                              value={debitCardExpYear}
                              onChange={(e) => {
                                const newYear = e.target.value;
                                setDebitCardExpYear(newYear);
                                if (
                                  Number(newYear) === currentYearShort &&
                                  Number(debitCardExpMonth) < currentMonth
                                ) {
                                  setDebitCardExpMonth(String(currentMonth).padStart(2, "0"));
                                }
                                if (errorsStep3.cardExp) {
                                  setErrorsStep3((prev) => ({ ...prev, cardExp: undefined }));
                                }
                              }}
                              className={`w-1/2 px-2 py-2 rounded-lg border text-xs font-bold text-slate-900 bg-white transition-colors focus:outline-none ${
                                errorsStep3.cardExp
                                  ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                  : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                              }`}
                            >
                              {availableYears.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </div>
                          {errorsStep3.cardExp && (
                            <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                              {errorsStep3.cardExp}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Código de Seguridad *
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={debitCardCvv}
                            onChange={(e) => {
                              setDebitCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
                              if (errorsStep3.cardCvv) {
                                setErrorsStep3((prev) => ({ ...prev, cardCvv: undefined }));
                              }
                            }}
                            placeholder="CVV"
                            className={`w-full px-3 py-2 rounded-lg border text-xs font-mono text-slate-900 bg-white transition-colors focus:outline-none ${
                              errorsStep3.cardCvv
                                ? "border-red-500 focus:ring-2 focus:ring-red-400 focus:border-red-500"
                                : "border-slate-300 focus:ring-2 focus:ring-[#00D615]"
                            }`}
                          />
                          {errorsStep3.cardCvv && (
                            <p className="text-red-500 text-xs mt-1 font-medium animate-in fade-in duration-150">
                              {errorsStep3.cardCvv}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================================================== */}
                  {/* OPTION C: MERCADO PAGO (PROMINENT BOTÓN "Pagar con Mercado Pago") */}
                  {/* ================================================== */}
                  {paymentMethod === "MERCADO_PAGO" && (
                    <div className="p-4 sm:p-5 rounded-xl border border-sky-200 bg-sky-50/50 space-y-4 animate-in fade-in duration-200 text-xs">
                      <div className="flex items-center gap-2 text-sky-950 font-bold">
                        <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center font-black text-xs">
                          MP
                        </div>
                        <span>Checkout Pro de Mercado Pago</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Serás dirigido a la plataforma oficial y segura de Mercado Pago para abonar con
                        dinero en cuenta, tarjetas bancarias en cuotas o en puntos de efectivo (Pago Fácil / Rapipago).
                      </p>
                      <div className="p-3 rounded-lg bg-white border border-sky-100 flex items-center justify-between font-medium">
                        <span className="text-slate-600">Total a procesar:</span>
                        <strong className="text-base text-slate-950">{formatCurrency(totalAmount)}</strong>
                      </div>
                    </div>
                  )}

                  {/* ================================================== */}
                  {/* OPTION D: TRANSFERENCIA BANCARIA */}
                  {/* ================================================== */}
                  {paymentMethod === "TRANSFERENCIA" && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 animate-in fade-in duration-200">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#00A811]" />
                        <span>Datos bancarios oficiales para transferir:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white p-3 rounded-lg border border-slate-200 font-mono">
                        <div>
                          <span className="text-slate-400 block font-sans">Banco:</span>
                          <strong className="text-slate-900">Banco Formosa / Macro</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-sans">Titular:</span>
                          <strong className="text-slate-900">MUJICA SANDRA ISABEL</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-sans">CUIT:</span>
                          <strong className="text-slate-900">27-18036080-3</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-sans">Importe:</span>
                          <strong className="text-[#00A811] text-sm font-black">{formatCurrency(totalAmount)}</strong>
                        </div>
                        <div className="sm:col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span>Alias: <strong className="text-[#00A811]">MATACOS.DEPORTES</strong></span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard("MATACOS.DEPORTES", "alias")}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold cursor-pointer"
                          >
                            {copiedKey === "alias" ? "¡Copiado!" : "Copiar Alias"}
                          </button>
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-between">
                          <span>CBU: <strong className="text-slate-800">0110248430024812345678</strong></span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard("0110248430024812345678", "cbu")}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold cursor-pointer"
                          >
                            {copiedKey === "cbu" ? "¡Copiado!" : "Copiar CBU"}
                          </button>
                        </div>
                      </div>

                      {/* File upload for receipt */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Adjuntar comprobante de pago (Opcional):
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors">
                            <FileUp className="w-4 h-4 text-slate-500" />
                            <span>Seleccionar archivo</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setReceiptFileName(e.target.files[0].name);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                          {receiptFileName && (
                            <span className="text-xs text-[#00A811] font-bold truncate max-w-xs">
                              {receiptFileName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Aclaraciones o notas para la entrega (Opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ej: Dejar en portería o tocar timbre en horario comercial..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00D615] focus:border-[#00D615] text-xs text-slate-900 bg-white"
                    />
                  </div>

                  {/* Action Button: Custom for Mercado Pago or Standard */}
                  <div className="pt-2">
                    {paymentMethod === "MERCADO_PAGO" ? (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-6 rounded-full bg-[#009ee3] hover:bg-[#0089c7] active:scale-98 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#009ee3]/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                            <span>CONECTANDO CON MERCADO PAGO...</span>
                          </>
                        ) : (
                          <>
                            <span>PAGAR CON MERCADO PAGO — {formatCurrency(totalAmount)}</span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 px-6 rounded-full bg-[#00D615] hover:bg-[#00b812] active:scale-98 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#00D615]/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
                            <span>PROCESANDO RESERVA DE STOCK...</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {paymentMethod === "TRANSFERENCIA"
                                ? `CONFIRMAR ORDEN POR TRANSFERENCIA — ${formatCurrency(totalAmount)}`
                                : `FINALIZAR COMPRA — ${formatCurrency(totalAmount)}`}
                            </span>
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Order Summary (5 Cols - Asics Style) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5 lg:sticky lg:top-32 max-h-[calc(100vh-9rem)] overflow-y-auto">
              <h3 className="text-base font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100">
                Resumen de la compra
              </h3>

              {/* Items List */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <div key={item.variantId} className="flex gap-3.5 items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnail with quantity badge like Asics */}
                      <div className="relative w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={item.image || "/placeholder-product.svg"}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-700 flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                          {item.color && <p>Color: {item.color}</p>}
                          {item.size && <p>Talle: {item.size}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount Coupon (Asics Style) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs text-slate-600 mb-1.5 font-medium">
                  Cupón de descuento
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Código"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00D615]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
                {couponNotice && (
                  <p
                    className={`text-[11px] mt-1.5 font-medium ${
                      discountPercent > 0 ? "text-[#00A811]" : "text-amber-700"
                    }`}
                  >
                    {couponNotice}
                  </p>
                )}
              </div>

              {/* Totals Breakdown */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(rawSubtotal)}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex items-center justify-between text-[#00A811] font-semibold">
                    <span>Descuento cupón ({discountPercent}%)</span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>Envío ({SHIPPING_RATES[shippingMethod].title})</span>
                  <span
                    className={`font-semibold ${
                      currentShippingCost === 0 ? "text-[#00A811] font-bold" : "text-slate-800"
                    }`}
                  >
                    {currentShippingCost === 0 ? "Gratis" : formatCurrency(currentShippingCost)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-base font-black text-slate-950 pt-3 border-t border-slate-200">
                  <span className="text-base font-bold">Total</span>
                  <span className="text-xl sm:text-2xl font-black text-[#00A811]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* 4. Bottom Section: "Completá tu compra" (Asics Style) */}
        {/* ========================================================== */}
        <section className="mt-14 pt-8 border-t border-slate-200">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Completá tu compra
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accesorios esenciales con ofertas especiales para sumar a tu pedido.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COMPLEMENTARY_ITEMS.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between group hover:border-[#00D615] transition-all"
              >
                <div>
                  {/* Discount tag badge with Matacos Green */}
                  <span className="inline-block px-2 py-0.5 rounded bg-[#06241d] text-[#00D615] text-[10px] font-black tracking-wide mb-3">
                    {item.discountTag}
                  </span>

                  {/* Product Image */}
                  <div className="w-full h-32 rounded-xl bg-slate-50 flex items-center justify-center p-2 mb-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {item.brand}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">
                    {item.name}
                  </h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {formatCurrency(item.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatCurrency(item.originalPrice)}
                    </span>
                  </div>

                  <Link
                    href="/catalogo"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-[#00D615] hover:text-slate-950 text-slate-700 transition-colors"
                    title="Ver en catálogo"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 5. Minimal Checkout Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700">
            Matacos Deportes • Saavedra 241, Formosa Capital, Argentina
          </p>
          <p className="text-[11px] text-slate-400">
            Transacciones seguras procesadas con encriptación SSL de 256 bits.
          </p>
        </div>
      </footer>
    </div>
  );
}
