# UI del catálogo

`/products` es la única ruta de la Fase 2. La ruta valida search params y monta
`CatalogPage`; no consulta Dexie ni define formularios. La página ofrece tabs Productos
y Categorías, filtros visibles, tabla en escritorio y tarjetas compactas en móvil.

El producto muestra nombre, categoría, código, precio, stock y estado. Sus acciones son
ver, editar y desactivar/reactivar. La categoría ofrece editar y cambio de estado. No
existen acciones de vender, ajustar stock, eliminar, importar o exportar.

Todos los overlays tienen título/descripción, cierre controlado, manejo de foco de Base
UI y botones con texto. Los campos poseen labels asociados, estados inválidos y errores
anunciables. El pie móvil usa área segura y los controles principales mantienen objetivos
táctiles adecuados.
