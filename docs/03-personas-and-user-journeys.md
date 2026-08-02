# 03. Personas y recorridos

## Persona primaria: propietario-operador

### Contexto

- Atiende directamente.
- Controla dinero y reposición.
- Utiliza celular.
- Tiene poco tiempo para configurar sistemas.
- Desea una respuesta práctica, no conceptos contables.

### Necesidades

- Cobrar rápido.
- Conocer el total del día.
- Separar efectivo de billeteras.
- Detectar productos por reponer.
- Mantener la información aunque falle internet.

### Frustraciones

- Formularios extensos.
- Catálogos difíciles de cargar.
- Sistemas que exigen internet.
- Reportes que no ayudan al cierre.
- Precios o comisiones poco claros.

## Persona secundaria: encargado

Se considerará durante el piloto, pero sin credenciales ni permisos separados. Utiliza la misma instalación y puede registrar ventas y verificar pagos.

## Recorrido 1: primera configuración

1. Instalar PWA.
2. Ingresar nombre del negocio.
3. Configurar recordatorio de respaldo.
4. Solicitar persistencia.
5. Agregar primeros productos.
6. Abrir caja.
7. Registrar una venta de prueba.
8. Exportar respaldo inicial.

### Éxito

El usuario completa el recorrido en menos de 15 minutos con apoyo mínimo.

## Recorrido 2: venta en efectivo

1. Buscar producto.
2. Agregar al carrito.
3. Pulsar cobrar.
4. Seleccionar efectivo.
5. Ingresar monto recibido.
6. Visualizar vuelto.
7. Confirmar.
8. Ver venta completada.

### Éxito

Stock, venta, pago y caja quedan consistentes.

## Recorrido 3: venta por Yape o Plin

1. Preparar carrito.
2. Seleccionar método.
3. Mostrar QR configurado.
4. Verificar ingreso en la aplicación externa.
5. Registrar referencia opcional.
6. Confirmar pago.
7. Completar venta.

### Mensaje obligatorio

“No aceptes capturas de pantalla. Verifica el ingreso directamente en la aplicación de pagos.”

## Recorrido 4: pago mixto

1. Preparar carrito.
2. Seleccionar pago mixto.
3. Agregar un importe en efectivo.
4. Agregar el saldo mediante Yape, Plin, tarjeta o transferencia.
5. Validar que no exista importe pendiente.
6. Confirmar.
7. Calcular vuelto únicamente cuando corresponda.

## Recorrido 5: entrada de mercadería

1. Abrir inventario.
2. Seleccionar producto.
3. Elegir entrada.
4. Ingresar cantidad.
5. Ingresar motivo o referencia opcional.
6. Confirmar.
7. Ver stock actualizado e historial.

## Recorrido 6: anulación

1. Buscar venta.
2. Revisar detalle.
3. Pulsar anular.
4. Ingresar motivo.
5. Confirmar advertencia.
6. Restaurar stock mediante movimientos inversos.
7. Mantener la venta visible como anulada.

## Recorrido 7: cierre de caja

1. Abrir módulo caja.
2. Revisar ventas por método.
3. Registrar retiros pendientes.
4. Contar efectivo.
5. Ingresar efectivo contado.
6. Visualizar diferencia.
7. Confirmar cierre.
8. Exportar respaldo si corresponde.

## Recorrido 8: restauración

1. Abrir configuración.
2. Elegir archivo.
3. Validar respaldo.
4. Mostrar resumen del contenido.
5. Advertir que reemplazará los datos.
6. Crear respaldo de seguridad actual.
7. Restaurar.
8. Verificar integridad.
9. Reiniciar la aplicación de forma controlada.
