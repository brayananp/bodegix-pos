# 16. Definition of Done

## Fase 7

Exige query read-only, fechas comerciales, métricas conciliables, varias sesiones, stock claramente
actual, checklist no persistido, migración v7, diagnóstico, enlaces tipados, responsive y
`pnpm check:full` sin fallos.

## Fase 3

La fase exige saldo/ledger atómicos, stock entero no negativo, movimientos append-only, cuatro
comandos públicos, consultas paginadas y reactivas, migración v2, diagnóstico profundo, formularios
compuestos, Sheet responsive, URL restaurable, guard de cambios, pruebas de concurrencia/rollback y
Playwright verde en escritorio y móvil. Ventas, pagos, caja, proveedores, respaldo y backend quedan
fuera del alcance.

## Fase 2

La fase exige las seis validaciones del proyecto en verde, CRUD lógico de catálogo,
stock inmutable, composición `createFormHook`, URL validada, overlays responsive,
errores tipados, bloqueo de cambios, E2E escritorio/móvil y documentación sincronizada.

## Para una historia

Una historia está terminada cuando:

- requisitos y reglas están identificados y referenciados al documento correspondiente (04-requisitos, 05-reglas, ADR);
- validación está implementada (Zod para entrada, invariantes de dominio);
- estados de carga, vacío y error existen;
- pruebas unitarias relevantes pasan;
- pruebas de integración pasan si toca persistencia;
- **pruebas arquitectónicas** siguen pasando (ARCH-01..06 de [14-testing-strategy.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/14-testing-strategy.md));
- accesibilidad básica está revisada;
- no rompe operación offline;
- no introduce importes de coma flotante;
- no modifica stock sin movimiento (invariante híbrido ADR-0005 y ADR-0015);
- **no hay escritura multi-tabla desde UI ni routes**; siempre pasa por un **caso de uso transaccional**;
- **ningún módulo importa archivos internos privados de otro** (solo por `index.ts`, API pública);
- **dominio no importa React, Dexie, TanStack, navegador**;
- documentación afectada se actualiza (roadmap, modelos, ADRs si la decisión cambia);
- no existen errores TypeScript en modo `strict`;
- build de producción pasa;
- si toca migraciones Dexie: `upgrade` + test `migrate vN-1 → vN + integridad OK`.

## Para un módulo

- API pública (`index.ts`) definida y estable;
- casos de uso completos y con tests transaccionales para caminos felices y caminos de fallo;
- errores tipados de dominio con códigos (no strings mágicos);
- adaptadores Dexie si tocan persistencia; **no** repositorios CRUD genéricos;
- UI mobile-first;
- E2E principal de la capacidad representativa;
- builders y fixtures si tocan modelos con invariantes;
- métricas básicas de rendimiento para consultas frecuentes (≥ 1 mes de datos);
- revisión de no contaminar módulos vecinos: exports por `index.ts` solamente;
- revisión de datos históricos: ninguna operación destruye datos, solo marca `voided` / inactivo.

## Para un caso de uso crítico (completeSale / voidSale / openCash / closeCash / restoreBackup)

- 1 y solo 1 transacción Dexie atómica;
- al menos 1 test que valida: si falla el último paso, rollback de todos los anteriores (sin medio-persistido);
- manejo de errores tipados para cada invariante (stock, pagos, caja, settings);
- documentado en ADR / modelo de dominio si modifica invariantes globales.

## Para una prueba arquitectónica (ARCH-XX)

Se considera lista y estable cuando:

- detecta el antipatrón objetivo en un PR con ejemplo de importación indebida;
- tiene mensaje de error claro con link a [08-application-architecture.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/08-application-architecture.md);
- se ejecuta automáticamente en `pnpm check` o `pnpm test`.

## Para liberar el MVP

### Producto

- Venta frecuente ≤ 10 segundos en dispositivo objetivo.
- Todos los métodos manuales funcionan.
- Pago mixto funciona.
- Inventario auditable.
- Caja abre y cierra.
- Resumen diario correcto.
- Anulación correcta.
- 0 contradicciones entre documentación y código.

### Datos

- Venta atómica (transacción Dexie).
- Migración probada desde fixture v1.
- Respaldo restaurable y diagnóstico post-restauración OK.
- Diagnóstico de integridad (todas las reglas del [07-database-dexie.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/07-database-dexie.md#diagnóstico-de-integridad)) pasa.
- Sin pérdida conocida.
- **Ninguna fila de `sales`, `salePayments`, `inventoryMovements`, `cashMovements` se borra físicamente**.

### Arquitectura

- No hay imports prohibidos detectados por las reglas ARCH-01..06.
- Dominio: cero dependencias a `react`, `dexie`, `@tanstack/router`, `indexeddb`.
- Los 7 módulos (`catalog`, `inventory`, `sales`, `cash`, `reporting`, `backup`, `settings`) exponen solamente por `index.ts`; sin rutas internas públicas.
- `shared/kernel` ≤ 8 archivos (sin crecer a cajón de sastre).
- Existen 0 repositorios genéricos tipo `IRepository<T>` o `BaseRepository<T>`.
- Existen 0 `Mapper` / `PersistenceModel` cuando el shape coincide con la entidad.

### PWA

- Instalación probada.
- Inicio offline después de 1ª carga.
- Actualización controlada (no recarga en medio de una venta).
- Persistencia solicitada.
- Estado de almacenamiento visible.

### Calidad

- Suite crítica Playwright verde (7 specs de [14-testing-strategy.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/14-testing-strategy.md)).
- Suite Vitest verde con cobertura ≥ 80% dominio, ≥ 90% ramas casos de uso críticos.
- Sin errores de consola en flujos principales.
- Sin vulnerabilidades críticas conocidas.
- CSP definida.
- Dependencias bloqueadas (pnpm-lock.yaml).
- Manual de recuperación (cómo recuperar de fallo de migración, cómo hacer restore).

### Piloto

- Build identificable por versión y commit.
- Canal de incidencias.
- Formulario de feedback.
- Procedimiento de respaldo antes de cada jornada.
- Procedimiento de rollback.

### Fase 4 — caja

Comandos y consultas públicas, transacciones concurrentes, snapshot v3, diagnóstico, formularios
compuestos, overlays responsive, URL restaurable, indicador global y pruebas unitarias,
integración/componentes/arquitectura/E2E están implementados. Ventas, pagos, reapertura y respaldo
permanecen fuera del alcance.

## DoD de Fase 6

Se considera terminada cuando `/sales`, filtros/paginación, detalle histórico, elegibilidad,
confirmaciones por pago, transacción compensatoria, resultado reconstruible, diagnóstico,
migraciones, documentación y suites unitarias/integración/componentes/arquitectura/E2E pasan sin
eliminar ni editar ventas, crear cash movements o permitir anulación parcial/posterior al cierre.
