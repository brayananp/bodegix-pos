# Deployment Vercel — Fase 11

Estado: `READY_FOR_DEPLOYMENT`. Proveedor: Vercel. Hosting: estático mediante Build Output API v3.
Dominio, URL de preview y URL de producción aún no están configurados.

## Artifact y flujo

`pnpm build` genera `.vercel/output`: `static/` contiene únicamente HTML, JS, CSS, PWA, iconos y
`release.json`; `config.json` contiene rutas y headers. CI empaqueta esos bytes como
`bodegix-pos-<version>-<sha7>.tar.gz`.

Flujo: PR → `release:check` → build único → artifact → deployment Vercel `--prebuilt --prod
--skip-domain` → smoke staging → aprobación GitHub Environment `production` → `vercel promote` →
smoke no destructivo. Promoción no reconstruye. Desactivar despliegue Git automático de Vercel para
evitar builds paralelos no validados.

## Configuración inicial

1. Crear proyecto Vercel y mantener root `/`; no agregar framework/server.
2. Desactivar **Auto-assign Custom Production Domains** hasta aprobación.
3. Crear GitHub Environments `preview` y `production`; exigir aprobación en `production`.
4. Guardar `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` como secrets de environments.
5. Cuando exista dominio, guardar `PRODUCTION_URL` como variable de `production`, confirmar HTTPS y
   elegir apex o `www` como origen canónico.
6. Ejecutar workflow `Deploy Vercel` desde un `Release gate` exitoso.

Nada anterior es variable `VITE_*`; ningún secret entra al frontend. Vercel CLI queda fijado en
`58.0.0`. HSTS permanece deshabilitado hasta conocer dominio/subdominios definitivos.

## Rutas, caché y seguridad

Solo `/`, `/sale`, `/products`, `/inventory`, `/cash`, `/sales`, `/summary` y `/settings` reciben
shell SPA. Filesystem se evalúa primero: asset faltante responde 404, nunca HTML. Assets con hash:
un año `immutable`; shell, SW, manifest y `release.json`: revalidación inmediata.

Headers configurados: CSP, COOP, Permissions-Policy, Referrer-Policy, `nosniff` y `DENY`. CSP permite
solo recursos propios, `data:`/`blob:` necesarios y `unsafe-inline` requerido por shell actual.

## Operación

- Staging: `DEPLOY_URL=https://... pnpm deploy:smoke`.
- Producción: mismo smoke; no crea ventas ni toca IndexedDB.
- Artifact retention: 30 días. Evidencia: 14 días.
- Tags manuales `v<package.json version>` solo después de aprobación. Release notes deben identificar
  versión, commit, artifact, impacto DB y deployment.
- Datos permanecen en IndexedDB del dispositivo. Deploy nunca los copia, migra, borra o restaura.

## Verificación humana staging

Además del smoke HTTP: instalar PWA, primera carga online, recargar rutas offline, revisar SW waiting →
active sin loops, ejecutar datos sintéticos, backup/restore sintético y actualización controlada A → B.
Validar headers reales desde respuestas Vercel.
