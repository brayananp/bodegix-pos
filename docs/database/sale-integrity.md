# Integridad de ventas

## Atomicidad

`completeSale` escribe en una sola transacción Dexie: `appSettings`, `cashSessions`, `products`,
`sales`, `saleItems`, `salePayments`, `inventoryMovements`, `saleDrafts`. Cualquier fallo revierte
todo.

## Totales

- `subtotalCents === totalCents` (sin descuentos ni impuestos en Fase 5).
- Subtotal de ítem = `unitPriceCents × quantity`.
- Suma de pagos = `totalCents`; métodos únicos por venta.

## Inventario

Por ítem vendido: movimiento `sale` con `quantityDelta` negativo, `stockAfter = stockBefore -
quantity`. Stock releído dentro de la transacción.

## Correlativo

`nextSaleNumber` leído e incrementado en la misma transacción; no se consume si falla el commit.

## Diagnóstico (`sales-integrity`)

Modo profundo verifica ventas sin ítems/pagos, totales, vuelto en efectivo, pagos externos
verificados, movimientos por venta, correlativo y borrador válido.

## Concurrencia

Dos pestañas compiten por stock y correlativo; solo una transacción exitosa no deja stock negativo
ni ventas parciales.

## Integridad compensatoria

La anulación no reemplaza la venta original. Añade `sale_void` positivo por producto y lifecycle
`voided` a venta/pagos dentro de la misma transacción. No cambia ítems, importes, correlativo,
movimientos `sale`, cash movements ni snapshots cerrados. El diagnóstico profundo rechaza estados
parciales. Véase [sale-void-integrity.md](./sale-void-integrity.md).
