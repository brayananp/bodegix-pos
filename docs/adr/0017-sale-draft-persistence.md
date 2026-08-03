# ADR-0017: Persistir el carrito como borrador en Dexie

- Status: Aprobado
- Date: 2026-08-03
- Deciders: Arquitectura del producto

## Context

El carrito debe sobrevivir recargas, navegación a caja y actualizaciones PWA. Alternativas:
`localStorage`, estado React global, URL o tabla IndexedDB dedicada.

## Decision

**Un singleton `saleDrafts/main` en Dexie (schema v4).**

- Solo ítems con `productId`, `quantity`, `expectedUnitPriceCents`.
- Totales y pagos se derivan o capturan en checkout.
- Limpieza únicamente tras `completeSale` exitoso.

## Consequences

- Consistencia con el resto de persistencia local.
- Reactividad vía `useLiveQuery` en hooks especializados.
- Una transacción de venta puede leer y borrar el borrador atómicamente.
