# Caso de uso: restaurar respaldo

## Flujo seguro

1. Seleccionar un único `.bodegix` mediante el gateway de archivos.
2. Leer solo el encabezado y manifiesto; aplicar límites antes de cargar el payload.
3. Verificar formato, hashes, nombre/versión Dexie, tablas, esquemas y conteos.
4. Resolver una cadena de migraciones explícita si el esquema es anterior.
5. Importar en una base temporal única, ejecutar diagnóstico profundo y eliminarla en `finally`.
6. Mostrar respaldo e instalación actual; advertir caja abierta, carrito o versión de app distinta.
7. Crear y guardar obligatoriamente un respaldo `pre_restore` de la instalación actual.
8. Exigir checkboxes y el texto exacto `RESTAURAR` con TanStack Form.
9. Adquirir lock exclusivo, anunciar mantenimiento e importar con transacción y replace-all.
10. Ejecutar diagnóstico profundo. Si falla tras el commit, restaurar automáticamente la copia
    previa y validar la recuperación.
11. Mostrar resultado y reiniciar de forma controlada hacia `/summary`.

No se borra la base, no se cambian IDs ni `installationId`, no se combinan instalaciones y no se
acepta importación parcial. Un error de importación revierte la transacción Dexie. La navegación y
el cierre del Sheet se bloquean únicamente durante la restauración real.
