# Módulo `sales`

`sales` es propietario del carrito, ventas, ítems, pagos, historial y anulación. Expone dominio,
aplicación, infraestructura y UI mediante `src/modules/sales/index.ts`.

## Operaciones

`completeSale` valida borrador, caja, stock, precios y pagos; después crea venta/ítems/pagos,
descuenta stock, escribe movimientos `sale`, consume correlativo y limpia el borrador dentro de una
transacción.

`SaleHistoryQueries` cuenta, filtra, pagina y carga detalle/resultado. Usa índices de venta/pago,
intersección por IDs para método y consultas en lote para hijos.

`voidSale` es la única operación autorizada para anular. Exige la sesión original abierta, motivo y
confirmación exacta por pago. Su unidad de trabajo marca venta/pagos, restaura stock agrupado y crea
`sale_void`; no cambia ítems/totales/correlativo, no elimina datos y no escribe `cashMovements`.

## Relaciones

- `cash` lee ventas/pagos activos para resúmenes; no escribe el módulo.
- `inventory` no depende de `sales`; la coordinación de stock pertenece exclusivamente a las
  transacciones de completar/anular venta documentadas.
- la UI usa hooks reactivos y no accede a tablas.

## Referencias

- [Casos de venta](../use-cases/sales-use-cases.md)
- [Anular venta](../use-cases/void-sale.md)
- [Historial UI](../ui/sales-history-ui.md)
- [Integridad](../database/sale-void-integrity.md)
- [ADR 0018](../adr/0018-compensatory-sale-void.md)
