# Diagrama del Modelo Relacional — Matacos Deportes
**Esquema:** [`prisma/schema.prisma`](file:///C:/Users/della/matacos-deportes-app/prisma/schema.prisma)  
**Motor:** PostgreSQL 16 / Prisma ORM 6  
**Visor interactivo (navegador):** [`docs/diagrama_modelo_relacional.html`](file:///C:/Users/della/matacos-deportes-app/docs/diagrama_modelo_relacional.html)

---

```mermaid
erDiagram
    Profile ||--o{ Profile : "hereda de (parentProfileId)"
    Profile ||--o{ ProfilePermission : "asigna permisos"
    Permission ||--o{ ProfilePermission : "compone perfil"
    Profile ||--o{ User : "clasifica"

    User ||--o{ Sale : "crea / atiende"
    User ||--o{ Sale : "vendedor salon"
    User ||--o{ Sale : "cajero mostrador"
    User ||--o{ CashShift : "abre / cierra turno"

    Customer ||--o{ Sale : "compras e-commerce"

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

    Profile {
        string id PK "UUID"
        string name UK "Nombre del perfil"
        string description
        int level "Jerarquia: 100 Admin, 50 Encargado, 10 Cajero"
        boolean isSystem "Protegido"
        string parentProfileId FK "Herencia reflexiva"
        datetime createdAt
        datetime updatedAt
    }

    Permission {
        string id PK "UUID"
        string code UK "Codigo atomico (pos.vender, inventario.costos)"
        string module "Modulo funcional"
        string description
    }

    ProfilePermission {
        string profileId PK,FK
        string permissionId PK,FK
    }

    Customer {
        string id PK "UUID (Aislado de empleados)"
        string email UK
        string password "Hash bcryptjs"
        string name
        string phone
        string dni
        string defaultAddress
        string defaultCity
        string defaultPostalCode
        datetime createdAt
        datetime updatedAt
    }

    User {
        string id PK
        string username UK "Identificador agil"
        string email UK
        string name
        string password "Hash bcryptjs"
        enum role "ADMIN | CAJERO (legacy)"
        string profileId FK "Perfil dinamico"
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
        decimal costPrice "Restringido (inventario.costos)"
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
        int minStoreStock "Alerta salon"
        int minStock "Alerta proveedor"
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
        string customerEmail
        string customerPhone
        string customerDni
        string shippingMethod
        decimal shippingCost
        string shippingAddress
        string shippingCity
        string shippingPostalCode
        string customerId FK "Web Customer (null si invitado)"
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
