# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## Fase 7 — 2026-08-08

- Añadido resumen operativo diario reactivo en `/summary`.
- Añadido módulo `reporting` read-only y checklist no persistido.
- Añadido esquema Dexie v7 con índices de anulaciones por fecha.
- Añadido `temporal-polyfill@1.0.1` para periodos civiles con zonas IANA.

## [0.6.0] - 2025-01-XX

### ✨ Añadido

**Historial de ventas:**
- Página `/sales` con lista paginada de ventas (20 por página)
- Búsqueda por texto (número de venta, producto, referencia de pago)
- Filtro por estado (Todas, Completadas, Anuladas)
- Filtro por método de pago (Todos, Efectivo, Yape, Plin, Tarjeta, Transferencia)
- Badge con total de ventas encontradas
- Estado vacío con mensaje amigable
- Persistencia de filtros en URL
- Navegación entre páginas (Anterior/Siguiente)

**Detalle de ventas:**
- `SaleDetailSheet` con información completa de venta
- Lista de productos vendidos con cantidades y precios
- Lista de pagos con métodos y referencias
- Totales (subtotal y total general)
- Indicador visual de estado (Completada/Anulada)
- Motivo de anulación visible si aplica
- Sheet responsive (680px max width en desktop)

**Anulación de ventas:**
- `VoidSaleForm` con Dialog (desktop) y Drawer (móvil)
- Validación estricta: solo ventas de sesión actual abierta
- Motivo obligatorio (5-240 caracteres)
- Contador de caracteres con límites visuales
- Advertencias claras sobre consecuencias
- Transacción ACID en 4 tablas
- Devolución automática de stock al inventario
- Marcado de pagos como anulados
- Registro de retiro compensatorio en caja (pagos efectivo)

**Schema v5:**
- `SaleRecord.voidedAt`: timestamp de anulación
- `SaleRecord.voidReason`: motivo de anulación (5-240 chars)
- `SalePaymentRecord.voidedAt`: timestamp de anulación del pago
- `SalePaymentRecord.voidOperationReference`: referencia a operación de devolución
- `SalePaymentRecord.status`: ahora incluye `'voided'`
- Migración automática v4→v5 (sin transformación de datos)

**Dominio:**
- `sale-void-rules.ts`: reglas de elegibilidad para anular
- `sale-void-eligibility.ts`: DTO de elegibilidad
- 6 nuevos códigos de error para anulación
  - `SALE_ALREADY_VOIDED`
  - `CANNOT_VOID_AFTER_SESSION_CLOSE`
  - `CANNOT_VOID_DIFFERENT_SESSION`
  - `VOID_REASON_TOO_SHORT`
  - `VOID_REASON_TOO_LONG`
  - `NO_OPEN_SESSION_FOR_VOID`

**Aplicación:**
- `VoidSaleUnitOfWork` puerto para transacción de anulación
- `SaleHistoryQueries` puerto para consultas de historial
- `voidSale()` comando de anulación
- `getSaleHistory()` query con filtros y paginación
- `getSaleDetail()` query de detalle completo
- `getSaleVoidEligibility()` query de elegibilidad

**Infraestructura:**
- `DexieVoidSaleUnitOfWork` con transacción ACID completa
- `DexieSaleHistoryQueries` con búsqueda y filtrado eficiente
- Operaciones de inventario tipo `void_sale_return`
- Operaciones de caja tipo `withdrawal_void_sale`

**UI:**
- `SalesHistoryPage` con AppShell y PageHeader
- `SaleDetailSheet` responsive con scroll interno
- `VoidSaleForm` con ResponsiveDialogDrawer
- `ResponsiveDialogDrawer` reutilizable (Dialog desktop, Drawer móvil)
- Hooks: `use-sale-history`, `use-sale-detail`, `use-sale-void-eligibility`, `use-void-sale-action`
- Link "Ventas" en navegación principal

**Tests:**
- 13 pruebas E2E de historial de ventas (`e2e/sales-history.spec.ts`)
- Tests de renderizado, filtros, búsqueda, paginación
- Tests de apertura/cierre de Sheet
- Tests de accesibilidad por teclado (Tab, Enter, Escape)
- Tests de persistencia de filtros

