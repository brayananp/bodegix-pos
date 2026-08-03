# Módulo de inventario

## Responsabilidad y propiedad

`inventory` posee el ledger `inventoryMovements`, las reglas de transición, las consultas de
existencias y toda modificación de `Product.stockQuantity` posterior a la creación. `catalog`
posee los atributos comerciales y el stock mínimo; puede leer y preservar el saldo, nunca
reemplazarlo.

## Modelo híbrido e invariantes

El saldo se consulta desde `Product.stockQuantity`; el historial se consulta desde
`InventoryMovement[]`. No se reconstruye el listado desde eventos y esto no es event sourcing.

- cantidades y saldos son enteros seguros;
- ningún saldo puede ser negativo;
- `stockAfter = stockBefore + quantityDelta`;
- último `stockAfter = Product.stockQuantity`;
- stock inicial es positivo, parte de cero y ocurre como máximo una vez;
- movimientos confirmados son inmutables;
- `Product.updatedAt` incluye cambios de stock.

## API pública

El barrel `src/modules/inventory/index.ts` exporta dominio, comandos, puertos, adaptadores de
composición y UI. Las capacidades centrales son:

- `calculateInventoryTransition` y `getInventoryStockStatus`;
- `initializeProductStock`, `registerStockEntry`, `reconcileProductStock`, `registerStockLoss`;
- `InventoryUnitOfWork` e `InventoryQueries`;
- `getInventoryUnitOfWork`, `getInventoryQueries` e `InventoryPage`.

## Dependencias

Dominio no tiene dependencias técnicas. Aplicación solo depende del dominio. Infraestructura usa
la base local compartida y Dexie. UI usa React, TanStack Router/Form, shadcn/ui y los contratos del
módulo. Ninguna capa importa archivos privados de catálogo.

## Operaciones permitidas y futuras

La Fase 3 permite stock inicial, entrada manual, conciliación por conteo y pérdidas. `purchase` es
solo el nombre histórico del movimiento; no implica proveedor u orden de compra.

Permanecen futuros: `sale`, `sale_void`, lotes, vencimiento por lote, series, transferencias,
reservas, conteo masivo, importación, sincronización y múltiples almacenes.
