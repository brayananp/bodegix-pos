# Guía de desarrollo — Bodegix POS

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
