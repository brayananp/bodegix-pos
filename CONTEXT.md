# Contexto de Bodegix POS

> Documento vivo de incorporación, relevo y contexto para personas y agentes de desarrollo.
> Última actualización: 2026-08-08. Estado cubierto: Fases 1, 2, 3, 4, 5 y 6 completadas.

## Cómo usar este documento

Este archivo explica rápidamente qué es el proyecto, qué está implementado, cuáles son sus
límites y qué decisiones deben conservarse. No reemplaza las especificaciones, ADR ni el código.
Cuando exista una diferencia, se debe contrastar en este orden:

1. Código ejecutable y pruebas vigentes.
2. ADR y documentos normativos de `docs/`.
3. Este resumen de contexto.
4. Comentarios históricos o planes antiguos.

Actualizar este archivo al cerrar una fase, cambiar una decisión arquitectónica, modificar el
modelo persistido o alterar los comandos oficiales de validación.

## Resumen ejecutivo

**Bodegix POS** es una aplicación web para bodegas pequeñas que busca cubrir catálogo,
inventario, ventas, caja, reportes y respaldo con operación local-first. Una instalación
representa una bodega y una caja operativa; el MVP no tiene cuentas, roles, sincronización ni
servidor de negocio.

La aplicación actual es una SPA de TanStack Start. Los datos se almacenan localmente en
IndexedDB mediante Dexie. La Fase 1 dejó lista la infraestructura, la Fase 2 implementó el
catálogo, la Fase 3 implementó inventario con saldo materializado y ledger inmutable, la Fase 4
implementó caja con apertura única, movimientos manuales, arqueo, cierre, snapshot histórico,
consultas reactivas, diagnóstico y UI responsive, la Fase 5 implementó ventas con carrito
persistido, validaciones en tiempo real y transacción atómica multi-tabla, y la Fase 6 implementó
historial de ventas con búsqueda/filtros y anulación compensatoria con restauración de inventario.

## Estado actual

### Fase 1 — Infraestructura local: completada

- TanStack Start en modo SPA y React 19.
- Navegación responsive con sidebar de escritorio y barra inferior móvil.
- Base Dexie `bodegix-pos`, esquema inmutable versión 1 y apertura perezosa en cliente.
- Bootstrap idempotente del singleton `appSettings/main`.
- Diagnóstico básico y profundo de integridad.
- Adaptador de `StorageManager` y panel técnico en Configuración.
- Estados de inicialización, error seguro y reintento en `LocalDatabaseProvider`.
- Pruebas con `fake-indexeddb` que no tocan la base real.

### Fase 2 — Catálogo: completada

En `/products` se puede:

- crear, editar, buscar, listar, desactivar y reactivar categorías;
- crear, editar, consultar, buscar, filtrar, ordenar, paginar, desactivar y reactivar productos;
- buscar productos por nombre normalizado o código de barras;
- visualizar categoría, precios, stock actual, stock mínimo y estado;
- conservar filtros y contexto al abrir o cerrar paneles;
- restaurar un detalle desde la URL y cerrarlo con el botón atrás.

No existe eliminación física de productos o categorías. El stock es visible pero no editable
desde catálogo.

### Fase 3 — Inventario: completada

En `/inventory` se puede:

- consultar, buscar, filtrar, ordenar y paginar existencias;
- diferenciar con stock, stock bajo y agotados;
- registrar stock inicial una sola vez;
- registrar entradas manuales;
- conciliar el saldo mediante cantidad contada;
- registrar pérdidas dañadas, vencidas u otras;
- consultar historial global y por producto;
- restaurar filtros y panel desde la URL.

Cada cambio actualiza `Product.stockQuantity` e inserta un `InventoryMovement` dentro de una sola
transacción. Las cantidades son enteras, el saldo no puede ser negativo y los movimientos no se
editan ni eliminan.

### Fase 4 — Caja: completada

En `/cash` se puede:

- abrir una única sesión con fondo inicial;
- registrar depósitos y retiros manuales con motivo;
- impedir retiros superiores al efectivo esperado;
- consultar efectivo esperado, ventas por método y movimientos;
- arquear y cerrar la caja mostrando faltante, cuadre o sobrante;
- consultar el historial paginado y el detalle de cada cierre;
- restaurar pestaña, panel y sesión desde la URL.

