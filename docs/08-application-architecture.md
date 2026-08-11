# 08. Arquitectura de la aplicación

## Caso de uso de mantenimiento

Commands coordinan puertos de base, criptografía, archivo y mantenimiento. Gateways concentran
Dexie/Web APIs. La ruta `/settings` solo valida search params y monta UI; no exporta ni restaura. El
diagnóstico existente se reutiliza antes y después de la importación.

## Consulta diaria

`DailyReportingQueries` expresa una capacidad, no un repositorio CRUD. El adaptador Dexie agrupa
conjuntos diarios; `useDailyOperationalSummary` aporta reactividad de lectura. Aplicación/modelo no
dependen de React o Dexie.

## Comandos y consultas de inventario

Los comandos públicos son `initializeProductStock`, `registerStockEntry`,
`reconcileProductStock` y `registerStockLoss`. Delegan una intención discriminada a
`InventoryUnitOfWork`, frontera diseñada alrededor de la consistencia atómica y no de CRUD.
`InventoryQueries` expone búsqueda, producto, resumen, movimiento individual e historiales.

El dominio no conoce Dexie; infraestructura coordina la transacción y React consume consultas
reactivas. El catálogo no es dependencia interna de inventario: ambos comparten únicamente los
registros de infraestructura local según sus responsabilidades de propiedad.

## Comandos y consultas del catálogo

Comandos: `createCategory`, `updateCategory`, `setCategoryActiveState`,
`createProduct`, `updateProduct` y `setProductActiveState`. Consultas:
`getCategoryById`, `listCategories`, `getProductById` y `searchProducts`.
`CatalogStore` expresa estas capacidades concretas; `CatalogQueries` separa lecturas.
El adaptador Dexie ejecuta invariantes sensibles a concurrencia dentro de transacciones.

## Infraestructura local implementada en Fase 1

`shared/infrastructure/local-db` contiene registros de persistencia, versiones Dexie, bootstrap,
errores, StorageManager y diagnóstico. `app/providers/local-database-provider.tsx` es el
composition root cliente. Las rutas solo importan APIs públicas de módulos; `/settings` no conoce
la instancia ni las tablas. La separación pragmática comandos/consultas se aplicará al comenzar
casos de uso comerciales en Fase 2.

## 1. Nombre formal de la arquitectura

> **Bodegix POS** utiliza una arquitectura **local-first** y **offline-first** basada en un **monolito modular** organizado mediante **vertical slices** (funcionalidades verticales). Los módulos críticos aplican **puertos y adaptadores de forma selectiva** para mantener el dominio independiente de React, Dexie y futuras APIs. Las escrituras se implementan mediante **casos de uso transaccionales** y las lecturas mediante **consultas especializadas**.

Nombre resumido:

```text
Local-first modular monolith
with vertical slices and lightweight ports & adapters
+ command/query separation
```

En español:

```text
Monolito modular local-first
+ vertical slices
+ arquitectura hexagonal ligera
+ separación de comandos y consultas
```

## 2. Objetivos

- **Offline-first real**: todas las operaciones críticas funcionan permanentemente sin red; la aplicación es una instalación local por bodega.
- **Mantenibilidad**: límites funcionales claros entre módulos; un cambio en ventas no rompe inventario sin pasar por contratos públicos.
- **Testeabilidad**: reglas de negocio en dominio puro, sin dependencias de UI, IndexedDB o React.
- **Evolucionabilidad**: la misma estructura permite agregar respaldo en nube, sincronización, multiusuario y microservicios OPcionales EN EL FUTURO, sin reescribir el MVP hoy.
- **Rendimiento**: transacciones locales Dexie, consultas optimizadas, sin capas de indirección innecesarias.
- **Seguridad de datos**: escrituras críticas transaccionales, anulaciones sin borrado, ledger de movimientos.

## 3. Principios (reglas arquitectónicas no negociables)

