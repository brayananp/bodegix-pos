# Esquema de base de datos v1

## Identidad

- Base: `bodegix-pos`
- Versión Dexie: `1`
- Dexie: `4.4.4`
- Fuente ejecutable: `src/shared/infrastructure/local-db/schema/schema-v1.ts`

Una versión publicada es inmutable. Los campos no indexados igualmente se persisten: Dexie solo
declara en `stores()` la clave primaria y los índices.

## Tablas, campos y propietario

| Tabla | Propietario | Campos persistidos |
|---|---|---|
| `categories` | catalog | `id`, `name`, `normalizedName`, `isActive`, `createdAt`, `updatedAt` |
| `products` | catalog | `id`, `barcode`, `name`, `normalizedName`, `categoryId`, `salePriceCents`, `costPriceCents`, `stockQuantity`, `minimumStockQuantity`, `isActive`, `createdAt`, `updatedAt` |
| `inventoryMovements` | inventory | `id`, `productId`, `type`, `quantityDelta`, `stockBefore`, `stockAfter`, `referenceType`, `referenceId`, `reason`, `createdAt` |
| `sales` | sales | `id`, `saleNumber`, `cashSessionId`, `subtotalCents`, `totalCents`, `status`, `createdAt`, `voidedAt`, `voidReason` |
| `saleItems` | sales | `id`, `saleId`, `productId`, `productName`, `unitPriceCents`, `unitCostCents`, `quantity`, `subtotalCents` |
| `salePayments` | sales | `id`, `saleId`, `method`, `amountCents`, `status`, `providerLabel`, `operationReference`, `cashReceivedCents`, `changeCents`, `verifiedAt`, `createdAt` |
| `cashSessions` | cash | `id`, `status`, `openingCashCents`, `expectedCashCents`, `countedCashCents`, `differenceCents`, `openedAt`, `closedAt` |
| `cashMovements` | cash | `id`, `cashSessionId`, `type`, `amountCents`, `reason`, `createdAt` |
| `appSettings` | settings | `id="main"`, `installationId`, `setupCompleted`, `businessName`, `currency="PEN"`, `timezone="America/Lima"`, `nextSaleNumber`, `backupReminderDays`, `lastBackupAt`, `createdAt`, `updatedAt` |

Ausencias persistidas usan `null`, no propiedades opcionales con `undefined`. Dinero se almacena
como enteros en céntimos y timestamps como epoch milliseconds positivos.

## Índices y consulta prevista

| Tabla | Declaración v1 | Propósito |
|---|---|---|
| `categories` | `id, &normalizedName, isActive, updatedAt` | unicidad de nombre normalizado; activas; cambios recientes |
| `products` | `id, barcode, normalizedName, categoryId, isActive, [isActive+normalizedName], updatedAt` | búsqueda por código/nombre/categoría; catálogo activo ordenable; cambios |
| `inventoryMovements` | `id, productId, type, referenceType, referenceId, createdAt, [productId+createdAt], [referenceType+referenceId]` | historial por producto/fecha y trazabilidad de referencia |
| `sales` | `id, &saleNumber, cashSessionId, status, createdAt, [status+createdAt], [cashSessionId+createdAt]` | correlativo único; ventas por estado, fecha o sesión |
| `saleItems` | `id, saleId, productId, [saleId+productId]` | detalle de venta y búsqueda por producto |
| `salePayments` | `id, saleId, method, status, createdAt, [saleId+status], [method+createdAt]` | pagos por venta/estado y resumen por método/fecha |
| `cashSessions` | `id, status, openedAt, closedAt` | sesión abierta e historial temporal |
| `cashMovements` | `id, cashSessionId, type, createdAt, [cashSessionId+createdAt]` | movimientos por sesión y fecha |
| `appSettings` | `id` | singleton `main` |

`barcode` no es único. `saleNumber` y `categories.normalizedName` sí. `cashSessions.status` no es
único porque deben coexistir varias sesiones cerradas. No se indexan importes monetarios.

## Relaciones lógicas

IndexedDB no ofrece foreign keys. La aplicación validará referencias al escribir y el diagnóstico
profundo detecta: ítems/pagos sin venta, movimientos de inventario sin producto, ventas sin sesión
de caja y movimientos de caja sin sesión. En Fase 1 no se reparan automáticamente.
