# Hosting Vercel

Proveedor seleccionado: Vercel. Tipo: estático. Config primaria: `.vercel/output/config.json` generado
por build; compatibilidad con importación directa: `vercel.json`. Build Output API v3 usa filesystem
antes de fallback y solo reescribe rutas TanStack válidas.

Requiere crear proyecto/URLs/secrets. HTTPS, atomic deployments y promoción son administrados por
Vercel. Desactivar Git auto-deploy y Auto-assign Custom Production Domains para conservar gate y staged
production. Dominio final aún no configurado; HSTS espera esa decisión.
