# Módulo: reporting

## Responsabilidad

Consultas y proyecciones de lectura para resúmenes y reportes.

## Límites del módulo

- **Incluye:** getDailySummary, getTopProducts, getLowStockAlerts, getCashHistory
- **Solo lectura:** no escribe, no tiene dominio con invariantes
- **Excluye:** lógica de ventas (→ `sales`), gestión de stock (→ `inventory`)

## Estado actual

Fase 0: solo se define el límite del módulo y la API pública.
