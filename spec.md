# Especificación Técnica (spec.md)
## Requerimiento: Autenticación, Acceso Ágil por Usuario y Control de Accesos por Roles Dinámicos (RF-23)
**Proyecto:** Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes  
**Ubicación:** Saavedra 241, Formosa Capital, Argentina  
**Rama:** `feature/be-rf23-control-acceso-roles`  

---

## Problem Statement

Actualmente, el sistema de **Matacos Deportes** no cuenta con un mecanismo de autenticación ni control de acceso para el personal que opera en el local físico:
1. **Rutas desprotegidas:** Cualquier persona que abra el navegador en las rutas del panel administrativo (`/admin`) o del mostrador de ventas (`/pos`) puede operar libremente sin ingresar credenciales.
2. **Identificación no verificada en caja:** La apertura y asignación de turnos de caja en mostrador se realiza seleccionando un nombre en un menú desplegable estático (*"Cajero 1"*, *"Cajero Mostrador"*) sin exigir autenticación ni PIN/contraseña.
3. **Roles estáticos y rígidos:** El modelo original contemplaba un enumerado fijo (`enum Role { ADMIN, CAJERO, DESPACHO }`), impidiendo que el dueño o administrador del negocio pueda crear perfiles intermedios (ej. *Encargado de Local*, *Vendedor Salón*) o configurar qué acciones específicas puede realizar cada empleado.
4. **Fricción operativa en mostrador:** En un punto de venta físico de alto tránsito, exigir que los cajeros y vendedores recuerden y tipeen un correo electrónico largo para iniciar turno o desbloquear la terminal es lento y proclive a errores de digitación. Se requiere un acceso ágil mediante un nombre de usuario corto (ej. `cajero1`, `admin`).
5. **Riesgo de confidencialidad comercial:** Empleados de salón o cajeros pueden visualizar datos estratégicos sensibles como precios de costo de compra a fábrica (`costPrice`) o recaudaciones totales sin la debida restricción.

---

## Solution

Implementar una solución integral de seguridad, autenticación y autorización que contemple:

1. **Autenticación Flexible (Identificador Dual):**
   * El personal del local (`User`) puede iniciar sesión indistintamente con su **Nombre de Usuario** (ej. `admin`, `cajero1`, `mostrador`) o su **Correo Electrónico**, acompañado de su contraseña segura.
   * Almacenamiento criptográfico irreversible de contraseñas mediante **`bcryptjs`** (10 salt rounds).
2. **Control de Acceso Basado en Perfiles Dinámicos y Permisos Atómicos (RBAC):**
   * **Catálogo Maestro de Permisos (30 permisos):** Capacidades técnicas fijas gobernadas en código fuente por el equipo de desarrollo, divididas en 6 módulos funcionales (`POS`, `CAJA`, `INVENTARIO`, `ECOMMERCE`, `REPORTES`, `ADMIN`).
   * **Perfiles Dinámicos Gestionados por el Administrador:** El Administrador General es el único facultado para crear, editar o dar de baja perfiles de acceso y marcar/desmarcar casillas de verificación de permisos.
   * **Herencia Jerárquica Reflexiva:** Soporte para que perfiles supervisores (ej. *Encargado de Local*) hereden automáticamente los permisos del perfil operativo base (*Cajero Mostrador*), agregando únicamente atribuciones de supervisión.
3. **Aislamiento Físico y Lógico del Personal respecto a Clientes Web:**
   * La entidad `Customer` (clientes de la tienda online) está completamente separada de `User`. Un cliente registrado en el e-commerce jamás puede acceder ni autenticarse en las rutas del dashboard o del mostrador.
   * No existe auto-registro para empleados: las cuentas de personal son creadas exclusivamente por el Administrador General desde el panel de control.
4. **Gestión de Sesiones Seguras y Middleware de Protección:**
   * Sesiones administradas mediante cookies `HttpOnly`, `SameSite=Lax` y seguras.
   * Middleware de Next.js que intercepta cualquier petición a `/admin/*` y `/pos/*`, redirigiendo automáticamente a `/login` si no existe una sesión válida y activa.
