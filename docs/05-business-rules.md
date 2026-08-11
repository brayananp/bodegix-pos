# 05. Reglas de negocio

## BR-08 — Portabilidad

Un respaldo siempre contiene todas las tablas. Restore nunca fusiona ni restaura parcialmente; una
instalación restaurada adopta `installationId`, correlativo y configuración del archivo. Caja abierta
y carrito son válidos con advertencia. `lastBackupAt` solo representa una copia manual guardada.

## Resumen y cierre operativo

El cierre financiero pertenece a `CashSession`. El resumen no se persiste. Solo ventas completadas
son ingreso, pagos anulados se excluyen, el efectivo inicial no es flujo y las alertas de inventario
son actuales. Una fecha puede contener varias sesiones o una sesión que cruce medianoche.

## Catálogo

- Categorías: nombre normalizado único, 2–60 caracteres y desactivación lógica.
- Productos: nombre de 2–120 caracteres, precio positivo en céntimos, costo opcional
  no negativo y stock mínimo entero no negativo.
- El código conserva ceros iniciales y es único entre productos activos.
- Una asignación nueva solo acepta categorías activas; relaciones existentes se conservan.
- Crear fija stock en `0`; editar o cambiar estado conserva stock y `createdAt`.
- Ninguna operación de catálogo elimina registros físicamente.

## Dinero

### BR-MON-001

Todos los importes se almacenan como enteros en céntimos.

```text
S/ 3.50 → 350
S/ 100.00 → 10000
```

### BR-MON-002

No se permite un importe negativo salvo en operaciones internas explícitamente modeladas.

### BR-MON-003

El total de una venta es la suma de los subtotales de sus ítems.

### BR-MON-004

El subtotal del ítem es:

```text
unitPriceCents × quantity
```

## Productos

### BR-PRD-001

Un producto utilizado en una venta no se elimina físicamente; se desactiva.

### BR-PRD-002

Cambiar nombre, precio o costo no altera ventas anteriores.

### BR-PRD-003

El stock no se edita directamente desde el formulario del producto.

### BR-PRD-004

Las cantidades son enteras y mayores que cero.

## Inventario

### BR-INV-001

Todo cambio de stock crea un movimiento.

### BR-INV-002

Cada movimiento registra cantidad delta, stock anterior y stock posterior.

### BR-INV-003

El stock inicial solo se registra una vez, desde saldo cero, antes de cualquier movimiento y con
cantidad positiva.

### BR-INV-004

Una entrada manual crea un movimiento `purchase`; no crea una orden de compra ni un proveedor.

### BR-INV-005

Una conciliación recibe la cantidad contada. Si difiere, deriva `adjustment_in` o
`adjustment_out`; si coincide, devuelve `NO_STOCK_CHANGE` y no persiste.

### BR-INV-006

Ninguna operación del MVP puede producir stock negativo. Las pérdidas no pueden superar el saldo
actual y todas las cantidades son enteras.

### BR-INV-007

Un producto se considera con stock bajo cuando:

```text
stockQuantity > 0
&& minimumStockQuantity > 0
&& stockQuantity <= minimumStockQuantity
```

`stockQuantity === 0` significa agotado y no se clasifica simultáneamente como stock bajo.

### BR-INV-008

Todo saldo y su movimiento se persisten dentro de una única transacción. Los movimientos
confirmados no se editan ni se eliminan; una corrección agrega otro movimiento.

## Ventas

### BR-SAL-001

Una venta solo puede confirmarse con carrito no vacío.

### BR-SAL-002

La validación de stock se repite dentro de la transacción.

### BR-SAL-003

La venta confirmada es inmutable, salvo anulación completa.

### BR-SAL-004

No se elimina una venta confirmada.

### BR-SAL-005

El número de venta es correlativo dentro de la instalación.

### BR-SAL-006

Una venta anulada conserva ítems y pagos originales.

### BR-SAL-007

Una venta anulada no se incluye en ventas netas, pero aparece en auditoría.

## Pagos

### BR-PAY-001

Una venta puede tener uno o varios pagos.

### BR-PAY-002

`mixed` no es un método persistido. Se deriva cuando existen dos o más pagos activos.

### BR-PAY-003

La suma de pagos debe ser igual al total de la venta.

### BR-PAY-004

Efectivo se confirma localmente.

### BR-PAY-005

Yape, Plin, tarjeta y transferencia se marcan como `manually_verified`.

### BR-PAY-006

No se confirma un pago externo basándose únicamente en una captura presentada por el cliente.

### BR-PAY-007

El vuelto se calcula solo a partir del efectivo recibido.

### BR-PAY-008

No se almacena PAN completo, CVV, PIN ni fecha de vencimiento de tarjeta.

## Caja

### BR-CSH-001

Solo puede existir una caja abierta.

### BR-CSH-002

Toda venta debe asociarse a la caja abierta.

### BR-CSH-003

El efectivo esperado se calcula:

```text
openingCash
+ confirmedCashSales
+ manualCashDeposits
- manualCashWithdrawals
```

### BR-CSH-004

Yape, Plin, tarjeta y transferencia no aumentan el efectivo físico esperado.

### BR-CSH-005

La diferencia es:

```text
countedCash - expectedCash
```

### BR-CSH-006

Una caja cerrada es inmutable.

## Respaldo

### BR-BCK-001

Una restauración reemplaza completamente la base local en el MVP.

### BR-BCK-002

Antes de restaurar se exporta el estado actual.

### BR-BCK-003

Un respaldo incompatible no se importa.

### BR-BCK-004

La importación debe ser atómica o recuperable.

## Tiempo

### BR-TIM-001

La persistencia usa epoch UTC.

### BR-TIM-002

Los límites diarios se calculan con la zona horaria configurada.

### BR-TIM-003

Una jornada de caja puede cruzar medianoche; el resumen de caja se basa en su sesión, no solo en fecha calendario.

## Reglas de caja implementadas

Solo existe 0 o 1 caja abierta. El esperado es inicial + ventas en efectivo + depósitos − retiros.
La diferencia es contado − esperado. Sesiones cerradas y movimientos son inmutables; pagos
digitales no afectan efectivo físico.

## Anulación

Una venta solo se anula completa, durante su única sesión original todavía abierta. Se exige motivo
y confirmación por cada pago. Ítems, totales, correlativo y movimientos originales son inmutables;
la caja excluye venta/pagos anulados y no registra un retiro ficticio.
