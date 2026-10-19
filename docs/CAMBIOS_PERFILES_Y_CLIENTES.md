# Modificaciones en Base de Datos: Perfiles, Permisos y Clientes Web

## 1. Resumen del Cambio

Se actualizo el esquema de base de datos de Prisma para soportar dos requerimientos fundamentales del sistema:
1. **Control de Acceso Dinamico por Perfiles y Permisos (RF-23):** Reemplazo de los roles estaticos en codigo por perfiles jerarquicos configurables por el administrador con permisos atomicos.
2. **Soporte de Clientes Web y Compra como Invitado (RF-15):** Capacidad de procesar compras anonimas directas (sin contrasenia ni cuenta) y soporte opcional para clientes que decidan registrarse.

---

## 2. Nuevos Modelos Incorporados

### Profile (Perfiles de Empleados)
Representa las plantillas de acceso que el administrador crea y asigna al personal del local (ej: Administrador, Cajero Mostrador, Vendedor Salon).
- `id`: Identificador unico UUID.
- `name`: Nombre unico del perfil.
- `description`: Descripcion funcional opcional.
- `level`: Nivel jerarquico numerico (ej: 100 Admin, 50 Encargado, 10 Cajero).
- `isSystem`: Indicador booleano para proteger perfiles base del sistema contra borrado accidental.
- `parentProfileId`: Enlace reflexivo opcional que permite herencia jerarquica (un perfil hijo hereda los permisos del perfil padre).

### Permission (Catalogo Maestro de Permisos)
Catalogo inmutable en codigo de las acciones atomicas del sistema.
- `id`: Identificador unico UUID.
- `code`: Clave unica de autorizacion (ej: pos.cobrar, caja.arqueo, inventario.precios).
- `module`: Modulo de agrupacion visual (POS, CAJA, INVENTARIO, ECOMMERCE, ADMIN).
- `description`: Texto explicativo para la interfaz administrativa.

### ProfilePermission (Tabla Intermedia N:M)
Vincula que permisos especificos tiene asignado cada perfil.
- `profileId` y `permissionId`: Clave primaria compuesta.

### Customer (Clientes Web con Cuenta Opcional)
Modelo minimalista para clientes de la tienda online que deciden registrarse con contrasenia.
- `id`: Identificador unico UUID.
- `email`: Correo electronico unico para inicio de sesion en la tienda.
- `password`: Hash de contrasenia segura (bcryptjs).
- `name`: Nombre completo del cliente.
- `phone`: Telefono de contacto opcional.
- `dni`: Documento nacional de identidad opcional.
- `defaultAddress`, `defaultCity`, `defaultPostalCode`: Datos de envio por defecto para agilizar futuras compras.

---

## 3. Actualizaciones en Modelos Existentes

### User (Personal del Local Saavedra 241)
- Se agrego `profileId` y la relacion `profile` hacia `Profile`.
- Se conservo el campo `role` como opcional para mantener compatibilidad con las funciones operativas existentes mientras se realiza la transicion a permisos dinamicos.

### Sale (Comprobantes y Ventas)
- Se agrego `customerId` opcional:
  - En compras de **invitados**: el valor es `null`.
  - En compras con **cliente registrado**: se asocia al `id` del cliente.
- Se incorporaron los campos directos e inmutables del comprador en la venta: `customerName`, `customerEmail`, `customerPhone` y `customerDni`.
- Se incorporaron los campos logisticos de entrega: `shippingMethod`, `shippingCost`, `shippingAddress`, `shippingCity` y `shippingPostalCode`.

---

## 4. Reglas Operativas y de Seguridad

1. **Aislamiento Total del Dashboard:** La tabla `Customer` no tiene ningun vinculo con la tabla `Profile` ni con `Permission`. Un cliente registrado en la tienda web no posee credenciales ni privilegios para acceder al panel administrativo ni al punto de venta.
2. **Compras de Invitados:** Los compradores que no desean crearse cuenta completan el formulario de checkout y sus datos quedan sellados directamente dentro del registro de `Sale`.
3. **Consistencia Historica:** Los datos de entrega y contacto almacenados en `Sale` actuan como un snapshot contable inalterable en el tiempo.
