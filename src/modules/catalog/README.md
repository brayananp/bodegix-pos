# Módulo: catalog

## Responsabilidad

Gestión de productos y categorías del catálogo de la bodega.

## Límites del módulo

- **Incluye:** productos, categorías, ciclo de vida activo/inactivo, búsqueda
- **Excluye:** stock (→ `inventory`), ventas (→ `sales`), precios dinámicos

## Estado actual

Fase 2 implementada: dominio, casos de uso, puertos, adaptador Dexie, consultas
reactivas, formularios compuestos y UI responsive en `/products`.

## Estructura

```
catalog/
├── domain/         Product, Category, normalización y errores tipados
├── application/    Comandos, consultas y puertos específicos
├── infrastructure/ Store y queries Dexie transaccionales
├── ui/             Formularios, hooks, listas, página y overlays
└── index.ts        API pública del módulo
```

## API pública (index.ts)

Importa solo desde `@/modules/catalog`, nunca desde rutas internas.
