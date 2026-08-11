# Comportamiento offline

Después de completar una primera visita con red y quedar bajo control del Service Worker funcionan:

- Venta, productos e inventario.
- Caja e historial de ventas.
- Resumen y configuración.
- Creación y descarga de respaldo `.bodegix`.

Las rutas `/sale`, `/products`, `/inventory`, `/cash`, `/sales`, `/summary` y `/settings` tienen
fallback de navegación. Los datos permanecen en IndexedDB y no se copian al Cache Storage.

La primera visita necesita red. El indicador `navigator.onLine` es orientativo: avisa sobre la
interfaz de red, no garantiza acceso real a Internet. Un 404 desconocido no se transforma en una
ruta del POS porque el allowlist solo cubre rutas reales. No hay Background Sync ni Push.