| # | Principio | Detalle |
|---|---|---|
| P1 | **Dominio independiente** | El dominio no importa React, TanStack, Dexie, IndexedDB, APIs del navegador. |
| P2 | **Fronteras por funcionalidad** | La estructura principal es por módulos de negocio, no por capas globales. |
| P3 | **Carpeta por código real** | No se crea `domain/`, `application/`, `infrastructure/`, `ui/` si están vacías. No hay simetría artificial. |
| P4 | **Puertos selectivos** | Solo se abstrae una dependencia si existe una frontera técnica o de negocio concreta. No hay repositorios CRUD genéricos. |
| P5 | **Casos de uso para escrituras** | Toda modificación multi-tabla o multi-entidad pasa por un caso de uso transaccional. La UI NUNCA coordina. |
| P6 | **Consultas para lecturas** | Query services optimizados, no hay obligación de pasar por el mismo camino de escritura. |
| P7 | **Una transacción por caso de uso crítico** | `completeSale`, `voidSale`, `restoreBackup`, `openCashSession`, `closeCashSession` son atómicas. |
| P8 | **API pública por módulo** | Cada módulo exporta solo lo necesario por `index.ts`. Imports internos arbitrarios son inválidos. |
| P9 | **Shared kernel pequeño** | Entra a `shared/kernel` solo lo que usan realmente MÚLTIPLES módulos y es estable. |
| P10 | **DDD táctico pragmático** | Se usan entidades, VO, invariantes y agregados SI aportan valor. Nada de factories ceremoniales, specification genérico, bounded contexts artificiales. |
| P11 | **Sin event sourcing / sin sagas / sin domain events sin consumidor** | Inventario es `stock actual + movimientos` híbrido, pero no event sourcing. |
| P12 | **No anticipar campos de sincronización** | `tenantId`, `branchId`, `userId`, `deviceId`, `syncStatus`, `serverVersion`, `deletedAt` no existen en MVP. |

## 4. Estructura de carpetas

```text
src/
├── app/
│   ├── bootstrap/        # initDb(), runMigrations(), runIntegrityCheck(), providers
│   ├── layout/           # Sidebar, Topbar, App shell
│   ├── providers/        # <ThemeProvider/>, <PwaProvider/>, <ToastProvider/>, <ErrorBoundary/>
│   └── pwa/              # Service worker registration, update prompt, manifest
│
├── routes/               # Coordinan UI + datos, NO TIENEN REGLAS DE NEGOCIO
│   ├── __root.tsx
│   ├── index.tsx
│   ├── sale.tsx
│   ├── products.tsx
│   ├── inventory.tsx
│   ├── cash.tsx
│   ├── summary.tsx
│   └── settings.tsx
│
├── modules/              # ← Unidades de negocio reales
│   ├── catalog/
│   ├── inventory/
│   ├── sales/            # ← Pagos viven AQUÍ (no módulo propio)
│   ├── cash/
│   ├── reporting/        # ← Sin dominio artificial, solo proyecciones
│   ├── backup/
│   └── settings/
│
├── shared/
│   ├── kernel/           # money, ids, dates, result, errors
│   ├── infrastructure/   # db (BodegixPosDatabase), storage, files
│   └── ui/               # Componentes genéricos (no shadcn)
│
└── test/
    ├── builders/         # Test Data Builders
    ├── fixtures/         # Bases Dexie por versión
    └── setup/            # Vitest, fake-indexeddb, Playwright
```

### Estructura de un módulo (cuando aplican las carpetas)

