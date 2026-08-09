# Casos de uso de ventas

## Mantener carrito

Agregar producto, cambiar cantidad y limpiar persisten un único `saleDrafts/main`. La revisión
compara disponibilidad, precio y stock actuales sin corregir silenciosamente el snapshot esperado.

## Completar venta

Requiere caja abierta, carrito válido y pagos cuya suma coincide con el total. Efectivo calcula
vuelto; métodos externos exigen verificación manual. La unidad de trabajo crea venta, ítems y pagos,
descuenta stock, escribe `sale`, incrementa correlativo y limpia el borrador de forma atómica.

## Consultar historial

Busca por número, filtra por estado, método, rango y sesión, ordena y pagina. El detalle conserva
nombres/precios/costos/importes originales, indica disponibilidad actual y muestra sesión, pagos y
ledger relacionado. No carga detalles por fila.

## Anular venta

Solo para una venta completada de la única sesión original abierta. El operador elige/escribe un
motivo y confirma la devolución de cada pago. La transacción marca venta/pagos `voided`, guarda
referencias externas opcionales, suma líneas por producto, restaura stock y crea un `sale_void` por
producto. El resumen de caja excluye la venta sin crear un retiro manual.

El resultado se reconstruye de lo persistido. Doble ejecución, sesión cerrada/cambiada, históricos
faltantes, confirmaciones no exactas y fallos de escritura abortan con rollback completo.

Detalle contractual: [void-sale.md](./void-sale.md).
