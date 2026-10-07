# Diagrama del Modelo Relacional — Matacos Deportes
**Esquema:** [`prisma/schema.prisma`](file:///C:/Proyectos/matacos-deportes-app/prisma/schema.prisma)  
**Motor:** PostgreSQL 16 / Prisma ORM 6  
**Visor interactivo (navegador):** [`docs/diagrama_modelo_relacional.html`](file:///C:/Proyectos/matacos-deportes-app/docs/diagrama_modelo_relacional.html)

---

```mermaid
erDiagram
    User ||--o{ Sale : "crea / atiende"
    User ||--o{ Sale : "vendedor salon"
    User ||--o{ Sale : "cajero mostrador"
    User ||--o{ CashShift : "abre / cierra turno"

    Category ||--o{ Product : "clasifica"
    Brand ||--o{ Product : "marca"
    Discipline ||--o{ Product : "disciplina"

    Product ||--o{ ProductImage : "imagenes"
    Product ||--|{ ProductVariant : "variantes"

    ProductVariant ||--o{ InventoryMovement : "kardex stock"
    ProductVariant ||--o{ SaleItem : "items vendidos"

    CashShift ||--o{ CashMovement : "movimientos caja"
    CashShift ||--o{ Sale : "ventas del turno"

    Sale ||--|{ SaleItem : "contiene lineas"
    Sale ||--|{ SalePayment : "medios de pago"

    User {
        string id PK
        string email UK
        string name
        string password
        enum role "ADMIN | CAJERO | DESPACHO"
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Category {
        string id PK
        string name UK
        string slug UK
    }

    Brand {
        string id PK
        string name UK
        string slug UK
    }

    Discipline {
        string id PK
        string name UK
        string slug UK
    }

    Product {
        string id PK
        string name
        string description
        string imageUrl
        string modelCode
        string disciplineId FK
        string categoryId FK
        string brandId FK
        decimal costPrice
        decimal price
        boolean active
        boolean ignoreAlerts
        datetime createdAt
        datetime updatedAt
    }

    ProductImage {
        string id PK
        string productId FK
        string url
        string color
        boolean isPrimary
        int order
        datetime createdAt
        datetime updatedAt
    }

    ProductVariant {
        string id PK
        string productId FK
        string size "Talle"
        string color "Color"
        string sku UK
        string barcode UK
        int stockStore "Stock salon"
        int stockWarehouse "Stock deposito"
        int stockReserved "Stock preventas"
        int minStoreStock "Alerta salon"
        int minStock "Alerta proveedor"
        decimal price
        datetime createdAt
        datetime updatedAt
    }

    InventoryMovement {
        string id PK
        string variantId FK
        string type "Tipo movimiento"
        int quantity
        int stockAfter
        string location "STORE | WAREHOUSE"
        string reason
        datetime createdAt
    }

    CashShift {
        string id PK
        string terminalId "TERMINAL_1 | TERMINAL_2"
        string userId FK
        enum status "ABIERTA | CERRADA"
        datetime openedAt
        datetime closedAt
        decimal initialAmount "Fondo inicial"
        decimal expectedCash "Esperado"
        decimal expectedDebit
        decimal expectedCredit
        decimal expectedTransfer
        decimal expectedQr
        decimal actualCash "Arqueo ciego"
        decimal actualDebit
        decimal actualCredit
        decimal actualTransfer
        decimal actualQr
        decimal differenceCash "Diferencia"
        string notes
        datetime createdAt
        datetime updatedAt
    }

    CashMovement {
        string id PK
        string cashShiftId FK
        enum type "INGRESO | RETIRO | GASTO | AJUSTE"
        decimal amount
        string reason
        string receiptNumber
        string performedBy
        datetime createdAt
    }

    Sale {
        string id PK
        string invoiceNumber UK "Factura o Ticket X"
        string ticketCode "Preventa (#042)"
        string offlineId UK "UUID IndexedDB"
        string customerName
        string channel "MOSTRADOR | WEB"
        enum status "PENDIENTE_PAGO | COMPLETADA | CANCELADA"
        decimal subtotalGross
        decimal discount
        enum discountType "PERCENTAGE | FIXED"
        decimal discountValue
        decimal total
        string notes
        string userId FK
        string sellerId FK
        string cashierId FK
        string cashShiftId FK
        datetime syncedAt
        datetime createdAt
        datetime updatedAt
    }

    SaleItem {
        string id PK
        string saleId FK
        string variantId FK
        int quantity
        decimal originalPrice
        decimal discount
        enum discountType "PERCENTAGE | FIXED"
        decimal discountValue
        decimal unitPrice
        decimal price
        decimal subtotal
    }

    SalePayment {
        string id PK
        string saleId FK
        enum method "EFECTIVO | DEBITO | CREDITO | TRANSFERENCIA | QR_MERCADOPAGO"
        decimal amount
        decimal receivedAmount
        decimal change
        string cardBrand
        string cardVoucher
        int installments
        string referenceCode
    }
```
