# 08. Arquitectura de la aplicación

## Estilo

Monolito modular frontend con principios hexagonales ligeros.

El objetivo no es crear capas ceremoniales, sino separar:

- dominio;
- casos de uso;
- persistencia;
- interfaz.

## Estructura

```text
src/
├── app/
│   ├── providers/
│   ├── layout/
│   ├── pwa/
│   └── bootstrap/
│
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── sale.tsx
│   ├── products.tsx
│   ├── inventory.tsx
│   ├── cash.tsx
│   ├── summary.tsx
│   └── settings.tsx
│
├── modules/
│   ├── catalog/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   └── ui/
│   │
│   ├── inventory/
│   ├── sales/
│   ├── payments/
│   ├── cash/
│   ├── reports/
│   ├── backup/
│   └── settings/
│
├── shared/
│   ├── db/
│   ├── money/
│   ├── dates/
│   ├── ids/
│   ├── validation/
│   ├── errors/
│   └── ui/
│
└── test/
    ├── fixtures/
    ├── builders/
    └── setup/
```

## Dependencias permitidas

```text
UI → Application → Domain
Infrastructure → Domain
Application → Ports
Bootstrap → Infrastructure + Application
```

El dominio no importa:

- React;
- Dexie;
- componentes UI;
- Router;
- PWA APIs.

## Casos de uso

### Catálogo

- `createProduct`
- `updateProduct`
- `deactivateProduct`
- `searchProducts`

### Inventario

- `setInitialStock`
- `registerStockEntry`
- `registerInventoryAdjustment`
- `getProductMovements`
- `getLowStockProducts`

### Ventas

- `quoteCart`
- `completeSale`
- `voidSale`
- `getSaleDetail`
- `listSales`

### Caja

- `openCashSession`
- `registerCashDeposit`
- `registerCashWithdrawal`
- `calculateCashSession`
- `closeCashSession`

### Respaldo

- `exportBackup`
- `inspectBackup`
- `restoreBackup`
- `runIntegrityCheck`

## Puertos

Ejemplo:

```typescript
interface SalesRepository {
  completeSale(command: CompleteSaleCommand): Promise<CompletedSale>;
  voidSale(command: VoidSaleCommand): Promise<void>;
  getById(id: string): Promise<SaleDetail | null>;
}

interface InventoryRepository {
  getAvailableProducts(ids: string[]): Promise<Product[]>;
  applySaleMovements(input: ApplySaleMovementsInput): Promise<void>;
}
```

Para evitar transacciones fragmentadas, la implementación Dexie puede exponer una unidad de trabajo especializada:

```typescript
interface CheckoutUnitOfWork {
  completeSale(command: CompleteSaleCommand): Promise<CompletedSale>;
}
```

## Estado de interfaz

- El carrito puede mantenerse en estado React local o en TanStack Store.
- No debe persistirse automáticamente como venta.
- Se puede guardar un borrador local opcional en una versión posterior.
- Los datos maestros y ventas provienen de Dexie.
- `useLiveQuery` se usa en adaptadores/hooks de infraestructura, no dentro del dominio.

## Manejo de errores

Errores tipados:

```typescript
type DomainErrorCode =
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_INACTIVE"
  | "INSUFFICIENT_STOCK"
  | "PAYMENT_TOTAL_MISMATCH"
  | "NO_OPEN_CASH_SESSION"
  | "CASH_SESSION_ALREADY_OPEN"
  | "SALE_ALREADY_VOIDED"
  | "BACKUP_INVALID"
  | "STORAGE_UNAVAILABLE";
```

La UI traduce errores a mensajes accionables.

## Registro técnico

En producción local no se almacenarán logs ilimitados. Se mantendrá:

- último error crítico;
- versión de aplicación;
- versión de esquema;
- información de almacenamiento;
- resultado del último diagnóstico.

## Configuración de paquetes

Las versiones se fijarán en `package.json` y `pnpm-lock.yaml`. La documentación no usará rangos ambiguos después del scaffolding.