```text
modules/sales/
├── domain/                  ← Solo TS puro, 0 dependencias externas
│   ├── sale.ts              ← entidad raíz agregado
│   ├── sale-item.ts         ← entidad hija
│   ├── sale-payment.ts      ← entidad hija (pagos son parte de sales en MVP)
│   └── sale-errors.ts       ← SaleAlreadyVoided, SaleTotalMismatch, InsufficientStock…
├── application/
│   ├── complete-sale.ts     ← caso de uso (escritura) + UoW
│   ├── void-sale.ts         ← caso de uso (escritura) + UoW
│   ├── search-sales.ts      ← query service (lectura)
│   └── get-sale-detail.ts   ← query service (lectura)
├── infrastructure/
│   ├── dexie-sales-queries.ts
│   └── dexie-complete-sale-uow.ts   ← Implementa CompleteSaleUnitOfWork si el puerto existe
├── ui/                      ← Componentes, hooks, forms específicos de sales
│   ├── sale-form.tsx
│   ├── use-pending-cart.ts
│   └── sale-totalizer.tsx
└── index.ts                 ← API PÚBLICA DEL MÓDULO
```

### Estructura de reporting (sin dominio artificial)

```text
modules/reporting/
├── application/
│   ├── get-daily-summary.ts
│   ├── get-top-products.ts
│   └── get-low-stock-summary.ts
├── infrastructure/
│   └── dexie-report-queries.ts
├── ui/
│   └── daily-summary-card.tsx
└── index.ts
```

### Estructura de shared/kernel

```text
shared/kernel/
├── money.ts        # Cents, formatMoney, parseMoney, calculateChange, assertPositiveCents
├── ids.ts          # newId(), assertValidUuid()
├── dates.ts        # startOfDayLima, endOfDayLima, epochMs → Localized string
├── result.ts       # Result<T, E> o lanzar errores con DomainError
└── errors.ts       # DomainError, códigos: PRODUCT_NOT_FOUND, INSUFFICIENT_STOCK…
```

## 5. Reglas de dependencia (DIRECCIÓN)

```text
                  ┌─────────────────────────────────────────┐
                  │          ROUTES / APP SHELL            │ React + TanStack Router
                  └───────────────┬─────────────────────────┘
                                  │ Usa
                                  ▼
                  ┌─────────────────────────────────────────┐
                  │          MODULES UI (React)             │ Componentes específicos
                  └───────────────┬─────────────────────────┘
                                  │ Llama
                                  ▼
                  ┌─────────────────────────────────────────┐
                  │       MODULES APPLICATION               │ use cases / queries
                  └──┬───────────────────────────┬──────────┘
                     │ Depende de                │ Implementado por
                     ▼                           ▼
         ┌─────────────────────┐   ┌───────────────────────────────┐
         │  MODULES DOMAIN     │   │  MODULES INFRASTRUCTURE       │
         │  (PURO TS)          │   │  (Dexie adapters)             │
         └─────────────────────┘   └──────────────┬────────────────┘
                                                  │ Usa
                                                  ▼
                                     ┌───────────────────────────────┐
                                     │  SHARED / INFRASTRUCTURE / DB │
                                     │  BodegixPosDatabase (Dexie)   │
                                     └───────────────────────────────┘
```

**Reglas inviolables:**
1. `domain` → NUNCA importa nada de `ui`, `routes`, `infrastructure`, ni `shared/infrastructure`.
2. `routes` y `app/layout` → importan `modules/*/ui` y la API pública (`modules/*/index.ts`). NO importan `db`.
3. `modules/X/application` → puede importar `modules/X/domain` y `shared/kernel`. Opcionalmente implementa puertos que dependen de interfaces definidas en `domain`. NO importa React.
4. `modules/X/infrastructure` → implementa detalles Dexie. Puede importar `db` singleton y `shared/infrastructure/*`.
5. `modules/X/ui` → importa `modules/X/application` (solo API pública) y `shared/ui`, shadcn, React. NO manipula tablas.
6. `modules/Y/*` → solo puede importar `modules/X/index.ts`, NUNCA `modules/X/domain/internal.ts` ni `modules/X/infrastructure/db.ts`.
7. `shared/kernel` → no importa NADA de módulos.

## 6. Vertical slices

Cada módulo es un **vertical slice** completo: tiene toda la capacidad vertical para resolver su problema (dominio → aplicación → infraestructura → UI).

