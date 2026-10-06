# 📖 Manual de Usuario: Punto de Venta (POS) y Gestión de Caja
## Matacos Deportes — Saavedra 241, Formosa Capital

Bienvenido al **Manual de Usuario oficial de Punto de Venta (POS) y Turnos de Caja** de **Matacos Deportes**.  
Este documento está pensado para que cualquier integrante del mostrador (vendedores de salón, cajeros y encargados) pueda aprender a usar el sistema en pocos minutos, con explicaciones sencillas, pasos claros y ejemplos cotidianos.

---

## 📌 Índice del Manual

1. [Conceptos Básicos en 1 Minuto](#1-conceptos-básicos-en-1-minuto)
2. [Gestión de Caja: Turnos y Arqueo (Antes de Empezar el Día)](#2-gestión-de-caja-turnos-y-arqueo)
   - 2.1. [Cómo abrir el turno de caja (Fondo inicial)](#21-cómo-abrir-el-turno-de-caja)
   - 2.2. [Cómo registrar gastos y salidas de caja chica (Egresos e Ingresos)](#22-cómo-registrar-movimientos-de-caja-chica)
   - 2.3. [Cómo cerrar el turno y hacer el Arqueo de Caja](#23-cómo-cerrar-el-turno-y-hacer-el-arqueo-de-caja)
3. [Preventa de Salón: Atención al Cliente en Mostrador](#3-preventa-de-salón-atención-al-cliente)
   - 3.1. [Búsqueda ágil de artículos (Pistola USB y Teclado)](#31-búsqueda-ágil-de-artículos)
   - 3.2. [Selección de Talles y armado del carrito](#32-selección-de-talles-y-armado-del-carrito)
   - 3.3. [Cómo aplicar Descuentos Manuales (% o $)](#33-cómo-aplicar-descuentos-manuales)
   - 3.4. [Generar la Preventa para mandar a Caja](#34-generar-la-preventa-para-mandar-a-caja)
4. [Cobro en Caja y Medios de Pago (Registro Interno)](#4-cobro-en-caja-y-medios-de-pago)
   - 4.1. [Cobrar una Preventa pendiente](#41-cobrar-una-preventa-pendiente)
   - 4.2. [Venta Directa en Caja (Cobro rápido sin preventa)](#42-venta-directa-en-caja)
   - 4.3. [Modalidades de Cobro: Pago Único y Dividido (2 Medios)](#43-modalidades-de-cobro-pago-único-y-pago-dividido)
   - 4.4. [Cálculo automático de vuelto en Efectivo](#44-cálculo-automático-de-vuelto)
   - 4.5. [Emisión e Impresión del Ticket Comprobante](#45-emisión-e-impresión-del-ticket)
5. [Cambios y Devoluciones (Prendas a Favor)](#5-cambios-y-devoluciones)
6. [Historial de Ventas y Reimpresión de Tickets](#6-historial-de-ventas-y-reimpresión-de-tickets)
7. [¿Qué pasa si se corta Internet en el local? (Modo Offline)](#7-qué-pasa-si-se-corta-internet)
8. [Preguntas Frecuentes y Solución Rápida de Dudas](#8-preguntas-frecuentes)

---

## 1. Conceptos Básicos en 1 Minuto

En el local de Saavedra 241, el sistema separa de forma inteligente las funciones para que la atención sea ordenada y nunca se generen filas:

```
┌─────────────────────────┐             ┌─────────────────────────┐
│       TERMINAL 1        │             │       TERMINAL 2        │
│   VENDEDOR DE SALÓN     │ ──────────► │     CAJERO EN CAJA      │
│  Arma la Preventa con   │   (PRV-xxx) │ Cobra en Efectivo / QR  │
│  talles, colores y promo│             │ y emite Ticket Térmico  │
└─────────────────────────┘             └─────────────────────────┘
```

* **Preventa (`PRV-XXXX`):** La crea el vendedor en el salón mientras atiende al cliente. Reserva provisionalmente la prenda en el stock para que nadie más la venda.
* **Ticket de Venta (`TKT-XXXXXXXX`):** Lo emite la caja cuando el cliente efectivamente abona la mercadería. Es un comprobante interno del comercio (no fiscal) con validez de cambio por 30 días. El sistema no realiza facturación impositiva ni solicita datos de cupones o transacciones bancarias.
* **Turno de Caja:** Es el período de trabajo de un cajero. **Ninguna venta puede cobrarse si la caja no fue abierta previamente con su fondo inicial.**
* **Modo Offline:** Si se corta internet o hay microcortes de red en Formosa, la terminal sigue funcionando normalmente en base de datos local y se sincroniza sola al volver la conexión.

---

## 2. Gestión de Caja: Turnos y Arqueo

El control de caja reemplaza por completo el viejo cuaderno manual de anotaciones.

### 2.1. Cómo abrir el turno de caja
> **⚠️ Regla de Oro:** Siempre se abre la caja al iniciar la mañana o la tarde antes de empezar a cobrar.

1. En el menú superior o lateral, hacé clic en la pestaña **"Caja"** (o en el botón con candado **"Abrir Caja"**).
2. Se abrirá la ventana **"Apertura de Turno de Caja"**:
   * **Terminal:** Verificá que indique la caja correcta (ej: `Terminal 1 - Salón Saavedra`).
   * **Cajero Responsable:** Seleccioná tu nombre en la lista desplegable (ej: *Nahir Fornari*, *Ricardo Dellagnolo*, *Lourdes Bordón*).
   * **Fondo Inicial de Efectivo (Cambio de Arranque):** Ingresá el dinero físico con el que arranca el cajón para dar vuelto (por ejemplo, `$ 10.000,00` o `$ 20.000,00`).
   * **Notas:** Opcional (ej: *"Turno mañana - cambio en billetes de $1000 y $2000"*).
3. Hacé clic en el botón verde **"Abrir Turno de Caja"**.
4. ¡Listo! La barra indicará que la **Caja está ABIERTA** en color verde y ya podrás cobrar ventas.

---

### 2.2. Cómo registrar movimientos de caja chica
Durante el turno pueden surgir gastos menores del local que no son ventas (ej: pagar un flete, comprar insumos de limpieza o un retiro de dinero del dueño).

1. En la pantalla de Caja, hacé clic en el botón **"Movimiento de Caja"** (o **"+/- Dinero"**).
2. Seleccioná el tipo de movimiento:
   * 🔴 **Egreso (Salida de dinero):** Pago de flete, compras menores, viáticos o retiro a caja fuerte.
   * 🟢 **Ingreso (Entrada extraordinaria):** Ingreso de más cambio físico aportado por el dueño.
3. Ingresá los datos requeridos:
   * **Monto en Pesos ($):** La cantidad exacta (ej: `$ 3.500,00`).
   * **Motivo / Concepto:** Escribí con claridad qué se pagó (ej: *"Pago de flete expreso encomienda de pelotas"*).
   * **N° de Comprobante / Recibo:** Si te dieron un ticket o remito en papel, anotá el número acá.
4. Hacé clic en **"Registrar Movimiento"**.
> **💡 Protección del Sistema:** El sistema nunca te permitirá registrar una salida de dinero mayor al efectivo real que tenés acumulado en el cajón en ese momento.

---

### 2.3. Cómo cerrar el turno y hacer el Arqueo de Caja
Al terminar tu jornada o turno de trabajo, se debe realizar el cierre para rendir cuentas al dueño o administrador.

1. En la pantalla de Caja, hacé clic en el botón rojo **"Cerrar Caja / Arqueo"**.
2. **Arqueo Ciego ("Conteo Real"):**  
   Para garantizar total transparencia y evitar equivocaciones, el sistema te pide que cuentes el dinero físico del cajón:
   * Podés tipear el total directo o usar la **Calculadora de Billetes** (ingresando cuántos billetes tenés de `$ 20.000`, `$ 10.000`, `$ 2.000`, `$ 1.000`, etc.).
   * Para los cobros digitales (Débito, Crédito, QR y Transferencias), el sistema totaliza automáticamente las operaciones registradas para que las compares contra el resumen de lote del posnet o tu aplicación bancaria.
3. Hacé clic en **"Confirmar y Comparar con Sistema"**:
   * El sistema comparará lo que contaste contra lo que se vendió y los gastos registrados:
     * 🟢 **Exacto ($ 0,00):** La caja cuadró a la perfección.
     * 🔵 **Sobrante (+):** Hay más dinero físico en el cajón del esperado.
     * 🔴 **Faltante (-):** Falta dinero físico respecto a las ventas del sistema.
4. Si hubo alguna diferencia, podés escribir una breve justificación en el casillero de observaciones.
5. Hacé clic en **"Cerrar Turno Definitivamente"**.
6. **Impresión del Comprobante de Arqueo:**  
   Se abrirá en pantalla el ticket resumen de cierre listo para imprimir en la comandera térmica de 80mm. Imprimilo y abrochalo al sobre con el dinero físico para guardarlo en la administración.

---

## 3. Preventa de Salón: Atención al Cliente

Este módulo es la herramienta principal del vendedor que recorre el salón de Saavedra 241 con el cliente.

### 3.1. Búsqueda ágil de artículos
Tenés dos formas ultrarrápidas de encontrar lo que busca el cliente:

1. **Con la Pistola Lectora USB:**  
   Simplemente apuntá al código de barras de la caja o etiqueta térmica de la prenda y dispará. El artículo y su talle exacto se añadirán al carrito al instante.
2. **Con el Buscador en Pantalla:**  
   En la barra superior de búsqueda podés tipear:
   * Nombre del producto (ej: *"Crocs Classic"*, *"Pelota Penalty"*).
   * Modelo o Marca (ej: *"Asics"*, *"Wilson"*).
   * O filtrar por la disciplina deportiva en las pestañas rápidas (*Fútbol*, *Vóley*, *Natación*, *Crocs*, *Indumentaria*).

---

### 3.2. Selección de Talles y armado del carrito
Cuando encuentres el producto:
* Verás cada combinación de **Talle y Color** con su stock actual en Saavedra 241:
  * 🟢 **Botón Verde con número:** Hay stock en el salón listo para entregar (ej: `Talle 41: 3 un.`).
  * ⚪ **Botón Gris / Agotado:** No hay stock en el mostrador.
* Hacé clic sobre el botón del talle que el cliente se va a llevar: se sumará automáticamente a la columna derecha del **Carrito de Venta**.
* En el carrito podés:
  * Aumentar o disminuir unidades con los botones **`+`** y **`-`**.
  * Quitar un producto con el ícono de tacho de basura **`🗑️`**.
  * Ver el subtotal calculado en Pesos Argentinos al instante.

---

### 3.3. Cómo aplicar Descuentos Manuales (% o $)
Si el cliente cuenta con un descuento especial, promoción bancaria o atención por pago en efectivo:

1. **Descuento a un producto en particular:**  
   En la fila de ese producto en el carrito, hacé clic en el botón de etiqueta **`% Descuento`**.
2. **Descuento global a toda la compra:**  
   Abajo del carrito, hacé clic en **"Aplicar Descuento a toda la compra"**.
3. En la ventana que aparece, podés elegir:
   * **Porcentaje (`%`):** Por ejemplo, un `10%` o `15%`. También podés usar los botones rápidos `5%`, `10%`, `15%` o `20%`.
   * **Monto Fijo (`$`):** Por ejemplo, rebajar `$ 5.000,00` directos del total.
4. Hacé clic en **"Aplicar Descuento"**. El carrito se recalculará automáticamente mostrando el precio original tachado y el descuento en color esmeralda.

---

### 3.4. Generar la Preventa para mandar a Caja
1. En el casillero **"Nombre del Cliente"**, anotá el nombre o apodo del comprador (ej: *"Carlos Gómez"*). Esto ayuda muchísimo a que el cajero identifique la compra enseguida.
2. Hacé clic en el botón verde grande **"Generar Preventa Salón"**.
3. El sistema te mostrará una confirmación con el código asignado (ejemplo: `PRV-0492`):
   * La mercadería queda apartada y reservada en el sistema.
   * El cliente ya puede acercarse a la caja a abonar.

---

## 4. Cobro en Caja y Medios de Pago (Registro Interno)

Este módulo es operado por el cajero en la terminal de cobro (Terminal 2 de Saavedra 241 o cualquier notebook habilitada con turno activo).

> **💡 Naturaleza del Sistema — Control y Registro Interno:**  
> Este software está diseñado exclusivamente para el **control operativo y administrativo interno del comercio** (gestión de stock, control de turnos de caja y emisión de comprobantes internos de mostrador con validez de cambio por 30 días). **No es un sistema fiscal registrado ni homologado.**  
> Por este motivo, para brindar la máxima agilidad en mostrador y no generar demoras innecesarias, **el sistema NO solicita ningún tipo de dato burocrático o bancario para cerrar una venta**:  
> * ❌ **NO solicita número de transferencia bancaria ni banco de origen.**  
> * ❌ **NO solicita marca de tarjeta (Visa, Mastercard, Cabal, etc.).**  
> * ❌ **NO solicita cantidad de cuotas.**  
> * ❌ **NO solicita número de cupón ni código de autorización de posnet.**  
> Las gestiones con tarjeta se pasan por la terminal posnet física del local, los pagos QR se verifican en la app de cobros y las transferencias se constatan en la cuenta bancaria del negocio. En el sistema solo se selecciona el medio de pago correspondiente para imputar el ingreso a la caja y descontar el stock.

### 4.1. Cobrar una Preventa pendiente
1. En la pantalla del POS, ingresá a la pestaña **"Caja"** (o **"Cobrar"**).
2. En la lista de **Preventas Pendientes** verás todas las compras que los vendedores enviaron desde el salón:
   * Muestra el código (ej: `PRV-0492`), nombre del cliente, cantidad de prendas y total a pagar.
3. Hacé clic sobre la preventa que querés cobrar: se abrirá la ventana modal de cobro con el total y el desglose de prendas (si el cliente decide cambiar talles, sumar o retirar artículos de último momento, podés hacer clic en **"Añadir / Modificar Artículos"**).

---

### 4.2. Venta Directa en Caja (Cobro rápido sin preventa)
Si un cliente llega directamente al mostrador de caja con un accesorio o prenda (por ejemplo, una botella térmica o medias):
* No hace falta armar una preventa previa en el salón.
* Podés buscar o escanear el artículo directamente en la pantalla de caja y pasar al cobro en un solo paso.

---

### 4.3. Modalidades de Cobro: Pago Único y Pago Dividido
El sistema ofrece dos modalidades de cobro sumamente intuitivas y rápidas:

#### A) Pago Único (1 Medio de Pago) — Cobro en 1 Clic
Cuando el cliente abona el 100% de la compra con un solo método:
1. En la ventana de cobro, asegurate de tener seleccionada la opción **"Pago Único (1 Medio)"**.
2. Hacé clic directo sobre el botón del método de pago utilizado:
   * 💵 **Efectivo:** Muestra el casillero para ingresar el monto en billetes entregado por el cliente y calcular el vuelto exacto automáticamente.
   * 💳 **Débito:** Asigna el total directo en 1 clic.
   * 💳 **Crédito:** Asigna el total directo en 1 clic (sin solicitar cuotas ni marcas).
   * 📱 **QR / MP (Mercado Pago):** Asigna el total directo en 1 clic (sin solicitar ID de operación).
   * 🏦 **Transferencia:** Asigna el total directo en 1 clic (sin solicitar número de comprobante).
3. Hacé clic en el botón verde **"Completar Venta y Emitir Ticket"**.

#### B) Dividir Pago (2 Medios de Pago / Cobro Mixto)
Si el cliente desea repartir el pago combinando dos medios (por ejemplo, una parte en efectivo y otra con débito o transferencia):
1. Hacé clic en la opción **"Dividir Pago (2 Medios)"**.
2. **Primer Medio de Pago:**
   * Seleccioná el primer método (ej: 💵 **Efectivo**).
   * Ingresá el monto a cobrar o usá el botón rápido **`50% / 50%`**.
   * Si elegiste efectivo, podés ingresar cuánto dinero físico recibiste para que el sistema calcule el vuelto de ese primer pago.
3. **Segundo Medio de Pago:**
   * Seleccioná el segundo método (ej: 💳 **Débito**, 💳 **Crédito** o 🏦 **Transferencia**).
   * Ingresá el monto o hacé clic en el botón rápido **`"Restante a Método 2"`** para que el sistema cubra la diferencia automáticamente.
4. El sistema valida que la suma de ambos importes coincida exactamente con el total de la venta.
5. Hacé clic en **"Completar Venta y Emitir Ticket"**.

| Método de Pago | ¿Qué solicita la pantalla del sistema? | ¿Cómo se gestiona en el comercio? |
| :--- | :--- | :--- |
| **💵 Efectivo** | Monto entregado por el cliente *(para calcular el vuelto)*. | Se recibe el dinero físico y se guarda en el cajón de cobro. |
| **💳 Tarjeta Débito** | Selección directa con 1 clic. No pide ningún dato extra. | Se pasa la tarjeta por el posnet físico del mostrador. |
| **💳 Tarjeta Crédito** | Selección directa con 1 clic. No pide marcas ni cuotas. | Las cuotas y la tarjeta se seleccionan en el posnet físico externo. |
| **📱 QR Mercado Pago** | Selección directa con 1 clic. No pide comprobante digital. | El cliente escanea el QR en mostrador y el cajero corrobora el cobro en la app. |
| **🏦 Transferencia** | Selección directa con 1 clic. No pide CBU ni N° de operación. | El cliente transfiere al alias/CBU del local y se verifica la acreditación bancaria. |

**Ejemplo de cobro dividido:**  
Una compra total de **$ 85.000,00**:
* El cliente paga `$ 35.000,00` en **Efectivo** (entregando `$ 40.000,00` en mano, con `$ 5.000,00` de vuelto calculado).
* Los restantes `$ 50.000,00` los abona con **Tarjeta de Crédito** (las cuotas y la marca se resuelven directamente en el posnet físico).  
El sistema valida al instante que `$ 35.000,00 + $ 50.000,00 = $ 85.000,00` y habilita la emisión del ticket térmico en segundos.

---

### 4.4. Cálculo automático de vuelto
Cuando el cliente abona en efectivo con billetes de mayor denominación:
1. En el casillero de Efectivo ingresá el monto recibido (ej: si la compra es de `$ 34.200,00` y el cliente te da dos billetes de `$ 20.000`, poné `40000`).
2. El sistema te mostrará en verde brillante el **Vuelto exacto a entregar:**  
   $$\text{Vuelto:} \quad \$ \mathbf{5.800,00}$$
3. Esto elimina cualquier error mental de cálculo y garantiza que el arqueo de caja de la tarde cuadre perfecto.

---

### 4.5. Emisión e Impresión del Ticket
1. Una vez cubierto el total, hacé clic en el botón verde **"Completar Venta y Emitir Ticket"**.
2. Al instante ocurrirán tres cosas:
   * Se descontará definitivamente el stock de Saavedra 241 de la base de datos.
   * Se registrará el ingreso de dinero en el turno activo de la caja.
   * Se abrirá el diálogo de impresión con la vista previa del ticket térmico oficial de 80mm.
3. Presioná `Enter` o hacé clic en **"Imprimir"** para que la impresora comience a emitir el comprobante.
4. Entregá el ticket al cliente junto con su mercadería y el vuelto correspondiente.

---

## 5. Cambios y Devoluciones (Prendas a Favor)

En Saavedra 241 los clientes pueden realizar cambios de talle o modelo dentro de los 30 días posteriores a la compra.

1. En la pantalla del POS, hacé clic en el botón **"Cambio / Devolución"**.
2. **Paso 1 (Lo que el cliente devuelve):**  
   Buscá la prenda que el cliente trajo de regreso (ej: *"Remera Nike Talle M"* con valor de `$ 25.000,00`).
   * Esa unidad reingresará de inmediato al stock del local para que vuelva a estar disponible para la venta.
   * El cliente tendrá un **Saldo a Favor de $ 25.000,00**.
3. **Paso 2 (Lo que el cliente se lleva):**  
   Seleccioná la nueva prenda que el cliente elige (ej: *"Remera Nike Talle L"* o unas zapatillas de mayor valor).
   * **Si sale lo mismo:** La diferencia es `$ 0,00` y el cambio se concreta sin mover dinero.
   * **Si la nueva prenda es más cara (ej: $ 32.000,00):** La pantalla indicará una **Diferencia a Cobrar de $ 7.000,00**, la cual cobrarás por cualquier medio de pago habitual.
   * **Si la nueva prenda es de menor valor:** Quedará registrado el saldo restante a favor del cliente.
4. Confirmá la operación y se emitirá el nuevo ticket actualizado.

---

## 6. Historial de Ventas y Reimpresión de Tickets

Si necesitás buscar una venta anterior o un ticket se trabó en la impresora térmica:

1. Ingresá a la pestaña **"Transacciones"** (o **"Historial de Ventas"**).
2. Podés localizar cualquier comprobante usando:
   * El número de ticket (ej: `TKT-00004921`).
   * Nombre del cliente.
   * Filtro por fecha (Hoy, Esta semana, Este mes).
   * Filtro por medio de pago (Efectivo, Mercado Pago, etc.).
3. En la fila de la venta encontrarás:
   * 🖨️ **Botón "Reimprimir":** Abre directamente el ticket térmico para volver a imprimirlo.
   * 👁️ **Botón "Ver Detalle":** Muestra qué productos se llevaron, qué cajero cobró y a qué hora exacta.
   * 🚫 **Botón "Anular":** Permite anular una venta errónea (restituye el stock al local y descuenta el ingreso de la caja).

---

## 7. ¿Qué pasa si se corta Internet? (Modo Offline)

En Saavedra 241 el comercio **nunca debe parar por caídas de internet o problemas del proveedor de fibra óptica**.

* **¿Cómo te das cuenta?**  
  Aparecerá un cartel en la parte superior que dice **"Modo Sin Conexión (Offline)"**.
* **¿Qué tenés que hacer?**  
  **¡Nada! Seguí atendiendo con total normalidad.**
  * Podés seguir buscando productos y escaneando con la pistola USB.
  * Podés seguir armando carritos, cobrando en efectivo y calculando vueltos.
  * Los tickets se seguirán imprimiendo en la impresora térmica sin ningún problema.
* **¿Cómo se guardan las ventas?**  
  La computadora guarda todas las operaciones en su memoria local ultrarrápida (IndexedDB).
* **¿Qué pasa cuando vuelve Internet?**  
  Aparecerá una notificación verde: **"Conexión restaurada - Sincronizando ventas pendientes..."**. En pocos segundos, todas las ventas se enviarán solas al servidor central sin que tengas que tocar nada.

---

## 8. Preguntas Frecuentes y Solución Rápida

### ❓ La caja no me deja cobrar y me muestra un aviso de error
* **Causa:** El turno de caja aún no ha sido abierto.
* **Solución:** Andá a la pestaña **Caja**, tocá **"Abrir Caja"**, seleccioná tu nombre, ingresá el cambio inicial en efectivo y presioná confirmar.

### ❓ La pistola lectora de código de barras no agrega el producto
1. Asegurate de que el cable USB del lector esté bien enchufado a la computadora.
2. Hacé un clic con el mouse sobre el casillero de búsqueda para que el cursor titile adentro antes de disparar.
3. Si el código está roto o borroso, recordá que podés tipear las primeras letras del nombre o del modelo en el teclado.

### ❓ El cliente quiere pagar mitad en efectivo y mitad con tarjeta de débito
1. En la ventana de cobro, seleccioná la pestaña **"Dividir Pago (2 Medios)"**.
2. En el **Primer Medio** elegí **Efectivo** e ingresá el monto acordado (o usá el botón **"50% / 50%"**).
3. En el **Segundo Medio** elegí **Débito** y hacé clic en **"Restante a Método 2"** para asignar el saldo restante automáticamente.
4. Al ser un sistema de registro interno, no necesitás cargar ningún dato de cupón ni marca de tarjeta: hacé clic directamente en **"Completar Venta y Emitir Ticket"** y la operación quedará cerrada e impresa.

### ❓ El papel de la impresora térmica salió en blanco o trabado
1. Abrí la tapa de la impresora térmica y comprobá que el rollo tenga papel térmico y esté colocado con la cara sensible hacia el cabezal.
2. En el sistema, andá a la pestaña **Transacciones**, buscá la última venta y hacé clic en el botón con ícono de impresora **"Reimprimir"**.

### ❓ Al cerrar la caja hay una pequeña diferencia de dinero
* Si al contar los billetes te sobran o faltan algunos pesos respecto a lo que dice la máquina, colocá el valor real que tenés en la mano.
* El sistema te pedirá una breve nota explicativa (por ejemplo: *"Diferencia de $200 por redondeo de cambio en efectivo"*). De esta manera el arqueo queda guardado con total honestidad y claridad.

---

*Manual de Operación de Punto de Venta elaborado para **Matacos Deportes**.*  
*Saavedra 241, Formosa Capital, Argentina — Práctica Profesional Supervisada I (PPS I).*