5. **Protección a Nivel de Servidor y Renderizado Condicional:**
   * Verificación de permisos tanto en Server Actions como en Route Handlers.
   * Enmascaramiento estricto de campos confidenciales (ej. `costPrice`) si el usuario autenticado no posee el permiso `inventario.costos`.

---

## User Stories

### Como Administrador General
1. Como Administrador, quiero iniciar sesión utilizando mi nombre de usuario `admin` o mi correo electrónico, para ingresar al panel de forma ágil desde cualquier dispositivo autorizado.
2. Como Administrador, quiero que las contraseñas de todos los empleados se guarden cifradas con `bcryptjs`, para resguardar la seguridad del negocio ante eventuales filtraciones.
3. Como Administrador, quiero acceder a una sección `/admin/usuarios` para crear nuevos empleados indicando nombre, usuario, correo, contraseña y su perfil asignado, para mantener centralizado el control del personal.
4. Como Administrador, quiero poder editar los datos, cambiar el perfil o desactivar la cuenta de un empleado que ya no trabaja en el local, para revocar su acceso inmediatamente.
5. Como Administrador, quiero poder reestablecer la contraseña de un empleado si este la olvida, para permitirle retomar sus tareas sin demoras.
6. Como Administrador, quiero acceder a `/admin/perfiles` para crear nuevos perfiles (ej. *Encargado de Turno Mañana*, *Vendedor Temporario*) asignando un nombre, nivel y descripción.
7. Como Administrador, quiero seleccionar mediante casillas de verificación (checkboxes) agrupadas por módulo qué permisos específicos tiene cada perfil, para definir con precisión las atribuciones de cada puesto.
8. Como Administrador, quiero que los perfiles nativos del sistema con `isSystem: true` no puedan ser eliminados, para evitar el bloqueo accidental de la administración.
9. Como Administrador, quiero ser el único con acceso a visualizar los precios de costo de proveedores (`costPrice`) y los márgenes de ganancia bruta, para mantener bajo estricta confidencialidad la información comercial.
10. Como Administrador, quiero consultar métricas globales de facturación y gráficos de ingresos (`reportes.ver_kpis`), para evaluar la salud financiera del comercio.

### Como Encargado de Local
11. Como Encargado, quiero iniciar sesión con mi nombre de usuario corto para acceder al sistema rápidamente durante mi turno de supervisión.
12. Como Encargado, quiero heredar automáticamente los permisos del cajero de mostrador, para poder cubrir la línea de cobro si hay mucha afluencia de clientes sin necesidad de cambiar de usuario.
13. Como Encargado, quiero ver el saldo teórico esperado del sistema antes de cerrar el arqueo de caja (`caja.ver_teorico`), para auditar la exactitud del conteo de billetes del cajero.
15. Como Encargado, quiero consultar el historial de arqueos y justificaciones de desvíos (`caja.auditoria_historial`), para auditar los turnos pasados.
16. Como Encargado, quiero realizar ajustes manuales de inventario por roturas, mermas o transferencias salón-depósito (`inventario.ajuste_stock`), para mantener el stock físico sincronizado.
17. Como Encargado, quiero que el sistema no me permita ver los precios de costo de compra (`costPrice`), para respetar la confidencialidad fijada por el dueño.

### Como Cajero de Mostrador
18. Como Cajero, quiero iniciar sesión tipeando únicamente mi usuario (ej. `cajero1`) y mi contraseña, para abrir la terminal de ventas en menos de 5 segundos.
19. Como Cajero, quiero que al abrir el turno de caja se asocie automáticamente mi usuario autenticado, eliminando la selección manual de nombres en desplegables.
20. Como Cajero, quiero poder registrar ventas, cobrar con múltiples medios de pago y emitir tickets de mostrador (`pos.vender`), para atender con fluidez a los clientes.
21. Como Cajero, quiero realizar cambios de talle o prendas devueltas calculando saldos a favor o en contra (`pos.cambios_devoluciones`), para resolver los cambios en mostrador.
22. Como Cajero, quiero registrar egresos de dinero por gastos menores o retiros de seguridad (`caja.movimientos`), para mantener el saldo de caja chica al día.
23. Como Cajero, quiero ejecutar el arqueo ciego al final del turno contando físicamente el dinero sin ver el monto teórico del sistema, para garantizar un control transparente.
24. Como Cajero, quiero reimprimir comprobantes finalizados si la impresora térmica se traba (`caja.reimprimir_ticket`), para entregar el ticket correspondiente al comprador.

