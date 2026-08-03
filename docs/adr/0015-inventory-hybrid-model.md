# ADR-0015: Mantener inventario actual más ledger de movimientos

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto
- Depends on: [ADR-0005](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0005-inventory-ledger.md), [ADR-0013](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0013-no-event-sourcing.md)

## Context

Definir el modelo de inventario en el contexto del monolito modular y clarificar que, a pesar de parecerse, NO es event sourcing.

Opciones evaluadas:

1. **Solo stock actual**: `Product.stockQuantity`. Sin historial. Rápido, sin trazabilidad.
2. **Solo ledger de movimientos**: no hay `stockQuantity` persistente; el stock se calcula fold de `InventoryMovement`. Event sourcing-lite.
3. **Híbrido (stock actual + ledger)**: `Product.stockQuantity` es el valor materializado. `InventoryMovement[]` captura cada transición. `stockAfter` se guarda para auditoría.

## Decision

**Modelo híbrido (opción 3).** No es event sourcing.

Invariante por producto:
- `stockQuantity == último InventoryMovement.stockAfter`.

Toda escritura que modifica stock:
1. calcula before = stockQuantity actual;
2. computa delta = +n o -n;
3. calcula after = before + delta;
4. persiste actualización a `products.stockQuantity = after`;
5. persiste un `InventoryMovement { stockBefore: before, quantityDelta: delta, stockAfter: after }`;
6. DENTRO de la misma transacción Dexie.

## Razones

- **Lectura inmediata**: consultar stock es un get directo por ID, sin fold de N movimientos.
- **Trazabilidad suficiente**: todos los cambios tienen registro con causa (`type`, `referenceId`, `reason`). Sirve para preguntas de bodeguero: "¿por qué bajo a 5?".
- **Validación de integridad simple**: es O(1) por producto comparar `stockQuantity` vs último `stockAfter`. El diagnóstico lo revisa.
- **No event sourcing**: si se borraran movimientos antiguos por alguna razón (no recomendado, pero ilustrando), `stockQuantity` sigue siendo la fuente de verdad. En event sourcing el ledger ES la fuente. Aquí no.

## Not-implemented

- Event sourcing de inventario.
- Stock-only sin movimientos.
- Calculado en runtime por fold.

## Consequences

- Positivo: rendimiento, auditoría y simplicidad mental.
- Negativo: hay dos representaciones que deben mantenerse sincronizadas.
  - Mitigación: AMBAS se actualizan siempre dentro de UNA transacción por caso de uso. NUNCA fuera.
  - Mitigación: `runIntegrityCheck()` detecta inconsistencias.
- Acción: prueba de `completeSale` valida que se crean los movimientos correctos con before/after; prueba de integridad detecta desvíos.