El efectivo esperado es `inicial + ventas en efectivo + depósitos − retiros`; la diferencia es
`contado − esperado`. El cierre persiste un snapshot definitivo para que el historial no cambie
si ventas, pagos o movimientos posteriores evolucionan. Las sesiones cerradas y movimientos son
inmutables.

### Fase 5 — Ventas: completada

En `/sale` se puede:

- buscar productos por nombre normalizado, código de barras o categoría;
- agregar productos al carrito con validación automática de stock;
- modificar cantidades con controles +/− o input directo;
- eliminar productos del carrito o limpiarlo completamente;
- visualizar carrito persistido que sobrevive recargas y navegación;
- revisar automáticamente cambios de precio o stock antes de checkout;
- actualizar precios explícitamente tras detección de cambios;
- realizar checkout con hasta 5 métodos de pago:
  - Efectivo (`cash`) con cálculo automático de vuelto;
  - Yape (`yape`) con referencia obligatoria;
  - Plin (`plin`) con referencia obligatoria;
  - POS externo (`card`) con referencia obligatoria;
  - Transferencia bancaria (`bank_transfer`) con referencia obligatoria;
- completar venta con transacción atómica en 8 tablas;
- visualizar resultado con número de venta, productos vendidos y pagos;
- iniciar nueva venta tras completar o cancelar.

La transacción `completeSale` coordina:

1. Validación de sesión de caja abierta;
2. Incremento de correlativo `nextSaleNumber`;
3. Validación y decremento de stock por producto;
4. Creación de venta (`sales`) con snapshots inmutables en ítems (`saleItems`);
5. Registro de pagos (`salePayments`) con métodos únicos;
6. Generación de movimientos tipo `sale` en inventario (`inventoryMovements`);
7. Eliminación del borrador (`saleDrafts`).

Cualquier fallo en cualquier paso produce rollback completo. El carrito persiste en
`saleDrafts/main` (singleton) entre recargas. Los pagos externos se confirman manualmente. No
El historial y la anulación de Fase 6 reutilizan estos snapshots inmutables.

### Fase 6 — Historial y anulación de ventas: completada

En `/sales` se puede:

- consultar historial paginado de ventas (25, 50 o 100 por página);
- buscar ventas por número;
- filtrar por estado, método, rango de fecha y sesión de caja, además de ordenar;
- visualizar detalle completo de venta en Sheet responsive;
- consultar productos vendidos con cantidades y precios snapshot;
- visualizar pagos, sesión y movimientos `sale`/`sale_void`;
- anular ventas de la sesión de caja actual abierta;
- ingresar motivo obligatorio de anulación (5-240 caracteres);
- confirmar manualmente la devolución exacta de cada pago y guardar referencia externa opcional;
- restaurar stock automáticamente al inventario;
- marcar pagos como anulados sin crear pagos negativos;
- preservar filtros, panel y venta en la URL sin serializar el formulario.

La anulación es compensatoria (soft delete): no elimina registros, sino que marca `voidedAt` y
guarda `voidReason`. Está restringida a ventas de la sesión actual mientras esté abierta. No se
permiten anulaciones parciales ni anulaciones después de cerrar sesión.

La transacción `voidSale` coordina atómicamente `sales`, `saleItems`, `salePayments`,
`cashSessions`, `products` e `inventoryMovements`. Relee y valida dentro de la transacción, agrupa
líneas por producto, crea `sale_void`, restaura stock y marca venta/pagos. No crea
`cashMovements`: caja se recalcula excluyendo venta/pagos anulados. Cualquier fallo hace rollback.
V5 normaliza campos de anulación de pagos y v6 indexa `sales.totalCents`.

### Estado de los demás módulos

| Módulo | Estado funcional |
|---|---|
| `catalog` | Implementado en Fase 2. |
| `settings` | Infraestructura y diagnóstico local de Fase 1. No es configuración completa. |
| `inventory` | Implementado en Fase 3. |
| `sales` | Venta en Fase 5; historial y anulación en Fase 6. |
| `cash` | Implementado en Fase 4. |
| `reporting` | Solo límite del módulo. Sin consultas de negocio reales. |
| `backup` | Solo límite del módulo. Sin exportación, importación o restauración. |

