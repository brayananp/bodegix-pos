# 13. Especificación UI/UX

## Principios

- Diseño mobile-first.
- Controles táctiles grandes.
- Navegación estable.
- Venta accesible en un toque.
- Confirmaciones solo en acciones destructivas.
- Texto directo.
- Estados vacíos accionables.
- Contraste suficiente.
- No depender exclusivamente del color.

## Navegación móvil

Barra inferior:

```text
Venta | Productos | Inventario | Caja | Más
```

En `Más`:

- Resumen.
- Configuración.
- Respaldo.
- Diagnóstico.

## Pantalla de venta

### Encabezado

- Estado de caja.
- Estado offline.
- Acceso a última venta.

### Búsqueda

- Autofoco cuando corresponda.
- Nombre o código.
- Resultados instantáneos.
- Productos frecuentes opcionales.

### Catálogo

Tarjeta compacta:

```text
Gaseosa 500 ml
Stock: 12
S/ 3.50
[Agregar]
```

### Carrito

- Producto.
- Precio.
- Cantidad.
- Subtotal.
- Incrementar.
- Disminuir.
- Eliminar.
- Total fijo al pie.
- Botón cobrar.

### Rendimiento

La interacción de agregar producto debe sentirse inmediata. No debe abrir un formulario adicional.

## Modal de cobro

Primera vista:

```text
Total: S/48.50

[Efectivo] [Yape]
[Plin] [Tarjeta]
[Transferencia] [Dividir pago]
```

### Efectivo

- Accesos rápidos: monto exacto, S/10, S/20, S/50, S/100.
- Recibido.
- Vuelto destacado.

### Pago externo

- Monto.
- QR cuando corresponda.
- Advertencia.
- Referencia opcional.
- Botón “Pago verificado”.

### Dividir pago

- Lista de pagos.
- Importe pendiente.
- Agregar método.
- Eliminar pago.
- No permitir finalizar con diferencia.

## Productos

- Buscar.
- Filtro activos/inactivos.
- Stock.
- Precio.
- Acción rápida de entrada.
- Acción editar.
- Desactivar.

## Inventario

Pestañas:

- Stock bajo.
- Movimientos.
- Registrar movimiento.

## Caja

Cuando está cerrada:

- efectivo inicial;
- abrir.

Cuando está abierta:

- apertura;
- ventas efectivo;
- depósitos;
- retiros;
- esperado;
- acción cerrar.

## Resumen

Tarjetas:

- vendido;
- ventas;
- efectivo;
- Yape;
- Plin;
- tarjeta;
- transferencia;
- stock bajo.

Listas:

- más vendidos;
- últimas ventas;
- anulaciones.

## Estados

### Vacío

“Todavía no tienes productos. Agrega el primero para comenzar a vender.”

### Error

“El stock cambió y ya no alcanza para completar la venta. Revisa las cantidades.”

### Offline

“Sin conexión. Tus operaciones se guardan en este dispositivo.”

### Actualización

“Nueva versión disponible. Termina la venta actual antes de actualizar.”

## Accesibilidad mínima

- Objetivos táctiles de al menos 44 × 44 px.
- Labels explícitos.
- Navegación por teclado en escritorio.
- Focus visible.
- Formato monetario legible.
- Confirmaciones compatibles con lector de pantalla.
