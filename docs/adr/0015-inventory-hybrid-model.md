# ADR-0015: Inventario híbrido, no negativo y transaccional

- Estado: aceptado
- Fecha: 2026-08-03
- Depende de: ADR-0002, ADR-0005 y ADR-0013

## Contexto

El listado de una bodega debe responder con miles de productos, pero cada cambio también debe ser
auditable. Mantener solo el saldo pierde trazabilidad; reconstruirlo desde todo el ledger encarece
las lecturas habituales y convierte los movimientos en la única fuente de estado.

Documentación anterior admitía stock negativo para ajustes administrativos. Esa regla contradice
el alcance operativo del MVP y dificulta distinguir una corrección legítima de una inconsistencia.

## Decisión

Adoptar el modelo híbrido:

```text
Product.stockQuantity + InventoryMovement[]
```

`Product.stockQuantity` es el saldo materializado para consultas. `InventoryMovement` es un
registro inmutable de la transición. No es event sourcing y el listado no reconstruye el saldo
desde movimientos.

Toda mutación se ejecuta en una transacción Dexie `rw` que incluye `products` e
`inventoryMovements`, vuelve a leer el producto dentro de la transacción, calcula la transición,
actualiza saldo y `updatedAt`, e inserta el movimiento. Cualquier error aborta ambas escrituras.

Invariantes:

- cantidades y saldos son enteros seguros;
- `stockQuantity`, `stockBefore` y `stockAfter` nunca son negativos;
- `stockAfter = stockBefore + quantityDelta`;
- el último `stockAfter` coincide con `Product.stockQuantity`;
- stock inicial solo ocurre una vez, desde cero y antes de cualquier otro movimiento;
- cada producto tiene timestamps de movimientos estrictamente crecientes;
- un movimiento confirmado no se edita ni se elimina;
- un conteo sin diferencia devuelve `NO_STOCK_CHANGE` y no escribe.

`Product.updatedAt` representa cualquier modificación persistida del producto, incluido su saldo.

## Consecuencias

- Lecturas rápidas desde `products` y auditoría suficiente desde el ledger.
- Dos representaciones exigen atomicidad y diagnóstico profundo de consistencia.
- Una corrección se registra mediante un movimiento nuevo.
- Los movimientos futuros `sale` y `sale_void` permanecen en el tipo persistido, pero la Fase 3
  no los genera.
- No se permite reparación automática: el diagnóstico solo informa producto, movimiento y causa.
