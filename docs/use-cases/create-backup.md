# Caso de uso: crear respaldo

## Precondiciones

IndexedDB, Web Crypto y `appSettings/main` deben estar disponibles. Una caja abierta o un carrito
pendiente generan advertencias, pero no bloquean: ambos forman parte de la copia.

## Flujo

1. Reservar solo las transacciones Dexie necesarias para exportar todas las tablas con
   `exportDB({ noTransaction: false })`.
2. Inspeccionar el payload exportado para obtener versión, esquemas y conteos.
3. Construir el núcleo estricto del manifiesto con instalación, aplicación y fuente.
4. Calcular SHA-256 del payload y del JSON canónico del núcleo.
5. Codificar header, longitud decimal, manifiesto UTF-8 y payload crudo.
6. Proponer un nombre seguro `bodegix-backup-<negocio>-<timestamp>.bodegix`.
7. Guardar mediante `showSaveFilePicker`; si no existe, descargar con Object URL y revocarla.
8. Solo para fuente `manual` y resultado guardado, actualizar `lastBackupAt` bajo lock compartido.

El progreso distingue preparación, exportación, hash, construcción, guardado y finalización. La
cancelación del selector es un resultado normal y no modifica persistencia. Los errores de lectura,
criptografía o guardado se presentan con mensajes seguros sin exponer registros.

Las pruebas cubren base inicializada, todas las tablas, manifest/container, progreso, guardado,
cancelación y la regla exacta de `lastBackupAt`.
