# Casos de uso de inventario

Todos delegan en `InventoryUnitOfWork.applyStockMutation`. La implementación vuelve a leer el
producto dentro de una transacción `rw` de `products` + `inventoryMovements`; un error revierte
ambas escrituras. El resultado incluye producto, saldo, fecha y movimiento confirmado.

## `initializeProductStock`

- Input: `productId`, `quantity`, `note`.
- Precondiciones: producto existente/activo, saldo cero, cantidad entera positiva y ledger vacío.
- Efecto: `initial_stock`, referencia `setup`, `0 → quantity`.
- Errores principales: `PRODUCT_NOT_FOUND`, `PRODUCT_INACTIVE_FOR_STOCK_ENTRY`,
  `INVALID_STOCK_QUANTITY`, `INITIAL_STOCK_ALREADY_REGISTERED` e
  `INITIAL_STOCK_REQUIRES_ZERO_STOCK`.
- Pruebas: camino feliz, repetición, ledger previo y atomicidad.

## `registerStockEntry`

- Input: `productId`, `quantity`, `reference`, `note`.
- Precondiciones: producto existente/activo y cantidad entera positiva.
- Efecto: movimiento `purchase`, referencia `manual`, suma la cantidad sin modificar costo.
- Errores principales: producto inexistente/inactivo, cantidad o texto inválido, persistencia.
- Pruebas: metadatos, inactivo, concurrencia y rollback.

## `reconcileProductStock`

- Input: `productId`, `countedQuantity`, `reason`.
- Precondiciones: producto existente; cantidad contada entera no negativa; motivo de 3–240.
- Efecto: calcula `counted - current`; genera `adjustment_in` o `adjustment_out` y deja saldo
  exactamente igual a lo contado. Admite productos inactivos.
- Sin diferencia: `NO_STOCK_CHANGE`, sin escrituras.
- Pruebas: deltas positivos/negativos, cero, inactivo y estado resultante.

## `registerStockLoss`

- Input: `productId`, `quantity`, `lossType`, `reason`.
- Precondiciones: cantidad entera positiva no superior al saldo; motivo obligatorio para `other`.
- Efecto: delta negativo; `damaged → damaged`, `expired → expired`,
  `other → adjustment_out`. Admite productos inactivos.
- Errores principales: `INSUFFICIENT_STOCK`, `INVALID_LOSS_REASON` y cantidad inválida.
- Pruebas: tres mapeos, motivo y prevención de saldo negativo.
