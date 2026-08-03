# Módulo catalog

## Responsabilidad y límites

Administra productos, categorías y su ciclo de vida lógico. Expone dominio, comandos,
consultas y la página pública mediante `src/modules/catalog/index.ts`. No administra
movimientos de stock, ventas, caja, respaldo ni servicios remotos.

## Capas

- `domain`: entidades, normalización, reglas escalares y `CatalogErrorCode`.
- `application`: seis comandos, cuatro consultas y puertos específicos.
- `infrastructure`: store y consultas Dexie, con transacciones e índices v1.
- `ui`: formularios compuestos, hooks `useLiveQuery`, listas y overlays.

La categoría normalizada es única globalmente. El código es único entre productos
activos. Las relaciones históricas permanecen aunque una categoría se desactive.
Producto nuevo inicia en stock cero y toda mutación de catálogo conserva el stock.
