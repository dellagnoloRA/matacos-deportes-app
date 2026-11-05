# 01: Core de Descuentos Individuales y Salvaguarda de Costos con Permiso RBAC

**What to build:**
Permitir a los administradores fijar o actualizar un descuento porcentual (1% al 90%) sobre cualquier producto individual con ventana de vigencia (fecha y hora exacta en zona horaria de Argentina `America/Argentina/Buenos_Aires`) o duración indefinida.
El backend debe calcular de forma determinista al centavo el precio promocional base (`discountPrice`), validar que no sea inferior al costo de reposición (`costPrice`), rechazar la operación con error `DISCOUNT_BELOW_COST` por defecto si quiebra el margen, y admitir la opción `{ allowBelowCost: true }` únicamente si la sesión posee el permiso atómico `product:discount_below_cost` o rol `ADMIN`.
Al completarse, debe invalidar bajo demanda la etiqueta de caché `landing-data`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Crear esquema Zod `ProductDiscountSchema` en `src/schemas/productDiscount.ts` validando porcentaje (1 al 90 con hasta 2 decimales), fechas de vigencia coherentes (`startDate <= endDate`) y flag de autorización bajo costo.
- [ ] Registrar el permiso atómico `product:discount_below_cost` en la tabla `Permission` (módulo `PRODUCTOS`) y asociarlo al perfil de Administrador en el seed/script correspondiente.
- [ ] Implementar la Server Action `setProductDiscount(productId, data)` con cálculo matemático exacto (`resolveEffectiveProductPromo`), validación de sesión/permisos, persistencia atómica en Prisma y llamada a `revalidateLandingPageData('discount')`.
- [ ] Implementar la suite automatizada `scripts/test-rf27-promotional-discounts.ts` con casos de prueba para: asignación válida, rechazo por venta bajo costo sin permiso, aprobación con permiso autorizado, expiración temporal y persistencia en base de datos.
