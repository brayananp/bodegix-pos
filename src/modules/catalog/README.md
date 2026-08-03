# Módulo: catalog

## Responsabilidad

Gestión de productos y categorías del catálogo de la bodega.

## Límites del módulo

- **Incluye:** productos, categorías, ciclo de vida activo/inactivo, búsqueda
- **Excluye:** stock (→ `inventory`), ventas (→ `sales`), precios dinámicos

## Estado actual

Fase 0: solo se define el límite del módulo y la API pública.
No contiene lógica funcional todavía.

## Próxima fase (Fase 1+)

```
catalog/
├── domain/         Entidades Product, Category; value objects; invariantes
├── application/    Casos de uso: createProduct, updateProduct, deactivateProduct
├── infrastructure/ Adaptadores Dexie: CatalogDexieRepository
├── ui/             Componentes React específicos del catálogo
└── index.ts        API PÚBLICA — único punto de entrada al módulo
```

## API pública (index.ts)

Importa solo desde `@/modules/catalog`, nunca desde rutas internas.
