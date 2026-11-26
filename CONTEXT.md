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

### Mecánica de Precios en Cambios y Devoluciones
- **Cambio 1 a 1 (Mismo producto por talle/color o artículo de igual valor):** Se realiza directo sin costo adicional para el cliente. Si el precio del producto subió en el catálogo general desde el día de la compra, se respeta el valor y no se cobra diferencia alguna.
- **Cambio por artículo de Mayor Valor:** El cliente abona únicamente la diferencia neta entre el valor acreditado y el nuevo producto.
- **Devolución de Dinero y Saldo a Favor:**
  - *Compras en Local Físico (Saavedra 241):* Se admite la devolución de dinero sin límite de tiempo estricto, sujeta exclusivamente a la presentación del comprobante de compra y a que la prenda se encuentre en perfecto estado y con sus etiquetas originales intactas. El reintegro se realiza por el mismo medio de pago abonado o, si el cliente lo prefiere, mediante la emisión de un **Vale de Compra** (saldo a favor).
  - *Compras Web (E-commerce):* Rige el derecho legal irrenunciable de revocación y reembolso del 100% del dinero abonado (art. 34 Ley 24.240 y art. 1110 CCCN) dentro de los 10 días corridos de recibido el pedido, previa constatación del buen estado de la prenda.

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




## 4. E-Commerce: Portal de Clientes, Favoritos y Seguimiento (RF-29)

### Cliente Web (`Customer`)
Comprador registrado de la tienda online con credenciales propias (email y contraseña cifrada con `bcryptjs`), desacoplado funcional y jerárquicamente de la entidad `User` del personal del local. Su sesión opera con una cookie independiente `matacos_customer_token` (JWT HttpOnly).

### Lista de Favoritos (`Wishlist / Favorite`)
Colección personalizada de artículos guardados por el cliente a nivel de Producto base (`Product`). Permite preservar indumentaria, calzado y accesorios de interés, resolviendo la selección específica de variantes (talle y color) al momento de transferir el ítem al carrito de compras.

### Orden Web y Trazabilidad de Envío
Toda transacción comercial generada a través del canal digital (`channel: "WEB"`). Expone un flujo de estados logísticos transparentes para el cliente (*Pendiente de Pago*, *En Preparación en Saavedra 241*, *Listo para Retiro / En Camino*, *Entregado*).

### Código y Enlace de Rastreo Logístico
Mecanismo de simplificación operativa para envíos nacionales. El sistema almacena el código de seguimiento de despacho (`shippingTrackingCode`) y proporciona al comprador un botón con enlace directo a la plataforma pública de seguimiento de Correo Argentino (`https://www.correoargentino.com.ar/formularios/ondt`). Para envíos por cadetería dentro de Formosa Capital, el estado indica "En camino con cadetería" con el canal de atención por WhatsApp para coordinar la franja de entrega.

### Separación Estricta de Canales de Venta
Las operaciones realizadas de forma presencial en el local físico de Saavedra 241 (`channel: "MOSTRADOR"`) se respaldan exclusivamente mediante el tique térmico impreso entregado en mano al comprador y quedan bajo registro de auditoría interna de la caja. El portal web del cliente está destinado estrictamente a la trazabilidad y registro de sus compras online (`channel: "WEB"`).


## 5. E-Commerce: Control de Reservas, Expiración y Despacho en Salón

### Reserva Temporal de Stock Web (TTL de 15 minutos)
Compromiso transaccional provisorio de existencias durante el proceso de compra online. Al crearse una Orden Web en estado `PENDIENTE_PAGO`, se incrementa `stockReserved` de las variantes y se asigna una ventana de validez estricta de 15 minutos (`reservedUntil`). Protege contra la sobreventa concurrente mientras el comprador abona en la pasarela, evitando a la vez que el salón físico de Saavedra 241 quede bloqueado indefinidamente ante compras abandonadas.

