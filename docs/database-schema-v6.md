# Esquema v6 — índice de total de venta

V6 conserva los datos y agrega el índice simple `totalCents` a `sales`. Permite los órdenes
`total-asc` y `total-desc` con paginación Dexie real, sin cargar todas las ventas para ordenar en
memoria. No altera campos ni filas y se registra después de v5.

El esquema vigente de `sales` es:

```text
id, &saleNumber, cashSessionId, status, createdAt, totalCents,
[status+createdAt], [cashSessionId+createdAt]
```

La migración se prueba abriendo instalaciones legacy y verificando que ventas/pagos se conservan.
