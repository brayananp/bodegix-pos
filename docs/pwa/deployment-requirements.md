# Requisitos de despliegue PWA

- Servir por HTTPS; localhost solo es excepción de desarrollo/prueba.
- Mantener el scope del Service Worker en `/` y publicar `/sw.js` sin redirecciones.
- Servir `manifest.webmanifest` como `application/manifest+json`.
- Permitir el fallback SPA solo para rutas conocidas; conservar 404 reales para otras rutas.
- Assets con hash: caché larga e inmutable. HTML/shell, SW y manifest: revalidación/no-cache.
- No aplicar CSP que impida el Service Worker, manifest, fuentes o scripts propios.

Verificación independiente del proveedor: abrir `/manifest.webmanifest` y `/sw.js`, comprobar MIME,
registrar/controlar desde DevTools, recargar cada ruta directa sin red, confirmar precache sin `/api`
ni `.bodegix`, ejecutar una operación Dexie, volver online y probar una actualización diferida.

Si el host implementa rewrites, `/sw.js`, manifest, iconos y assets deben resolverse antes del
fallback HTML. Los headers recomendados deben validarse contra la respuesta desplegada, no solo la
configuración local.
