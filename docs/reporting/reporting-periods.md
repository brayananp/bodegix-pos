# Periodos de reporting

La zona comercial proviene de `appSettings/main` y actualmente es `America/Lima`. No se asume UTC,
no se codifica `UTC-5` y no se suman 86.400.000 ms para navegar fechas. `temporal-polyfill` convierte
la fecha civil y zona IANA en un intervalo semiabierto `[inicio, fin)`; esto también es correcto para
zonas con días de 23 o 25 horas.

- ventas creadas: `createdAt` dentro del intervalo;
- anulaciones procesadas: `voidedAt` dentro del intervalo;
- movimientos: `createdAt` dentro del intervalo;
- sesión relacionada: `openedAt < fin && (closedAt === null || closedAt >= inicio)`.

Una sesión puede abrir el día anterior o cerrar después de medianoche. También pueden existir varias
sesiones en una fecha; cada una conserva fondo, apertura, cierre, esperado, contado y diferencia.
