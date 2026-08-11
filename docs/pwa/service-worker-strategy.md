# Estrategia de Service Worker

Se usa `vite-plugin-pwa` con `generateSW`, `registerType: "prompt"` y registro explícito desde
React. Workbox precachea el shell de `/` y assets generados; una `NavigationRoute` cubre únicamente
las rutas conocidas del POS. `cleanupOutdatedCaches` elimina precaches viejos.

No se usa `injectManifest`: esta fase no necesita lógica manual de fetch, sincronización en segundo
plano ni push. `generateSW` reduce código propio y conserva una política auditable. No se cachean
`/api`, archivos `.bodegix` ni datos comerciales.

Lifecycle: instalar → esperar → informar → validar blockers → `SKIP_WAITING` por acción del usuario
→ `controllerchange`/recarga. No hay `skipWaiting`, `clientsClaim` ni recarga automática. Los errores
de registro se muestran sin tocar Dexie. Un error de chunk obsoleto, si ya existe una actualización,
reactiva el prompt sin crear bucles de recarga.

TanStack/Nitro genera el precache al final del build. `scripts/sync-pwa-nitro-assets.mjs` sincroniza
tamaño, fecha y ETag finales del SW/manifest con el índice estático de Nitro para impedir respuestas
truncadas.
