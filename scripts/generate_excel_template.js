const XLSX = require("xlsx");
const path = require("path");

// 1. Datos de ejemplo para la carga
const sampleData = [
  {
    "Disciplina": "Natación",
    "Categoría": "Antiparras",
    "Marca": "Speedo",
    "Nombre Producto": "Antiparras Mariner Pro",
    "Descripción": "Lentes con protección UV y tratamiento antivaho",
    "Talle": "Único",
    "Color": "Azul",
    "Código de Barra": "7791234567890",
    "SKU (Opcional)": "",
    "Stock Salón": 2,
    "Stock Depósito": 5,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 12500.00,
    "Precio Venta (ARS)": 24900.00,
  },
  {
    "Disciplina": "Natación",
    "Categoría": "Antiparras",
    "Marca": "Speedo",
    "Nombre Producto": "Antiparras Mariner Pro",
    "Descripción": "Lentes con protección UV y tratamiento antivaho",
    "Talle": "Único",
    "Color": "Negro",
    "Código de Barra": "7791234567891",
    "SKU (Opcional)": "",
    "Stock Salón": 1,
    "Stock Depósito": 4,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 12500.00,
    "Precio Venta (ARS)": 24900.00,
  },
  {
    "Disciplina": "Natación",
    "Categoría": "Mallas",
    "Marca": "Arena",
    "Nombre Producto": "Malla Competición Solid",
    "Descripción": "Malla resistente al cloro y secado rápido",
    "Talle": "S",
    "Color": "Negro",
    "Código de Barra": "",
    "SKU (Opcional)": "",
    "Stock Salón": 1,
    "Stock Depósito": 2,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 18000.00,
    "Precio Venta (ARS)": 36000.00,
  },
  {
    "Disciplina": "Natación",
    "Categoría": "Mallas",
    "Marca": "Arena",
    "Nombre Producto": "Malla Competición Solid",
    "Descripción": "Malla resistente al cloro y secado rápido",
    "Talle": "M",
    "Color": "Negro",
    "Código de Barra": "",
    "SKU (Opcional)": "",
    "Stock Salón": 2,
    "Stock Depósito": 3,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 18000.00,
    "Precio Venta (ARS)": 36000.00,
  },
  {
    "Disciplina": "Natación",
    "Categoría": "Mallas",
    "Marca": "Arena",
    "Nombre Producto": "Malla Competición Solid",
    "Descripción": "Malla resistente al cloro y secado rápido",
    "Talle": "L",
    "Color": "Azul Marino",
    "Código de Barra": "",
    "SKU (Opcional)": "",
    "Stock Salón": 1,
    "Stock Depósito": 1,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 18000.00,
    "Precio Venta (ARS)": 36000.00,
  },
  {
    "Disciplina": "Natación",
    "Categoría": "Gorras",
    "Marca": "Speedo",
    "Nombre Producto": "Gorra Silicona Plain Moulded",
    "Descripción": "Silicona ergonómica sin costuras",
    "Talle": "Único",
    "Color": "Verde Flúor",
    "Código de Barra": "7799876543210",
    "SKU (Opcional)": "",
    "Stock Salón": 3,
    "Stock Depósito": 10,
    "Mínimo Salón": 2,
    "Mínimo Proveedor": 3,
    "Precio Costo (ARS)": 4500.00,
    "Precio Venta (ARS)": 9500.00,
  },
  {
    "Disciplina": "Vóley",
    "Categoría": "Pelotas",
    "Marca": "Mikasa",
    "Nombre Producto": "Pelota Vóley V200W",
    "Descripción": "Balón oficial de competición en microfibra",
    "Talle": "5",
    "Color": "Amarillo/Azul",
    "Código de Barra": "4907225880001",
    "SKU (Opcional)": "",
    "Stock Salón": 2,
    "Stock Depósito": 3,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 65000.00,
    "Precio Venta (ARS)": 115000.00,
  },
  {
    "Disciplina": "Vóley",
    "Categoría": "Pelotas",
    "Marca": "Wilson",
    "Nombre Producto": "Pelota Vóley Soft Play",
    "Descripción": "Tacto suave para entrenamiento y playa",
    "Talle": "5",
    "Color": "Blanco/Verde",
    "Código de Barra": "026388456123",
    "SKU (Opcional)": "",
    "Stock Salón": 3,
    "Stock Depósito": 6,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 22000.00,
    "Precio Venta (ARS)": 42000.00,
  },
  {
    "Disciplina": "Vóley",
    "Categoría": "Rodilleras",
    "Marca": "Topper",
    "Nombre Producto": "Rodilleras Acolchadas Pro",
    "Descripción": "Protección de alto impacto con tejido elástico",
    "Talle": "M",
    "Color": "Negro",
    "Código de Barra": "",
    "SKU (Opcional)": "",
    "Stock Salón": 2,
    "Stock Depósito": 4,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 9500.00,
    "Precio Venta (ARS)": 18500.00,
  },
  {
    "Disciplina": "Vóley",
    "Categoría": "Rodilleras",
    "Marca": "Topper",
    "Nombre Producto": "Rodilleras Acolchadas Pro",
    "Descripción": "Protección de alto impacto con tejido elástico",
    "Talle": "L",
    "Color": "Negro",
    "Código de Barra": "",
    "SKU (Opcional)": "",
    "Stock Salón": 2,
    "Stock Depósito": 4,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 9500.00,
    "Precio Venta (ARS)": 18500.00,
  },
  {
    "Disciplina": "Crocs",
    "Categoría": "Calzado",
    "Marca": "Crocs",
    "Nombre Producto": "Zueco Classic Clog",
    "Descripción": "Material Croslite ligero y resistente al agua",
    "Talle": "40",
    "Color": "Negro",
    "Código de Barra": "191448123401",
    "SKU (Opcional)": "",
    "Stock Salón": 1,
    "Stock Depósito": 3,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 28000.00,
    "Precio Venta (ARS)": 58000.00,
  },
  {
    "Disciplina": "Crocs",
    "Categoría": "Calzado",
    "Marca": "Crocs",
    "Nombre Producto": "Zueco Classic Clog",
    "Descripción": "Material Croslite ligero y resistente al agua",
    "Talle": "41",
    "Color": "Negro",
    "Código de Barra": "191448123418",
    "SKU (Opcional)": "",
    "Stock Salón": 2,
    "Stock Depósito": 5,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 28000.00,
    "Precio Venta (ARS)": 58000.00,
  },
  {
    "Disciplina": "Fitness",
    "Categoría": "Accesorios",
    "Marca": "Matacos",
    "Nombre Producto": "Mancuernas Fundición Vinilo",
    "Descripción": "Par de mancuernas engomadas de 2kg",
    "Talle": "2kg",
    "Color": "Rojo",
    "Código de Barra": "",
    "SKU (Opcional)": "",
    "Stock Salón": 2,
    "Stock Depósito": 6,
    "Mínimo Salón": 1,
    "Mínimo Proveedor": 2,
    "Precio Costo (ARS)": 7000.00,
    "Precio Venta (ARS)": 14000.00,
  }
];

