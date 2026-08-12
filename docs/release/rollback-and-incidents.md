# Rollback, forward-fix e incidentes

## Clasificación previa

Leer `release.json` y matriz. Frontend rollback no revierte IndexedDB.

- `none`: seleccionar deployment Vercel anterior probado, promover/rollback sin rebuild, smoke.
- `backward_compatible`: igual, solo si matriz y pruebas confirman versión anterior segura.
- `forward_only`: no rollback. Congelar deployments, preparar hotfix hacia adelante, ejecutar gate,
  desplegar artifact, smoke.

No desregistrar Service Worker ni borrar IndexedDB. Tras cualquier cambio comprobar workers old/waiting/
active, precache y ausencia de loop. Si artifact anterior expiró, no reconstruir silenciosamente desde
branch antigua: producir release nueva trazable.

## Incidente

1. Registrar hora, URL, versión, commit, síntomas y alcance; no copiar datos comerciales.
2. Detener promociones; conservar deployment actual y evidencias.
3. Clasificar: disponibilidad, asset/cache, CSP, PWA/SW, pérdida/corrupción local o incompatibilidad DB.
4. Elegir rollback solo con compatibilidad demostrada; caso contrario forward-fix.
5. Ejecutar smoke HTTP no destructivo y verificación PWA manual.
6. Comunicar si usuario debe esperar, recargar o crear respaldo. Nunca pedir backup real por canal inseguro.
7. Documentar causa, mitigación y prevención en release notes.
