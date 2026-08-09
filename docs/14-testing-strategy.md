# 14. Estrategia de pruebas

## Pirámide de inventario (Fase 3)

- Dominio: transición exhaustiva, enteros, negativos, deltas y estados.
- Integración: comandos contra Dexie real simulado, consultas/índices, rollback y concurrencia.
- Persistencia: migración v1→v2 e integridad del ledger sin reparación automática.
- Componentes: estado textual, métricas, vistas previas y campos compartidos.
- Arquitectura: pureza de capas, propiedad del stock, módulos sin ciclos y rutas delgadas.
- E2E: dos escenarios en desktop/móvil, incluidos historial, URL, navegación y dirty state.

## Pirámide de catálogo

Las unidades cubren conversión exacta, mapeadores, Zod y campos pre-vinculados. La
integración usa `fake-indexeddb` para transacciones, duplicados, filtros, cambios de
estado, persistencia y stock inmutable. Las pruebas arquitectónicas impiden dependencias
de UI/Dexie en dominio/aplicación. Playwright valida overlays y navegación en los dos
viewports configurados.

## Cobertura de infraestructura local (Fase 1)

Vitest usa `fake-indexeddb` para probar el esquema Dexie sin tocar la base de producción. Las bases
son aisladas por UUID y se cierran/eliminan en teardown. Hay pruebas de validación Zod,
StorageManager, errores, bootstrap concurrente, índices únicos, rollback, diagnóstico, provider y
panel. Playwright verifica inicialización, versión, diagnóstico y conservación de installationId
tras recarga.

## 1. Pirámide de pruebas de Bodegix POS

```text
          ┌─────────────────────────────────┐
          │   E2E Playwright offline        │  < 10%
          │   · flujos completos            │
          │   · backup/restore real         │
          │   · modo avión / reconexión     │
          ├─────────────────────────────────┤
          │   Componentes / integraciones   │  ~ 25%
          │   · UI + hook + casos de uso   │
          │   · con fake-indexeddb          │
          ├─────────────────────────────────┤
          │   Casos de uso / aplicación     │  ~ 25%
          │   · completeSale, voidSale…     │
          │   · transacciones Dexie         │
          ├─────────────────────────────────┤
          │   Dominio puro                  │  ~ 30%
          │   · invariantes, dinero, ids    │
          │   · 0 dependencias externas     │
          ├─────────────────────────────────┤
          │   Arquitectónicas (lint/test)   │  ~ 10%
          │   · límites imports             │
          │   · dominio sin React/Dexie     │
          │   · DB no en rutas              │
          └─────────────────────────────────┘
```

## 2. Stack

| Capa | Herramientas |
|---|---|
| Unitarias dominio + aplicación | **Vitest** |
| IndexedDB en tests | `fake-indexeddb` / equivalente |
| Componentes React | Vitest + Testing Library (o sólo tests de integración simples) |
| Migraciones Dexie | Vitest + fixtures por versión `test/fixtures/db-vN/` |
| E2E | **Playwright** + modo offline + storage persistente |
| Arquitectónicas | Reglas ESLint (`no-restricted-imports`) o tests Vitest con AST imports |

## 3. Categorías de prueba

### A. Pruebas de DOMINIO

Ubicación sugerida: `modules/X/domain/__tests__/` o `test/unit/domain/*`.

Características:
- **SIN** `fake-indexeddb`
- **SIN** React
- **SIN** Dexie
- **SIN** TanStack

Ejemplos que deben existir:
- `money.test.ts`: parse/format/calculateChange / céntimos enteros negativos → error
- `ids.test.ts`: UUID válido; `newId()` idempotente de formato
- `sale.test.ts`: carrito vacío → `EmptySaleError`; pagos suman 99% de total → `PAYMENT_TOTAL_MISMATCH`; `status` completed → no se muta
- `sale-payment.test.ts`: efectivo sin `cashReceivedCents` → error
- `cash-session.test.ts`: sólo 1 caja abierta a la vez (invariante dominio simple)

### B. Pruebas de CASOS DE USO / aplicación

Ubicación: `modules/X/application/__tests__/`.

