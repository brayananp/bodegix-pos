# Security review

## Modelo de amenaza

Bodegix guarda información comercial local. Riesgos principales: XSS que lea IndexedDB, archivo de
respaldo expuesto, dependencia comprometida, dispositivo compartido/perdido, restore malicioso y
Service Worker obsoleto. No existe backend, autenticación ni secreto servidor.

## Controles

- React escapa contenido; auditoría encontró cero usos de `dangerouslySetInnerHTML`.
- CSP aplicada por Nitro: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, fuentes,
  imágenes, manifest y workers limitados. No usa `unsafe-eval`. `unsafe-inline` se conserva para los
  scripts/estilos inline actuales de TanStack Start y ThemeProvider; migrar a nonces cuando el
  framework y deployment definan propagación estable.
- Headers: `nosniff`, `DENY`, `no-referrer`, COOP same-origin y Permissions Policy restrictiva.
- HSTS no se configura aquí: requiere dominio HTTPS definitivo y decisión de deployment.
- URLs operativas son same-origin. Tests de producción fallan ante requests externos inesperados.
- Variables `VITE_*` se consideran públicas. Escaneo manual: ningún `.env`, backup o secreto
  versionado; no existe telemetría externa.
- Producción no registra causas internas. El único `console.error` de aplicación está detrás de
  `import.meta.env.DEV`; scripts de build solo escriben resumen técnico.
- Restore valida contenedor/hash/esquema en base temporal, exige copia previa y usa transacción con
  recuperación. `.bodegix` no está cifrado y queda ignorado por Git.
- Service Worker solo usa assets same-origin, actualización manual y caches versionadas.

## Supply chain

El baseline halló `nanoid 3.3.16` alto y cuatro avisos Hono transitivos por cadenas de tooling.
Overrides acotados fijan `nanoid 3.3.17` y `hono 4.12.34`; audit final queda limpio. Política: critical
bloquea; high runtime bloquea; high tooling requiere remediación o excepción explícita; medium/low se revisan.
`pnpm-lock.yaml` está congelado en CI. SBOM y licencias son artefactos, no assets del cliente.

## Limitaciones

Datos y backups no están cifrados en reposo; quien controla el perfil del navegador puede leerlos.
No hay autenticación, revocación remota ni sincronización. CSP aún permite inline; no afirmar
seguridad absoluta. Requiere HTTPS, control del dispositivo, backups custodiados y actualización del
navegador.
