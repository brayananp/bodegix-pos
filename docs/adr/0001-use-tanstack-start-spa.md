# ADR-0001: Usar TanStack Start en modo SPA

## Estado

Aceptado.

## Contexto

El MVP es local y no requiere SSR ni backend, pero existe una posibilidad real de añadir servidor y sincronización posteriormente.

## Decisión

Usar TanStack Start en modo SPA, manteniendo las rutas y los módulos preparados para una evolución full-stack.

## Consecuencias positivas

- Reutiliza experiencia existente.
- Permite evolucionar sin reemplazar el router.
- Mantiene estructura de proyecto conocida.

## Consecuencias negativas

- Tiene más capacidades que las necesarias para el MVP.
- Debe evitarse introducir server functions prematuramente.
- Debe verificarse la integración PWA durante el scaffolding.

## Alternativa descartada

Vite + TanStack Router puro, más simple para una aplicación exclusivamente local.