// 2. Instrucciones de uso para el usuario/encargados
const instructions = [
  { "Campo / Columna": "Disciplina", "Obligatorio": "SÍ", "Descripción y Reglas": "Área deportiva principal (ej. Natación, Vóley, Crocs, Fitness, Indumentaria)." },
  { "Campo / Columna": "Categoría", "Obligatorio": "SÍ", "Descripción y Reglas": "Tipo de artículo (ej. Antiparras, Mallas, Pelotas, Calzado, Remeras, Rodilleras)." },
  { "Campo / Columna": "Marca", "Obligatorio": "SÍ", "Descripción y Reglas": "Fabricante o marca registrada (ej. Speedo, Arena, Wilson, Mikasa, Crocs, Topper)." },
  { "Campo / Columna": "Nombre Producto", "Obligatorio": "SÍ", "Descripción y Reglas": "Denominación comercial del producto (debe repetirse igual en todas sus variantes de talle/color)." },
  { "Campo / Columna": "Descripción", "Obligatorio": "NO", "Descripción y Reglas": "Detalle de materiales, tecnología o características para la tienda online." },
  { "Campo / Columna": "Talle", "Obligatorio": "SÍ", "Descripción y Reglas": "Número de calzado (40, 41), talle textil (S, M, L, XL), medida (2kg, 5) o 'Único'." },
  { "Campo / Columna": "Color", "Obligatorio": "SÍ", "Descripción y Reglas": "Color predominante o combinación (Negro, Azul, Amarillo/Azul, Flúor)." },
  { "Campo / Columna": "Código de Barra", "Obligatorio": "NO", "Descripción y Reglas": "Código EAN-13 de fábrica si lo tiene. Si no tiene, dejar en blanco para imprimir etiqueta interna." },
  { "Campo / Columna": "SKU (Opcional)", "Obligatorio": "NO", "Descripción y Reglas": "Código interno. Si se deja en blanco, el sistema lo genera automáticamente." },
  { "Campo / Columna": "Stock Salón", "Obligatorio": "SÍ", "Descripción y Reglas": "Unidades físicas exhibidas en el salón de ventas / mostrador (número entero >= 0)." },
  { "Campo / Columna": "Stock Depósito", "Obligatorio": "SÍ", "Descripción y Reglas": "Unidades físicas guardadas en el depósito interno (número entero >= 0)." },
  { "Campo / Columna": "Mínimo Salón", "Obligatorio": "NO", "Descripción y Reglas": "Umbral mínimo para disparar alerta de reposición de depósito a salón (por defecto: 1)." },
  { "Campo / Columna": "Mínimo Proveedor", "Obligatorio": "NO", "Descripción y Reglas": "Umbral mínimo total para disparar alerta de compra a proveedor (por defecto: 2)." },
  { "Campo / Columna": "Precio Costo (ARS)", "Obligatorio": "SÍ", "Descripción y Reglas": "Precio de compra neto al distribuidor en pesos (solo números y punto decimal)." },
  { "Campo / Columna": "Precio Venta (ARS)", "Obligatorio": "SÍ", "Descripción y Reglas": "Precio final de venta minorista al público en pesos (solo números y punto decimal)." }
];

