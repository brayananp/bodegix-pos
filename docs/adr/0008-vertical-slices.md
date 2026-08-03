# ADR-0008: Organizar por vertical slices

- Status: Aprobado
- Date: 2026-08-02
- Deciders: Arquitectura del producto

## Context

¿Cómo organizar el código fuente principal para reflejar la modularidad funcional y facilitar la mantenibilidad?

Opciones evaluadas:

1. **Capas globales**: `src/domain`, `src/application`, `src/infrastructure`, `src/components`, `src/hooks`, `src/utils`.
2. **Vertical slices / funcionalidades**: módulos = unidad funcional completa, cada uno con su propio dominio/application/infr/ui.
3. **Híbrido (por tipo + por módulo)**: `src/components/sales/*` + `src/hooks/catalog/*` + `src/services/*`.

## Decision

Organización por **vertical slices** (funcionalidades verticales):

```text
src/modules/
  ├── catalog/       (domain, application, infrastructure, ui, index.ts)
  ├── inventory/
  ├── sales/
  ├── cash/
  ├── reporting/
  ├── backup/
  └── settings/
```

Carpeta interna (`domain/`, `application/`, `infrastructure/`, `ui/`) SOLO si hay código real dentro. Sin simetría artificial.

## Rationale

- **Localidad del cambio**: modificar "cómo cobrar una venta" casi siempre toca `modules/sales/*` y nada más.
- **Cohesión alta, acoplamiento bajo**: un módulo concentra todo lo necesario para resolver su capacidad.
- **Onboarding más fácil**: leer `modules/sales` es entender toda la función de ventas, sin rebuscar en 10 carpetas globales.
- **Escala funcional**: agregar un módulo `payments` independiente en el futuro = agregar una carpeta `modules/payments`. Mismo patrón.
- **Evita el cajón de sastre**: carpetas globales `hooks/` y `utils/` tienden a crecer sin propietario.

## Not-implemented

- Estructura por capas globales.
- Estructura híbrida con `hooks/sales/*`, `services/catalog/*`, etc.

## Consequences

- Positivo: módulos con propietario funcional claro.
- Positivo: testar un módulo es más fácil.
- Riesgo: tentación de duplicar código pequeño entre módulos. Mitigación: `shared/kernel` y `shared/ui` pequeños, con criterio estricto de entrada.
- Riesgo: tentación de saltarse fronteras por importaciones directas. Mitigación: pruebas arquitectónicas que rechacen imports de rutas internas de otros módulos.
- Acción: API pública obligatoria por `index.ts`; regla de importación en ESLint o prueba arquitectónica equivalente.
