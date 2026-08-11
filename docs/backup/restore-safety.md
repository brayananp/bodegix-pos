# Seguridad de restauración

La única política es replace-all. Antes de habilitar la confirmación se crea una copia
`pre_restore`; con descarga fallback el usuario confirma que terminó. Esa copia no actualiza
`lastBackupAt`.

La validación temporal abre una base Bodegix con nombre aleatorio, importa transaccionalmente,
compara conteos, ejecuta diagnóstico profundo y siempre cierra/elimina la temporal en `finally`.
La base real permanece intacta durante este proceso.

La importación real usa `clearTablesBeforeImport` dentro de una transacción de
`dexie-export-import`; no llama `db.delete()` y no deja tablas parcialmente restauradas. Un fallo de
importación revierte. Si el import ya confirmó pero falla el diagnóstico posterior, se importa la
copia previa y se diagnostica nuevamente. Se distingue recuperación exitosa de fallo de
recuperación para no prometer datos sanos sin evidencia.