Ventajas:
- Cambiar "cómo se cobra una venta" toca casi todos los archivos DENTRO de `modules/sales/`, y nada de catalog o cash.
- Agregar un nuevo caso de uso = agregar 1 archivo en `application`, opcionalmente 1 adaptador, 1 UI.
- Los módulos crecen de forma independiente sin contaminarse.

Contra-regla: no crear slices artificiales. Si `backup` no tiene `domain` porque no hay invariantes complejas, no se crea la carpeta `domain`.

## 7. Puertos y adaptadores selectivos

### ¿Cuándo SÍ crear un puerto?

- Hay una frontera de negocio REAL que no queremos atar a Dexie.
- Existen al menos 2 implementaciones plausibles a corto/medio plazo (ej: Dexie vs API REST futura).
- El puerto representa una **CAPACIDAD** de negocio, no operaciones CRUD.

### ¿Cuándo NO crear un puerto?

- Si solo habrá UNA implementación (el adaptador Dexie) y el contrato es idéntico a `db.xxx`.
- Si el puerto es `IRepository<T>` genérico.
- Si no hay test que se beneficie de sustituir la implementación.

### Ejemplos de puertos válidos

```typescript
// modules/catalog/domain/product-catalog.port.ts
// Interfaz de CAPACIDAD, no de "repositorio"
interface ProductCatalog {
  findActiveByIds(ids: readonly string[]): Promise<Product[]>;
  searchActive(query: string): Promise<Product[]>;
}

// modules/sales/domain/complete-sale-uow.port.ts
interface CompleteSaleUnitOfWork {
  execute(command: CompleteSaleCommand): Promise<CompletedSale>;
}
```

### Ejemplos de cosas que NO son puertos en MVP

- `ProductRepository` con `create, update, getById, delete, listAll` → mismo shape que Dexie, no hay valor.
- `CashSessionRepository` → mismo problema.
- `ProductMapper`, `ProductPersistenceModel`, `ProductDTO` → si el shape coincide con la entidad, es duplicación.

## 8. Separación de comandos y consultas (CQRS ligero)

No implica 2 bases de datos ni buses. Solo separa ENTRADA.

| Dimensión | Comandos (escritura) | Consultas (lectura) |
|---|---|---|
| Propósito | Cambiar estado | Mostrar estado |
| Entry point | `createProduct`, `completeSale`, `openCashSession` | `searchProducts`, `getDailySummary`, `listTodaySales` |
| Consistencia | Estricta, transaccional | Inmediata o ligeramente relajada |
| Lugar típico | `modules/*/application/*.use-case.ts` | `modules/*/application/*.query.ts` o `modules/*/infrastructure/dexie-*-queries.ts` |
| Requiere dominio? | Sí | Opcional, puede omitir y mapear a DTO de lectura |
| Test | Prueba invariantes y transacciones | Prueba contratos y rendimiento |
| Permite multi-módulo? | Sí, pero 1 transacción + 1 caso de uso controlado | Sí, simple joins Dexie |

**Niveles de complejidad NO usados en MVP:** buses, proyecciones asíncronas, mensajería, 2 bases de datos, eventos de integración.

## 9. Comunicación entre módulos

### Método permitido: API pública + caso de uso

```typescript
// ✅ Correcto
import { requireOpenCashSession } from "@/modules/cash";
import { completeSale } from "@/modules/sales";
```

```typescript
// ❌ Prohibido
import { db } from "@/modules/inventory/infrastructure/private-db";
import { calc } from "@/modules/sales/domain/internal-helper";
```

### Casos multi-módulo (ej: completeSale toca cash, catalog, inventory, appSettings)

**Solución**: un solo **caso de uso orquestador** (en `sales/application/complete-sale.ts`) que coordina DENTRO de UNA transacción Dexie. No se lanza un evento, no hay saga, no hay callbacks. La unidad de trabajo es la transacción.

Esto no es una "dependencia circular de módulos"; es una frontera aceptable por ser una **unidad de trabajo orquestadora**. En el futuro, la misma unidad de trabajo se implementaría vía API REST sin tocar los consumers.

