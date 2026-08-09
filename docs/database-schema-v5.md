# Esquema v5 — ciclo de vida de pagos anulados

La versión 5 conserva todas las tablas e índices de v4 y migra cada `SalePaymentRecord` para que
`voidedAt` y `voidOperationReference` existan con valor `null`. La migración real está en
`schema/schema-v5.ts`, se ejecuta dentro de `Version.upgrade()` y preserva importes, métodos,
referencias originales y estados activos.

`SaleRecord` ya incluía `status`, `voidedAt` y `voidReason`; v5 no inventa tablas de anulaciones,
pagos negativos ni movimientos de caja. Los estados persistidos son `confirmed`,
`manually_verified` y `voided`.

La versión 6 agrega únicamente el índice `sales.totalCents`, necesario para ordenar el historial
por total sin materializar todas las ventas. No transforma registros.

## Invariantes

- venta completada: campos de anulación nulos y pagos activos;
- venta anulada: motivo/timestamp, todos los pagos `voided` y una restauración `sale_void` por producto;
- la referencia de devolución es opcional para pagos externos y siempre nula para efectivo;
- los ítems, totales, correlativo y movimientos `sale` originales permanecen inmutables.

Las migraciones v4→v5 y v5→v6 se validan con `fake-indexeddb`.
