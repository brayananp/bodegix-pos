# Integridad de la anulación de venta

La venta original, sus ítems, totales, correlativo, referencias de cobro y movimientos `sale`
permanecen. La compensación añade estado/motivo/timestamp, marca todos los pagos originales como
`voided` y crea exactamente un `sale_void` positivo por producto con la suma de sus líneas.

El stock materializado se actualiza dentro de la misma transacción. La caja no recibe movimientos:
sus resúmenes vivos excluyen ventas/pagos anulados, mientras un cierre ya persistido no puede
modificarse ni admite nuevas anulaciones.

El diagnóstico profundo verifica ventas completas y anuladas por separado: lifecycle de pagos,
motivo, referencias, cantidades agrupadas, deltas positivos, movimientos originales, sesión y orden
temporal. Detecta estado parcial, movimiento faltante/duplicado y pago activo, pero nunca repara.
