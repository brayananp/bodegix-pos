# Caching

| Recurso | Política |
| --- | --- |
| `/`, rutas SPA, `index.html` | `public, max-age=0, must-revalidate` |
| `/sw.js` | `public, max-age=0, must-revalidate` |
| `/manifest.webmanifest` | `public, max-age=0, must-revalidate` |
| `/release.json` | `public, max-age=0, must-revalidate` |
| `/assets/*` con hash | `public, max-age=31536000, immutable` |

`.bodegix` nunca es asset ni precache. Asset inexistente responde 404 real. SW usa lifecycle prompt;
no se desregistra automáticamente.