## Alcance y restricciones del MVP

El MVP está pensado inicialmente para:

- una sola bodega por instalación;
- una sola caja operativa;
- cantidades enteras;
- moneda PEN y zona horaria inicial `America/Lima`;
- pagos externos confirmados manualmente en fases futuras;
- operación sin cuenta, login ni roles.

Quedan fuera del MVP: sincronización, nube, multiusuario, multisucursal, SUNAT, procesamiento
directo de tarjetas, integraciones automáticas con Yape/Plin, proveedores, órdenes de compra,
fiado, lotes avanzados, cantidades fraccionadas y analítica avanzada.

Aunque el objetivo del producto es una PWA instalable y completamente offline, el service
worker, la instalación PWA y la validación de arranque sin red pertenecen a una fase posterior.
Actualmente sí existe persistencia local, pero todavía no existe respaldo: borrar los datos del
navegador o perder el dispositivo puede eliminar la única copia.

## Arquitectura oficial

Nombre técnico:

```text
Local-first modular monolith
with vertical slices and lightweight ports & adapters
```

En español:

```text
Monolito modular local-first
+ vertical slices
+ puertos y adaptadores selectivos
+ separación pragmática de comandos y consultas
```

### Capas de una vertical slice

```text
src/modules/<modulo>/
├── domain/          Entidades, invariantes y errores puros
├── application/     Casos de uso de escritura, consultas y puertos
├── infrastructure/ Adaptadores Dexie y detalles técnicos
├── ui/              React, hooks, formularios y páginas del módulo
└── index.ts         Única API pública del módulo
```

No se crean carpetas, puertos o modelos intermedios sin una necesidad real. No se usan
repositorios CRUD genéricos ni una Clean Architecture ceremonial.

### Reglas de dependencia

- Dominio no importa React, TanStack, Dexie, IndexedDB ni APIs del navegador.
- Aplicación no importa UI.
- Rutas y componentes no manipulan tablas ni coordinan transacciones.
- Las escrituras pasan por casos de uso explícitos.
- Las lecturas pasan por query services especializados.
- Dexie es un adaptador de infraestructura.
- Los módulos externos consumen únicamente `src/modules/<modulo>/index.ts`.
- `shared/infrastructure` no importa módulos, aplicación o UI.
- El shared kernel contiene solo utilidades realmente compartidas.
- TanStack Query no se utiliza: las lecturas locales reactivas usan Dexie.
- No existe backend de negocio ni server functions para el dominio del MVP.

Estas fronteras están protegidas por pruebas en `src/test/architecture/arch.test.ts`.

## Estructura principal

```text
bodegix-pos/
├── docs/                         Especificaciones, decisiones y guías
├── e2e/                          Escenarios Playwright
├── src/
│   ├── app/                      Shell y composition root
│   ├── modules/                  Vertical slices de negocio
│   ├── routes/                   Rutas TanStack Router delgadas
│   ├── shared/
│   │   ├── components/           Componentes shadcn/ui
│   │   ├── infrastructure/       Base local y adaptadores compartidos
│   │   ├── kernel/               Dinero, IDs, fechas, texto y Result
│   │   └── ui/forms/             Composición común de TanStack Form
│   └── test/                     Setup y reglas arquitectónicas
├── AGENTS.md                     Guías TanStack Intent para cambios relevantes
├── package.json                  Scripts y dependencias
└── CONTEXT.md                    Este mapa de situación
```

Los imports internos utilizan preferentemente el alias `@/`. El alias `#/` se conserva por
compatibilidad, pero no es el recomendado.

## Persistencia local

- Nombre de la base: `bodegix-pos`.
- Motor: Dexie 4 sobre IndexedDB.
- Versión actual: `6`.
- Las versiones publicadas v1, v2, v3, v4, v5 y v6 son inmutables. La v2 añade índices compuestos de
  inventario. La v3 agrega campos nullable de snapshot a `cashSessions` mediante un upgrade
  explícito que conserva el cuadre previo. La v4 agrega la tabla `saleDrafts` sin upgrade ni
  datos de ejemplo. La v5 inicializa en `null` los campos de anulación de `salePayments`; la v6
  agrega el índice `sales.totalCents`. Cada cambio futuro requiere otra versión.
