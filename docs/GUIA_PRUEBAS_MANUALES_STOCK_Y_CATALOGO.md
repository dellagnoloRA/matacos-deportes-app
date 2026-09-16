# 📋 Guía de Pruebas Manuales de Aceptación: Módulo de Stock y Catálogo
## Matacos Deportes — Saavedra 241, Formosa Capital
### Práctica Profesional Supervisada I (PPS I) — Universidad de la Cuenca del Plata

---

## 🎯 1. Propósito y Alcance del Documento

Este documento contiene el **protocolo de pruebas manuales de extremo a extremo (E2E) y simulación operativa cotidiana** para dar por cerrado el incremento de **Manejo de Stock, Variantes, Clasificadores y Catálogo** de Matacos Deportes.

El objetivo no es probar código unitario ni consultas técnicas, sino **poner a prueba el sistema tal como lo utilizará el personal en Saavedra 241**:
* Atención y búsqueda rápida en mostrador con las dos terminales notebook.
* Uso de lectores de código de barras USB (emulación teclado).
* Impresión de etiquetas para rollos autoadhesivos térmicos (50x30 mm).
* Control dual de inventario: mercadería exhibida en **Salón de Ventas** vs. mercadería almacenada en **Depósito Interno**.
* Ajustes de inventario por mermas, reposiciones, ingresos de proveedores y cambios de talle.
* Modificaciones de precios ante listas de proveedores o inflación.

---

## 👥 2. Asignación de Roles en el Plan de Pruebas

| Integrante del Equipo | Rol en el Proyecto | Foco Principal de Prueba Manual |
| :--- | :--- | :--- |
| **Nahir Agustín Fornari** | Backend / Analista Funcional | Reglas de stock dual, cálculos de mermas, reposición depósito-salón y cambios de talle. |
| **Lourdes Antonella Bordón Sbardella** | Frontend / Diseñadora UI-UX | Ergonomía en pantalla (1366x768 / 1920x1080), legibilidad de etiquetas térmicas y modales. |
| **Eugenia Milagros González** | Frontend UI & QA | Formularios Zod, validaciones de errores no destructivas, persistencia y filtros dinámicos. |
| **Ricardo Agustín Dellagnolo** | Líder / Backend & Infraestructura | Integridad en base de datos PostgreSQL, concurrencia de transacciones y consistencia de datos. |

---

## ⚙️ 3. Requisitos Previos para la Ejecución

1. **Entorno de Pruebas Activo:**
   * Contenedor PostgreSQL iniciado con Docker (`docker compose up -d`).
   * Migraciones de Prisma al día (`pnpm prisma migrate dev`).
   * Servidor de desarrollo Next.js en ejecución (`pnpm dev`).
   * URL de acceso: `http://localhost:3000/admin` (o la IP local del servidor de pruebas).
2. **Dispositivos y Periféricos:**
   * Navegador web moderno (Google Chrome o Microsoft Edge recomendado).
   * Resolución de pantalla estándar de mostrador: 1366 × 768 píxeles (probar también en 1920 × 1080).
   * Lector de código de barras USB conectado (si no se dispone de uno físico en la prueba, se puede simular tipeando el número y presionando la tecla `Enter`).
   * Opcional: Impresora térmica para etiquetas (si no está disponible, verificar en la previsualización de impresión del navegador configurando papel a 50×30 mm o guardando como PDF).

---

## 🚦 4. Convención de Estados para el Registro

Al ejecutar cada prueba, marcar el resultado en las casillas correspondientes:
* **[ ] PENDIENTE:** Caso de prueba aún no ejecutado.
* **[x] APROBADO (PASS):** El comportamiento fue idéntico al esperado sin errores visuales ni lógicos.
* **[!] OBSERVACIÓN (WARN):** Funciona pero presenta detalles cosméticos, demoras o textos confusos.
* **[X] RECHAZADO (FAIL):** El sistema arrojó error, rompió la interfaz, perdió datos o calculó mal el stock.

---

## 🧪 5. Matriz de Casos de Prueba Manuales

---

### BLOQUE 1: Clasificadores Maestros (Disciplinas, Categorías y Marcas)
*Ubicación en el sistema:* Botón **"Clasificadores"** en la barra superior o pestañas de gestión maestra.

#### Caso 1.1: Alta de una Marca y Categoría Nueva
* **Objetivo:** Asegurar que se puedan crear nuevos clasificadores y que el slug se genere automáticamente.
* **Pasos:**
  1. Ir a **Clasificadores** > Pestaña **Marcas**.
  2. Hacer clic en **"Nueva Marca"**.
  3. Ingresar en el nombre: `Under Armour`.
  4. Observar que el campo identificador (*slug*) se autocomplete como `under-armour`.
  5. Guardar.
  6. Repetir en la pestaña **Categorías** creando `Mochilas y Bolsos`.
