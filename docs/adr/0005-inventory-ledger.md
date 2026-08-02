# ADR-0005: Inventario basado en movimientos

## Estado

Aceptado.

## Decisión

`Product.stockQuantity` mantiene el valor actual y `InventoryMovement` conserva la historia.

## Motivo

Una edición directa del stock destruye trazabilidad.

## Consecuencias

- Toda venta, anulación, entrada y ajuste crea movimientos.
- Se puede diagnosticar el stock.
- Las transacciones son obligatorias.
