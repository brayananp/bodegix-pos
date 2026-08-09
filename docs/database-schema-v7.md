# Esquema Dexie v7

V7 conserva todas las tablas y registros de v6. Solo amplía `sales` con índices `voidedAt` y
`[status+voidedAt]` para consultar anulaciones del periodo sin recorrer el historial completo.
Dexie reconstruye los índices al migrar; no hay transformación de datos ni tabla de resumen diario.

La versión se registra después de v6 y tiene una prueba de migración que conserva una venta anulada
existente. `daily-reporting-indexes` valida ambos índices en el diagnóstico básico.
