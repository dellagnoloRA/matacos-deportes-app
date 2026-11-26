# 📖 Manual de Usuario del Sistema de Gestión y Stock
## Matacos Deportes — Saavedra 241, Formosa Capital

Bienvenido al **Manual de Usuario oficial de Matacos Deportes**. Este documento ha sido diseñado para que cualquier integrante del equipo (personal de atención en mostrador, encargados de depósito, responsables de compras y administradores) pueda comprender de forma rápida, práctica y sencilla cómo operar el sistema día a día.

---

## 📌 Índice de Contenidos

1. [¿Qué es el Sistema Matacos y cómo funciona?](#1-qué-es-el-sistema-matacos-y-cómo-funciona)
2. [Estructura Visual de la Pantalla (Navegación Rápida)](#2-estructura-visual-de-la-pantalla-navegación-rápida)
3. [Módulo de Control de Inventario y Catálogo](#3-módulo-de-control-de-inventario-y-catálogo)
   - 3.1. [Búsqueda y Filtros Rápidos](#31-búsqueda-y-filtros-rápidos)
   - 3.2. [Vistas del Catálogo: Tarjetas vs. Tabla](#32-vistas-del-catálogo-tarjetas-vs-tabla)
4. [Guías Paso a Paso de las Funcionalidades](#4-guías-paso-a-paso-de-las-funcionalidades)
   - [Paso 1: Cómo dar de alta un Producto Nuevo](#paso-1-cómo-dar-de-alta-un-producto-nuevo)
   - [Paso 2: Cómo consultar la Ficha Detallada 360° de un Producto](#paso-2-cómo-consultar-la-ficha-detallada-360-de-un-producto)
   - [Paso 3: Cómo registrar Movimientos y Ajustes de Stock](#paso-3-cómo-registrar-movimientos-y-ajustes-de-stock)
   - [Paso 4: Cómo gestionar las Alertas de Stock Crítico y Quiebres](#paso-4-cómo-gestionar-las-alertas-de-stock-crítico-y-quiebres)
   - [Paso 5: Cómo actualizar Precios en Lote (Masivo)](#paso-5-cómo-actualizar-precios-en-lote-masivo)
   - [Paso 6: Cómo auditar el Historial de Precios](#paso-6-cómo-auditar-el-historial-de-precios)
   - [Paso 7: Cómo imprimir Etiquetas Térmicas con Código de Barras](#paso-7-cómo-imprimir-etiquetas-térmicas-con-código-de-barras)
   - [Paso 8: Cómo importar Stock Masivo desde Excel o CSV](#paso-8-cómo-importar-stock-masivo-desde-excel-o-csv)
   - [Paso 9: Cómo administrar Categorías, Disciplinas y Marcas](#paso-9-cómo-administrar-categorías-disciplinas-y-marcas)
   - [Paso 10: Cómo gestionar Promociones, Ofertas Masivas y Liquidaciones (RF-27)](#paso-10-cómo-gestionar-promociones-ofertas-masivas-y-liquidaciones-rf-27)
5. [Próximos Módulos del Sistema (Roadmap)](#5-próximos-módulos-del-sistema-roadmap)
6. [Preguntas Frecuentes y Solución de Inconvenientes](#6-preguntas-frecuentes-y-solución-de-inconvenientes)
7. [Guía de Capturas de Pantalla Recomendadas (Checklist para el Equipo)](#7-guía-de-capturas-de-pantalla-recomendadas)

---

## 1. ¿Qué es el Sistema Matacos y cómo funciona?

El sistema de **Matacos Deportes** es una plataforma integral desarrollada a medida para modernizar la gestión del comercio deportivo ubicado en Saavedra 241 (Formosa Capital). Sus objetivos principales son:

* **Evitar quiebres de mercadería:** Conocer con precisión qué productos y qué talles específicos quedan disponibles.
* **Agilizar la atención al cliente:** Localizar precios, talles y equivalencias (AR/US/EU) en segundos, tanto tecleando como disparando la pistola lectora de código de barras USB.
* **Separar ubicaciones de stock:** Distinguir entre lo que está físicamente exhibido en el salón de Saavedra 241 y lo que se encuentra guardado en el depósito interno o destinado a la venta web.
* **Garantizar etiquetas estandarizadas:** Generar e imprimir etiquetas autoadhesivas para rollos térmicos con códigos legibles por lectores láser.

### Conceptos Clave que debes conocer:

| Concepto | Explicación Sencilla |
| :--- | :--- |
| **Producto Padre vs. Variante** | Un producto padre es el artículo general (ej: *"Zapatillas Gel-Rocket 11"*). Las variantes son cada combinación de **Talle y Color** (ej: *"Talle 41 - Blanco/Azul"*). Cada variante tiene su propio stock y código de barras. |
| **Stock Salón (Local)** | Cantidad de unidades exhibidas en las estanterías, percheros y mostrador del local de Saavedra 241 listas para entrega inmediata. |
| **Stock Depósito / Web** | Cantidad guardada en cajas en el depósito interno o reservada para envíos de la tienda online. |
| **Stock Mínimo de Seguridad** | Cantidad límite por debajo de la cual el sistema enciende una alarma para avisar que es momento de reponer mercadería o pedir al proveedor. |
| **Moneda Oficial** | Todos los valores monetarios se expresan en Pesos Argentinos (**ARS**, ej: `$ 45.000,00`). |

---

## 2. Estructura Visual de la Pantalla (Navegación Rápida)

Al ingresar al sistema te encontrarás con una interfaz limpia, moderna y con la paleta de colores distintiva de Matacos Deportes (tonos verdes oscuros institucionales y acentos verde neón).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡ MATACOS]  🔍 Buscador General...        [🔔 Alertas (3)] [⚙️ Categorías] [👤 Usuario] │ ← Barra Superior
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ 📦 Inventario│  MÉTRICAS:  [Productos: 148]  [Costo: $ 8.4M]  [Venta: $ 15.2M]         │
│ 🛒 POS (Próx)├─────────────────────────────────────────────────────────────────────────┤
│ 💵 Caja(Próx)│  DISCIPLINAS: [Todas] [Natación] [Vóley] [Crocs] [Fitness] [Calzado]    │
│ 🌐 Web (Próx)├─────────────────────────────────────────────────────────────────────────┤
│              │  [🔍 Buscar...]  [Filtro Stock ▾]  [🏷️ Precios Lote]  [+ Nuevo Producto] │
│              ├─────────────────────────────────────────────────────────────────────────┤
│              │  CATÁLOGO DE PRODUCTOS (Modo Tarjetas o Modo Tabla)                     │
│ [⇦ Ocultar]  │  • Producto A  →  Variantes | Stock Salón: 4 | Stock Depósito: 8 | ...  │
│              │  • Producto B  →  Variantes | Stock Salón: 0 | Stock Depósito: 2 | ...  │
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

> 📸 **CAPTURA RECOMENDADA [CAP-01]: Vista General del Sistema**  
> * **Pantalla:** Vista principal con el módulo de Inventario activo.  
> * **Enfoque / Destacar:**  
>   - Recuadro en el Menú Lateral Izquierdo señalando la pestaña "Inventario" activa.  
>   - Recuadro en las Tarjetas de Métricas Superiores (Total Productos, Valorización, Unidades).  
>   - Flecha indicando la barra superior con el buscador y la campana de alertas.  
> * **Archivo sugerido:** `docs/imagenes/01_pantalla_general_inventario.png`

---

## 3. Módulo de Control de Inventario y Catálogo

El corazón del sistema actual es el módulo de **Inventario**, donde se centraliza toda la mercadería de Matacos Deportes.

### 3.1. Búsqueda y Filtros Rápidos

En la parte superior del catálogo cuentas con herramientas pensadas para encontrar cualquier artículo en menos de 2 segundos:

1. **Buscador Universal en Vivo:** Puedes escribir:
   * Nombre del producto (ej: `Cobra Ultra`).
   * Marca (ej: `Arena`, `Mikasa`, `Crocs`, `Asics`).
   * Código SKU (ej: `NAT-ARE-001`).
   * **Lectura con Pistola USB:** Al hacer clic en el buscador o presionar la tecla rápida, puedes disparar la pistola lectora sobre cualquier caja o etiqueta; el sistema filtrará automáticamente el producto exacto.
2. **Selector por Disciplina Deportiva:** Pestañas visuales con íconos para filtrar rápidamente entre las especialidades del local:
   * 🏊 **Natación:** Antiparras, mallas de competición, gorras de silicona, manoplas.
   * 🏐 **Vóley:** Balones profesionales Mikasa, rodilleras, redes, accesorios.
   * 🐊 **Crocs / Urbano:** Zuecos clásicos, sandalias y pines Jibbitz.
   * 🏋️ **Gimnasio / Fitness:** Mancuernas, bandas elásticas, colchonetas.
   * 👟 **Calzado Deportivo:** Zapatillas indoor, running y entrenamiento.
3. **Filtro por Nivel de Stock:**
   * **Todos los Estados:** Muestra todo el catálogo activo.
   * **En Stock Óptimo:** Artículos con cantidades saludables por encima del mínimo.
   * **Stock Bajo / Crítico:** Artículos con pocas unidades en peligro de agotarse.
   * **Agotados:** Artículos con 0 unidades en existencia.

---

### 3.2. Vistas del Catálogo: Tarjetas vs. Tabla

El sistema ofrece dos formas de visualizar el inventario según lo que necesites hacer en el momento:

* **Vista en Tarjetas (Cuadrícula):** Ideal para mostrador y reconocimiento visual. Muestra fotos del producto, insignias de color, disciplinas, talles más vendidos y precios destacados en verde neón.
* **Vista en Tabla (Compacta):** Ideal para auditorías, conteos rápidos y tareas administrativas de escritorio. Presenta una fila por artículo con columnas ordenables de SKU, Marca, Precios, Stock Salón, Stock Depósito y Estado.
  - **Fila Desplegable de Variantes (Acciones Rápidas):** Al hacer clic en el texto *"X variantes"* de cualquier fila, se despliegan todos los talles con botones de acción directa con un solo clic:
    * 🛍️ **`- Venta` (Índigo):** Registra una venta física en mostrador de ese talle de inmediato.
    * 📥 **`+ Compra` (Azul):** Carga ingreso de mercadería para ese talle puntual.
    * ➖ **`- Merma` (Rosa):** Registra una rotura o egreso justificado.
    * 🔄 **`⇄ Traslado` (Verde):** Mueve unidades del Depósito Central al Salón de Saavedra 241.

> 📸 **CAPTURA RECOMENDADA [CAP-02]: Selector de Vista Tarjetas vs. Tabla**  
> * **Pantalla:** Cabecera de la lista de productos.  
> * **Enfoque / Destacar:** Recuadro sobre los dos botones de alternancia (ícono de cuadrícula y de tabla) junto al selector de ordenamiento.  
> * **Archivo sugerido:** `docs/imagenes/02_conmutador_tarjetas_tabla.png`

---

## 4. Guías Paso a Paso de las Funcionalidades

A continuación se detalla cómo realizar cada una de las tareas del negocio paso a paso.

---

### Paso 1: Cómo dar de alta un Producto Nuevo

Para ingresar un producto que nunca antes estuvo en el sistema, sigue estos pasos:

1. En la parte superior derecha de la pantalla de Inventario, haz clic en el botón verde **`+ Nuevo Producto`**.
2. Se abrirá la ventana modal de carga. Completa los datos en las pestañas:

#### 1. Información General:
* **Nombre del Producto:** Nombre comercial claro (ej: *"Antiparras Cobra Ultra Mirror"*).
* **Disciplina:** Selecciona la disciplina principal (ej: *Natación*).
* **Categoría y Subcategoría:** Define el rubro específico (ej: *Accesorios Natación* → *Antiparras de Competición*).
* **Marca:** Selecciona de la lista desplegable (ej: *Arena*) o crea una nueva si no existe.
* **Descripción:** Breve detalle de características (materiales, protección UV, calce) útil para la web y la atención.

#### 2. Precios y Rentabilidad:
* **Precio de Costo (ARS):** Lo que pagó Matacos Deportes al distribuidor (ej: `$ 42.000,00`).
* **Margen de Ganancia (%):** Porcentaje comercial deseado (ej: `60%`).
* **Precio de Venta al Público (ARS):** El sistema calcula automáticamente el precio sugerido. Puedes ajustar el precio manualmente si deseas fijar un valor redondo (ej: `$ 68.000,00`).

#### 3. Variantes (Talles y Colores):
* Haz clic en **`+ Agregar Variante`** para cada opción física del producto:
  - **Talle:** (ej: *39, 40, 41, M, L, N° 5, Único*).
  - **Color:** (ej: *Negro, Azul Eléctrico, Amarillo/Azul*).
  - **Stock Inicial Salón:** Unidades que van a las estanterías de Saavedra 241.
  - **Stock Inicial Depósito:** Unidades que quedan en cajas de reserva.
  - **Código de Barras:** Si el producto ya trae código EAN de fábrica, puedes disparar la pistola lectora directamente sobre este campo. Si no tiene, haz clic en **`Generar Código Interno`** y el sistema le asignará uno único automáticamente.

#### 4. Guardar:
* Haz clic en el botón verde **`Guardar Producto`**. El artículo quedará registrado de inmediato con sus variantes y stock disponible.

> 📸 **CAPTURA RECOMENDADA [CAP-03]: Formulario de Alta de Producto**  
> * **Pantalla:** Modal `ProductFormModal` abierto.  
> * **Enfoque / Destacar:**  
>   - Resaltar la sección de cálculo de precios (Costo, Margen %, Precio Venta).  
>   - Resaltar la tabla de variantes donde se cargan talles, colores y stock.  
>   - Círculo en el botón "Generar Código Interno".  
> * **Archivo sugerido:** `docs/imagenes/03_modal_alta_producto.png`

---

### Paso 2: Cómo consultar la Ficha Detallada 360° de un Producto

Cuando un cliente pregunte por un producto o quieras revisar su historial:

1. Busca el producto en el catálogo y haz clic sobre su tarjeta o sobre el botón de ojo **`Ver Detalle`**.
2. Se desplegará la **Ficha 360°** que contiene:
   * **Existencias Desglosadas:** Cantidad disponible en el Salón de Saavedra 241 vs. Depósito/Web.
   * **Selector Interactivo de Variantes:** Haz clic en cualquier color o talle para ver el stock exacto de esa combinación y su código de barras asociado.
   * **Tabla de Equivalencias de Talles:** Guía con medidas en centímetros (CM), talle argentino (AR), estadounidense (US), europeo (EU) y brasileño (BR) con recomendaciones de calce para asesorar al comprador.
   * **Rendimiento Comercial:** Resumen de cuántas unidades se han vendido en el local físico y cuántas a través del canal web.
   * **Acciones Directas:** Botones en la cabecera para **Editar**, **Ajustar Stock**, **Imprimir Etiquetas** o **Ver Historial de Precios**; y en la tabla inferior de variantes, botones individuales por talle para **Registrar Venta Mostrador (🛍️)**, **Ingreso por Compra (+)** y **Merma (-)**.

> 📸 **CAPTURA RECOMENDADA [CAP-04]: Ficha 360° de Producto**  
> * **Pantalla:** Vista `ProductDetailView` de un producto con variantes (ej: Zapatillas Asics o Crocs).  
> * **Enfoque / Destacar:**  
>   - Recuadro en las tarjetas de Stock Salón vs. Stock Depósito.  
>   - Recuadro en la tabla de equivalencias de talles (AR / US / EU / CM).  
>   - Círculo en el botón de acción rápida `🛍️` (Venta Mostrador) en la fila de variantes.  
>   - Flecha señalando el botón "Imprimir Etiquetas".  
> * **Archivo sugerido:** `docs/imagenes/04_ficha_detalle_producto.png`

---

### Paso 3: Cómo registrar Movimientos y Ajustes de Stock

Cada vez que ingrese mercadería, se despache un producto a un cliente, se mueva stock o se detecte una rotura, debe registrarse la operación para mantener el inventario sincronizado al 100%.

Para abrir el panel de movimientos tienes **3 accesos rápidos**:
1. Desde el catálogo general: clic en el botón de doble flecha **`Ajustar Stock`** en cualquier fila.
2. Desde las variantes del producto: clic directo en el botón índigo **`- Venta`**, **`+ Compra`** o **`⇄ Traslado`**.
3. Desde la Ficha 360° del producto: clic en **`Ajustar Stock`** o en el ícono **`🛍️`** de cualquier variante.

#### Las 6 Operaciones Disponibles en el Sistema:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ SELECCIONA EL TIPO DE MOVIMIENTO:                                            │
├──────────────────────────────────────┬───────────────────────────────────────┤
│ 🛍️ Venta Mostrador (- Stock)        │ 🔄 Traslado Interno (Reposición)      │
│    Egreso directo por venta física   │    Depósito Central ➔ Salón Saavedra │
├──────────────────────────────────────┼───────────────────────────────────────┤
│ 📥 Ingreso por Compra (+ Stock)      │ ➕ Ajuste Conteo (+) (Sobrante)       │
│    Reabastecimiento de proveedor     │    Sobrante detectado en inventario   │
├──────────────────────────────────────┼───────────────────────────────────────┤
│ ➖ Merma / Ajuste (-) (Rotura/Falla) │ 🔄 Devolución / Cambio de Talle       │
│    Pérdida, rotura o egreso justif.  │    Reintegro o cambio dual 2 en 1     │
└──────────────────────────────────────┴───────────────────────────────────────┘
```

1. 🛍️ **Venta en Mostrador (Baja Rápida):**
   * **¿Para qué sirve?:** Es la opción diseñada para el día a día en el mostrador de Saavedra 241. Te permite dar de baja inmediata las unidades que el cliente está comprando y retirando físicamente.
   * **¿Cómo funciona?:**
     1. Selecciona la variante vendida (ej: *Talle 41 - Negro*).
     2. Ingresa la cantidad de unidades.
     3. Ubicación: se asigna automáticamente **Salón Saavedra 241** (puedes cambiarlo a Depósito si se despacha desde allí).
     4. **Validación de Seguridad:** Si no hay stock suficiente en el mostrador para cubrir la venta, el sistema te avisará con un mensaje en rojo impidiendo la sobreventa (*"No se puede realizar la venta: stock insuficiente en Salón Saavedra 241. Disponible: 0 un., Solicitado: 1 un."*).
   * **Resultado:** Descuenta el stock en vivo y actualiza las métricas de unidades vendidas.

2. 🔄 **Traslado Interno (Reposición):**
   * **¿Para qué sirve?:** Úsalo cuando vayas al depósito a buscar cajas para reponer las estanterías del salón de Saavedra 241.
   * **Comportamiento:** Descuenta las unidades del Depósito Central y las suma al Salón de ventas. El total del comercio no cambia, garantizando que el personal siempre sepa dónde está físicamente cada par o prenda.

3. 📥 **Ingreso por Compra (+ Stock):**
   * **¿Para qué sirve?:** Úsalo al recibir pedidos de distribuidores y fábricas (Arena, Mikasa, Topper, Crocs, etc.).
   * **Comportamiento:** Incrementa el stock disponible en la ubicación elegida (Salón o Depósito).

4. ➕ **Ajuste Conteo (+) (Sobrante de Inventario):**
   * **¿Para qué sirve?:** Si al realizar un recuento físico encuentras más unidades en la estantería de las que figuraban en el sistema, esta opción te permite sumar la diferencia.

5. ➖ **Merma / Ajuste (-) (Faltante, Rotura o Falla):**
   * **¿Para qué sirve?:** Si una prenda vino fallada de fábrica, unas antiparras sufrieron un rayón o hubo una pérdida física.
   * **Auditoría obligatoria:** Para este movimiento el sistema te exigirá escribir un **Motivo** (ej: *"Gorra rota en depósito"*, *"Enviado a garantía del proveedor"*).

6. 🔄 **Devolución de Cliente / Cambio de Talle:**
   * **¿Para qué sirve?:** Diseñado para cambios rápidos cuando el cliente vuelve al local.
   * **Modo Cambio de Talle Dual (2 en 1):** Permite elegir en la misma pantalla el talle que el cliente devuelve (que reingresará al stock) y el talle que se le entrega a cambio (que egresará del stock). El sistema valida que el nuevo talle tenga existencia disponible antes de confirmar.

> 📸 **CAPTURA RECOMENDADA [CAP-05]: Modal de Control y Movimiento de Stock**  
> * **Pantalla:** Modal `StockAdjustmentModal` abierto para un producto con variantes.  
> * **Enfoque / Destacar:**  
>   - Recuadro destacado en la tarjeta índigo **"Venta Mostrador (- Stock)"**.  
>   - Recuadro en el selector de variante/talle.  
>   - Flecha indicando el cálculo en tiempo real de unidades resultantes en Salón y Depósito.  
>   - Botón de confirmación.  
> * **Archivo sugerido:** `docs/imagenes/05_modal_movimiento_stock.png`

---

### Paso 4: Cómo gestionar las Alertas de Stock Crítico y Quiebres

El sistema vigila constantemente los niveles de inventario para que el comercio no pierda ventas por falta de mercadería:

1. **La Campana de Alertas (Barra Superior):**
   * Si hay artículos con stock bajo o agotados, la campana mostrará un número indicador en rojo con efecto pulsante.
2. Haz clic sobre la **Campana** o en el botón de alertas para abrir el **Cajón Lateral de Stock Crítico**.
3. En este panel verás dos pestañas:
   * 🔴 **Agotados (0 unidades):** Productos que se quedaron sin existencia total o en talles clave.
   * 🟡 **Stock Bajo (Por debajo del mínimo):** Productos que están cerca de agotarse.
4. Cada tarjeta de alerta te indica:
   * Nombre, marca y disciplina.
   * La variante exacta comprometida (ej: *"Talle 40 - Color Negro"*).
   * Unidades actuales vs. Stock Mínimo fijado.
5. **Botón Rápido `Reponer Stock`:** Con un solo clic sobre la alerta se abrirá la ventana de ingreso para cargar las nuevas unidades sin tener que buscar el producto manualmente.

> 📸 **CAPTURA RECOMENDADA [CAP-06]: Cajón Deslizable de Alertas de Stock**  
> * **Pantalla:** Cajón lateral derecho `StockAlertsDrawer` abierto sobre la pantalla de inventario.  
> * **Enfoque / Destacar:**  
>   - Campana superior con el badge rojo de notificación.  
>   - Tarjetas de advertencia con badges amarillos y rojos.  
>   - Botón "Reponer Stock" resaltado en una de las alertas.  
> * **Archivo sugerido:** `docs/imagenes/06_cajon_alertas_stock.png`

---

### Paso 5: Cómo actualizar Precios en Lote (Masivo)

Cuando un distribuidor envía una nueva lista de precios o se requiere hacer un ajuste por inflación en toda una categoría:

1. En la barra superior de acciones del inventario, haz clic en **`Actualizar Precios en Lote`** (ícono de porcentaje `%`).
2. Se abrirá la ventana de actualización masiva:
   * **Ámbito del Cambio:** Elige si aplicarás el cambio a:
     - Todo el catálogo.
     - Una **Disciplina** específica (ej: solo *Natación*).
     - Una **Marca** específica (ej: solo productos *Mikasa*).
     - Una **Categoría** particular.
   * **Tipo de Modificación:**
     - **Porcentaje (+ / - %):** (ej: escribir `+15` aumentará un 15% los precios seleccionados).
     - **Monto Fijo (+ / - ARS):** (ej: sumar `$ 2.000,00` parejo a cada artículo).
   * **Regla de Redondeo Comercial:** Activa la opción para redondear a centenas o millares (ej: un precio de `$ 14.234,00` se ajusta prolijamente a `$ 14.300,00` para facilitar el vuelto en efectivo).
3. **Vista Previa de Impacto:** Antes de tocar la base de datos, el sistema muestra una tabla de prueba con las primeras filas indicando:
   * *Precio Actual* $\rightarrow$ *Nuevo Precio Calculado* $\rightarrow$ *Diferencia en Pesos y %*.
4. Si todo es correcto, haz clic en **`Aplicar Actualización Masiva`**. Todos los productos y variantes del grupo se actualizarán al mismo tiempo.

> 📸 **CAPTURA RECOMENDADA [CAP-07]: Modal de Actualización de Precios en Lote**  
> * **Pantalla:** Modal `BatchPriceUpdateModal` con un aumento del 10% filtrado por marca.  
> * **Enfoque / Destacar:**  
>   - Selector de filtro (Marca o Disciplina).  
>   - Casilla de porcentaje (+10%).  
>   - Tabla de vista previa comparativa (Precio Anterior vs. Nuevo Precio).  
>   - Botón de confirmación.  
> * **Archivo sugerido:** `docs/imagenes/07_actualizacion_masiva_precios.png`

---

### Paso 6: Cómo auditar el Historial de Precios

Para saber en cualquier momento cuándo subió un producto, cuánto costaba hace tres meses o qué motivo justificó el cambio:

1. En la ficha del producto o en el menú de opciones de la fila, haz clic en **`Historial de Precios`** (ícono de reloj/historial).
2. Se abrirá una cronología completa con:
   * Fecha y hora exacta del cambio.
   * Precio de Costo y Precio de Venta registrados.
   * Porcentaje de variación respecto al valor anterior.
   * Origen del cambio (ej: *"Actualización Manual"*, *"Actualización Masiva de Precios"*, *"Importación de Excel"*).

> 📸 **CAPTURA RECOMENDADA [CAP-08]: Historial de Precios del Producto**  
> * **Pantalla:** Modal `PriceHistoryModal`.  
> * **Enfoque / Destacar:** Línea de tiempo cronológica con fechas, precios viejos vs. nuevos y porcentajes de variación.  
> * **Archivo sugerido:** `docs/imagenes/08_historial_precios.png`

---

### Paso 7: Cómo imprimir Etiquetas Térmicas con Código de Barras

Matacos Deportes cuenta con impresoras térmicas de mostrador para etiquetar cajas de calzado, prendas y accesorios. Para generar etiquetas autoadhesivas listas para escanear:

1. En la ficha del producto, haz clic en el botón **`Imprimir Etiquetas`** (ícono de impresora térmica).
2. Se abrirá el asistente de impresión:
   * **Formato de Papel / Rollo:** Elige el formato según la bobina colocada en la impresora:
     - `50 x 30 mm` (Rollo autoadhesivo estándar para prendas y cajas de calzado).
     - `40 x 25 mm` (Etiqueta chica para accesorios de natación o mancuernas).
     - `80 mm Continuo` (Para papel continuo térmico).
   * **Selección de Variantes y Copias:** 
     - Puedes tildar o destildar qué talles/colores quieres imprimir.
     - El sistema sugiere automáticamente imprimir tantas copias como stock físico haya disponible, pero puedes modificar el número libremente con los botones `+` y `-`.
   * **Generador de Códigos Faltantes:** Si alguna variante no tenía código de barras asignado, el sistema te avisará con un botón brillante **`Generar Códigos Faltantes`** que le otorgará códigos EAN-13 válidos con un solo clic.
   * **Vista Previa en Pantalla:** A la derecha verás exactamente cómo saldrá la etiqueta: Nombre de Matacos Deportes, Nombre del artículo, Talle, Color, Precio en pesos bien visible y el Código de Barras con sus barras nítidas.
3. Haz clic en el botón verde **`Imprimir Etiquetas`**. Se abrirá el cuadro de diálogo de impresión de la computadora listo para enviar a la impresora térmica sin descalibrar el cabezal.

> 📸 **CAPTURA RECOMENDADA [CAP-09]: Asistente de Impresión de Etiquetas Térmicas**  
> * **Pantalla:** Modal `ThermalLabelPrintModal`.  
> * **Enfoque / Destacar:**  
>   - Selector de tamaño de rollo (50x30 mm).  
>   - Lista de talles con contador de copias.  
>   - Vista previa fiel de la etiqueta térmica con código de barras y precio ARS.  
>   - Botón principal de impresión.  
> * **Archivo sugerido:** `docs/imagenes/09_impresion_etiquetas_termicas.png`

---

### Paso 8: Cómo importar Stock Masivo desde Excel o CSV

Para cargar inventarios completos recibidos de proveedores o cuando se hace un relevamiento general del salón sin tener que escribir producto por producto:

1. En la barra superior de acciones del inventario, haz clic en **`Importar Excel`** (ícono de hoja de cálculo).
2. Se abrirá el asistente de importación:
   * **Paso A: Descargar la Plantilla Oficial:** Si no tienes la plantilla, haz clic en el enlace para descargar el archivo [`plantilla_carga_stock_matacos.xlsx`](file:///C:/Users/della/matacos-deportes-app/docs/plantilla_carga_stock_matacos.xlsx).
   * **Paso B: Completar la Plantilla:** Abre el archivo en Excel o Google Sheets completando las columnas (Disciplina, Categoría, Marca, Nombre, Talle, Color, Stock Salón, Stock Depósito, Costo, Precio Venta).
   * **Paso C: Subir el Archivo:** Arrastra el archivo `.xlsx` o `.csv` dentro de la zona punteada o haz clic para seleccionarlo de tu computadora.
3. **Validación Automática en Tiempo Real:** El sistema analizará todas las filas antes de guardar nada:
   * Te indicará cuántas filas son válidas y listas para guardar.
   * Si alguna celda tiene un error (ej: precio con letras o falta el nombre), te mostrará el número exacto de fila y el problema detectado para que lo corrijas.
4. Haz clic en **`Confirmar e Importar`**. El catálogo y el stock se alimentarán automáticamente en cuestión de segundos.

> 📸 **CAPTURA RECOMENDADA [CAP-10]: Asistente de Importación Masiva Excel**  
> * **Pantalla:** Modal `BulkImportModal` con un archivo cargado mostrando la tabla de validación previa.  
> * **Enfoque / Destacar:**  
>   - Zona de arrastre de archivo.  
>   - Contador de filas válidas vs. filas con observaciones.  
>   - Botón final de confirmación de importación.  
> * **Archivo sugerido:** `docs/imagenes/10_importacion_masiva_excel.png`

---

### Paso 9: Cómo administrar Categorías, Disciplinas y Marcas

Para mantener organizado el catálogo sin depender de programadores cada vez que ingresa una nueva marca o categoría:

1. En la esquina superior derecha o en el menú, haz clic en **`Gestor de Categorías`** (ícono de engranaje/carpetas).
2. Se abrirá el panel **Administrador de Jerarquías**:
   * Pestaña **Disciplinas:** Permite ver las áreas base (Natación, Vóley, Crocs, Fitness, Calzado) y su orden de visualización.
   * Pestaña **Categorías y Subcategorías:** Permite crear nuevas ramas (ej: dentro de *Natación* agregar *Mallas de Competición*, *Tubos Snorkel*, etc.).
   * Pestaña **Marcas:** Permite dar de alta fabricantes oficiales (Speedo, Arena, Wilson, Mikasa, Topper, etc.) y asociarlas a sus disciplinas correspondientes.
3. Puedes activar, desactivar o renombrar cualquier elemento; los cambios se reflejan al instante en todos los filtros del catálogo.

> 📸 **CAPTURA RECOMENDADA [CAP-11]: Gestor Maestro de Categorías y Marcas**  
> * **Pantalla:** Modal `MasterCategoriesManager`.  
> * **Enfoque / Destacar:** Pestañas de Disciplinas, Categorías y Marcas, junto con el botón "+ Nueva Categoría".  
> * **Archivo sugerido:** `docs/imagenes/11_gestor_categorias_marcas.png`

---

### Paso 10: Cómo gestionar Promociones, Ofertas Masivas y Liquidaciones (RF-27)

Permite fijar precios promocionales temporales, lanzar descuentos masivos por rubro o disciplina (ej. 25% OFF en toda la línea de Natación) y liquidar prendas discontinuadas con salvaguarda automática contra venta bajo costo:

1. En el menú lateral izquierdo, haz clic en **`Promociones`** (ícono de etiqueta 🏷️) bajo el bloque *Catálogo & Stock* (o accede mediante **`/admin?tab=promociones`**).
2. **Promoción Individual:** En cualquier producto, haz clic en **`Editar Descuento`**, especifica el porcentaje y opcionalmente define la fecha y hora exacta de inicio y fin en horario de Argentina.
3. **Descuento Masivo por Rubro:** Presiona **`Descuento Masivo`**, selecciona la Categoría o Disciplina deportiva e ingresa el porcentaje. Haz clic en **`Simular Impacto`** para auditar qué productos recibirán la oferta y cuáles serán omitidos por salvaguarda de costos (**Reporte 2B**).
4. **Pausar o Revertir:** Puedes pausar temporalmente cualquier promoción con el interruptor de la tabla o revertir masivamente toda una categoría con un solo clic.

> 💡 Para consultar la guía exhaustiva con capturas y buenas prácticas, consulta el [Manual de Gestión de Promociones y Descuentos](file:///C:/Users/della/matacos-deportes-app/docs/MANUAL_GESTION_PROMOCIONES_Y_DESCUENTOS.md).

---

## 5. Próximos Módulos del Sistema (Roadmap)

El sistema ha sido estructurado de manera modular y escalable. Actualmente la navegación lateral contiene botones señalados con la etiqueta **`Pronto`**, correspondientes a las próximas fases del proyecto:

* 🛒 **Punto de Venta Mostrador (POS Offline-First):**
  - Módulo ultrarrápido para cobrar en mostrador con escaneo de código de barras.
  - **Modo Sin Internet:** Si se corta la conexión en Saavedra 241, el mostrador seguirá cobrando y emitiendo tickets en papel sin interrumpirse gracias a su base de datos local (IndexedDB / Dexie.js).
* 💵 **Gestión de Caja:**
  - Apertura y cierre de turnos de mostrador.
  - Arqueo de efectivo en Pesos Argentinos (ARS), registro de cobros con Mercado Pago QR y tarjetas.
  - Control de ingresos y egresos de caja chica.
* 🌐 **Tienda Web E-commerce Sincronizada:**
  - Catálogo público para clientes en internet con carrito de compras y Checkout Pro.
  - Stock sincronizado en tiempo real con el mostrador para evitar sobreventas concurrentes.
* 📊 **Tablero de Analíticas y Métricas (Overview):**
  - Estadísticas de ventas semanales/mensuales, productos más vendidos por disciplina y análisis de rendimiento comercial.

---

## 6. Preguntas Frecuentes y Solución de Inconvenientes

### ❓ ¿Qué hago si la pistola lectora de código de barras no responde?
1. Verifica que el cable USB del lector esté bien conectado a la computadora del mostrador.
2. Abre el Bloc de Notas de Windows y dispara sobre cualquier código de barra: deberías ver aparecer los números seguidos de un "Enter". Si no escribe, desconecta y vuelve a conectar el USB.
3. En el sistema, haz clic sobre el campo de búsqueda o de código antes de disparar.

### ❓ ¿Puedo registrar una venta directa sin tener que esperar al módulo POS completo?
**¡Totalmente sí!** Esa es justamente la función de la **Venta en Mostrador (Baja Rápida)** añadida al control de stock:
1. Al desplegar las variantes de un producto en la tabla de catálogo, verás el botón índigo **`- Venta`**.
2. También puedes hacerlo desde la Ficha 360° del artículo tocando el ícono **`🛍️`** al lado de cualquier talle.
3. El sistema verificará que haya stock disponible en Saavedra 241, restará las unidades al instante y dejará registrado el egreso comercial.

### ❓ ¿Qué diferencia hay entre "Ajuste de Stock", "Transferencia" y "Venta Mostrador"?
* **Venta Mostrador:** La usas cuando un cliente compra y retira mercadería del local. Resta stock y contabiliza venta física.
* **Transferencia:** La usas cuando mueves físicamente cajas desde el depósito interno al mostrador del local (o al revés). El total de mercadería de Matacos no cambia.
* **Ajuste:** Lo usas cuando contaste la mercadería en la estantería y hay más o menos unidades de las que dice la computadora (por sobrante o faltante). Este movimiento sí corrige el total general.

### ❓ ¿Cómo elimino un producto que ya no se va a comercializar?
En lugar de borrarlo (lo cual arruinaría el historial contable de ventas pasadas), utiliza la opción **Desactivar / Dar de baja**. El producto quedará oculto del catálogo de venta pero se conservarán sus registros y estadísticas históricas. Puedes reactivarlo con un solo clic si vuelve a ingresar en el futuro.

### ❓ ¿Cómo se formatean los precios en el sistema?
El sistema aplica automáticamente la convención oficial de Pesos Argentinos: `$ 45.000,00` (con punto para los miles y coma para los centavos). Al ingresar números en los formularios, solo debes escribir los dígitos (ej: `45000`), el sistema se encarga del formato.

---

## 7. Guía de Capturas de Pantalla Recomendadas

Para que la versión final de este manual (en formato PDF o página web interna) sea 100% visual y amigable para el personal, se recomienda al equipo de desarrollo y diseño incorporar las siguientes **11 capturas de pantalla**. 

Cada imagen debe tomarse con una resolución mínima de **1920x1080 px** y guardarse en la carpeta `docs/imagenes/` con el nombre indicado en la tabla:

| Ref | Nombre de Archivo Sugerido | Pantalla a Capturar | Elementos a Resaltar (con recuadro rojo o flecha) |
| :-: | :--- | :--- | :--- |
| **01** | `01_pantalla_general_inventario.png` | Pantalla principal del catálogo de inventario | Menú lateral izquierdo, tarjetas de métricas superiores (Productos, Valorización) y buscador. |
| **02** | `02_conmutador_tarjetas_tabla.png` | Cabecera del listado y fila de variantes | Botones de vista (Tarjetas vs. Tabla) y la fila desplegada con el botón índigo **`- Venta`** resaltado. |
| **03** | `03_modal_alta_producto.png` | Modal de creación de nuevo producto abierto | Pestaña de cálculo de precios (Costo/Venta), botón "Generar Código Interno" y tabla de variantes. |
| **04** | `04_ficha_detalle_producto.png` | Ficha 360° de un producto (ej: Zapatilla Asics) | Comparativa Stock Salón vs. Stock Depósito, tabla de talles (AR/US/EU/CM) y botón rápido **`🛍️`** de venta por talle. |
| **05** | `05_modal_movimiento_stock.png` | Modal de Movimiento de Stock | Opción índigo **"Venta Mostrador (- Stock)"** seleccionada, selector de talle y cálculo de unidades resultantes. |
| **06** | `06_cajon_alertas_stock.png` | Cajón lateral derecho de Alertas desplegado | Campana con badge rojo pulsante, tarjetas de productos agotados y botón verde "Reponer Stock". |
| **07** | `07_actualizacion_masiva_precios.png` | Modal de Precios en Lote con simulación | Selector de Marca/Disciplina, campo de porcentaje (+15%) y tabla comparativa de impacto previo. |
| **08** | `08_historial_precios.png` | Modal de Historial de Precios de un artículo | Lista cronológica con fechas, precios anteriores vs. nuevos y porcentajes de variación. |
| **09** | `09_impresion_etiquetas_termicas.png` | Modal de Impresión de Etiquetas Térmicas | Selector de rollo (50x30mm), selector de copias por talle y vista previa gráfica de la etiqueta con código de barras. |
| **10** | `10_importacion_masiva_excel.png` | Modal de Importación Masiva de Excel/CSV | Zona de Drag & Drop para soltar el archivo, enlace a la plantilla descargable y tabla de validación de filas. |
| **11** | `11_gestor_categorias_marcas.png` | Modal del Gestor Maestro de Categorías | Pestañas de Disciplinas, Categorías y Marcas, y botón "+ Nueva Categoría". |

---

*Manual elaborado para **Matacos Deportes** — Saavedra 241, Formosa Capital, Argentina.*  
*Práctica Profesional Supervisada I (PPS I) — Universidad de la Cuenca del Plata.*
