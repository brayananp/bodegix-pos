# Integridad del inventario local

## Persistencia

La versión actual de la base es 2. `schema-v1.ts` no se modifica; v2 añade
`[type+createdAt]` y `[productId+type+createdAt]` al ledger. No requiere transformación porque los
campos ya existían. La prueba de migración crea datos con v1, abre con `BodegixDatabase` v2 y
comprueba datos e índices.

Cada mutación de inventario usa una transacción Dexie `rw` con `products` e
`inventoryMovements`. La carga del producto, validación sensible al estado, transición, update e
insert ocurren dentro. Los timestamps se fuerzan a ser crecientes por producto incluso si el reloj
devuelve el mismo milisegundo. Esto hace determinista el último saldo y evita perder updates cuando
dos pestañas escriben de forma solapada.

## Diagnóstico profundo

El check `inventory-ledger-integrity` informa, sin reparar:

- movimientos que apuntan a productos inexistentes;
- deltas cero, no enteros o con signo contrario al tipo;
- saldos no enteros/negativos;
- ecuación before + delta = after incumplida;
- stock inicial que no parte de cero o aparece más de una vez;
- producto con saldo distinto de cero y sin movimientos;
- último `stockAfter` distinto de `Product.stockQuantity`.

Cada incidencia incluye severidad, `productId`, `movementId` cuando aplica y descripción. El modo
profundo es manual y no se ejecuta durante el arranque normal.

## Recuperación

No existe reparación automática ni eliminación de movimientos. Ante una inconsistencia se debe
conservar la base, registrar el reporte y decidir una corrección explícita en una versión posterior.
Una diferencia operativa normal se corrige con una nueva conciliación, nunca alterando historia.
