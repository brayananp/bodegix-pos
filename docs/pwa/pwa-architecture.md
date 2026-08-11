# Arquitectura PWA

```text
React / TanStack Start
        │
        ▼
Service Worker
        │
        ├── App shell
        └── Assets estáticos

Dexie / IndexedDB
        │
        └── Datos comerciales

Backup
        │
        └── Archivo externo .bodegix
```

La PWA añade disponibilidad del shell; no cambia el modelo local-first. El Service Worker solo
cachea código, estilos, fuentes e iconos. No contiene reglas comerciales, ventas, stock, caja,
respaldos ni copias de IndexedDB. Dexie sigue siendo la única fuente de datos del negocio y el
archivo `.bodegix` la frontera portable controlada por el usuario.

`PwaProvider` coordina conectividad, instalación y lifecycle de actualización. El coordinador de
seguridad agrega blockers de formularios dirty, checkout, restauración, mantenimiento y operaciones
críticas antes de permitir activar un Service Worker en espera.
