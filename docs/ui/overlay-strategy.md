# Estrategia de overlays

## Elección de superficie

- Página: flujos primarios o entidades con varias capacidades relacionadas y navegación propia.
- Dialog: formulario breve de escritorio que requiere foco modal.
- Drawer: equivalente móvil de un formulario breve, con acciones táctiles accesibles.
- Sheet: flujo contextual mediano/largo que debe conservar visible la lista de origen.
- AlertDialog: confirmación que interrumpe y exige una decisión explícita.

## Catálogo

`ProductSheet` concentra `create`, `detail` y `edit`. En escritorio sale desde la derecha
con 640 px; en móvil ocupa `100dvw × 100dvh`. Su encabezado y pie no se desplazan, el
cuerpo sí y el pie respeta `safe-area-inset-bottom`. Detalle→edición cambia el modo del
mismo Sheet, por lo que nunca abre otro formulario encima.

`ResponsiveDialogDrawer` decide una sola variante montada: Dialog en escritorio o
Drawer en móvil. El contenido es una única instancia de `CategoryForm`. Crear/editar
categoría nunca usa Sheet ni duplica el formulario.

Desactivar/reactivar y descartar cambios usan AlertDialog controlado. Está prohibido
`window.confirm`, `window.alert`, Dialog sobre Sheet y Drawer dentro de Drawer.

## URL, atrás y evolución

`tab`, búsqueda, filtros, orden, página, tamaño, `panel`, `productId` y `categoryEditId`
son search params Zod de `/products`. Abrir un panel agrega una entrada de historial;
atrás la retira y cierra el panel. Los cierres explícitos reemplazan la entrada actual y
conservan filtros. Los valores del formulario nunca se escriben en la URL.

Una ruta `/products/:productId` será apropiada cuando el producto reúna varias áreas,
por ejemplo general, inventario, ventas, compras, proveedores y auditoría. En Fase 2 la
decisión deliberada es lista principal + panel contextual.
