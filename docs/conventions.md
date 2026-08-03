# Convenciones de Bodegix POS

## Formularios, dinero y catálogo

- Los valores monetarios permanecen como `string` mientras se editan y se convierten
  exactamente a céntimos en el mapper; está prohibido `parseFloat(value) * 100`.
- Los campos compartidos usan `useFieldContext<T>()`; los módulos consumen `AppField`
  y los componentes registrados viven dentro de `AppForm`.
- Los errores de catálogo se discriminan por `CatalogErrorCode`, nunca por texto.
- Los filtros y overlays de `/products` se representan en search params validados.
- Stock, `createdAt` y relaciones históricas no se sobrescriben desde formularios.

## Nombres de archivos

| Tipo | Convención | Ejemplo |
|---|---|---|
| TypeScript general | `kebab-case.ts` | `money.ts`, `nav-config.ts` |
| Componente React | `kebab-case.tsx` | `app-shell.tsx`, `page-header.tsx` |
| Hook | `use-feature-name.ts` | `use-online-status.ts`, `use-mobile.ts` |
| Caso de uso (futuro) | `verbo-sustantivo.ts` | `complete-sale.ts`, `void-sale.ts` |
| Query service (futuro) | `get-*.ts` / `list-*.ts` | `get-daily-summary.ts` |
| Prueba unitaria | `*.test.ts` / `*.test.tsx` | `money.test.ts`, `app-shell.test.tsx` |
| Prueba E2E | `*.spec.ts` | `navigation.spec.ts` |
| Barrel público | `index.ts` | `src/modules/catalog/index.ts` |

## Nombres de símbolos

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente React | `PascalCase` | `AppShell`, `PageHeader`, `OfflineBadge` |
| Hook | `use` + camelCase | `useOnlineStatus`, `useIsMobile` |
| Función | `camelCase` | `parseMoneyToCents`, `createId` |
| Constante módulo | `UPPER_SNAKE_CASE` | `CATALOG_MODULE`, `SALES_MODULE` |
| Tipo / Interface | `PascalCase` | `MoneyCents`, `NavItem`, `Result` |
| Enum (evitar) | Usar uniones literales | `type Status = "active" \| "inactive"` |

## Imports

### Orden (gestionado por Biome)

1. Node.js built-ins (`node:fs`, `node:path`)
2. Paquetes externos (`react`, `@tanstack/...`)
3. Alias internos (`@/shared/...`, `@/modules/...`, `@/app/...`)
4. Relativos (`./foo`, `../bar`)

### Alias

Usa siempre `@/` para imports internos:

```typescript
// ✅ correcto
import { formatMoney } from "@/shared/kernel/money";
import { CATALOG_MODULE } from "@/modules/catalog";

// ❌ evitar (funciona pero es heredado)
import { formatMoney } from "#/shared/kernel/money";

// ❌ prohibido — ruta privada de otro módulo
import { Product } from "@/modules/catalog/domain/product";
```

## Barrel files (index.ts)

- Cada módulo **debe** tener un `index.ts` que exporta su API pública.
- Los `index.ts` del kernel re-exportan desde los archivos internos.
- **No** crear barrel files en carpetas de UI solo por simetría.

## Exports

- Preferir **named exports** sobre default exports.
- Los componentes de ruta son la única excepción permitida.

```typescript
// ✅ named export
export function AppShell() { ... }

// ✅ excepción — componente de ruta (TanStack lo requiere como named)
export const Route = createFileRoute("/sale")({ ... });
```

## Prohibiciones arquitectónicas

```typescript
// ❌ El dominio no puede importar:
import React from "react";
import Dexie from "dexie";
import { useNavigate } from "@tanstack/react-router";

// ❌ Las rutas no pueden importar:
import { completeSaleUnitOfWork } from "@/modules/sales/infrastructure/...";

// ❌ Los módulos no pueden importar internos de otros módulos:
import { Product } from "@/modules/catalog/domain/product";
// ✅ Usar la API pública:
import { type Product } from "@/modules/catalog";

// ❌ No crear abstracciones sin uso real:
interface IProductRepository { ... }  // No si solo hay Dexie
```

La instancia y las tablas de `shared/infrastructure/local-db` solo se consumen desde
infraestructura o el composition root. `routes/**`, `shared/components/**`, dominio y application
no importan `dexie`, `dexie-react-hooks` ni el cliente de base. `shared/infrastructure` nunca
importa UI. Los módulos acceden a persistencia futura mediante adaptadores privados propios.

## Colocación de pruebas

- Las pruebas unitarias y de componentes van **junto al archivo** que prueban.
- Las pruebas E2E van en `e2e/` en la raíz.
- Las pruebas de arquitectura van en `src/test/architecture/`.
- Los helpers de test van en `src/test/setup/` y `src/test/builders/`.

## TypeScript

- No usar `any`. Usar `unknown` y narrowing.
- No usar `@ts-ignore`. Resolver el error real.
- No usar `as Type` innecesariamente. Preferir type guards.
- No usar `enum`. Usar uniones literales (`type X = "a" | "b"`).
- Activar y respetar `noUncheckedIndexedAccess`: acceder a arrays con verificación.
