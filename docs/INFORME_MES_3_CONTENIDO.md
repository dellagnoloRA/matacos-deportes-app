# Desarrollo de Contenidos — Informe Mensual Mes 3 (E-commerce y Seguridad)

---

## 1. Diseño de FrontEnd / Prototipos (Diseños en canva)

El diseño de la interfaz de usuario para el canal digital de Matacos Deportes se abordó mediante una etapa de prototipado rápido en la herramienta Canva, previo a la codificación en Next.js 15, Tailwind CSS y componentes de shadcn/ui.

El objetivo central de estos prototipos fue definir la arquitectura de información, la jerarquía visual de los elementos y los flujos de interacción del cliente, validando las decisiones estéticas directamente con los dueños del comercio antes de implementar la lógica del frontend.

### Criterios Clave de Diseño
* **Identidad de Marca:** Se respetó la paleta institucional centrada en verdes deportivos oscuros (#06241d), verdes intensos (#00D615) y acentos lima (#c2f25b), complementados con fondos claros y limpios para asegurar el contraste de los productos.
* **Enfoque Mobile-First:** Dado que más del 80% del tráfico en tiendas deportivas minoristas proviene de smartphones, las interfaces se proyectaron priorizando pantallas estrechas: menús colapsables accesibles con el pulgar, carruseles táctiles y botones de acción rápida flotantes.
* **Componentes Principales Diseñados:**
  1. **Portada / Landing Page:** Carrusel superior de campañas (hero banner), barra de búsqueda visible, accesos directos a las 5 disciplinas estratégicas (Natación, Vóley, Crocs/Urbano, Fitness, Calzado) y vitrinas destacadas.
  2. **Catálogo Facetado:** Grilla responsiva con tarjetas de producto que exponen imagen, marca, título, precio en Pesos Argentinos (ARS) y talles disponibles, acompañada de un panel lateral de filtros rápidos.
  3. **Ficha de Detalle de Producto (PDP):** Selector visual de color asociado a la galería de fotos, matriz interactiva de talles (con visualización de talles agotados deshabilitados), indicador de stock restante y botón de consulta directa por WhatsApp.
  4. **Proceso de Compra (Checkout de Invitado):** Formulario de un solo paso enfocado en la simplicidad, permitiendo seleccionar entre retiro gratuito en Saavedra 241 o envío a domicilio.

Figura [Prototipo Canva - Portada / Landing Page del E-commerce]

Figura [Prototipo Canva - Catálogo Público con Filtros Facetados]

Figura [Prototipo Canva - Ficha de Detalle de Producto y Selector de Variantes]

Figura [Prototipo Canva - Carrito Lateral y Formulario de Guest Checkout]

---

## 2. Sistemas Parecidos

Para el diseño funcional y comercial de la tienda se llevó a cabo un proceso de benchmarking analizando cuatro plataformas representativas de la industria deportiva: dos comercios multimarca consolidados en el mercado argentino (Rossetti Deportes y SoloDeportes) y dos tiendas de marcas líderes internacionales con presencia local (Adidas Argentina y Puma Argentina).

### 2.1. Rosetti (Rossetti Deportes)
Rossetti es una cadena deportiva argentina con fuerte implantación física en el interior del país y una estructura multimarca comparable a Matacos Deportes.
* **Aspectos Analizados:** Su tienda online destaca por una categorización por disciplinas deportivas claras y la visibilidad de promociones bancarias y cuotas en la cabecera.
* **Lecciones Aprendidas para Matacos:** La organización del menú principal por disciplinas técnicas (Natación, Vóley, Fitness) en lugar de divisiones genéricas tradicionales, y la inclusión de banners dinámicos con llamadas a la acción directas.

Figura [Captura de referencia - Navegación y estructura de Rossetti Deportes]

### 2.2. Solo deporte (SoloDeportes)
SoloDeportes constituye uno de los referentes nacionales de mayor volumen de ventas digitales en indumentaria y calzado deportivo.
* **Aspectos Analizados:** Destaca por la velocidad de respuesta de su catálogo y la precisión de sus filtros facetados, permitiendo al usuario filtrar simultáneamente por talle, marca y género sin recargar la página.
* **Lecciones Aprendidas para Matacos:** La implementación de la búsqueda predictiva instantánea (< 50 ms) y la decisión de mostrar los talles agotados visualmente deshabilitados en lugar de eliminarlos, evitando frustración en el usuario al navegar.

Figura [Captura de referencia - Catálogo y filtros de SoloDeportes]

### 2.3. Adidas (Argentina)
Como líder global, el sitio de Adidas ofrece el estándar de oro en cuanto a experiencia inmersiva en la ficha de producto.
* **Aspectos Analizados:** Excelente fotografía de producto en múltiples ángulos, asociación directa entre el color seleccionado y las fotos de la galería, y una presentación clara de políticas de devolución y cambio.
* **Lecciones Aprendidas para Matacos:** La estructura de la galería de fotos donde cada variante de color carga su conjunto específico de imágenes, y la inclusión visible de las políticas de cambio de Saavedra 241 en el pie de la ficha técnica.

Figura [Captura de referencia - Ficha de producto y selector de talles de Adidas]

### 2.4. Puma (Argentina)
Puma se caracteriza por un diseño moderno, ágil y orientado al público joven y urbano, nicho muy afín a las líneas de calzado urbano y tiempo libre de Matacos.
* **Aspectos Analizados:** Destaca por su carrusel hero de alto impacto visual, sus vitrinas temáticas ("Novedades", "Lanzamientos") y un checkout simplificado que no obliga al usuario a crear una cuenta antes de pagar.
* **Lecciones Aprendidas para Matacos:** La adopción del modelo Guest Checkout (compra como invitado) para reducir el abandono de carrito, y la utilización de un carrusel principal administrable desde el panel de control.

Figura [Captura de referencia - Portada y carrusel hero de Puma]

---

## 3. Justificación de Roles

En las primeras etapas del proyecto, la seguridad y el control de acceso se modelaron mediante un enumerador estático en código (`enum Role { ADMIN, CAJERO, DESPACHO }`). Si bien este enfoque permitió arrancar rápidamente, el análisis operativo del local demostró que los roles fijos son insuficientes para la gestión real del negocio por las siguientes razones:

1. **Inflexibilidad Operativa:** En Saavedra 241, las responsabilidades no son estáticas. Un cajero del turno tarde puede necesitar autorización para registrar egresos de caja chica (pagar fletes), mientras que un cajero nuevo no debería tener ese permiso. Un enum fijo obliga a modificar el código fuente y redesplegar el software ante cualquier cambio administrativo.
2. **Principio de Mínimo Privilegio:** Cada integrante del personal debe contar únicamente con las autorizaciones estrictamente necesarias para su labor. El modelo anterior no permitía, por ejemplo, que un vendedor de salón aplicara descuentos manuales sin tener que otorgarle acceso total al inventario o a los costos de compra.
3. **Adopción del Modelo de Perfiles Jerárquicos y Permisos Atómicos:**
   * **Permisos Atómicos:** Unidades mínimas de autorización ligadas al código (`pos.cobrar`, `caja.cerrar_arqueo`, `inventario.precios`, etc.).
   * **Perfiles Gestionables:** Plantillas creadas y editadas por el Administrador desde la interfaz de usuario, donde tilda casillas de verificación según las necesidades operativas.
   * **Jerarquía Reflexiva:** Un perfil superior (ej. Encargado) puede heredar automáticamente los permisos de un perfil inferior (ej. Cajero) sin requerir configuración redundante.
4. **Independencia Total de Clientes Web:** El modelo de roles internos queda 100% aislado del e-commerce. Los clientes web no poseen perfiles de seguridad interna ni acceden a la tabla de personal, blindando el sistema contra accesos no autorizados al mostrador o a las métricas del negocio.

---

## 4. Organigrama

El funcionamiento del establecimiento comercial de Saavedra 241 se estructura de acuerdo al siguiente organigrama funcional:

```
                      +---------------------------------------+
                      |      Dirección General / Propietarios  |
                      |    (Sandra Mujica / Miguel Marchi)    |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |      Encargado General de Local       |
                      |        (Supervisión y Auditoría)      |
                      +---------------------------------------+
                                          |
         +--------------------------------+-------------------------------+
         |                                |                               |
         v                                v                               v
+------------------+            +------------------+            +------------------+
|  Venta de Salón  |            |  Caja Mostrador  |            |  E-commerce y    |
| (Terminal Salón) |            | (Terminal Caja)  |            |     Despacho     |
+------------------+            +------------------+            +------------------+
| - Asesoramiento  |            | - Apertura/Fondo |            | - Preparación web|
| - Preventas PRV  |            | - Cobranza multi |            | - Empaquetado    |
| - Consulta stock |            | - Arqueo ciego   |            | - Cadetería      |
| - Verif. precios |            | - Ticket 80mm    |            | - Actualiz. web  |
+------------------+            +------------------+            +------------------+
```

Figura [Organigrama operativo y funcional de Matacos Deportes]

### Descripción de Puestos y Responsabilidades
* **Dirección General / Propietarios:** Control total de la empresa, fijación de políticas comerciales, definición de listas de precios y márgenes de rentabilidad, auditoría de arqueos consolidados y administración de usuarios/perfiles.
* **Encargado General de Local:** Supervisión operativa de piso, autorización de excepciones de precios y cambios fuera de término, control de movimientos de caja chica y reposición física entre depósito interno y salón.
* **Vendedor de Salón (Terminal 1):** Atención al cliente, escaneo de códigos de barra, verificación rápida de precios/stock y emisión de preventas (`PRV-XXXX`) con reserva temporal de mercadería, sin manejo de dinero.
* **Cajero de Mostrador (Terminal 2):** Apertura de turno con fondo inicial, cobro de preventas y ventas directas por medios electrónicos o efectivo, cálculo de vuelto, ejecución del arqueo ciego al cierre de jornada y emisión de tickets térmicos de 80 mm.
* **Operador de E-commerce y Despacho:** Monitoreo de pedidos web entrantes, separación física de prendas del salón, empaquetado, rotulado con datos del comprador y entrega a cadetes locales o empresas de encomiendas.

---

## 5. Solución / Estructura de Base de Datos

Para dar soporte a la estructura de perfiles dinámicos y al mismo tiempo resolver la venta web con soporte de invitados y clientes registrados, se implementó la siguiente arquitectura relacional en PostgreSQL 16 administrada mediante Prisma ORM:

```
+--------------------+        +-----------------------+        +--------------------+
|      Profile       | 1    N |   ProfilePermission   | N    1 |     Permission     |
+--------------------+--------+-----------------------+--------+--------------------+
| id (PK)            |        | profileId (PK, FK)    |        | id (PK)            |
| name               |        | permissionId (PK, FK) |        | code (Unique)      |
| level              |        +-----------------------+        | module             |
| parentProfileId(FK)|                                         | description        |
+--------------------+                                         +--------------------+
         | 1
         |
         | N
+--------------------+        +-----------------------+
|        User        | 1    N |         Sale          |
+--------------------+--------+-----------------------+
| id (PK)            |        | id (PK)               |
| email (Unique)     |        | customerName          |
| password (Hash)    |        | customerEmail         |
| profileId (FK)     |        | customerPhone         |
| active             |        | customerDni           |
+--------------------+        | shippingMethod        |
                              | shippingAddress       |
                              | channel ("MOSTRADOR"  |
                              |          o "WEB")     |
                              | customerId (FK, Null) |
                              +-----------------------+
                                          | N
                                          |
                                          | 1 (Opcional)
                              +-----------------------+
                              |       Customer        |
                              +-----------------------+
                              | id (PK)               |
                              | email (Unique)        |
                              | password (Hash)       |
                              | name                  |
                              | defaultAddress        |
                              +-----------------------+
```

Figura [Diagrama Entidad-Relación (ERD) de Seguridad, Perfiles, Ventas y Clientes]

### Componentes de la Estructura de Datos
1. **`Profile` y `Permission` (Opción C):**
   * El administrador define registros en `Profile` (ej: "Cajero", "Encargado").
   * La tabla intermedia `ProfilePermission` vincula los permisos habilitados.
   * El campo `parentProfileId` permite herencia reflexiva entre perfiles.
2. **`User` (Personal de Saavedra 241):**
   * Contiene a los empleados del comercio con credenciales de acceso y un `profileId` asignado.
3. **`Customer` (Cuenta Opcional de Cliente Web):**
   * Almacena clientes que deciden registrarse con contraseña en la tienda para no reescribir sus datos en compras futuras. No posee relación con `Profile` ni con `Permission`.
4. **`Sale` (Snapshot Inmutable y Soporte de Invitados):**
   * Si el cliente compra como **invitado**: `customerId` se guarda en `null` y sus datos (`customerName`, `customerEmail`, `customerPhone`, `customerDni`, `shippingAddress`) quedan asentados directamente en las columnas de la venta.
   * Si el cliente compra **iniciando sesión**: se guardan los mismos datos inmutables y adicionalmente se completa `customerId` para que la orden aparezca en su panel de "Mis Compras".

---

## 6. Gestión de Riesgos

La evolución del proyecto durante el Mes 3 demandó la identificación, análisis y mitigación de cuatro riesgos operacionales y tecnológicos críticos:

### Riesgo 1: Contingencia e Inestabilidad de Web Services de AFIP / ARCA
* **Naturaleza del Riesgo:** Externo y regulatorio. La transformación del organismo tributario nacional generó suspensiones y cambios en los ambientes de homologación (WSAA / WSFE) para la autorización electrónica de comprobantes con CAE.
* **Impacto:** Bloqueo o retraso en la emisión automática de Facturas A y B electrónicas.
* **Mitigación:** Se postergó la conexión fiscal con ARCA para el Mes 4 y se fortaleció el módulo de mostrador con Comprobantes de Control Interno (Ticket X) con validez comercial de cambio de 30 días y arqueos de turno blindados. El local opera legal y contablemente sin verse paralizado por contingencias de servidores fiscales externos.

### Riesgo 2: Sobrevantas Concurrentes (Salón Saavedra vs. Tienda Web)
* **Naturaleza del Riesgo:** Operativo y transaccional. La posibilidad de que una prenda exhibida en el local sea vendida presencialmente en el mismo momento en que un cliente digital la compra por la web.
* **Impacto:** Quiebre de stock, necesidad de cancelar pedidos web, reintegros forzados y descontento del cliente.
* **Mitigación:** Principio de Single Source of Truth (única base de datos PostgreSQL unificada) y transacciones atómicas de Prisma con bloqueo a nivel de fila (`prisma.$transaction`). Las preventas de mostrador y los checkouts web incrementan el contador `stockReserved`, restando disponibilidad inmediatamente del catálogo público antes de que se confirme el pago definitivo.

### Riesgo 3: Caídas de Conectividad a Internet en Saavedra 241
* **Naturaleza del Riesgo:** Infraestructura local. Microcortes de fibra óptica o suministro eléctrico en el microcentro de la ciudad de Formosa.
* **Impacto:** Imposibilidad de consultar precios o cobrar ventas presenciales en mostrador si el sistema fuera 100% dependiente de la nube.
* **Mitigación:** Enfoque Offline-First en el Punto de Venta implementado con IndexedDB y Dexie.js en los navegadores de las terminales del local. El mostrador puede continuar registrando ventas en efectivo y emitiendo tickets en contingencia, encolando las transacciones para su sincronización automática al restablecerse la red.

### Riesgo 4: Fricción en el Proceso de Pago y Abandono de Carrito
* **Naturaleza del Riesgo:** Usabilidad y conversión comercial. Exigir la creación obligatoria de cuenta, validación de correo o contraseñas complejas ahuyenta a los compradores de la provincia que buscan una compra rápida.
* **Impacto:** Altas tasas de abandono en la pantalla de pago y pérdida de ingresos potenciales.
* **Mitigación:** Implementación del patrón Guest Checkout (compra como invitado) que solicita únicamente 4 datos indispensables para el despacho y facturación, complementado con un botón flotante de atención directa por WhatsApp para resolver dudas en tiempo real.

Figura [Matriz de Evaluación de Riesgos y Acciones de Mitigación]
