# Módulo: reporting

## Responsabilidad

Consultas y proyecciones de lectura para resúmenes y reportes.

## Límites del módulo

- **Incluye:** getDailySummary, getTopProducts, getLowStockAlerts, getCashHistory
- **Solo lectura:** no escribe, no tiene dominio con invariantes
- **Excluye:** lógica de ventas (→ `sales`), gestión de stock (→ `inventory`)

## Estado actual

Fase 7 completada. La API pública, métricas, periodos y límites se documentan en
`docs/modules/reporting.md` y `docs/reporting/`.
