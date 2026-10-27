# CONTEXT.md — Modelo de Dominio de Matacos Deportes

Glosario canónico de entidades y conceptos de negocio para el sistema de Matacos Deportes (Saavedra 241, Formosa).

## 1. Conceptos de Punto de Venta y Facturación

### Preventa de Salón (Terminal 1)
Pedido preliminar generado por un vendedor de salón mientras asesora al cliente. No constituye comprobante fiscal. Reserva unidades temporalmente en `stockReserved`. Se identifica con un código diario correlativo (`ticketCode`, ej. `#042`).

### Venta Mostrador (Terminal 2)
Operación de cobro definitiva ejecutada por un cajero. Consume medios de pago, calcula vuelto, descuenta existencias físicas en `stockStore`, libera `stockReserved` y emite el ticket final de venta.

### Tique Fiscal / Comprobante de Entrega (RF-10)
Documento estructurado en bobina térmica de 80mm entregado al comprador. Contiene la identificación tributaria del emisor (parametrizada de forma segura vía variables de entorno), numeración formal oficial (`00008-00026445`), desglose de variantes (producto, talle, color), descuentos unitarios y globales (RF-08), medios de pago y vuelto (RF-09), Transparencia Fiscal con IVA al 21% discriminado, hash de seguridad y código QR interoperable según normativa AFIP/ARCA.

### Comprobante Interno (Ticket X / Control de Venta)
Documento no fiscal emitido en mostrador destinado al control diario interno de ventas y como comprobante de cambio para el cliente. No posee validez tributaria ante AFIP/ARCA, no se computa en el Libro IVA Ventas y lleva obligatoriamente la leyenda legal "DOCUMENTO NO VÁLIDO COMO FACTURA". Mantiene trazabilidad operativa y descuenta stock exactamente igual que un comprobante fiscal.

### Regla de Bancarización Obligatoria (Trazabilidad AFIP)
Restricción de negocio por la cual toda venta que incluya medios de pago electrónicos o bancarizados (`DEBITO`, `CREDITO`, `QR_MERCADOPAGO`) exige obligatoriamente la emisión de un comprobante fiscal para evitar inconsistencias por cruces automáticos de información impositiva. Los comprobantes internos quedan reservados exclusivamente para pagos en `EFECTIVO` o `TRANSFERENCIA` no bancarizada comercialmente.

### Arqueo Unificado y Métrica Dual
Mecanismo de control de caja donde el arqueo físico de turno (`CashShift`) audita la totalidad del dinero en efectivo presente en el cajón (consolidando ventas fiscales e internas para evitar faltantes de caja), mientras que la capa de reportes de gestión presenta una métrica dual discriminando "Ventas Fiscales Declaradas" vs "Ventas Operativas Totales".

### Venta Dividida (Split Fiscal)
Mecanismo que permite fraccionar una transacción comercial de mostrador con medios de pago mixtos en dos comprobantes independientes: un Comprobante Fiscal por la porción bancarizada y un Comprobante Interno (Ticket X) por la porción en efectivo/no fiscal.

### Punto de Venta (P.V.)
Identificador numérico de 5 dígitos (ej. `00008`) correspondiente al punto de emisión. Es desacoplado y configurable mediante variable de entorno (`POS_POINT_OF_SALE`), permitiendo migrar de controladores fiscales físicos a nuevos puntos de venta de Facturación Electrónica sin alterar la base de datos.

### Transparencia Fiscal (RG AFIP 5003)
Régimen que exige explicitar el IVA al 21% contenido en el precio final de cara al consumidor final: $\text{IVA} = \text{Total} - (\text{Total} / 1.21)$.

### Código QR Interoperable AFIP (RG 4291 / 5048)
Cadena de datos codificada en Base64 bajo el esquema oficial de AFIP (`https://www.afip.gob.ar/fe/qr/?p={BASE64}`) que expone los metadatos impositivos de la operación para lectura por smartphones o inspectores.

## 2. Reglas de Negocio: Cambios y Devoluciones

### Condiciones de Admisión de Cambios
1. **Comprobante Obligatorio:** Es requisito indispensable presentar el ticket impreso de compra.
2. **Estado del Artículo:** El producto debe encontrarse sin uso, sin signos de desgaste ni daños físicos, y con sus etiquetas originales adheridas.
3. **Exclusiones Sanitarias:** Por estrictas razones de higiene, prendas de contacto íntimo (ropa interior deportiva, calzas íntimas), mallas y medias no admiten cambio.
4. **Temporalidad:** Política comercial amplia y flexible (sin límite estricto de días preestablecido), supeditada al estricto cumplimiento del estado inmaculado de la prenda y su ticket.

