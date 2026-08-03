# Bodegix POS

PWA offline de ventas, caja e inventario para bodegas.

## Identidad

| Campo | Valor |
|---|---|
| Nombre comercial | **Bodegix** |
| Nombre del proyecto | **Bodegix POS** |
| Repositorio | `bodegix-pos` |
| Paquete | `bodegix-pos` |
| Base Dexie | `bodegix-pos` |

## Descripción

Bodegix POS es una aplicación web progresiva (PWA) diseñada para que bodegas pequeñas registren ventas, controlen caja e inventario de forma confiable — incluso sin conexión a internet.

## Arquitectura oficial

> Monolito modular **local-first** y **offline-first** organizado mediante **vertical slices** (funcionalidades verticales). Los módulos críticos aplican **puertos y adaptadores de forma selectiva** para mantener el dominio independiente de React, Dexie y futuras APIs. Las escrituras se implementan mediante **casos de uso transaccionales** y las lecturas mediante **consultas especializadas**.

Nombre resumido:

```text
Local-first modular monolith
+ vertical slices
+ lightweight ports & adapters
+ command/query separation
```

En español:

```text
Monolito modular local-first
+ vertical slices
+ arquitectura hexagonal ligera
+ separación de comandos y consultas
```

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
| Persistencia local | **Dexie** sobre **IndexedDB** + **dexie-react-hooks** |
| Tests unitarios | **Vitest** |
| Tests E2E | **Playwright** |
| PWA | Integración equivalente (manifest + service worker) |

**No se utilizan todavía** (MVP): PostgreSQL, Drizzle ORM, Better Auth, backend, sincronización, microservicios, event sourcing, CQRS distribuido, integración automática de pagos, facturación SUNAT.

## Estructura de carpetas

```text
bodegix-pos/
├── docs/                         # Documentación de producto y ADRs
│   └── adr/                      # Architecture Decision Records
├── public/                       # Assets públicos
├── src/
│   ├── app/                      # Shell de la aplicación
│   │   ├── bootstrap/            # Inicialización (DB, providers, migraciones)
│   │   ├── layout/               # Layouts globales, navegación, shell UI
│   │   ├── providers/            # Providers: theme, PWA, toasts, error boundary
│   │   └── pwa/                  # Service worker, manifest, update prompts
│   │
│   ├── routes/                   # TanStack Router (coordinan composición)
│   │   ├── __root.tsx            # Documento HTML y providers
│   │   ├── index.tsx             # Dashboard / home
│   │   ├── sale.tsx              # Punto de venta
│   │   ├── products.tsx          # Catálogo y categorías
│   │   ├── inventory.tsx         # Movimientos y stock bajo
│   │   ├── cash.tsx              # Apertura, movimientos, cierre
│   │   ├── summary.tsx           # Reportes y resumen diario
│   │   └── settings.tsx          # Configuración y respaldo
│   │
│   ├── modules/                  # MÓDULOS DE NEGOCIO (vertical slices)
│   │   ├── catalog/              # Productos y categorías
│   │   │   ├── domain/           # Entidades: Product, Category; value objects; invariantes
│   │   │   ├── application/      # Casos de uso: createProduct, deactivateProduct...
│   │   │   ├── infrastructure/   # Adaptadores Dexie, servicios de consultas
│   │   │   ├── ui/               # Componentes React específicos
│   │   │   └── index.ts          # API PÚBLICA DEL MÓDULO
│   │   │
│   │   ├── inventory/            # Stock y movimientos de inventario
│   │   ├── sales/                # Ventas + PAGOS (pago NO es módulo independiente en MVP)
│   │   │   ├── domain/
│   │   │   │   ├── sale.ts
│   │   │   │   ├── sale-item.ts
│   │   │   │   ├── sale-payment.ts   # Pago pertenece a sales
│   │   │   │   └── sale-errors.ts
│   │   │   ├── application/      # completeSale, voidSale...
│   │   │   ├── infrastructure/   # Unidades de trabajo transaccionales Dexie
│   │   │   ├── ui/
│   │   │   └── index.ts
│   │   │
│   │   ├── cash/                 # Sesiones de caja
│   │   ├── reporting/            # Proyecciones de lectura (sin dominio artificial)
│   │   │   ├── application/      # getDailySummary, getTopProducts...
│   │   │   ├── infrastructure/   # dexie-report-queries.ts
│   │   │   └── ui/
│   │   ├── backup/               # Respaldo y restauración
│   │   └── settings/             # Ajustes de la app
│   │
│   ├── shared/                   # Shared kernel (mantenerse PEQUEÑO)
│   │   ├── kernel/               # Elementos de dominio compartido
│   │   │   ├── money.ts          # Céntimos, formateo, parseo, vuelto
│   │   │   ├── ids.ts            # UUID v4 crypto, validación
│   │   │   ├── dates.ts          # Epoch ms, zona horaria, límites diarios
│   │   │   ├── result.ts         # Result<T, E> para errores explícitos
│   │   │   └── errors.ts         # DomainError, códigos estandarizados
│   │   │
│   │   ├── infrastructure/       # Adaptadores infraestructura compartidos
│   │   │   ├── db/               # Instancia Dexie singleton, migraciones, diagnóstico
│   │   │   ├── storage/          # StorageManager persist, cuota estimada
│   │   │   └── files/            # Exportación/importación JSON, Blob, checksum
│   │   │
│   │   └── ui/                   # Componentes UI genéricos (no shadcn)
│   │
│   ├── test/                     # Utilidades de test
│   │   ├── builders/             # Object Mother / Test Data Builders
│   │   ├── fixtures/             # Bases Dexie de prueba por versión
│   │   └── setup/                # Setup Vitest, fake-indexeddb, Playwright fixtures
│   │
│   ├── env.ts                    # Variables de entorno tipadas (T3Env)
│   ├── router.tsx                # createRouter, historia, contexto
│   └── styles.css                # Tailwind, tokens, fuente
│
├── AGENTS.md                     # Guías para agentes
├── components.json               # Configuración shadcn/ui
├── documentation-manifest.json   # Manifiesto de docs
├── package.json                  # "bodegix-pos", version, description, packageManager
├── tsconfig.json                 # strict: true
├── tsr.config.json               # TanStack Router config
└── vite.config.ts                # TanStack Start + Nitro + Tailwind
```

