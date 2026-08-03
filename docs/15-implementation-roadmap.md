# 15. Hoja de ruta de implementación

## Principio de ejecución

1. **Vertical primero, luego horizontal**: no terminamos "todo el shared" primero, sino que hacemos end-to-end una capacidad pequeña en cada fase y la testeamos.
2. **Cada fase es entregable**: al terminar una fase, la app compila, los tests pasan y Playwright smoke suite pasa.
3. **Infraestructura de pruebas desde el inicio**: pruebas arquitectónicas + migraciones + builders se crean en Fase 0.
4. **Sin código muerto**: no agregamos archivos, interfaces, tipos o campos que no se usen en esa fase.

---

## Fase 0. Base técnica y arquitectura

**Objetivo**: poner los límites correctos antes de implementar una sola regla de negocio.

Tareas:
- [ ] Configuración base: strict TypeScript, paths `@/*`, biome lint/format, Vitest setup, Playwright setup
- [ ] Estructura de carpetas (`app/`, `routes/`, `modules/`, `shared/`, `test/`)
- [ ] **Límites y reglas de importación** (ESLint `no-restricted-imports` o regla equivalente):
  - Dominio sin React/Dexie
  - Módulos solo via `index.ts`
  - Rutas sin `db`
- [ ] **Shared kernel**: `money.ts`, `ids.ts`, `dates.ts`, `result.ts`, `errors.ts` + tests
- [ ] **Pruebas arquitectónicas**: tests ARCH-01..06 (ESLint + Vitest AST)
- [ ] Shared infrastructure: `BodegixPosDatabase` (clase Dexie, versión 1 stores vacíos por ahora), `initDb()`, `runIntegrityCheck()` base
- [ ] TanStack Router + `__root.tsx` + 7 rutas placeholder (sin lógica)
- [ ] shadcn/ui instalado: tema claro/oscuro, componentes básicos (Button, Input, Dialog, Card, Table, Toast, Alert, Skeleton, Badge, DropdownMenu)
- [ ] **APIs públicas por módulo (index.ts vacíos)** — solo estructura, exports simbólicos iniciales

**Entrega**: proyecto compila, tests arquitectónicos pasan, smoke Playwright abre app en `/`.

**Duración estimada**: 2-3 días.

---

## Fase 1. Infraestructura local

**Objetivo**: Dexie + migraciones + diagnóstico + onboarding + settings.

Módulos afectados: `settings`, `backup` (solo diagnóstico/estructura), `shared/infrastructure/db`.

Tareas:
- [ ] Esquema Dexie v1 completo (todas las tablas de [07-database-dexie.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/07-database-dexie.md))
- [ ] `AppSettings` singleton `id="main"`, `installationId`, `nextSaleNumber`
- [ ] Pantalla inicial de **onboarding**:
  - Nombre de negocio, moneda PEN, timezone America/Lima
  - Creación de settings, configuración inicial
- [ ] Pantalla **Diagnóstico de integridad** (`runIntegrityCheck` versión 1)
- [ ] `StorageManager`: solicitar `persist()`, estimar `quota` / `usage`
- [ ] Fixtures de base v1, test de migraciones vacío
- [ ] Ruta `/settings` (solo estructura y secciones)
- [ ] Aplicar ADRs 0002, 0014 (Dexie como adaptador)

**Entrega**: onboarding funciona, integridad OK, storage persistente solicitado.

---

## Fase 2. Catálogo (productos y categorías)

**Módulo**: `catalog`

Tareas:
- [ ] Dominio: `Product`, `Category`, invariantes (`normalizedName`, `salePriceCents >=0`)
- [ ] Casos de uso: `createProduct`, `updateProduct`, `deactivateProduct`, `createCategory`, `renameCategory`
- [ ] Consultas: `searchProducts`, `getProductById`, `listActiveCategories`
- [ ] Pantallas `/products`: listado + búsqueda + crear/editar/desactivar producto + categorías
- [ ] Formularios con TanStack Form + Zod
- [ ] Tests: dominio (precios negativos), aplicación (CRUD + barcodes duplicados advertidos), componentes, E2E spec de productos

---

## Fase 3. Inventario

**Módulo**: `inventory` + frontera con `catalog`

Tareas:
- [ ] Dominio: `InventoryMovement` tipos `initial_stock`, `purchase`, `adjustment_in/out`, `damaged`, `expired`
- [ ] Casos de uso: `registerInitialStock`, `registerStockEntry`, `registerInventoryAdjustment`
- [ ] **1 transacción Dexie por operación** (actualiza `Product.stockQuantity` + inserta `InventoryMovement` con before/after)
- [ ] Consultas: `getProductMovementHistory`, `getLowStockProducts`
- [ ] Pantalla `/inventory`: stock bajo, historial movimientos, ajustes manuales
- [ ] Tests: transaccionalidad (si falla inserción movimiento, no cambia stock), integridad after/before
- [ ] Aplica ADR-0005, ADR-0015

---

## Fase 4. Caja

**Módulo**: `cash`

Tareas:
- [ ] Dominio: `CashSession` (abierta/cerrada), `CashMovement` depósito/retiro
- [ ] Casos de uso: `openCashSession(openingCash)`, `registerCashDeposit`, `registerCashWithdrawal`, `closeCashSession(countedCash)`
  - `closeCashSession`: calcula `expectedCash = opening + sales_cash_total + deposits - withdrawals - change`
  - `NO_OPEN_CASH_SESSION`, `CASH_SESSION_ALREADY_OPEN`, `CASH_SESSION_ALREADY_CLOSED`
