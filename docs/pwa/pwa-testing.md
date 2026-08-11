# Pruebas PWA

`pnpm dev` deshabilita el Service Worker y no demuestra precache, lifecycle ni navegación offline.
Las pruebas válidas ejecutan `pnpm build` y el servidor Node de `.output`.

- `pnpm test:pwa`: build real + Playwright Chromium con Service Workers habilitados.
- `pnpm test:pwa:headed`: mismo flujo visible.
- `pnpm check:full`: formato, lint, tipos, unitarias, build, E2E funcional y E2E PWA.

Playwright valida manifest/iconos, registro/control, contenido del precache, rutas directas offline,
persistencia IndexedDB y operaciones offline de venta, caja y respaldo. Vitest cubre estado de
instalación, conectividad, safety blockers, UI y reconocimiento de chunks obsoletos.

Actualización e instalación nativa requieren además prueba manual: construir versión A, abrirla,
publicar versión B, comprobar worker `waiting`, posponer, bloquear con formulario/checkout/restore,
liberar, actualizar y confirmar que IndexedDB permanece. La UI del sistema operativo no se simula
como E2E estable; se prueba estado y se documentan límites por navegador.
