# Módulo backup

`backup` es responsable de crear, inspeccionar y restaurar copias portables completas de la base
local. No posee tablas, no implementa sincronización, nube, cifrado, merge ni restauración parcial.

## API pública y límites

La ruta pública expone la página de configuración, el esquema de search params y el estado puro del
recordatorio. Los comandos `createBackup`, `inspectBackup` y `restoreBackup` dependen de puertos de
base, archivo, criptografía y mantenimiento. Solo infraestructura conoce Dexie,
`dexie-export-import`, Web Crypto, File System Access, Web Locks y BroadcastChannel.

El respaldo incluye todas las tablas devueltas por `database.tables`; hoy son categorías,
productos, movimientos de inventario, ventas, ítems, pagos, sesiones y movimientos de caja,
configuración y carrito. No existe una segunda lista manual susceptible de quedar desactualizada.

## Garantías

- Formato binario Bodegix Backup Format v1, extensión `.bodegix`.
- SHA-256 separado para manifiesto canónico y payload Dexie crudo.
- Inspección de metadatos y validación profunda en una base temporal única.
- Compatibilidad exacta o migración explícita registrada; nunca se aceptan versiones futuras.
- Restauración replace-all transaccional, sin `db.delete()` sobre producción.
- Copia previa obligatoria y recuperación automática si falla el diagnóstico posterior.
- `lastBackupAt` cambia únicamente tras guardar un respaldo manual.

El recordatorio usa días comerciales en `America/Lima`: `never`, `up_to_date`, `due_soon` (último
20 % del intervalo, mínimo un día) y `overdue` cuando la fecha límite ya pasó.