Características:
- Con `fake-indexeddb`.
- Base Dexie recién inicializada por cada test o por suite.
- Prueba el caso de uso llamando directamente a la función exportada (`completeSale(command)`).
- Prueba **transaccionalidad**: fallo en paso 10 → no hay side effects (sale no creada, stock no descontado, correlativo no incrementado).

Casos mínimo obligatorios:
- `complete-sale.test.ts`:
  - happy path: carrito 2 productos + 1 pago efectivo → venta creada, stock decrementado, correlativo++, inventoryMovements con stockAfter correctos
  - fallo: caja no abierta → `NO_OPEN_CASH_SESSION`, nada persistido
  - fallo: producto inactivo → error, nada persistido
  - fallo: stock insuficiente → `INSUFFICIENT_STOCK`, nada persistido
  - fallo: pagos no suman → error, nada persistido
- `void-sale.test.ts`:
  - happy path: venta completada → anulada, stock recuperado, movimientos `sale_void`, pagos → `voided`, registro no borrado
  - doble anulación → `SALE_ALREADY_VOIDED`, nada cambia
- `open-close-cash-session.test.ts`:
  - 2 aperturas seguidas → error
  - cierre calcula `expectedCash` correctamente
- `initial-stock + inventory-adjustment.test.ts`
- `restore-backup.test.ts`: checksum malo → error, schema malo → error, bueno → estado reemplazado + pre-backup automático generado

### C. Pruebas de INFRAESTRUCTURA DEXIE

Ubicación: `modules/X/infrastructure/__tests__/` y `shared/infrastructure/db/__tests__/`.

- `migrations.test.ts`: cargar fixture v1 → upgrade a v2 → correr integridad → OK
- `integrity-check.test.ts`: estado bueno → 0 errores; forzar stock desalineado → fallo reportado
- `queries.test.ts`: `searchProducts("coca")` devuelve resultados ordenados relevantes

### D. Pruebas de MIGRACIONES

Regla: cada versión nueva de esquema crea 2 tests:
1. `migrate vN-1 → vN`
2. `integrity OK tras migrate`

Fixtures en:
```text
src/test/fixtures/
  └── db-v1/
        ├── v1-data.json        （representación serializable de la base）
        └── expected-v2-snapshot.json  (opcional)
```

### E. Pruebas de COMPONENTES / UI

Objetivo: casos críticos + accesibilidad básica. No testear cada botón.

- `sale-form.test.tsx`: pagos mixtos renderiza métodos seleccionados; `changeCents` se muestra correctamente; stock insuficiente muestra mensaje claro
- `cash-opening.test.tsx`: valores no numéricos bloquean submit
- `backup-restore.test.tsx`: upload de archivo inválido → toast de error

### F. Pruebas END-TO-END (Playwright)

Ubicación: `e2e/` o `tests/e2e/`.

**Suite crítica mínima**:
1. `onboarding-and-first-sale.spec.ts`
   - onboarding completo → crear 2 productos → abrir caja → venta 2 items + efectivo → cierre → resumen correcto
2. `void-sale.spec.ts`
   - Vender → Anular → Verificar stock recuperado, pago anulado, listado de ventas muestra VOID
3. `payments.spec.ts` (cash / yape manual / mixto cash+card)
4. `inventory-adjustment.spec.ts`
5. `cash-full-cycle.spec.ts`: apertura → deposito → retiro → cierre con diferencia
6. `backup-restore.spec.ts`:
   - Exportar → descargar → limpiar storage → subir → datos recuperados
7. `offline.spec.ts`:
   - PWA cargada → `context.setOffline(true)` → seguir vendiendo → re-online → no hay pérdida (también modo avión del navegador real si es posible)

#### Fixtures de Playwright

- `storage/` con una base Dexie pre-cargada (ventas del dia, caja abierta, productos) para tests de escenarios reales (no empezar siempre de 0).

### G. Pruebas OFFLINE

- UI no rompe en modo avión;
- después de una limpieza forzada de service worker (en test), al volver online recarga datos correctamente;
- los mensajes de error en storage cuota llena muestran acciones claras (libera espacio / exporta backup).

