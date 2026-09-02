# Guía de Estructura de la Plantilla de Carga de Stock — Matacos Deportes

Esta guía detalla la estructura y reglas de llenado de la plantilla oficial de carga de catálogo e inventario, disponible en formatos:
* **Excel Nativo (.xlsx):** [`docs/plantilla_carga_stock_matacos.xlsx`](file:///C:/Users/della/matacos-deportes-app/docs/plantilla_carga_stock_matacos.xlsx)
* **Texto Plano (.csv):** [`docs/plantilla_carga_stock_matacos.csv`](file:///C:/Users/della/matacos-deportes-app/docs/plantilla_carga_stock_matacos.csv)

---

## 1. Columnas y Definición de Campos

| # | Columna | Obligatorio | Tipo de Dato | Ejemplo | Descripción y Reglas de Negocio |
| :-: | :--- | :-: | :--- | :--- | :--- |
| **1** | **Disciplina** | **SÍ** | Texto | `Natación`, `Vóley`, `Crocs`, `Fitness` | Área o deporte principal. El backend normaliza mayúsculas/minúsculas y tildes automáticamente. |
| **2** | **Categoría** | **SÍ** | Texto | `Antiparras`, `Mallas`, `Pelotas`, `Calzado` | Tipo de producto. Si no existe en la base de datos, se crea automáticamente (*on-the-fly*). |
| **3** | **Marca** | **SÍ** | Texto | `Speedo`, `Arena`, `Wilson`, `Mikasa`, `Crocs` | Marca fabricante o distribuidor. Se normaliza contra duplicados. |
| **4** | **Nombre Producto** | **SÍ** | Texto | `Antiparras Mariner Pro`, `Zueco Classic Clog` | Nombre del producto. **Debe repetirse idéntico** en todas las filas que correspondan a variantes de ese mismo producto. |
| **5** | **Descripción** | NO | Texto | `Lentes con protección UV y antivaho` | Descripción de materiales o características para la ficha técnica en la web. |
| **6** | **Talle** | **SÍ** | Texto | `41`, `M`, `L`, `Único`, `2kg`, `5` | Talle numérico, medida o tamaño de la variante. |
| **7** | **Color** | **SÍ** | Texto | `Negro`, `Azul`, `Amarillo/Azul`, `Flúor` | Color predominante o combinación de la variante. |
| **8** | **Código de Barra** | NO | Numérico / Texto | `7791234567890` | Código EAN-13 impreso en la caja/etiqueta de fábrica. Si el artículo no tiene código, **se deja en blanco**. |
| **9** | **SKU (Autogenerado)** | NO | Texto / Fórmula | `SPE-NAT-ANT-UNI-AZU` | **Autogenerado automáticamente mediante fórmula de Excel** `=IF(D2="","",UPPER(LEFT(C2,3)&"-"&LEFT(A2,3)&"-"&LEFT(D2,3)&"-"&LEFT(F2,4)&"-"&LEFT(G2,3)))`. Si se desea un código personalizado, se puede sobreescribir la celda libremente. |
| **10** | **Stock Salón** | **SÍ** | Entero $\ge 0$ | `2` | Cantidad física exhibida en percheros, estanterías o mostrador del salón de ventas de Saavedra 241. |
| **11** | **Stock Depósito** | **SÍ** | Entero $\ge 0$ | `5` | Cantidad física almacenada en cajas dentro del depósito interno. |
| **12** | **Mínimo Salón** | NO | Entero $\ge 0$ | `1` *(por defecto: 1)* | Umbral mínimo en salón antes de disparar la **Alerta de Reposición Interna** (Depósito $\rightarrow$ Salón). |
| **13** | **Mínimo Proveedor** | NO | Entero $\ge 0$ | `2` *(por defecto: 2)* | Umbral de stock total antes de disparar la **Alerta de Compra a Proveedor**. |
| **14** | **Precio Costo (ARS)** | **SÍ** | Decimal | `12500.00` | Precio de compra neto al distribuidor en pesos (solo números y punto decimal, sin signo $ ni puntos de miles). |
| **15** | **Precio Venta (ARS)** | **SÍ** | Decimal | `24900.00` | Precio de venta minorista al público en el local y tienda web. |

---

## 2. Ejemplos de Llenado por Familias de Productos

### Ejemplo A: Producto con Múltiples Talles (Malla de Natación)
El producto padre comparte **Disciplina, Categoría, Marca, Nombre, Costo y Precio**, cambiando únicamente **Talle, Color, Código de Barra y Stock**:

```csv
Natación,Mallas,Arena,Malla Competición Solid,Malla resistente al cloro,S,Negro,,,1,2,1,2,18000.00,36000.00
Natación,Mallas,Arena,Malla Competición Solid,Malla resistente al cloro,M,Negro,,,2,3,1,2,18000.00,36000.00
Natación,Mallas,Arena,Malla Competición Solid,Malla resistente al cloro,L,Azul Marino,,,1,1,1,2,18000.00,36000.00
```

### Ejemplo B: Calzado con Código de Fábrica EAN-13 (Crocs)
```csv
Crocs,Calzado,Crocs,Zueco Classic Clog,Croslite resistente al agua,40,Negro,191448123401,,1,3,1,2,28000.00,58000.00
Crocs,Calzado,Crocs,Zueco Classic Clog,Croslite resistente al agua,41,Negro,191448123418,,2,5,1,2,28000.00,58000.00
Crocs,Calzado,Crocs,Zueco Classic Clog,Croslite resistente al agua,42,Azul Marino,191448123425,,1,4,1,2,28000.00,58000.00
```

### Ejemplo C: Accesorio sin Código de Fábrica (Pesas de Gimnasio)
```csv
Fitness,Accesorios,Matacos,Mancuernas Fundición Vinilo,Par de mancuernas engomadas,2kg,Rojo,,,2,6,1,2,7000.00,14000.00
Fitness,Accesorios,Matacos,Mancuernas Fundición Vinilo,Par de mancuernas engomadas,3kg,Azul,,,2,4,1,2,9500.00,19000.00
```

---

## 3. Recomendaciones para las Jornadas de Carga

1. **Agrupación Física:** Contar y completar la planilla por estantes contiguos o sectores de la misma marca.
2. **Uso de Pistola Lectora USB:** Si la prenda o caja tiene código de barras de fábrica, hacer clic en la celda `Código de Barra` y presionar el gatillo de la pistola lectora para volcar el número de 13 dígitos al instante.
3. **Guardado en la Nube:** Si se utiliza Google Sheets durante la visita al local, exportar como `.xlsx` o `.csv` antes de subir al importador del sistema.