* **Resultado Esperado:** 
  * Se muestra un mensaje de confirmación verde.
  * La nueva marca y categoría aparecen inmediatamente en el listado sin recargar toda la página (`F5`).

#### Caso 1.2: Validación de Nombres Duplicados y Slug Manual
* **Objetivo:** Prevenir que dos marcas o categorías colisionen.
* **Pasos:**
  1. Intentar crear nuevamente una marca con el nombre `Under Armour`.
  2. Intentar ingresar caracteres con tildes y símbolos raros en el slug manual (`under armour #1!`).
* **Resultado Esperado:**
  * El sistema rechaza el nombre duplicado con un mensaje comprensible.
  * El generador de slugs limpia automáticamente los caracteres no permitidos.

#### Caso 1.3: Bloqueo de Eliminación por Integridad Referencial
* **Objetivo:** Proteger la base de datos para no dejar productos huérfanos al borrar una marca en uso.
* **Pasos:**
  1. Ir a la pestaña **Marcas**.
  2. Buscar una marca que ya tenga productos cargados (ej: `Arena` o `Mikasa`).
  3. Hacer clic en el icono de papelera (Eliminar).
* **Resultado Esperado:**
  * El modal de eliminación detecta que existen artículos asociados y **deshabilita el botón de borrado**.
  * Informa al usuario: *"No se puede eliminar: Esta marca está asignada a X productos activos"*.

#### Caso 1.4: Reflejo Inmediato en la Barra de Filtros
* **Objetivo:** Confirmar que una disciplina creada impacta en los chips superiores del inventario.
* **Pasos:**
  1. En Clasificadores > **Disciplinas**, crear la disciplina `Pádel`.
  2. Volver a la pantalla de **Inventario**.
* **Resultado Esperado:**
  * En la barra de chips superiores ("Todas", "Natación", "Vóley", etc.) aparece ahora `Pádel` con contador `(0)`.

---

### BLOQUE 2: Búsqueda Rápida y Navegación en Mostrador
*Ubicación en el sistema:* Pantalla principal de **Control de Inventario**.

#### Caso 2.1: Búsqueda en Vivo por Nombre Parcial
* **Objetivo:** Simular que un cliente entra al local y pide un artículo con nombre incompleto.
* **Pasos:**
  1. Situarse en el buscador general.
  2. Escribir `rocket` en minúsculas.
* **Resultado Esperado:**
  * La tabla filtra instantáneamente mostrando las `Zapatillas Gel-Rocket 11 Indoor`.
  * La respuesta es inmediata (sin retrasos molestos al tipear).

#### Caso 2.2: Búsqueda por Disparo de Lector de Código de Barras
* **Objetivo:** Simular la lectura rápida de un producto físico en mostrador.
* **Pasos:**
  1. Hacer clic en la caja de búsqueda (o presionar el atajo rápido).
  2. Disparar con la pistola lectora USB sobre el código de una variante (o teclear `779123456701-1` y pulsar `Enter`).
* **Resultado Esperado:**
  * El sistema aísla el producto específico con la variante correspondiente destacada.

#### Caso 2.3: Filtrado Combinado (Disciplina + Búsqueda por Texto)
* **Objetivo:** Comprobar que los filtros no se anulen entre sí.
* **Pasos:**
  1. Seleccionar el chip de disciplina **"Natación"**.
  2. En el buscador escribir `Mikasa`.
* **Resultado Esperado:**
  * La tabla muestra el estado vacío: *"No se encontraron productos coincidentes"*, ya que Mikasa pertenece a Vóley.
  * Al borrar la palabra `Mikasa`, reaparecen los artículos de natación.

#### Caso 2.4: Paginación y Ergonomía en Pantalla de Mostrador
* **Objetivo:** Verificar que en pantallas de notebooks (1366x768) la tabla no empuje el paginador fuera de la vista.
* **Pasos:**
  1. Con el navegador en ventana estándar de mostrador (o resolución 1366x768), observar el paginador inferior.
  2. Cambiar entre las páginas 1, 2, 3...
  3. Alternar la cantidad de ítems por página (ej: 5 vs 10).
* **Resultado Esperado:**
  * El paginador permanece siempre visible sin necesidad de hacer un scroll vertical excesivo.
  * Cambiar de página actualiza los productos mostrados y el indicador *"Mostrando página X de Y"*.

#### Caso 2.5: Alternar Vista Tabla vs. Vista Tarjetas (Cards)
* **Objetivo:** Evaluar la visualización en dispositivos táctiles o modo catálogo visual.
* **Pasos:**
  1. Hacer clic en el botón de alternar vista (icono de grilla / tabla).
