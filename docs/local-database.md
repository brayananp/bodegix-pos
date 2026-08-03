# Base de datos local

## Estado en Fase 3

La versión vigente es 2. Registra v1 y luego v2; ambas definiciones permanecen inmutables. V2
añade índices compuestos de inventario y no transforma datos. El modo de diagnóstico profundo
incluye `inventory-ledger-integrity`, que informa inconsistencias de saldo e historial sin reparar.

## Decisión

Bodegix usa **Dexie 4.4.4** como único adaptador sobre IndexedDB. `dexie-react-hooks
4.4.0` está disponible para consultas realmente reactivas, pero la Fase 1 no fuerza
`useLiveQuery`: el panel técnico consume el resultado del bootstrap y consultas explícitas.

La base de producción se llama `bodegix-pos`. Existe una sola instancia, creada por
`getLocalDatabase()` únicamente en el navegador. Importar los módulos en Node o durante la
generación del shell SPA no crea ni abre una base.

## Ubicación y ciclo de vida

```text
src/shared/infrastructure/local-db/
├── records/                 registros y validación Zod
├── schema/                  versiones inmutables
├── diagnostics/             comprobaciones de solo lectura
├── storage/                 adaptador StorageManager
├── bodegix-database.ts      clase Dexie tipada
├── database-client.ts       singleton y apertura perezosa
└── initialize-local-database.ts

src/app/providers/local-database-provider.tsx
└── composition root cliente: initializing → ready | error
```

El provider se monta en el documento raíz. Su efecto cliente abre la base, ejecuta las
migraciones declaradas, garantiza `appSettings/main`, valida el registro y ejecuta diagnóstico
básico. Un fallo muestra un mensaje seguro y permite reintentar; la causa completa solo se
registra en desarrollo.

## Bootstrap idempotente

La creación de `appSettings/main` ocurre en una transacción `rw`. Si ya existe, se valida con
Zod y no se sobrescribe. Por ello `installationId`, `nextSaleNumber` y cualquier configuración
válida sobreviven a recargas e inicializaciones concurrentes. Una configuración corrupta produce
`APP_SETTINGS_INVALID`; no se corrige ni elimina silenciosamente.

## Propiedad de tablas

| Propietario | Tablas |
|---|---|
| catalog | `categories`, `products` |
| inventory | `inventoryMovements` |
| sales | `sales`, `saleItems`, `salePayments` |
| cash | `cashSessions`, `cashMovements` |
| settings | `appSettings` |

La instancia compartida no elimina estos límites. Las rutas y componentes no importan Dexie ni
tablas. El composition root puede iniciar y diagnosticar la base. En fases posteriores, cada
módulo encapsulará acceso en sus adaptadores y expondrá casos de uso o query services públicos.

## Errores y diagnóstico

`LocalDatabaseError` expone códigos estables y mensajes seguros para falta de IndexedDB, apertura,
versión, inicialización, configuración y diagnóstico. El diagnóstico `basic` revisa apertura,
versión, tablas, settings, correlativo y caja abierta. El modo `deep`, activado manualmente, añade
relaciones huérfanas. Ambos son de solo lectura.

Fuentes verificadas: [Dexie TypeScript](https://dexie.org/docs/Typescript),
[Version.stores()](https://dexie.org/docs/Version/Version.stores%28%29),
[transacciones](https://dexie.org/docs/Dexie/Dexie.transaction%28%29) y
[useLiveQuery](https://dexie.org/docs/dexie-react-hooks/useLiveQuery%28%29).
