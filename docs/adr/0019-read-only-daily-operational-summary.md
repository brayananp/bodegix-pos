# ADR 0019 — Resumen operativo diario como proyección

Estado: aceptado. Alcance: Fase 7.

## Decisión

No crear `dailyClosings`, snapshots diarios ni otro cierre financiero. `CashSession` conserva la
autoridad de apertura, arqueo y cierre. `/summary` calcula una proyección de solo lectura desde las
fuentes existentes y deriva un checklist no persistente.

Los periodos usan `America/Lima` desde configuración e intervalos semiabiertos. Las ventas se
dimensionan por `createdAt`, las anulaciones por `voidedAt`, los pagos solo desde ventas completadas
y las sesiones por intersección, permitiendo varias sesiones y cruces de medianoche. El inventario
histórico no se reconstruye; las alertas se etiquetan como estado actual.

## Consecuencias

No existe divergencia entre “cierre diario” y caja, ni migraciones de datos resumidos que puedan
quedar obsoletos. El costo es recalcular una consulta acotada e indexada cuando Dexie notifica
cambios. La UI es página completa, sin gráficos ni dependencia de charts; prioriza KPI, listas y
comprobaciones accionables.
