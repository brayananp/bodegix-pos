# ADR-0002: Usar Dexie sobre IndexedDB

## Estado

Aceptado.

## Contexto

La aplicación necesita datos estructurados, consultas, transacciones, reactividad y migraciones sin conexión.

## Decisión

Usar Dexie.js como adaptador local.

## Consecuencias positivas

- API de mayor nivel.
- Transacciones.
- Versionado.
- Integración React mediante `dexie-react-hooks`.
- Exportación/importación disponible.

## Consecuencias negativas

- Los datos pertenecen al origen del navegador.
- La persistencia no sustituye a un respaldo.
- Las consultas no equivalen a SQL.
- Sin sincronización automática entre dispositivos.
