# Arquitectura de Bodegix POS

## Slice de ventas (Fase 5)

`modules/sales` es propietario de `sales`, `saleItems`, `salePayments` y `saleDrafts`. Coordina una
transacción atómica sobre 8 tablas: lee catálogo y caja, decrementa inventario, genera movimientos,
incrementa correlativo y limpia el borrador. El carrito persiste en `saleDrafts/main` (singleton).
La revisión (`reviewSaleDraft`) es una query pura que compara borrador vs catálogo actual sin
modificar datos; el usuario decide explícitamente si actualizar precios. Los pagos viven dentro de
`sales` (no hay módulo `payments` separado en MVP). La transacción garantiza atomicidad: todo o
nada.

## Slice de inventario (Fase 3)

`modules/inventory` es propietario de `inventoryMovements`, de las reglas de mutación y de
`Product.stockQuantity` después de crear el producto. `catalog` conserva ese campo al editar y
continúa siendo propietario del nombre, código, categoría, precios, estado y stock mínimo.

La escritura entra por cuatro comandos explícitos y un puerto `InventoryUnitOfWork`; el adaptador
Dexie relee el producto y actualiza `products` + `inventoryMovements` en una sola transacción. Las
lecturas entran por `InventoryQueries` y React las observa con `useLiveQuery`. `/inventory` solo
valida search params y monta la página pública. El ledger no se pliega para construir listados.

## Slice de catálogo (Fase 2)

`modules/catalog` aplica dominio puro → casos de uso/puertos → adaptador Dexie → UI.
Los comandos son explícitos, no un repositorio CRUD genérico. Las consultas reactivas
entran a React exclusivamente mediante hooks con `useLiveQuery`; las rutas solo validan
search params y montan la página pública del módulo. Las escrituras transaccionales
revalidan unicidad, categoría activa y conservación del stock.

## Nombre oficial

**Monolito modular local-first con vertical slices, puertos y adaptadores selectivos, y separación ligera de comandos y consultas.**

## Principios fundamentales

| Principio | Descripción |
|---|---|
| Local-first | Los datos viven en IndexedDB (Dexie). No hay backend en el MVP. |
| Modular | Cada funcionalidad de negocio es un módulo independiente con límites claros. |
| Vertical slices | Cada módulo contiene dominio + aplicación + infraestructura + UI. |
| Puertos selectivos | Solo se crean abstracciones cuando existe una frontera real. |
| CQS ligero | Las escrituras pasan por casos de uso; las lecturas por query services. |

## Estructura de módulos

```
src/modules/
├── catalog/      Productos y categorías
├── inventory/    Stock y movimientos (ledger)
├── sales/        Ventas + ítems + pagos + carrito (transacción atómica multi-tabla)
├── cash/         Sesiones de caja
├── reporting/    Consultas de lectura (sin dominio propio)
├── backup/       Exportación e importación
└── settings/     Configuración de la bodega
```

Cada módulo expone **únicamente su `index.ts`** como API pública.

## Reglas de dependencia

```
Regla 1: El DOMINIO no importa React, Dexie, TanStack, IndexedDB ni APIs de navegador.
Regla 2: UI y routes NO coordinan transacciones multi-tabla.
Regla 3: Los módulos se comunican solo por su API pública (index.ts).
Regla 4: No importar archivos privados internos de otros módulos.
Regla 5: Las escrituras pasan por CASOS DE USO transaccionales.
Regla 6: Las lecturas pasan por QUERY SERVICES especializados.
Regla 7: Dexie = adaptador de INFRAESTRUCTURA (nunca dominio).
Regla 8: React = adaptador de ENTRADA (nunca dominio).
Regla 9: No crear repositorios/interfaces genéricos sin necesidad concreta.
Regla 10: El shared kernel solo contiene utilidades usadas en múltiples módulos.
Regla 11: Las rutas y componentes compartidos no importan Dexie ni la base local.
Regla 12: shared/infrastructure no importa app, módulos ni UI.
Regla 13: El composition root puede configurar el provider y ejecutar el bootstrap.
```

## Shared kernel

```
src/shared/kernel/
├── money/     MoneyCents, parseMoneyToCents, formatMoney, addMoney, multiplyMoney
├── ids/       createId, isValidId, setIdGenerator (testeable)
├── dates/     nowTimestamp, isValidTimestamp, TIMEZONE
├── text/      normalizeSearchText, capitalize, truncate
├── result/    Result<T,E>, ok(), err(), unwrap()
└── network/   useOnlineStatus (hook React — única excepción al no-React en kernel)
```

Todo el kernel es **puro** (sin efectos secundarios), excepto `network/` que usa hooks React.

## Organización interna de un módulo (vertical slice)

```
modules/<name>/
├── domain/         Entidades, value objects, invariantes de negocio, errores de dominio
├── application/    Casos de uso (escritura) + query services (lectura)
├── infrastructure/ Adaptadores Dexie, implementaciones de puertos
├── ui/             Componentes React, hooks, formularios específicos del módulo
└── index.ts        ÚNICA API PÚBLICA — nunca importar otros archivos directamente
```

Las carpetas solo se crean cuando existe código real que colocar en ellas.

## Alias de importación

| Alias | Ruta |
|---|---|
| `@/*` | `src/*` (nuevo, recomendado) |
| `#/*` | `src/*` (heredado del scaffolding, sigue funcionando) |

Ejemplo correcto:
```typescript
import { formatMoney } from "@/shared/kernel/money";
import { CATALOG_MODULE } from "@/modules/catalog";
```

Ejemplo incorrecto:
```typescript
// ❌ nunca importes rutas privadas de otro módulo
import { something } from "@/modules/catalog/domain/product";
```

## Decisiones descartadas

| Decisión | Razón |
|---|---|
| Microservicios | Complejidad innecesaria para una bodega pequeña |
| Event sourcing | Overkill para el MVP; Dexie + transacciones es suficiente |
| Clean Architecture estricta | Genera burocracia sin beneficio real en este tamaño |
| PostgreSQL / Drizzle (MVP) | No hay backend en el MVP; todo es local |
| Better Auth (MVP) | No existe autenticación en el MVP |
| TanStack Query (MVP) | No hay servidor; Dexie + React es suficiente |
| Repositorios CRUD genéricos | Duplican la API de Dexie sin valor real |

## Modo SPA

TanStack Start se configura en modo SPA (Single Page Application):
- Renderizado en cliente
- Shell generado estáticamente
- Sin server functions de negocio
- Sin loaders que dependan de servidor

La base local no se instancia ni se abre al importar módulos. El shell estático muestra el fallback
de inicialización y `LocalDatabaseProvider` inicia Dexie desde un efecto cliente. Ver
[local-database.md](./local-database.md).

Para despliegue, el servidor debe redirigir todas las rutas al `index.html`:
- **Nginx:** `try_files $uri $uri/ /index.html;`
- **Apache:** `FallbackResource /index.html`
- **Vercel/Netlify:** rewrite `/*` → `/index.html`

## Fase 4: caja

`cash` aplica el mismo corte vertical que inventario: dominio puro, comandos sobre
`CashUnitOfWork`, lecturas mediante `CashQueries`, adaptadores Dexie y hooks reactivos. Puede leer
la API persistida de ventas para agregación, pero nunca escribirla. El snapshot separa la consulta
histórica de los datos vivos.
