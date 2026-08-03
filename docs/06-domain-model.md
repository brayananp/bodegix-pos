# 06. Modelo de dominio

## Inventory (implementado en Fase 3)

`InventoryOperation` expresa stock inicial, entrada, conteo y pérdida. La función pura
`calculateInventoryTransition(currentStock, operation)` valida cantidades enteras, deriva tipo,
delta y saldos, e impide negativos. `InventoryError` aporta códigos estables.

La lectura no duplica `Product`: usa `InventoryProduct`, una proyección con identidad, nombre,
categoría, saldo/mínimo, estado de stock, actividad, existencia de movimientos y fecha del último.
`InventoryStockStatus` solo puede ser `in_stock`, `low_stock` u `out_of_stock`; actividad es otra
dimensión.

## Catalog

`Category` contiene identidad, nombre original/normalizado, estado y timestamps.
`Product` contiene identidad, nombre original/normalizado, código opcional, relación
opcional a categoría, precios enteros en céntimos, stock actual, stock mínimo, estado y
timestamps. `CatalogError` transporta un `CatalogErrorCode` estable para que aplicación
y UI colaboren sin acoplarse a mensajes.

## Módulos de dominio y agregados reales

El modelo se organiza por módulos funcionales, no por una sola capa global. No todas las tablas Dexie son agregados. Un agregado solo existe cuando hay un conjunto de entidades + invariantes que deben ser consistentes transaccionalmente.

| Módulo | Agregado | Raíz de agregado | Invariantes críticos |
|---|---|---|---|
| catalog | Product | `Product` | Nombre no vacío, precio ≥ 0, stock no se edita silenciosamente |
| catalog | Category | `Category` | Nombre único normalizado |
| sales | **Sale** (agregado principal MVP) | `Sale` | Carrito no vacío; pagos suman total; items con snapshots; estado `completed` → inmutable salvo anulación completa |
| sales | *(dentro de Sale)* | `SaleItem`, `SalePayment` | **Pertenecen a Sale; no se persisten sin él** |
| inventory | *(sin agregado separado)* | — | `Product.stockQuantity` es consistente con el último `InventoryMovement.stockAfter` |
| cash | **CashSession** | `CashSession` | Máximo una caja abierta; sesión cerrada inmutable |
| settings | AppSettings | `AppSettings` (singleton) | `id === "main"`; correlativo monotónico |

### No son agregados de dominio

- `InventoryMovement`: ledger de auditoría dependiente de `Product` / `Sale`. No tiene ciclo de vida propio como agregado.
- `CashMovement`: detalle dentro de `CashSession`, no una raíz.
- Entidades de reporting: NO EXISTEN. Reporting son proyecciones de lectura, no entidades de dominio.
- `SalePayment`: parte del agregado `Sale`, NO módulo independiente en MVP.

## Entidades por módulo

### Módulo catalog

```typescript
interface Product {
  id: string;                              // UUID v4
  barcode: string | null;
  name: string;
  normalizedName: string;                  // Búsqueda case/diacrítico-insensitive
  categoryId: string | null;

  salePriceCents: number;                  // Entero >= 0
  costPriceCents: number | null;           // Entero >= 0

  stockQuantity: number;                   // ** Punto de consistencia con inventory **
  minimumStockQuantity: number;            // >= 0

  isActive: boolean;                       // Borrado lógico

  createdAt: number;                       // epoch ms UTC
  updatedAt: number;
}
```

```typescript
interface Category {
  id: string;
  name: string;
  normalizedName: string;                  // Único
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### Módulo sales

```typescript
type SaleStatus = "completed" | "voided";

interface Sale {
  id: string;
  saleNumber: number;                      // Correlativo monotónico por instalación
  cashSessionId: string;                   // FK a CashSession

  subtotalCents: number;                   // sum(saleItems.subtotalCents)
  totalCents: number;                      // == subtotal en MVP sin descuentos/impuestos

  status: SaleStatus;

  createdAt: number;
  voidedAt: number | null;
  voidReason: string | null;
}
```

```typescript
interface SaleItem {
  id: string;
  saleId: string;                          // Pertenencia fuerte a Sale
  productId: string;

  // SNAPSHOTS INAMOVIBLES: no cambian aunque se edite Product
  productName: string;
  unitPriceCents: number;
  unitCostCents: number | null;

  quantity: number;                        // Entero > 0
  subtotalCents: number;                   // unitPriceCents * quantity
}
```

```typescript
type PaymentMethod =
  | "cash"
  | "yape"
  | "plin"
  | "card"
  | "bank_transfer";

type PaymentStatus =
  | "confirmed"            // Efectivo local
  | "manually_verified"    // Yape, Plin, tarjeta, transferencia (MVP)
  | "voided";              // Anulación

interface SalePayment {
  id: string;
  saleId: string;                          // Pertenencia fuerte a Sale

  method: PaymentMethod;
  amountCents: number;                     // > 0
  status: PaymentStatus;

  providerLabel: string | null;            // Ej. "BCP", "BBVA", "IBK"
  operationReference: string | null;       // Nro operación Yape/Plin/tarjeta

  // Solo cash
  cashReceivedCents: number | null;
  changeCents: number | null;

