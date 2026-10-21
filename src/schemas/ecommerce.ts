import { z } from "zod";

/**
 * Criterios de ordenamiento para el catálogo público
 */
export const CatalogSortEnum = z.enum(
  ["price_asc", "price_desc", "newest", "name_asc"],
  {
    errorMap: () => ({ message: "Criterio de ordenamiento inválido" }),
  }
);
export type CatalogSort = z.infer<typeof CatalogSortEnum>;

/**
 * Esquema Zod de Validación para Filtros de Catálogo Público (RF-13)
 * Coacciona query params de URL a tipos nativos y valida coherencia comercial.
 */
export const CatalogFilterSchema = z
  .object({
    disciplineSlug: z.string().trim().optional(),
    categorySlug: z.string().trim().optional(),
    brandSlug: z.string().trim().optional(),
    size: z.string().trim().optional(),
    color: z.string().trim().optional(),
    minPrice: z
      .coerce
      .number({ invalid_type_error: "El precio mínimo debe ser un número" })
      .min(0, "El precio mínimo no puede ser negativo")
      .optional(),
    maxPrice: z
      .coerce
      .number({ invalid_type_error: "El precio máximo debe ser un número" })
      .min(0, "El precio máximo debe ser mayor a 0")
      .optional(),
    search: z.string().trim().optional(),
    sort: CatalogSortEnum.default("newest"),
    page: z
      .coerce
      .number({ invalid_type_error: "La página debe ser un número" })
      .int()
      .min(1, "La página mínima es 1")
      .default(1),
    limit: z
      .coerce
      .number({ invalid_type_error: "El límite debe ser un número" })
      .int()
      .min(1)
      .max(48, "El límite máximo por página es de 48 artículos")
      .default(12),
  })
  .refine(
    (data) => {
      if (
        data.minPrice !== undefined &&
        data.maxPrice !== undefined &&
        data.minPrice > data.maxPrice
      ) {
        return false;
      }
      return true;
    },
    {
      message: "El precio mínimo no puede ser mayor al precio máximo",
      path: ["minPrice"],
    }
  );

export type CatalogFilterInput = z.input<typeof CatalogFilterSchema>;
export type CatalogFilterOutput = z.output<typeof CatalogFilterSchema>;

/**
 * Esquema de consulta rápida predictiva
 */
export const PredictiveSearchSchema = z.object({
  query: z.string().trim().min(2, "La búsqueda debe tener al menos 2 caracteres"),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export type PredictiveSearchInput = z.infer<typeof PredictiveSearchSchema>;

/**
 * Esquema de validación para verificación atómica de stock de variante (RF-14)
 */
export const CheckVariantStockSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
});
export type CheckVariantStockInput = z.infer<typeof CheckVariantStockSchema>;

/**
 * Esquema de validación para productos relacionados (RF-14)
 */
export const RelatedProductsSchema = z.object({
  productId: z.string().uuid("ID de producto inválido"),
  limit: z.coerce.number().int().min(1).max(12).default(4),
});
export type RelatedProductsInput = z.infer<typeof RelatedProductsSchema>;


/**
 * ============================================================================
 * ESQUEMAS Y CONTRATOS PARA CARRITO Y GUEST CHECKOUT (RF-15)
 * ============================================================================
 */

export const ShippingMethodEnum = z.enum(
  ["RETIRO_LOCAL", "CADETERIA_FORMOSA", "CORREO_ARGENTINO"],
  {
    errorMap: () => ({
      message:
        "Modalidad de entrega inválida. Use RETIRO_LOCAL, CADETERIA_FORMOSA o CORREO_ARGENTINO",
    }),
  }
);
export type ShippingMethod = z.infer<typeof ShippingMethodEnum>;

/**
 * Esquema Zod para cada ítem del carrito web (RF-15)
 */
export const CartItemSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
  quantity: z
    .coerce
    .number({ invalid_type_error: "La cantidad debe ser un número" })
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad mínima por artículo es 1")
    .max(999, "La cantidad máxima por ítem es de 999 unidades"),
  expectedUnitPrice: z
    .coerce
    .number({ invalid_type_error: "El precio esperado debe ser un número" })
    .min(0, "El precio esperado no puede ser negativo")
    .optional(),
});

export type CartItemInput = z.input<typeof CartItemSchema>;
export type CartItemOutput = z.output<typeof CartItemSchema>;

/**
 * Esquema para validar lote de ítems del carrito
 */
export const ValidateCartItemsSchema = z
  .array(CartItemSchema)
  .min(1, "El carrito debe contener al menos un artículo");

/**
 * Esquema Zod para Compra como Invitado — Guest Checkout (RF-15)
 * Mitigación R-04: Solicita únicamente los datos de contacto y entrega indispensables
 * sin obligar al comprador a crear cuenta ni contraseña.
 */
export const GuestCheckoutSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(3, "El nombre y apellido debe tener al menos 3 caracteres")
      .max(120, "El nombre no puede superar los 120 caracteres"),
    customerDni: z
      .string()
      .trim()
      .min(7, "El DNI o CUIT debe tener al menos 7 caracteres")
      .max(15, "El DNI o CUIT no puede superar los 15 caracteres")
      .regex(
        /^[0-9.\-]+$/,
        "El DNI o CUIT solo puede contener números, puntos o guiones"
      ),
    customerEmail: z
      .string()
      .trim()
      .email("Debe ingresar un correo electrónico válido"),
    customerPhone: z
      .string()
      .trim()
      .min(6, "El teléfono de contacto debe tener al menos 6 caracteres")
      .max(30, "El teléfono ingresado es demasiado extenso"),
    shippingMethod: ShippingMethodEnum.default("RETIRO_LOCAL"),
    shippingAddress: z.string().trim().max(200).optional().nullable(),
    shippingCity: z.string().trim().max(80).default("Formosa"),
    shippingPostalCode: z.string().trim().max(15).default("3600"),
    shippingCost: z
      .coerce
      .number({ invalid_type_error: "El costo de envío debe ser un número" })
      .min(0, "El costo de envío no puede ser negativo")
      .optional(),
    customerId: z.string().uuid("ID de cliente inválido").optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
    items: z
      .array(CartItemSchema)
      .min(1, "La orden debe contener al menos un artículo en el carrito"),
  })
  .refine(
    (data) => {
      if (
        (data.shippingMethod === "CADETERIA_FORMOSA" ||
          data.shippingMethod === "CORREO_ARGENTINO") &&
        (!data.shippingAddress || data.shippingAddress.trim().length < 5)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "La dirección de entrega (calle y número) es obligatoria para envíos a domicilio",
      path: ["shippingAddress"],
    }
  );

export type GuestCheckoutInput = z.input<typeof GuestCheckoutSchema>;
export type GuestCheckoutOutput = z.output<typeof GuestCheckoutSchema>;
