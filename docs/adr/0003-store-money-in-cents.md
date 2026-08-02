# ADR-0003: Guardar dinero en céntimos

## Estado

Aceptado.

## Decisión

Todos los importes monetarios se guardan como enteros.

## Ejemplo

```text
S/ 12.50 → 1250
```

## Motivo

Evitar errores de coma flotante y mantener cálculos deterministas.

## Consecuencia

La UI debe convertir entre texto monetario e enteros mediante utilidades centralizadas.
