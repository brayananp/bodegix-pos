# 16. Definition of Done

## Para una historia

Una historia está terminada cuando:

- requisitos y reglas están identificados;
- validación está implementada;
- estados de carga, vacío y error existen;
- pruebas unitarias relevantes pasan;
- pruebas de integración pasan si toca persistencia;
- accesibilidad básica está revisada;
- no rompe operación offline;
- no introduce importes de coma flotante;
- no modifica stock sin movimiento;
- documentación afectada se actualiza;
- no existen errores TypeScript;
- build de producción pasa.

## Para un módulo

- casos de uso completos;
- errores tipados;
- repositorios/adaptadores definidos;
- UI mobile-first;
- E2E principal;
- fixtures;
- métricas básicas;
- revisión de rendimiento;
- revisión de datos históricos.

## Para liberar el MVP

### Producto

- Venta frecuente ≤ 10 segundos en dispositivo objetivo.
- Todos los métodos manuales funcionan.
- Pago mixto funciona.
- Inventario auditable.
- Caja abre y cierra.
- Resumen diario correcto.
- Anulación correcta.

### Datos

- Venta atómica.
- Migración probada.
- Respaldo restaurable.
- Diagnóstico aprobado.
- Sin pérdida conocida.

### PWA

- Instalación probada.
- Inicio offline.
- Actualización controlada.
- Persistencia solicitada.
- Estado de almacenamiento visible.

### Calidad

- Suite crítica verde.
- Sin errores de consola en flujos principales.
- Sin vulnerabilidades críticas conocidas.
- CSP definida.
- Dependencias bloqueadas.
- Manual de recuperación.

### Piloto

- Build identificable por versión.
- Canal de incidencias.
- Formulario de feedback.
- Procedimiento de respaldo.
- Procedimiento de rollback.
