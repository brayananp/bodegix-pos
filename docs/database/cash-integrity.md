# Integridad de caja

El diagnóstico profundo informa, sin reparar, sesiones y movimientos inconsistentes. Verifica:

- máximo una sesión abierta;
- referencias, importe positivo y motivo válido de cada movimiento;
- movimientos dentro del intervalo apertura–cierre;
- ausencia de datos de cierre en sesiones abiertas;
- fechas y cuadre completos en sesiones cerradas;
- `differenceCents === countedCashCents - expectedCashCents`;
- importes enteros no negativos salvo la diferencia;
- snapshot completo o advertencia explícita para registros legados.

Las escrituras solo pasan por `CashUnitOfWork`. IndexedDB serializa transacciones de escritura que
comparten object stores, por lo que doble apertura, cierre/movimiento y retiros concurrentes
revalidan el estado definitivo. Un error aborta la transacción completa.
