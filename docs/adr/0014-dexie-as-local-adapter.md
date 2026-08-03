# ADR-0014: Utilizar Dexie como adaptador local

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto
- Depends on: [ADR-0002](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0002-use-dexie.md)

## Context

Definir la frontera arquitectónica exacta de Dexie dentro del monolito modular local-first.

Opciones:

1. Dexie como "biblioteca de la app" importada libremente por componentes y dominio.
2. Dexie como **adaptador de infraestructura** — importado solo por `modules/*/infrastructure` y `shared/infrastructure/db`. Dominio y UI no lo conocen.
3. Repositorios genéricos `DexieRepository<T>` con CRUD uniforme por encima.

## Decision

**Opción 2. Dexie es un adaptador de infraestructura.**

- Singleton `BodegixPosDatabase` en `shared/infrastructure/db/bodegix-pos-database.ts`.
- Dominio no importa `dexie`.
- UI no importa `db`.
- Rutas no importan `db`.
- Componentes React no invocan `db.sales.add` ni coordinan transacciones.
- Los casos de uso orquestan; los adaptadores Dexie de cada módulo ejecutan.
- No se crean repositorios genéricos CRUD; se crean query services y unidades de trabajo que usan Dexie internamente.

## Rationale

- **Dominio puro = dominio testeable sin fake-indexeddb** para pruebas de unidad; solo casos de uso y adaptadores lo necesitan.
- **Migraciones centralizadas**: punto único de versionado/migraciones en `shared/infrastructure/db`.
- **Futuro reemplazo**: si Dexie se reemplaza por una capa sync + API, el cambio se limita a `shared/infrastructure/db` y a los adaptadores específicos de módulo; dominio y application no cambian.
- **No commitemos el error opuesto**: opción 3 (CRUD genérico) es indirección simétrica. Buscamos adaptadores con capacidades de negocio específicas.

## Not-implemented

- Importaciones de Dexie libres.
- `BaseDexieRepository<T>` / genéricos.
- Componentes React con `useLiveQuery` directamente sobre `db.xxx` sin pasar por adaptador. (Permitir `useLiveQuery` solo DENTRO de `modules/*/infrastructure/hooks` o `modules/*/ui/hooks` si ya encapsulan el acceso; no al vuelo en páginas.)

## Consequences

- Positivo: fronteras limpias, test por capas, capacidad de reemplazo futuro.
- Riesgo: tentación de usar Dexie directamente desde componentes para prototipar rápido.
  - Mitigación: prueba arquitectónica que detecte imports de `dexie` en `modules/*/ui/**` y `routes/**`.
- Acción: `runIntegrityCheck()` y migraciones en `shared/infrastructure/db`; cada módulo tiene sus propios `modules/X/infrastructure/dexie-*-queries.ts` y `*-uow.ts`.

## Enmienda de implementación — Fase 1 (2026-08-03)

- La ubicación final es `shared/infrastructure/local-db` y la clase se llama `BodegixDatabase`.
- Producción mantiene un singleton perezoso; importarlo no abre IndexedDB durante el shell SPA.
- Cada versión del esquema es un archivo inmutable. La v1 no tiene migración ficticia.
- `appSettings/main` se crea mediante bootstrap transaccional e idempotente.
- `navigator.storage.persist()` solo se solicita por acción explícita.
- `localStorage` no se usa para datos de negocio ni configuración.
- Diagnósticos básicos/profundos son de solo lectura; no borran ni reparan.
- Respaldo, restauración y `dexie-export-import` permanecen fuera de Fase 1.
