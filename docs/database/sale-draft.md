# Borrador del carrito (`saleDrafts`)

## Por qué persistir

El carrito sobrevive recargas, navegación a caja, actualizaciones PWA y cierre temporal del
navegador. No se usa `localStorage` ni estado React no persistido.

## Esquema (v4)

Singleton `id: "main"` con `items[]` y `updatedAt`. Cada ítem:

```typescript
{ productId, quantity, expectedUnitPriceCents }
```

No se persisten totales, nombres, pagos ni vuelto.

## Lifecycle

- Creado al agregar el primer producto.
- Actualizado en cada cambio de cantidad o precio esperado.
- Eliminado tras venta exitosa (`completeSale`).
- `clear` manual con confirmación (`AlertDialog`).

## Revisión

`reviewSaleDraft` compara contra catálogo actual. Precios cambiados requieren acción explícita
«Actualizar precios» (`refreshPrices`).

## Migración

Schema v4 agrega `saleDrafts: "id, updatedAt"` sin datos de ejemplo ni índices internos en ítems.
