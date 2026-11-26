import { z } from "zod";

export const CardBrandCodeEnum = z.enum(
  ["VISA", "MASTERCARD", "CABAL", "NARANJA_X"],
  {
    errorMap: () => ({
      message: "Marca de tarjeta inválida. Use VISA, MASTERCARD, CABAL o NARANJA_X",
    }),
  }
);
export type CardBrandCode = z.infer<typeof CardBrandCodeEnum>;

export const CardGroupEnum = z.enum(
  ["BANCARIZADAS", "NARANJA_X", "TODAS", "ESPECIFICAS"],
  {
    errorMap: () => ({
      message:
        "Grupo de tarjetas inválido. Use BANCARIZADAS, NARANJA_X, TODAS o ESPECIFICAS",
    }),
  }
);
export type CardGroup = z.infer<typeof CardGroupEnum>;

export const CARD_BRAND_META: Record<
  CardBrandCode,
  { code: CardBrandCode; label: string; shortLabel: string; isBankCard: boolean }
> = {
  VISA: {
    code: "VISA",
    label: "Visa Bancarizada",
    shortLabel: "Visa",
    isBankCard: true,
  },
  MASTERCARD: {
    code: "MASTERCARD",
    label: "Mastercard Bancarizada",
    shortLabel: "Mastercard",
    isBankCard: true,
  },
  CABAL: {
    code: "CABAL",
    label: "Cabal Bancarizada",
    shortLabel: "Cabal",
    isBankCard: true,
  },
  NARANJA_X: {
    code: "NARANJA_X",
    label: "Tarjeta Naranja X",
    shortLabel: "Naranja X",
    isBankCard: false,
  },
};

export function resolveCardBrandsForGroup(
  cardGroup: CardGroup,
  customBrands?: CardBrandCode[]
): CardBrandCode[] {
  if (cardGroup === "BANCARIZADAS") {
    return ["VISA", "MASTERCARD", "CABAL"];
  }
  if (cardGroup === "NARANJA_X") {
    return ["NARANJA_X"];
  }
  if (cardGroup === "TODAS") {
    return ["VISA", "MASTERCARD", "CABAL", "NARANJA_X"];
  }
  const unique = Array.from(new Set(customBrands ?? []));
  return unique.length > 0 ? unique : ["VISA", "MASTERCARD", "CABAL"];
}

const optionalNullableText = (maxLength: number, maxErrorMessage: string) =>
  z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      if (typeof val === "string" && val.trim() === "") return null;
      return val;
    },
    z.string().trim().max(maxLength, maxErrorMessage).nullable().optional()
  );

const optionalNullableDate = (invalidMessage: string) =>
  z.preprocess(
    (val) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      if (typeof val === "string" && val.trim() === "") return null;
      if (val instanceof Date) return val;
      if (typeof val === "string" || typeof val === "number") {
        return new Date(val);
      }
      return val;
    },
    z
      .date({
        invalid_type_error: invalidMessage,
      })
      .refine((date) => !Number.isNaN(date.getTime()), {
        message: invalidMessage,
      })
      .nullable()
      .optional()
  );

const BaseInstallmentPlanFields = {
  name: z
    .string({ required_error: "El nombre del plan de cuotas es obligatorio" })
    .trim()
    .min(2, "El nombre del plan debe tener al menos 2 caracteres")
    .max(120, "El nombre del plan no puede superar los 120 caracteres"),
  description: optionalNullableText(
    250,
    "La descripción no puede superar los 250 caracteres"
  ),
  cardGroup: CardGroupEnum.default("BANCARIZADAS"),
  cardBrands: z
    .array(CardBrandCodeEnum)
    .min(1, "Debe seleccionar al menos una marca de tarjeta")
    .default(["VISA", "MASTERCARD", "CABAL"]),
  installments: z.coerce
    .number({ invalid_type_error: "La cantidad de cuotas debe ser numérica" })
    .int("La cantidad de cuotas debe ser un número entero")
    .min(1, "La cantidad mínima de cuotas es 1")
    .max(24, "La cantidad máxima de cuotas es 24")
    .default(3),
  isPlanZ: z.boolean().default(false),
  interestRate: z.coerce
    .number({ invalid_type_error: "El porcentaje de interés debe ser numérico" })
    .min(0, "El porcentaje de interés no puede ser negativo")
    .max(300, "El porcentaje de interés no puede superar el 300%")
    .default(0),
  minAmount: z.coerce
    .number({ invalid_type_error: "El monto mínimo debe ser numérico" })
    .min(0, "El monto mínimo no puede ser negativo")
    .max(999999999, "El monto mínimo excede el límite permitido")
    .default(0),
  order: z.coerce
    .number({ invalid_type_error: "El orden debe ser un número" })
    .int("El orden debe ser un número entero")
    .min(0, "El orden no puede ser negativo")
    .default(0),
  active: z.boolean().default(true),
  startDate: optionalNullableDate("La fecha de inicio de vigencia no es válida"),
  endDate: optionalNullableDate("La fecha de fin de vigencia no es válida"),
};

