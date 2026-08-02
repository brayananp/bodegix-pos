# 06. Modelo de dominio

## Agregados principales

### Product

Representa un artículo vendible y su stock resumido actual.

```typescript
interface Product {
  id: string;
  barcode: string | null;
  name: string;
  normalizedName: string;
  categoryId: string | null;

  salePriceCents: number;
  costPriceCents: number | null;

  stockQuantity: number;
  minimumStockQuantity: number;

  isActive: boolean;

  createdAt: number;
  updatedAt: number;
}
```

### Category

```typescript
interface Category {
  id: string;
  name: string;
  normalizedName: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### Sale

```typescript
type SaleStatus = "completed" | "voided";

interface Sale {
  id: string;
  saleNumber: number;
  cashSessionId: string;

  subtotalCents: number;
  totalCents: number;

  status: SaleStatus;

  createdAt: number;
  voidedAt: number | null;
  voidReason: string | null;
}
```

### SaleItem

```typescript
interface SaleItem {
  id: string;
  saleId: string;
  productId: string;

  productName: string;
  unitPriceCents: number;
  unitCostCents: number | null;

  quantity: number;
  subtotalCents: number;
}
```

### SalePayment

```typescript
type PaymentMethod =
  | "cash"
  | "yape"
  | "plin"
  | "card"
  | "bank_transfer";

type PaymentStatus =
  | "confirmed"
  | "manually_verified"
  | "voided";

interface SalePayment {
  id: string;
  saleId: string;

  method: PaymentMethod;
  amountCents: number;
  status: PaymentStatus;

  providerLabel: string | null;
  operationReference: string | null;

  cashReceivedCents: number | null;
  changeCents: number | null;

  verifiedAt: number;
  createdAt: number;
}
```

### InventoryMovement

```typescript
type InventoryMovementType =
  | "initial_stock"
  | "purchase"
  | "sale"
  | "sale_void"
  | "adjustment_in"
  | "adjustment_out"
  | "damaged"
  | "expired";

interface InventoryMovement {
  id: string;
  productId: string;

  type: InventoryMovementType;
  quantityDelta: number;

  stockBefore: number;
  stockAfter: number;

  referenceType: "sale" | "manual" | "setup";
  referenceId: string | null;
  reason: string | null;

  createdAt: number;
}
```

### CashSession

```typescript
type CashSessionStatus = "open" | "closed";

interface CashSession {
  id: string;
  status: CashSessionStatus;

  openingCashCents: number;

  expectedCashCents: number | null;
  countedCashCents: number | null;
  differenceCents: number | null;

  openedAt: number;
  closedAt: number | null;
}
```

### CashMovement

```typescript
type CashMovementType = "deposit" | "withdrawal";

interface CashMovement {
  id: string;
  cashSessionId: string;
  type: CashMovementType;
  amountCents: number;
  reason: string;
  createdAt: number;
}
```

### AppSettings

```typescript
interface AppSettings {
  id: "main";

  businessName: string;
  currency: "PEN";
  timezone: "America/Lima";

  installationId: string;
  nextSaleNumber: number;

  backupReminderDays: number;
  lastBackupAt: number | null;

  yapeQrImage: Blob | null;
  plinQrImage: Blob | null;

  createdAt: number;
  updatedAt: number;
}
```

## Relaciones

```text
Category 1 ─── * Product
Product 1 ─── * InventoryMovement
CashSession 1 ─── * Sale
CashSession 1 ─── * CashMovement
Sale 1 ─── * SaleItem
Sale 1 ─── * SalePayment
Product 1 ─── * SaleItem
```

## Invariantes

- `sale.totalCents === sum(saleItems.subtotalCents)`.
- `sale.totalCents === sum(active salePayments.amountCents)`.
- `product.stockQuantity` debe coincidir con el último `stockAfter`.
- Una venta completada tiene al menos un ítem y un pago.
- Una venta anulada tiene movimientos `sale_void`.
- Solo existe una `CashSession` abierta.
- `nextSaleNumber` aumenta dentro de la misma transacción de venta.
