# Módulo de caja

`cash` es propietario de `cashSessions`, `cashMovements`, apertura, movimientos manuales,
arqueo, cierre e historial. Expone comandos, consultas, errores y hooks desde su `index.ts`; no
expone tablas ni repositorios CRUD.

Una sesión representa una jornada operativa y no un día calendario. Solo puede existir una
sesión `open`. El efectivo esperado se calcula como efectivo inicial + ventas en efectivo +
depósitos − retiros. La diferencia es efectivo contado − esperado y se clasifica en cuadrada,
sobrante o faltante.

Los movimientos confirmados y las sesiones cerradas son inmutables. El cierre persiste un
snapshot completo para que ventas o pagos modificados en el futuro no cambien el arqueo. El
adaptador `DexieCashUnitOfWork` serializa las escrituras; `DexieCashQueries` pagina sesiones y
movimientos y lee `sales`/`salePayments` únicamente para calcular sesiones abiertas.

Ventas, carrito, creación de pagos, anulaciones, reapertura, eliminación y edición están fuera
del alcance. La Fase 5 podrá consumir la API pública de caja y será dueña de ventas y pagos.
