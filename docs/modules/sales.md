# Módulo sales

## Responsabilidad

Orquestar el flujo transaccional de venta: carrito persistido, revisión contra catálogo/inventario,
cobro con pagos mixtos y persistencia atómica.

## Límites

- Propietario de `sales`, `saleItems`, `salePayments`, `saleDrafts`, reglas de carrito/checkout,
  `completeSale`, historial de ventas y anulación de transacciones.
- No implementa reportes analíticos, exportaciones ni integraciones de pago automáticas (futuras fases).
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

**Implementado en Fase 6:**
- Historial de ventas con búsqueda y filtros (`/sales`)
- Detalle completo de venta en Sheet responsive
- Anulación compensatoria de ventas con reglas estrictas
- Validación: solo anular ventas de sesión actual abierta
- Devolución automática de stock al inventario
- Marcado de pagos como anulados
- Registro obligatorio de motivo (5-240 caracteres)
- Transacción ACID de anulación en 4 tablas
- Esquema v5 con campos `voidedAt` y `voidReason`
- 13 pruebas E2E de historial y anulación

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

**Carrito y venta:**
- `SaleDraftStore` — carrito persistido
- `CompleteSaleUnitOfWork` — transacción de venta

**Historial y anulación:**
- `SaleHistoryQueries` — búsqueda y filtrado de ventas
- `VoidSaleUnitOfWork` — transacción de anulación

**Consultas:**
- `SaleProductQueries` — productos para venta
- `SaleResultQueries` — resultado de venta

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
│   ├── sale-void-rules.ts         Reglas de elegibilidad para anular
│   ├── sale-void-eligibility.ts   DTO de elegibilidad de anulación
│   └── sale-errors.ts             Errores tipados del dominio (6 códigos de void)
├── application/
│   ├── ports/
│   │   ├── sale-draft-store.ts           Puerto para persistencia de borrador
│   │   ├── complete-sale-unit-of-work.ts Puerto para transacción de venta
│   │   ├── void-sale-unit-of-work.ts     Puerto para transacción de anulación
│   │   ├── sale-product-queries.ts       Puerto para consulta de productos
│   │   ├── sale-result-queries.ts        Puerto para resultado de venta
│   │   └── sale-history-queries.ts       Puerto para historial y búsqueda
│   ├── commands/
│   │   ├── complete-sale.ts              Comando de completar venta
│   │   └── void-sale.ts                  Comando de anular venta
│   └── queries/
│       ├── review-sale-draft.ts          Comparación borrador vs catálogo
│       ├── get-sale-history.ts           Query con filtros y paginación
│       ├── get-sale-detail.ts            Query de detalle completo
│       └── get-sale-void-eligibility.ts  Query de elegibilidad para anular
├── infrastructure/
│   ├── dexie-sale-draft-store.ts         Implementación Dexie del store
│   ├── dexie-complete-sale-unit-of-work.ts  Transacción atómica completa
│   ├── dexie-void-sale-unit-of-work.ts     Transacción de anulación ACID
│   ├── dexie-sale-product-queries.ts     Queries de productos para venta
│   ├── dexie-sale-result-queries.ts      Reconstrucción de resultado
│   ├── dexie-sale-history-queries.ts     Búsqueda y filtrado de ventas
│   └── sale-record-mappers.ts            Mapeo domain ↔ records
└── ui/
    ├── pages/
    │   ├── sale-page.tsx                 Página principal /sale
    │   └── sales-history-page.tsx        Página de historial /sales
    ├── components/
    │   ├── sale-product-search.tsx       Búsqueda de productos
    │   ├── sale-product-grid.tsx         Grid de productos
    │   ├── sale-cart.tsx                 Vista del carrito
    │   ├── sale-completed-result.tsx     Resultado post-venta
    │   ├── sale-draft-issues.tsx         Alertas de validación
    │   ├── sale-detail-sheet.tsx         Sheet de detalle de venta
    │   ├── void-sale-form.tsx            Formulario de anulación
    │   └── responsive-dialog-drawer.tsx  Dialog/Drawer responsive
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
        ├── use-complete-sale.ts          Hook para completar venta
        ├── use-sale-history.ts           Hook para historial de ventas
        ├── use-sale-detail.ts            Hook para detalle de venta
        ├── use-sale-void-eligibility.ts  Hook de elegibilidad
        └── use-void-sale-action.ts       Hook de anulación
```

## Documentación relacionada

- [Casos de uso](../use-cases/sales-use-cases.md)
- [UI](../ui/sale-ui.md)
- [Integridad](../database/sale-integrity.md)
- [Borrador](../database/sale-draft.md)
- [Esquema v4](../database-schema-v4.md)
- [Esquema v5](../database-schema-v5.md)
- [Resumen Fase 6](../PHASE-6-SUMMARY.md)
- [Verificación manual](../payments/manual-payment-verification.md)
- [ADR: Sale Draft Persistence](../adr/0017-sale-draft-persistence.md)
- [ADR: Payments inside Sales](../adr/0011-payments-inside-sales.md)
