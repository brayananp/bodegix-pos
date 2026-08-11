# Índice de documentación — Bodegix POS

## 📋 Visión general del proyecto

| Documento | Descripción |
|-----------|-------------|
| [README.md](../README.md) | Resumen general del proyecto, stack tecnológico y estado actual |
| [architecture.md](./architecture.md) | Arquitectura general: monolito modular, vertical slices, reglas de dependencia |
| [development.md](./development.md) | Guía de desarrollo: setup, convenciones, flujo de trabajo |
| [testing.md](./testing.md) | Estrategia de pruebas: unitarias, integración, E2E |
| [conventions.md](./conventions.md) | Convenciones de código, nombres, imports, exports |

## 🗄️ Base de datos local

| Documento | Descripción |
|-----------|-------------|
| [local-database.md](./local-database.md) | Introducción a Dexie, IndexedDB y estrategia de persistencia |
| [database-schema-v1.md](./database-schema-v1.md) | Esquema inicial: 9 tablas base (Fase 1-2) |
| [database-schema-v2.md](./database-schema-v2.md) | Índices de inventario (Fase 3) |
| [database-schema-v3.md](./database-schema-v3.md) | Snapshot de caja (Fase 4) |
| [database-schema-v4.md](./database-schema-v4.md) | Borrador de carrito (Fase 5) |
| [database-schema-v5.md](./database-schema-v5.md) | **Anulación de ventas (Fase 6) — NUEVO** |
| [database-schema-v6.md](./database-schema-v6.md) | Índice de total para orden paginado del historial |
| [database-schema-v7.md](./database-schema-v7.md) | Índices de anulaciones por periodo |
| [modules/reporting.md](./modules/reporting.md) | Proyección operativa diaria read-only |
| [database-migrations.md](./database-migrations.md) | Estrategia de migraciones y versionado |
| [storage-persistence.md](./storage-persistence.md) | StorageManager API y prevención de cuota excedida |

## 🏗️ Módulos de negocio

### Catálogo (Fase 2)

| Documento | Descripción |
|-----------|-------------|
| [modules/catalog.md](./modules/catalog.md) | Descripción del módulo de productos y categorías |
| (sin casos de uso específicos) | Operaciones CRUD estándar |

### Inventario (Fase 3)

| Documento | Descripción |
|-----------|-------------|
| [modules/inventory.md](./modules/inventory.md) | Descripción del módulo de stock y movimientos |
| [use-cases/inventory-use-cases.md](./use-cases/inventory-use-cases.md) | Casos de uso: registrar entrada, pérdida, ajuste, stock inicial |
| [ui/inventory-ui.md](./ui/inventory-ui.md) | Interfaz: tabs, sheet de detalle, formularios |
| [database/inventory-integrity.md](./database/inventory-integrity.md) | Integridad del ledger y validaciones |

### Caja (Fase 4)

| Documento | Descripción |
|-----------|-------------|
| [modules/cash.md](./modules/cash.md) | Descripción del módulo de sesiones de caja |
| [use-cases/cash-use-cases.md](./use-cases/cash-use-cases.md) | Casos de uso: abrir, depositar, retirar, arquear, cerrar |
| [ui/cash-ui.md](./ui/cash-ui.md) | Interfaz: estados de sesión, historial, snapshot |
| [database/cash-integrity.md](./database/cash-integrity.md) | Snapshot de cierre y validaciones |

### Ventas (Fase 5-6) — ⭐ ACTUALIZADO