## Módulos de negocio definitivos

| Módulo | Responsabilidad |
|---|---|
| **catalog** | Productos, categorías, ciclo de vida activo/inactivo, búsqueda |
| **inventory** | Stock actual + ledger de `InventoryMovement`, entradas, ajustes |
| **sales** | Ventas, ítems, **pagos** (incluidos), carrito, cobro, anulación |
| **cash** | Apertura/cierre, depósitos, retiros, cálculo de efectivo esperado |
| **reporting** | Proyecciones de lectura: diario, top productos, stock bajo |
| **backup** | Exportación, importación, validación, checksum, diagnóstico |
| **settings** | Configuración general, QR, recordatorios, zona horaria |

## Reglas de dependencia

```text
Regla 1: El DOMINIO no importa React, Dexie, TanStack, IndexedDB, APIs navegador.
Regla 2: UI y routes NO coordinan transacciones multi-tabla.
Regla 3: Los módulos solo se comunican por su API pública (index.ts).
Regla 4: No importar archivos privados internos de otros módulos.
Regla 5: Las escrituras pasan por CASOS DE USO transaccionales.
Regla 6: Las lecturas pasan por QUERY SERVICES especializados.
Regla 7: Dexie = adaptador de INFRAESTRUCTURA (nunca dominio).
Regla 8: React = adaptador de ENTRADA (nunca dominio).
Regla 9: No crear interfaces/repositorios genéricos sin necesidad concreta.
Regla 10: El shared kernel debe usarse realmente en MÓDULOS MÚLTIPLES.
```

## Organización interna de un módulo (vertical slice)

```text
module/
├── domain/           Entidades, value objects, invariantes, errores de dominio
├── application/      Casos de uso (escritura) + query services (lectura)
├── infrastructure/   Adaptadores Dexie, implementación de puertos opcionales
├── ui/               Componentes, páginas, hooks, formularios específicos
└── index.ts          EXPORTA SOLAMENTE LA API PÚBLICA
```

Las carpetas solo existen si contienen código real. No hay simetría artificial.

## Puertos y adaptadores (selectivos)

No se crean `ProductRepository`, `ProductMapper`, `ProductDTO` si solo duplican la API de Dexie.

Un puerto modela una CAPACIDAD DE NEGOCIO real:

```typescript
// Puerto para búsquedas de catálogo
interface ProductCatalog {
  findActiveByIds(ids: readonly string[]): Promise<Product[]>;
  searchActive(query: string): Promise<Product[]>;
}

// Puerto para unidad de trabajo crítica
interface CompleteSaleUnitOfWork {
  execute(command: CompleteSaleCommand): Promise<CompletedSale>;
}
```

## Comandos y consultas (separación ligera)

| Capa | Escrituras (comandos) | Lecturas (consultas) |
|---|---|---|
| Consistencia | Transaccional, atómica | Eventual/lectura inmediata |
| Entry point | `completeSale(command)` | `searchProducts(query)` |
| Orquestación | Caso de uso / Unit of Work | Query service especializado |
| Multi-tabla | 1 transacción Dexie | Consulta optimizada |

**No incluye:** buses distribuidos, 2 bases de datos, event sourcing, mensajería.

## Transacciones críticas

`completeSale` ejecuta TODO dentro de una sola transacción Dexie (la UI NUNCA coordina):

1. validar caja abierta
2. consultar productos
3. validar productos activos
4. validar stock suficiente
5. calcular totales
6. validar pagos (suma === total)
7. generar snapshots (nombre, precio, costo)
8. crear sale
9. crear saleItems bulk
10. crear salePayments bulk
11. descontar stockQuantity
12. crear inventoryMovements bulk
13. incrementar nextSaleNumber
14. commit

## Primeros pasos

### Requisitos

- Node.js ≥ 22
- pnpm ≥ 10

### Comandos

```bash
pnpm install       # Instalar
pnpm dev           # Desarrollo en http://localhost:3000
pnpm build         # Build producción
pnpm preview       # Preview build
pnpm lint          # Biome lint
pnpm format        # Biome format
pnpm check         # Biome lint+format+typecheck
pnpm generate-routes  # Generar TanStack Router
```

## Documentación (orden de lectura)

1. [docs/00-decisions-and-assumptions.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/00-decisions-and-assumptions.md) — Decisiones y supuestos aprobados
2. [docs/01-product-vision.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/01-product-vision.md) — Visión del producto
3. [docs/02-mvp-scope.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/02-mvp-scope.md) — Alcance del MVP
4. [docs/06-domain-model.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/06-domain-model.md) — Modelo de dominio
5. [docs/07-database-dexie.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/07-database-dexie.md) — Diseño de BD Dexie
6. [docs/08-application-architecture.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/08-application-architecture.md) — **Arquitectura oficial completa**
7. [docs/10-payments-and-cash.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/10-payments-and-cash.md) — Pagos y caja
8. [docs/14-testing-strategy.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/14-testing-strategy.md) — Estrategia de pruebas
9. [docs/15-implementation-roadmap.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/15-implementation-roadmap.md) — Hoja de ruta
10. [docs/adr/](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/) — ADRs individuales (0001–0013)
