# Diagrama de Interacción: Ficha de Detalle de Producto (PDP) y Stock en Tiempo Real
## Requerimiento Funcional: RF-14 — Módulo E-commerce
**Cliente:** Matacos Deportes (Saavedra 241, Formosa Capital)  
**Proyecto:** Sistema Integral de Gestión, POS Offline y E-commerce  

---

### Descripción del Flujo
Este diagrama ilustra la secuencia de interacciones entre el cliente en el navegador web (móvil o desktop), los componentes visuales de la Ficha de Detalle de Producto (PDP), las Server Actions de Next.js 15 y la base de datos PostgreSQL/Prisma.

Garantiza:
1. **Carga completa y segura del artículo:** Visualización de ficha técnica, fotos ordenadas por variante y discriminación de disponibilidad sin exponer precios de costo ni proveedores.
2. **Carga en paralelo de recomendaciones:** Productos relacionados de la misma disciplina para venta cruzada (*cross-selling*).
3. **Validación atómica de existencias:** Chequeo en milisegundos del stock físico disponible $(\text{Salón} + \text{Depósito} - \text{Reservado})$ al interactuar con el selector de talles antes de agregar al carrito.

---

### Diagrama de Secuencia (Mermaid)

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente Web (Móvil / Desktop)
    participant UI as Ficha de Producto (PDP)
    participant ActionDetail as getProductDetail(idOrSlug)
    participant ActionStock as checkVariantStock(variantId)
    participant ActionRelated as getRelatedProducts(productId, limit)
    participant DB as PostgreSQL 16 (Prisma ORM)

    Note over Cliente,UI: 1. Navegación hacia la Ficha de Producto
    Cliente->>UI: Ingresa a /productos/[slug]
    UI->>ActionDetail: Consulta datos completos del producto (id o slug)
    ActionDetail->>DB: findUnique (Product + Images ordenadas + Variants)
    DB-->>ActionDetail: Retorna registro relacional completo
    ActionDetail->>ActionDetail: Calcula stock real disponible por variante:<br/>availableStock = (stockStore + stockWarehouse) - stockReserved
    ActionDetail->>ActionDetail: Asigna indicador isAvailable: boolean (sin ocultar agotados)
    ActionDetail-->>UI: Devuelve PublicProductDetail (DTO seguro sin costPrice)

    Note over UI,DB: 2. Carga asíncrona de Productos Relacionados
    par Carga de Recomendaciones Cruzadas
        UI->>ActionRelated: getRelatedProducts(productId, limit = 4)
        ActionRelated->>DB: findMany (misma disciplina/categoría, active: true, stock > 0, excluye id actual)
        DB-->>ActionRelated: Registros de 4 artículos recomendados
        ActionRelated-->>UI: Devuelve PublicProductItem[]
    end

    Note over Cliente,DB: 3. Interacción con Selector de Variantes
    Cliente->>UI: Selecciona un Talle (ej: Talle 41) y Color (ej: Negro)
    UI->>ActionStock: checkVariantStock(variantId)
    ActionStock->>DB: findUnique (stockStore, stockWarehouse, stockReserved, price)
    DB-->>ActionStock: Existencias físicas instantáneas
    ActionStock->>ActionStock: Valida availableStock > 0 y calcula precio efectivo
    ActionStock-->>UI: Confirma { availableStock, isAvailable: true, price }
    
    alt Hay stock disponible (isAvailable == true)
        UI-->>Cliente: Habilita botón "Agregar al Carrito" y muestra stock disponible
    else Sin stock disponible (isAvailable == false)
        UI-->>Cliente: Muestra talle deshabilitado/tachado y badge "Agotado"
    end
```

---

### Reglas de Negocio Vinculadas
* **Fórmula de Stock Neto:** $\text{Stock Disponible} = \max(0, (\text{stockStore} + \text{stockWarehouse}) - \text{stockReserved})$.
* **Variantes Agotadas Visibles:** No se ocultan los talles sin existencias para evitar que el cliente asuma que el comercio no comercializa ese número/medida. Se presentan deshabilitados.
* **Seguridad (Zero-Leakage):** Bajo ninguna condición se transmite el campo `costPrice` ni los márgenes del comercio a la capa pública.
