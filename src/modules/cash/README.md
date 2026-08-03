# Módulo: cash

## Responsabilidad

Sesiones de caja: apertura, movimientos y cierre.

## Límites del módulo

- **Incluye:** CashSession, CashDeposit, CashWithdrawal, openCash, closeCash
- **Excluye:** ventas (→ `sales`), reportes (→ `reporting`)

## Estado actual

Fase 4 completa: dominio, comandos, consultas, transacciones Dexie, snapshot v3, diagnóstico,
formularios compuestos, `/cash`, historial, detalle y pruebas desktop/móvil. Ventas y pagos se leen
solo como fixtures persistidos; su creación pertenece a la Fase 5.
