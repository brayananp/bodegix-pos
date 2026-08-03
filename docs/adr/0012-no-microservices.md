# ADR-0012: No utilizar microservicios

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto

## Context

¿Diseñar ya para microservicios?

Opciones evaluadas:

1. **Comenzar con microservicios** (API catalog, API sales, API inventory, API cash...).
2. **Backend modular tipo monolith** (varios servicios lógicos en un proceso) para cuando exista backend.
3. **Sin backend en MVP**. Posible backend futuro empieza como monolito modular. Microservicios solo bajo necesidad operativa demostrable.

## Decision

**No usar microservicios en MVP. El backend futuro, cuando exista, empieza como monolito modular.** Microservicios solo cuando exista una **necesidad operativa demostrable** con al menos uno de:
- límites de escalado distintos entre capacidades (ej: reporting 10x más carga que cash);
- requerimientos de release independientes por equipo;
- heterogeneidad tecnológica justificada;
- aislamiento de fallos por servicio;
- SLOs muy distintos entre dominios.

## Rationale

- **Costo**: microservicios implican red, autenticación entre servicios, observabilidad distribuida, trazabilidad, contratos API versionados, despliegues por servicio, manejo de transacciones distribuidas (sagas, outbox). Costos que no aportan valor a una bodega pequeña con una sola caja.
- **Latencia y offline**: la aplicación principal debe funcionar sin red; los servicios HTTP en cliente son un no-go para transacciones.
- **Monolito modular conserva la opción**: límites modulares de hoy (dominio puro, API pública, puertos) son precisamente los planos de corte para microservicios si llegan a ser necesarios. El costo de extraer es mucho menor que el costo de introducir microservicios prematuramente.

## Not-implemented

- Microservicios en cliente (micro-frontends).
- Microservicios en backend antes de justificación operativa.
- Sagas / transacciones distribuidas.

## Consequences

- Positivo: simplicidad del MVP.
- Positivo: misma estructura de módulos del cliente se replica en backend modular cuando llegue.
- Riesgo: si no se cuidan fronteras modulares, el monolito se convierte en un "distributed monolith" difícil de extraer.
  - Mitigación: pruebas arquitectónicas; API pública por módulo; límites documentados.
- Acción: al diseñar backend, arrancar con monolito modular; exigir ADR con justificación operativa antes de partir cualquier servicio.
