# 11. Respaldo y restauración

## Objetivo y política

Bodegix no depende de la permanencia indefinida del navegador. El operador exporta una copia
completa local y puede restaurarla sin backend. El MVP solo permite replace-all: no hay merge,
deduplicación, nube, sincronización, ZIP, base64 ni restauración parcial.

## Contrato implementado

El archivo `.bodegix` usa Bodegix Backup Format v1: magic header, longitud decimal, manifiesto JSON
UTF-8 estricto y payload crudo de `dexie-export-import`. SHA-256 protege manifiesto y payload. Se
limita a 128 MiB, se incluyen todas las tablas de `database.tables` y se guarda con File System
Access o descarga fallback.

Restore comprueba integridad y compatibilidad, importa primero en una base temporal, ejecuta el
diagnóstico profundo y la elimina. Antes de tocar producción exige guardar una copia previa y
escribir `RESTAURAR`. La importación real es transaccional, reemplaza todas las tablas sin borrar la
base, conserva IDs/`installationId` y ejecuta diagnóstico posterior con recuperación automática.

## Operación y recordatorio

`lastBackupAt` solo cambia tras guardar una copia manual. El resumen clasifica el plazo configurado
como nunca, vigente, próximo o vencido. Caja abierta y carrito pendiente se incluyen con advertencia.
Web Locks coordinan escrituras compartidas y restore exclusivo; BroadcastChannel bloquea otras
pestañas durante el mantenimiento.

La especificación normativa está dividida en [formato](backup/backup-format-v1.md),
[integridad](backup/backup-integrity.md), [compatibilidad](backup/backup-compatibility.md),
[seguridad de restore](backup/restore-safety.md) y
[mantenimiento cross-tab](backup/cross-tab-maintenance.md).