### Expiración Preventiva de Preferencia (Mercado Pago Checkout Pro)
Mecanismo de pasarela por el cual la preferencia de pago se genera con una fecha de corte (`expiration_date_to = reservedUntil`). Si el comprador supera los 15 minutos sin completar el pago, la propia pasarela de Mercado Pago bloquea la transacción informando la expiración de la sesión, impidiendo que el dinero sea debitado de su cuenta o tarjeta.

### Rechazo por Expiración de Reserva (Fail-safe)
Procedimiento de salvaguarda reactiva ejecutado en el backend si un pago llega a procesarse luego de que la orden haya sido cancelada por vencimiento de reserva y no existan existencias físicas disponibles en tienda ni depósito. La orden permanece en `CANCELADA`, se invoca la API de reembolso automático (`refundPayment`) y se envía un correo explicativo al comprador sin alterar el inventario ni el arqueo físico de caja.

### Despacho y Gestión Logística de Salón
Módulo operativo del personal de salón y administración en Saavedra 241 para preparar paquetes de compras web. Permite filtrar órdenes por estado logístico, ingresar el código de guía de Correo Argentino, contactar al comprador por WhatsApp para coordinar la entrega o retiro, y confirmar la entrega final.


## 6. Precios Promocionales y Ofertas Temporales (RF-27)

### Descuento Promocional Omnicanal
Reducción porcentual temporal sobre el precio de venta de un artículo base (`Product`) o rubro. Rige con idéntico valor tanto en la tienda online (`channel: "WEB"`) como en las terminales físicas del local de Saavedra 241 (`channel: "MOSTRADOR"`). En mostrador, el comprobante térmico refleja el precio de lista original y el importe descontado en el renglón.

### Salvaguarda de Costo de Reposición
Restricción de protección financiera que impide fijar precios bonificados cuyo valor resultante sea inferior al costo de reposición (`costPrice`). Exige autorización expresa y permisos de auditoría para liquidaciones extraordinarias por debajo del costo.

### Precio Promocional Efectivo por Variante
Monto monetario final redondeado al centavo obtenido al aplicar el porcentaje de descuento sobre el precio particular de cada variante (`variant.price ?? product.price`), asegurando la proporcionalidad en talles o modelos con sobreprecio.

### Resguardo de Oferta en Reserva Web (Inmutabilidad TTL)
Compromiso transaccional de precio pactado al iniciar una orden web. Si la orden se genera durante la vigencia de la oferta, el importe bonificado queda congelado durante la ventana de reserva de 15 minutos (`reservedUntil`), permitiendo al comprador finalizar su pago en pasarela al precio promocional aun si la oferta expira en el servidor durante la transacción.

### Descuento Masivo por Rubro o Disciplina
Acción operativa para asignar un porcentaje de oferta a la totalidad de artículos pertenecientes a una Categoría o Disciplina deportiva, aplicando la rebaja a los productos aptos y generando un reporte discriminado de aquellos omitidos por salvaguarda de costo.


### Permiso Atómico de Venta Bajo Costo (`productos.descuento_bajo_costo`)
Permiso de seguridad granular en la matriz RBAC que habilita a un usuario con perfil autorizado a forzar la aplicación de un precio promocional cuyo valor neto resultante se ubique por debajo del costo de reposición (`costPrice`), destinado a liquidaciones extraordinarias de fin de temporada.

### Descuento Sucesivo en Mostrador (Cascada RF-27 + RF-08)
Mecánica de liquidación aplicable en terminales físicas de Saavedra 241 cuando un artículo en promoción activa recibe una bonificación manual adicional (por ejemplo, descuento por pago en efectivo). El descuento manual se calcula de forma escalonada sobre el precio promocional ya rebajado, garantizando que ambas ventajas comerciales convivan transparentemente.

### Tolerancia a Costo No Informado
Tratamiento para artículos que posean `costPrice: null` (existencias históricas o rezagos de catálogo). El sistema permite fijar promociones individuales o masivas sin bloquear la operación por falta de costo de referencia.

