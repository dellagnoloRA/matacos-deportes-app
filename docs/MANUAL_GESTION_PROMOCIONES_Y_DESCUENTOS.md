# Cómo gestionar promociones, ofertas masivas y liquidaciones
## Manual de Usuario Oficial — Sistema Web & POS Matacos Deportes
**Comercio:** Matacos Deportes (Saavedra 241, Formosa Capital, Argentina)  
**Destinatarios:** Administradores, Encargados de Local, Vendedores y Cajeros  

---

## 📌 Índice de Contenidos

1. [Introducción y Valor Comercial](#1-introducción-y-valor-comercial)
2. [Dónde se encuentra y cómo ingresar al panel](#2-dónde-se-encuentra-y-cómo-ingresar-al-panel)
3. [Estructura del Panel de Promociones (Pestañas)](#3-estructura-del-panel-de-promociones-pestañas)
4. [Paso a Paso: Crear un Descuento Individual en un Producto](#4-paso-a-paso-crear-un-descuento-individual-en-un-producto)
5. [Paso a Paso: Crear un Descuento Masivo por Categoría o Disciplina](#5-paso-a-paso-crear-un-descuento-masivo-por-categoría-o-disciplina)
6. [Entendiendo la Salvaguarda de Costos y el Reporte 2B](#6-entendiendo-la-salvaguarda-de-costos-y-el-reporte-2b)
7. [Cómo pausar, reanudar o revertir promociones](#7-cómo-pausar-reanudar-o-revertir-promociones)
8. [Cómo se reflejan las ofertas en la Tienda Online y en el Mostrador Físico](#8-cómo-se-reflejan-las-ofertas-en-la-tienda-online-y-en-el-mostrador-físico)
9. [Preguntas Frecuentes y Buenas Prácticas](#9-preguntas-frecuentes-y-buenas-prácticas)

---

## 1. Introducción y Valor Comercial

El módulo de **Promociones & Descuentos (RF-27)** permite a Matacos Deportes aplicar rebajas de precios de forma ágil, segura y totalmente omnicanal:
- **Tienda Web:** Los clientes ven el precio original tachado, el precio promocional destacado, etiquetas de oferta (ej. `-20% OFF`) y el cálculo automático del ahorro monetario en el carrito y checkout.
- **Mostrador Saavedra 241:** Los cajeros escanean los códigos de barras y el sistema aplica de inmediato el precio promocional, permitiendo además sumar descuentos por pago en efectivo en mostrador (RF-08).
- **Protección Financiera:** El sistema nunca permite vender por debajo del costo de reposición por error, protegiendo siempre la rentabilidad del negocio.

---

## 2. Dónde se encuentra y cómo ingresar al panel

1. Ingresá al sistema con tu cuenta administrativa en `/login`.
2. En la barra de navegación lateral izquierda, buscá el bloque **"Catálogo & Stock"**.
3. Hacé clic en la opción **"Promociones"** (ícono de etiqueta de descuento 🏷️).
4. O navegá directamente a: **`/admin?tab=promociones`**.

---

## 3. Estructura del Panel de Promociones (Pestañas)

El panel organiza las campañas en 3 pestañas principales:

1. **Activas:** Muestra todos los productos que actualmente tienen un precio promocional activo y vigente para los clientes.
2. **Programadas:** Muestra las promociones configuradas con una fecha y hora futura de inicio, listas para activarse automáticamente.
3. **Historial / Pausadas:** Muestra las promociones que ya vencieron por calendario o que fueron pausadas manualmente por un encargado.

### Indicadores Clave en la Tabla:
- **Precio Lista:** El precio regular del artículo.
- **Precio Oferta:** El valor final con el descuento aplicado.
- **Margen Estimado (%):** Calcula la ganancia porcentual sobre el costo de reposición. Si el margen cae por debajo del 10%, el sistema lo resalta con una advertencia visual amarilla.
- **Vigencia:** Fechas exactas de inicio y fin en el huso horario de Argentina.

---

## 4. Paso a Paso: Crear un Descuento Individual en un Producto

1. Desde el panel de promociones, hacé clic en el botón **"Nueva Promoción"** o presioná el botón **"Editar Descuento"** en cualquier producto listado.
2. Indicá el **porcentaje de descuento** a aplicar (por ejemplo: `15%`, `20%`, `35%`).
3. Verificá la **previsualización en tiempo real**: el sistema te indicará automáticamente cuál será el precio final resultante y el margen comercial.
4. *(Opcional)* Fijá una **fecha y hora de inicio**: si querés que empiece en un momento exacto (ej. viernes a las 18:00 hs).
5. *(Opcional)* Fijá una **fecha y hora de vencimiento**: si es una oferta con duración límite (ej. domingo a las 23:59 hs). Si la dejás vacía, el descuento será permanente hasta que decidas pausarlo.
6. Hacé clic en **"Guardar Promoción"**.

> [!WARNING]
> Si el descuento hace que el precio final sea menor al costo de compra del producto, el sistema bloqueará la operación para evitar pérdidas. Para forzar una liquidación bajo costo, un usuario con rol de Administrador debe tildar la casilla de autorización excepcional.

---

## 5. Paso a Paso: Crear un Descuento Masivo por Categoría o Disciplina

Para fechas especiales como el "Hot Sale", "Black Friday", inicio de clases o fin de temporada:

1. Hacé clic en el botón superior **"Descuento Masivo"**.
2. Seleccioná el alcance de la campaña:
   - **Por Categoría:** Por ejemplo, aplicar a todas las *Mallas*, *Shorts*, *Zapatillas*, etc.
   - **Por Disciplina:** Por ejemplo, aplicar a toda la línea de *Natación*, *Vóley*, *Fútbol*, etc.
3. Ingresá el porcentaje de descuento general (ej. `25%`).
4. Hacé clic en **"Simular Impacto"**:
   - El sistema calculará cuántos productos recibirán el descuento de manera segura.
   - Detectará automáticamente si algún producto violaría la salvaguarda de costos.
5. Hacé clic en **"Aplicar a Rubro"**.

---

## 6. Entendiendo la Salvaguarda de Costos y el Reporte 2B

Para proteger las finanzas de Matacos Deportes, las operaciones masivas respetan la regla **Reporte 2B**:

* **¿Qué hace el sistema?** No interrumpe la campaña general. Aplica la oferta a todos los productos seguros y omite únicamente aquellos artículos cuyo costo de reposición sea muy alto para soportar ese porcentaje.
* **El Reporte 2B:** Se abre automáticamente una ventana modal detallando los productos omitidos, su precio original, su costo y el margen que hubiese resultado negativo, permitiendo al encargado decidir si los liquida manualmente o los mantiene a precio de lista.

---

## 7. Cómo pausar, reanudar o revertir promociones

- **Pausar Temporalmente:** En la tabla de promociones activas, hacé clic en el botón de interruptor (switch) junto al producto. El artículo volverá a exhibirse a su precio normal en la web y mostrador sin borrar la configuración de la oferta.
- **Reanudar:** Volvé a activar el interruptor cuando desees reanudar la vigencia.
- **Reversión Masiva:** En el botón de acciones masivas, podés elegir **"Revertir Descuentos de Categoría/Disciplina"**, restaurando de forma instantánea los precios regulares de todos los artículos involucrados.

---

## 8. Cómo se reflejan las ofertas en la Tienda Online y en el Mostrador Físico

### En la Tienda Online:
1. **Catálogo y Vitrinas:** La imagen del producto muestra una cinta distintiva con el porcentaje de descuento (ej. `-20% OFF`).
2. **Ficha de Producto (PDP):** El precio de lista aparece tachado en gris y el precio promocional en tipografía destacada. Al seleccionar talles o variantes con recargo, el precio de oferta se actualiza inmediatamente.
3. **Carrito y Checkout:** Aparece una barra destacada verde informando el ahorro total: `¡Estás ahorrando $ 8.500,00 en esta compra!`.
4. **Reserva Web de 15 Minutos:** Si el cliente comienza el pago a las 23:59 y la promoción vencía a medianoche, el precio de oferta queda congelado durante los 15 minutos de la reserva de stock.

### En el Mostrador Saavedra 241 (Punto de Venta):
1. **Lectura con Código de Barras:** Al pistolear una prenda promocionada, el sistema la ingresa directamente con el precio de oferta.
2. **Descuentos Sucesivos en Caja:** Si el cliente abona en efectivo y el comercio otorga un 10% adicional por pago al contado (RF-08), el sistema aplica el 10% sobre el precio de oferta ya rebajado.
3. **Ticket de Compra:** La impresora térmica detalla el precio de lista original, la bonificación otorgada y el importe neto final abonado.

---

## 9. Preguntas Frecuentes y Buenas Prácticas

**¿Qué huso horario utiliza el sistema?**  
Todas las fechas y horas operan bajo la hora oficial de Argentina (`America/Argentina/Buenos_Aires`). Si programás una oferta para las 00:00 hs, se activará exactamente a la medianoche hora de Formosa.

**¿Qué pasa si un producto no tiene cargado el costo (`costPrice: null`)?**  
El sistema permite aplicar la promoción con normalidad para no trabar la operatoria comercial en prendas históricas o importadas sin costo fijado.

**¿Hace falta reiniciar el servidor después de crear una oferta?**  
No. El sistema cuenta con invalidación automática de caché, por lo que los compradores y terminales de mostrador verán los nuevos precios al instante.
