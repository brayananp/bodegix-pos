# Módulo reporting

`reporting` construye proyecciones operativas de solo lectura. No posee comandos, repositorios CRUD,
tablas ni estado persistido. Su única capacidad pública es
`DailyReportingQueries.getDailyOperationalSummary({ date, timezone })`.

## Fuentes de verdad

- `sales`, `saleItems` y `salePayments`: ventas válidas, anulaciones, métodos y snapshots.
- `cashSessions` y `cashMovements`: cierre financiero, fondo, arqueo y movimientos manuales.
- `inventoryMovements` y `products`: actividad diaria y alertas actuales.
- `saleDrafts/main`: venta pendiente para el checklist.
- `appSettings/main`: zona horaria comercial.

El adaptador Dexie consulta rangos indexados, carga relaciones en lote y agrega en memoria el
conjunto limitado al día. No consulta una relación por fila. `useLiveQuery` observa las tablas y
recalcula al cambiar los datos, la fecha o un reintento; no usa polling ni TanStack Query.

## Límites

`CashSession` sigue siendo el cierre financiero autoritativo. No existe snapshot diario, tabla
`dailyClosings`, marca de revisión ni reconstrucción de stock histórico. Reporting tampoco importa
internos de otros módulos ni permite que ventas, caja o inventario dependan de él.
