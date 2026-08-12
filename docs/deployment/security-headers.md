# Security headers

Configurados en Build Output API y `vercel.json`:

- `Content-Security-Policy`: self por defecto; bloquea object/frame; permite `data:`/`blob:` necesarios
  y `unsafe-inline` temporal de TanStack/theme.
- `Cross-Origin-Opener-Policy: same-origin`.
- `Permissions-Policy`: cámara, micrófono, geolocalización, pagos y USB deshabilitados.
- `Referrer-Policy: no-referrer`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.

HSTS no está configurado: dominio/subdominios definitivos desconocidos. Validar respuestas reales en
staging antes de promoción; cambiar ambas configuraciones juntas.