const wb = XLSX.utils.book_new();

const wsData = XLSX.utils.json_to_sheet(sampleData);
const wsInst = XLSX.utils.json_to_sheet(instructions);

// Ajustar anchos de columnas
wsData["!cols"] = [
  { wch: 15 }, // Disciplina
  { wch: 15 }, // Categoría
  { wch: 15 }, // Marca
  { wch: 30 }, // Nombre Producto
  { wch: 45 }, // Descripción
  { wch: 10 }, // Talle
  { wch: 15 }, // Color
  { wch: 18 }, // Código de Barra
  { wch: 18 }, // SKU
  { wch: 12 }, // Stock Salón
  { wch: 14 }, // Stock Depósito
  { wch: 14 }, // Mínimo Salón
  { wch: 16 }, // Mínimo Proveedor
  { wch: 18 }, // Precio Costo
  { wch: 18 }, // Precio Venta
];

wsInst["!cols"] = [
  { wch: 22 },
  { wch: 14 },
  { wch: 80 }
];

XLSX.utils.book_append_sheet(wb, wsData, "Productos_y_Stock");
XLSX.utils.book_append_sheet(wb, wsInst, "Guía_de_Uso");

const outputPath = path.join(__dirname, "../docs/plantilla_carga_stock_matacos.xlsx");
XLSX.writeFile(wb, outputPath);
console.log("Plantilla generada exitosamente en:", outputPath);