### Mecánica de Precios en Cambios
- **Cambio 1 a 1 (Mismo producto por talle/color o artículo de igual valor):** Se realiza directo sin costo adicional para el cliente. Si el precio del producto subió en el catálogo general desde el día de la compra, se respeta el valor y no se cobra diferencia alguna.
- **Cambio por artículo de Mayor Valor:** El cliente abona únicamente la diferencia neta entre el valor acreditado y el nuevo producto.
- **Devolución / Saldo a Favor ("Vale de Compra"):** El comercio no realiza devoluciones de dinero en efectivo. En su lugar, se emite un **Vale de Compra** (saldo a favor del cliente) imputable a una compra futura en el local.

## 3. Control de Caja, Turnos y Arqueo (RF-11)

### Turno de Caja (CashShift)
Sesión de cobranza operativa delimitada entre una apertura explícita y un cierre formal, vinculada a una terminal física específica (`terminalId`, ej. `TERMINAL_1`, `TERMINAL_2` o terminal asignada) y bajo la responsabilidad de un usuario cajero (`userId`). Cualquier puesto de trabajo puede operar como terminal de caja y realizar su respectivo arqueo, manteniendo un registro de auditoría estricto e inmutable de cada sesión. Es condición mandatoria para procesar cobros en el mostrador.

### Fondo de Cambio Inicial (`initialAmount`)
Monto en efectivo con el que se inicia un turno de caja para disponer de cambio y dar vuelto a los clientes. Es el punto de partida del arqueo contable.

### Arqueo Ciego ("Blind Audit")
Protocolo de cierre de turno en el cual el cajero declara los valores físicos contados en el cajón (efectivo y cupones de medios electrónicos) sin tener a la vista las cifras esperadas calculadas por el sistema. El sistema compara posteriormente lo declarado contra lo computado para determinar sobrantes o faltantes (`differenceCash`).

### Movimiento de Caja (`CashMovement`)
Registro auditable de ingresos extraordinarios o egresos no derivados de ventas directas (ej. retiros de seguridad a caja fuerte, adelantos, fletes de mercadería, gastos de librería/limpieza). Exige motivo obligatorio, número de comprobante de respaldo y validación de saldo disponible en efectivo al momento del retiro.

### Tique de Arqueo y Cierre de Turno
Comprobante estructurado impreso en bobina térmica de 80mm al finalizar la jornada. Detalla totales por medio de pago, lista de egresos/ingresos intermedios, fondo inicial, total esperado, total real contado y diferencia neta, destinado a graparse con el sobre de recaudación física.




## 4. E-Commerce: Checkout, Envíos y Pasarela de Pagos (RF-15, RF-16, RF-19)

### Pasarela de Pagos Online (Checkout Pro)
Mecanismo oficial de procesamiento de pagos online donde el comprador es transferido a la interfaz oficial de Mercado Pago para abonar con tarjeta de crédito, débito o dinero en cuenta, abstrayendo al comercio del manejo y riesgo normativo de datos sensibles de tarjetas.  
_Avoid_: Checkout transparente propio, pasarela embebida con captura local de tarjeta.

### Preferencia de Pago
Objeto transaccional originado en el servidor que declara ante Mercado Pago los ítems adquiridos, datos del comprador, costo de envío y URLs de retorno (`back_urls`).  
_Avoid_: Intención de pago provisoria, orden de cobro preliminar.

### Webhook de Confirmación Asíncrona
Notificación automática de servidor a servidor enviada por Mercado Pago tras registrar un cobro, responsable de validar la acreditación del dinero, crear el asiento de pago y actualizar el pedido.  
_Avoid_: Confirmación por redirección del navegador, validación del cliente en frontend.

### Umbral de Envío Bonificado (Envío Gratis Dual)
Regla promocional basada en dos montos mínimos configurables: uno para entregas locales dentro de Formosa Capital y otro para envíos nacionales por correo, a partir de los cuales el flete pasa a ser 100% bonificado para el cliente.  
_Avoid_: Tarifa plana fija sin promoción, flete estático rígido.

### Orden Web
Transacción comercial generada en la tienda online (`channel: "WEB"`). Mantiene reserva temporal de existencias durante el checkout y transiciona por un ciclo de vida logístico auditable (`PENDIENTE_PAGO` ➔ `PAGADA` ➔ `EN_PREPARACION` ➔ `EN_CAMINO` / `LISTO_RETIRO` ➔ `ENTREGADA`).  
_Avoid_: Preventa de mostrador, pedido sin reserva de stock.
