# 15. Hoja de ruta de implementación

## Fase 0 — Preparación

### Entregables

- Repositorio.
- TanStack Start SPA.
- TypeScript estricto.
- Tailwind y shadcn/ui.
- ESLint/formatter.
- Vitest.
- Playwright.
- Estructura modular.
- CI básica.
- ADR inicial.

### Criterios

- `pnpm dev`, `test`, `build` y `test:e2e` funcionan.
- La ruta `/sale` carga.
- No existe código de negocio todavía.

## Fase 1 — Base local

### Entregables

- Tipos de dominio.
- Zod schemas.
- Dexie v1.
- Bootstrap de configuración.
- IDs.
- dinero.
- fechas.
- diagnóstico básico.
- solicitud de persistencia.

### Criterios

- Base abre.
- Configuración se crea una sola vez.
- Migración v1 probada.
- Diagnóstico detecta inconsistencias básicas.

## Fase 2 — Catálogo

### Entregables

- CRUD.
- categorías.
- búsqueda.
- desactivación.
- formulario.
- validaciones.

### Criterios

- Crear, editar, buscar y desactivar.
- No modificar stock desde edición.
- Precio almacenado en céntimos.

## Fase 3 — Inventario

### Entregables

- stock inicial;
- entrada;
- ajustes;
- historial;
- stock bajo.

### Criterios

- Cada cambio crea movimiento.
- Stock anterior/posterior consistentes.
- Motivo obligatorio en ajustes.

## Fase 4 — Caja

### Entregables

- apertura;
- depósito;
- retiro;
- estado activo;
- cálculo preliminar.

### Criterios

- Solo una caja abierta.
- Movimientos manuales auditables.
- Venta futura puede asociarse a caja.

## Fase 5 — Venta y pagos

### Entregables

- catálogo de venta;
- carrito;
- cobro;
- efectivo;
- Yape;
- Plin;
- tarjeta;
- transferencia;
- pago mixto;
- transacción de checkout.

### Criterios

- Venta atómica.
- Sin stock negativo.
- Pagos cuadran.
- Caja e inventario consistentes.
- Tiempo objetivo medido.

## Fase 6 — Historial y anulación

### Entregables

- ventas del día;
- detalle;
- anulación;
- reversión de stock;
- auditoría.

### Criterios

- No se elimina.
- No se anula dos veces.
- Totales netos correctos.

## Fase 7 — Cierre y resumen

### Entregables

- cierre;
- efectivo esperado;
- contado;
- diferencia;
- resumen por método;
- más vendidos;
- stock bajo.

### Criterios

- Fórmulas probadas.
- Caja cerrada inmutable.
- Resumen excluye anuladas.

## Fase 8 — Respaldo

### Entregables

- exportar;
- inspeccionar;
- restaurar;
- checksum;
- respaldo previo;
- CSV.

### Criterios

- Restauración en instalación limpia.
- Archivo inválido rechazado.
- Diagnóstico posterior aprobado.

## Fase 9 — PWA

### Entregables

- manifest;
- iconos;
- service worker;
- app shell;
- aviso de actualización;
- estado offline;
- pruebas modo avión.

### Criterios

- Abre sin conexión.
- Registra venta offline.
- No recarga con carrito activo.
- Actualiza de forma controlada.

## Fase 10 — Endurecimiento

### Entregables

- rendimiento;
- accesibilidad;
- manejo global de errores;
- CSP;
- guía de uso;
- datos demo;
- checklist de soporte.

### Criterios

- Cero errores críticos conocidos.
- Pruebas principales verdes.
- Flujo usable en teléfono.

## Fase 11 — Piloto

### Entregables

- instalación en 3–5 bodegas;
- seguimiento;
- métricas;
- entrevistas;
- registro de incidencias;
- decisión continuar/cambiar/detener.

## Orden estricto

No iniciar reportes antes de que venta, stock y caja sean confiables.  
No iniciar nube antes de completar el piloto.  
No integrar pagos automáticos antes de validar frecuencia de uso y disposición de pago.
