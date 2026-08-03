# Casos de uso del catálogo

## Categorías

- `createCategory`: normaliza nombre, crea identidad/timestamps y persiste con unicidad.
- `updateCategory`: exige existencia, conserva creación/estado y actualiza nombre/fecha.
- `setCategoryActiveState`: cambia estado sin borrar ni alterar productos relacionados.
- `getCategoryById` y `listCategories`: detalle y listado filtrable.

## Productos

- `createProduct`: valida nombre, código, categoría y dinero; fija stock en cero.
- `updateProduct`: exige existencia y conserva stock, creación y estado.
- `setProductActiveState`: cambia estado y vuelve a comprobar código al reactivar.
- `getProductById` y `searchProducts`: detalle, búsqueda nombre/código, filtros, orden y página.

El adaptador repite dentro de la transacción las invariantes que pueden cambiar entre la
lectura y la escritura. Los fallos esperados salen como `CatalogErrorCode`; los fallos
desconocidos se traducen a `CATALOG_PERSISTENCE_ERROR`.