**Documentación:**
- `docs/database-schema-v5.md` con esquema completo
- `docs/PHASE-6-SUMMARY.md` con resumen ejecutivo
- Actualizado `README.md` con estado de Fase 6
- Actualizado `docs/modules/sales.md` con nuevas capacidades

### 🔧 Cambiado

- `SaleRecord.status` ahora incluye `'voided'` además de `'draft'` y `'completed'`
- `SalePaymentRecord.status` ahora incluye `'voided'` además de `'pending'` y `'completed'`
- Esquema de base de datos actualizado a v5
- Navegación principal reordenada: Venta, Ventas, Productos, Inventario, Caja, Resumen

### 📝 Documentación

- Creado `CHANGELOG.md` para tracking de versiones
- Agregada documentación completa de Fase 6
- Actualizada arquitectura del módulo de ventas
- Documentadas reglas de anulación y transacciones ACID

---

## [0.5.0] - 2025-01-XX

### ✨ Añadido

**Sistema de ventas completo:**
- Carrito persistido con `saleDrafts` table
- Búsqueda de productos por nombre, código de barras y categoría
- Gestión de cantidades con validación de stock en tiempo real
- Revisión automática de cambios de precio desde el catálogo
- Checkout con pagos mixtos (efectivo, Yape, Plin, tarjeta, transferencia bancaria)
- Transacción atómica `completeSale` en 8 tablas
- Resultado de venta con snapshots de productos
- Correlativo automático de ventas (V-000001, V-000002...)
- Validación de sesión de caja abierta
- Interfaz responsive (desktop panel dividido, móvil sheet)

**Schema v4:**
- `saleDrafts` table para persistencia de carrito
- `sales` table con correlativos únicos
- `saleItems` table con snapshots de productos
- `salePayments` table con múltiples métodos
- Índices compuestos para eficiencia

**Tests:**
- 15+ pruebas E2E de flujo completo de venta
- Tests de carrito, checkout y pagos mixtos
- Tests de validación y errores
- Tests responsive desktop y móvil

**Documentación:**
- `docs/database-schema-v4.md`
- `docs/PHASE-5-SUMMARY.md`
- `docs/database/sale-draft.md`
- ADR 0017: Sale Draft Persistence

---

## [0.4.0] - 2025-01-XX

### ✨ Añadido

**Sistema de caja completo:**
- Apertura única de sesión con efectivo inicial
- Depósitos y retiros con motivo obligatorio
- Arqueo con diferencias positivas/negativas
- Cierre con snapshot inmutable
- Validación de sesión única abierta
- Concurrencia entre pestañas con BroadcastChannel

**Schema v3:**
- `cashSessions` table con snapshot en cierre
- `cashOperations` table con ledger inmutable
- Índices para consultas eficientes

---

## [0.3.0] - 2024-12-XX

### ✨ Añadido

**Sistema de inventario:**
- Modelo híbrido: saldo materializado + ledger inmutable
- Operaciones manuales (entrada, salida, ajuste)
- Historial global y por producto
- Diagnóstico de integridad

**Schema v2:**
- `inventory` table con saldo actual
- `inventoryOperations` table con ledger

---

## [0.2.0] - 2024-12-XX

### ✨ Añadido

**Catálogo de productos:**
- CRUD completo de productos y categorías
- Búsqueda y filtros en tiempo real
- Desactivación lógica (soft delete)
- Validaciones de negocio

**Schema v1:**
- `products` table
- `categories` table

---

## [0.1.0] - 2024-12-XX

### ✨ Añadido

**Infraestructura base:**
- TanStack Start configurado en modo SPA
- Layout responsive con sidebar y nav móvil
- 7 rutas tipadas con navegación funcional
- Dexie 4.4.4 + IndexedDB
- Shared kernel con utilidades (dinero, IDs, fechas, texto)
- Suite de tests (Vitest + Playwright)
- CI/CD con GitHub Actions
- ESLint + Biome con reglas arquitectónicas

**Schema base:**
- `appSettings` table
- Bootstrap idempotente
- Migraciones versionadas

---

[Unreleased]: https://github.com/bodegix/bodegix-pos/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/bodegix/bodegix-pos/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/bodegix/bodegix-pos/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/bodegix/bodegix-pos/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/bodegix/bodegix-pos/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/bodegix/bodegix-pos/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/bodegix/bodegix-pos/releases/tag/v0.1.0