  verifiedAt: number;
  createdAt: number;
}
```

> **Regla**: `mixed` NO es un método persistido. Se deriva en lectura cuando una venta tiene 2+ pagos con estado `confirmed` o `manually_verified`.

### Módulo inventory

```typescript
type InventoryMovementType =
  | "initial_stock"
  | "purchase"             // Entrada mercadería
  | "sale"                 // Egreso por venta (-)
  | "sale_void"            // Reverso por anulación (+)
  | "adjustment_in"        // Ajuste positivo administrativo
  | "adjustment_out"       // Ajuste negativo administrativo
  | "damaged"              // Pérdida por daño
  | "expired";             // Pérdida por vencimiento

interface InventoryMovement {
  id: string;
  productId: string;

  type: InventoryMovementType;
  quantityDelta: number;                     // Negativo = egreso

  stockBefore: number;
  stockAfter: number;                        // stockBefore + quantityDelta

  referenceType: "sale" | "manual" | "setup";
  referenceId: string | null;                // saleId, transaccionManualId
  reason: string | null;                     // Obligatorio en ajustes/pérdidas

  createdAt: number;
}
```

> **Modelo híbrido** (NO event sourcing):
> - `Product.stockQuantity` = vista materializada actual
> - `InventoryMovement[]` = ledger de trazabilidad
> - Toda escritura debe actualizar AMBOS de forma atómica en 1 transacción.

### Módulo cash

```typescript
type CashSessionStatus = "open" | "closed";

interface CashSession {
  id: string;
  status: CashSessionStatus;

  openingCashCents: number;

  expectedCashCents: number | null;         // Calculado en cierre
  countedCashCents: number | null;          // Ingresado por usuario
  differenceCents: number | null;           // counted - expected

  openedAt: number;
  closedAt: number | null;
}
```

```typescript
type CashMovementType = "deposit" | "withdrawal";

interface CashMovement {
  id: string;
  cashSessionId: string;
  type: CashMovementType;
  amountCents: number;                      // > 0
  reason: string;                           // Obligatorio
  createdAt: number;
}
```

### Módulo settings

```typescript
interface AppSettings {
  id: "main";                               // Singleton por instalación

  businessName: string;
  currency: "PEN";
  timezone: "America/Lima";

  installationId: string;                   // UUID, creado ONCE en onboarding
  nextSaleNumber: number;                   // 1..n, monotónico (increment atómico)

  backupReminderDays: number;               // default 7
  lastBackupAt: number | null;

  yapeQrImage: Blob | null;                 // Imagen QR configurada
  plinQrImage: Blob | null;

  createdAt: number;
  updatedAt: number;
}
```

## Value objects útiles (DDD táctico pragmático)

Crear como value objects solo si aportan invariantes reales. No obligatorio para todo.

```
shared/kernel/money.ts
  - Cents (int positivo)
  - formatMoney / parseMoney / calculateChange

shared/kernel/ids.ts
  - assertValidUuid / newId

shared/kernel/result.ts
  - Result<T, DomainError>  (o lanzar errores tipados)
```

## Relaciones

```text
Category 1 ─── 0..* Product
Product  1 ─── 0..* InventoryMovement
CashSession 1 ─── 0..* Sale
CashSession 1 ─── 0..* CashMovement
Sale     1 ─── 1..* SaleItem
Sale     1 ─── 1..* SalePayment
Product  1 ─── 0..* SaleItem  (referencia histórica, snapshots evitan dependencia)
```

## Invariantes globales (must hold)

1. **Finanzas**: `sale.totalCents === sum(saleItems.subtotalCents)`
2. **Pagos**: `sale.totalCents === sum(pagos_activos.amountCents)`
3. **Stock consistente**: `product.stockQuantity === Último InventoryMovement.stockAfter`
4. **Venta válida**: una venta `completed` tiene ≥1 ítem y ≥1 pago activo.
5. **Anulación trazable**: venta `voided` tiene movimientos `sale_void` y pagos con estado `voided`.
6. **Caja**: como máximo una `CashSession.status === "open"`.
7. **Correlativo**: `nextSaleNumber` solo se incrementa DENTRO de la transacción de `completeSale`.
8. **Snapshots inmutables**: una vez persistido un `SaleItem`, ni `productName` ni `unitPriceCents` cambian aunque cambie `Product`.

## Distinción: Entidad de dominio vs Modelo de persistencia

| Concepto | Entidad de dominio (types) | Modelo persistencia (Dexie table) |
|---|---|---|
| Product | ✅ Mismo shape | ✅ tabla `products` igual |
| Sale + items + payments | ❗ Agregado transaccional | 3 tablas separadas: `sales`, `saleItems`, `salePayments` |
| CashSession + movimientos | ❗ Agregado | 2 tablas: `cashSessions`, `cashMovements` |
| InventoryMovement | Entidad historial | tabla `inventoryMovements` |

Regla: en el MVP NO introducir `ProductPersistenceModel`, `ProductDTO`, `ProductMapper` artificiales si el shape coincide. Diferenciar solo cuando exista un desajuste real.

## Snapshot de caja (Fase 4)

`CashSession` conserva el cuadre y el registro persistido agrega el desglose final por ventas,
método de pago y movimientos manuales. `CashSessionSummary` es una proyección: viva para sesiones
abiertas y congelada para cerradas.
