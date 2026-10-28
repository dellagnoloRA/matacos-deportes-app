/**
 * Configuración comercial y fiscal de Matacos Deportes
 * Centraliza los datos del emisor, punto de venta y políticas para tickets de venta (RF-10).
 * Todos los valores sensibles o configurables se leen de variables de entorno (.env).
 */

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
  whatsapp: string;
  instagram: string;
  exchangePolicy: string;
  legalNotice: string;
  fiscalSerialNumber: string;
  softwareVersion: string;
  defaultCashierCode: string;
}

export function getCompanyConfig(): CompanyConfig {
  const cuit = process.env.COMPANY_CUIT || "27-18036080-3";
  const cleanCuit = cuit.replace(/\D/g, "");
  const pointOfSale = parseInt(process.env.POS_POINT_OF_SALE || "8", 10);
  const formattedPointOfSale = String(pointOfSale).padStart(5, "0");

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
    phone: process.env.COMPANY_PHONE || "+54 370 4429999",
    whatsapp: process.env.COMPANY_WHATSAPP || "+54 9 370 4000000",
    instagram: process.env.COMPANY_INSTAGRAM || "@matacosdeportes",
    exchangePolicy:
      process.env.COMPANY_EXCHANGE_POLICY ||
      "CAMBIOS: Indispensable presentar este comprobante. El producto debe encontrarse sin uso, sin daños y con sus etiquetas originales adheridas. Prendas íntimas, mallas y medias no tienen cambio.",
    legalNotice: "DOCUMENTO NO VALIDO COMO FACTURA",
    fiscalSerialNumber: process.env.COMPANY_FISCAL_SERIAL || "SESHRA000022252",
    softwareVersion: process.env.COMPANY_SOFTWARE_VERSION || "V: 1.02",
    defaultCashierCode: process.env.POS_DEFAULT_CASHIER_CODE || "CAJERO01",
  };
}


export const companyConfig = getCompanyConfig();

export interface ShippingConfig {
  freeShippingThreshold: number;
  cadeteriaBaseFee: number;
  correoArgentinoBaseFee: number;
}

export function getShippingConfig(): ShippingConfig {
  return {
    freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD || 100000),
    cadeteriaBaseFee: Number(process.env.CADETERIA_BASE_FEE || 2500),
    correoArgentinoBaseFee: Number(process.env.CORREO_ARGENTINO_BASE_FEE || 7500),
  };
}

export function calculateShippingFee(
  method: "RETIRO_LOCAL" | "CADETERIA_FORMOSA" | "CORREO_ARGENTINO",
  subtotal: number,
  customConfig?: Partial<ShippingConfig>
): {
  cost: number;
  isFree: boolean;
  baseFee: number;
  threshold: number;
} {
  const config = { ...getShippingConfig(), ...customConfig };
  if (method === "RETIRO_LOCAL") {
    return {
      cost: 0,
      isFree: true,
      baseFee: 0,
      threshold: config.freeShippingThreshold,
    };
  }

  const baseFee =
    method === "CADETERIA_FORMOSA"
      ? config.cadeteriaBaseFee
      : config.correoArgentinoBaseFee;

  const isFree = subtotal >= config.freeShippingThreshold;

  return {
    cost: isFree ? 0 : baseFee,
    isFree,
    baseFee,
    threshold: config.freeShippingThreshold,
  };
}
