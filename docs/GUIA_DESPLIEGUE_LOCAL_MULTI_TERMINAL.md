# Guía de Despliegue Local Multi-Terminal (Punto de Venta e Inventario)
## Matacos Deportes — Saavedra 241, Formosa Capital
**Incremento 1:** Gestión Integral de Stock, Catálogo y Variantes  
**Institución:** Universidad de la Cuenca del Plata — Práctica Profesional Supervisada I (PPS I)  

---

## 1. Arquitectura y Roles del Sistema

Para operar el sistema simultáneamente en las **dos notebooks de mostrador** sin tener que duplicar la carga de stock ni sincronizar manualmente bases de datos, se utiliza una arquitectura **Host-Cliente (Centralizada en Red)**:

```mermaid
flowchart LR
    subgraph Terminal 1 ["TERMINAL 1 (Servidor Local + Mostrador Principal)"]
        Docker["Docker Desktop (PostgreSQL 16)"]
        NextApp["Next.js Server (Puerto 3000)"]
        Nav1["Navegador Chrome/Edge (Caja 1)"]
        TS1["Tailscale Node"]
    end

    subgraph Terminal 2 ["TERMINAL 2 (Cliente Ligero / Mostrador Secundario)"]
        Nav2["Navegador Chrome/Edge (Caja 2)"]
        TS2["Tailscale Node"]
    end

    TS2 <== Red Segura Tailscale / Wi-Fi ==> TS1
    Nav2 -.->|Acceso Web: http://100.x.y.z:3000| NextApp
    Nav1 --> NextApp
    NextApp --> Docker
```

* **Terminal 1 (Host / Servidor):**
  * Aloja la base de datos PostgreSQL en Docker.
  * Ejecuta la aplicación Next.js escuchando en la red.
  * También se utiliza normalmente como terminal de cobro y carga de stock (Caja 1).
* **Terminal 2 (Cliente):**
  * **No requiere base de datos, ni Node.js, ni clonar el código.**
  * Opera como terminal de consulta y carga accediendo vía navegador web (Caja 2).
  * Cualquier modificación de stock impacta instantáneamente en la base de datos de la Terminal 1.

---

## 2. Requisitos de Software a Instalar

