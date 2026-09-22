# CONTEXT.md — Modelo de Dominio de Matacos Deportes

Glosario canónico de entidades y conceptos de negocio para el sistema de Matacos Deportes (Saavedra 241, Formosa).

## 1. Conceptos de Punto de Venta y Facturación

### Preventa de Salón (Terminal 1)
Pedido preliminar generado por un vendedor de salón mientras asesora al cliente. No constituye comprobante fiscal. Reserva unidades temporalmente en `stockReserved`. Se identifica con un código diario correlativo (`ticketCode`, ej. `#042`).

### Venta Mostrador (Terminal 2)
Operación de cobro definitiva ejecutada por un cajero. Consume medios de pago, calcula vuelto, descuenta existencias físicas en `stockStore`, libera `stockReserved` y emite el ticket final de venta.

### Tique Fiscal / Comprobante de Entrega (RF-10)
Documento estructurado en bobina térmica de 80mm entregado al comprador. Contiene la identificación tributaria del emisor (parametrizada de forma segura vía variables de entorno), numeración formal oficial (`00008-00026445`), desglose de variantes (producto, talle, color), descuentos unitarios y globales (RF-08), medios de pago y vuelto (RF-09), Transparencia Fiscal con IVA al 21% discriminado, hash de seguridad y código QR interoperable según normativa AFIP/ARCA.

### Punto de Venta (P.V.)
Identificador numérico de 5 dígitos (ej. `00008`) correspondiente al punto de emisión. Es desacoplado y configurable mediante variable de entorno (`POS_POINT_OF_SALE`), permitiendo migrar de controladores fiscales físicos a nuevos puntos de venta de Facturación Electrónica sin alterar la base de datos.

### Transparencia Fiscal (RG AFIP 5003)
Régimen que exige explicitar el IVA al 21% contenido en el precio final de cara al consumidor final: $\text{IVA} = \text{Total} - (\text{Total} / 1.21)$.

### Código QR Interoperable AFIP (RG 4291 / 5048)
Cadena de datos codificada en Base64 bajo el esquema oficial de AFIP (`https://www.afip.gob.ar/fe/qr/?p={BASE64}`) que expone los metadatos impositivos de la operación para lectura por smartphones o inspectores.

## 2. Reglas de Negocio: Cambios y Devoluciones

### Condiciones de Admisión de Cambios
1. **Comprobante Obligatorio:** Es requisito indispensable presentar el ticket impreso de compra.
2. **Estado del Artículo:** El producto debe encontrarse sin uso, sin signos de desgaste ni daños físicos, y con sus etiquetas originales adheridas.
3. **Exclusiones Sanitarias:** Por estrictas razones de higiene, prendas de contacto íntimo (ropa interior deportiva, calzas íntimas), mallas y medias no admiten cambio.
4. **Temporalidad:** Política comercial amplia y flexible (sin límite estricto de días preestablecido), supeditada al estricto cumplimiento del estado inmaculado de la prenda y su ticket.

### Mecánica de Precios en Cambios
- **Cambio 1 a 1 (Mismo producto por talle/color o artículo de igual valor):** Se realiza directo sin costo adicional para el cliente. Si el precio del producto subió en el catálogo general desde el día de la compra, se respeta el valor y no se cobra diferencia alguna.
- **Cambio por artículo de Mayor Valor:** El cliente abona únicamente la diferencia neta entre el valor acreditado y el nuevo producto.
- **Devolución / Saldo a Favor ("Vale de Compra"):** El comercio no realiza devoluciones de dinero en efectivo. En su lugar, se emite un **Vale de Compra** (saldo a favor del cliente) imputable a una compra futura en el local.

