# 01: Expiración de Reservas con TTL, Expiración en Mercado Pago y Cron Autónomo

**What to build:**
Flujo completo de control del tiempo de vida de la reserva de stock para órdenes web (TTL de 15 minutos). Incluye la configuración preventiva de caducidad en la preferencia de Mercado Pago Checkout Pro (`expires: true` y `expiration_date_to`), un endpoint de Cron Job `/api/cron/release-expired-reservations` protegido por token para liberar automáticamente el inventario reservado y cancelar órdenes vencidas, y una salvaguarda reactiva (*fail-safe*) en el Webhook de Mercado Pago que emite un reembolso automático inmediato (`Payment.refund`) si un pago ingresa tardíamente para una orden cancelada sin existencias físicas en el local.

**Blocked by:** None (can start immediately).

**Status:** closed

- [x] Agregar campo `reservedUntil DateTime?` con índice en el modelo `Sale` de `prisma/schema.prisma` y sincronizar esquema.
- [x] Configurar expiración preventiva nativa (`expires: true`, `expiration_date_to`) en `createMercadoPagoPreference` en `src/server/actions/ecommerce/mercadopagoActions.ts`.
- [x] Implementar el Route Handler `/api/cron/release-expired-reservations` con autenticación Bearer (`CRON_SECRET`), liberación transaccional de `stockReserved` y registro en `InventoryMovement`.
- [x] Implementar salvaguarda reactiva (*fail-safe*) en `processMercadoPagoPayment`: si la orden ya está cancelada o el stock físico es insuficiente, mantener cancelada y ejecutar `mpClient.payment.refund()`.
- [x] Crear suite de pruebas automatizadas `scripts/test-ticket01-stock-cron-refund.ts` que valide el TTL, el cron de liberación y el reembolso tardío.
- [x] Ejecutar la suite con `pnpm` y verificar que todos los casos pasen en verde.