### Como Vendedor de Salón
26. Como Vendedor, quiero iniciar sesión con mi usuario personal para consultar existencias de talles y colores en Salón y Depósito (`inventario.ver`), para asesorar eficazmente al cliente.
27. Como Vendedor, quiero armar preventas en el salón y dejarlas pendientes de pago (`pos.vender`), para que el cliente pase directamente a la caja a abonar.
28. Como Vendedor, quiero modificar o corregir una preventa antes de que sea cobrada (`caja.modificar_preventa`), en caso de que el cliente decida cambiar un artículo a último momento.
29. Como Vendedor, quiero que el sistema me oculte los módulos de administración, arqueos de caja, reportes financieros y costos, para ver una interfaz limpia enfocada en la venta.

---

## Implementation Decisions

### 1. Modelo de Datos y Esquema Prisma (`prisma/schema.prisma`)
* **Ampliación de `User`:**
  * Se incorpora el campo `username String? @unique` para permitir nombres de usuario únicos en minúsculas (ej: `admin`, `cajero1`, `mostrador`).
  * Se mantiene `email String @unique` para soporte dual de login y notificaciones.
  * Se mantiene `profileId String?` con relación a `Profile`.
  * Se conserva `role Role?` como campo legacy de compatibilidad.
* **Modelo `Profile`:**
  * Campos: `id` (UUID), `name` (unique), `description`, `level` (Int), `isSystem` (Boolean default false), `parentProfileId` (relación reflexiva a Profile).
* **Modelo `Permission`:**
  * Campos: `id` (UUID), `code` (unique), `module` (String), `description` (String).
* **Modelo `ProfilePermission`:**
  * Clave primaria compuesta `@@id([profileId, permissionId])` con eliminación en cascada.
* **Aislamiento de `Customer`:**
  * Permanece como entidad separada para la tienda web, sin ningún tipo de relación con `Profile` ni `Permission`.

### 2. Catálogo Maestro de los 29 Permisos Atómicos
Los permisos quedan estandarizados e inmutables en código, clasificados en 6 módulos:

* **Módulo POS (3 permisos):**
  * `pos.vender`: Crear tickets, agregar productos, procesar cobros y emitir comprobantes.
  * `pos.descuento_manual`: Aplicar bonificaciones o descuentos manuales en mostrador.
  * `pos.cambios_devoluciones`: Gestionar cambios de talle/prenda y devoluciones de clientes en mostrador.
* **Módulo CAJA (7 permisos):**
  * `caja.abrir_turno`: Abrir turno de terminal con fondo inicial en efectivo.
  * `caja.movimientos`: Registrar ingresos y egresos de caja chica o retiros de seguridad.
  * `caja.cerrar_arqueo`: Ejecutar arqueo de billetes y cierre de jornada de terminal.
  * `caja.auditoria_historial`: Consultar historial consolidado de arqueos y justificaciones.
  * `caja.ver_teorico`: Visualizar el total esperado del sistema antes de contar billetes (supervisión de arqueo ciego).
  * `caja.reimprimir_ticket`: Reimpresión de tickets finalizados desde el historial.
  * `caja.modificar_preventa`: Editar o cancelar preventas pendientes antes de su cobro definitivo en caja.
* **Módulo INVENTARIO (11 permisos):**
  * `inventario.ver`: Consultar catálogo y existencias en Salón y Depósito.
  * `inventario.crear_producto`: Alta, edición y desactivación de productos y variantes.
  * `inventario.precios`: Modificar individualmente el precio de venta al público (PVP).
  * `inventario.actualizacion_lote`: Modificación masiva de precios por lote, marca o categoría.
  * `inventario.costos`: Visualizar precio de costo de proveedores (`costPrice`) y margen comercial.
  * `inventario.ajuste_stock`: Ajustes manuales de existencias, roturas y transferencias salón-depósito.
  * `inventario.importar_excel`: Carga e importación masiva de catálogo vía Excel/CSV.
  * `inventario.maestros`: Administrar Marcas, Categorías y Disciplinas deportivas.
  * `inventario.historial_precios`: Auditar bitácora histórica de modificaciones de precios.
  * `inventario.alertas_stock`: Configurar umbrales de stock crítico y reposición interna.
  * `inventario.etiquetas_codigos`: Generación e impresión de etiquetas con código de barras adhesivas.
