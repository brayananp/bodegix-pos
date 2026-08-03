# ADR-0010: Separar comandos y consultas sin CQRS completo

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto

## Context

¿Cómo organizar escrituras y lecturas sin sobre-ingeniería?

Opciones evaluadas:

1. **Arquitectura CRUD única**: mismas funciones leen y escriben.
2. **CQRS ligero / separación de caminos**: casos de uso para escrituras (comandos), query services para lecturas. Una sola DB local, sin eventos.
3. **CQRS completo / distribuido**: buses, comandos/events asíncronos, 2 modelos (escritura y lectura), 2 bases de datos, proyecciones.

## Decision

**Separar comandos y consultas (opción 2) sin CQRS completo.**

- **Comandos**: casos de uso transaccionales. Entrada: `createProduct(command)`, `completeSale(command)`, `openCashSession()`. Salida: entidad resultante o error. Consistencia estricta.
- **Consultas**: query services especializados. Entrada: filtros. Salida: proyección optimizada para UI. No pasan por agregado si no aporta.
- **Una sola base de datos Dexie local**, compartida entre comandos y consultas.
- **Sin** bus, sin eventos de integración, sin mensajería, sin consistencia eventual innecesaria, sin doble DB.

## Rationale

- **Camino correcto por naturaleza**: escribir y leer tienen requisitos distintos; transacciones ACID para escritura, consultas rápidas y optimizadas para lectura.
- **Escala a futuro**: el mismo `CompleteSaleCommand` puede migrar a un CommandBus distribuido si hay backend. Los query services pueden volverse endpoints GET separados.
- **Sin sobrecarga del MVP**: no pagamos costo de buses, proyecciones asíncronas, reintentos ni desfase lectura/escritura.
- **Testeabilidad**: los tests de comandos prueban invariantes y transacciones; los de consultas prueban contratos y performance.

## Not-implemented

- CQRS distribuido con event bus / message broker.
- Proyecciones de lectura asíncronas separadas.
- Dos bases de datos (escritura/lectura).
- Event sourcing.

## Consequences

- Positivo: contratos de escritura/lectura claros.
- Positivo: transacciones atómicas y lecturas inmediatamente consistentes.
- Riesgo: tentación de que comandos devuelvan proyecciones de lectura grandes en lugar de entidades mínimas. Mitigación: convención `completeSale()` devuelve `CompletedSale { id, saleNumber, totalCents }`; los detalles se obtienen con `getSaleDetail(id)` consulta.
- Acción: documentar por módulo lista de comandos y lista de consultas. Los archivos deben ir separados: `application/complete-sale.ts` vs `application/get-sale-detail.ts`.