- [ ] Consultas: `getOpenCashSession`, `getCashSessionSummary(id)`
- [ ] Pantalla `/cash`: apertura, movimientos, botón de cierre con conteo
- [ ] Tests: máximo 1 caja abierta, cierre calcula diferencia correcta
- [ ] E2E: full-cycle de caja

---

## Fase 5. Ventas y pagos (núcleo del MVP)

**Módulo**: `sales` (incluye pagos — ADR-0011)

Tareas:
- [ ] Dominio: `Sale`, `SaleItem` (snapshots!), `SalePayment` (5 métodos), errores
- [ ] Caso de uso estrella: `completeSale(command)`
  - 13 pasos atómicos (ver [07-database-dexie.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/07-database-dexie.md#unidades-de-trabajo--transacciones))
  - 1 sola `db.transaction`
- [ ] Caso de uso: `voidSale(saleId, reason)` (7 pasos, 1 transacción)
- [ ] Pagos mixtos UI: efectivo (con vuelto) + yape (confirmación manual) + ...
- [ ] Pantalla `/sale` punto de venta:
  - Búsqueda rápida de productos
  - Carrito con snapshots visuales
  - Panel pagos multi-método
  - Teclado numérico / táctil
  - Confirmar cobro → ticket de venta
- [ ] Consultas: `listTodaySales`, `getSaleDetail(id)`
- [ ] Historial de ventas básico

---

## Fase 6. Historial y anulaciones

**Módulo**: `sales` + `inventory` (frontera movimientos void)

Tareas:
- [ ] Vista de detalle de venta con estado (completed / voided)
- [ ] Acción "Anular venta" con motivo obligatorio
- [ ] Visualización de pagos voided y movimientos reversos `sale_void`
- [ ] Fixtures E2E: venta → anular → stock recuperado
- [ ] Tests: doble anulación rechazada

---

## Fase 7. Reporting y cierre diario

**Módulo**: `reporting` (sin dominio artificial)

Tareas:
- [ ] Proyecciones Dexie optimizadas:
  - `getDailySummary(date)`: ventas, total por método, tickets emitidos, productos vendidos
  - `getTopProducts(date, n=10)`
  - `getLowStockSummary`
- [ ] Pantalla `/summary` dashboard diario
- [ ] Archivos:
  ```text
  reporting/
  ├── application/get-daily-summary.ts
  ├── application/get-top-products.ts
  ├── application/get-low-stock-summary.ts
  └── infrastructure/dexie-report-queries.ts
  ```
- [ ] Performance: resumen diario calculado en < 100 ms con 1 mes de datos

---

## Fase 8. Respaldo y restauración

**Módulo**: `backup`

Tareas:
- [ ] Formato `bodegix-pos-backup` (JSON, schema v1, checksum sha-256, formato filename)
- [ ] Casos de uso:
  - `exportBackup()` → genera blob, checksum, download
  - `restoreBackup(file)` → valida schema, valida checksum, crea pre-backup, reemplaza contenido en 1 transacción, corre integridad
- [ ] Diagnóstico post-restauración
- [ ] Recordatorio de backup cada N días (settings)
- [ ] E2E spec de backup/restore completo
- [ ] Aplica ADR-0001, ADR-0014

---

## Fase 9. PWA

**Característica**: `app/pwa/`

Tareas:
- [ ] Service worker + manifest (iconos, display standalone, name Bodegix POS)
- [ ] Prompt de instalación PWA
- [ ] Actualizaciones de app: detectar nueva versión SW, notificar al usuario, NO recargar si hay venta en curso (estado en memoria)
- [ ] Modo full offline: app abre y trabaja sin red luego de 1ª carga
- [ ] Playwright `context.setOffline(true)` + E2E offline spec

---

## Fase 10. Endurecimiento

**Objetivo**: calidad y fiabilidad pre-piloto.

Tareas:
- [ ] Integridad check automático después de cada operación crítica (opcional, sólo ante flag de debugging)
- [ ] Todos los tests de migraciones para todas las versiones existentes
- [ ] Re-executar E2E full con 1k ventas de carga
- [ ] Manejo de errores UX: mensajes específicos por `code`, botón "exportar backup antes de continuar" ante errores fatales
- [ ] Accesibilidad: teclado completo, aria labels, contrastes claro/oscuro
- [ ] UX mobile-first: botones táctiles grandes, tablet 7" y celular 6"

---

## Fase 11. Piloto en bodega real

**Objetivo**: validar producto en terreno.

Tareas:
- [ ] Checklist de instalación (actualización Android, Chrome, espacio, modo kiosco opcional)
- [ ] Guía de operación del vendedor (1 página)
- [ ] Medir: ventas diarias, stock bajo, errores reportados, backup realizado
- [ ] Logs mínimos (consola + exportación manual de errores sin datos sensibles)
- [ ] Encuesta de satisfacción cierre de semana
- [ ] Corregir bugs y fijar comportamientos de la fase 10 con parches pequeños

---

## Posterior al MVP (fases futuras, NO incluidas en roadmap implementación)

- Respaldo en nube (mismo backup cifrado, endpoint simple)
- Sincronización + backend modular (monolito)
- Pagos automáticos y módulo `payments` independiente
- Facturación electrónica SUNAT
- Multiusuario / multisucursal / roles
- Lotes, vencimientos, números de serie
- Fiado / crédito
- Crédito, 2do Punto de venta

---

## Criterio de salida por fase

1. `pnpm build` OK
2. `pnpm check` (lint + format + tsc) OK
3. `pnpm test` + tests arquitectónicos + migraciones OK
4. `pnpm e2e:smoke` mínimo 5 specs estables
5. Revisión manual de 2 flujos representativos en Playwright inspector
6. Ningún TODO/FIXME sin ticket asociado en código de entrega
