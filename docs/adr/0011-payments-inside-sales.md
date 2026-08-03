# ADR-0011: Mantener pagos dentro del módulo de ventas

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto

## Context

¿Pagos como módulo independiente o como submódulo de ventas?

Opciones evaluadas:

1. **Módulo `payments` separado**: agregados, UI, casos de uso propios.
2. **Pagos dentro de `sales`**: `SalePayment` es una entidad hija del agregado `Sale`.
3. **Pagos en `cash`**: ligados a sesión de caja.

## Decision

**Mantener pagos dentro del módulo `sales` en el MVP (opción 2).**

```text
modules/sales/
├── domain/
│   ├── sale.ts
│   ├── sale-item.ts
│   ├── sale-payment.ts
│   └── sale-errors.ts
├── application/
├── infrastructure/
├── ui/
└── index.ts
```

Módulo `payments` independiente solo será creado cuando existan:
- pasarelas/payment gateways con contratos propios;
- webhooks;
- QR dinámico;
- reembolsos;
- credenciales por comercio;
- conciliación automática;
- múltiples proveedores de pago reales.

## Rationale

- **Reglas del MVP**: pagos son `cash | yape | plin | card | bank_transfer`, con confirmación MANUAL. No hay integración. No hay lógica propia distinta de "validar suma pagos = total".
- **Coherencia transaccional**: `completeSale` crea `sale + items + payments + stock_movements` en 1 transacción. Con `payments` separado las fronteras de transacción son más difíciles y tentativas a circular-deps.
- **Evolución reversible**: extraer `payments` cuando aparezcan las fronteras de negocio es mecánico. Insertarlo ahora y después meter lógica dentro de sales es peor.
- **Cash es transacciones internas de caja** (depósitos/retiros). Pagos son parte de la operación comercial de la venta.

## Not-implemented

- Módulo `payments` independiente.
- Pagos dentro de `cash`.
- Integración automática con pasarelas.

## Consequences

- Positivo: una sola transacción `completeSale`.
- Positivo: UI de cobro puede ser un solo componente en `sales/ui`.
- Riesgo: cuando lleguen integraciones automáticas, se deberá extraer `payments` y agregar puertos `ExternalPaymentGateway`.
  - **Plan**: en ese momento crear `modules/payments` con sus propios adaptadores y `payments/ui`; `sales` usará el puerto de pagos a través de la API pública.
- Acción: registrar `sale-payment.ts` en dominio de ventas; documentar en roadmap "Extraer módulo payments" como hito condicional a integraciones automáticas.
