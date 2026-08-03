# Esquema local v3

La versión 3 conserva todas las tablas e índices de v2. Agrega a cada `cashSessions` los campos
nullable `completedSalesCount`, `totalSalesCents`, totales por método de pago,
`manualDepositsCents` y `manualWithdrawalsCents`. El `upgrade` asigna `null` a registros previos y
conserva los campos de cuadre existentes. No se elimina ni recrea la base.
