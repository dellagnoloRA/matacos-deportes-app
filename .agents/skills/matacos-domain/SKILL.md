---
name: matacos-domain
description: Reglas de negocio, arquitectura híbrida Offline-First y dominio operativo para Matacos Deportes.
---

# Reglas de Dominio: Matacos Deportes (Saavedra 241, Formosa)

## 1. Identidad y Contexto Operativo
* Comercio deportivo de 25 años en Formosa Capital.
* Especialidades: Natación, Vóley, Crocs/Urbano, Gimnasio/Fitness y Calzado deportivo.
* Local físico con 2 terminales de cobro tipo Notebooks, lector de códigos de barra USB e impresoras térmicas de 80mm.

## 2. Arquitectura de Stock y POS
* **Modo Offline:** El mostrador debe poder cobrar en efectivo y emitir tickets sin conexión a internet.
* **IndexedDB / Dexie.js:** Almacena catálogo local y cola de transacciones offline.
* **Integridad Transaccional:** Sincronización atómica con PostgreSQL para evitar sobreventas simultáneas entre mostrador y tienda web.
* **Moneda:** Formato en Pesos Argentinos (ARS) `$ 45.000,00`.
* **Zona Horaria:** `America/Argentina/Buenos_Aires`.
