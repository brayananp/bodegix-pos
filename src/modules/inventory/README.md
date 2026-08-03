# Módulo: inventory

## Responsabilidad

Gestión del stock actual y el ledger de movimientos de inventario.

## Límites del módulo

- **Incluye:** stockQuantity por producto, InventoryMovement (entradas, salidas, ajustes), alertas de stock bajo
- **Excluye:** productos en sí (→ `catalog`), generación de ventas (→ `sales`)

## Estado actual

Fase 0: solo se define el límite del módulo y la API pública.
No contiene lógica funcional todavía.

## Próxima fase (Fase 1+)

```
inventory/
├── domain/         InventoryMovement, MovementType, StockSnapshot
├── application/    registerStockEntry, adjustStock, getStockSummary
├── infrastructure/ Adaptadores Dexie
├── ui/             Componentes de movimientos y alertas
└── index.ts        API PÚBLICA
```
