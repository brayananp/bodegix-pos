# 11. Respaldo y restauración

## Objetivo

Evitar que la aplicación dependa de la permanencia indefinida del almacenamiento del navegador.

## Formato

Archivo JSON o Blob generado por `dexie-export-import`, envuelto con metadatos propios.

```typescript
interface BackupEnvelope {
  format: "bodegix-pos-backup";
  formatVersion: 1;
  databaseSchemaVersion: 1;
  appVersion: string;

  installationId: string;
  businessName: string;

  exportedAt: number;
  checksum: string;

  summary: {
    products: number;
    sales: number;
    inventoryMovements: number;
    cashSessions: number;
  };

  payload: unknown;
}
```

## Nombre

```text
bodegix-pos_<negocio>_<YYYY-MM-DD_HH-mm>.json
```

## Exportación

1. Ejecutar diagnóstico.
2. Exportar tablas.
3. Construir metadatos.
4. Calcular checksum.
5. Descargar.
6. Actualizar `lastBackupAt`.
7. Mostrar confirmación.

## Importación

1. Seleccionar archivo.
2. Validar MIME y tamaño.
3. Parsear.
4. Validar esquema con Zod.
5. Verificar checksum.
6. Comprobar compatibilidad.
7. Mostrar resumen.
8. Solicitar confirmación explícita.
9. Exportar respaldo actual.
10. Reemplazar datos.
11. Ejecutar diagnóstico.
12. Recargar de forma controlada.

## Política del MVP

Solo se permite restauración completa.

No se implementa:

- merge;
- deduplicación;
- restauración parcial;
- resolución de conflictos.

## Recordatorio

Valor inicial recomendado:

```text
cada 7 días
```

También se recordará:

- después de 100 ventas desde el último respaldo;
- antes de una migración relevante;
- antes de una restauración.

## Pruebas obligatorias

- Exportar una base vacía.
- Exportar una base con datos.
- Restaurar en otra instalación.
- Detectar checksum incorrecto.
- Rechazar versión futura incompatible.
- Recuperar después de importación interrumpida.
- Conservar respaldo previo a la restauración.

## Exportación CSV

No sustituye al respaldo.

CSV se utilizará para:

- ventas;
- pagos;
- productos;
- inventario.

El respaldo completo es el único archivo destinado a restaurar la aplicación.

## Fuente técnica

- Dexie export/import: https://dexie.org/docs/ExportImport/dexie-export-import
