# 04. Requisitos funcionales

## RF-CAT — Catálogo (implementado en Fase 2)

- RF-CAT-01: administrar categorías mediante creación, edición y cambio lógico de estado.
- RF-CAT-02: administrar productos mediante creación, detalle, edición y cambio lógico de estado.
- RF-CAT-03: buscar por nombre o código y filtrar por categoría/estado.
- RF-CAT-04: ordenar y paginar sin perder el contexto de navegación.
- RF-CAT-05: restaurar filtros y panel contextual desde la URL.
- RF-CAT-06: mostrar stock y stock mínimo sin permitir movimientos o edición de stock.

## Convenciones

- Prioridad `MUST`: obligatoria para el MVP.
- Prioridad `SHOULD`: importante, puede aplazarse solo con justificación.
- Prioridad `COULD`: mejora opcional.

## Catálogo

| ID | Requisito | Prioridad |
|---|---|---|
| FR-CAT-001 | Crear productos con nombre y precio de venta. | MUST |
| FR-CAT-002 | Asignar costo, código de barras, categoría y stock mínimo opcionales. | MUST |
| FR-CAT-003 | Buscar productos activos por nombre y código. | MUST |
| FR-CAT-004 | Editar datos comerciales sin modificar ventas históricas. | MUST |
| FR-CAT-005 | Desactivar productos sin eliminarlos físicamente. | MUST |
| FR-CAT-006 | Impedir nombres vacíos y precios negativos. | MUST |
| FR-CAT-007 | Advertir códigos de barras duplicados. | SHOULD |
| FR-CAT-008 | Importar catálogo CSV. | COULD |

## Inventario

| ID | Requisito | Prioridad |
|---|---|---|
| FR-INV-001 | Registrar stock inicial. | MUST |
| FR-INV-002 | Registrar entradas. | MUST |
| FR-INV-003 | Registrar ajustes positivos y negativos. | MUST |
| FR-INV-004 | Guardar stock anterior y posterior. | MUST |
| FR-INV-005 | Mostrar historial por producto. | MUST |
| FR-INV-006 | Distinguir agotado (`stock = 0`), bajo (`0 < stock <= minimumStock`) y con stock. | MUST |
| FR-INV-007 | Impedir stock negativo en toda operación. | MUST |
| FR-INV-008 | Conciliar mediante cantidad contada y derivar automáticamente el delta. | MUST |
| FR-INV-009 | Exigir motivo para conciliaciones y para pérdidas de tipo otra. | MUST |
| FR-INV-010 | Registrar pérdidas por daño, vencimiento u otra causa. | MUST |
| FR-INV-011 | Mantener saldo y movimiento consistentes en una transacción atómica. | MUST |
| FR-INV-012 | Buscar/filtrar inventario y paginar el historial global o por producto. | MUST |
| FR-INV-013 | Conservar movimientos inmutables sin edición ni eliminación. | MUST |

## Ventas

| ID | Requisito | Prioridad |
|---|---|---|
| FR-SAL-001 | Crear carrito con productos activos. | MUST |
| FR-SAL-002 | Modificar cantidades enteras. | MUST |
| FR-SAL-003 | Recalcular total automáticamente. | MUST |
| FR-SAL-004 | Validar stock inmediatamente antes de confirmar. | MUST |
| FR-SAL-005 | Crear venta, ítems, pagos y movimientos en una transacción. | MUST |
| FR-SAL-006 | Generar número correlativo interno. | MUST |
| FR-SAL-007 | Guardar snapshots de nombre, precio y costo. | MUST |
| FR-SAL-008 | Consultar detalle de venta. | MUST |
| FR-SAL-009 | Anular una venta completada. | MUST |
| FR-SAL-010 | Impedir anular dos veces. | MUST |
| FR-SAL-011 | Registrar motivo de anulación. | MUST |

## Pagos

| ID | Requisito | Prioridad |
|---|---|---|
| FR-PAY-001 | Registrar efectivo. | MUST |
| FR-PAY-002 | Registrar Yape, Plin, tarjeta y transferencia. | MUST |
| FR-PAY-003 | Registrar varios pagos por venta. | MUST |
| FR-PAY-004 | Validar que la suma coincida con el total. | MUST |
| FR-PAY-005 | Calcular vuelto. | MUST |
| FR-PAY-006 | Guardar referencia opcional. | MUST |
| FR-PAY-007 | Marcar métodos externos como verificados manualmente. | MUST |
| FR-PAY-008 | Mostrar advertencia contra capturas falsas. | MUST |

## Caja

| ID | Requisito | Prioridad |
|---|---|---|
| FR-CSH-001 | Abrir una caja con efectivo inicial. | MUST |
| FR-CSH-002 | Impedir dos cajas abiertas. | MUST |
| FR-CSH-003 | Asociar ventas a la caja abierta. | MUST |
| FR-CSH-004 | Registrar depósitos y retiros manuales. | MUST |
| FR-CSH-005 | Calcular efectivo esperado. | MUST |
| FR-CSH-006 | Registrar efectivo contado. | MUST |
| FR-CSH-007 | Calcular diferencia. | MUST |
| FR-CSH-008 | Mostrar totales no efectivos por separado. | MUST |
| FR-CSH-009 | Permitir ventas sin caja solo mediante configuración de emergencia. | COULD |

## Respaldo

| ID | Requisito | Prioridad |
|---|---|---|
| FR-BCK-001 | Exportar todas las tablas. | MUST |
| FR-BCK-002 | Incluir versión, fecha, instalación y checksum. | MUST |
| FR-BCK-003 | Validar respaldo antes de importar. | MUST |
| FR-BCK-004 | Mostrar resumen antes de reemplazar datos. | MUST |
| FR-BCK-005 | Exportar respaldo previo a restauración. | MUST |
| FR-BCK-006 | Mostrar fecha del último respaldo. | MUST |
| FR-BCK-007 | Recordar respaldo según configuración. | MUST |

## PWA

| ID | Requisito | Prioridad |
|---|---|---|
| FR-PWA-001 | Instalarse en navegador compatible. | MUST |
| FR-PWA-002 | Cargar el shell sin conexión. | MUST |
| FR-PWA-003 | Mantener operaciones locales sin conexión. | MUST |
| FR-PWA-004 | Informar cuando existe una actualización. | MUST |
| FR-PWA-005 | Evitar recarga automática durante una venta. | MUST |
| FR-PWA-006 | Informar estado de persistencia y almacenamiento. | SHOULD |

## Implementación Fase 4

Se implementaron apertura única, fondo inicial, depósitos, retiros limitados por efectivo esperado,
arqueo, cierre con diferencia, historial paginado, detalle persistente y estado global reactivo.
