# Reversión manual de pagos

La aplicación no se integra con Yape, Plin, adquirentes de tarjeta ni bancos. Antes de anular, el
operador confirma manualmente la devolución de cada pago original: efectivo, Yape, Plin, tarjeta o
transferencia. No puede omitir, duplicar ni agregar pagos.

Efectivo no requiere ni guarda referencia. Los métodos externos aceptan una referencia opcional,
normalizada y limitada a 80 caracteres. El importe, método y referencia de cobro original no se
editan; solo cambian `status`, `voidedAt` y `voidOperationReference`.

La confirmación documenta una acción humana: no ejecuta reembolso automático, no guarda datos de
tarjeta, no crea pagos negativos y no registra secretos en URL o consola.
