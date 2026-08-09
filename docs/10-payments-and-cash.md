# 10. Pagos y caja

## Límite de módulo

> Los pagos NO son un módulo independiente en el MVP. Viven dentro de `modules/sales` (ref: [ADR-0011](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0011-payments-inside-sales.md)).

- `Sale`, `SaleItem`, `SalePayment` pertenecen al agregado `Sale`.
- La operación crítica que coordina venta + items + pagos + stock + correlativo es `completeSale`, en 1 transacción Dexie.
- Caja es el módulo `cash` (sesiones de caja abiertas/cerradas y depósitos/retiros).

La extracción a `modules/payments` se activa solamente cuando existan integraciones automáticas (pasarelas, webhooks, conciliación), no antes.

## Principio

La aplicación registra y concilia pagos. En el MVP no procesa pagos externos.

## Métodos

| Método | Confirmación | Afecta efectivo físico |
|---|---|---:|
| Efectivo | Local | Sí |
| Yape | Manual | No |
| Plin | Manual | No |
| Tarjeta | Manual después de POS externo | No |
| Transferencia | Manual | No |

## Pago mixto

No se almacena como método.

Ejemplo:

```json
[
  {
    "method": "cash",
    "amountCents": 2000,
    "status": "confirmed"
  },
  {
    "method": "yape",
    "amountCents": 3000,
    "status": "manually_verified"
  }
]
```

La venta es mixta porque tiene dos pagos.

## Validación

```text
sum(payment.amountCents) = sale.totalCents
```

No se permite:

- monto cero;
- monto negativo;
- pago externo sin confirmación;
- importe total superior al total, salvo efectivo recibido modelado por separado.

## Efectivo y vuelto

Ejemplo:

```text
Total: S/17.50
Efectivo aplicado: S/17.50
Recibido: S/20.00
Vuelto: S/2.50
```

Persistencia:

- `amountCents = 1750`;
- `cashReceivedCents = 2000`;
- `changeCents = 250`.

El monto del pago es el aplicado a la venta, no el billete recibido.

## Yape y Plin

Flujo:

1. Mostrar monto.
2. Mostrar QR configurado.
3. Usuario revisa aplicación oficial.
4. Registrar referencia opcional.
5. Confirmar manualmente.

Advertencia:

> Verifica el ingreso directamente. No aceptes capturas de pantalla como confirmación.

## Tarjeta

Flujo:

1. Mostrar monto.
2. Cobrar en POS externo.
3. Confirmar aprobación.
4. Registrar proveedor y referencia opcionales.

Datos prohibidos:

- PAN completo;
- CVV;
- PIN;
- fecha de vencimiento;
- foto de tarjeta.

## Transferencia

- Registrar banco o etiqueta opcional.
- Referencia opcional.
- Confirmar ingreso manualmente.

## Apertura de caja

Campos:

- efectivo inicial;
- fecha y hora.

Precondición:

- no existe caja abierta.

## Movimientos manuales

### Depósito

Dinero agregado físicamente a la caja sin ser venta.

### Retiro

Dinero retirado físicamente.

Ambos exigen motivo.

## Cierre

Cálculos:

```text
expectedCash =
  openingCash
  + cashSales
  + deposits
  - withdrawals
```

```text
difference =
  countedCash
  - expectedCash
```

Resumen adicional:

```text
Yape esperado
Plin esperado
Tarjeta esperada
Transferencias esperadas
Ventas anuladas
```

## Anulación

Una venta anulada:

- no se elimina;
- revierte inventario;
- marca pagos como anulados;
- se resta de totales netos;
- queda visible en auditoría.

En el MVP no se automatiza devolución del dinero. La devolución física o externa se realiza fuera de la aplicación y se deja documentada en el motivo.

## Estado Fase 4

Caja ya agrega pagos persistidos confirmados o verificados manualmente por método y excluye ventas
o pagos anulados. Usa `amountCents`, nunca `cashReceivedCents`; solo efectivo entra en la fórmula.
La creación de ventas y pagos queda reservada para la Fase 5.

## Reversión en Fase 6

Cada pago original requiere confirmación manual. Efectivo guarda referencia nula; Yape, Plin,
tarjeta y transferencia admiten referencia opcional. No hay integración automática ni pagos
negativos. Al quedar venta/pagos `voided`, el resumen vivo de caja los excluye sin crear retiros.
