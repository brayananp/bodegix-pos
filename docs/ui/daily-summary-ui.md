# UI del resumen diario

`/summary` es una página completa del App Shell, no un Sheet. Sus search params son `date` nullable
y `section=overview|sales|cash|inventory`. Los controles permiten día anterior, hoy y día siguiente;
este último se deshabilita en el hoy comercial.

La cabecera muestra el estado del día y cinco KPI: ventas válidas, total, ticket promedio, unidades
y anulaciones procesadas. Las pestañas contienen visión general, ventas/pagos, caja e inventario.
La visión general muestra ranking, ventas recientes y checklist. Hay enlaces tipados a `/sales`,
`/cash`, `/inventory`, `/sale` y al diagnóstico en Configuración.

La pantalla usa skeletons, error con reintento, estados vacíos, semántica de alertas y controles con
nombre accesible. En móvil conserva una columna, KPI en dos columnas y no crea scroll horizontal.
Las alertas de stock histórico se etiquetan siempre “Estado actual del inventario”.
