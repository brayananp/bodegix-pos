# Módulo sales

## Responsabilidad

Orquestar el flujo transaccional de venta: carrito persistido, revisión contra catálogo/inventario,
cobro con pagos mixtos y persistencia atómica.

## Límites

- Propietario de `sales`, `saleItems`, `salePayments`, `saleDrafts`, reglas de carrito/checkout y
  `completeSale`.
- No implementa anulaciones, historial administrativo ni integraciones de pago automáticas (futuras fases).
- `catalog`, `inventory` y `cash` no dependen de `sales`.

## Estado actual

**Implementado en Fase 5:**
- Carrito persistido (`saleDrafts`) con sobrevivencia a recargas
- Búsqueda de productos por nombre, código de barras y categoría
- Gestión de cantidades con validación de stock
- Revisión automática de cambios de precio
- Checkout con pagos mixtos (efectivo, Yape, Plin, POS, transferencia)
- Transacción atómica `completeSale` con 8 tablas
- Resultado de venta con snapshots de productos vendidos
- Validación de sesión de caja abierta
- Interfaz responsive (desktop con panel dividido, móvil con sheet)
- Pruebas unitarias, de integración y E2E completas

## Relaciones

| Módulo | Rol |
|--------|-----|
| catalog | Consulta productos/categorías para venta |
| inventory | Reglas de stock; movimientos `sale` en transacción autorizada |
| cash | Sesión abierta obligatoria; resumen desde ventas/pagos |

## Venta atómica

Una venta existe solo si se confirman juntos: Sale, ítems, pagos, movimientos, stock, correlativo y
limpieza del borrador.

## Snapshots

Ítems guardan `productName`, `unitPriceCents`, `unitCostCents` al confirmar.

## Pagos

Métodos: `cash`, `yape`, `plin`, `card`, `bank_transfer`. Pagos mixtos = varios `SalePayment`. No
existe `mixed`.

## Puertos

- `SaleDraftStore` — carrito persistido
- `CompleteSaleUnitOfWork` — transacción de venta
- `SaleProductQueries` / `SaleResultQueries` — lecturas

## Estructura del módulo

```
sales/
├── domain/
│   ├── sale.ts                    Entidad Sale con reglas de negocio
│   ├── sale-item.ts               Value object para ítems
│   ├── sale-payment.ts            Value object para pagos
│   ├── sale-draft.ts              Value object para borrador
│   ├── payment-allocation.ts      Lógica de distribución de pagos
│   ├── sale-rules.ts              Validaciones de negocio
│   ├── sale-totals.ts             Cálculos de totales y vuelto
│   └── sale-errors.ts             Errores tipados del dominio
├── application/
│   ├── ports/
│   │   ├── sale-draft-store.ts           Puerto para persistencia de borrador
│   │   ├── complete-sale-unit-of-work.ts Puerto para transacción de venta
│   │   ├── sale-product-queries.ts       Puerto para consulta de productos
│   │   └── sale-result-queries.ts        Puerto para resultado de venta
│   └── queries/
│       └── review-sale-draft.ts          Comparación borrador vs catálogo
├── infrastructure/
│   ├── dexie-sale-draft-store.ts         Implementación Dexie del store
│   ├── dexie-complete-sale-unit-of-work.ts  Transacción atómica completa
│   ├── dexie-sale-product-queries.ts     Queries de productos para venta
│   ├── dexie-sale-result-queries.ts      Reconstrucción de resultado
│   └── sale-record-mappers.ts            Mapeo domain ↔ records
└── ui/
    ├── pages/
    │   └── sale-page.tsx                 Página principal /sale
    ├── components/
    │   ├── sale-product-search.tsx       Búsqueda de productos
    │   ├── sale-product-grid.tsx         Grid de productos
    │   ├── sale-cart.tsx                 Vista del carrito
    │   ├── sale-completed-result.tsx     Resultado post-venta
    │   └── sale-draft-issues.tsx         Alertas de validación
    ├── forms/
    │   └── checkout/
    │       ├── checkout-form.tsx         Formulario de pago
    │       ├── payment-allocation-fields.tsx  Campos de pagos múltiples
    │       └── checkout-form.mappers.ts  Transformaciones de datos
    ├── overlays/
    │   └── sale-mobile-sheet.tsx         Sheet móvil para carrito/checkout
    └── hooks/
        ├── use-sale-draft.ts             Hook para gestión del carrito
        ├── use-sale-draft-review.ts      Hook para revisión de cambios
        └── use-complete-sale.ts          Hook para completar venta
```

## Documentación relacionada

- [Casos de uso](../use-cases/sales-use-cases.md)
- [UI](../ui/sale-ui.md)
- [Integridad](../database/sale-integrity.md)
- [Borrador](../database/sale-draft.md)
- [Esquema v4](../database-schema-v4.md)
- [Verificación manual](../payments/manual-payment-verification.md)
- [ADR: Sale Draft Persistence](../adr/0017-sale-draft-persistence.md)
- [ADR: Payments inside Sales](../adr/0011-payments-inside-sales.md)
