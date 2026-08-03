# Módulo: sales

## Responsabilidad

Ventas, ítems de venta, pagos y anulaciones.

## Límites del módulo

- **Incluye:** Sale, SaleItem, SalePayment, carrito, cobro, voidSale
- **Incluye:** pagos (el módulo payments NO existe separado en el MVP)
- **Excluye:** stock (→ `inventory`), productos (→ `catalog`), caja (→ `cash`)

## Estado actual

Fase 0: solo se define el límite del módulo y la API pública.
Las carpetas `domain/`, `application/`, `infrastructure/`, `ui/` existen como estructura
pero estarán vacías hasta la Fase 2+.

## Próxima fase (Fase 2+)

```
sales/
├── domain/
│   ├── sale.ts             Entidad principal
│   ├── sale-item.ts
│   ├── sale-payment.ts     Pago pertenece a sales
│   └── sale-errors.ts
├── application/
│   ├── complete-sale.ts    Caso de uso transaccional principal
│   └── void-sale.ts
├── infrastructure/
│   └── complete-sale-unit-of-work.ts  Implementación Dexie
├── ui/
│   ├── sale-checkout-dialog.tsx
│   └── use-cart.ts
└── index.ts
```
