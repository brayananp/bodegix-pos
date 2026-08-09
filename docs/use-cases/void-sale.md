# Caso de uso: anular venta

## Input y elegibilidad

`VoidSaleInput` recibe `saleId`, motivo de 5–240 caracteres y exactamente una confirmación por pago
original, con referencia opcional de hasta 80 caracteres. La venta debe estar completada, contener
ítems y pagos, y pertenecer a la única sesión abierta, que debe ser su sesión original.

## Flujo transaccional

`voidSale` delega en `VoidSaleUnitOfWork`. La implementación Dexie abre una transacción `rw` sobre
`sales`, `saleItems`, `salePayments`, `cashSessions`, `products` e `inventoryMovements`; vuelve a
leer y validar dentro de ella, agrupa unidades por producto, restaura saldos, crea `sale_void`, marca
pagos y venta. No escribe `cashMovements`.

Una venta, ítem, pago, producto o sesión faltante aborta. También abortan motivo/referencia inválida,
confirmaciones faltantes/adicionales/duplicadas, sesión cerrada/cambiada, doble anulación o cualquier
error de persistencia. Dexie revierte todas las escrituras.

## Resultado y concurrencia

El resultado contiene venta, total, unidades/líneas restauradas, pagos/referencias, sesión, momento
y motivo. Se reconstruye desde datos persistidos después de recargar. Dos pestañas se serializan:
solo una anula y solo existe una restauración por producto.

Las pruebas cubren reglas, mapeadores, consulta, stock, pagos, caja derivada, rollback, concurrencia,
migración y diagnóstico con bases `fake-indexeddb` aisladas.