| Documento | Descripción |
|-----------|-------------|
| [modules/sales.md](./modules/sales.md) | **Descripción del módulo de ventas — ACTUALIZADO** |
| [use-cases/sales-use-cases.md](./use-cases/sales-use-cases.md) | **Casos de uso: carrito, revisión, completar venta, historial, anulación — ACTUALIZADO** |
| [ui/sale-ui.md](./ui/sale-ui.md) | **Interfaz: responsive, checkout, historial, anulación — ACTUALIZADO** |
| [database/sale-integrity.md](./database/sale-integrity.md) | **Integridad transaccional multi-tabla — ACTUALIZADO** |
| [database/sale-draft.md](./database/sale-draft.md) | **Persistencia del carrito — ACTUALIZADO** |
| [ui/sales-history-ui.md](./ui/sales-history-ui.md) | Historial, Sheet, responsive y navegación |
| [use-cases/void-sale.md](./use-cases/void-sale.md) | Contrato transaccional de anulación |
| [database/sale-void-integrity.md](./database/sale-void-integrity.md) | Invariantes y diagnóstico de anulación |
| [PHASE-5-SUMMARY.md](./PHASE-5-SUMMARY.md) | **Resumen ejecutivo de Fase 5** |
| [PHASE-6-SUMMARY.md](./PHASE-6-SUMMARY.md) | **Resumen ejecutivo de Fase 6 — NUEVO** |

## 💳 Pagos

| Documento | Descripción |
|-----------|-------------|
| [payments/manual-payment-verification.md](./payments/manual-payment-verification.md) | Confirmación manual de pagos externos (Yape, Plin, POS, transferencia) |
| [payments/payment-reversal.md](./payments/payment-reversal.md) | Confirmación y referencia de devolución por pago |
| [business-rules/sale-void-policy.md](./business-rules/sale-void-policy.md) | Política de anulación completa y sesión original |
| [adr/0011-payments-inside-sales.md](./adr/0011-payments-inside-sales.md) | ADR: Pagos dentro del módulo sales, no separado |

## 💾 Respaldo y restauración (Fase 8)

| Documento | Descripción |
|-----------|-------------|
| [modules/backup.md](./modules/backup.md) | Límite, API pública y garantías del módulo |
| [use-cases/create-backup.md](./use-cases/create-backup.md) | Creación y guardado de una copia completa |
| [use-cases/restore-backup.md](./use-cases/restore-backup.md) | Validación temporal y restore replace-all |
| [backup/backup-format-v1.md](./backup/backup-format-v1.md) | Contrato binario formal `.bodegix` |
| [backup/backup-integrity.md](./backup/backup-integrity.md) | SHA-256, amenazas y límites |
| [backup/backup-compatibility.md](./backup/backup-compatibility.md) | Versiones y registro de migraciones |
| [backup/restore-safety.md](./backup/restore-safety.md) | Copia previa, transacción y recuperación |
| [backup/cross-tab-maintenance.md](./backup/cross-tab-maintenance.md) | Web Locks y BroadcastChannel |
| [ui/backup-restore-ui.md](./ui/backup-restore-ui.md) | Configuración, overlays y accesibilidad |

## 📐 Decisiones arquitectónicas (ADRs)

| ADR | Título |
|-----|--------|
| [0001](./adr/0001-monolito-modular.md) | Monolito modular vs microservicios |
| [0002](./adr/0002-local-first.md) | Local-first con IndexedDB |
| [0003](./adr/0003-dexie.md) | Dexie como wrapper de IndexedDB |
| [0004](./adr/0004-vertical-slices.md) | Vertical slices vs capas horizontales |
| [0005](./adr/0005-puertos-selectivos.md) | Puertos y adaptadores selectivos |
| [0006](./adr/0006-cqs-ligero.md) | Command-Query Separation ligero |
| [0007](./adr/0007-no-repositorio-generico.md) | No repositorios CRUD genéricos |
| [0008](./adr/0008-inventario-hibrido.md) | Inventario híbrido: saldo + ledger |
| [0009](./adr/0009-inventario-propietario.md) | Inventario propietario de stockQuantity |
| [0010](./adr/0010-caja-singleton.md) | Sesión de caja como singleton activo |
| [0011](./adr/0011-payments-inside-sales.md) | **Pagos dentro de sales en MVP** |
| [0012](./adr/0012-cash-snapshot.md) | Snapshot inmutable de cierre de caja |
| [0013](./adr/0013-strict-typescript.md) | TypeScript estricto |
| [0014](./adr/0014-biome.md) | Biome para linting y formateo |
| [0015](./adr/0015-react-testing-library.md) | React Testing Library para componentes |
| [0016](./adr/0016-playwright-e2e.md) | Playwright para pruebas E2E |
| [0017](./adr/0017-sale-draft-persistence.md) | **Persistencia del borrador de carrito — NUEVO** |
| [0020](./adr/0020-portable-backup-and-safe-restore.md) | Respaldo portable y restauración segura |

