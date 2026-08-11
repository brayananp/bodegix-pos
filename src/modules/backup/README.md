# Módulo: backup

## Responsabilidad

Respaldo completo, inspección segura y restauración replace-all de la base local.

## Límites del módulo

- **Incluye:** contenedor `.bodegix`, SHA-256, validación temporal, copia previa, restore
  transaccional, recuperación y mantenimiento entre pestañas.
- **Excluye:** nube, sincronización, merge, restauración parcial, cifrado y firma.

## Estado actual

Fase 8 implementada. El contrato detallado vive en `docs/modules/backup.md` y `docs/backup/`.
