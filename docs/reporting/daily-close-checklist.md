# Checklist de cierre operativo

El checklist es una proyección y no constituye otro cierre. No se persiste, no limpia el carrito y no
ofrece “Cerrar día”. El único cierre financiero es cerrar cada `CashSession` desde Caja.

Comprueba caja abierta, carrito pendiente, presencia y total de ítems/pagos por venta completada y
conciliación global entre pagos y ventas. Caja o carrito pendientes son advertencias con acciones
“Ir a caja” e “Ir a venta”. Una inconsistencia de ventas o pagos es un fallo con enlace a ejecutar el
diagnóstico profundo. `pass` muestra “Todo listo”; `warning` requiere completar la operación y
`fail` requiere investigar. Ningún estado modifica datos.
