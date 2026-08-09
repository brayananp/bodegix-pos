# UI del historial de ventas

El historial es el ítem **Historial** de la navegación principal y abre la ruta independiente
`/sales`; no es una pestaña de `/sale`, porque el punto de venta y la auditoría tienen objetivos y
estados distintos. Solo el ítem cuya ruta coincide por segmento se marca activo, evitando que
`/sales` active también `/sale`.

`/sales` muestra el historial paginado con tamaños 25, 50 y 100. La URL conserva `q`, `status`,
`paymentMethod`, `range`, `from`, `to`, `cashSessionId`, `page`, `pageSize`, `sort`, `panel` y
`saleId`; el motivo, las confirmaciones y las referencias de devolución nunca se serializan.

Los rangos disponibles son hoy, últimos 7 días, este mes, todo y personalizado, interpretados en
`America/Lima`. Cambiar un filtro vuelve a la página 1 y una página inválida se corrige.

Escritorio usa tabla; móvil usa tarjetas compactas. Un único Sheet lateral (pantalla completa en
móvil, 720 px en escritorio) mantiene el flujo `detail → void → void-result`. Atrás conserva los
filtros y vuelve al modo anterior. El detalle usa snapshots de ítems/pagos, muestra la sesión y los
movimientos `sale`/`sale_void`.

La interfaz distingue base vacía de filtros sin resultados, tiene encabezados/labels, foco visible,
objetivos táctiles, estados expresados con texto, resultado anunciado y guard de cambios sin guardar.