### H. Pruebas ARQUITECTÓNICAS

Nuevo bloque OBLIGATORIO, mínimo 5 tests:

| ID | Test | Cómo implementar |
|---|---|---|
| ARCH-01 | Dominio NO importa React | ESLint `no-restricted-imports` sobre paths `modules/*/domain/**` que bloqueen `react` o AST scan de imports |
| ARCH-02 | Dominio NO importa Dexie | Bloquear `dexie`, `idb`, `indexeddb` en domain |
| ARCH-03 | Módulo Y no importa archivos PRIVADOS de módulo X (sólo `/index`) | Regla ESLint con regex: `^@/modules/(?!(catalog|sales|inventory|cash|reporting|backup|settings)/index$)[a-z]+/(?!index).+$` |
| ARCH-04 | `routes/**` y `app/**` NO importan directamente `dexie`, ni `db.*` | Regla de imports negada |
| ARCH-05 | Componentes `modules/*/ui/**` NO llaman a métodos escritura multi-tabla de `db.*` (`transaction`, `.add` sobre `sales`, `.bulkAdd` sobre `saleItems`, `.update` sobre `products.stockQuantity`) | AST scan o ESLint con nombres prohibidos en esos directorios |
| ARCH-06 | Rutas no contienen lógica de dominio: no cálculo de totales, no validación de pagos | (humano + lint de patterns) |

Conveniencia: si `@tanstack/eslint-plugin` / ESLint `no-restricted-imports` alcanza, usar ese y no test runtime. Si no, script `vitest` que recorra `imports` con `ts-morph` o similar.

## 4. Cobertura mínima (meta pragmática)

- Dominio: **≥ 80%** líneas y ≥ 95% branches en invariantes.
- Casos de uso críticos (completeSale, voidSale, open/closeCash, restoreBackup): **≥ 90%** branches (incluidos paths de fallo transaccional).
- UI: cobertura por paths críticos, no por porcentaje de líneas.
- Playwright: al menos 7 specs del listado anterior pasando antes de release.

## 5. Test data builders

Ubicación: `src/test/builders/`.

```typescript
buildProduct(overrides?)       // → Product
buildSaleItem(overrides?)
buildCashSessionOpen()
buildCompleteSaleCommand({ itemsCount: 2, payments: "cash_only" })
```

No hacer mocks de entero a mano. Preferir builders con defaults razonables + overrides.

## 6. Fixtures de base por versión

`src/test/fixtures/db-v1/`: exportación JSON de cada tabla en la v1. Útil para migraciones y escenarios E2E realistas.

## 7. Pruebas que NO hacemos todavía

- Tests visuales snapshot pixel-perfect (cuestan mantenimiento en etapas iniciales).
- Tests de concurrencia multi-pestaña. Útiles, pero más adelante.
- Tests de performance de Dexie con 10k+ productos hasta que el piloto lo requiera.
- Test de service worker update UI cuando exista la actualización automática concreta.

## 8. Puerta de entrada a merge

Sobre cada PR:
```bash
pnpm lint              # biome lint + format
pnpm check             # biome + tsc strict
pnpm test              # vitest (unitarias, applicación, arquitectónicas, migraciones)
pnpm e2e:smoke         # playwright smoke suite (5 specs más estables)
```

Sobre releases / tags:
```bash
pnpm e2e:full          # playwright full suite
```

## Cobertura Fase 4

Vitest cubre cálculos, reglas, mapeadores, formularios, componentes, arquitectura, migración,
diagnóstico y transacciones. Playwright ejecuta el ciclo completo de caja en escritorio y móvil,
incluidos descarte, botón atrás, recarga y ausencia de errores de consola.

## Matriz Fase 6

Unitarias: elegibilidad, motivo, confirmaciones, mapeo y URL. Integración: historial, snapshots,
pagos, stock, caja, rollback, concurrencia, migración y diagnóstico. Arquitectura: pureza, API
pública y escritor único. Componentes/E2E: Sheet, navegación, responsive, accesibilidad y recarga.
