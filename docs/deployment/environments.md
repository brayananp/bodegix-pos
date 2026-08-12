# Entornos

| Entorno | Propósito | URL | Datos | Secrets | Fuente |
| --- | --- | --- | --- | --- | --- |
| Development | Trabajo local | `http://localhost:3000` | Sintéticos | Ninguno obligatorio | `pnpm dev` |
| Staging | Artifact production-like | `URL_NOT_CONFIGURED` | Solo sintéticos | GitHub Environment `preview` | Artifact CI |
| Production | Operación real | `DOMAIN_NOT_CONFIGURED` | IndexedDB del dispositivo | GitHub Environment `production` | Mismo deployment promovido |

Staging/production requieren HTTPS. Variables compiladas son públicas. Token e IDs Vercel nunca usan
prefijo `VITE_` ni entran al artifact.

Cada preview Vercel usa origin propio: su SW no controla production. Para sesión staging limpia usar
contexto/perfil de navegador nuevo; limpieza programática solo desde tests. Production no ofrece reset.
