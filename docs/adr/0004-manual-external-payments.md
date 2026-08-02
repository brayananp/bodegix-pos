# ADR-0004: Verificación manual de pagos externos

## Estado

Aceptado.

## Decisión

Yape, Plin, tarjeta y transferencia se verifican manualmente durante el MVP.

## Motivo

- Mantener operación local.
- Evitar backend.
- Evitar afiliación e integración por comercio.
- Validar primero el uso diario.

## Reglas

- Advertir contra capturas.
- Registrar referencia opcional.
- No almacenar datos sensibles.
- Diseñar `SalePayment` para futura confirmación automática.
