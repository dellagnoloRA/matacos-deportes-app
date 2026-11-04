# Especificación Técnica: RF-11 — Apertura, Arqueo y Cierre de Caja

> **Etiqueta de Clasificación:** `ready-for-agent`  
> **Proyecto:** Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes (Saavedra 241, Formosa)  
> **Requerimiento:** BackEnd RF-11 (Incremento 2)

---

## Problem Statement

En el local comercial de Matacos Deportes (Saavedra 241, Formosa), el control de los ingresos y egresos de efectivo se realizaba de manera analógica utilizando un cuaderno de caja físico. En dicho cuaderno se anotaba el fondo inicial al abrir la persiana, las salidas esporádicas de dinero durante el turno (fletes, insumos de librería, pagos a proveedores o retiros del dueño a caja de seguridad), y al finalizar la jornada o el turno laboral se hacía un conteo manual de billetes y cupones de tarjeta para determinar si la caja cuadraba o si había faltantes/sobrantes.

Con la digitalización del Punto de Venta (POS) y la introducción de ventas de mostrador con múltiples medios de pago (efectivo, débito, crédito, transferencias y QR de Mercado Pago), la falta de un ciclo de turnos digital integrado genera descontrol:
1. Se pueden cobrar ventas en el mostrador sin saber a qué turno, caja o responsable pertenece el dinero recaudado.
2. No existe forma ágil de asentar retiros y gastos menores inmediatos con validación del dinero físico disponible en el cajón.
3. El cálculo de arqueo al cierre de turno es propenso a errores humanos de suma y a manipulaciones si el operador conoce el total del sistema antes de contar los billetes.
4. No queda una auditoría digital inmutable del sobre de recaudación físico ni un comprobante térmico estandarizado de cierre de turno.

## Solution

Implementar un subsistema integral de Control de Turnos, Movimientos de Caja y Arqueo Ciego ("Blind Audit") que digitalice el cuaderno de caja tradicional de Saavedra 241:
1. **Apertura de Turno:** Permite al cajero registrar la apertura de caja indicando la terminal física, el responsable y el fondo de cambio inicial en efectivo.
2. **Bloqueo Estricto de Cobro:** Impide procesar ventas y cobrar en mostrador si la terminal no cuenta con un turno de caja activo en estado ABIERTA.
3. **Movimientos Intermedios de Caja:** Permite registrar en tiempo real egresos (gastos menores, fletes, retiros a caja fuerte) e ingresos extraordinarios, con motivo obligatorio, comprobante analógico y validación estricta de saldo de efectivo disponible en cajón.
4. **Consolidación Automática por Medio de Pago:** Consolida atómicamente todas las ventas imputadas al turno desglosadas por Efectivo, Débito, Crédito, Transferencia y QR.
5. **Arqueo Ciego ("Blind Audit"):** Al cerrar el turno, el cajero declara los importes reales contados en el cajón (asistido opcionalmente por una calculadora de denominaciones de billetes argentinos) y los cupones de tarjetas/transferencias sin ver las cifras del sistema. Al confirmar, el sistema calcula automáticamente las diferencias (sobrante/faltante) y exige justificación obligatoria ante desvíos.
6. **Comprobante Térmico de Arqueo (80mm):** Emite el ticket de cierre de turno listo para imprimir en comanderas térmicas y adjuntar al sobre de recaudación físico.
7. **Auditoría e Historial:** Mantiene un registro permanente de todos los turnos y arqueos realizados para consulta y control por parte de los administradores.

---

## User Stories

1. Como cajero de mostrador, quiero abrir mi turno de caja ingresando el fondo de cambio inicial en efectivo, para disponer de cambio para dar vuelto a los clientes.
2. Como cajero de mostrador, quiero seleccionar mi nombre de un listado ágil de operadores al abrir la caja, para que la sesión quede auditada a mi nombre sin requerir contraseñas complejas.
3. Como administrador, quiero que cualquier computadora del local pueda operar como terminal de cobro y arqueo de caja, para no interrumpir la atención al público si una máquina se avería.
4. Como cajero de mostrador, quiero que el sistema me advierta y me impida cobrar si no he abierto la caja, para evitar recibir dinero sin custodia de un turno activo.
5. Como vendedor de salón, quiero poder seguir armando preventas aunque la caja de mostrador esté cerrada, para no demorar la atención a los clientes en el salón.
6. Como cajero de mostrador, quiero registrar un egreso de efectivo cuando se paga un flete o compra menor de mostrador, especificando el motivo y número de comprobante.
7. Como cajero de mostrador, quiero que el sistema me impida registrar un egreso si el monto supera el efectivo físico acumulado en el cajón, para evitar saldos negativos irreales.
8. Como encargado de local, quiero registrar un retiro de seguridad a caja fuerte durante el turno, para reducir el efectivo expuesto en el cajón en horas pico.
9. Como cajero de mostrador, quiero registrar un ingreso extraordinario de efectivo si el dueño aporta cambio adicional durante la mañana, para que se sume al efectivo esperado.
10. Como cajero de mostrador, quiero iniciar el cierre de mi turno mediante un arqueo ciego, sin ver en pantalla los totales calculados por el sistema, para realizar un conteo honesto e independiente.
11. Como cajero de mostrador, quiero utilizar una calculadora de billetes por denominación ($20.000, $10.000, $2.000, $1.000, etc.) o ingresar el total directo, para contar el dinero con rapidez y sin errores aritméticos.
12. Como cajero de mostrador, quiero ingresar los totales de los cupones del Posnet (Débito y Crédito) y las transferencias bancarias verificadas, para conciliar los medios electrónicos contra las ventas del sistema.
13. Como cajero de mostrador, quiero ver el resultado del balance (esperado vs real y sobrante/faltante) una vez que confirmé mi declaración a ciegas.
14. Como encargado o auditor, quiero que el sistema exija una nota u observación obligatoria si la diferencia de caja supera un umbral de tolerancia ($ 500,00), para documentar la causa del desvío.
15. Como cajero de mostrador, quiero imprimir automáticamente un tique de arqueo en la impresora térmica de 80mm al cerrar la caja, para graparlo al sobre de recaudación física con los billetes y cupones.
16. Como administrador, quiero consultar el historial de todos los turnos cerrados desde el panel de control, filtrando por fecha, terminal y cajero.
17. Como administrador, quiero ver el detalle pormenorizado de cualquier turno histórico, incluyendo ventas desglosadas, movimientos intermedios, diferencias de arqueo y notas de cierre.
18. Como administrador, quiero poder reimprimir el tique de arqueo de cualquier turno histórico en caso de extravío del comprobante original.
19. Como cajero de mostrador, quiero ver en la barra superior del POS el estado actual de la caja (si está abierta o cerrada, quién es el operador y cuánto tiempo lleva abierta).
20. Como sistema, quiero vincular atómicamente cada venta completada al identificador del turno de caja activo, para garantizar la integridad referencial y contable.