## 10. Transacciones

Cada operación de escritura crítica ejecuta EXACTAMENTE 1 `db.transaction("rw", ...)` Dexie.

Lista de operaciones con ámbito transaccional:

| Operación | Tablas involucradas | Lugar correcto |
|---|---|---|
| `createProduct` | `products` | catalog/application |
| `registerInitialStock` | `products` + `inventoryMovements` | inventory/application |
| `openCashSession` | `cashSessions` (+ garantiza única abierta) | cash/application |
| `registerCashDeposit/Withdrawal` | `cashMovements` | cash/application |
| `closeCashSession` | `cashSessions` (calcula expected) | cash/application |
| `completeSale` | `cashSessions` + `products` + `sales` + `saleItems` + `salePayments` + `inventoryMovements` + `appSettings` | **sales/application/complete-sale.ts** |
| `voidSale` | `sales` + `salePayments` + `products` + `inventoryMovements` | sales/application/void-sale.ts |
| `restoreBackup` | TODAS | backup/application |

**Regla de UI**: React invoca `await completeSale(command)` y espera resultado. NUNCA ve las 13 tablas.

## 11. API pública por módulo

Cada módulo tiene un `index.ts` que es su fachada.

### `modules/sales/index.ts`

```typescript
// Casos de uso (comandos)
export { completeSale } from "./application/complete-sale";
export { voidSale } from "./application/void-sale";

// Consultas
export { listTodaySales } from "./application/list-today-sales";
export { getSaleDetail } from "./application/get-sale-detail";

// Tipos públicos del contrato (no DTOs, no mappers artificiales)
export type { Sale, SaleStatus } from "./domain/sale";
export type { SaleItem } from "./domain/sale-item";
export type { SalePayment, PaymentMethod, PaymentStatus } from "./domain/sale-payment";

// Errores tipados de dominio para catch
export { SaleError, SALE_ERROR_CODES } from "./domain/sale-errors";
```

### Control práctico

Con TypeScript se puede reforzar via `no-restricted-imports` o herramienta equivalente. Mínimo debe existir una **prueba arquitectónica** que valide:

- Ningún módulo importa archivos de `modules/otro/**` excepto `/index.ts`.
- Ningún archivo de `modules/*/domain/**` importa `dexie`, `react`, `@tanstack/*`.

## 12. Errores

### Pirámide de errores

```text
 UI / Routes (mostrar toast, redirect)
    ▲
 Application (recibe, opcionalmente envuelve)
    ▲
 Domain (lanza errores TIPADOS con códigos)
```

### Estrategia

- Dominio lanza subclases de `DomainError` con códigos estándar:
  - `PRODUCT_NOT_FOUND`
  - `PRODUCT_INACTIVE`
  - `INSUFFICIENT_STOCK`
  - `SALE_ALREADY_VOIDED`
  - `PAYMENT_TOTAL_MISMATCH`
  - `NO_OPEN_CASH_SESSION`
  - `DUPLICATE_CATEGORY_NORMALIZED_NAME`
  - `DATABASE_CORRUPTED`
  - `SCHEMA_VERSION_MISMATCH`
  - `BACKUP_CHECKSUM_MISMATCH`

- `shared/kernel/result.ts` es OPCIONAL si el equipo prefiere errores explícitos; por defecto usar lanzar + catch con discriminación por `code`.

- UI captura por código y muestra mensaje en español al usuario.

## 13. Pruebas (relacionadas con arquitectura)

Ver detalle en [14-testing-strategy.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/14-testing-strategy.md).

Arquitectónicamente se requieren:
1. **Pruebas de dominio**: Vitest, sin fake-indexeddb, sin React.
2. **Pruebas de casos de uso**: con fake-indexeddb, validar transacciones.
3. **Pruebas de migraciones Dexie**: upgrade fixtura vN → vN+1 → correr integridad.
4. **Pruebas arquitectónicas**:
   - Dominio no importa React.
   - Dominio no importa Dexie.
   - Módulo X no importa archivos privados de módulo Y (solo `/index`).
   - Ningún `routes/*.tsx` ni `modules/*/ui/**` llama directamente a `db.sales.add / .bulkPut / .transaction`.
