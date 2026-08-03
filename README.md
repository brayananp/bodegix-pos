# Bodegix POS

**PWA offline-first de ventas, caja e inventario para bodegas.**

[![CI](https://github.com/bodegix/bodegix-pos/actions/workflows/ci.yml/badge.svg)](https://github.com/bodegix/bodegix-pos/actions/workflows/ci.yml)

---

## ¿Qué es Bodegix?

Bodegix POS es una aplicación web progresiva (PWA) diseñada para que bodegas pequeñas registren ventas, controlen caja e inventario de forma confiable — incluso sin conexión a internet.

Todo corre en el navegador. No necesita servidor, no necesita internet para funcionar, y los datos se guardan localmente en el dispositivo.

## Estado del proyecto

**Fase 0 — Base técnica y arquitectura** ✅

La Fase 0 establece la fundación técnica completa del proyecto:
- TanStack Start configurado en modo SPA
- TypeScript estricto activo
- Layout responsive (sidebar desktop + nav inferior móvil)
- 7 rutas tipadas con navegación funcional
- Módulos de negocio delimitados con API pública
- Shared kernel con utilidades puras (dinero, IDs, fechas, texto, Result)
- Vitest + React Testing Library configurados
- Playwright configurado
- ESLint/Biome con reglas arquitectónicas
- GitHub Actions CI/CD

**Siguiente fase:** Fase 1 — Infraestructura local con Dexie e IndexedDB

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | **TanStack Start** (SPA mode) |
| UI | **React** 19 |
| Lenguaje | **TypeScript** estricto |
| Gestor de paquetes | **pnpm** |
| Estilos | **Tailwind CSS** v4 + **shadcn/ui** |
| Validación | **Zod** |
| Formularios | **TanStack Form** |
| Persistencia local | **Dexie** sobre **IndexedDB** (Fase 1+) |
| Tests unitarios | **Vitest** + **React Testing Library** |
| Tests E2E | **Playwright** |
| Linter/Formatter | **Biome** |
| CI/CD | **GitHub Actions** |

**No se usan en el MVP:** PostgreSQL, Drizzle ORM, Better Auth, backend, sincronización, microservicios.

## Arquitectura

Monolito modular local-first con vertical slices, puertos y adaptadores selectivos, y separación ligera de comandos y consultas.

```
src/modules/
├── catalog/      Productos y categorías
├── inventory/    Stock y movimientos
├── sales/        Ventas + ítems + pagos
├── cash/         Sesiones de caja
├── reporting/    Consultas de lectura
├── backup/       Exportación e importación
└── settings/     Configuración
```

Ver [docs/architecture.md](docs/architecture.md) para el detalle completo.

## Requisitos

- Node.js ≥ 22
- pnpm ≥ 10

## Instalación

```bash
pnpm install
```

## Comandos

```bash
pnpm dev              # Servidor de desarrollo → http://localhost:3000
pnpm build            # Build de producción
pnpm preview          # Preview del build → http://localhost:4173
pnpm typecheck        # Verificación de tipos
pnpm lint             # Biome lint
pnpm format           # Biome format
pnpm format:check     # Verificar formato
pnpm test             # Vitest (una sola vez)
pnpm test:watch       # Vitest en modo watch
pnpm test:e2e         # Playwright E2E
pnpm check            # format + lint + typecheck + test + build
pnpm check:full       # check + E2E
pnpm generate-routes  # Regenerar routeTree.gen.ts
```

## Estructura de carpetas

```
bodegix-pos/
├── .github/workflows/   CI (ci.yml) + Playwright standalone
├── docs/                Documentación técnica y ADRs
│   └── adr/             Architecture Decision Records
├── e2e/                 Tests Playwright
├── public/              Assets estáticos
├── src/
│   ├── app/layout/      Shell, sidebar, header, nav inferior
│   ├── modules/         Módulos de negocio (vertical slices)
│   ├── routes/          Rutas TanStack Router (7 rutas)
│   ├── shared/
│   │   ├── kernel/      Utilidades puras del dominio
│   │   ├── components/  shadcn/ui components
│   │   └── lib/         Utilidades de presentación
│   └── test/            Setup Vitest + pruebas de arquitectura
├── biome.json           Linter + formatter
├── playwright.config.ts
├── tsconfig.json        TypeScript estricto
├── vitest.config.ts
└── vite.config.ts       TanStack Start + Tailwind
```

## Alcance de la Fase 0

La Fase 0 **contiene:**
- Base técnica y configuración completa
- Layout responsive mobile-first
- Rutas tipadas con navegación funcional
- Módulos delimitados con API pública
- Shared kernel con utilidades reales y probadas
- Suite de pruebas completa (unit + componentes + arquitectura + E2E)
- CI/CD en GitHub Actions

La Fase 0 **no contiene todavía:**
- Dexie / IndexedDB / esquema de base de datos
- Formularios de productos
- Carrito de compras
- Pagos
- Apertura/cierre de caja
- Reportes reales
- Service worker completo

## Próximas fases

| Fase | Descripción |
|---|---|
| **Fase 1** | Infraestructura local con Dexie e IndexedDB |
| Fase 2 | Módulo catalog + productos |
| Fase 3 | Módulo sales + carrito + cobro |
| Fase 4 | Módulo cash + apertura/cierre |
| Fase 5 | Módulo inventory + movimientos |
| Fase 6 | Módulo reporting + resumen diario |
| Fase 7 | Módulo backup + exportación |
| Fase 8 | Módulo settings + configuración |
| Fase 9 | PWA completa + service worker offline |

## Documentación

- [Arquitectura](docs/architecture.md)
- [Guía de desarrollo](docs/development.md)
- [Estrategia de pruebas](docs/testing.md)
- [Convenciones](docs/conventions.md)
- [ADRs](docs/adr/)
