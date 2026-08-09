# ADR 0018 — Anulación compensatoria de ventas

Estado: aceptado. Alcance: Fase 6.

## Decisión

La venta original nunca se elimina ni se edita. `voidSale` ejecuta una única transacción Dexie que:

1. exige una venta `completed` en su única sesión original todavía abierta;
2. exige motivo y una confirmación manual exacta por cada pago;
3. marca venta y pagos como `voided`, guardando una referencia opcional por pago externo;
4. restaura stock y crea un movimiento positivo `sale_void` agrupado por producto;
5. preserva ítems, totales, correlativo y movimientos `sale` originales.

No se crean pagos negativos ni movimientos de caja. El resumen de caja se recalcula leyendo solo
ventas y pagos activos, por lo que una anulación reduce el efectivo esperado sin falsear un retiro
manual. Tampoco se modifican cierres históricos.

## Límites

Solo se admite anulación completa durante la sesión original abierta. Una corrección descubierta
después del cierre es una devolución futura, fuera del MVP. El detalle y la anulación comparten un
único Sheet en `/sales`; no hay overlays anidados ni una ruta oculta para forzar la operación.

## Consecuencias

La auditoría es reconstruible y cualquier fallo produce rollback total. La unidad de trabajo de
`sales` coordina excepcionalmente las tablas de producto e inventario porque esa coordinación es
la frontera atómica documentada; `inventory` no depende de `sales` y la UI nunca escribe tablas.
