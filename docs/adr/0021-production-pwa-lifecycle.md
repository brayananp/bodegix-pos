# ADR 0021: PWA de producción con actualización controlada

## Estado

Aceptado.

## Decisión

Usar `vite-plugin-pwa`, `generateSW`, `registerType: prompt`, `display: standalone`, `start_url:
/sale` y orientación `any`. Precachear solo shell/assets; mantener datos comerciales exclusivamente
en Dexie. El Service Worker no ejecuta lógica comercial.

No usar `autoUpdate`, `injectManifest`, Background Sync, Push ni Service Worker en desarrollo normal.
La instalación es progressive enhancement y no depende de `beforeinstallprompt`.

Una actualización requiere acción explícita y queda bloqueada por dirty forms, checkout, restore,
mantenimiento u operaciones críticas. Las pruebas PWA se ejecutan sobre build de producción.

## Consecuencias

La app puede operar sin red tras la primera carga y actualizarse sin interrumpir transacciones.
Dexie permanece independiente del ciclo de Cache Storage. Funciones de sincronización o push
requerirán una decisión futura y no se infieren de esta ADR.