* **Resultado Esperado:**
  * La vista conmuta fluidamente a tarjetas con fotos, stock discriminado y precios.
  * Ningún texto se desborda ni se corta de forma antiestética.

---

### BLOQUE 3: Alta y Edición de Productos y Variantes
*Ubicación en el sistema:* Botón **"Nuevo Producto"** / Botón **"Editar"** en la tabla.

#### Caso 3.1: Alta de Producto Padre con Variantes Múltiples de Talles y Colores
* **Objetivo:** Cargar un producto típico de zapatería deportiva con stock inicial diferenciado por ubicación.
* **Pasos:**
  1. Hacer clic en **"Nuevo Producto"**.
  2. Completar:
     * Nombre: `Zapatillas Asics Sky Elite FF 2`
     * Disciplina: `Vóley`
     * Marca: `Asics`
     * Categoría: `Calzado`
     * Precio Costo: `85000`
     * Precio Venta: `140000`
  3. En la sección de variantes, agregar 3 talles:
     * Talle `40`, Color `Azul`, Stock Salón `2`, Stock Depósito `4`, Alerta Salón `1`, Alerta Total `2`.
     * Talle `41`, Color `Azul`, Stock Salón `1`, Stock Depósito `3`, Alerta Salón `1`, Alerta Total `2`.
     * Talle `42`, Color `Azul`, Stock Salón `3`, Stock Depósito `0`, Alerta Salón `1`, Alerta Total `2`.
  4. Guardar producto.
* **Resultado Esperado:**
  * El formulario valida exitosamente los datos.
  * El producto aparece en la tabla principal con el stock total consolidado (13 unidades: 6 en salón y 7 en depósito).
  * El precio se muestra formateado en moneda argentina: `$ 140.000,00`.

#### Caso 3.2: Validación de SKU Duplicado
* **Objetivo:** Evitar colisiones de códigos internos.
* **Pasos:**
  1. Intentar crear una variante asignándole deliberadamente un SKU que ya pertenezca a otro producto existente (ej: `NAT-ARE-001`).
  2. Intentar guardar.
* **Resultado Esperado:**
  * El sistema no permite el guardado y resalta en rojo el campo del SKU indicando que ya está en uso.

#### Caso 3.3: Validación de Precios o Stocks Negativos
* **Objetivo:** Proteger contra errores de tipeo del operador.
* **Pasos:**
  1. En el formulario de producto, ingresar Precio de Venta `-500` o Stock Salón `-2`.
* **Resultado Esperado:**
  * El validador Zod impide el envío y muestra mensajes de advertencia: *"El precio no puede ser negativo"* y *"El stock no puede ser negativo"*.

#### Caso 3.4: Edición de Producto Existente
* **Objetivo:** Modificar descripción y precio base sin alterar el stock de las variantes.
* **Pasos:**
  1. Seleccionar el producto recién creado y pulsar **"Editar"**.
  2. Modificar el nombre agregándole `Edición Especial 2026`.
  3. Modificar el precio de venta a `$ 145.000,00`.
  4. Guardar.
* **Resultado Esperado:**
  * La tabla refleja el nuevo nombre y precio.
  * Las cantidades de stock en salón y depósito de cada talle se mantienen intactas.

---

### BLOQUE 4: Operaciones y Movimientos de Stock Físico
*Ubicación en el sistema:* Botón **"Ajustar Stock"** (icono de flechas de intercambio o cajas) en la fila del producto o en su ficha.

#### Caso 4.1: Ingreso por Compra de Proveedor
* **Objetivo:** Simular la llegada de un pedido mayorista con remito.
* **Pasos:**
  1. Ubicar las `Zapatillas Asics Sky Elite FF 2`.
  2. Abrir el modal de movimiento de stock.
  3. Seleccionar Operación: **"Ingreso por Compra"**.
  4. Seleccionar Variante: `Talle 41 - Azul`.
  5. Ubicación Destino: **"Depósito"**.
  6. Cantidad: `5`.
  7. Motivo: `Factura Distribuidor Asics #8841`.
  8. Confirmar.
* **Resultado Esperado:**
  * El stock en depósito del talle 41 pasa de 3 a 8 unidades.
  * El stock en salón se mantiene en 1.
  * El total del producto aumenta en 5 unidades.

#### Caso 4.2: Transferencia Interna (Reposición Depósito ➔ Mostrador)
* **Objetivo:** El mostrador vendió casi todo el talle 40 y el vendedor va al depósito a reponer el perchero/estante.
* **Pasos:**
  1. Abrir modal de movimientos para el mismo producto.
  2. Seleccionar Operación: **"Transferencia Interna"** (Depósito a Salón).
  3. Seleccionar Variante: `Talle 40 - Azul`.
  4. Cantidad: `2`.
  5. Motivo: `Reposición mostrador turno tarde`.
  6. Confirmar.
