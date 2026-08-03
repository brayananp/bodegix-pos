# Bodegix POS

## Estado: Fase 5 ✅

El módulo de ventas está completo y operativo: carrito persistido, búsqueda de productos por nombre/código/categoría, revisión automática de precios y stock, checkout con pagos mixtos y transacción atómica que coordina ventas, inventario y caja en un solo commit.

**PWA offline-first de ventas, caja e inventario para bodegas.**

[![CI](https://github.com/bodegix/bodegix-pos/actions/workflows/ci.yml/badge.svg)](https://github.com/bodegix/bodegix-pos/actions/workflows/ci.yml)

---

## ¿Qué es Bodegix?

Bodegix POS es una aplicación web progresiva (PWA) diseñada para que bodegas pequeñas registren ventas, controlen caja e inventario de forma confiable — incluso sin conexión a internet.

Todo corre en el navegador. No necesita servidor, no necesita internet para funcionar, y los datos se guardan localmente en el dispositivo.

## Estado del proyecto

**Fase 1 — Infraestructura local con Dexie e IndexedDB** ✅

La Fase 1 conserva la fundación técnica e incorpora:
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
- Base Dexie v1 tipada, versionada y abierta de forma perezosa
- Bootstrap idempotente de `appSettings/main`
- Diagnóstico estructural básico y profundo
- StorageManager y panel técnico en Configuración
- Pruebas reales con `fake-indexeddb`

**Fase 2 — Catálogo de productos y categorías** ✅

Productos y categorías con búsqueda, filtros, formularios validados y desactivación lógica.

**Fase 3 — Inventario y movimientos de stock** ✅

Inventario híbrido con saldo materializado + ledger inmutable. Operaciones manuales dentro de unidades de trabajo Dexie.

**Fase 4 — Caja, apertura y movimientos de efectivo** ✅

Caja completa: apertura única, depósitos, retiros, arqueo, cierre con snapshot auditable y concurrencia entre pestañas.

**Fase 5 — Ventas, carrito y pagos** ✅

Sistema de ventas completo:
- Carrito persistido con sobrevivencia a recargas
- Búsqueda de productos por nombre, código de barras y categoría
- Validación automática de stock y precios
- Checkout con pagos mixtos (efectivo, Yape, Plin, POS, transferencia bancaria)
- Transacción atómica en 8 tablas
- Resultado de venta con snapshots de productos
- Interfaz responsive (desktop panel dividido, móvil sheet)
- Pruebas E2E completas en desktop y móvil

**Siguiente fase:** Fase 6 — Módulo reporting + resumen diario

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
| Persistencia local | **Dexie 4.4.4** sobre **IndexedDB** |
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
├── sales/        Ventas + ítems + pagos + carrito
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

## Alcance implementado hasta la Fase 5

El proyecto **contiene:**
- Base técnica y configuración completa
- Layout responsive mobile-first
- Rutas tipadas con navegación funcional
- Módulos delimitados con API pública
- Shared kernel con utilidades reales y probadas
- Suite de pruebas completa (unit + componentes + arquitectura + E2E)
- CI/CD en GitHub Actions
- Esquema local v4, bootstrap, persistencia, cuota y diagnóstico
- Provider cliente con estados de inicialización, error y reintento
- Catálogo completo de productos y categorías con desactivación lógica
- Inventario híbrido: saldo materializado más ledger inmutable
- Operaciones manuales de stock dentro de una unidad de trabajo Dexie
- Resumen, filtros, historial global y por producto con consultas reactivas
- Diagnóstico profundo de integridad del ledger y migración de esquema v1 a v2
- Caja completa: apertura única, depósitos, retiros, arqueo, cierre e historial inmutable
- Snapshot de cierre y migración v2 a v3, consultas reactivas y concurrencia entre pestañas
- **Sistema de ventas completo:**
  - Carrito persistido (`saleDrafts`) con sobrevivencia a recargas
  - Búsqueda y filtrado de productos en tiempo real
  - Gestión de cantidades con validación de stock
  - Revisión automática de cambios de precio
  - Checkout con pagos mixtos y múltiples métodos
  - Transacción atómica en 8 tablas (ventas + inventario + caja)
  - Resultado de venta con snapshots
  - Correlativo de ventas automático (V-000001, V-000002...)
  - Interfaz responsive optimizada para desktop y móvil

Todavía **no contiene:**
- Anulaciones de venta
- Historial administrativo de ventas
- Reportes detallados
- Resumen diario automático
- Service worker completo
- Exportación de datos

## Próximas fases

| Fase | Descripción |
|---|---|
| **Fase 1** | Infraestructura local con Dexie e IndexedDB ✅ |
| **Fase 2** | Catálogo de productos y categorías ✅ |
| **Fase 3** | Inventario y movimientos de stock ✅ |
| **Fase 4** | Caja, apertura y movimientos de efectivo ✅ |
| **Fase 5** | Ventas, carrito y pagos ✅ |
| Fase 6 | Módulo reporting + resumen diario |
| Fase 7 | Módulo backup + exportación |
| Fase 8 | Módulo settings + configuración |
| Fase 9 | PWA completa + service worker offline |

## Documentación

- [Arquitectura](docs/architecture.md)
- [Guía de desarrollo](docs/development.md)
- [Estrategia de pruebas](docs/testing.md)
- [Convenciones](docs/conventions.md)
- [Base de datos local](docs/local-database.md)
- [Esquema v1](docs/database-schema-v1.md)
- [Esquema v2](docs/database-schema-v2.md)
- [Esquema v3](docs/database-schema-v3.md)
- [Esquema v4](docs/database-schema-v4.md)
- [Migraciones](docs/database-migrations.md)
- [Persistencia de almacenamiento](docs/storage-persistence.md)
- [Módulo de inventario](docs/modules/inventory.md)
- [Casos de uso de inventario](docs/use-cases/inventory-use-cases.md)
- [Interfaz de inventario](docs/ui/inventory-ui.md)
- [Integridad de inventario](docs/database/inventory-integrity.md)
- [Módulo de caja](docs/modules/cash.md)
- [Casos de uso de caja](docs/use-cases/cash-use-cases.md)
- [Interfaz de caja](docs/ui/cash-ui.md)
- [Integridad y snapshot de caja](docs/database/cash-integrity.md)
- [Módulo de ventas](docs/modules/sales.md)
- [Casos de uso de ventas](docs/use-cases/sales-use-cases.md)
- [Interfaz de ventas](docs/ui/sale-ui.md)
- [Integridad de ventas](docs/database/sale-integrity.md)
- [Borrador del carrito](docs/database/sale-draft.md)
- [ADRs](docs/adr/)
