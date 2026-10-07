# Estrategia de Desarrollo E-commerce a Medida
**Proyecto:** Matacos Deportes
**Contexto:** Transición hacia el desarrollo de la tienda online propia, descartando soluciones SaaS (como Tiendanube) para mantener control total sobre la interfaz, la integración omnicanal y el rendimiento.

---

## 1. El Valor del Desarrollo a Medida (vs. Tiendanube)

Al ser una empresa real con años de funcionamiento, apostar por un desarrollo a medida con **Next.js 15 y PostgreSQL** ofrece ventajas estratégicas que justifican el esfuerzo:

*   **Omnicanalidad Real (Single Source of Truth):** A diferencia de Tiendanube, donde tendrías que sincronizar el stock del salón con la nube mediante APIs lentas, aquí **el E-commerce y el Punto de Venta (POS) leen y escriben en la misma base de datos**. Si se vende una zapatilla en mostrador, desaparece de la web instantáneamente.
*   **Identidad Visual Única:** No dependes de plantillas rígidas. Podemos crear una interfaz moderna y adaptada al nicho de artículos deportivos.
*   **Sin Comisiones por Venta:** Las plataformas SaaS suelen cobrar una tarifa mensual más una comisión (1-2%) por transacción. Al ser propio, solo asumen los costos de la pasarela de pago (Mercado Pago) y el servidor (VPS).

---

## 2. Pautas Clave de Arquitectura y Rendimiento

El usuario actual abandona una tienda si tarda más de 3 segundos en cargar.
*   **Server Components (Next.js):** Generar el catálogo en el servidor permite que el navegador del cliente descargue menos código y la página cargue casi instantáneamente.
*   **Optimización de Imágenes:** El catálogo deportivo es muy visual. Se debe utilizar el componente `<Image>` de Next.js para servir imágenes en formato **WebP/AVIF**, redimensionadas automáticamente según el dispositivo (móvil o desktop).
*   **Edge Caching:** Guardar en caché las páginas de productos que no cambian constantemente, revalidándolas solo cuando se modifica el stock o el precio (Incremental Static Regeneration - ISR).

---

## 3. UI/UX: Experiencia de Usuario Orientada a la Conversión

El diseño debe guiar al usuario hacia la compra sin fricción.

### A. Navegación y Filtros (Faceted Search)
*   **Estructura clara:** Categorías principales accesibles (Calzado, Indumentaria, Accesorios).
*   **Filtros Esenciales:** En deportes, el usuario sabe lo que busca. Los filtros por **Disciplina (Fútbol, Running), Marca, Género y Talle** deben ser ultra rápidos y no recargar la página.

### B. Ficha del Producto (Product Detail Page - PDP)
*   **Imágenes de alta calidad:** Posibilidad de hacer zoom.
*   **Selector de Variantes:** Mostrar claramente qué talles y colores tienen stock. Si un talle no tiene stock, mostrarlo deshabilitado (tachado) en lugar de ocultarlo.
*   **Guía de Talles:** Fundamental en calzado e indumentaria deportiva para reducir devoluciones.
*   **Llamado a la Acción (CTA) fijo:** El botón "Agregar al Carrito" debe estar siempre visible en la pantalla del celular, incluso al hacer scroll.
*   **Sensación de Escasez:** Si quedan pocas unidades (ej. `< 3`), mostrar un mensaje sutil ("¡Últimos 2 disponibles!").

### C. Mobile-First Obligatorio
Más del 80% del tráfico en e-commerce minorista proviene de teléfonos móviles. Los menús (hamburguesa), los botones de filtro y el carrito deben estar diseñados para tocarse con el pulgar.

---

## 4. Checkout: Reducción de Abandonos de Carrito

La mayoría de las ventas se caen en el momento de pagar.
*   **Guest Checkout (Compra como invitado):** Obligar al usuario a crear una cuenta y recordar contraseñas destruye conversiones. Permitir comprar solo pidiendo los datos esenciales de contacto y envío.
*   **Claridad en Costos:** Mostrar opciones y costos de envío (o retiro en sucursal en Saavedra 241) antes de pedir los datos de la tarjeta.
*   **Integración Segura:** Utilizar el SDK o Checkout Pro de **Mercado Pago** asegurando que la experiencia de redirección y retorno a la web sea fluida.

---

## 5. SEO (Optimización para Motores de Búsqueda)

Una de las grandes ventajas de usar Next.js es el SEO técnico de alto nivel para posicionar a Matacos Deportes en Google.
*   **URLs Amigables:** `matacosdeportes.com/productos/zapatillas-nike-revolution-6`
*   **Microdatos (Schema.org):** Incrustar datos estructurados en el código fuente para que Google muestre el precio, la disponibilidad y la imagen del producto directamente en la página de resultados de búsqueda (Rich Snippets).
*   **Meta Tags Dinámicos:** Título y descripción únicos generados automáticamente para cada variante de producto.

---

## 6. Integración Operativa (El desafío técnico)

*   **Bloqueo Concurrente:** Al ser un inventario unificado, si un cliente web agrega un producto al carrito, no se debe descontar el stock inmediatamente, sino solo al confirmar el pago. Esto implica manejar bien los rechazos si, justo en ese minuto, el producto se vendió en el mostrador físico.
*   **Notificaciones Internas:** Cuando ingrese un pedido web, el personal en la tienda debe recibir una alerta (ej. un Dashboard para "Pedidos a Empaquetar") para separar físicamente el artículo del salón.
