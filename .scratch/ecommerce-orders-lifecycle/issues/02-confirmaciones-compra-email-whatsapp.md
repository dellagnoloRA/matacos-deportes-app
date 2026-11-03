# 02: Confirmaciones Omnicanal de Compra (Email Automático y WhatsApp Contextual)

**What to build:**
Disparo automático de la notificación de confirmación de compra por correo electrónico apenas el pago de Mercado Pago pasa a aprobado (`COMPLETADA`), conteniendo el detalle completo de ítems, totales, método de entrega y enlace de seguimiento. Incorporación del botón de asistencia y coordinación inmediata por WhatsApp (`wa.me`) con el teléfono oficial de Saavedra 241 tanto en la pantalla de éxito post-pago (`/checkout/resultado`) como en el portal de seguimiento.

**Blocked by:** 01: Expiración de Reservas con TTL, Expiración en Mercado Pago y Cron Autónomo

**Status:** ready-for-agent

- [ ] Conectar `sendOrderConfirmationEmail` en `processMercadoPagoPayment` ante evento `approved`.
- [ ] Incorporar botón interactivo de WhatsApp (`wa.me`) con mensaje prearmado en `src/app/(ecommerce)/checkout/resultado/page.tsx`.
- [ ] Crear suite de pruebas automatizadas `scripts/test-ticket02-order-confirmations.ts` para validar el envío de email y los enlaces de WhatsApp.
- [ ] Ejecutar la suite con `pnpm` y verificar que todos los casos pasen en verde.