## 📱 UI y formularios

| Documento | Descripción |
|-----------|-------------|
| [forms/form-architecture.md](./forms/form-architecture.md) | Arquitectura de formularios con TanStack Form |
| [ui/inventory-ui.md](./ui/inventory-ui.md) | Interfaz de inventario |
| [ui/cash-ui.md](./ui/cash-ui.md) | Interfaz de caja |
| [ui/sale-ui.md](./ui/sale-ui.md) | **Interfaz de ventas — ACTUALIZADO** |

## 📊 Especificaciones funcionales (legacy)

Estos documentos son especificaciones iniciales. La **fuente de verdad** es el código y los documentos técnicos actualizados.

| Documento | Estado |
|-----------|--------|
| [00-decisions-and-assumptions.md](./00-decisions-and-assumptions.md) | Histórico |
| [01-product-vision.md](./01-product-vision.md) | Histórico |
| [02-mvp-scope.md](./02-mvp-scope.md) | Histórico |
| [03-personas-and-user-journeys.md](./03-personas-and-user-journeys.md) | Histórico |
| [04-functional-requirements.md](./04-functional-requirements.md) | Histórico |
| [05-business-rules.md](./05-business-rules.md) | Histórico |
| [06-domain-model.md](./06-domain-model.md) | Histórico |
| [07-database-dexie.md](./07-database-dexie.md) | Ver database-schema-v* |
| [08-application-architecture.md](./08-application-architecture.md) | Ver architecture.md |
| [09-offline-pwa-strategy.md](./09-offline-pwa-strategy.md) | Pendiente Fase 9 |
| [10-payments-and-cash.md](./10-payments-and-cash.md) | Ver modules/cash + payments/ |
| [11-backup-and-restore.md](./11-backup-and-restore.md) | Pendiente Fase 8 |
| [12-security-and-privacy.md](./12-security-and-privacy.md) | Pendiente |
| [13-ui-ux-specification.md](./13-ui-ux-specification.md) | Ver ui/*.md |
| [14-testing-strategy.md](./14-testing-strategy.md) | Ver testing.md |
| [15-implementation-roadmap.md](./15-implementation-roadmap.md) | Ver README.md (fases) |
| [16-definition-of-done.md](./16-definition-of-done.md) | Vigente |
| [17-pilot-and-validation.md](./17-pilot-and-validation.md) | Pendiente Fase 9 |
| [18-future-evolution.md](./18-future-evolution.md) | Backlog |

## 🚀 Estado del proyecto por fase

| Fase | Estado | Documentación clave |
|------|--------|---------------------|
| **Fase 1** | ✅ Completado | [local-database.md](./local-database.md), [database-schema-v1.md](./database-schema-v1.md) |
| **Fase 2** | ✅ Completado | [modules/catalog.md](./modules/catalog.md) |
| **Fase 3** | ✅ Completado | [modules/inventory.md](./modules/inventory.md), [database-schema-v2.md](./database-schema-v2.md) |
| **Fase 4** | ✅ Completado | [modules/cash.md](./modules/cash.md), [database-schema-v3.md](./database-schema-v3.md) |
| **Fase 5** | ✅ Completado | [modules/sales.md](./modules/sales.md), [database-schema-v4.md](./database-schema-v4.md), [PHASE-5-SUMMARY.md](./PHASE-5-SUMMARY.md) |
| **Fase 6** | ✅ Completado | [modules/sales.md](./modules/sales.md), [database-schema-v6.md](./database-schema-v6.md), [PHASE-6-SUMMARY.md](./PHASE-6-SUMMARY.md) |
| **Fase 7** | ✅ Completado | [modules/reporting.md](./modules/reporting.md), [ui/daily-summary-ui.md](./ui/daily-summary-ui.md), [database-schema-v7.md](./database-schema-v7.md) |
| Fase 8 | 📋 Planeada | Backup y exportación |
| Fase 9 | 📋 Planeada | Settings avanzado |
| Fase 10 | 📋 Planeada | PWA completa + service worker |

## 📚 Guías de lectura recomendadas

### Para nuevos desarrolladores
1. [README.md](../README.md) — Visión general
2. [architecture.md](./architecture.md) — Estructura y principios
3. [development.md](./development.md) — Setup y convenciones
4. [testing.md](./testing.md) — Estrategia de pruebas

### Para entender la base de datos
1. [local-database.md](./local-database.md) — Fundamentos
2. [database-schema-v7.md](./database-schema-v7.md) — Esquema actual
3. [database-migrations.md](./database-migrations.md) — Versionado

### Para implementar ventas
1. [modules/sales.md](./modules/sales.md) — Descripción del módulo
2. [use-cases/sales-use-cases.md](./use-cases/sales-use-cases.md) — Lógica de negocio
3. [ui/sale-ui.md](./ui/sale-ui.md) — Interfaz y componentes
4. [PHASE-5-SUMMARY.md](./PHASE-5-SUMMARY.md) — Resumen completo

### Para entender decisiones técnicas
1. [adr/](./adr/) — Todas las ADRs
2. [adr/0011-payments-inside-sales.md](./adr/0011-payments-inside-sales.md) — Pagos
3. [adr/0017-sale-draft-persistence.md](./adr/0017-sale-draft-persistence.md) — Carrito

## 🔄 Documentos actualizados en Fase 5

Los siguientes documentos fueron **actualizados** con información del módulo de ventas:

- ✅ [README.md](../README.md) — Estado del proyecto y alcance
- ✅ [architecture.md](./architecture.md) — Slice de ventas
- ✅ [database-schema-v4.md](./database-schema-v4.md) — **NUEVO** esquema con `saleDrafts`
- ✅ [modules/sales.md](./modules/sales.md) — Estructura completa del módulo
- ✅ [use-cases/sales-use-cases.md](./use-cases/sales-use-cases.md) — Casos de uso detallados
- ✅ [ui/sale-ui.md](./ui/sale-ui.md) — Interfaz responsive completa
- ✅ [database/sale-integrity.md](./database/sale-integrity.md) — Transacción atómica
- ✅ [database/sale-draft.md](./database/sale-draft.md) — Carrito persistido
- ✅ [PHASE-5-SUMMARY.md](./PHASE-5-SUMMARY.md) — **NUEVO** resumen ejecutivo

## 📞 Contacto y contribución

Para preguntas, sugerencias o reportes de bugs:
- Revisa primero la documentación relevante
- Consulta los ADRs para decisiones técnicas
- Lee el código fuente (es la fuente de verdad definitiva)

## PWA

- [Arquitectura](pwa/pwa-architecture.md)
- [Service Worker](pwa/service-worker-strategy.md)
- [Comportamiento offline](pwa/offline-behavior.md)
- [Actualizaciones](pwa/update-strategy.md)
- [Instalabilidad](pwa/installability.md)
- [Manifest](pwa/manifest.md)
- [Despliegue](pwa/deployment-requirements.md)

## Release candidate (Fase 10)

- [Checklist de release](release/release-checklist.md)
- [Revisión de seguridad](release/security-review.md)
- [Baseline de rendimiento](release/performance-baseline.md)
- [Soporte de navegadores](release/browser-support.md)
- [Limitaciones conocidas](release/known-limitations.md)
- [Notas de release](release/release-notes.md)
- [Pruebas](pwa/pwa-testing.md)
- [ADR 0021](adr/0021-production-pwa-lifecycle.md)

