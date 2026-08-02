# 02. Alcance del MVP

## Incluido

### Configuración inicial

- Nombre de la bodega.
- Moneda PEN.
- Zona horaria `America/Lima`.
- Efectivo inicial opcional.
- Solicitud de almacenamiento persistente.
- Recordatorio de respaldo.

### Productos

- Crear producto.
- Editar producto.
- Desactivar producto.
- Buscar por nombre o código de barras.
- Asignar categoría opcional.
- Precio de venta.
- Costo opcional.
- Stock actual.
- Stock mínimo.
- Código de barras opcional.

### Inventario

- Registrar stock inicial.
- Registrar entrada de mercadería.
- Registrar ajuste positivo.
- Registrar ajuste negativo.
- Registrar pérdida por daño o vencimiento como motivo.
- Consultar historial por producto.
- Mostrar productos con stock bajo.
- Impedir edición silenciosa del stock.

### Ventas

- Catálogo buscable.
- Carrito.
- Modificar cantidad.
- Eliminar ítem.
- Calcular total.
- Confirmar pago.
- Descontar stock atómicamente.
- Generar número interno correlativo.
- Consultar ventas del día.
- Ver detalle.
- Anular venta y restaurar stock.

### Pagos

- Efectivo.
- Yape.
- Plin.
- Tarjeta mediante POS externo.
- Transferencia bancaria.
- Pago mixto mediante varios pagos.
- Número de operación opcional.
- Confirmación manual.
- Cálculo de recibido y vuelto para efectivo.

### Caja

- Abrir caja.
- Registrar depósito manual.
- Registrar retiro manual.
- Cerrar caja.
- Calcular efectivo esperado.
- Registrar efectivo contado.
- Calcular diferencia.
- Mostrar totales por método de pago.

### Resumen

- Total vendido.
- Número de ventas.
- Totales por método.
- Productos más vendidos.
- Productos con stock bajo.
- Ventas anuladas.
- Diferencia de caja.

### Respaldo

- Exportar respaldo completo.
- Importar respaldo completo.
- Validar estructura y versión.
- Crear respaldo automático previo a una restauración.
- Mostrar fecha del último respaldo.
- Exportar ventas a CSV como función complementaria.

### PWA

- Manifest.
- Iconos.
- Instalación.
- App shell offline.
- Pantalla de estado sin conexión.
- Aviso de actualización.
- Estrategia segura de actualización.

## Fuera del MVP

- Login.
- Roles y empleados.
- Múltiples cajas simultáneas.
- Sincronización.
- Respaldo en nube.
- Multi-sucursal.
- Facturación electrónica SUNAT.
- Integración directa con Yape o Plin.
- Integración directa con POS.
- Procesamiento de tarjetas.
- Clientes y fiados.
- Proveedores y órdenes de compra.
- Lotes y vencimientos avanzados.
- Cantidades fraccionadas.
- Promociones.
- Descuentos complejos.
- Devoluciones parciales.
- Impresión térmica garantizada.
- Aplicación móvil nativa.
- Inteligencia artificial.
- Analítica avanzada.

## Criterio de salida del MVP

El MVP está listo para piloto cuando una bodega puede operar durante una jornada completa con:

- productos cargados;
- caja abierta;
- ventas en efectivo y pagos digitales;
- entradas y ajustes de inventario;
- cierre de caja;
- resumen diario;
- respaldo verificable;
- operación sin conexión.
