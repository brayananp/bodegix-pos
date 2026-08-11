# Bodegix POS

PWA offline-first para ventas, caja, inventario, resumen diario y respaldos de una bodega. La
aplicación funciona en el navegador, guarda datos en IndexedDB y no usa backend, nube ni telemetría.

## Estado

Fase 10: candidato de release `0.1.0`. Incluye catálogo, inventario, caja, ventas, historial y
anulación compensatoria, resumen operativo, respaldo/restauración y ciclo PWA. No está publicado.

## Requisitos

- Node.js `24.14.1` (versión reproducida en CI).
- pnpm `11.20.0`.
- Navegador moderno con IndexedDB, Service Worker y Web Crypto.

## Instalación y desarrollo

```bash
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` sirve la aplicación en `http://localhost:3000`. Los datos de cada origen permanecen en el
dispositivo. No usar datos personales o reales en pruebas.

## Validación

```bash
pnpm format:check       # formato
pnpm lint               # reglas Biome
pnpm typecheck          # TypeScript estricto
pnpm test               # unitarias, integración, componentes y arquitectura
pnpm build              # build Nitro/PWA real
pnpm test:e2e           # flujos desktop y móvil
pnpm test:pwa           # instalación, offline y actualización
pnpm test:a11y          # Axe WCAG A/AA
pnpm test:performance   # datasets sintéticos 10k/50k
pnpm test:smoke         # build real y browser matrix
pnpm release:check      # gate completo del candidato
pnpm release:artifacts  # SBOM, licencias y resumen de bundle
```

## Build y PWA

```bash
pnpm build
pnpm preview
```

El build se genera en `.output/`, sin source maps públicos. El Service Worker precarga el shell y las
rutas operativas; la actualización solicita confirmación y respeta formularios, checkout y restore.
HTTPS es obligatorio fuera de localhost.

## Datos locales y respaldo

Dexie administra IndexedDB con esquema v7. Configuración permite diagnóstico, respaldo manual
`.bodegix` y restauración replace-all con validación temporal, copia previa y recuperación. El archivo
no está cifrado: debe almacenarse y transferirse de forma segura.

### Datos de demostración

En desarrollo, abre `Configuración → Datos y respaldos` y pulsa **Cargar datos demo** sobre una base
vacía. El cargador crea catálogo, inventario, cajas, ventas, pagos, una anulación y un carrito
pendiente usando los casos de uso reales; se detiene si detecta datos existentes.

Con `pnpm dev` activo también puedes generar un respaldo portable repetible:

```bash
pnpm seed:demo:backup
```

El archivo se escribe en `artifacts/demo/bodegix-demo-seed.bodegix` y está ignorado por Git.

## Arquitectura

Monolito modular local-first con módulos `catalog`, `inventory`, `cash`, `sales`, `reporting`, `backup`
y `settings`. Ver [arquitectura](docs/architecture.md), [base local](docs/local-database.md),
[PWA](docs/pwa/pwa-architecture.md) y [documentación de release](docs/release/release-checklist.md).

## Limitaciones

Sin sincronización cloud, multi-dispositivo, autenticación, SUNAT, cantidades fraccionarias ni pagos
integrados automáticamente. Una instalación representa una bodega. Detalle completo en
[limitaciones conocidas](docs/release/known-limitations.md).
