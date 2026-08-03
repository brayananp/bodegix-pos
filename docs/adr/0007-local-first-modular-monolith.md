# ADR-0007: Usar monolito modular local-first

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto

## Context

Bodegix POS es una PWA para bodegas pequeñas que debe funcionar completamente offline, en una sola instalación por bodega, y evolucionar posteriormente hacia respaldo en nube, sincronización, multiusuario y multisucursal.

Opciones evaluadas:

1. **Monolito modular local-first** — único despliegue, base Dexie compartida, módulos funcionales con límites claros.
2. **Frontend SPA monolítico tradicional (capas)** — estructura por `components/`, `hooks/`, `services/`, `utils/` globales.
3. **Arquitectura basada en micro-frontends** — división por equipos/features con builds independientes.
4. **Cliente delgado + backend temprano** — la lógica vive en servidor; cliente requiere red.

## Decision

Adoptar **monolito modular local-first** como arquitectura base:

- Una sola aplicación (PWA SPA) compilada y desplegada como un artefacto.
- Código organizado en `src/modules/{catalog,inventory,sales,cash,reporting,backup,settings}`.
- Base de datos local única (`bodegix-pos`) mediante Dexie/IndexedDB compartida.
- Datos y operaciones críticas residen en cliente; la aplicación no depende de red para su funcionamiento principal.
- Futuro backend, cuando exista, comenzará también como monolito modular.

## Rationale

- **Offline real**: toda la lógica transaccional vive en cliente; no hay latencia, ni punto único de fallo en red.
- **Simplicidad operativa del MVP**: un solo proceso, un solo runtime, sin despliegues distribuidos.
- **Evolución limpia**: los límites modulares de hoy (API pública por módulo, separación dominio/infr) son precisamente los que permite después extraer en servicios si — y solo si — la necesidad operativa es demostrable.
- **Evita complejidad prematura**: micro-frontends y cliente delgado introducen costos que no aportan valor en la fase de piloto y bodega pequeña.
- **Desarrollo local-productivo**: base local única permite que los módulos cooperen transaccionalmente sin APIs HTTP intermedias.

## Not-implemented

- Microservicios (ver [ADR-0012](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0012-no-microservices.md)).
- Cliente delgado + backend temprano.
- Micro-frontends.

## Consequences

- Positivo: velocidad de desarrollo, simplicidad del deploy, transacciones ACID locales, test rápido en cliente.
- Positivo: fronteras modulares bien definidas facilitan la extracción futura.
- Negativo: los límites entre módulos deben ser vigilados (pruebas arquitectónicas + reglas de importación), ya que comparten la misma base Dexie y un único proceso JS.
- Negativo: backup, recuperación ante desastres y migraciones son responsabilidad local; deben ser extremadamente robustos.
- Acción: mantener tests arquitectónicos que validen fronteras; documentar cada módulo con su `index.ts` de API pública; planificar desde el MVP el formato de backup y migración.
