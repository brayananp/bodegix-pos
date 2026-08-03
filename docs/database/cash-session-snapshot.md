# Snapshot de sesión de caja

El snapshot congela al cerrar: número/total de ventas, efectivo, Yape, Plin, tarjeta,
transferencia, depósitos, retiros, efectivo esperado, contado y diferencia. Mientras la sesión
está abierta esos campos permanecen `null` y el resumen se calcula con datos actuales.

La migración v3 agrega los campos sin cambiar índices y los inicializa en `null` para registros
v1/v2. Conserva esperado, contado y diferencia existentes; no inventa desglose. Una sesión legada
cerrada muestra “Desglose histórico no disponible” y nunca se recalcula silenciosamente.

Después del cierre, las consultas usan exclusivamente el snapshot. No existe reapertura,
edición, eliminación ni reparación automática.
