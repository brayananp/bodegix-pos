# Casos de uso de caja

## `openCashSession`

Recibe `openingCashCents` entero no negativo. Dentro de una transacción sobre `cashSessions`
comprueba que no exista otra sesión abierta, genera ID/fecha y crea todos los campos de cierre y
snapshot en `null`. Devuelve la sesión o `CASH_SESSION_ALREADY_OPEN` / `INVALID_OPENING_CASH`.

## `registerCashDeposit`

Recibe sesión, importe entero positivo y motivo de 3–160 caracteres. Verifica la sesión abierta y
agrega un movimiento inmutable `deposit` en una transacción. No modifica el snapshot.

## `registerCashWithdrawal`

Valida los mismos campos y recalcula, dentro de la transacción, ventas en efectivo y movimientos.
Rechaza `INSUFFICIENT_EXPECTED_CASH` si el retiro dejaría efectivo negativo. Dos retiros
concurrentes se serializan sobre los mismos object stores.

## `closeCashSession`

Recibe sesión y efectivo contado entero no negativo. La transacción incluye `cashSessions`,
`cashMovements`, `sales` y `salePayments`; relee el estado, agrega pagos confirmados/verificados en
lote, calcula esperado/diferencia, guarda el snapshot y cambia a `closed`. Un segundo cierre o un
movimiento posterior falla. Las pruebas cubren rollback, concurrencia, pagos, snapshot e
inmutabilidad.
