"use server";

import { MercadoPagoConfig, Preference } from "mercadopago";

interface CreatePreferenceInput {
  orderCode: string;
  saleId: string;
  items: Array<{
    title: string;
    unitPrice: number;
    quantity: number;
  }>;
  shippingCost?: number;
  customerEmail: string;
  customerName?: string;
}

export async function createMercadoPagoPreference(input: CreatePreferenceInput): Promise<{
  success: boolean;
  initPoint?: string;
  sandboxInitPoint?: string;
  preferenceId?: string;
  error?: string;
}> {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Si no está configurado un token real de producción/prueba de Mercado Pago, proveer fallback para desarrollo
    if (!accessToken || accessToken.startsWith("TEST-00000000")) {
      return {
        success: true,
        initPoint: `/pedido/${input.saleId}?payment_simulated=true`,
        sandboxInitPoint: `/pedido/${input.saleId}?payment_simulated=true`,
        preferenceId: `pref_mock_${input.saleId.slice(0, 8)}`,
      };
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const preferenceItems = input.items.map((item) => ({
      id: input.orderCode,
      title: item.title,
      unit_price: Number(item.unitPrice),
      quantity: item.quantity,
      currency_id: "ARS",
    }));

    if (input.shippingCost && input.shippingCost > 0) {
      preferenceItems.push({
        id: `ENVIO-${input.orderCode}`,
        title: "Costo de Envío",
        unit_price: Number(input.shippingCost),
        quantity: 1,
        currency_id: "ARS",
      });
    }

    const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const response = await preference.create({
      body: {
        external_reference: input.saleId,
        items: preferenceItems,
        payer: {
          email: input.customerEmail,
          name: input.customerName || "Cliente",
        },
        back_urls: {
          success: `${host}/pedido/${input.saleId}?status=approved`,
          pending: `${host}/pedido/${input.saleId}?status=pending`,
          failure: `${host}/pedido/${input.saleId}?status=failure`,
        },
        auto_return: "approved",
      },
    });

    return {
      success: true,
      initPoint: response.init_point || undefined,
      sandboxInitPoint: response.sandbox_init_point || response.init_point || undefined,
      preferenceId: response.id || undefined,
    };
  } catch (error) {
    console.error("Error al generar preferencia de Mercado Pago:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error al comunicarse con Mercado Pago" };
  }
}

