# Performance baseline

Fecha: 2026-08-11. Versión: `0.1.0`. Medición local Windows 11 `10.0.26200`, Ryzen 7 7435HS (8C/16T),
27.7 GiB RAM, Node 24.14.1, pnpm 11.20.0, Vite 8.2.0. Todos los números comparados provienen del mismo
equipo y comando de producción.

| Métrica | Inicial | Final/budget |
|---|---:|---:|
| Build completo | 17.0 s | 25.6 s / informativo |
| Archivos públicos | 37 | 44 / sin límite aislado |
| Bytes públicos | 1,865,444 | 1,873,423 / 1,950,000 |
| Archivos JavaScript | 15 | 22 / estructural |
| Bytes JavaScript | 1,359,961 | 1,368,112 / 1,420,000 |
| Chunk mayor | 597,985 | 820,850 / 1,100,000 |
| Source maps públicos | 0 | 0 / 0 |

El total crece 8,151 bytes por error boundary, seguridad y pruebas de release. La mejora no se basa en
el chunk máximo: antes siete rutas eran stubs de ~70 bytes que importaban dos chunks compartidos de
578/598 kB. Imports directos separan páginas reales en chunks de ruta (~23–64 kB) y reducen código de
negocio cargado por rutas no visitadas. El chunk común final queda justificado por React, Router,
Dexie, Base UI, shell y providers globales. Un intento de chunking manual rompió orden de ejecución de
Base UI durante prerender y fue descartado.

`check:bundle` bloquea regresiones de bytes, chunk máximo y source maps. Los tiempos absolutos no
bloquean CI.

## Datos grandes

`test:performance` usa IndexedDB real y datos sintéticos descartables: 10,000 productos y 50,000
ventas; solo la página reciente agrega ítems/pagos porque el objetivo es paginación. Catálogo usa una
búsqueda O(n) en memoria para substring; es aceptable en 10k, pero queda como límite. Historial usa
índices de fecha/estado/total/sesión, pagina antes de hidratar y agrupa ítems/pagos con dos consultas,
sin N+1 por fila. Corrida local: catálogo completo 7.1 s; historial completo 3.7 min, dominado por la
siembra de 50,000 registros. Los tiempos son informativos y dependientes del hardware. Los fixtures
viven en E2E y no entran al bundle.

## Reactividad

`useLiveQuery` aparece solo en hooks UI. Dependencias dinámicas (`date`, IDs, retry keys) están
declaradas; consultas Dexie observan las tablas leídas. No se añadió memoización ni virtualización sin
medición que lo justifique.