### En Terminal 1 (Servidor Principal):
1. **[Tailscale para Windows](https://tailscale.com/download/windows):** Crea la red privada virtual entre ambas máquinas sin tocar el router.
2. **[Git for Windows](https://git-scm.com/download/win):** Para clonar y actualizar el repositorio del proyecto.
3. **[Node.js 20+ LTS](https://nodejs.org/):** Entorno de ejecución de JavaScript/TypeScript.
4. **PNPM (Gestor de Paquetes Oficial):**
   * Abrir PowerShell e instalar con:
     ```powershell
     npm install -g pnpm
     ```
5. **WSL 2 (Windows Subsystem for Linux 2):** Motor esencial que utiliza Docker Desktop para ejecutar contenedores Linux en Windows.
   * Abrir PowerShell como Administrador y ejecutar:
     ```powershell
     wsl --install
     ```
   * *(Si ya está instalado, asegurarse de actualizarlo con `wsl --update`). Requiere reiniciar la PC si se instala por primera vez.*
6. **[Docker Desktop](https://www.docker.com/products/docker-desktop/):** Necesario para correr el contenedor de PostgreSQL 16 (asegurarse de marcar la casilla *"Use WSL 2 instead of Hyper-V"* durante la instalación).
7. **Google Chrome o Microsoft Edge:** Para el uso de la interfaz web.

### En Terminal 2 (Cliente Secundario):
1. **[Tailscale para Windows](https://tailscale.com/download/windows):** Mismo software para conectarse a la red privada.
2. **Google Chrome o Microsoft Edge:** Único software necesario para operar el sistema.
> [!NOTE]
> La **Terminal 2 no necesita** Git, Node.js, PNPM ni Docker Desktop. Es un cliente 100% ligero.

---

## 3. Configuración Inicial de Red (Tailscale)

> Realizar este procedimiento en **ambas máquinas**:

1. Descargar e instalar **Tailscale** en la Terminal 1 y en la Terminal 2.
2. Abrir Tailscale e iniciar sesión en **ambas máquinas con la misma cuenta** (ej. la cuenta de Google o GitHub de desarrollo de Matacos).
3. Una vez conectadas:
   * Hacer clic derecho en el ícono de Tailscale en la barra de tareas de la **Terminal 1**.
   * Copiar su dirección IP de Tailscale (tiene el formato `100.x.y.z`, ej: `100.85.12.34`) o el nombre del equipo (ej: `matacos-host`).
4. **Comprobar conectividad:** Desde la Terminal 2, abrir PowerShell y ejecutar:
   ```powershell
   ping 100.x.y.z
   ```
   *(Reemplazar `100.x.y.z` con la IP obtenida de la Terminal 1. Debe responder exitosamente).*

---

## 4. Instalación del Sistema en Terminal 1 (Servidor)

### Paso 4.1: Clonar el Repositorio
Abrir PowerShell en la Terminal 1 (por ejemplo en `C:\Proyectos` o `C:\Users\<TuUsuario>`):
```powershell
git clone https://github.com/dellagnoloRA/matacos-deportes-app.git
cd matacos-deportes-app
git checkout feature/fe-quick-disciplina-categoria-marca
```

### Paso 4.2: Configurar Variables de Entorno (`.env`)
Crear el archivo `.env` en la raíz del proyecto copiando la plantilla base:
```powershell
Copy-Item .env.example .env
```
Verificar que los valores de base de datos coincidan con Docker:
```env
POSTGRES_USER=matacos_admin
POSTGRES_PASSWORD=matacos_secure_password_2026
POSTGRES_DB=matacos_db
DATABASE_URL=postgresql://matacos_admin:matacos_secure_password_2026@localhost:5432/matacos_db?schema=public

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super_secret_jwt_key_matacos_2026_local
```

### Paso 4.3: Instalar Dependencias
```powershell
pnpm install
```

### Paso 4.4: Iniciar la Base de Datos con Docker
1. Asegurarse de que Docker Desktop esté abierto y corriendo.
2. Levantar el contenedor de PostgreSQL:
   ```powershell
   pnpm db:up
   ```
3. Generar el cliente de Prisma y aplicar las migraciones:
   ```powershell
   pnpm prisma generate
   pnpm prisma migrate deploy
   ```
4. *(Opcional)* Cargar datos de prueba o catálogo inicial:
   ```powershell
   pnpm db:seed
   ```

### Paso 4.5: Poner en Marcha la Aplicación

Para uso cotidiano y máxima velocidad en mostrador, se recomienda compilar y ejecutar en modo producción:
```powershell
# 1. Compilar la aplicación
pnpm build

# 2. Iniciar el servidor escuchando en toda la red
pnpm start:lan
```
*(Si están en sesión de desarrollo o pruebas de código, pueden usar alternativamente: `pnpm dev:lan`).*

> [!IMPORTANT]
> Si Windows Defender Firewall muestra un cartel preguntando si desea permitir que **Node.js** se comunique en redes privadas, hacer clic en **"Permitir acceso"**.

---

## 5. Acceso y Uso desde la Terminal 2 (Cliente)

1. En la **Terminal 2**, abrir Google Chrome o Microsoft Edge.
2. En la barra de direcciones, escribir la IP de Tailscale de la Terminal 1:
   ```
   http://100.x.y.z:3000
   ```
   *(O el nombre de host, por ejemplo: `http://matacos-host:3000`).*
3. **Crear acceso directo en el escritorio (Recomendado para el mostrador):**
   * En Chrome/Edge, hacer clic en los 3 puntos superiores `...` -> **Transmitir, guardar y compartir** -> **Crear acceso directo...** (o **Instalar esta página como aplicación**).
   * Nombrarlo: `Matacos Deportes - Gestión de Stock`.
   * Ahora la Terminal 2 tiene un ícono directo en el escritorio que abre el sistema a pantalla completa como si fuera un programa nativo.

---

## 6. Verificación de Sincronización en Tiempo Real

Para corroborar que ambas máquinas están sincronizadas:

1. **Desde la Terminal 2:**
   * Entrar a la sección de Inventario / Stock.
   * Modificar el stock de mostrador de un producto (por ejemplo sumar 5 unidades a un talle de Crocs).
   * Guardar los cambios.
2. **Desde la Terminal 1:**
   * Abrir `http://localhost:3000` en su navegador.
   * Dirigirse al mismo producto y verificar que el stock ya refleja las 5 unidades añadidas.
3. Ambos operadores pueden cargar, modificar precios, exportar o dar de alta variantes simultáneamente sin conflictos de versiones.

---

## 7. Plan de Contingencia: ¿Qué hacer si no hay Internet?

Si en el local de Saavedra 241 se cae el proveedor de internet y Tailscale no puede conectar:

1. **Ambas máquinas deben estar conectadas al mismo router Wi-Fi o switch del local.**
2. En la **Terminal 1**, abrir PowerShell y consultar la IP interna:
   ```powershell
   ipconfig
   ```
   *Buscar la línea que dice "Dirección IPv4" bajo el adaptador Wi-Fi o Ethernet (ejemplo: `192.168.1.45`).*
3. En la **Terminal 2**, ingresar desde el navegador usando esa IP interna:
   ```
   http://192.168.1.45:3000
   ```
*La comunicación en red local directa no depende de internet externo y seguirá funcionando al 100%.*

---

## 8. Rutina Diaria Automatizada (Para Personal No Técnico)

Para que el personal de mostrador no tenga que interactuar con terminales, comandos ni consolas negras, se incluyen scripts listos para usar con un solo clic o de forma 100% automática:

### Opción A: Con Doble Clic en el Escritorio (Recomendado)

En la carpeta raíz del proyecto se crearon los archivos:
* [`iniciar-sistema.bat`](file:///C:/Users/della/matacos-deportes-app/iniciar-sistema.bat) / [`iniciar-en-segundo-plano.vbs`](file:///C:/Users/della/matacos-deportes-app/iniciar-en-segundo-plano.vbs):
  1. Verifica y abre **Docker Desktop** automáticamente si estaba cerrado.
  2. Levanta la base de datos PostgreSQL.
  3. Abre el navegador web en `http://localhost:3000`.
  4. Inicia el servidor de Matacos Deportes en red local.
* [`detener-sistema.bat`](file:///C:/Users/della/matacos-deportes-app/detener-sistema.bat): Apaga limpiamente la base de datos y libera los recursos.

#### ¿Cómo dejarle un ícono amigable en el Escritorio?
1. En la **Terminal 1**, hacer clic derecho sobre `iniciar-en-segundo-plano.vbs` (o `iniciar-sistema.bat`).
2. Seleccionar **"Mostrar más opciones"** -> **"Enviar a"** -> **"Escritorio (crear acceso directo)"**.
3. En el Escritorio, renombrar el acceso directo a: `Iniciar Matacos Deportes`.
4. *(Opcional)* Cambiar el ícono: Clic derecho en el acceso directo -> **Propiedades** -> **Cambiar ícono...** y seleccionar el logo de Matacos.
5. El encargado del local solo debe hacer **doble clic en ese ícono al abrir el negocio**.

---

### Opción B: Inicio 100% Automático al Encender la Notebook (Cero Clics)

Si desean que al prender la notebook de la mañana el sistema se inicie solo sin que el personal toque nada:

1. En la **Terminal 1**, presionar las teclas `Windows + R`.
2. Escribir:
   ```text
   shell:startup
   ```
   *(Esto abrirá la carpeta "Inicio" de Windows, donde todo lo que esté allí se ejecuta al encender el equipo).*
3. Copiar y pegar allí un acceso directo de `iniciar-en-segundo-plano.vbs`.
4. ¡Listo! Al encender la notebook e iniciar sesión en Windows:
   * Se inicia Docker en silencio.
   * Se conecta la base de datos.
   * A los pocos segundos se abre automáticamente la pantalla de Matacos Deportes en el navegador lista para cobrar o gestionar stock.

---

### Al cerrar el local:
* Pueden hacer doble clic en el acceso directo de `detener-sistema.bat`, o simplemente suspender/apagar la notebook de forma tradicional (los datos de stock quedan preservados de manera íntegra en los volúmenes de Docker).
