# Estructura de Carpetas del Proyecto
## Sistema Integral de Gestión, POS Offline y E-commerce — Matacos Deportes

```plaintext
matacos-deportes-app/
├── contexto/                         # Requerimientos funcionales (RF), actas de elicitación y decisiones de arquitectura
│   └── Planificación POS VENTA/      # Documentos de diseño y planificación de la terminal de mostrador
├── docs/                             # Manuales de usuario, guías de despliegue y documentación operativa
│   └── imagenes/                     # Capturas y diagramas utilizados en los manuales
├── init-scripts/                     # Scripts de inicialización para Docker y base de datos
├── prisma/                           # Definición del modelo relacional con Prisma ORM
│   └── migrations/                   # Historial de versiones y migraciones SQL en PostgreSQL
├── public/                           # Recursos estáticos de acceso público servidos por Next.js
│   └── uploads/                      # Archivos multimedia subidos al sistema
│       └── products/                 # Imágenes almacenadas de productos y variantes
├── scripts/                          # Scripts de utilidad, normalización de datos y tests de RF backend
├── src/                              # Código fuente principal de la aplicación
│   ├── app/                          # Enrutador de páginas y endpoints (Next.js 15 App Router)
│   │   ├── admin/                    # Módulo administrativo (gestión de stock, catálogo y precios)
│   │   ├── api/                      # Endpoints y Route Handlers HTTP
│   │   │   ├── pos/                  # Endpoints del Punto de Venta
│   │   │   │   ├── receipt/          # Generación y consulta de recibos de venta
│   │   │   │   ├── search/           # Búsqueda ágil de productos para el mostrador
│   │   │   │   └── tickets/          # Endpoints de consulta de tickets emitidos
│   │   │   ├── stock/                # Endpoints de control de inventario
│   │   │   │   └── alerts/           # Monitoreo y avisos de stock mínimo/crítico
│   │   │   └── upload/               # Endpoint para subida de imágenes
│   │   └── pos/                      # Vistas del frontend para Punto de Venta
│   │       └── tickets/              # Flujo de comprobantes de venta
│   │           └── [saleId]/print/   # Vista de renderizado e impresión térmica (80mm/58mm)
│   ├── components/                   # Componentes modulares y reutilizables de UI (React 19)
│   │   └── dashboard/                # Vistas del mostrador, modales operativos, tablas y KPIs
│   ├── config/                       # Constantes de negocio (datos fiscales, empresa, sucursal)
│   ├── lib/                          # Módulos transversales (Prisma client, Dexie.js IndexedDB, formateos)
│   ├── schemas/                      # Esquemas de validación Zod (fuente única de verdad para tipos)
│   ├── server/                       # Capa backend de lógica de negocio en servidor
│   │   ├── actions/                  # Next.js Server Actions con transacciones atómicas
│   │   └── services/                 # Servicios desacoplados de dominio (turnos de caja, recibos)
│   └── types/                        # Definición de tipos e interfaces TypeScript
├── .agents/                          # Skills y directivas de asistencia para agentes de IA
└── .vscode/                          # Configuración del entorno de trabajo en Visual Studio Code
```
