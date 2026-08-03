# Interfaz de inventario

## Página y navegación

`/inventory` usa search params Zod para pestaña, texto, categoría, actividad, estado de stock, tipo
de movimiento, página/tamaño, orden, panel y producto. Cambiar filtro reinicia la página. Abrir o
cerrar el panel conserva el contexto; recargar restaura el detalle y el botón atrás lo cierra.

La pestaña Stock ofrece búsqueda, categoría, actividad, estado y orden. Movimientos ofrece filtro
por tipo. Ambas consultas son paginadas. Las métricas muestran con stock, bajo, agotados y sin
inicializar.

## `InventorySheet`

Un solo Sheet cambia entre `detail`, `initial`, `entry`, `reconcile` y `loss`; no anida otro
Dialog/Drawer. En escritorio entra por la derecha con ancho entre 560 y 720 px. En móvil ocupa
ancho/alto completo, usa scroll interno y deja las acciones sobre la safe area.

El detalle muestra saldo grande, mínimo, estado, actividad, acciones condicionales y cinco
movimientos recientes. Stock inicial desaparece si existe historial; entrada desaparece para
inactivos; conciliación permanece; pérdida requiere saldo positivo.

## Formularios y accesibilidad

Cada operación tiene `formOptions`, valores string editables, Zod, mapeador puro y un bloque
`withForm`. Los campos se renderizan mediante `AppField` y los controles registrados dentro de
`AppForm`. Se reutilizan `IntegerField`, `TextField`, `SelectField`, `TextareaField`, acciones,
error global y `UnsavedChangesGuard`.

Las vistas previas expresan texto, signo, saldo actual y resultante. Los labels están asociados,
los errores usan semántica de alerta, el Sheet tiene título/descripción, los estados no dependen
solo del color y los objetivos principales conservan tamaño táctil.