* **Módulo ECOMMERCE (4 permisos):**
  * `ecommerce.pedidos`: Gestionar pedidos web entrantes, preparación y despacho.
  * `ecommerce.banners`: Modificar banners del carrusel hero y vitrinas destacadas.
  * `ecommerce.cupones`: Crear y gestionar cupones de descuento y promociones online.
  * `ecommerce.clientes`: Visualizar cartera de clientes registrados en la tienda online.
* **Módulo REPORTES (2 permisos):**
  * `reportes.ver_kpis`: Visualizar facturación global, ticket promedio y gráficos financieros.
  * `reportes.exportar`: Exportar reportes de ventas, arqueos y stock a Excel/PDF.
* **Módulo ADMIN (2 permisos):**
  * `admin.usuarios`: Gestionar altas, bajas, asignación de perfiles y contraseñas de personal.
  * `admin.perfiles`: Crear y configurar perfiles de acceso y matriz de permisos.

### 3. Matriz Inicial de Perfiles Base del Sistema
* **Administrador (Nivel 100, `isSystem: true`):** Posee los 29 permisos atómicos.
* **Encargado de Local (Nivel 50, `isSystem: true`):** Hereda los 9 permisos de *Cajero Mostrador* a través de `parentProfileId`, y se le asignan adicionalmente 7 permisos de supervisión (`caja.auditoria_historial`, `caja.ver_teorico`, `inventario.ajuste_stock`, `inventario.etiquetas_codigos`, `inventario.alertas_stock`, `ecommerce.pedidos`, `reportes.ver_kpis`). No tiene acceso a `inventario.costos` ni a módulos `ADMIN`.
* **Cajero Mostrador (Nivel 10, `isSystem: true`):** 9 permisos directos (`pos.vender`, `pos.descuento_manual`, `pos.cambios_devoluciones`, `caja.abrir_turno`, `caja.movimientos`, `caja.cerrar_arqueo`, `caja.reimprimir_ticket`, `caja.modificar_preventa`, `inventario.ver`).
* **Vendedor Salón (Nivel 5, `isSystem: true`):** 3 permisos directos (`pos.vender`, `caja.modificar_preventa`, `inventario.ver`).

