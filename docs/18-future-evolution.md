# 18. Evolución futura

## Versión 1.1

Candidatos, sujetos a piloto:

- clientes;
- fiados;
- abonos;
- proveedores básicos;
- importación CSV;
- impresión;
- devoluciones parciales;
- cantidades fraccionadas.

## Versión 2 — Respaldo en nube

- autenticación;
- bodega como tenant;
- backup cifrado;
- recuperación;
- historial de dispositivos;
- PostgreSQL;
- API/server functions.

No implica todavía edición simultánea.

## Versión 3 — Sincronización

- outbox local;
- identificadores globales;
- versiones por registro;
- tombstones;
- reintentos;
- idempotencia;
- conflictos;
- estado de sincronización;
- múltiples dispositivos.

## Versión 4 — Operación multiusuario

- empleados;
- roles;
- cajas;
- auditoría;
- sesiones;
- permisos;
- cierre por empleado.

## Versión 5 — Formalización y pagos

- comprobantes electrónicos mediante proveedor;
- integración SUNAT;
- QR dinámico;
- webhooks;
- conciliación automática;
- afiliación individual por comercio.

## Preparación presente

El MVP debe facilitar la evolución mediante:

- UUID;
- timestamps;
- registros inmutables;
- movimientos de inventario;
- pagos separados;
- estados explícitos;
- versionado de esquema;
- casos de uso independientes de Dexie;
- referencias idempotentes futuras.

## Campos futuros no incluidos todavía

No deben agregarse anticipadamente sin uso real:

- `syncStatus`;
- `serverVersion`;
- `tenantId`;
- `userId`;
- `branchId`;
- `deviceId`;
- `deletedAt`.

Se incorporarán mediante migración cuando exista infraestructura que los utilice.
