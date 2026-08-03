# ADR-0009: Aplicar puertos y adaptadores selectivamente

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto

## Context

¿Aplicar arquitectura hexagonal "pura" por simetría, o aplicar puertos y adaptadores solo en fronteras que aportan valor real?

Opciones evaluadas:

1. **Hexagonal estricta**: cada entidad tiene puerto, adaptador, mapper, DTO, persistence model.
2. **Hexagonal ligera / selectiva**: solo se abstrae lo que tiene frontera técnica o de negocio real.
3. **Sin puertos**: todo accede a Dexie directamente sin interfaz intermedia.

## Decision

Aplicar **puertos y adaptadores de forma selectiva** (opción 2):

- El dominio NO depende de React, Dexie, TanStack, IndexedDB, APIs del navegador.
- Un puerto se crea solo cuando:
  - modela una **capacidad de negocio** (no un CRUD genérico), y
  - hay dos implementaciones plausibles (hoy Dexie, mañana API REST / mock de test).
- **No** se crean:
  - `ProductRepository extends IRepository<Product>` genéricos;
  - `ProductRepositoryPort + ProductRepositoryDexieAdapter` de simetría;
  - `ProductMapper`, `ProductDTO`, `ProductPersistenceModel` cuando el shape coincide con la entidad.
- Dexie y React son **adaptadores** (infraestructura y entrada respectivamente).

## Ejemplos de puertos válidos

```typescript
// models CAPACIDAD, no tabla
interface ProductCatalog {
  findActiveByIds(ids: readonly string[]): Promise<Product[]>;
  searchActive(query: string): Promise<Product[]>;
}

interface CompleteSaleUnitOfWork {
  execute(command: CompleteSaleCommand): Promise<CompletedSale>;
}
```

## Rationale

- **Mantener dominio puro**: el dominio testea rápido, sin dependencias externas.
- **Evitar arquitectura de papel**: interfaces + mappers que no hacen más que copiar nombres de métodos de Dexie son ruido cognitivo, sin valor de negocio.
- **Foco en las fronteras que sí importan**: `CompleteSaleUnitOfWork` es justamente lo que mañana se movería a backend. Un puerto ahí paga su costo.
- **Sencillez inicial**: el MVP puede avanzar rápido sin la carga simétrica.

## Not-implemented

- Hexagonal simétrica por entidad.
- Repositorios genéricos por tabla.
- Mapper/DTO por entidad si no hay desajuste shape real.

## Consequences

- Positivo: dominio testable y limpio; abstracciones en los puntos adecuados.
- Positivo: bajo volumen de código ceremonial.
- Riesgo: ambigüedad "¿pongo puerto o llamo directamente a Dexie?" en casos límite.
  - **Regla práctica**: si el caso de uso es coordinación multi-tabla o hay al menos dos implementaciones razonables → sí puerto. Si es simple CRUD de una sola tabla y solo Dexie → directo al adaptador sin puerto.
- Acción: documentar puertos existentes por módulo y exigir justificación escrita al agregar uno nuevo.
