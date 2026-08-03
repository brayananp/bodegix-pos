# ADR-0013: No utilizar event sourcing completo

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto

## Context

¿Utilizar event sourcing para las ventas y/o el inventario?

Opciones evaluadas:

1. **Event sourcing puro**: estado = fold de eventos; `Product.stockQuantity` es una proyección, no una fuente de verdad.
2. **Event sourcing ligero solo para inventario**: `InventoryEvent` con versiones.
3. **Modelo híbrido**: `Product.stockQuantity` como estado actual materializado + `InventoryMovement[]` como ledger de trazabilidad. No es event sourcing.

## Decision

**No usar event sourcing completo (opción 3).**

- Las ventas se almacenan como registros (`Sale`, `SaleItem`, `SalePayment`) con snapshots inmutables de los ítems.
- El inventario utiliza el modelo híbrido `stock actual + movements`.
- No hay append-only event store, ni rehidratación por fold, ni proyecciones asíncronas derivadas de eventos.
- Extender a event sourcing SOLO si:
  - se necesita auditoría estricta a prueba de balas con replay;
  - múltiples proyecciones asíncronas del mismo flujo;
  - integración con sistemas externos por eventos.

## Rationale

- **Simplicidad del MVP**: una lectura simple de `Product.stockQuantity` es suficiente y no requiere snapshot/rehidratación periódica.
- **Rendimiento local**: IndexedDB no está optimizado como append-only event store con fold frecuente; el acceso directo al materializado es más rápido y simple.
- **Riesgos de event sourcing**: versionado de eventos, upcasting, esquemas de eventos, snapshots, migraciones. Problemas resueltos en backends robustos, pero costosos en el cliente.
- **Trazabilidad suficiente**: `InventoryMovement` cumple el propósito de historial para una bodega pequeña.
- **Opción conservada**: migrar a event sourcing es posible cuando se añade backend (eventos de dominio en backend sobre PostgreSQL).

## Not-implemented

- Event sourcing puro para ventas.
- Event sourcing puro para inventario.
- Domain events sin consumidores (evento emitido pero nadie más lo usa).
- Sagas.

## Consequences

- Positivo: modelo mental simple, consultas directas, rápido de implementar.
- Positivo: `stockQuantity` consistente con `last(InventoryMovement).stockAfter` → validable por integridad.
- Riesgo: si en algún punto se necesitan nuevas proyecciones de eventos pasados, el modelo híbrido no tiene suficientes detalles.
  - Mitigación: al diseñar movimientos, incluir `reason`, `referenceId` y campos informativos suficientes desde el MVP.
- Acción: incluir todos los movimientos en el formato de backup; validar integridad `stockQuantity == last.stockAfter`.
