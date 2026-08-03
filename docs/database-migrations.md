# Política de migraciones de la base local

## Reglas

1. Cada versión vive en `schema/schema-vN.ts` y se registra en orden desde el constructor.
2. Una versión publicada no se modifica ni se reutiliza.
3. Un cambio de stores o datos crea `schema-v2.ts`, aun si parece pequeño.
4. Los handlers `upgrade()` históricos se conservan para instalaciones antiguas.
5. Toda migración incluye pruebas desde una fixture de la versión anterior y prueba de reapertura.
6. No se usa modo dinámico, no se borra la base al fallar y `delete()` no es recuperación normal.

La Fase 1 solo tiene instalaciones nuevas v1; no existe un `upgrade()` ficticio desde una versión
anterior.

## Procedimiento futuro

Antes de liberar una migración:

1. Congelar y conservar el archivo de la versión anterior.
2. Añadir el nuevo mapa de stores y, solo si hace falta, un `upgrade()` transaccional.
3. Validar datos antes y después sin APIs externas, `fetch`, temporizadores ni diálogos dentro de la
   transacción.
4. Probar éxito, rollback ante error, datos existentes y base vacía.
5. Ejecutar `pnpm check:full` y documentar compatibilidad y recuperación manual.

Según Dexie, un error no capturado aborta la transacción. Capturar un error dentro de la
transacción equivale a manejarlo; si debe abortar, se relanza.

Referencia: [Dexie Version.upgrade()](https://dexie.org/docs/Version/Version.upgrade%28%29).