* **Resultado Esperado:**
  * En Salón pasa de 2 a 4 unidades (+2).
  * En Depósito pasa de 4 a 2 unidades (-2).
  * El stock general total no cambia (sigue siendo el mismo, solo cambió la ubicación física).

#### Caso 4.3: Regla de Bloqueo por Stock Insuficiente en Origen
* **Objetivo:** Evitar números negativos por traslados ficticios.
* **Pasos:**
  1. En el mismo producto, seleccionar Variante `Talle 42` (que tiene 0 en depósito).
  2. Intentar hacer una Transferencia Interna de Depósito a Salón por `1` unidad.
* **Resultado Esperado:**
  * El sistema bloquea la acción e indica claramente: *"Stock insuficiente en Depósito para realizar el traslado (Disponible: 0)"*.

#### Caso 4.4: Ajuste de Egreso por Merma o Pérdida (Auditoría Estricta)
* **Objetivo:** Registrar un producto dañado en mostrador asegurando trazabilidad contable.
* **Pasos:**
  1. Seleccionar Operación: **"Ajuste de Egreso"**.
  2. Ubicación: **"Salón"**.
  3. Cantidad: `1`.
  4. Dejar el campo **Motivo vacío** e intentar confirmar.
  5. Observar el bloqueo.
  6. Completar el motivo: `Puntera despegada en exhibición - Enviado a garantía`.
  7. Confirmar.
* **Resultado Esperado:**
  * El sistema exige obligatoriamente el motivo para cualquier ajuste manual de merma o egreso.
  * El stock en salón se reduce en 1 y queda registrado el justificativo.

#### Caso 4.5: Cambio de Talle de Mostrador (Operación Atómica Simultánea)
* **Objetivo:** Simular la situación cotidiana en la que un cliente regresa al local con el ticket para cambiar un talle que le quedó chico.
* **Pasos:**
  1. En el modal de movimientos, activar la pestaña o modo **"Cambio de Talle"**.
  2. Variante que entrega el cliente (reingreso): `Talle 40 - Azul` (Cantidad: 1).
  3. Variante que se lleva el cliente (egreso): `Talle 41 - Azul` (Cantidad: 1).
  4. Motivo: `Cambio por calce - Ticket #10452`.
  5. Confirmar.
* **Resultado Esperado:**
  * En una única transacción instantánea:
    * El stock de Talle 40 aumenta en 1 unidad.
    * El stock de Talle 41 disminuye en 1 unidad.
  * La caja o balance del producto queda cuadrado sin desfases.

---

### BLOQUE 5: Ficha 360° del Producto y Auditoría de Movimientos
*Ubicación en el sistema:* Clic sobre el nombre del producto o botón **"Ver Detalle"** (icono de ojo).

#### Caso 5.1: Verificación de la Ficha Integral y Pestañas
* **Objetivo:** Comprobar que toda la información comercial y física esté consolidada.
* **Pasos:**
  1. Abrir la ficha de las `Zapatillas Asics Sky Elite FF 2`.
  2. Recorrer las pestañas: **Visión general**, **Detalles**, **Variantes**, **Movimientos & Auditoría**, **Tarifas**, **Guía de Talles**.
* **Resultado Esperado:**
  * Se muestran las tarjetas de stock discriminadas por ubicación (Salón vs Depósito).
  * En "Guía de talles" se observan las conversiones de talles (AR, US, EU, cm).
  * El margen de ganancia calculado coincide con la fórmula `(Precio Venta - Precio Costo)`.

#### Caso 5.2: Historial Cronológico de Movimientos (Auditoría)
* **Objetivo:** Verificar que ningún movimiento quede sin registrar.
* **Pasos:**
  1. Ir a la pestaña **"Movimientos & Auditoría"**.
