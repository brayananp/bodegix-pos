# Definición de métricas diarias

- **Ventas válidas:** creadas en el día y todavía `completed`; determinan ingreso, líneas y unidades.
- **Ventas creadas y anuladas:** creadas en el día y actualmente `voided`; no son ingreso.
- **Anulaciones procesadas:** ventas cuyo `voidedAt` cae en el día, aunque fueran creadas antes.
- **Ticket promedio:** `Math.round(completedSalesCents / completedSalesCount)`, o cero sin ventas.
- **Pagos:** `amountCents` activos (`confirmed`/`manually_verified`) agrupados por método. No se usa
  `cashReceivedCents` y se compara el total con ventas válidas.
- **Flujo de efectivo:** efectivo de ventas + depósitos del día - retiros del día. Excluye apertura.
- **Diferencia:** suma informativa de `differenceCents` de sesiones cerradas durante el día.
- **Inventario:** movimientos diarios por tipo; vendidos desde ítems de ventas completadas y
  restaurados desde `sale_void`.
- **Stock:** bajo, agotado y sin movimientos son indicadores actuales, nunca stock histórico.
- **Top productos:** snapshots de ítems; para el nombre se usa el snapshot de la venta más reciente
  del periodo. Orden por unidades, ingresos y nombre; máximo cinco.
