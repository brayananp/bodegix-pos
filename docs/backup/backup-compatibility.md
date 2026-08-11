# Compatibilidad de respaldos

Hay tres versiones independientes:

- `formatVersion`: sintaxis del contenedor; v1 solo acepta exactamente 1.
- `database.schemaVersion`: contrato Dexie; igual se importa, superior se rechaza, anterior requiere
  una cadena completa en `BACKUP_MIGRATION_PLANS`.
- `application.version`: informativa; una diferencia compatible produce advertencia.

El registro de migraciones declara `fromSchemaVersion`, `toSchemaVersion` y un transform por fila.
No se activa `acceptVersionDiff` como permiso genérico. La versión actual no publica migraciones de
respaldo anteriores; por tanto, un v1 con esquema distinto se rechaza hasta registrar y probar el
plan correspondiente.

Todas las tablas requeridas deben existir, no puede haber tablas desconocidas y cada schema Dexie y
row count debe coincidir entre descriptor actual, metadata interna y manifiesto. Cambiar primary
keys nunca se acepta implícitamente.