* **Resultado Esperado:**
  * Se listan en orden descendente (el más reciente primero) todos los eventos realizados en el Bloque 4:
    * El cambio de talle (Ticket #10452).
    * El ajuste de egreso por garantía.
    * La transferencia interna de depósito a salón.
    * El ingreso inicial de compra por factura distribuidor.
  * Cada fila muestra la hora local argentina (`America/Argentina/Buenos_Aires`), el usuario responsable, la cantidad y el stock resultante (`stockAfter`).

#### Caso 5.3: Ordenamiento de Variantes
* **Objetivo:** Facilitar la lectura rápida de talles al vendedor.
* **Pasos:**
  1. En la pestaña **"Variantes"**, cambiar el criterio de ordenamiento: Por Talle (de menor a mayor), Por Color, Por Stock.
* **Resultado Esperado:**
  * Los talles se ordenan con sentido comercial humano (`39 ➔ 40 ➔ 41 ➔ 42` o `XS ➔ S ➔ M ➔ L ➔ XL`).

---

### BLOQUE 6: Sistema de Alertas de Stock y Prevención de Quiebres
*Ubicación en el sistema:* Botón **"Alertas"** (icono de campana con contador) en la barra superior o drawer lateral.

#### Caso 6.1: Alerta por Quiebre Total (`OUT_OF_STOCK`)
* **Objetivo:** Detectar artículos totalmente agotados para solicitar compra al proveedor.
* **Pasos:**
  1. En un producto de prueba, realizar un egreso hasta que tanto Salón como Depósito queden en `0`.
  2. Observar el botón de la campana en la barra superior.
* **Resultado Esperado:**
  * El contador numérico de la campana se incrementa automáticamente.
  * Al abrir el panel de alertas, el producto figura bajo la categoría **"Agotado Total"** con badge rojo de alta prioridad.

#### Caso 6.2: Alerta por Salón Vacío con Stock en Depósito (`STORE_EMPTY_WAREHOUSE_AVAIL`)
* **Objetivo:** Detectar la situación crítica donde un cliente pide un talle en mostrador, el vendedor cree que no hay, pero en realidad está guardado en el depósito.
* **Pasos:**
  1. Verificar un producto que tenga Stock Salón = `0` y Stock Depósito = `4` (ej: Talle 39 de Zapatillas Gel-Rocket).
  2. Abrir el Drawer de Alertas de Stock.
* **Resultado Esperado:**
  * La variante figura con aviso amarillo/ámbar: *"Salón sin stock — Hay 4 unid. en depósito para reponer"*.
  * Se incluye un botón directo de acción: **"Transferir a Salón"**.

#### Caso 6.3: Reposición Rápida con 1 Clic desde la Alerta
* **Objetivo:** Resolver el quiebre de mostrador sin tener que navegar por todo el catálogo.
* **Pasos:**
  1. En la tarjeta de alerta anterior, hacer clic en el botón de acción rápida **"Transferir a Salón"**.
  2. Ingresar la cantidad a trasladar (ej: `2`) y confirmar.
* **Resultado Esperado:**
  * El stock se traslada inmediatamente.
  * La variante desaparece de la lista de quiebres de mostrador o actualiza su estado.

#### Caso 6.4: Regla de Negocio: Exclusión de Artículos Inactivos
* **Objetivo:** Comprobar que artículos dados de baja no ensucien el panel de compras.
* **Pasos:**
  1. Dar de baja lógica un producto que estaba sin stock (ver Bloque 7).
  2. Abrir el panel de alertas.
* **Resultado Esperado:**
  * El producto dado de baja no aparece en las alertas de compra ni suma en el contador de la campana.

---

### BLOQUE 7: Bajas Lógicas (Soft Delete) y Reactivación de Productos
*Ubicación en el sistema:* Botón de papelera en la tabla / Filtro de Activos e Inactivos.

#### Caso 7.1: Dar de Baja un Producto (Baja Lógica)
* **Objetivo:** Retirar del mostrador un artículo discontinuado sin romper las ventas históricas ni los reportes.
* **Pasos:**
  1. Seleccionar un producto de prueba y presionar el botón de **Eliminar** (papelera).
  2. Leer el modal de advertencia de baja lógica.
  3. Confirmar la baja.
* **Resultado Esperado:**
  * El producto desaparece inmediatamente del listado de productos activos.
  * Se notifica con un mensaje: *"Producto dado de baja del catálogo activo (baja lógica). Podés consultarlo o reactivarlo en Inactivos"*.
  * La base de datos no eliminó el registro (preserva la integridad de auditoría).

#### Caso 7.2: Búsqueda y Filtro de Inactivos
* **Objetivo:** Verificar que los productos inactivos no interfieran con la atención al cliente pero sigan accesibles.
* **Pasos:**
  1. Cambiar el filtro de estado superior de **"Activos"** a **"Inactivos / Dados de baja"**.
* **Resultado Esperado:**
  * La tabla muestra únicamente los productos que fueron dados de baja.
  * Los botones de edición y venta quedan inhabilitados o en modo lectura.

#### Caso 7.3: Reactivación Inmediata
* **Objetivo:** Volver a comercializar un producto que volvió a entrar.
* **Pasos:**
  1. En el listado de Inactivos, presionar el botón **"Reactivar"** (icono de flecha circular verde).
  2. Volver al filtro de "Activos".
* **Resultado Esperado:**
  * El producto reaparece normalmente en el catálogo activo con todo su stock e historial intacto.

---

### BLOQUE 8: Actualización Masiva de Precios por Lote
*Ubicación en el sistema:* Botón **"Actualizar Precios"** (icono de porcentaje `%`) en la barra superior del inventario.

#### Caso 8.1: Aumento Porcentual por Marca con Redondeo Comercial
* **Objetivo:** Simular la aplicación de una nueva lista de precios enviada por un proveedor (ej: Mikasa +15%).
* **Pasos:**
  1. Hacer clic en **"Actualizar Precios"**.
  2. Alcance: Seleccionar **"Por Marca"** > Elegir `Mikasa`.
  3. Porcentaje: Ingresar `15` (aumento del 15%).
  4. Campo a Modificar: **"Precio de Venta"**.
  5. Política de Redondeo: Elegir **"Al múltiplo de $ 50 más cercano"**.
  6. Motivo: `Nueva lista oficial Mikasa Vóley Mayo 2026`.
* **Resultado Esperado:**
  * El simulador interactivo muestra antes de aplicar:
    * Cantidad de productos y variantes alcanzadas.
    * Tabla comparativa con precios viejos vs. precios nuevos redondeados (ej: si el cálculo daba `$ 166.750,00`, queda redondeado a `$ 166.750,00` o al múltiplo correspondiente sin centavos extraños).
    * Sumatoria total del valor del inventario.

#### Caso 8.2: Aplicación y Verificación en la Tabla Principal
* **Objetivo:** Confirmar que los precios nuevos impacten efectivamente en la base de datos.
* **Pasos:**
  1. Hacer clic en **"Aplicar Actualización"** en el diálogo de confirmación.
  2. Volver a la tabla de productos y buscar los artículos de la marca Mikasa.
* **Resultado Esperado:**
  * Todos los balones Mikasa muestran su nuevo precio de venta redondeado.
  * No se alteraron los precios de otras marcas (ej: Arena o Speedo quedaron iguales).

#### Caso 8.3: Aumento a una Selección Manual de Productos
* **Objetivo:** Modificar el precio únicamente de 2 o 3 productos puntuales tildados a mano.
* **Pasos:**
  1. En la tabla de inventario, tildar los casilleros de verificación (checkboxes) a la izquierda de 2 productos cualesquiera.
  2. Observar que aparece la barra flotante indicando *"2 productos seleccionados"*.
  3. Hacer clic en **"Actualizar Precios de Seleccionados"**.
  4. Aplicar un aumento del `10%`.
* **Resultado Esperado:**
  * Solo los 2 artículos seleccionados reciben la modificación.
  * Los casilleros se deseleccionan prolijamente al finalizar.

#### Caso 8.4: Consulta del Historial de Precios Auditado
* **Objetivo:** Comprobar que el administrador pueda auditar qué se modificó y cuándo.
* **Pasos:**
  1. Hacer clic en el botón de historial (icono de reloj/historial junto al de precios).
* **Resultado Esperado:**
  * Se abre el modal **"Historial de Modificaciones de Precios"**.
  * Aparecen registrados los lotes ejecutados con fecha, hora, motivo, usuario, porcentaje aplicado y el detalle producto por producto.

---

### BLOQUE 9: Carga Masiva de Mercadería desde Excel/CSV
*Ubicación en el sistema:* Botón **"Importar Lote"** (icono de hoja de cálculo / nube verde).

#### Caso 9.1: Descarga de la Plantilla Oficial
* **Objetivo:** Verificar que el sistema suministre el formato correcto para los proveedores o personal administrativo.
* **Pasos:**
  1. Abrir el modal de **Carga Masiva**.
  2. Hacer clic en **"Descargar Plantilla Excel (.xlsx)"**.
  3. Abrir el archivo descargado en la computadora.
* **Resultado Esperado:**
  * El archivo contiene los encabezados estandarizados: `disciplina`, `categoria`, `marca`, `nombre_producto`, `talle`, `color`, `sku`, `codigo_barra`, `stock_salon`, `stock_deposito`, `costo`, `precio`.
  * Incluye filas de ejemplo claras.

#### Caso 9.2: Asistente Paso a Paso (Modo Acumular Stock)
* **Objetivo:** Simular la carga de un lote de reposición sumando al inventario existente.
* **Pasos:**
  1. En la plantilla, agregar un archivo con 2 productos nuevos y 1 producto que ya exista en el sistema.
  2. Seleccionar Modo de Ingestión: **"Acumular Stock"** (sumar cantidades).
  3. Subir el archivo en el Paso 1 del asistente.
  4. Revisar la previsualización y validación del Paso 2 y 3.
  5. Confirmar ingestión en el Paso 4.
* **Resultado Esperado:**
  * El asistente procesa el lote sin bloquear el navegador.
  * En el resumen final reporta: *"X productos creados, Y productos actualizados, 0 errores"*.
  * El producto existente incrementó su stock según lo indicado en el Excel.

#### Caso 9.3: Detección de Errores en Filas Inválidas
* **Objetivo:** Validar que un archivo con datos corruptos no rompa la base de datos.
* **Pasos:**
  1. Modificar una fila del Excel colocando letras en la columna de precio (`"mil pesos"`) o dejando el nombre vacío.
  2. Intentar procesar el archivo.
* **Resultado Esperado:**
  * El importador detecta el problema antes de escribir en la base de datos.
  * Muestra una tabla clara de advertencia indicando la **fila exacta del error** y el motivo: *"Fila 4: El precio debe ser un valor numérico"*.

---

### BLOQUE 10: Impresión Térmica de Etiquetas con Código de Barras
*Ubicación en el sistema:* Botón **"Imprimir Etiquetas"** (icono de código de barras o impresora) en la fila del producto o en su ficha.

#### Caso 10.1: Selección de Variantes y Cantidad de Copias
* **Objetivo:** Preparar la impresión de etiquetas para mercadería recién desembalada.
* **Pasos:**
  1. En cualquier producto con múltiples variantes, abrir el modal de **Impresión de Etiquetas**.
  2. Seleccionar el formato de papel: **"Rollo Térmico 50 x 30 mm"** (estándar para estanterías y cajas).
  3. Observar la cantidad de copias sugeridas.
  4. Modificar manualmente para imprimir 2 copias del talle 40 y 3 copias del talle 41.
* **Resultado Esperado:**
  * El contador total de etiquetas a imprimir se actualiza a `5`.
  * La vista previa lateral muestra la etiqueta a tamaño real con nombre de producto, marca, talle, color, precio formateado y código de barras.

#### Caso 10.2: Generación Automática de Códigos Faltantes (EAN-13 Interno)
* **Objetivo:** Asegurar que artículos sin código de fábrica puedan ser etiquetados con el estándar interno de Matacos Deportes.
* **Pasos:**
  1. Si una variante no tenía código de barras asignado, presionar el botón **"Generar Códigos Faltantes"**.
* **Resultado Esperado:**
  * El sistema calcula un código numérico EAN-13 válido que inicia con el prefijo interno `200` y calcula matemáticamente el dígito verificador correcto.
  * Las barras del dibujo se renderizan de forma nítida (vectorial SVG).

#### Caso 10.3: Compatibilidad de Ocultar/Mostrar Precios
* **Objetivo:** Imprimir etiquetas para calzado de exhibición donde el precio cambia con frecuencia y solo se requiere el código para escaneo.
* **Pasos:**
  1. Desmarcar la casilla **"Mostrar precio en etiqueta"**.
* **Resultado Esperado:**
  * La vista previa retira el precio de la etiqueta dejando el código de barras más grande y legible para la pistola.

#### Caso 10.4: Prueba Física de Disparo de Lector Láser
* **Objetivo:** Confirmar que la etiqueta impresa sea 100% legible por el hardware de Saavedra 241.
* **Pasos:**
  1. Imprimir la etiqueta generada (o ampliar la vista previa en la pantalla).
  2. Apuntar el lector de código de barras USB y presionar el gatillo.
* **Resultado Esperado:**
  * El lector emite el pitido de lectura exitosa.
  * El número decodificado ingresa instantáneamente al sistema sin caracteres erróneos.

---

## 📝 6. Planilla de Registro y Control de Pruebas (Checklist para el Equipo)

Imprimir o completar esta tabla a medida que se ejecuten las pruebas en las computadoras de prueba:

| ID Caso | Escenario Evaluado | Responsable | Estado (PASS / WARN / FAIL) | Observaciones / Notas del Testeador |
| :--- | :--- | :--- | :---: | :--- |
| **CP-1.1** | Alta de Marca y Categoría (Slug auto) | Bordón Sbardella | [ ] | |
| **CP-1.2** | Validación de duplicados y slugs | González | [ ] | |
| **CP-1.3** | Bloqueo de eliminación con productos | Fornari | [ ] | |
| **CP-1.4** | Reflejo en chips de disciplinas | Bordón Sbardella | [ ] | |
| **CP-2.1** | Búsqueda por texto parcial en vivo | González | [ ] | |
| **CP-2.2** | Búsqueda por pistola de código de barras | Dellagnolo | [ ] | |
| **CP-2.3** | Filtrado combinado disciplina + texto | González | [ ] | |
| **CP-2.4** | Paginación y ergonomía en 1366x768 | Bordón Sbardella | [ ] | |
| **CP-2.5** | Conmutación Grilla vs Tabla | Bordón Sbardella | [ ] | |
| **CP-3.1** | Alta de producto con variantes múltiples | Fornari | [ ] | |
| **CP-3.2** | Validación de SKU único duplicado | González | [ ] | |
| **CP-3.3** | Validación de valores numéricos negativos| González | [ ] | |
| **CP-3.4** | Edición de producto sin alterar stock | Fornari | [ ] | |
| **CP-4.1** | Ingreso por compra de proveedor | Fornari | [ ] | |
| **CP-4.2** | Transferencia depósito ➔ mostrador | Fornari | [ ] | |
| **CP-4.3** | Bloqueo por falta de stock en depósito | Fornari | [ ] | |
| **CP-4.4** | Ajuste de egreso por merma con motivo | Dellagnolo | [ ] | |
| **CP-4.5** | Cambio de talle simultáneo con ticket | Fornari / González | [ ] | |
| **CP-5.1** | Consulta 360° y cálculo de margen | Bordón Sbardella | [ ] | |
| **CP-5.2** | Auditoría cronológica de movimientos | Dellagnolo | [ ] | |
| **CP-5.3** | Ordenamiento inteligente de talles | Bordón Sbardella | [ ] | |
| **CP-6.1** | Alerta por quiebre total (`OUT_OF_STOCK`)| Fornari | [ ] | |
| **CP-6.2** | Alerta por salón vacío y stock en depósito| Fornari | [ ] | |
| **CP-6.3** | Transferencia rápida con 1 clic en Drawer| González | [ ] | |
| **CP-6.4** | Exclusión de alertas en dados de baja | Fornari | [ ] | |
| **CP-7.1** | Baja lógica de producto | Dellagnolo | [ ] | |
| **CP-7.2** | Filtro de inactivos / dados de baja | González | [ ] | |
| **CP-7.3** | Reactivación inmediata con 1 clic | González | [ ] | |
| **CP-8.1** | Aumento masivo con redondeo a $50 | Fornari / Dellagnolo | [ ] | |
| **CP-8.2** | Verificación de precios nuevos en tabla | Fornari | [ ] | |
| **CP-8.3** | Aumento selectivo de productos tildados | González | [ ] | |
| **CP-8.4** | Auditoría en Historial de Precios | Dellagnolo | [ ] | |
| **CP-9.1** | Descarga de plantilla Excel oficial | Bordón Sbardella | [ ] | |
| **CP-9.2** | Ingestión masiva (Acumular stock) | Dellagnolo / Fornari | [ ] | |
| **CP-9.3** | Detección granular de errores en filas | González | [ ] | |
| **CP-10.1**| Selección de variantes y copias térmica | Bordón Sbardella | [ ] | |
| **CP-10.2**| Generación de EAN-13 interno automático| Dellagnolo | [ ] | |
| **CP-10.3**| Configuración de visibilidad de precios | Bordón Sbardella | [ ] | |
| **CP-10.4**| Lectura física con pistola láser USB | Dellagnolo | [ ] | |

---

## 🐛 7. Protocolo de Reporte de Hallazgos y Errores (Bugs)

Si durante la ejecución de alguna prueba el comportamiento difiere de lo esperado, el integrante del equipo debe documentar el hallazgo siguiendo este formato estándar antes de transferir la corrección al desarrollador asignado:

```markdown
### 🐞 Reporte de Hallazgo #[Número]
* **Caso de Prueba Afectado:** [Ej: CP-4.5 Cambio de talle]
* **Severidad:** [Alta: Bloquea la operación | Media: Funciona pero calcula mal | Baja: Visual o cosmético]
* **Responsable que detectó:** [Nombre del integrante]
* **Dispositivo / Navegador:** [Ej: Notebook Mostrador 1 / Chrome 124 / 1366x768]
* **Pasos para reproducir:**
  1. ...
  2. ...
* **Comportamiento obtenido:** [Qué ocurrió en pantalla o en los números]
* **Comportamiento esperado:** [Qué dice la regla de negocio que debió ocurrir]
* **Captura de pantalla o mensaje de error exacto:** [Adjuntar imagen o texto de consola]
```

---

## 🏆 8. Criterio de Aceptación Final para el Despliegue en Saavedra 241

El incremento se considerará **aprobado para instalación definitiva en las computadoras de Matacos Deportes** cuando se cumplan las siguientes condiciones:

1. **100% de los Casos Críticos Aprobados:**
   * Cero errores en movimientos de stock (transferencias, ingresos y bajas).
   * Cero inconsistencias en el cálculo de stock salón vs. depósito.
   * Cero fallas en la búsqueda por código de barras.
2. **Alertas Fidedignas:**
   * La campana de alertas no debe emitir falsos positivos sobre artículos inactivos ni sobre variantes con stock disponible.
3. **Impresión Validada:**
   * Al menos 3 etiquetas impresas en la bobina térmica de 50x30 mm leídas sin fallas por la pistola USB.
4. **Sign-Off de los Integrantes:**
   * Firma y conformidad de los cuatro integrantes del equipo en la planilla de control.
