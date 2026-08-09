# Caso de uso: resumen operativo diario

## Entrada

`date` usa `YYYY-MM-DD` y `timezone` debe coincidir con `appSettings/main`. La fecha se convierte en
`[periodStart, periodEndExclusive)` mediante una zona IANA. Una entrada inválida produce
`ReportingError`; la UI recupera search params ausentes, inválidos o futuros usando el hoy
comercial.

## Consulta y agregación

El adaptador obtiene ventas creadas, anulaciones por `voidedAt`, ítems y pagos en lote, movimientos
de caja e inventario, sesiones que intersectan el periodo, productos actuales y borrador. Separa
ventas válidas de ventas creadas anuladas y de anulaciones procesadas. Solo suma pagos activos de
ventas completadas y usa snapshots de ítems para ranking y unidades.

El resultado incluye ventas, pagos, caja, inventario, cinco productos, cinco ventas recientes y un
checklist derivado. Los enteros no seguros o desbordamientos producen un error explícito; las
inconsistencias de ítems/pagos se exponen como fallo y no se corrigen. Las pruebas cubren límites,
zonas, agregaciones, sesiones abiertas/cerradas y migración.
