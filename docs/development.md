# Guía de desarrollo — Bodegix POS

## Desarrollo de reporting

Las fechas civiles se resuelven con `getBusinessDayRange` y la zona de `appSettings`; nunca con
offsets manuales. Una nueva métrica debe permanecer pura, usar enteros seguros, consultar por lote y
añadir pruebas unitarias/integración. Reporting no admite comandos ni escrituras.

## Desarrollo de inventario

- Añade una mutación como intención del `InventoryUnitOfWork`, nunca como actualización directa de
  `products` desde UI, ruta o catálogo.
- Calcula toda transición en `calculateInventoryTransition`; las reglas dependientes del estado se
  vuelven a comprobar dentro de la transacción.
- Incluye siempre `products` e `inventoryMovements` en una escritura de stock y deja que el error
  aborte la transacción.
- Usa `InventoryQueries` para lecturas paginadas e índices compuestos para historiales filtrados.
- Los formularios declaran `formOptions`, Zod, mapeador puro, `withForm`, `AppField`, `AppForm` y el
  guard compartido de cambios sin guardar.
- Antes de cambiar TanStack Router/Form o Dexie, carga la guía TanStack Intent indicada por
  `AGENTS.md` y contrasta la API oficial vigente.

## Desarrollo de formularios de catálogo

Usa `src/shared/ui/forms` como única infraestructura de TanStack Form. Un formulario
nuevo debe declarar `formOptions`, valores editables independientes del dominio,
esquema Zod y mapeadores puros. No accedas a tablas Dexie desde componentes ni rutas.
Consulta `docs/forms/form-composition.md` y `docs/ui/overlay-strategy.md` antes de
ampliar el catálogo.

## Requisitos

- Node.js ≥ 22
- pnpm ≥ 10
- Git

## Instalación

```bash
git clone <repo>
cd bodegix-pos
pnpm install
```

## Desarrollo de Fase 6

El estado del historial vive en search params tipados; el estado sensible del formulario vive en
TanStack Form. Para validar cambios de anulación ejecuta formato, lint, typecheck, Vitest, pruebas
arquitectónicas, build y Playwright. Las pruebas Dexie siempre usan una base aislada.

## Variables de entorno

No existen variables de entorno obligatorias en la Fase 0.

El archivo `.env.local` existe por compatibilidad con el scaffolding pero no se usa en el MVP.
No lo commités (está en `.gitignore`).

## Comandos principales

```bash
pnpm dev              # Servidor de desarrollo en http://localhost:3000
pnpm build            # Build de producción → dist/
pnpm preview          # Preview del build en http://localhost:4173
pnpm typecheck        # Verificación de tipos TypeScript
pnpm lint             # Biome lint
pnpm format           # Biome format (escribe cambios)
pnpm format:check     # Verificar formato sin modificar
pnpm test             # Vitest (modo run, una sola vez)
pnpm test:watch       # Vitest en modo watch
pnpm test:e2e         # Playwright E2E (requiere build + preview)
pnpm check            # format + lint + typecheck + test + build
pnpm check:full       # check + E2E
pnpm generate-routes  # Regenerar routeTree.gen.ts
```

## Agregar una nueva ruta

1. Crear el archivo en `src/routes/<nombre>.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/layout/app-shell";
import { PageHeader } from "@/app/layout/page-header";

export const Route = createFileRoute("/<nombre>")({
  component: MiPágina,
});

function MiPágina() {
  return (
    <AppShell>
      <PageHeader title="Mi Página" />
      <div className="p-4">Contenido</div>
    </AppShell>
  );
}
```

2. Ejecutar `pnpm generate-routes` para regenerar `routeTree.gen.ts`.

3. Si la ruta necesita aparecer en la navegación, agregarla en `src/app/layout/nav-config.ts`.

## Empezar un módulo nuevo

1. Crear `src/modules/<nombre>/index.ts` con la constante identificadora:

```typescript
export const MI_MODULO = "mi-modulo" as const;
export type MiModuloId = typeof MI_MODULO;
```

2. Crear `src/modules/<nombre>/README.md` documentando la responsabilidad.

3. Solo crear subcarpetas (`domain/`, `application/`, etc.) cuando tengas código real que colocar.

4. Exportar TODO desde `index.ts`. Nunca importar archivos internos desde fuera del módulo.

## Convenciones

## Transacciones Dexie

- Usar `db.transaction("rw", ...)` e incluir todas las tablas afectadas.
- No esperar `fetch`, APIs externas, temporizadores ni diálogos dentro de la transacción.
- Un error que invalida la operación se relanza para forzar rollback.
- Componentes y rutas no inician escrituras ni coordinan transacciones.
- Cada prueba de integración usa un nombre de base único, la cierra y elimina al terminar.

La política completa de versiones está en [database-migrations.md](./database-migrations.md).

Para caja, toda escritura debe atravesar `CashUnitOfWork`. No se actualizan snapshots desde UI ni
se escriben `sales`/`salePayments`. Al cambiar registros o esquema, ejecutar las pruebas focales de
`src/modules/cash`, la migración v3, diagnóstico profundo y `e2e/cash.spec.ts`.

## Convenciones generales

Ver [docs/conventions.md](./conventions.md) para el detalle completo.

Resumen rápido:
- Archivos: `kebab-case.ts`
- Componentes: `PascalCase` en el símbolo, `kebab-case.tsx` en el archivo
- Hooks: `use-feature-name.ts`
- Casos de uso (futuros): `verbo-sustantivo.ts` (ej: `complete-sale.ts`)
- Pruebas: `*.test.ts` / `*.test.tsx` junto al archivo
- E2E: `e2e/*.spec.ts`

## Estructura del proyecto

```
src/
├── app/
│   └── layout/         Shell, sidebar, header, bottom-nav
├── modules/            Módulos de negocio (vertical slices)
├── routes/             Rutas de TanStack Router
├── shared/
│   ├── kernel/         Utilidades puras del dominio
│   ├── components/ui/  Componentes shadcn/ui
│   ├── hooks/          Hooks compartidos
│   └── lib/            Utilidades de presentación (cn, etc.)
└── test/
    ├── architecture/   Pruebas de reglas de arquitectura
    └── setup/          Setup de Vitest y helpers de test
```