### Presentación Visual de Oferta (Precio Tachado y Badge)
Convención de diseño frontend en catálogo, PDP y mostrador consistente en exponer el precio de lista original en tipografía secundaria tachada (`line-through`), acompañado por una insignia visual destacada con el porcentaje bonificado (ej. `-20% OFF`) y el precio efectivo final destacado en color de acento.


### Módulo Administrativo de Campañas y Promociones
Sección dedicada en el panel de control (`/admin?tab=promociones`) desacoplada del formulario individual de productos. Permite monitorear el estado de todas las ofertas vigentes, pausadas o programadas, aplicar descuentos masivos por rubro o disciplina, y auditar los productos bajo promoción.

### Ventana de Vigencia con Precisión de Fecha y Hora
Intervalo temporal delimitado por `discountStartDate` y `discountEndDate` con exactitud de minutos en el huso horario oficial `America/Argentina/Buenos_Aires`, habilitando campañas relámpago programadas y corte automático de ofertas.

### Reversión Masiva de Ofertas
Acción de despublicación atómica que restablece el precio regular a todos los productos comprendidos en una Categoría o Disciplina de forma simultánea, limpiando los estados promocionales sin alterar el inventario ni los precios base.

### Métrica de Ahorro Visible al Comprador
Cálculo en tiempo real expuesto en el carrito (`EcommerceCartDrawer`) y la pantalla de checkout que consolida la diferencia monetaria total entre los precios de lista y los precios promocionados de los renglones, reforzando la transparencia comercial antes del cobro.


## 7. Logística, Envíos y Ciclo de Vida de Pedidos Web (RF-19 y RF-25)

### Modalidad de Entrega (Shipping Method)
Mecanismo seleccionado por el comprador online para recibir sus artículos. Comprende cuatro opciones canónicas:
1. **Retiro en Local (`RETIRO_LOCAL` / `PICKUP_STORE`):** Retiro presencial en el local físico de Saavedra 241, Formosa Capital. Costo logístico nulo ($0,00). No genera imposición postal.
2. **Cadetería Local Formosa (`CADETERIA_FORMOSA` / `LOCAL_COURIER`):** Servicio de entrega urbana en moto/cadete dentro del radio de Formosa Capital (código postal 3600). Tarifa plana configurable directamente por la administración del comercio en los ajustes del sistema.
3. **Correo Argentino a Domicilio (`CORREO_ARGENTINO_DOMICILIO`):** Despacho postal puerta a puerta (`deliveredType: 'D'`) a cualquier punto del territorio nacional a través de la red de Correo Argentino. Requiere dirección completa con calle, altura, piso/depto, código postal y provincia de destino.
4. **Correo Argentino Retiro en Sucursal (`CORREO_ARGENTINO_SUCURSAL`):** Despacho postal con entrega en sucursal o agencia oficial de Correo Argentino (`deliveredType: 'S'`). Requiere la selección explícita del código y nombre de la agencia de destino.

### Paquete Virtual y Cubicaje Heurístico
Cálculo algorítmico que consolida la totalidad de prendas, calzado o accesorios presentes en el carrito web en un único bulto lógico volumétrico para cotizar ante la API de Correo Argentino. Si un artículo del catálogo carece de ficha técnica de dimensiones o peso, el sistema imputa valores de contingencia por categoría (ej. Calzado deportivo: 950g; Indumentaria textil: 300g; Accesorios menores: 150g; Otros: 500g), evitando que el proceso de compra quede bloqueado.

### Tarifa de Contingencia por Zona (Fallback Logístico)
Esquema de salvaguarda ante caídas de red, indisponibilidad temporal del web service de Correo Argentino o ausencia de credenciales de API. El sistema aplica una tabla de tarifas planas de contingencia regionalizada por código postal, garantizando que el comprador siempre pueda completar el checkout.

