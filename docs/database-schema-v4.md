# Esquema de base local v4

Estado: vigente desde Fase 5. Las versiones anteriores permanecen documentadas e inmutables.

V4 conserva todas las tablas de v3 (10 tablas) y todos los registros existentes. El único cambio estructural es la adición de la tabla `saleDrafts` para persistir el carrito de compras.

## Nuevas tablas en v4

### `saleDrafts`

Tabla singleton que almacena el borrador del carrito actual.

```text
id, updatedAt
```

**Índices:**
- `id` — primary key (siempre `"main"`)
- `updatedAt` — timestamp de última modificación

**Campos del registro:**

```typescript
{
  id: "main",
  items: Array<{
    productId: string,
    quantity: number,
    expectedUnitPriceCents: number
  }>,
  updatedAt: string  // ISO 8601
}
```

**Propósito:** Persistir el carrito entre recargas, navegación y actualizaciones PWA. Se elimina automáticamente al completar una venta exitosa.

## Tablas heredadas de v3

La v4 mantiene intactas las 9 tablas anteriores:

1. **`categories`** — Categorías de productos
2. **`products`** — Catálogo de productos con precios
3. **`inventoryMovements`** — Ledger inmutable de movimientos de stock
4. **`sales`** — Registro de ventas completadas
5. **`saleItems`** — Ítems de cada venta (snapshot de producto y precio)
6. **`salePayments`** — Pagos asociados a cada venta
7. **`cashSessions`** — Sesiones de caja (apertura/cierre)
8. **`cashMovements`** — Movimientos de efectivo (depósitos, retiros, arqueos)
9. **`appSettings`** — Configuración global (correlativos, preferencias)

Para el detalle de estas tablas, ver:
- [Esquema v1](./database-schema-v1.md) — Tablas base
- [Esquema v2](./database-schema-v2.md) — Índices de inventario
- [Esquema v3](./database-schema-v3.md) — Snapshot de caja

## Migración v3 → v4

No existe transformación de datos en el `upgrade()`. La migración:

1. Registra la nueva tabla `saleDrafts` con sus índices
2. Conserva todos los registros existentes
3. No modifica tablas anteriores
4. No inserta datos de ejemplo

El carrito se crea automáticamente cuando el usuario agrega el primer producto.

## Pruebas

La migración está cubierta por:
- `src/shared/infrastructure/local-db/local-database.integration.test.ts`
- `src/modules/sales/infrastructure/sales.integration.test.ts`
- `e2e/sale.spec.ts` — flujo completo de venta con carrito persistido

## Relación con otros módulos

### Sales → Catalog

- Lee `products` para validar existencia, estado activo y precio actual
- Lee `categories` para filtrar productos en el punto de venta

### Sales → Inventory

- Lee `products.stockQuantity` para validar disponibilidad
- Escribe `inventoryMovements` tipo `"sale"` en la transacción de venta
- Actualiza `products.stockQuantity` decrementándolo en la misma transacción

### Sales → Cash

- Requiere `cashSessions` con estado `"open"`
- Escribe pagos en efectivo que afectan el balance de caja
- Actualiza snapshot de cierre (`completedSalesCount`, `totalSalesCents`, etc.)

## Integridad transaccional

La transacción `completeSale` garantiza atomicidad en **8 tablas**:

1. `appSettings` — incrementa `nextSaleNumber`
2. `cashSessions` — valida sesión abierta
3. `products` — lee precios, valida stock, decrementa inventario
4. `sales` — crea registro de venta
5. `saleItems` — crea snapshot de cada ítem
6. `salePayments` — registra cada pago
7. `inventoryMovements` — crea movimientos tipo `"sale"`
8. `saleDrafts` — elimina el borrador tras éxito

Cualquier fallo en cualquier paso revierte toda la transacción.

## Próximas versiones

**v5 (Fase 6):** Campos de anulación y referencias de reversión de pagos.

**v6 (Fase 6):** Índice de total para el historial paginado.

**v7 (Fase 7):** Índices de anulaciones por periodo; no crea tablas de resúmenes.

