# 07. Diseño de base de datos Dexie

## Exportación/importación v7

El esquema sigue en v7 con diez tablas; Fase 8 no agrega almacenamiento. `exportDB` recorre
`database.tables`. La validación importa a una base temporal Bodegix y la elimina en `finally`; la
base real usa `importInto` transaccional con `clearTablesBeforeImport`, nunca `db.delete()`.

> Implementación vigente: esquema v7. V7 conserva v6 y agrega `sales.voidedAt` y
> `sales.[status+voidedAt]` para reporting. No existe tabla de cierre o resumen diario.

> Historia: `schema-v1.ts` permanece inmutable y `schema-v2.ts` añadió índices compuestos de
> historial sin transformar registros.

## Esquema v2 de inventario

Además de `[productId+createdAt]` y `[referenceType+referenceId]`, la versión 2 incorpora
`[type+createdAt]` y `[productId+type+createdAt]`. Permiten paginar el historial global o por
producto con filtro de tipo sin cargar el ledger completo. La migración v1→v2 conserva datos y se
prueba abriendo una base creada con `registerSchemaV1` desde la clase actual.

La unidad de trabajo de inventario abre `rw` sobre `products` e `inventoryMovements`, relee el
producto, toma el último movimiento, calcula la transición, asigna un timestamp estrictamente
creciente por producto y escribe saldo/movimiento. IndexedDB serializa las transacciones de
escritura solapadas; un fallo en cualquier inserción revierte también el update del producto.

## Propósito y frontera

**Dexie es un adaptador de infraestructura.** No es el dominio.

- Las tablas son el modelo de persistencia local.
- Los casos de uso son los que deciden QUÉ tablas tocar y CÓMO coordinar la transacción.
- `db` vive en `shared/infrastructure/db` y es importada directamente por los adaptadores Dexie de cada módulo.
- Los componentes React y las rutas NO importan `db` directamente.

## Nombre de la base

```text
bodegix-pos
```

Clase: `BodegixPosDatabase` (antes `PosDatabase`).

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

## Índices y observaciones

| Índice | Propósito |
|---|---|
| `&saleNumber` | Clave candidata. Correlativo único por instalación. |
| `&normalizedName` (categories) | Evita duplicados normalizados en categorías. |
| `barcode` | No marcado único inicial; puede haber vacíos o reutilizados. La aplicación ADVIERTE duplicados. |
| `products.normalizedName` | Búsqueda por nombre (case/accent-insensitive). |
| `products.stockQuantity` | Filtrar stock bajo. |
| `sales.createdAt` | Ventas del día, rango de fechas. |
| `sales.cashSessionId` | Ventas por sesión de caja. |
| `inventoryMovements.productId + createdAt` | Historial por producto. |
| `cashSessions.status` | Buscar la caja abierta (máximo 1). |

No indexar importes. No son criterios principales de consulta. Los índices se crean para consultas reales, no por comodidad.

## Regla de correspondencia módulo → tablas

No hay 1:1. Algunas operaciones cruzan tablas de varios módulos. Eso es correcto y la coordinación pertenece al **caso de uso (application)**, no a las tablas.

| Módulo | Tablas que lee/escribe |
|---|---|
| catalog | `products`, `categories` |
| inventory | `products` (stock), `inventoryMovements` |
| sales | `sales`, `saleItems`, `salePayments`, `products` (stock), `inventoryMovements`, `cashSessions` (validación abierta), `appSettings` (correlativo) |
| cash | `cashSessions`, `cashMovements`, `sales` (para cálculos) |
| reporting | TODAS, lectura sola |
| backup | TODAS, R/W completo |
| settings | `appSettings` |

## Unidades de trabajo / transacciones

### Operación crítica: `completeSale`

DEBE ejecutarse en UNA sola transacción Dexie. La UI NUNCA debe hacer estas llamadas por separado.

```typescript
await db.transaction(
  "rw",
  [
    db.cashSessions,        // 1. valida caja abierta
    db.products,            // 2+3. consulta + valida activo + stock
    db.sales,               // 8. insert
    db.saleItems,           // 9. bulkInsert
    db.salePayments,        // 10. bulkInsert
    db.inventoryMovements,  // 12. bulkInsert
    db.appSettings,         // 13. incrementa correlativo
  ],
  async (tx) => { ... },
);
```

