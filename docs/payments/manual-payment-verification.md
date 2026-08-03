# Verificación manual de pagos externos

## Métodos

`yape`, `plin`, `card`, `bank_transfer` se registran con `status: "manually_verified"`. No hay
integración automática con apps ni terminales en Fase 5.

## Confirmación en UI

El checkout exige checkbox: «Confirmo que verifiqué el pago en la aplicación o terminal oficial».
Es validación de formulario; no se persiste como booleano aparte.

## Referencia opcional

`operationReference`: texto limpio, máximo 80 caracteres. No se asume unicidad global.

## Prohibiciones

No almacenar números de tarjeta, CVV, credenciales bancarias ni capturas como prueba en la base
local.

## Efectivo vs digital

En ventas mixtas, `amountCents` de efectivo es solo la parte de la venta en cash; el vuelto se
calcula sobre `cashReceivedCents - amountCents`. Caja aumenta únicamente la parte en efectivo.
