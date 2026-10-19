# [RF-23] Autenticación, Hash de Claves y Control de Acceso por Roles (RBAC Dinámico)

## 1. Descripción y Objetivo
Permite gestionar la seguridad, la autenticación de usuarios y el control de acceso en **Matacos Deportes** (Saavedra 241, Formosa), sustituyendo el esquema de roles rígidos (`enum Role`) por un modelo de **Control de Acceso Basado en Perfiles Dinámicos y Permisos Atómicos (RBAC)** con herencia jerárquica.

El requerimiento resuelve:
1. **Hash Criptográfico de Contraseñas:** Almacenamiento seguro e irreversible de claves mediante `bcryptjs` con factor de costo (salt rounds) adecuado para mitigar ataques de diccionario o fuerza bruta.
2. **Perfiles Dinámicos Configurables:** Los administradores pueden crear, modificar y dar de baja perfiles de acceso (ej. *Administrador*, *Cajero Mostrador*, *Vendedor Salón*, *Operador de Despacho*) asignando casillas de verificación de permisos según la función operativa de cada empleado.
3. **Catálogo Maestro de Permisos Atómicos:** Unidades mínimas de autorización ligadas a código fuente (`pos.cobrar`, `caja.cerrar_arqueo`, `inventario.precios`, `ecommerce.banners`, etc.), agrupadas por módulos funcionales del sistema.
4. **Herencia Jerárquica entre Perfiles:** Soporte de jerarquías reflexivas (`parentProfileId`), permitiendo que un perfil supervisor herede automáticamente los privilegios de perfiles subordinados sin duplicar configuración manual.
5. **Aislamiento Total entre Personal y Clientes Web:** Separación física en base de datos entre el personal operativo del local (`User` ligado a `Profile`) y los compradores de la tienda digital (`Customer` y `Guest Checkout`). Los clientes web no poseen relación con la tabla de perfiles ni permisos internos.

---

## 2. Tecnologías, Herramientas y Librerías

- **Base de Datos y ORM:** PostgreSQL 16 y Prisma ORM 6 con modelos relacionales `User`, `Profile`, `Permission`, `ProfilePermission`, `Customer` y `Sale`.
- **Criptografía:** `bcryptjs` para el hash seguro de credenciales de acceso tanto del personal interno como de clientes registrados.
- **Validación de Esquemas:** Zod para contratos estrictos de inicio de sesión, alta de usuarios y configuración de perfiles.
- **Control de Acceso en Servidor:** Verificación a nivel de Server Actions y Route Handlers en Next.js 15, garantizando que ninguna acción restringida pueda ser invocada alterando la interfaz de usuario.

---

## 3. Modelo de Datos y Persistencia (Prisma / PostgreSQL)

### Modelo `Profile` (Perfiles Operativos)
```prisma
model Profile {
  id              String              @id @default(uuid())
  name            String              @unique
  description     String?
  level           Int                 @default(1)
  isSystem        Boolean             @default(false)
  parentProfileId String?
  parentProfile   Profile?            @relation("ProfileHierarchy", fields: [parentProfileId], references: [id])
  childProfiles   Profile[]           @relation("ProfileHierarchy")
  permissions     ProfilePermission[]
  users           User[]
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
}
```

### Modelo `Permission` (Permisos Atómicos)
```prisma
model Permission {
  id          String              @id @default(uuid())
  code        String              @unique
  module      String
  description String
  profiles    ProfilePermission[]
}
```

### Modelo `ProfilePermission` (Tabla Intermedia N:M)
```prisma
model ProfilePermission {
  profileId    String
  profile      Profile    @relation(fields: [profileId], references: [id], onDelete: Cascade)
  permissionId String
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([profileId, permissionId])
}
```

### Extensión en `User` y Aislamiento con `Customer`
- `User`: Incorpora `profileId` con relación foránea opcional a `Profile` y mantiene `role` opcional para compatibilidad operativa durante la transición.
- `Customer`: Entidad independiente de e-commerce con credenciales propias (`password` hasheada) y sin permisos en el dashboard ni mostrador.
- `Sale`: Registro inmutable con soporte tanto de compras anónimas (*Guest Checkout*, `customerId = null`) como de clientes web registrados (`customerId` asociado).

---

## 4. Matriz Inicial de Permisos por Módulo

| Módulo | Código de Permiso | Descripción Operativa |
| :--- | :--- | :--- |
| **POS** | `pos.vender` | Crear y completar ventas presenciales en mostrador |
| **POS** | `pos.descuento_manual` | Aplicar bonificaciones de precio en mostrador |
| **POS** | `pos.anular_venta` | Cancelar comprobantes emitidos |
| **CAJA** | `caja.abrir_turno` | Abrir turno con fondo inicial en efectivo |
| **CAJA** | `caja.movimientos` | Registrar ingresos y egresos de caja chica |
| **CAJA** | `caja.cerrar_arqueo` | Ejecutar arqueo ciego y cierre de jornada |
| **CAJA** | `caja.auditoria_historial`| Consultar historial consolidado de arqueos |
| **INVENTARIO**| `inventario.ver` | Visualizar catálogo y consultar existencias |
| **INVENTARIO**| `inventario.precios` | Modificar precios de venta y alícuotas |
| **INVENTARIO**| `inventario.costos` | Visualizar precios de costo de proveedores |
| **INVENTARIO**| `inventario.ajuste_stock`| Realizar ajustes manuales y mermas de stock |
| **ECOMMERCE** | `ecommerce.pedidos` | Gestionar estados de pedidos web entrantes |
| **ECOMMERCE** | `ecommerce.banners` | Modificar carrusel hero y vitrinas destacadas|
| **ADMIN** | `admin.usuarios` | Gestionar altas, bajas y contraseñas de personal |
| **ADMIN** | `admin.perfiles` | Crear perfiles y modificar asignación de permisos|

---

## 5. Reglas de Negocio y Seguridad

1. **Principio de Mínimo Privilegio:** Ningún empleado posee acceso a módulos ajenos a su función asignada. Los vendedores de salón no pueden visualizar costos ni manipular dinero de caja.
2. **Protección de Confidencialidad de Costos:** El campo `costPrice` está terminantemente restringido a usuarios con el permiso `inventario.costos`.
3. **Resguardo de Cuentas del Sistema:** Los perfiles con `isSystem: true` no pueden ser eliminados para prevenir el bloqueo accidental de la administración.
4. **Independencia de Clientes Digitales:** Un intento de inicio de sesión de un cliente web (`Customer`) en las rutas internas del dashboard (`/admin` o `/pos`) es rechazado a nivel de middleware y sesión.