export const CreateInstallmentPlanSchema = z
  .object(BaseInstallmentPlanFields)
  .transform((data) => ({
    ...data,
    cardBrands: resolveCardBrandsForGroup(data.cardGroup, data.cardBrands),
  }))
  .superRefine((data, ctx) => {
    if (
      data.startDate instanceof Date &&
      data.endDate instanceof Date &&
      data.endDate.getTime() < data.startDate.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La fecha de fin de vigencia debe ser posterior o igual a la fecha de inicio",
        path: ["endDate"],
      });
    }
  });

export type CreateInstallmentPlanInput = z.input<
  typeof CreateInstallmentPlanSchema
>;
export type CreateInstallmentPlanOutput = z.output<
  typeof CreateInstallmentPlanSchema
>;

export const UpdateInstallmentPlanSchema = z
  .object({
    id: z
      .string({ required_error: "El identificador del plan es obligatorio" })
      .trim()
      .uuid("El identificador del plan debe ser un UUID válido"),
    name: BaseInstallmentPlanFields.name.optional(),
    description: BaseInstallmentPlanFields.description,
    cardGroup: CardGroupEnum.optional(),
    cardBrands: z
      .array(CardBrandCodeEnum)
      .min(1, "Debe seleccionar al menos una marca de tarjeta")
      .optional(),
    installments: BaseInstallmentPlanFields.installments.optional(),
    isPlanZ: z.boolean().optional(),
    interestRate: BaseInstallmentPlanFields.interestRate.optional(),
    minAmount: BaseInstallmentPlanFields.minAmount.optional(),
    order: BaseInstallmentPlanFields.order.optional(),
    active: z.boolean().optional(),
    startDate: BaseInstallmentPlanFields.startDate,
    endDate: BaseInstallmentPlanFields.endDate,
  })
  .superRefine((data, ctx) => {
    if (
      data.startDate instanceof Date &&
      data.endDate instanceof Date &&
      data.endDate.getTime() < data.startDate.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La fecha de fin de vigencia debe ser posterior o igual a la fecha de inicio",
        path: ["endDate"],
      });
    }
  });

export type UpdateInstallmentPlanInput = z.input<
  typeof UpdateInstallmentPlanSchema
>;
export type UpdateInstallmentPlanOutput = z.output<
  typeof UpdateInstallmentPlanSchema
>;

export const InstallmentPlanOrderItemSchema = z.object({
  id: z
    .string({ required_error: "El identificador del plan es obligatorio" })
    .trim()
    .uuid("Cada plan debe tener un identificador UUID válido"),
  order: z
    .number({
      required_error: "La posición de orden es obligatoria",
      invalid_type_error: "La posición de orden debe ser numérica",
    })
    .int("La posición de orden debe ser un número entero")
    .min(0, "La posición de orden no puede ser negativa"),
});

export type InstallmentPlanOrderItem = z.infer<
  typeof InstallmentPlanOrderItemSchema
>;

