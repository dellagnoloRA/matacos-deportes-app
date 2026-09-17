import { z } from "zod";

export const PaymentMethodEnum = z.enum([
  "EFECTIVO",
  "DEBITO",
  "CREDITO",
  "TRANSFERENCIA",
  "QR_MERCADOPAGO",
], {
  errorMap: () => ({ message: "Método de pago no válido" }),
});

/**
 * Esquema para un ítem individual dentro de una venta
 */
export const SaleItemSchema = z.object({
  variantId: z.string().uuid("ID de variante inválido"),
  quantity: z
    .number({ invalid_type_error: "La cantidad debe ser un número" })
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor a 0"),
  price: z
    .number({ invalid_type_error: "El precio unitario debe ser un número" })
    .min(0, "El precio unitario no puede ser negativo"),
});

/**
 * Esquema para un método de pago aplicado a la venta (soporta pagos divididos)
 */
export const SalePaymentSchema = z.object({
  method: PaymentMethodEnum,
  amount: z
    .number({ invalid_type_error: "El monto a pagar debe ser un número" })
    .positive("El monto a pagar debe ser mayor a 0"),
  receivedAmount: z
    .number({ invalid_type_error: "El monto con el que pagó debe ser un número" })
    .positive("El monto abonado debe ser mayor a 0")
    .optional()
    .nullable(),
  change: z
    .number({ invalid_type_error: "El vuelto debe ser un número" })
    .min(0, "El vuelto no puede ser negativo")
    .optional()
    .nullable(),
});

/**
 * Esquema completo para procesar una Venta en Mostrador
 */
export const CreateSaleSchema = z
  .object({
    userId: z.string().uuid("ID de usuario inválido").optional().nullable(),
    channel: z.string().default("MOSTRADOR"),
    discount: z
      .number({ invalid_type_error: "El descuento debe ser un número" })
      .min(0, "El descuento no puede ser negativo")
      .default(0),
    items: z
      .array(SaleItemSchema)
      .min(1, "La venta debe contener al menos un producto"),
    payments: z
      .array(SalePaymentSchema)
      .min(1, "Debe registrar al menos un método de pago"),
  })
  .refine(
    (data) => {
      const itemsTotal = data.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      );
      const netTotal = Math.max(0, itemsTotal - data.discount);
      const paymentsTotal = data.payments.reduce(
        (sum, pay) => sum + pay.amount,
        0
      );

      // Los pagos deben cubrir el total neto de la venta (tolerancia de 0.01 por redondeo decimal)
      return paymentsTotal >= netTotal - 0.01;
    },
    {
      message: "El monto total de los pagos ingresados no cubre el importe neto total de la venta",
      path: ["payments"],
    }
  )
  .refine(
    (data) => {
      // Si se especificó con cuánto abonó en efectivo, debe cubrir el monto a cobrar
      for (const pay of data.payments) {
        if (
          pay.method === "EFECTIVO" &&
          pay.receivedAmount !== undefined &&
          pay.receivedAmount !== null &&
          pay.receivedAmount < pay.amount - 0.01
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message: "El monto abonado en efectivo es menor al importe a cobrar",
      path: ["payments"],
    }
  );

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
export type SaleItemInput = z.infer<typeof SaleItemSchema>;
export type SalePaymentInput = z.infer<typeof SalePaymentSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