---

## Implementation Decisions

### Decisiones de Arquitectura y Módulos
1. **Módulo de Lógica de Caja:** Centralizado en Server Actions de Next.js (`cashShiftActions.ts`) y servicios de consolidación matemática (`cashShiftService.ts`).
2. **Persistencia Relacional:** Utilización directa del modelo existente en `prisma/schema.prisma` (`CashShift` y `CashMovement`), aprovechando las relaciones existentes con `User` y `Sale`.
3. **Integridad de Usuarios sin Autenticación Formal:** Para cumplir con la clave foránea obligatoria `CashShift.userId -> User.id`, el sistema mantendrá un mecanismo de resolución transparente (`ensureUser(name)`) que busca o crea el usuario en rol `CAJERO` si aún no existe, garantizando auditoría nominal estricta.
4. **Detección Flexible de Terminal:** El navegador almacenará localmente en almacenamiento persistente su identificador de terminal (por defecto `TERMINAL_2_CAJA` para cobro, pero configurable por el usuario). Ambos puestos pueden funcionar con identificadores independientes o unificados.
5. **Servicio de Consolidación de Ventas:** 
   - Las ventas se consolidan a partir de la tabla `SalePayment` vinculada a las ventas `COMPLETADA` asociadas a ese `cashShiftId`.
   - Fórmula de Efectivo Esperado:
     $$\text{expectedCash} = \text{initialAmount} + \sum \text{SalePayment(EFECTIVO)} + \sum \text{CashMovement(INGRESO)} - \sum \text{CashMovement(EGRESOS)}$$
   - Fórmulas de Medios Electrónicos:
     $$\text{expected[Medio]} = \sum \text{SalePayment(Medio)}$$
   - Fórmula de Diferencia:
     $$\text{differenceCash} = \text{actualCash} - \text{expectedCash}$$
6. **Formateo Monetario y Temporal:** Todos los comprobantes y balances operan bajo Pesos Argentinos (formato `$ 45.000,00`) y zona horaria `America/Argentina/Buenos_Aires`.
7. **Diseño de Interfaz:** Componentes en `src/components/dashboard/` integrando modales de Apertura, Cierre (Arqueo Ciego) y Movimiento de Caja con `shadcn/ui` y Tailwind CSS.

---

## Testing Decisions

### Seam Único de Pruebas (Highest Seam Possible)
- **Seam Primario:** Interfaz de Server Actions públicas del ciclo de caja (`cashShiftActions.ts` y servicio de consolidación `cashShiftService.ts`).
- **Comportamiento Externo Evaluado:**
  1. Apertura exitosa de turno con fondo inicial y rechazo de apertura concurrente en la misma terminal.
  2. Consulta de turno activo por terminal.
  3. Rechazo de ventas en mostrador cuando la terminal no tiene turno abierto.
  4. Registro de egresos intermedios validando saldo disponible en efectivo (rechazo si `monto > saldo_actual`).
  5. Consolidación exacta de ventas multimétodo (efectivo, débito, crédito, transferencias, QR) al asociarse ventas reales.
  6. Cierre de turno con arqueo ciego, evaluando cálculo de sobrantes y faltantes.
  7. Validación de obligatoriedad del campo notas ante diferencias que superen el umbral establecido.
  8. Emisión del payload estructurado de ticket de arqueo térmico de 80mm.
- **Arte Previo en el Repositorio:**
  - Script de prueba automatizada ejecutable con `pnpm tsx scripts/test-rf11-cash-shifts.ts`, siguiendo el estándar estricto de `scripts/test-rf10-receipts.ts` y `scripts/test-pos-full-flow.ts`.

---

## Out of Scope

- Módulo de autenticación con contraseña y control de accesos RBAC (será abordado en un incremento futuro).
- Integración automática con controladores fiscales homologados de vieja tecnología (el sistema utiliza comprobantes térmicos digitales de 80mm y régimen AFIP WSFEv1).
- Apertura o cierre de caja en modo offline puro desconectado de la base de datos central (la apertura y cierre requieren validación en el servidor Docker local; las ventas durante microcortes se acumulan en Dexie y se sincronizan antes del cierre).

---

## Further Notes

- Se preserva compatibilidad absoluta con las ventas de preventa de salón (`Terminal 1`), las cuales no exigen caja abierta al no realizar cobro de dinero.
- El arqueo físico se audita sobre la totalidad del dinero en efectivo presente en el cajón (consolidando ventas fiscales e internas), respetando el principio de **Arqueo Unificado y Métrica Dual** documentado en `CONTEXT.md`.
