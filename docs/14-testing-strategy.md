# 14. Estrategia de pruebas

## Pirámide

### Unitarias

Herramientas previstas:

- Vitest.
- Funciones puras del dominio.

Cubrir:

- dinero;
- totales;
- vuelto;
- pago mixto;
- stock;
- cierre de caja;
- límites diarios;
- normalización;
- validación.

### Integración

- Dexie con IndexedDB de prueba.
- Transacciones.
- Migraciones.
- Venta completa.
- Anulación.
- Caja.
- Respaldo.

### Componentes

- React Testing Library.
- Carrito.
- Modal de pago.
- Formularios.
- Estados de error.

### E2E

- Playwright.
- Flujo completo.
- Operación offline.
- Instalación cuando sea automatizable.
- Restauración.
- Actualización.

## Casos críticos

### TC-SAL-001 Venta en efectivo

Dado un producto con stock 10  
Cuando vendo 2 unidades por S/20  
Entonces:

- venta completada;
- pago confirmado;
- stock 8;
- movimiento -2;
- caja aumenta S/20.

### TC-SAL-002 Stock insuficiente

Dado stock 1  
Cuando intento vender 2  
Entonces no se crea ningún registro parcial.

### TC-SAL-003 Pago mixto

Dado total S/50  
Cuando registro S/20 efectivo y S/30 Yape  
Entonces la venta se completa y solo S/20 afectan caja física.

### TC-SAL-004 Pago incompleto

Dado total S/50  
Cuando pagos suman S/49  
Entonces no se confirma.

### TC-SAL-005 Anulación

Dada venta de 2 unidades  
Cuando se anula  
Entonces:

- venta `voided`;
- stock restaurado;
- movimiento inverso;
- pago `voided`;
- totales netos actualizados.

### TC-CSH-001 Doble apertura

Dada una caja abierta  
Cuando intento abrir otra  
Entonces se rechaza.

### TC-CSH-002 Cierre

Dado:

- inicial S/100;
- ventas efectivo S/50;
- retiro S/20;
- contado S/128;

Entonces:

- esperado S/130;
- diferencia -S/2.

### TC-BCK-001 Restauración

Dado un respaldo válido  
Cuando se restaura  
Entonces los conteos e invariantes coinciden.

## Pruebas de migración

Mantener fixtures:

```text
test/fixtures/db-v1/
test/fixtures/db-v2/
```

Cada versión futura debe probar:

- apertura limpia;
- actualización desde versión anterior;
- conservación de ventas;
- conservación de stock;
- diagnóstico final.

## Pruebas manuales en dispositivos

Mínimo:

- Android gama media.
- Android con almacenamiento limitado.
- Escritorio Chromium.
- modo avión;
- cierre forzado;
- actualización;
- pérdida de foco;
- batería baja;
- orientación vertical y horizontal.

## Criterio de bloqueo

No se libera si falla:

- atomicidad;
- cálculo monetario;
- stock;
- cierre;
- restauración;
- migración;
- arranque offline.