### Guía de Despacho y Rótulo Postal
Documento físico y digital emitido por la empresa de correo que respalda la encomienda.
- **Rótulo de Envío (Etiqueta):** Formato impreso con códigos de barras y datos de origen (Matacos Deportes, Saavedra 241, Formosa) y destino que se adhiere a la caja o sobre del paquete.
- **Código de Seguimiento (`shippingTrackingCode` / TN):** Identificador alfanumérico único generado por el transportista para que el comercio y el comprador rastreen las etapas del traslado en tiempo real.
- **Imposición Desacoplada:** Principio operativo por el cual la generación de la guía ante Correo Argentino no se dispara de forma automática con el cobro, sino mediante una acción manual del personal de salón una vez que los artículos fueron físicamente controlados, embalados y rotulados en Saavedra 241.

### Ciclo de Vida Dual de Pedido Web (Comercial vs Logístico)
Arquitectura de estados desacoplados que distingue la fase transaccional del pedido respecto de su proceso de preparación física:
- **Estado Comercial (`SaleStatus`):** `PENDIENTE_PAGO` (esperando pasarela o transferencia), `PENDIENTE_VERIFICACION` (comprobante de transferencia subido), `COMPLETADA` (pago verificado y acreditado) y `CANCELADA` (orden abortada o expirada).
- **Estado Logístico (`ShippingStatus`):** `PENDIENTE` (esperando pago), `EN_PREPARACION` (pedido en armado y empaque en salón), `LISTO_RETIRO` (esperando retiro en Saavedra 241), `EN_CAMINO` (entregado a cadete o impuesto con guía en Correo Argentino), `ENTREGADO` (recepción final confirmada) y `CANCELADO`.

### Restitución Atómica de Existencias por Anulación
Procedimiento de compensación de inventario ante la cancelación de un pedido web:
- Si la orden se cancela antes de pagarse (`PENDIENTE_PAGO`), se liberan las unidades retenidas en `stockReserved` sin registrar egresos.
- Si la orden se anula habiendo estado pagada (`COMPLETADA`) o preparada, el sistema genera de forma atómica un movimiento de inventario inmutable (`InventoryMovement`) de tipo `ANULACION_VENTA`, reincorporando las cantidades al inventario físico real (`stockStore` o `stockWarehouse`).

## 8. Marco Legal, Consentimiento Informado y Protección al Consumidor

### Registro de Consentimiento Legal (`LegalConsentLog`)
Registro probatorio inmutable generado en backend ante el envío de formularios de usuarios invitados o registrados. Almacena la manifestación libre, expresa e informada de aceptación de los Términos y Condiciones y de la Política de Privacidad (exigida por la Ley 25.326 de Protección de Datos Personales), conservando la versión del texto vigente, fecha/hora exacta, correo, documento de identidad, dirección IP de origen y agente de usuario (`userAgent`).

### Derecho de Revocación y Botón de Arrepentimiento (Res. 271/2020 SCI)
Mecanismo directo, accesible e irrenunciable expuesto en el storefront mediante el cual el consumidor que adquiere productos a través del canal digital puede revocar la operación durante un plazo de 10 días corridos a partir de la entrega. El sistema genera un código identificador único de gestión (`REV-XXXX`) y habilita la reversa total del pago.

### Política de Privacidad y Minimización de Datos (Art. 4 Ley 25.326)
Principio de calidad de datos que restringe la solicitud de información personal en el checkout como invitado únicamente a los campos estrictamente necesarios para la facturación ante AFIP/ARCA (DNI), la coordinación logística de entrega (teléfono, domicilio si aplica) y la notificación comercial vinculada a la orden (email), sin exigir creación forzada de cuentas ni contraseñas.

### Política de Cookies y Consentimiento Informado
Régimen de transparencia que categoriza el uso de cookies y almacenamiento web, garantizando que los identificadores técnicos esenciales operen por defecto para la funcionalidad básica (sesión y carrito) y que las cookies analíticas o de terceros requieran aceptación previa y expresa del visitante.
