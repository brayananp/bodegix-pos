# 01. Visión del producto

## Identidad

| Campo | Valor |
|---|---|
| Nombre comercial | **Bodegix** |
| Nombre del proyecto | **Bodegix POS** |
| Repositorio / paquete | `bodegix-pos` |

## Problema

Muchas bodegas pequeñas operan con una combinación de memoria, cuaderno, calculadora, Yape, Plin y un POS externo. Esto dificulta responder preguntas básicas:

- ¿Cuánto vendí hoy?
- ¿Cuánto debería haber en efectivo?
- ¿Cuánto recibí por Yape, Plin o tarjeta?
- ¿Qué productos están por agotarse?
- ¿Por qué cambió el stock?
- ¿Cuál fue la última venta?
- ¿Se registró correctamente una anulación?

## Propuesta de valor

> Registrar una venta en pocos segundos, controlar caja e inventario y continuar trabajando aunque no haya internet.

## Usuario objetivo inicial

Dueño o encargado de una bodega pequeña que:

- utiliza un smartphone;
- cobra mediante efectivo y billeteras digitales;
- no necesita una solución contable completa;
- considera complejos o costosos los POS tradicionales;
- quiere una herramienta sencilla para una sola caja.

## Trabajo principal del usuario

Cuando atiendo una venta, quiero registrar los productos y el método de pago rápidamente para mantener actualizados mi caja e inventario sin retrasar al cliente.

## Resultados esperados

- Menor tiempo de registro.
- Menos diferencias entre stock real y stock estimado.
- Conciliación diaria por método de pago.
- Identificación rápida de productos con stock bajo.
- Recuperación mediante respaldo local.
- Uso continuo durante fallas de internet.

## Métricas de producto para el piloto

| Métrica | Objetivo inicial |
|---|---:|
| Tiempo de venta frecuente | ≤ 10 segundos |
| Ventas completadas sin asistencia | ≥ 90 % |
| Días activos durante el piloto | ≥ 70 % |
| Sesiones cerradas correctamente | ≥ 80 % |
| Restauración de respaldo de prueba | 100 % |
| Errores críticos con pérdida de datos | 0 |
| Bodegas dispuestas a seguir usando el producto | ≥ 3 de 5 |

## Principios de diseño

1. La venta es la operación principal.
2. La interfaz debe ser entendible sin capacitación extensa.
3. Ninguna acción crítica debe depender de internet.
4. El sistema debe explicar por qué cambia el stock.
5. El efectivo físico se separa de pagos digitales.
6. La anulación conserva la historia.
7. El respaldo es una función central, no un complemento.
8. La arquitectura debe permitir agregar nube sin imponerla ahora.
