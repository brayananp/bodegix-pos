# Matriz de compatibilidad

Versiones independientes; actualizar `release.config.json` y esta matriz en cada release.

| App | Dexie schema | Backup format | Backup mínimo | Impacto DB | ¿Rollback frontend? |
| --- | ---: | ---: | ---: | --- | --- |
| 0.1.0 | 7 | 1 | 1 | `none` | Sí, tras smoke y verificación PWA |

Impactos válidos: `none`, `backward_compatible`, `forward_only`. Solo usar `backward_compatible` con
prueba A → B → frontend A. `forward_only` prohíbe rollback frontend: aplicar forward-fix. Nunca crear
downgrade Dexie. Backup format y schema DB no siguen automáticamente versión app.

Para release `forward_only`, UI muestra versión/impacto y recomienda respaldo manual antes de activar
SW. Migración especialmente riesgosa puede exigir respaldo solo mediante decisión explícita documentada.
