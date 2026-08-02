# 00. Decisiones y supuestos

## Estado

Aprobado como línea base del MVP. Cualquier cambio que afecte alcance, persistencia, dinero, inventario, pagos o sincronización debe registrarse mediante un ADR.

## Decisiones de producto

| ID | Decisión |
|---|---|
| PD-001 | El producto se dirige inicialmente a bodegas pequeñas con una sola caja operativa. |
| PD-002 | La aplicación debe funcionar sin internet después de su primera carga e instalación. |
| PD-003 | No se requiere cuenta, login ni roles en el MVP. |
| PD-004 | Una instalación representa una sola bodega. |
| PD-005 | El producto prioriza rapidez operativa sobre reportes sofisticados. |
| PD-006 | El comprobante emitido por el MVP es interno y no tributario. |
| PD-007 | SUNAT, nube, multiusuario y multisucursal quedan fuera del MVP. |
| PD-008 | El fiado queda para una versión posterior, salvo evidencia fuerte en el piloto. |

## Decisiones técnicas

| ID | Decisión |
|---|---|
| TD-001 | TanStack Start se utilizará en modo SPA. |
| TD-002 | Dexie.js será el adaptador de persistencia local sobre IndexedDB. |
| TD-003 | `useLiveQuery` se utilizará para lecturas reactivas locales. |
| TD-004 | TanStack Query no será dependencia obligatoria en el MVP local. |
| TD-005 | Zod validará entradas, importaciones y archivos de respaldo. |
| TD-006 | TanStack Form administrará formularios complejos. |
| TD-007 | Las operaciones críticas usarán transacciones Dexie. |
| TD-008 | Los importes se almacenarán como enteros en céntimos. |
| TD-009 | Las fechas se almacenarán como epoch milliseconds UTC. |
| TD-010 | La presentación usará la zona horaria configurada, inicialmente `America/Lima`. |
| TD-011 | Los identificadores usarán `crypto.randomUUID()`. |
| TD-012 | Las cantidades serán enteras en el MVP. |
| TD-013 | No se almacenarán datos sensibles de tarjetas. |
| TD-014 | La aplicación solicitará almacenamiento persistente cuando el navegador lo permita. |
| TD-015 | Las actualizaciones de PWA se presentarán al usuario; no se forzará recarga durante una venta. |

## Supuestos a validar en campo

- El dueño dispone de un teléfono Android relativamente moderno.
- La bodega puede trabajar con una sola instalación durante el piloto.
- El vendedor acepta confirmar manualmente Yape, Plin, tarjeta y transferencias.
- La mayoría de los productos del piloto se venden por unidades enteras.
- El propietario puede realizar un respaldo periódico.
- El valor principal proviene de rapidez, caja y reposición, no de gráficos.
- La conectividad puede fallar, pero el navegador puede instalar y ejecutar la PWA.
- La bodega acepta que una limpieza de datos del navegador puede eliminar información si no existe respaldo.

## Restricciones

- No se garantiza operación compartida entre varios dispositivos.
- No existe recuperación en nube.
- No se resuelven conflictos de sincronización.
- No se genera comprobante electrónico.
- No se procesa una tarjeta directamente.
- No se confirma automáticamente un pago digital.
- No se administran lotes, vencimientos ni números de serie.
- No se venden cantidades fraccionadas.

## Regla de control de alcance

Una función entra en el MVP solo cuando cumple al menos una condición:

1. Es necesaria para completar una venta correctamente.
2. Es necesaria para conservar integridad de inventario o caja.
3. Es necesaria para evitar pérdida irrecuperable de información.
4. Es necesaria para medir el piloto.