5. **Playwright**: flujos offline + operaciones críticas + backup/restore.

## 14. Evolución futura preparada

### a) Respaldo en nube (próxima fase)

```text
PWA → module/backup/application/sendBackupToCloud.port
        → DexieBackupCloudAdapter (nuevo)
        → API (nuevo)
        → almacenamiento remoto
```

Dominio de backup no cambia. Solo añades adaptador.

### b) Sincronización

```text
PWA → Dexie → outbox local (nueva tabla infraestructura)
             → sync adapter (nuevo)
             → API → PostgreSQL (backend nuevo)
```

Dominio no necesita `tenantId` HOY. Cuando exista backend real, se añaden. Las entidades ya usan UUID global, lo que minimiza fricción.

### c) Backend modular (cuando exista)

El backend también empieza como **monolito modular**, no microservicios. Mapea los mismos módulos: `catalog`, `inventory`, `sales`, `cash`, `reporting`, `backup`, `settings`. Mismos casos de uso. Mismos puertos. Diferentes adaptadores (PostgreSQL + auth).

### d) Pagos automáticos

Cuando Yape/Plin/POS expongan APIs y credenciales, `sales/payments` se extrae en un módulo `payments` con:
- Puerto: `ExternalPaymentGateway`
- Adaptadores: `YapeQrAdapter`, `PlinQrAdapter`, `PosIntegratedAdapter`
- Webhooks handler + conciliación.

Hoy no hay frontera de negocio. No se extrae.

## 15. Decisiones que se deben evitar (Anti-patrones prohibidos)

1. **Capa por carpetas globales**: `src/domain`, `src/application`, `src/infrastructure`, `src/components` vacías o repartidas por módulo.
2. **Repositorio genérico**: `IRepository<T>` / `BaseRepository<T>`.
3. **Interfaz + 1 implementación simétrica**: `ProductRepositoryPort + ProductRepositoryDexieAdapter` si el puerto refleja exactamente `db.products.*`.
4. **Mapper sin necesidad**: `ProductMapper`, `ProductDTO`, `ProductPersistenceModel` si shape = entidad.
5. **Reglas de negocio en Route / componente React**.
6. **Multi-tabla desde UI**: componente que llama `db.sales.add`, `db.saleItems.bulkPut`, `db.products.update` por separado.
7. **Shared como cajón de sastre**: meter un `helpers.ts` gigante o componentes específicos de sales.
8. **Bounded contexts artificiales**: separar `SalesContext` vs `PaymentsContext` sin razón cuando los pagos no tienen reglas propias.
9. **Anticipar campos**: `tenantId`, `syncStatus`, `serverVersion`, `deletedAt` sin backend.
10. **Eventos sin consumidores**: `SaleCompletedEvent` sin nadie más que el productor que lo emite.
11. **CQRS pesado**: crear un CommandBus/QueryBus distribuido, 2 bases de datos, proyecciones cron.
12. **Microservicios prematuramente** (o para MVP).
13. **Todo es un agregado**: tratar `InventoryMovement` o `SalePayment` como agregados propios con repositorios.

## Slice cash implementado

Los comandos delegan en `CashUnitOfWork`; las consultas paginadas y resúmenes dependen de
`CashQueries`. No existe repositorio genérico. La infraestructura traduce Dexie y el módulo expone
una API pública única desde `src/modules/cash/index.ts`.

## Aplicación de ventas en Fase 6

`SaleHistoryQueries` encapsula count, búsqueda, detalle, elegibilidad y resultado. `voidSale` es el
único comando autorizado y delega en `VoidSaleUnitOfWork`. Dominio/aplicación no importan React ni
Dexie; rutas no importan infraestructura y componentes no escriben tablas.
