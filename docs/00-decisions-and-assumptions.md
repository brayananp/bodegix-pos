# 00. Decisiones y supuestos

## Estado

Aprobado como línea base del MVP y de la arquitectura. Cualquier cambio que afecte alcance, persistencia, dinero, inventario, pagos, sincronización o límites arquitectónicos debe registrarse mediante un ADR y actualizar este documento.

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

## Decisiones arquitectónicas

| ID | Decisión | ADR |
|---|---|---|
| AD-001 | **Arquitectura local-first y offline-first**. Datos y operaciones críticas viven en IndexedDB; la aplicación funciona permanentemente sin red. | [ADR-0007](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0007-local-first-modular-monolith.md) |
| AD-002 | **Monolito modular**. Un solo deploy, un solo repo, una sola base Dexie compartida; módulos funcionales con límites claros. | [ADR-0007](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0007-local-first-modular-monolith.md) |
| AD-003 | **No utilizar microservicios en MVP ni en backend inicial**. No existe necesidad operativa demostrable. | [ADR-0012](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0012-no-microservices.md) |
| AD-004 | **Organización por vertical slices / funcionalidades**, no por capas globales. `src/modules/{catalog,inventory,sales,cash,reporting,backup,settings}`. | [ADR-0008](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0008-vertical-slices.md) |
| AD-005 | **Arquitectura hexagonal ligera / puertos selectivos**. Aplicar puertos y adaptadores solo en fronteras reales; el dominio NO depende de React ni Dexie. | [ADR-0009](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0009-selective-ports-and-adapters.md) |
| AD-006 | **Separar comandos y consultas** sin CQRS completo. Casos de uso para escrituras; query services para lecturas. | [ADR-0010](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0010-command-query-separation.md) |
| AD-007 | **Pagos dentro del módulo sales** en el MVP. Módulo de pagos independiente solo cuando existan pasarelas, webhooks, conciliación automática. | [ADR-0011](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0011-payments-inside-sales.md) |
| AD-008 | **Reporting sin dominio artificial**. Reporting son proyecciones de lectura; no requiere entidades ni repositorios de dominio propios. | Implícito |
| AD-009 | **No utilizar event sourcing completo**. Inventario usa `stockQuantity` + movimientos híbrido. | [ADR-0013](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0013-no-event-sourcing.md) y [ADR-0005](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0005-inventory-ledger.md) |
| AD-010 | **Dexie como adaptador local** sobre IndexedDB. `db` vive en `shared/infrastructure/db`. | [ADR-0002](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0002-use-dexie.md) y [ADR-0014](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0014-dexie-as-local-adapter.md) |
| AD-011 | **Inventario híbrido**: stock actual desnormalizado + ledger de movimientos. No es event sourcing. | [ADR-0005](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0005-inventory-ledger.md) y [ADR-0015](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0015-inventory-hybrid-model.md) |

## Decisiones técnicas

| ID | Decisión |
|---|---|
| TD-001 | TanStack Start se utilizará en modo SPA. |
| TD-002 | Dexie.js será el adaptador de persistencia local sobre IndexedDB. |
| TD-003 | `useLiveQuery` se utilizará en hooks/adaptadores, no en dominio. |
| TD-004 | TanStack Query no será dependencia obligatoria en el MVP local. |
| TD-005 | Zod validará entradas, importaciones y archivos de respaldo. |
| TD-006 | TanStack Form administrará formularios complejos. |
| TD-007 | Las operaciones críticas usarán transacciones Dexie (una sola transacción por caso de uso crítico). |
| TD-008 | Los importes se almacenarán como enteros en céntimos. |
| TD-009 | Las fechas se almacenarán como epoch milliseconds UTC. |
| TD-010 | La presentación usará la zona horaria configurada, inicialmente `America/Lima`. |
| TD-011 | Los identificadores usarán `crypto.randomUUID()` (UUID v4). |
| TD-012 | Las cantidades serán enteras en el MVP. |
| TD-013 | No se almacenarán datos sensibles de tarjetas. |
| TD-014 | La aplicación solicitará almacenamiento persistente cuando el navegador lo permita. |
| TD-015 | Las actualizaciones de PWA se presentarán al usuario; no se forzará recarga durante una venta. |
| TD-016 | Los módulos exponen una API pública mediante `index.ts`. No se permiten imports internos arbitrarios entre módulos. |
| TD-017 | No anticipar campos de sincronización futuros (`tenantId`, `branchId`, `userId`, `deviceId`, `syncStatus`, `serverVersion`, `deletedAt`) hasta que exista infraestructura real. |
| TD-018 | No se crean interfaces/repositorios CRUD genéricos. Solo puertos que modelan capacidades de negocio. |

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
- No existen backend ni PostgreSQL en el MVP.

## Regla de control de alcance

Una función entra en el MVP solo cuando cumple al menos una condición:

1. Es necesaria para completar una venta correctamente.
2. Es necesaria para conservar integridad de inventario o caja.
3. Es necesaria para evitar pérdida irrecuperable de información.
4. Es necesaria para medir el piloto.
