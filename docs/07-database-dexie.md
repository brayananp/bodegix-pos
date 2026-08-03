# 07. Diseño de base de datos Dexie

## Nombre

```text
bodegix-pos
```

## Tablas e índices

```typescript
this.version(1).stores({
  products:
    "id, barcode, normalizedName, categoryId, isActive, stockQuantity, updatedAt",

  categories:
    "id, &normalizedName, isActive, updatedAt",

  sales:
    "id, &saleNumber, cashSessionId, status, createdAt",

  saleItems:
    "id, saleId, productId",

  salePayments:
    "id, saleId, method, status, createdAt",

  inventoryMovements:
    "id, productId, type, referenceId, createdAt",

  cashSessions:
    "id, status, openedAt, closedAt",

  cashMovements:
    "id, cashSessionId, type, createdAt",

  appSettings:
    "id"
});
```

## Observaciones sobre índices

- `&saleNumber` es único.
- `&normalizedName` en categorías evita duplicados normalizados.
- `barcode` no se marca único inicialmente porque algunos catálogos pueden contener códigos vacíos o reutilizados; la aplicación advertirá duplicados.
- No se indexan importes porque no son criterios principales de consulta.
- Los índices deben responder a consultas reales; no deben agregarse por comodidad.

## Clase de base de datos

```typescript
import Dexie, { type EntityTable } from "dexie";

export class BodegixPosDatabase extends Dexie {
  products!: EntityTable<Product, "id">;
  categories!: EntityTable<Category, "id">;
  sales!: EntityTable<Sale, "id">;
  saleItems!: EntityTable<SaleItem, "id">;
  salePayments!: EntityTable<SalePayment, "id">;
  inventoryMovements!: EntityTable<InventoryMovement, "id">;
  cashSessions!: EntityTable<CashSession, "id">;
  cashMovements!: EntityTable<CashMovement, "id">;
  appSettings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("bodegix-pos");

    this.version(1).stores({
      products:
        "id, barcode, normalizedName, categoryId, isActive, stockQuantity, updatedAt",
      categories:
        "id, &normalizedName, isActive, updatedAt",
      sales:
        "id, &saleNumber, cashSessionId, status, createdAt",
      saleItems:
        "id, saleId, productId",
      salePayments:
        "id, saleId, method, status, createdAt",
      inventoryMovements:
        "id, productId, type, referenceId, createdAt",
      cashSessions:
        "id, status, openedAt, closedAt",
      cashMovements:
        "id, cashSessionId, type, createdAt",
      appSettings: "id",
    });
  }
}
```

## Transacción de venta

Debe incluir:

- `products`;
- `sales`;
- `saleItems`;
- `salePayments`;
- `inventoryMovements`;
- `cashSessions`;
- `appSettings`.

Pseudocódigo:

```typescript
await db.transaction(
  "rw",
  [
    db.products,
    db.sales,
    db.saleItems,
    db.salePayments,
    db.inventoryMovements,
    db.cashSessions,
    db.appSettings,
  ],
  async () => {
    const cashSession = await requireOpenCashSession();
    const settings = await requireSettings();
    const products = await loadAndValidateProducts(cart);

    const sale = buildSale({
      number: settings.nextSaleNumber,
      cashSessionId: cashSession.id,
      products,
      payments,
    });

    await db.sales.add(sale);
    await db.saleItems.bulkAdd(sale.items);
    await db.salePayments.bulkAdd(sale.payments);

    for (const line of sale.items) {
      await decrementProductStockAndCreateMovement(line);
    }

    await db.appSettings.update("main", {
      nextSaleNumber: settings.nextSaleNumber + 1,
      updatedAt: Date.now(),
    });
  },
);
```

## Transacción de anulación

- Cargar venta.
- Verificar estado `completed`.
- Cargar ítems.
- Restaurar stock.
- Crear movimientos `sale_void`.
- Marcar pagos `voided`.
- Marcar venta `voided`.
- No modificar número ni eliminar registros.

## Migraciones

Cada cambio de estructura incrementa la versión:

```typescript
this.version(2)
  .stores({
    // Esquema completo de la versión 2
  })
  .upgrade(async (tx) => {
    // Transformación de datos existentes
  });
```

Reglas:

1. Nunca editar silenciosamente una versión publicada.
2. Probar migración con una copia realista.
3. Realizar respaldo antes de una actualización con migración destructiva.
4. Mantener fixtures de versiones anteriores.
5. Registrar cada migración en un ADR.

## Consultas críticas

- Productos activos por nombre.
- Producto por código.
- Productos con stock bajo.
- Ventas por rango local de fecha.
- Ventas por caja.
- Ítems y pagos por venta.
- Movimientos por producto.
- Caja abierta.
- Movimientos de caja por sesión.

## Integridad

Se implementará una función de diagnóstico que valide:

- existencia de configuración;
- máximo una caja abierta;
- ventas con ítems;
- ventas con pagos;
- totales consistentes;
- referencias de productos;
- stock actual contra último movimiento;
- correlativo superior al mayor número de venta.
