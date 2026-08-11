# ADR 0020 — Respaldo portable y restauración segura

Estado: aceptado. Alcance: Fase 8.

## Decisión

Usar `dexie-export-import` para incluir automáticamente todas las tablas operativas en un payload
crudo, dentro de Bodegix Backup Format v1 sin ZIP ni base64. Dos SHA-256 detectan corrupción; el MVP
no cifra ni firma el archivo.

Restore es replace-all: preserva IDs, snapshots, caja, carrito e `installationId`; no implementa
merge ni sincronización. Primero valida en una base temporal y exige guardar una copia previa. La
base real se importa transaccionalmente, sin `db.delete()`, y se recupera desde esa copia si falla el
diagnóstico posterior.

Todas las escrituras usan Web Locks compartidos y restore uno exclusivo. BroadcastChannel coordina
pestañas y su fallback impide restaurar cuando no puede obtener exclusión suficiente.
`lastBackupAt` se actualiza solo después del guardado manual confirmado.

## Consecuencias

La copia es portable y ampliable cuando aparecen tablas nuevas, pero contiene datos legibles y debe
custodiarse. La restauración consume memoria proporcional al archivo (limitado a 128 MiB) y no admite
esquemas anteriores hasta publicar una migración explícita probada. Se añade una única dependencia
de producción y no se crea backend ni almacenamiento persistente secundario.