- La base se crea y abre únicamente en el navegador mediante `getLocalDatabase()`.
- Importar módulos durante SSR o generación del shell no abre IndexedDB.
- Los valores ausentes se persisten como `null`, no como `undefined`.
- El dinero se persiste como enteros en céntimos.
- Los timestamps se persisten como epoch milliseconds UTC.
- Los IDs se generan con `crypto.randomUUID()`.

### Tablas del esquema v6

| Tabla | Propietario | Uso actual |
|---|---|---|
| `categories` | catalog | Funcional. |
| `products` | catalog | Funcional; contiene el stock materializado. |
| `inventoryMovements` | inventory | Funcional; ledger append-only de inventario. |
| `sales` | sales | Funcional; registro histórico e índice de total v6. |
| `saleItems` | sales | Funcional; snapshots de productos vendidos. |
| `salePayments` | sales | Funcional; pagos con lifecycle de anulación v5. |
| `saleDrafts` | sales | Funcional; singleton `main` con carrito persistido. |
| `cashSessions` | cash | Funcional; sesión, cuadre y snapshot histórico. |
| `cashMovements` | cash | Funcional; depósitos y retiros append-only. |
| `appSettings` | settings | Funcional para bootstrap, correlativo y diagnóstico. |

IndexedDB no ofrece foreign keys. Los casos de uso deben comprobar relaciones al escribir y los
diagnósticos detectan relaciones huérfanas. Nunca se debe corregir o borrar silenciosamente un
registro corrupto.

## Dominio de catálogo implementado

### Categoría

