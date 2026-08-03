# Módulo: sales

## Estado: ✅ Fase 5 completada

Sistema de ventas completo con carrito persistido, validaciones en tiempo real y transacción atómica multi-tabla.

## Responsabilidad

Carrito persistido, checkout con pagos múltiples, y venta atómica (`completeSale`) que coordina ventas, inventario y caja.

## Características principales

- ✅ **Carrito persistido** que sobrevive recargas y navegación
- ✅ **Búsqueda de productos** por nombre, código y categoría
- ✅ **Validación automática** de stock y precios
- ✅ **Checkout con pagos mixtos** (efectivo, Yape, Plin, POS, transferencia)
- ✅ **Transacción atómica** en 8 tablas con rollback automático
- ✅ **Correlativo de ventas** automático (V-000001, V-000002...)
- ✅ **Snapshots inmutables** de productos vendidos
- ✅ **Interfaz responsive** optimizada para desktop y móvil
- ✅ **Pruebas completas**: 30 tests (unitarios + integración + E2E)

## Límites

- **Incluye:** borrador del carrito, Sale, SaleItem, SalePayment, correlativo, snapshots
- **Consulta:** catálogo e inventario vía APIs públicas
- **Exige:** sesión de caja abierta dentro de la transacción
- **Excluye:** anulaciones (Fase 6), fiado, descuentos, impuestos, impresión, backend

## Estructura

```
sales/
├── domain/           Reglas puras, totales, errores tipados
├── application/      Queries, ports, reviewSaleDraft
├── infrastructure/   Dexie draft store, complete-sale UoW, queries
└── ui/               /sale, carrito, checkout, resultado
```

## Transacción `completeSale`

Atómica sobre: `appSettings`, `cashSessions`, `products`, `sales`, `saleItems`, `salePayments`, `inventoryMovements`, `saleDrafts`.

## API pública

Importar **exclusivamente** desde `@/modules/sales` (`index.ts`).

### Comandos (escritura)
```typescript
// Carrito
addProduct(productId: string): Promise<Result<void>>
setQuantity(productId: string, quantity: number): Promise<Result<void>>
removeProduct(productId: string): Promise<Result<void>>
clear(): Promise<Result<void>>
refreshPrices(priceMap: Record<string, number>): Promise<Result<void>>

// Venta
completeSale(paymentIntents: PaymentIntent[]): Promise<Result<SaleResult>>
```

### Queries (lectura)
```typescript
// Validación
reviewSaleDraft(): Promise<Result<SaleDraftReview>>

// Resultado
getSaleResult(saleId: string): Promise<Result<SaleResult>>

// Productos para venta
findProductsForSale(filters: SaleProductFilters): Promise<Product[]>
```

### Hooks React
```typescript
useSaleDraft(): UseSaleDraftResult
useSaleDraftReview(): UseSaleDraftReviewResult
useCompleteSale(): UseCompleteSaleResult
```

## Errores tipados

```typescript
type SaleErrorCode =
  | "CASH_SESSION_REQUIRED"        // Sin caja abierta
  | "CART_EMPTY"                   // Carrito vacío
  | "PRODUCT_NOT_FOUND"            // Producto eliminado
  | "PRODUCT_INACTIVE"             // Producto desactivado
  | "PRODUCT_PRICE_CHANGED"        // Precio cambió
  | "INSUFFICIENT_STOCK"           // Stock insuficiente
  | "PAYMENT_TOTAL_MISMATCH"       // Pagos ≠ total
  | "DUPLICATE_PAYMENT_METHOD"     // Método repetido
  | "EXTERNAL_PAYMENT_MISSING_REFERENCE"  // Sin referencia
  | "CART_MAX_LINES_EXCEEDED"      // >100 líneas
  | "INVALID_QUANTITY";            // Cantidad inválida
```

## Documentación

## Documentación

- [Descripción del módulo](../../docs/modules/sales.md)
- [Casos de uso detallados](../../docs/use-cases/sales-use-cases.md)
- [Interfaz y componentes](../../docs/ui/sale-ui.md)
- [Integridad transaccional](../../docs/database/sale-integrity.md)
- [Carrito persistido](../../docs/database/sale-draft.md)
- [Esquema v4](../../docs/database-schema-v4.md)
- [Resumen de fase 5](../../docs/PHASE-5-SUMMARY.md)
- [ADR: Payments inside sales](../../docs/adr/0011-payments-inside-sales.md)
- [ADR: Sale draft persistence](../../docs/adr/0017-sale-draft-persistence.md)

## Pruebas

```bash
# Unitarias
pnpm test sale

# Integración (con fake-indexeddb)
pnpm test sales.integration

# E2E
pnpm test:e2e -- sale.spec

# Todas las pruebas del proyecto
pnpm test && pnpm test:e2e
```

## Uso rápido

```typescript
import { 
  useSaleDraft, 
  useCompleteSale 
} from "@/modules/sales";

function SalePage() {
  const { draft, addProduct, setQuantity } = useSaleDraft();
  const { completeSale, isCompleting } = useCompleteSale();
  
  // Agregar producto
  await addProduct("product-id");
  
  // Modificar cantidad
  await setQuantity("product-id", 5);
  
  // Completar venta
  const result = await completeSale({
    paymentIntents: [
      { method: "cash", amountCents: 10000 }
    ]
  });
  
  if (result.isOk()) {
    console.log("Venta:", result.value.formattedSaleNumber);
  }
}
```
