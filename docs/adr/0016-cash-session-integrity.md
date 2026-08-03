# ADR-0016: integridad e interfaz de sesiones de caja

## Estado

Aceptado — Fase 4.

## Decisión

Habrá una sola sesión abierta por instalación, validada transaccionalmente. Sesiones cerradas y
movimientos serán inmutables. Los retiros se validan contra efectivo esperado y solo el método
`cash` de ventas afecta efectivo físico; pagos digitales se muestran aparte. El cierre guarda un
snapshot completo y los históricos no se recalculan.

La UI mantiene una única ruta `/cash`: Dialog/Drawer para apertura y movimientos, Sheet para
cierre/detalle y search params para contexto. No se implementan reapertura, edición, ventas ni
pagos en esta fase.

## Consecuencias

Las correcciones se realizan con movimientos compensatorios. El cierre es reproducible y auditable
aunque cambien datos futuros. Las transacciones incluyen todas las tablas leídas para evitar
decisiones basadas en estado obsoleto.
