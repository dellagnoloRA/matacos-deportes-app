# Documentación Técnica: Normalización de Planilla de Stock y Arquitectura de Catálogo
## Proyecto: Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes
**Comercio:** Matacos Deportes (Saavedra 241, Formosa Capital, Argentina)  
**Institución:** Universidad de la Cuenca del Plata — Práctica Profesional Supervisada I (PPS I)  
**Fecha de Elaboración:** 16 de Septiembre de 2026  

---

## 1. Contexto y Diagnóstico del Problema

Durante el relevamiento y preparación del inventario físico en Saavedra 241 mediante la planilla de cálculo inicial (`plantilla_carga_stock_matacos (1).xlsx`), se detectó un dilema de modelado de datos en la columna **`Nombre Producto`** (Columna 4):

### El Problema Identificado
En varios modelos de calzado (especialmente la línea *Crocs*), se colocó el nombre del color dentro del título del producto, por ejemplo:
* `CrocBand - Black`
* `CrocBand - Navy`
* `CrocBand - White White Navy`
* `CrocBand - Pearl Pink & Wild Orchid`

Al mismo tiempo, la planilla cuenta con una columna específica dedicada al **`Color`** (Columna 7) donde figuraba `"Negro"`, `"Marino/Rojo"`, `"Blanco/Azul"`, etc.

