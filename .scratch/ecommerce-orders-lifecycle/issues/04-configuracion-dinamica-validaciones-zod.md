# 04: Configuración Dinámica de Tienda y Validaciones Estrictas (Zod)

**What to build:**
Módulo integral de configuración comercial y canales de contacto persistido en PostgreSQL (`StoreSetting`) y capa estricta de validación con Zod tanto para los datos del sistema como para las entradas del cliente en el checkout:
1. **Validaciones Estrictas (Zod):**
   - Teléfonos y WhatsApp: longitud estricta (10 a 13 dígitos numéricos argentinos, ej: código de área + abonado sin '15' o con '549'), descartando caracteres inválidos.
   - Correos electrónicos: expresión regular estricta (`/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`) con validación obligatoria de TLD.
   - Documento DNI / CUIT: formato numérico estricto (7 a 11 dígitos reales).
   - Sanitización para enlaces directos `https://wa.me/{digits}`.
2. **Entidad `StoreSetting` en Base de Datos (Prisma):**
   - Registro único configurable (`default`) con `whatsappNumber`, `contactPhone`, `contactEmail`, `notificationsEmail`, `storeAddress`, `storeCity`, `storePostalCode`, `businessHours`, `instagramHandle`.
   - Server Actions `getStoreSettings()` y `updateStoreSettings()`.
   - Si se actualiza el WhatsApp o email desde el panel, todos los enlaces `wa.me`, plantillas de correos y comprobantes adoptan inmediatamente los nuevos datos sin tocar código ni reiniciar la aplicación.
3. **Vista de Administración en Dashboard (`tab=configuracion`):**
   - Interfaz visual en `StoreSettingsView` para que encargados y administradores modifiquen los datos de contacto y fiscalidad sin tocar código ni variables de entorno.
   - Integrado en `SidebarLeft.tsx` y `DashboardView.tsx`.

**Blocked by:** 01: Expiración de Reservas con TTL, Expiración en Mercado Pago y Cron Autónomo

**Status:** closed

- [x] Agregar modelo `StoreSetting` en `prisma/schema.prisma` y sincronizar con `pnpm prisma db push`.
- [x] Implementar esquemas Zod con regex estrictos de teléfono argentino, email formal y DNI en `src/schemas/ecommerce.ts` y nuevo `src/schemas/settings.ts`.
- [x] Aplicar validación estricta al `GuestCheckoutSchema` y a la acción `createGuestOrder`.
- [x] Implementar Server Actions `getStoreSettings()` y `updateStoreSettings()` en `src/server/actions/storeSettingsActions.ts`.
- [x] Conectar `whatsapp.ts` y `emailService.ts` para resolver dinámicamente el teléfono y remitente de `StoreSetting`.
- [x] Desarrollar `StoreSettingsView.tsx` y enlazarlo a `tab=configuracion` en `DashboardView.tsx` y `SidebarLeft.tsx`.
- [x] Crear suite de pruebas automatizadas `scripts/test-ticket04-settings-validations.ts` y validar con `pnpm`.
