# Estrategia de pruebas — Bodegix POS

## Cobertura de inventario

La Fase 3 prueba la transición pura y los estados de stock, mapeadores y search params, componentes
accesibles, unidad de trabajo real con `fake-indexeddb`, rollback por fallo de inserción,
serialización de entradas concurrentes, migración v1→v2 y diagnóstico de inconsistencias. Las
reglas arquitectónicas protegen propiedad de stock, capas y ciclos entre módulos.

`e2e/inventory.spec.ts` ejecuta en Chromium desktop y móvil el flujo stock inicial → entrada →
conteo → pérdida, recarga, historial, filtro, búsqueda, navegación atrás, descarte de cambios y
clasificación bajo/agotado.

## Cobertura de catálogo

La Fase 2 añade pruebas de mapeadores y campos compuestos, search params seguros,
reglas arquitectónicas, transacciones Dexie y el flujo E2E completo en Chromium de
escritorio y móvil. El E2E cubre categoría, producto, detalle, edición, persistencia,
búsquedas, estado lógico, descarte de cambios y botón atrás.

## Tipos de pruebas

### 1. Unitarias (Vitest)

Prueban lógica pura sin DOM ni red.

**Ubicación:** junto al archivo que prueban (`*.test.ts`)

**Comando:** `pnpm test`

Ejemplo:
```bash
src/shared/kernel/money/money.test.ts
src/shared/kernel/ids/ids.test.ts
src/shared/kernel/text/text.test.ts
src/shared/kernel/dates/dates.test.ts
```

### 2. Componentes (React Testing Library)

Prueban comportamiento observable de componentes React en jsdom.

**Ubicación:** junto al componente (`*.test.tsx`)

**Comando:** `pnpm test`

Ejemplo:
```bash
src/app/layout/app-shell.test.tsx
```

### 3. Arquitectura (Vitest)

Prueban que las reglas de dependencia del monolito modular se cumplen.
Analizan los imports estáticamente sin ejecutar código.

**Ubicación:** `src/test/architecture/arch.test.ts`

**Comando:** `pnpm test`

Qué verifican:
- El kernel no importa React, Dexie ni TanStack Router
- Los módulos no importan archivos privados de otros módulos
- Las rutas no importan infraestructura privada de módulos
- Cada módulo tiene su `index.ts`

### 4. E2E (Playwright)

Prueban flujos completos en navegador real (Chromium).

**Ubicación:** `e2e/*.spec.ts`

**Comando:** `pnpm test:e2e`

Requiere build previo (el playwright.config.ts lo hace automáticamente).

### 5. Integración Dexie

Usa IndexedDB real simulado por `fake-indexeddb 6.2.5`, no mocks de Dexie. Cubre apertura,
esquema/índices, bootstrap, unicidad, rollback y diagnósticos. Cada prueba crea
`bodegix-test-<uuid>`, cierra y elimina la base; nunca toca `bodegix-pos`.

## Helpers de test

### `renderWithRouter`

```typescript
import { renderWithRouter } from "@/test/setup/test-router";

// Renderiza un componente con un router en memoria
renderWithRouter(<MiComponente />, { initialPath: "/sale" });
```

### `setIdGenerator` / `restoreIdGenerator`

```typescript
import { setIdGenerator, restoreIdGenerator } from "@/shared/kernel/ids";

beforeEach(() => setIdGenerator(() => "test-id-fixed"));
afterEach(() => restoreIdGenerator());
```

## Qué NO probar

- Implementación interna de componentes (estado interno, refs)
- Snapshots de HTML completos
- Detalles de estilo CSS
- Lógica de terceros (shadcn/ui, TanStack Router)

## Colocación de pruebas

```
src/shared/kernel/money/
├── money.ts
├── money.test.ts      ← junto al archivo
└── index.ts

src/app/layout/
├── app-shell.tsx
├── app-shell.test.tsx ← junto al componente
└── ...
```

Los tests E2E van en la carpeta `e2e/` en la raíz del proyecto.

La Fase 4 agrega pruebas puras de cálculos/reglas, formularios, componentes, search params,
integración Dexie, migración v3, diagnóstico y el ciclo E2E apertura → depósito → retiro → cierre →
detalle. La integración incluye doble apertura, retiros concurrentes, rollback y fixtures directos
de ventas/pagos sin implementar ventas.