```typescript
interface Category {
  id: string;
  name: string;
  normalizedName: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

Reglas vigentes:

- nombre obligatorio de 2 a 60 caracteres;
- espacios externos e internos normalizados;
- unicidad global por `normalizedName`;
- desactivación lógica, sin eliminación física;
- `createdAt` se conserva y `updatedAt` cambia al editar;
- una categoría inactiva no puede asignarse en una operación nueva;
- los productos ya asociados conservan su relación histórica.

### Producto

```typescript
interface Product {
  id: string;
  barcode: string | null;
  name: string;
  normalizedName: string;
  categoryId: string | null;
  salePriceCents: number;
  costPriceCents: number | null;
  stockQuantity: number;
  minimumStockQuantity: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

Reglas vigentes:

- nombre de 2 a 120 caracteres;
- precio de venta entero en céntimos y mayor que cero;
- costo nulo o entero no negativo;
- código opcional, alfanumérico y tratado siempre como string;
- los códigos conservan ceros iniciales;
- el código es único entre productos activos y se vuelve a comprobar al reactivar;
- categoría opcional, pero debe existir y estar activa para una asignación nueva;
- stock inicial siempre `0`;
- editar o cambiar estado conserva stock, fecha de creación y relaciones existentes;
- stock mínimo entero no negativo;
- desactivación lógica, sin eliminación física.

Los fallos esperados se discriminan mediante `CatalogErrorCode`; la UI nunca decide el tipo de
error comparando textos.

## Casos de uso y consultas del catálogo

Escrituras implementadas:

- `createCategory`;
- `updateCategory`;
- `setCategoryActiveState`;
- `createProduct`;
- `updateProduct`;
- `setProductActiveState`.

Lecturas implementadas:

- `getCategoryById`;
- `listCategories`;
- `getProductById`;
- `searchProducts`.

Los adaptadores repiten dentro de la transacción las invariantes susceptibles a carreras, como
unicidad, existencia y categoría activa. `searchProducts` admite búsqueda, categoría, estado,
orden y paginación de 25, 50 o 100 elementos.

`useLiveQuery` aparece exclusivamente en hooks de consulta del catálogo. No se escriben datos,
disparan toasts ni duplican resultados en otro store desde una consulta reactiva.

## Formularios

Existe una sola infraestructura de TanStack Form en `src/shared/ui/forms`:

- `createFormHookContexts()` define `fieldContext` y `formContext` compartidos;
- `createFormHook()` registra campos y componentes de formulario;
- `useAppForm`, `withForm` y `withFieldGroup` son las APIs comunes;
- `AppField` y `AppForm` evitan repetir el cableado de eventos, errores y accesibilidad;
- `ProductFormFields` usa `withForm` para componer los campos del producto;
- los formularios de apertura, movimiento y cierre de caja usan `formOptions`, `withForm`,
  `AppField` y `AppForm` sobre la misma composición;
- `withFieldGroup` compone pagos de checkout y confirmaciones de anulación reutilizables.

Campos registrados:

- `TextField`;
- `MoneyField`;
- `IntegerField`;
- `BarcodeField`;
- `SelectField`;
- `TextareaField`;
- `CheckboxField`;
- `FieldErrorInfo`.

Componentes registrados:

- `SubmitButton`;
- `FormActions`;
- `FormError`;
- `DirtyStateIndicator`;
- `UnsavedChangesGuard`.

Los valores editables no son entidades de dominio. Dinero, cantidades e IDs opcionales se
mantienen como strings mientras el usuario escribe. Los mapeadores puros limpian entradas,
convierten vacíos a `null` y convierten dinero exactamente a céntimos sin
`parseFloat(value) * 100`.

Zod valida formato y submit; los casos de uso vuelven a validar las reglas de negocio. Los
errores conocidos se asignan al campo adecuado y los fallos desconocidos aparecen como error
general sin cerrar el formulario.

## Navegación y UX del catálogo

`/products` es la única ruta del catálogo en esta etapa. No existen rutas separadas para crear,
editar o consultar un producto.

La URL contiene search params Zod para:

```text
tab, q, status, categoryId, page, pageSize, sort,
panel, productId, categoryEditId
```

Los valores predeterminados son pestaña productos, búsqueda vacía, estado activo, página 1,
tamaño 25, orden por nombre ascendente y ningún panel abierto. Una búsqueda o filtro nuevo
regresa a página 1. Los valores de formulario nunca se escriben en la URL.

Superficies utilizadas:

- producto create/detail/edit: un solo `ProductSheet`;
- producto en escritorio: Sheet derecho de 640 px;
- producto en móvil: Sheet de pantalla completa con cuerpo desplazable, footer fijo y safe area;
- categoría en escritorio: `Dialog`;
- categoría en móvil: `Drawer`;
- desactivar, reactivar o descartar cambios: `AlertDialog`.

No se permiten overlays anidados ni `window.confirm`. Detalle → edición cambia el modo del mismo
Sheet. Abrir un panel crea historial; atrás lo cierra. Un cierre explícito conserva la lista y sus
filtros.

Los formularios bloquean navegación, atrás y `beforeunload` cuando
`isDirty && !isSubmitting`. Tras guardar se limpia el estado dirty antes de cerrar.

Una ruta independiente `/products/:productId` solo será apropiada cuando el producto acumule
varias áreas propias, como general, inventario, ventas, compras, proveedores y auditoría.

## Inventario implementado

El modelo es híbrido y no es event sourcing:

```text
Product.stockQuantity      saldo actual para consultas
InventoryMovement[]        historial auditable append-only
```

Comandos públicos:

- `initializeProductStock`: activo, saldo cero, ledger vacío y cantidad positiva;
- `registerStockEntry`: activo, cantidad positiva, referencia/nota opcionales;
- `reconcileProductStock`: activo o inactivo, cantidad contada no negativa y motivo obligatorio;
- `registerStockLoss`: activo o inactivo, cantidad disponible y motivo obligatorio para `other`.

La transición pura deriva tipo, delta, `stockBefore` y `stockAfter`. Un conteo igual al saldo
devuelve `NO_STOCK_CHANGE` sin escribir. Pérdidas mapean `damaged`, `expired` u
`adjustment_out`. Los tipos `sale` y `sale_void` se escriben únicamente en las unidades de trabajo
de ventas.

Estados:

- `out_of_stock`: saldo cero;
- `low_stock`: saldo positivo, mínimo positivo y saldo menor o igual al mínimo;
- `in_stock`: los demás saldos positivos.

`DexieInventoryUnitOfWork` usa `products` e `inventoryMovements`, relee dentro de `rw`, fuerza
orden temporal monotónico por producto y deja que cualquier error produzca rollback. La escritura
concurrente se serializa sin updates perdidos. `Product.updatedAt` significa cualquier cambio
persistido, incluido el stock.

`InventoryQueries` ofrece listado, detalle, resumen, movimiento individual e historiales global y
por producto. Resuelve categorías/productos en lote y usa índices compuestos v2 para filtrar
movimientos. Hooks React observan esas lecturas con `useLiveQuery`; no existe TanStack Query.

El diagnóstico profundo `inventory-ledger-integrity` detecta huérfanos, enteros/signos inválidos,
saldos negativos, ecuación rota, iniciales inválidos/duplicados, productos con saldo sin ledger y
desalineación del último movimiento. Informa IDs y causa, pero nunca repara automáticamente.

`/inventory` usa search params tipados y un solo `InventorySheet` con modos `detail`, `initial`,
`entry`, `reconcile` y `loss`. Conserva filtros/navegación, restaura tras recarga y reutiliza la
protección común de cambios sin guardar. En escritorio usa tabla/Sheet lateral; en móvil,
tarjetas/Sheet de pantalla completa.

## Ventas implementadas

El módulo `sales` posee `Sale`, `SaleItem`, `SalePayment`, `SaleDraft`, reglas de carrito/checkout
y la transacción `completeSale`. Expone ocho operaciones de carrito y dos comandos transaccionales:

**Carrito:**

- `addProduct`;
- `setQuantity`;
- `removeProduct`;
- `clear`;
- `refreshPrices`;
- `reviewSaleDraft` (query pura de validación).

**Venta:**

- `completeSale` (transacción atómica);
- `getSaleResult` (reconstrucción desde snapshots).
- `searchSales` y `getSaleDetail` (historial y detalle);
- `voidSale` (compensación atómica completa);
- `getSaleVoidResult` (resultado reconstruible).

`CompleteSaleUnitOfWork` delimita la transacción multi-tabla y `SaleQueries` ofrece reconstrucción
de resultado y productos para venta. `DexieCompleteSaleUnitOfWork` escribe atómicamente en 8 tablas:
`appSettings`, `cashSessions`, `products`, `sales`, `saleItems`, `salePayments`,
`inventoryMovements` y `saleDrafts`.

La revisión (`reviewSaleDraft`) es una query pura que detecta productos eliminados, inactivos,
agotados, stock insuficiente o precios cambiados. No modifica datos; el usuario decide
explícitamente si actualizar precios mediante `refreshPrices`.

Los ítems persisten snapshots (`productName`, `unitPriceCents`, `unitCostCents`) en el momento de
la venta. Los pagos externos (`yape`, `plin`, `card`, `bank_transfer`) requieren
`operationReference`. Efectivo calcula vuelto automáticamente. La suma de pagos debe igualar
exactamente el total y cada método debe ser único por venta.

El carrito (`saleDrafts/main`) es un singleton que sobrevive recargas, navegación y actualizaciones
PWA. Se elimina automáticamente tras venta exitosa. Las validaciones bloquean checkout si hay
errores críticos (producto no encontrado, inactivo o agotado).

Hooks React (`useSaleDraft`, `useSaleDraftReview`, `useCompleteSale`) usan `useLiveQuery` y
gestionan estados de carga, errores y resultados. La interfaz usa panel dividido en desktop
(catálogo izquierda, carrito derecha) y Sheet móvil con tres modos (`cart`, `checkout`, `result`).

El diagnóstico profundo `sales-integrity` distingue ventas completadas y anuladas; detecta lifecycle
parcial, pagos activos/anulados inconsistentes, restauraciones faltantes/duplicadas, temporalidad,
totales, correlativo y borrador inválido. Solo informa; nunca repara datos.

`/sale` usa search params `q`, `categoryId`, `panel` y `saleId`. Búsqueda por nombre normalizado,
código exacto o categoría. Checkout con TanStack Form, array dinámico de pagos, validación de suma
exacta, indicadores de total asignado/pendiente/vuelto y `UnsavedChangesGuard`. Desktop usa Dialog
para checkout y resultado; móvil usa Sheet bottom responsivo.

El módulo `cash` posee `CashSession`, `CashMovement`, las reglas de efectivo y errores de caja.
Expone cuatro comandos públicos:

- `openCashSession`;
- `registerCashDeposit`;
- `registerCashWithdrawal`;
- `closeCashSession`.

`CashUnitOfWork` delimita escrituras y `CashQueries` ofrece estado global, sesión abierta,
resumen, historial de sesiones y movimientos. `DexieCashUnitOfWork` relee las invariantes dentro
de la transacción. Apertura y movimientos escriben `cashSessions`/`cashMovements`; retiro y cierre
también incluyen `sales` y `salePayments` para recalcular el efectivo definitivo sin escribir en
esas tablas. Los errores abortan toda la transacción y las aperturas concurrentes se serializan.

El cierre guarda cantidad y total de ventas, totales por método, depósitos, retiros, esperado,
contado y diferencia. Las sesiones migradas desde v2 conservan su cuadre y muestran el desglose
como no disponible cuando el snapshot es `null`.

Los hooks de caja usan `useLiveQuery` y etiquetan el resultado por sesión para no reutilizar un
valor reactivo de una consulta anterior. El indicador global del App Shell reacciona a cambios
entre pestañas.

`/cash` usa search params `tab`, `panel`, `sessionId`, `page` y `pageSize`. Apertura y movimientos
usan Dialog en escritorio y Drawer en móvil; el arqueo y el detalle histórico usan Sheet. Los
formularios impiden doble envío, muestran vistas previas y protegen cambios sin guardar. El
detalle soporta recarga, navegación atrás y sesiones inexistentes sin romper la página.

El diagnóstico profundo `cash-integrity` detecta sesiones y movimientos inválidos, temporalidad
incorrecta, datos de cierre incompletos, diferencias erróneas, snapshots ausentes o
inconsistentes y una ecuación de efectivo esperado rota. Solo informa; nunca repara datos.

## Stack y herramientas

| Responsabilidad | Tecnología |
|---|---|
| Framework | TanStack Start, SPA mode |
| UI | React 19, Tailwind CSS 4, shadcn/ui sobre Base UI |
| Lenguaje | TypeScript estricto |
| Navegación | TanStack Router |
| Formularios | TanStack Form |
| Validación | Zod 4 |
| Persistencia | Dexie 4 + IndexedDB |
| Reactividad local | `dexie-react-hooks` |
| Unitarias/componentes | Vitest + React Testing Library |
| E2E | Playwright, Chromium desktop y Pixel 5 emulado |
| Formato y lint | Biome |
| Paquetes | pnpm 11.20.0 |

El `package.json` contiene `pg` por herencia del scaffolding, pero no existe persistencia
PostgreSQL ni backend funcional en el MVP actual.

## Comandos de desarrollo

Requisitos: Node.js 22 o superior y pnpm 11.20.0.

```bash
pnpm install
pnpm dev              # desarrollo en http://localhost:3000
pnpm generate-routes  # regenerar routeTree.gen.ts
pnpm format           # aplicar formato
pnpm format:check     # comprobar formato
pnpm lint             # Biome
pnpm typecheck        # TypeScript sin emitir
pnpm test             # Vitest
pnpm build            # cliente + SSR/Nitro
pnpm test:e2e         # Playwright sobre build existente
pnpm check            # formato + lint + tipos + unitarias + build
pnpm check:full       # check + E2E
```

Antes de editar código relacionado con TanStack, revisar `AGENTS.md` y ejecutar el comando de
TanStack Intent que coincida con el cambio.

## Calidad de Fase 7

La suite incluye dominio, formularios, search params, consultas, rollback, migraciones
v1→v2→v3→v4→v5→v6→v7, diagnóstico y arquitectura. Validación del 2026-08-08: `pnpm check`
correcto; 43 archivos/339 pruebas Vitest; build cliente/SSR/Nitro; revisión visual desktop/móvil y
60 E2E Playwright aprobados en Chromium de escritorio y Pixel 5 emulado.

## Convenciones que deben preservarse

- Archivos en `kebab-case`; componentes exportados en `PascalCase`.
- Named exports, salvo excepciones impuestas por framework.
- No usar `any`, `@ts-ignore`, enums ni casts innecesarios.
- Usar `unknown` y narrowing para errores o entradas externas.
- Respetar `noUncheckedIndexedAccess`.
- Unitarias junto al archivo; E2E en `e2e/`; arquitectura en `src/test/architecture/`.
- Una operación crítica que afecta varias tablas usa una única transacción Dexie.
- No esperar red, temporizadores o UI dentro de una transacción.
- No modificar los esquemas v1, v2, v3, v4, v5, v6 o v7; crear una versión nueva si cambia la estructura.
- No introducir campos especulativos de sincronización.
- No usar importes de coma flotante ni editar stock silenciosamente.
- No modificar pagos o ventas confirmadas sin anulación explícita.
- No duplicar métodos de pago en una misma venta.
- Actualizar documentación y pruebas cuando cambia una invariante.

## Fase actual completada

### Fase 7 — Resumen operativo y cierre diario

`reporting` implementa una proyección diaria read-only en `/summary`, con fechas `America/Lima`,
ventas/pagos, sesiones y flujo de caja, inventario, top productos, ventas recientes y checklist.
No existe cierre o snapshot diario; `CashSession` conserva la autoridad financiera. V7 añade solo
índices para `voidedAt`. La próxima fase es **Fase 8 — Respaldo, restauración y portabilidad de
datos**.

## Documentación de referencia

- Visión y supuestos: `docs/00-decisions-and-assumptions.md` y `docs/01-product-vision.md`.
- Alcance del MVP: `docs/02-mvp-scope.md`.
- Requisitos y reglas: `docs/04-functional-requirements.md` y `docs/05-business-rules.md`.
- Dominio y persistencia: `docs/06-domain-model.md`, `docs/database-schema-v7.md`,
  `docs/database/inventory-integrity.md`, `docs/database/cash-integrity.md`,
  `docs/database/sale-integrity.md` y `docs/local-database.md`.
- Arquitectura: `docs/architecture.md`, `docs/08-application-architecture.md` y `docs/adr/`.
- Catálogo: `docs/modules/catalog.md` y `docs/use-cases/catalog-use-cases.md`.
- Inventario: `docs/modules/inventory.md`, `docs/use-cases/inventory-use-cases.md` y
  `docs/ui/inventory-ui.md`.
- Caja: `docs/modules/cash.md`, `docs/use-cases/cash-use-cases.md`, `docs/ui/cash-ui.md` y
  `docs/database/cash-session-snapshot.md`.
- Ventas: `docs/modules/sales.md`, `docs/use-cases/sales-use-cases.md`,
  `docs/use-cases/void-sale.md`, `docs/ui/sales-history-ui.md`,
  `docs/database/sale-void-integrity.md`, `docs/business-rules/sale-void-policy.md` y
  `docs/PHASE-6-SUMMARY.md`.
- Reporting: `docs/modules/reporting.md`, `docs/use-cases/daily-operational-summary.md`,
  `docs/ui/daily-summary-ui.md` y `docs/reporting/`.
- Formularios y UX: `docs/forms/form-composition.md`, `docs/ui/catalog-ui.md` y
  `docs/ui/overlay-strategy.md`.
- Desarrollo y calidad: `docs/development.md`, `docs/conventions.md`, `docs/testing.md` y
  `docs/16-definition-of-done.md`.
- Índice completo: `docs/INDEX.md`.
- Historial de versiones: `CHANGELOG.md`.
- Hoja de ruta vigente: `docs/15-implementation-roadmap.md`.

## Checklist para continuar el proyecto

Antes de comenzar una fase o cambio significativo:

1. Leer este archivo, `AGENTS.md` y los documentos del módulo afectado.
2. Inspeccionar el código y los tests actuales; no confiar solo en el roadmap.
3. Ejecutar la línea base relevante antes de editar.
4. Mantener el cambio dentro de una vertical slice y su API pública.
5. Añadir pruebas de dominio, integración, arquitectura y E2E según el riesgo.
6. Ejecutar `pnpm check:full` antes de declarar la fase completada.
7. Actualizar este archivo si cambia el estado, alcance o una decisión transversal.