### Impacto en el Importador Masivo (`BulkImport` / RF-04)
El motor de ingestión masiva del sistema ([`excelImporter.ts`](file:///C:/Users/della/matacos-deportes-app/src/lib/excelImporter.ts#L135)) agrupa las variantes que pertenecen a un mismo producto padre utilizando la siguiente clave compuesta:

```typescript
const groupKey = `${disciplineName.toLowerCase()}::${brandName.toLowerCase()}::${productName.toLowerCase()}`;
```

Como consecuencia directa:
1. **Inflación artificial del catálogo:** Cada colorway generaba un registro `Product` completamente independiente en PostgreSQL. En un lote de 539 filas de variantes, se creaban **70 productos distintos** en lugar de unas **28 familias reales**.
2. **Fragmentación extrema de Crocs:** Solo de *Crocband Adulto* se generaban 20 productos separados, y de *Crocband Kids* otros 12 productos aislados.
3. **Inconsistencias de formato:** En otras secciones de la planilla se habían dejado guiones huérfanos (`Bandolera Wilson -`, `Valija Mediana - `) por indecisión sobre si agregar o no el color al nombre.

---

## 2. Fundamento Arquitectónico: Entidad Padre vs. Entidad Variante

La arquitectura relacional del sistema ([`prisma/schema.prisma`](file:///C:/Users/della/matacos-deportes-app/prisma/schema.prisma#L58-L95)) y la base local IndexedDB ([`Dexie.js`](file:///C:/Users/della/matacos-deportes-app/src/lib/db.ts)) diferencian claramente dos niveles de abstracción:

```
┌────────────────────────────────────────────────────────┐
│                   PRODUCT (Producto Padre)             │
│  - id: UUID                                            │
│  - name: "Crocband"                                    │
│  - brand: "Crocs"                                      │
│  - discipline: "Crocs"                                 │
│  - category: "Calzado"                                 │
│  - costPrice / price: Precios base de referencia       │
└───────────────────────────┬────────────────────────────┘
                            │ 1 a N
┌───────────────────────────┴────────────────────────────┐
│              PRODUCT_VARIANT (Variantes de Stock)      │
│  - id: UUID                                            │
│  - size: Talle ("4/6 (36)", "M11 (43)", etc.)          │
│  - color: Color ("Negro", "Marino/Rojo", etc.)         │
│  - sku: "CRO-CRO-CRO-4/6-NEG"                          │
│  - barcode: "883503475922" (EAN-13 de fábrica)         │
│  - stockStore: Stock físico en Saavedra 241            │
│  - stockWarehouse: Stock en Depósito interno           │
│  - minStoreStock / minStock: Umbrales de alerta        │
└────────────────────────────────────────────────────────┘
```

### Regla Canónica de Negocio ([`docs/ESTRUCTURA_PLANTILLA_EXCEL.md`](file:///C:/Users/della/matacos-deportes-app/docs/ESTRUCTURA_PLANTILLA_EXCEL.md#L16))
> **Nombre Producto:** *Nombre del producto. **Debe repetirse idéntico** en todas las filas que correspondan a variantes de ese mismo producto.*

Ejemplo oficial documentado para calzado:
```csv
Crocs,Calzado,Crocs,Zueco Classic Clog,Croslite resistente al agua,40,Negro,191448123401,,1,3,1,2,28000.00,58000.00
Crocs,Calzado,Crocs,Zueco Classic Clog,Croslite resistente al agua,41,Negro,191448123418,,2,5,1,2,28000.00,58000.00
Crocs,Calzado,Crocs,Zueco Classic Clog,Croslite resistente al agua,42,Azul Marino,191448123425,,1,4,1,2,28000.00,58000.00
```

---

## 3. Matriz de Impacto Operativo (Antes vs. Después)

| Área / Módulo | Estado Anterior (Nombre con Color) | Estado Normalizado (Nombre Canónico) | Beneficio Operativo |
| :--- | :--- | :--- | :--- |
| **Dashboard de Inventario (`InventoryView`)** | 70 tarjetas individuales. 20 tarjetas repetidas de Crocband que saturaban la pantalla. | 28 tarjetas consolidadas por familia de producto. | Visibilidad inmediata del stock total de cada modelo (ej. "340 unidades de Crocband en stock"). |
| **Punto de Venta Mostrador (POS)** | El cajero debía buscar entre 20 variantes con nombres extensos si no tenía código de barras. | Al escanear con la pistola USB lectora, el sistema busca por `barcode` directo en `ProductVariant` y asigna producto, talle y color al instante. | Velocidad de cobro idéntica por código de barras, pero búsqueda por texto 10x más ágil y limpia. |
| **Actualización Masiva de Precios** | Si Crocs aumentaba sus precios, había que actualizar 20 productos diferentes. | Se modifica el precio en el producto padre `Crocband` y se propaga en cascada a sus variantes. | Ahorro masivo de tiempo administrativo y menor riesgo de inconsistencias de precios en salón. |
| **E-commerce / Tienda Web** | La vidriera web mostraba 20 publicaciones idénticas con títulos en inglés/español. | Publicación unificada de `Crocband` con selectores dinámicos de Color (swatches) y Talles. | Experiencia de usuario (UX) profesional estándar de la industria deportiva. |

---

## 4. Reglas de Transformación Aplicadas en la Normalización

El script automatizado aplicó las siguientes directivas de limpieza sobre la columna `Nombre Producto`:

1. **Unificación de Modelos Crocs:**
   * `CrocBand - [Color]` $\rightarrow$ **`Crocband`** (20 variantes consolidadas)
   * `CrocBand Kids - [Color]` $\rightarrow$ **`Crocband Kids`** (12 variantes consolidadas)
   * `Croc Classic Kids - [Color]` $\rightarrow$ **`Croc Classic Kids`**
   * `Croc Classic -` $\rightarrow$ **`Croc Classic`**
   * `Croc Santa Cruz Clean Cut - [Color]` $\rightarrow$ **`Croc Santa Cruz Clean Cut`**
   * `Croc Santa Cruz Mens - [Color]` $\rightarrow$ **`Croc Santa Cruz Mens`**
   * `Croc Santa Cruz 2 Luxe Leather - [Color]` $\rightarrow$ **`Croc Santa Cruz 2 Luxe Leather`**
   * `Croc Crush Sandal - [Color]` $\rightarrow$ **`Croc Crush Sandal`**
   * `Croc Classic Sandal - [Color]` $\rightarrow$ **`Croc Classic Sandal`**
   * `Croc Classic Crush Clog - [Color]` $\rightarrow$ **`Croc Classic Crush Clog`**
   * `Croc Plataforma -` $\rightarrow$ **`Croc Plataforma`**

2. **Limpieza de Accesorios Wilson y Valijas:**
   * Eliminación de guiones huérfanos al final del texto:
     * `Bandolera Wilson -` $\rightarrow$ **`Bandolera Wilson`**
     * `Botinero Wilson -` $\rightarrow$ **`Botinero Wilson`**
     * `Riñonera Wilson sin Compartimiento -` $\rightarrow$ **`Riñonera Wilson sin Compartimiento`**
     * `Riñonera Wilson -` $\rightarrow$ **`Riñonera Wilson`**
     * `Valija Mediana - ` $\rightarrow$ **`Valija Mediana`**
     * `Valija Chica - ` $\rightarrow$ **`Valija Chica`**

3. **Preservación de Submodelos Funcionales:**
   * `Valija Grande - Policarbonato` y `Valija Grande - Tela` se mantuvieron diferenciadas porque corresponden a materiales y líneas de producto distintas con costos diferentes.

---

## 5. Auditoría de Datos: Hallazgo Crítico Detectado

Durante el procesamiento algorítmico de duplicados, el normalizador detectó una **colisión de variantes en la Fila 405**:

* **Fila 396:** `Croc Santa Cruz Clean Cut` — Talle: `M12` — Color: `Cuero Negro` (Origen: modelo *Expresso*)
* **Fila 405:** `Croc Santa Cruz Clean Cut` — Talle: `M12` — Color: `Cuero Negro` (Origen: modelo *Khaki Cobblestone*)

> [!CAUTION]
> **Causa:** En la fila 405 de la planilla original, el título era `Croc Santa Cruz Clean Cut - Khaki Cobblestone`, pero en la celda de la columna **Color** se arrastró por error el valor `"Cuero Negro"`.  
> **Acción requerida en Google Sheets:** Abrir la fila 405 y corregir el valor de la columna `Color` reemplazando `"Cuero Negro"` por `"Khaki"` o `"Beige Cobblestone"` para evitar que ambas filas compitan por la misma combinación `(Producto, Talle, Color)`.

---

## 6. Recursos y Herramientas Generadas

Para facilitar la operatoria diaria del equipo de desarrollo y los encargados de Saavedra 241, se generaron los siguientes archivos:

### 1. En la Carpeta de Descargas (`C:\Users\della\Downloads\`)
* [**`plantilla_carga_stock_matacos_normalizada.xlsx`**](file:///C:/Users/della/Downloads/plantilla_carga_stock_matacos_normalizada.xlsx): Planilla Excel completa con las 539 filas procesadas, 504 correcciones aplicadas y fórmulas de SKU intactas. Lista para subir a Google Drive.
* [**`plantilla_carga_stock_matacos_normalizada.csv`**](file:///C:/Users/della/Downloads/plantilla_carga_stock_matacos_normalizada.csv): Archivo CSV en formato UTF-8 con BOM, ideal para importación inmediata en Google Sheets (`Archivo > Importar > Subir`).
* [**`google_apps_script_matacos.js`**](file:///C:/Users/della/Downloads/google_apps_script_matacos.js): Código fuente de Google Apps Script para ejecutar la normalización directamente en la nube desde la interfaz de Google Sheets (`Extensiones > Apps Script`).
* [**`normalizar_plantilla_stock.js`**](file:///C:/Users/della/Downloads/normalizar_plantilla_stock.js): Script ejecutable en Node.js para procesamiento local en futuras cargas.

### 2. En el Repositorio del Proyecto
* [`scripts/normalizar_plantilla_stock.js`](file:///C:/Users/della/matacos-deportes-app/scripts/normalizar_plantilla_stock.js): Script de automatización integrado a las herramientas del proyecto.
* [`docs/GUIA_NORMALIZACION_EXCEL_STOCK.md`](file:///C:/Users/della/matacos-deportes-app/docs/GUIA_NORMALIZACION_EXCEL_STOCK.md): Copia de esta documentación técnica para el repositorio.

---

## 7. Protocolo para Futuras Cargas de Stock Masivo

1. **Definir el Modelo Base:** En la columna `Nombre Producto`, escribir únicamente el nombre comercial del modelo (ej: `Malla Solid`, `Pelota MVA 200`, `Zueco Classic Clog`).
2. **No Duplicar Atributos:** Jamás incluir el talle ni el color dentro de la celda de nombre de producto.
3. **Pistola Lectora USB:** Siempre que la prenda o calzado tenga código de barra de fábrica, hacer foco en la celda `Código de Barra` y disparar el gatillo para capturar el EAN-13 de 13 dígitos.
4. **Verificación de Colores:** Si se copia y pega un bloque de talles para un nuevo colorway, verificar inmediatamente que la columna `Color` refleje el nuevo color y no haya quedado el color del bloque anterior.