Los 14 pasos son:
1. Requerir caja abierta (`requireOpenCashSession`).
2. Cargar productos por ids.
3. Validar todos activos.
4. Validar stock >= quantity por ítem.
5. Calcular subtotales y total.
6. Validar suma pagos === total.
7. Crear snapshots (nombre, precio, costo).
8. Insertar `sales`.
9. Bulk insert `saleItems`.
10. Bulk insert `salePayments`.
11. Update `products.stockQuantity` -= qty.
12. Bulk insert `inventoryMovements` con before/after correctos.
13. Update `appSettings.nextSaleNumber += 1`.
14. Commit automático por la transacción.

### Operación crítica: `voidSale`

También 1 transacción:

```typescript
await db.transaction(
  "rw",
  [
    db.sales,
    db.salePayments,
    db.saleItems,
    db.products,
    db.inventoryMovements,
  ],
  async (tx) => {
    // 1. Cargar y validar status === "completed"
    // 2. Impedir doble anulación (status ya "voided" -> throw SALE_ALREADY_VOIDED)
    // 3. Para cada item: restaurar stock (+)
    // 4. Para cada item: insert InventoryMovement "sale_void" con before/after
    // 5. Marcar pagos activos -> voided
    // 6. Marcar sale -> voided + voidedAt + voidReason
    // 7. NO borrar NADA. Todo queda en auditoría.
  },
);
```

### Operación crítica: `restoreBackup`

1 transacción que reemplaza el contenido completo de todas las tablas después de validar versión y checksum. Antes: exporta estado actual automáticamente como backup pre-restauración.

## Migraciones

Regla de vida de versión:

```typescript
// NUNCA EDITAR una versión ya publicada.
// Siempre incrementar y usar .upgrade().

this.version(2)
  .stores({
    // Esquema completo actualizado
  })
  .upgrade(async (tx) => {
    // Transformación de datos (si es destructiva, pre-run: backup automático)
  });
```

Prácticas:
- Probar migración con fixtures realistas (`test/fixtures/db-vN/`).
- El diagnóstico debe pasar tras migrar.
- Si la migración es destructiva (elimina datos), el onboarding debe FORZAR respaldo previo o mostrar advertencia grave.

## Diagnóstico de integridad

Función `runIntegrityCheck()` que valida (lectura, no corrige):

1. `appSettings[id=main]` existe.
2. Exactamente 0 ó 1 `cashSessions` abiertas.
3. Toda `completed` tiene ≥1 item y ≥1 pago activo.
4. `sum(amountCents)` pagos activos = `sale.totalCents`.
5. `sum(subtotalCents)` items = `sale.subtotalCents`.
6. `product.stockQuantity === último InventoryMovement.stockAfter` por producto.
7. `appSettings.nextSaleNumber > max(sales.saleNumber)`.
8. No hay `InventoryMovement` sin producto existente (o lo marca).

Se ejecuta:
- después de onboarding;
- antes de exportar respaldo;
- después de restaurar;
- después de migración de versión;
- bajo demanda (diagnóstico manual).

## Diferencia clave: Agregado vs Transacción

- **Agregado = concepto de dominio** (Sale + Items + Payments consistentes).
- **Transacción Dexie = concepto de infraestructura** (multi-tabla ACID).

Coinciden a menudo, pero no son lo mismo. El dominio define las invariantes (`payments suman total`); Dexie las preserva materialmente dentro del caso de uso.

## No hacer

- No crear `ProductRepository extends IRepository<Product>` genéricos si solo envuelven `db.products.xxx`.
- No crear `ProductMapper`, `ProductDTO` si el shape coincide con la entidad.
- No exponer `db` fuera de `shared/infrastructure` y los adaptadores de módulo.
- No realizar escrituras parciales en UI/Rutas.
- No introducir campos de sincronización (`tenantId`, `syncStatus`, `serverVersion`, `deletedAt`) hasta que exista un backend que los use.

## Versión 3

El esquema v3 agrega campos no indexados de snapshot a `cashSessions` mediante upgrade explícito.
Los índices de sesiones, movimientos, ventas y pagos permanecen intactos. Cierre y retiro incluyen
en su transacción todas las tablas necesarias para recalcular el efectivo definitivo.

## Esquema vigente

V5 normaliza los campos anulables de `salePayments`; v6 indexa `sales.totalCents`. La anulación abre
una sola transacción sobre ventas, ítems, pagos, sesiones, productos y ledger. Las consultas usan
índices y cargas en lote; no hacen una consulta de ítems o pagos por cada fila.
