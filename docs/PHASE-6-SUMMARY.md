# Fase 6 — Historial y anulación de ventas

Estado: implementada y revisada contra el contrato de Fase 6.

## Entrega

- `/sales` con filtros URL, rangos Lima, orden y paginación 25/50/100;
- consultas Dexie por índices y carga de ítems/pagos en lote;
- detalle histórico con snapshots, sesión y movimientos `sale`/`sale_void`;
- un único Sheet responsive para `detail → void → void-result`;
- formulario TanStack Form compuesto, confirmación exacta por pago y dirty guard;
- compensación atómica con rollback, stock agrupado por producto y resultado reconstruible;
- pagos originales `voided`, referencia opcional externa y ninguna referencia para efectivo;
- caja recalculada desde ventas/pagos activos, sin cash movements ni cambios a cierres;
- esquema v5 para lifecycle de pagos y v6 para índice de orden por total;
- diagnóstico profundo, pruebas unitarias, integración, migración y arquitectura.

## Política

Solo se anula una venta completa durante su única sesión original abierta. No se elimina ni edita la
venta, no se modifica el correlativo, no se crean pagos negativos y no se implementan devoluciones
posteriores al cierre.

## Próxima fase

Fase 7 — Resumen operativo y cierre diario.
