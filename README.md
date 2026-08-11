# Bodegix POS

## Estado: Fase 8 ✅

La Fase 8 incorpora respaldo completo `.bodegix`, integridad SHA-256, validación profunda en una
base temporal y restauración replace-all con copia previa, transacción, recuperación automática y
coordinación entre pestañas. El esquema permanece en v7: no se añade ninguna tabla de respaldo.

El sistema de ventas está completo con historial y anulación de transacciones: búsqueda y filtrado de ventas históricas, detalle completo de ventas, y anulación compensatoria de ventas con reglas estrictas de sesión de caja.

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

**Fase 6 — Historial de ventas y anulación de transacciones** ✅

Sistema de historial y anulación de ventas:
- Historial de ventas con búsqueda y filtros (estado, método de pago, texto)
- Paginación eficiente (20 ventas por página)
- Detalle completo de venta en Sheet responsive
- Anulación compensatoria de ventas (no eliminación física)
- Validación estricta: solo anular ventas de la sesión de caja actual abierta
- Devolución automática de stock al inventario
- Marcado de pagos como anulados
- Registro de motivo obligatorio (5-240 caracteres)
- Interfaz responsive con Dialog (desktop) y Drawer (móvil)
- 13 pruebas E2E completas

**Fase 7 — Resumen operativo diario** ✅

Proyección reactiva de ventas, pagos, caja e inventario con checklist accionable y sin snapshots.

**Fase 8 — Respaldo, restauración y portabilidad** ✅

- Todas las tablas se exportan con `dexie-export-import`.
- Contenedor binario v1 sin base64 ni ZIP, con SHA-256 de manifiesto y payload.
- File System Access con fallback de descarga/archivo.
- Validación temporal y diagnóstico antes de tocar la base actual.
- Copia previa obligatoria, restore transaccional y recuperación automática.
- Web Locks compartidos/exclusivos y coordinación por BroadcastChannel.
- UI en Configuración, recordatorio y acción desde el resumen diario.

**Siguiente fase:** Fase 9 — PWA, instalación, actualizaciones y endurecimiento offline

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
| Portabilidad | **dexie-export-import 4.4.0** + Web Crypto |
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
- Reportes detallados y análisis
- Resumen diario automático con cierre de día
- Service worker completo con sincronización
- Exportación e importación de datos completa

## Próximas fases

| Fase | Descripción |
|---|---|
| **Fase 1** | Infraestructura local con Dexie e IndexedDB ✅ |
| **Fase 2** | Catálogo de productos y categorías ✅ |
| **Fase 3** | Inventario y movimientos de stock ✅ |
| **Fase 4** | Caja, apertura y movimientos de efectivo ✅ |
| **Fase 5** | Ventas, carrito y pagos ✅ |
| **Fase 6** | Historial de ventas y anulación de transacciones ✅ |
| **Fase 7** | Módulo reporting + resumen diario ✅ |
| Fase 8 | Módulo backup + exportación |
| Fase 9 | Módulo settings + configuración |
| Fase 10 | PWA completa + service worker offline |

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
- [Esquema v7](docs/database-schema-v7.md)
- [Módulo reporting](docs/modules/reporting.md)
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

## Fase 6 — historial y anulación

`/sales` ofrece historial paginado, filtros restaurables, detalle histórico y anulación completa
solo en la sesión original abierta. La compensación es atómica: conserva la venta, anula pagos,
restaura stock con `sale_void` y no crea movimientos de caja. Esquema de esa fase: v6.

## Fase 9 — PWA de producción

El build genera manifest y Service Worker con actualización manual segura. Tras la primera carga,
las rutas operativas y los datos Dexie funcionan offline. Configuración muestra instalación,
conectividad, versión y actualizaciones; dirty forms, checkout y restore bloquean la recarga.

```bash
pnpm test:pwa
pnpm check:full
```

Documentación: [arquitectura PWA](docs/pwa/pwa-architecture.md), [offline](docs/pwa/offline-behavior.md),
[actualizaciones](docs/pwa/update-strategy.md) y [despliegue](docs/pwa/deployment-requirements.md).