### 4. Arquitectura de Autenticación y Sesión
* **Server Action `login(identifier, password)`:**
  * Normaliza el identificador a minúsculas y elimina espacios.
  * Busca el usuario mediante `prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }], active: true }, include: { profile: { include: { permissions: { include: { permission: true } }, parentProfile: { include: { permissions: { include: { permission: true } } } } } } } })`.
  * Valida la contraseña comparando el texto plano con el hash almacenado mediante `bcrypt.compare`.
  * Resuelve la lista de permisos efectivos: **Permisos Directos + Permisos Heredados del `parentProfile`**.
  * Sella un token de sesión seguro (JWT firmado o sesión cifrada) y lo establece en una cookie `matacos_session` con flags `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `sameSite: "lax"`, `path: "/"`.
* **Server Action `logout()`:**
  * Elimina la cookie de sesión y redirige a `/login`.
* **Helper de Autorización `hasPermission(permissionCode)`:**
  * Lee la sesión activa del servidor.
  * Verifica si el usuario posee el código de permiso solicitado. Si es Administrador (`level === 100`), retorna `true` automáticamente.
  * En consultas de productos, omite el campo `costPrice` si no cuenta con `inventario.costos`.

### 5. Middleware de Protección de Rutas (`src/middleware.ts`)
* Intercepta las rutas privadas que inicien con:
  * `/admin/:path*`
  * `/pos/:path*`
* Valida la presencia y firma de la cookie `matacos_session`.
* Si no existe sesión o es inválida, redirige al usuario a `/login?redirect=<ruta_solicitada>`.
* Si el usuario ya está autenticado e intenta ingresar a `/login`, lo redirige automáticamente a su área de trabajo según su perfil (ej. `/admin` o `/pos`).

### 6. Diseño de Interfaz de Usuario (Enfoque Pragmático y Minimalista)
* **Pantalla `/login` (Ultraliviana y Directa):**
  * Diseñada con un enfoque 100% funcional y minimalista, priorizando la agilidad de los desarrolladores backend para verificar y alternar roles y permisos en pantalla sin sobrecarga cosmética innecesaria.
  * Formulario limpio y compacto centrado en pantalla:
    * Campo de entrada único: **"Usuario o Correo"** (autofocus, placeholder: `admin` o `cajero1`).
    * Campo de contraseña (placeholder: `••••••••`).
    * Botón de envío directo *"Ingresar al Sistema"*.
    * Alerta o texto de error visible en rojo ante credenciales inválidas o usuario inactivo.
* **Barra de Sesión y Perfil Activo (Topbar / Header):**
  * En la cabecera del dashboard y mostrador, un indicador visual directo del usuario autenticado:
    * Ej: `👤 admin (Administrador) | [Cerrar Sesión]`
  * Permite validar de un vistazo qué rol está operando en la prueba visual y cerrar sesión en un clic para ingresar con otro usuario.
* **Pantallas Administrativas Básicas:**
  * `/admin/usuarios`: Tabla simple del personal con botón de alta (modal Zod) y selector de perfil.
  * `/admin/perfiles`: Listado de perfiles y modal con checkboxes por módulo para asignar los 29 permisos.

---

## Testing Decisions

### Criterios de Calidad de las Pruebas
* Las pruebas validarán el **comportamiento funcional externo** de las Server Actions y la seguridad de datos, sin acoplarse a detalles de implementación visuales.
* No se admitirán datos simulados que no respeten la integridad referencial de Prisma.

### Módulos y Flujos a Testear (`scripts/test-rf23-rbac.ts`)
1. **Autenticación con Identificador Dual:**
   * Login exitoso usando el nombre de usuario (`admin`).
   * Login exitoso usando el correo electrónico (`admin@matacosdeportes.com.ar`).
   * Rechazo de login con contraseña incorrecta.
   * Rechazo de login para usuarios con `active: false`.
2. **Resolución Jerárquica de Permisos:**
   * Verificar que un usuario con perfil *Administrador* posea los 29 permisos.
   * Verificar que un usuario con perfil *Encargado de Local* resuelva correctamente tanto sus permisos directos (ej. `caja.ver_teorico`) como los heredados de su perfil padre *Cajero Mostrador* (ej. `pos.vender`).
   * Verificar que un *Cajero Mostrador* no pueda acceder a permisos restringidos como `inventario.costos`.
3. **Confidencialidad de Precios de Costo:**
   * Comprobar que una petición de catálogo realizada por un Cajero o Vendedor devuelva el campo `costPrice` como `null` o censurado, mientras que para el Administrador devuelva el valor real.
4. **Protección de Rutas en Middleware:**
   * Verificar la redirección de solicitudes anónimas hacia `/login`.

---

## Out of Scope

Los siguientes elementos quedan expresamente excluidos de esta especificación para mantener el enfoque modular del desarrollo:
1. **Emisión de Comprobantes Fiscales ante AFIP / ARCA:** Cualquier lógica o permiso vinculado a facturación electrónica oficial (`facturacion.emitir_afip`) queda fuera de esta etapa.
2. **Anulación de Ventas Completadas:** La anulación de comprobantes ya cobrados y el reintegro de dinero quedan pospuestos para futuras etapas en caso de que la operativa del negocio lo demande expresamente.
3. **Auto-registro o recuperación de contraseña pública para empleados:** No habrá enlace de "Crear Cuenta" ni "Olvidé mi contraseña" en `/login`; la administración del personal es 100% interna y manual por el Administrador General.
4. **Login de Clientes Web (`Customer`):** La experiencia de autenticación para compradores de la tienda digital (e-commerce) se especifica y desarrolla en el módulo correspondiente de tienda pública.

---

## Further Notes

* **Regla Estricta de Gestión de Paquetes:** Cualquier dependencia se instalará exclusivamente con **`pnpm`**.
* **Control de Versiones:** Siguiendo las directivas maestras del proyecto, no se ejecutarán `git commit` ni `git push` automáticos; todo versionado se realizará a solicitud expresa del usuario.
