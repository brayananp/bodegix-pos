# Release notes — 0.1.0 Release Candidate

## Incluye

Catálogo y categorías; ledger de inventario; apertura/movimientos/cierre de caja; carrito, checkout y
pagos mixtos; historial y anulación compensatoria; resumen diario; diagnóstico; respaldo/restore;
PWA instalable, offline y actualización segura.

## Hardening

Error boundary raíz con recuperación sin borrar datos; CSP/headers; route code splitting corregido;
budgets de bundle; source maps desactivados; audit con overrides acotados; SBOM/licencias; Axe WCAG
A/AA; smoke local Chromium/WebKit y Firefox configurado en CI Linux; stress 10k/50k; release gate reproducible.

## Compatibilidad y actualización

Mantiene esquema Dexie v7 y formato backup v1; no hay migración de datos ni breaking change de
negocio. Instalar dependencias con Node 24.14.1 y pnpm 11.20.0, ejecutar `pnpm release:check` y probar
restore sintético antes de publicar. No desplegar como HTTP.

Limitaciones: ver [known-limitations.md](known-limitations.md). Esta nota no anuncia disponibilidad
general; deployment corresponde a Fase 11.
