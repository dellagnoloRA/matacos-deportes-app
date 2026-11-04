/**
 * Configuración comercial y fiscal de Matacos Deportes
 * Centraliza los datos del emisor, punto de venta y políticas para tickets de venta (RF-10)
 * y variables de contacto para asistencia contextual y contingencia por WhatsApp (RF-18).
 * Todos los valores sensibles o configurables se leen de variables de entorno (.env).
 */

export const COMPANY_COUNTRY_CODE = "54";
export const COMPANY_MOBILE_PREFIX = "9";
export const COMPANY_AREA_CODE = "370";
export const DEFAULT_WHATSAPP_NUMBER = "5493704000000";
export const DEFAULT_PHONE_NUMBER = "+54 370 4429999";

/**
 * Sanitiza cualquier número telefónico al formato internacional numérico estricto para WhatsApp wa.me.
 * Por defecto garantiza el formato 549370... para la atención comercial en Formosa Capital.
 */
export function sanitizeWhatsAppNumber(raw?: string | null): string {
  if (!raw) return DEFAULT_WHATSAPP_NUMBER;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return DEFAULT_WHATSAPP_NUMBER;

  // Si ya tiene el formato internacional completo argentino (549370...)
  if (digits.startsWith("549")) return digits;

  // Si tiene código de país pero le falta el prefijo móvil 9 (ej: 54370...)
  if (digits.startsWith("54") && digits.length >= 12) {
    return `549${digits.slice(2)}`;
  }

  // Si empieza con código de área de Formosa sin código de país (ej: 3704...)
  if (digits.startsWith("370")) {
    return `549${digits}`;
  }

  // Si es un número local de 6 a 8 dígitos (ej: 4000000 o 154000000)
  if (digits.length >= 6 && digits.length <= 8) {
    const cleanLocal = digits.startsWith("15") ? digits.slice(2) : digits;
    return `549370${cleanLocal}`;
  }

  return digits;
}

export interface CompanyConfig {
  name: string;
  legalName: string;
  cuit: string;
  cleanCuit: string; // Solo dígitos numéricos para código QR de AFIP
  iibb: string;
  address: string;
  city: string;
  postalCode: string;
  startDate: string;
  vatCondition: string;
  pointOfSale: number;
  formattedPointOfSale: string;
  voucherTypeCode: string;
  voucherTypeName: string;
  vatRate: number;
  vatRatePercentage: string;
  phone: string;
  cleanPhone: string;
  whatsapp: string;
  whatsappNumber: string; // Formato internacional wa.me (549370...)
  cleanWhatsappNumber: string; // Solo dígitos
  countryCode: string; // "54"
  mobilePrefix: string; // "9"
  areaCode: string; // "370"
  instagram: string;
  exchangePolicy: string;
  legalNotice: string;
  fiscalSerialNumber: string;
  softwareVersion: string;
  defaultCashierCode: string;

  // Datos bancarios institucionales para transferencias (RF-17)
  bankName: string;
  bankAccountType: string;
  bankAccountHolder: string;
  bankCbu: string;
  bankAlias: string;
}

export function getCompanyConfig(): CompanyConfig {
  const cuit = process.env.COMPANY_CUIT || "27-18036080-3";
  const cleanCuit = cuit.replace(/\D/g, "");
  const pointOfSale = parseInt(process.env.POS_POINT_OF_SALE || "8", 10);
  const formattedPointOfSale = String(pointOfSale).padStart(5, "0");

  const rawPhone = process.env.COMPANY_PHONE || DEFAULT_PHONE_NUMBER;
  const cleanPhone = rawPhone.replace(/\D/g, "");

  const rawWhatsapp =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.COMPANY_WHATSAPP ||
    "+54 9 370 4000000";
  const whatsappNumber = sanitizeWhatsAppNumber(rawWhatsapp);

  return {
    name: process.env.COMPANY_NAME || "MATACOS DEPORTES",
    legalName: process.env.COMPANY_LEGAL_NAME || "MUJICA SANDRA ISABEL",
    cuit,
    cleanCuit,
    iibb: process.env.COMPANY_IIBB || "01-2718036080-3",
    address: process.env.COMPANY_ADDRESS || "SAAVEDRA 241",
    city: process.env.COMPANY_CITY || "FORMOSA - CAPITAL",
    postalCode: process.env.COMPANY_POSTAL_CODE || "3600",
    startDate: process.env.COMPANY_START_DATE || "25/07/2007",
    vatCondition: process.env.COMPANY_VAT_CONDITION || "IVA RESPONSABLE INSCRIPTO",
    pointOfSale,
    formattedPointOfSale,
    voucherTypeCode: "000",
    voucherTypeName: "COMPROBANTE NO FISCAL",
    vatRate: 0.21,
    vatRatePercentage: "21%",
    phone: rawPhone,
    cleanPhone,
    whatsapp: rawWhatsapp,
    whatsappNumber,
    cleanWhatsappNumber: whatsappNumber,
    countryCode: COMPANY_COUNTRY_CODE,
    mobilePrefix: COMPANY_MOBILE_PREFIX,
    areaCode: COMPANY_AREA_CODE,
    instagram: process.env.COMPANY_INSTAGRAM || "@matacosdeportes",
    exchangePolicy:
      process.env.COMPANY_EXCHANGE_POLICY ||
      "CAMBIOS: Indispensable presentar este comprobante. El producto debe encontrarse sin uso, sin daños y con sus etiquetas originales adheridas. Prendas íntimas, mallas y medias no tienen cambio.",
    legalNotice: "DOCUMENTO NO VALIDO COMO FACTURA",
    fiscalSerialNumber: process.env.COMPANY_FISCAL_SERIAL || "SESHRA000022252",
    softwareVersion: process.env.COMPANY_SOFTWARE_VERSION || "V: 1.02",
    defaultCashierCode: process.env.POS_DEFAULT_CASHIER_CODE || "CAJERO01",

    // Datos bancarios institucionales para transferencias (RF-17)
    bankName: process.env.COMPANY_BANK_NAME || "Banco de Formosa S.A. / Red Link",
    bankAccountType: process.env.COMPANY_BANK_ACCOUNT_TYPE || "Cuenta Corriente en Pesos",
    bankAccountHolder:
      process.env.COMPANY_BANK_ACCOUNT_HOLDER ||
      process.env.COMPANY_LEGAL_NAME ||
      "MUJICA SANDRA ISABEL",
    bankCbu: process.env.COMPANY_BANK_CBU || "0110263720026300489124",
    bankAlias: process.env.COMPANY_BANK_ALIAS || "MATACOS.DEPORTES.FSA",
  };
}

export const companyConfig = getCompanyConfig();
