# Production checklist

- [ ] Versión, commit, tag, release notes e impacto DB correctos.
- [ ] Frozen install y `release:check` exitosos en CI.
- [ ] Bundle, SBOM/licencias y tar generados.
- [ ] Artifact staged desplegado sin rebuild.
- [ ] Smoke, E2E staging, PWA, offline y actualización A → B exitosos.
- [ ] CSP, headers, MIME y cache reales verificados.
- [ ] Backup/restore usa datos sintéticos; compatibilidad confirmada.
- [ ] `PRODUCTION_URL`, HTTPS, canonical origin y scope SW confirmados.
- [ ] Aprobación GitHub Environment registrada.
- [ ] Promoción completada; smoke production no destructivo exitoso.
- [ ] Artifact anterior compatible disponible para rollback, o forward-fix preparado.
