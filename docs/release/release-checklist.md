# Release checklist — 0.1.0

Estado objetivo: Release Candidate, sin publicación automática.

- [x] Versión `0.1.0` confirmada; continúa como MVP pre-1.0.
- [x] `pnpm install --frozen-lockfile` reproduce dependencias.
- [x] `pnpm audit --audit-level=high` sin vulnerabilidades conocidas.
- [x] Licencias revisadas y SBOM CycloneDX generado con `pnpm release:artifacts`.
- [x] `pnpm check:bundle` respeta budgets y no publica source maps.
- [x] Unitarias, integración, arquitectura y datasets 10k/50k pasan.
- [x] E2E, PWA, Axe y smoke de producción pasan localmente.
- [x] CSP y headers verificados sobre el servidor Nitro real.
- [x] Venta, anulación, caja, inventario, resumen, backup y restore cubiertos por pruebas.
- [x] Offline conserva IndexedDB; actualización no borra datos.
- [ ] Navegación keyboard, foco, zoom, mobile y desktop revisados.
- [ ] Chromium y WebKit pasan localmente; confirmar Firefox en CI Linux.
- [ ] HTTPS/HSTS se decide en deployment; no activar HSTS en localhost.
- [x] Backups reales, `.env` y artefactos de test no están versionados.
- [x] Release notes y limitaciones conocidas acompañan el candidato.
- [x] `pnpm release:check` final pasa.

La aprobación humana final debe comprobar instalación PWA, operación offline, descarga/restore de un
respaldo sintético y actualización entre dos builds antes de publicar.