export const ReorderInstallmentPlansSchema = z
  .array(InstallmentPlanOrderItemSchema)
  .min(1, "Debe proporcionar al menos un plan para reordenar")
  .superRefine((items, ctx) => {
    const seenIds = new Set<string>();
    items.forEach((item, index) => {
      if (seenIds.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El plan con ID "${item.id}" está duplicado en la solicitud de reordenamiento`,
          path: [index, "id"],
        });
      }
      seenIds.add(item.id);
    });
  });

export type ReorderInstallmentPlansInput = z.infer<
  typeof ReorderInstallmentPlansSchema
>;

export interface InstallmentCalculationResult {
  baseAmount: number;
  installments: number;
  isPlanZ: boolean;
  interestRate: number;
  hasInterest: boolean;
  surchargeAmount: number;
  totalFinanced: number;
  installmentAmount: number;
  minAmount: number;
  meetsMinAmount: boolean;
  missingForMinAmount: number;
}

/**
 * Calcula los importes exactos de un plan de cuotas sobre un monto base en ARS.
 */
export function calculateInstallmentPlanAmounts(
  baseAmount: number,
  plan: {
    installments: number;
    interestRate: number;
    minAmount: number;
    isPlanZ?: boolean;
  }
): InstallmentCalculationResult {
  const safeBase = Math.max(0, Number(baseAmount) || 0);
  const safeInstallments = Math.max(1, Math.floor(Number(plan.installments) || 1));
  const safeInterest = Math.max(0, Number(plan.interestRate) || 0);
  const safeMinAmount = Math.max(0, Number(plan.minAmount) || 0);

  const hasInterest = safeInterest > 0;
  const surchargeAmount = hasInterest
    ? Math.round(safeBase * (safeInterest / 100) * 100) / 100
    : 0;
  const totalFinanced = Math.round((safeBase + surchargeAmount) * 100) / 100;
  const installmentAmount =
    Math.round((totalFinanced / safeInstallments) * 100) / 100;

  const meetsMinAmount = safeBase >= safeMinAmount;
  const missingForMinAmount = Math.max(
    0,
    Math.round((safeMinAmount - safeBase) * 100) / 100
  );

  return {
    baseAmount: safeBase,
    installments: safeInstallments,
    isPlanZ: Boolean(plan.isPlanZ),
    interestRate: safeInterest,
    hasInterest,
    surchargeAmount,
    totalFinanced,
    installmentAmount,
    minAmount: safeMinAmount,
    meetsMinAmount,
    missingForMinAmount,
  };
}

/**
 * Configuración oficial inicial de Matacos Deportes (Saavedra 241, Formosa):
 * - Tarjetas Bancarizadas (Visa, Mastercard, Cabal): 1 pago sin interés y 3 cuotas sin interés desde $ 30.000
 * - Tarjeta Naranja X: 1 pago sin interés, Plan Z (hasta 3 cuotas cero interés) y 4 cuotas sin interés desde $ 80.000
 */
export const DEFAULT_MATACOS_INSTALLMENT_PLANS: Array<{
  name: string;
  description: string;
  cardGroup: CardGroup;
  cardBrands: CardBrandCode[];
  installments: number;
  isPlanZ: boolean;
  interestRate: number;
  minAmount: number;
  order: number;
  active: boolean;
}> = [
  {
    name: "1 pago sin interés",
    description: "Tarjetas de crédito bancarizadas Visa, Mastercard y Cabal sin monto mínimo",
    cardGroup: "BANCARIZADAS",
    cardBrands: ["VISA", "MASTERCARD", "CABAL"],
    installments: 1,
    isPlanZ: false,
    interestRate: 0,
    minAmount: 0,
    order: 0,
    active: true,
  },
  {
    name: "3 cuotas sin interés",
    description: "Con todas las tarjetas bancarizadas (Visa, Mastercard y Cabal) a partir de $ 30.000,00",
    cardGroup: "BANCARIZADAS",
    cardBrands: ["VISA", "MASTERCARD", "CABAL"],
    installments: 3,
    isPlanZ: false,
    interestRate: 0,
    minAmount: 30000,
    order: 1,
    active: true,
  },
  {
    name: "1 pago sin interés",
    description: "Abonando en 1 cuota con Tarjeta Naranja X sin monto mínimo",
    cardGroup: "NARANJA_X",
    cardBrands: ["NARANJA_X"],
    installments: 1,
    isPlanZ: false,
    interestRate: 0,
    minAmount: 0,
    order: 2,
    active: true,
  },
  {
    name: "Plan Z (3 cuotas cero interés)",
    description: "Financiación exclusiva Plan Z de Tarjeta Naranja X en hasta 3 cuotas cero interés",
    cardGroup: "NARANJA_X",
    cardBrands: ["NARANJA_X"],
    installments: 3,
    isPlanZ: true,
    interestRate: 0,
    minAmount: 0,
    order: 3,
    active: true,
  },
  {
    name: "4 cuotas sin interés",
    description: "Promoción exclusiva con Tarjeta Naranja X para compras a partir de $ 80.000,00",
    cardGroup: "NARANJA_X",
    cardBrands: ["NARANJA_X"],
    installments: 4,
    isPlanZ: false,
    interestRate: 0,
    minAmount: 80000,
    order: 4,
    active: true,
  },
];
