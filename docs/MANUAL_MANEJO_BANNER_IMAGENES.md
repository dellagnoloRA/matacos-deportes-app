# Cómo manejar el banner de imágenes
## Manual de Usuario Oficial — Sistema Web Matacos Deportes
**Comercio:** Matacos Deportes (Saavedra 241, Formosa Capital, Argentina)  
**Destinatarios:** Administradores, Encargados de Local y Personal de Atención y Ventas  

---

## 📌 Índice de Contenidos

1. [Introducción y Propósito del Carrusel](#1-introducción-y-propósito-del-carrusel)
2. [Dónde se encuentra y cómo ingresar al panel](#2-dónde-se-encuentra-y-cómo-ingresar-al-panel)
3. [Requisitos técnicos y resoluciones recomendadas](#3-requisitos-técnicos-y-resoluciones-recomendadas)
4. [Paso 1: Cómo crear y publicar un nuevo banner](#4-paso-1-cómo-crear-y-publicar-un-nuevo-banner)
5. [Paso 2: Cómo elegir el destino del clic sin saber rutas técnicas](#5-paso-2-cómo-elegir-el-destino-del-clic-sin-saber-rutas-técnicas)
6. [Paso 3: Cómo modificar o editar un banner existente](#6-paso-3-cómo-modificar-o-editar-un-banner-existente)
7. [Paso 4: Cómo ordenar la prioridad de los banners](#7-paso-4-cómo-ordenar-la-prioridad-de-los-banners)
8. [Paso 5: Cómo pausar o eliminar un banner](#8-paso-5-cómo-pausar-o-eliminar-un-banner)
9. [Paso 6: Cómo verificar los cambios en la tienda en vivo](#9-paso-6-cómo-verificar-los-cambios-en-la-tienda-en-vivo)
10. [Preguntas frecuentes y buenas prácticas](#10-preguntas-frecuentes-y-buenas-prácticas)

---

## 1. Introducción y Propósito del Carrusel

El **carrusel principal** (o sección *Hero*) es lo primero que ve cualquier cliente al ingresar a la tienda online de Matacos Deportes ([www.matacosdeportes.com.ar](http://localhost:3000/)).

Su función es comunicar de manera visual, atractiva y directa:
* **Campañas de temporada:** Vuelta al cole, verano, natación, pretemporadas de vóley.
* **Liquidaciones y promociones:** Descuentos especiales por transferencia o liquidación de calzado.
* **Lanzamientos y novedades:** Nuevos modelos de Crocs, indumentaria técnica o pelotas oficiales.
* **Canales de atención directa:** Redirigir al cliente a WhatsApp con un solo clic.

> [!NOTE]
> Cada banner puede ser una **imagen fija optimizada** o un **video en bucle continuo**. El sistema se encarga automáticamente de que los textos y botones sean 100% legibles sobre cualquier imagen o video.

---

## 2. Dónde se encuentra y cómo ingresar al panel

Para administrar los banners no necesitás conocimientos técnicos. Todo se gestiona desde el panel administrativo del sistema.

### Pasos para ingresar:
1. Abrí el navegador web e ingresá a: **`/login`** (o [http://localhost:3000/login](http://localhost:3000/login)).
2. Iniciá sesión con tus credenciales de usuario con rol **ADMIN** o perfil con permisos de e-commerce:
   - **Usuario:** `admin` (o tu correo personal de empleado autorizado).
   - **Contraseña:** Tu clave habitual del sistema.
3. Una vez dentro del panel, mirá la **barra lateral izquierda**.
4. En el bloque de **Administración**, hacé clic en **"Banners Web"** (ícono de destellos ✨).
5. O podés entrar directamente escribiendo en la barra de direcciones: **`/admin?tab=banners`**.

---

## 3. Requisitos técnicos y resoluciones recomendadas

Para que las imágenes y videos no se vean pixelados, cortados ni deformados, es fundamental respetar las siguientes proporciones:

| Dispositivo | Resolución Recomendada | Formatos Permitidos | Peso Máximo |
| :--- | :--- | :--- | :--- |
| **🖥️ Computadora (Desktop)** | **1920 × 800 px** *(Panorámico 21:9)* o **1920 × 1080 px** *(16:9)* | Imágenes: `WebP`, `PNG`, `JPG`<br>Videos: `MP4`, `WebM`, `MOV` | Imagen: hasta **5 MB**<br>Video: hasta **30 MB** |
| **📱 Celular (Mobile - Opcional)** | **1080 × 1350 px** *(Vertical 4:5)* o **1080 × 1920 px** *(Vertical 9:16)* | Imágenes: `WebP`, `PNG`, `JPG`<br>Videos: `MP4`, `WebM` | Imagen: hasta **5 MB**<br>Video: hasta **30 MB** |

### 💡 Consejos de diseño para el personal:
1. **No pegues texto dentro de la foto:** El sistema escribe el título, subtítulo y botón automáticamente arriba de la imagen con tipografía nítida y contraste garantizado.
2. **Ubicación del sujeto o producto:** Conviene que la persona o el calzado esté centrado o hacia el lado derecho, ya que el título principal de Matacos se ubica sobre la izquierda.
3. **Versión para celular:** Subir una imagen exclusiva para celular es **opcional**. Si no subís ninguna, el sistema adapta automáticamente la imagen de computadora para que calce bien en teléfonos móviles.

---

## 4. Paso 1: Cómo crear y publicar un nuevo banner

Cuando quieras lanzar una nueva promoción, seguí estos pasos:

1. Ingresá a la sección **Banners Web** en el panel administrativo.
2. Hacé clic en el botón verde superior derecho: **`+ Nuevo Banner`**.
3. Se abrirá la ventana emergente con el formulario de carga:
   - **Título de la Campaña / Promoción (Obligatorio):** Escribí una frase corta y llamativa.  
     *Ejemplo:* `Temporada Natación 2026` o `Liquidación de Zapatillas`.
   - **Subtítulo o Frase Destacada (Opcional):** Aclaración de la oferta o facilidades de pago.  
     *Ejemplo:* `Hasta 6 cuotas sin interés y 15% OFF abonando por transferencia`.
4. **Cargar el archivo principal de Computadora:**
   - Podés presionar **"Subir archivo desde PC"** y elegir tu foto o video.
   - O podés hacer clic en el menú desplegable **"🎬 Elegir video institucional..."** para reutilizar alguno de los videos oficiales de Matacos Deportes (*Outdoor / Aventura*, *Alto rendimiento / Running* o *Trekking*).
5. **(Opcional) Cargar archivo para Celular:**
   - Si tenés una foto recortada en formato vertical para teléfonos, hacé clic en **"Subir versión vertical para celular"**.
6. **Definir el enlace de destino:** Seleccioná a dónde querés que vaya el cliente (ver [Sección 5](#5-paso-2-cómo-elegir-el-destino-del-clic-sin-saber-rutas-técnicas)).
7. **Fechas de Vigencia (Opcional):**
   - **Desde:** Si querés que empiece a mostrarse un día en particular. (Si lo dejás vacío, se muestra desde ahora mismo).
   - **Hasta:** Si es una promo que termina el domingo a medianoche, colocá esa fecha. Llegado ese momento, el banner se oculta solo sin que tengas que acordarte de borrarlo.
8. **Estado:** Asegurate de que la casilla **"Mostrar activamente en el carrusel de la tienda"** esté tildada.
9. Hacé clic en **`Guardar y Publicar`**. ¡Listo! El banner ya está en la tienda.

---

## 5. Paso 2: Cómo elegir el destino del clic sin saber rutas técnicas

Para evitar errores y no tener que memorizar enlaces complicados, el sistema cuenta con un **menú desplegable inteligente**:

| Opción en el Menú | ¿A dónde lleva al cliente? |
| :--- | :--- |
| 🏷️ **Todo el Catálogo de Productos** | Al listado completo de productos de la tienda (`/catalogo`). |
| 🔥 **Ofertas y Descuentos Especiales** | Filtra automáticamente todos los artículos rebajados (`/catalogo?soloOfertas=true`). |
| ✨ **Novedades / Nuevos Ingresos** | Muestra los últimos productos incorporados (`/catalogo?sort=newest`). |
| 🏊 **Disciplina: Natación** | Abre la vitrina de antiparras, mallas, gorras y accesorios de agua. |
| 🏐 **Disciplina: Vóley** | Abre la vitrina de rodilleras, pelotas, redes e indumentaria de vóley. |
| 👟 **Disciplina: Calzado Deportivo** | Filtra únicamente zapatillas de running, training y calzado técnico. |
| 🐊 **Disciplina: Crocs & Urbano** | Muestra las sandalias y clogs Crocs originales y la línea urbana. |
| 🏋️ **Disciplina: Fitness & Gimnasio** | Accesorios de entrenamiento, pesas, bandas elásticas y complementos. |
| 💬 **WhatsApp Oficial de Atención** | Abre un chat directo de WhatsApp con el número del local de Saavedra 241. |
| ⚙️ **Enlace Personalizado** | Abre un campo libre para que pegues cualquier link interno o página externa. |

---

## 6. Paso 3: Cómo modificar o editar un banner existente

Si cambiaste de idea sobre el texto, querés reemplazar la imagen o extender la fecha de una promoción:

1. En la lista de banners, ubicá la tarjeta que querés cambiar.
2. Hacé clic en el botón blanco **`Modificar`** (ícono de lápiz ✏️).
3. Se abrirá la misma ventana con todos los datos que ya tenía cargados.
4. Modificá lo que necesites:
   - Cambiá el título o subtítulo.
   - Subí un nuevo archivo multimedia si querés reemplazar la imagen/video.
   - Cambiá el destino del clic.
   - Ajustá las fechas límite.
5. Hacé clic en **`Guardar Cambios`**.
6. La página de inicio de la tienda se actualizará al instante con la nueva información.

---

## 7. Paso 4: Cómo ordenar la prioridad de los banners

El carrusel muestra los banners uno detrás de otro rotando automáticamente cada 7 segundos. El banner con el **orden #1** es la portada principal y el primero que ven los clientes.

### Para cambiar el orden:
1. En la lista de banners, observá los botones de flechas `▲` y `▼` en cada tarjeta:
   - Presioná **`▲` (Subir)** para que el banner aparezca antes en el carrusel.
   - Presioná **`▼` (Bajar)** para moverlo más atrás en la secuencia.
2. El sistema guarda la nueva posición inmediatamente sin necesidad de presionar ningún botón extra de guardar.

---

## 8. Paso 5: Cómo pausar o eliminar un banner

### Opción A: Pausar temporalmente (Recomendado)
Si una promoción terminó por este fin de semana pero querés volver a usarla el mes que viene, **no la borres**:
* Hacé clic en el botón **`Activo` / `Pausado`** (ícono de ojo 👁️).
* El banner cambiará de color a gris y dirá `Pausado`.
* Automáticamente dejará de aparecer en la tienda sin perder la imagen ni la configuración. Cuando quieras reactivarlo, hacé clic en el mismo botón.

### Opción B: Eliminar definitivamente
Si el banner quedó obsoleto y no se va a usar nunca más:
* Hacé clic en el botón rojo de **papelera** 🗑️.
* El navegador te pedirá confirmación: *"¿Eliminar el banner definitivamente?"*.
* Al aceptar, se borra el registro de la base de datos y se elimina el archivo pesado de imagen/video del servidor para no ocupar espacio en disco.

---

## 9. Paso 6: Cómo verificar los cambios en la tienda en vivo

Una vez creado, editado o reordenado un banner:

1. En la parte superior del panel de banners, hacé clic en el botón **"Ver Tienda"** (o abrí [http://localhost:3000/](http://localhost:3000/)).
2. Vas a ver el carrusel en la parte superior:
   - Podés esperar 7 segundos para ver la transición suave automática.
   - O podés tocar las flechas laterales `<` y `>` para desplazarte manualmente.
   - Hacé clic en el botón principal del banner para comprobar que te lleve correctamente a la categoría o catálogo configurado.

---

## 10. Preguntas frecuentes y buenas prácticas

### ❓ ¿Qué pasa si no hay ningún banner cargado o todos están pausados?
El sistema nunca queda en blanco. Si no hay banners activos, la tienda muestra de fondo el **video institucional por defecto** de Matacos Deportes con el mensaje de bienvenida y acceso al catálogo general.

### ❓ ¿Por qué no veo mi banner si ya lo creé?
Revisá dos cosas en el panel:
1. Que el botón diga **`Activo`** (verde) y no `Pausado`.
2. Que la **Fecha de Inicio** no esté puesta para un día futuro (en ese caso dirá `PROGRAMADO`), o que la **Fecha de Fin** no haya vencido ya (en ese caso dirá `EXPIRADO`).

### ❓ ¿Conviene usar imagen o video?
* **Videos (MP4):** Ideales para el banner #1 (portada principal) o campañas fuertes de temporada (ej. natación o running). Aportan dinamismo y profesionalismo.
* **Imágenes (WebP/JPG):** Ideales para promociones secundarias, ofertas de fin de semana o cuando necesitás publicar un anuncio en menos de 2 minutos.

### ❓ ¿A quién contactar ante dudas del sistema?
Para consultas sobre el funcionamiento o sugerencias de nuevas categorías en el menú, comunicarse con el equipo de desarrollo de la Práctica Profesional Supervisada (PPS I) — UCP Sede Formosa.
