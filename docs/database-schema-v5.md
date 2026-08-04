# Esquema v5 — Anulación de ventas

**Versión:** 5  
**Fecha:** Enero 2025  
**Estado:** Implementado ✅

## Cambios desde v4

La versión 5 agrega soporte para anulación de ventas con:

1. **Campos de anulación en `SaleRecord`:**
   - `voidedAt`: timestamp de anulación (null si no anulada)
   - `voidReason`: motivo de la anulación (5-240 caracteres)

2. **Campos de anulación en `SalePaymentRecord`:**
   - `voidedAt`: timestamp de anulación del pago
   - `voidOperationReference`: referencia a operación de devolución

## Migración v4 → v5

La migración `schema-v5.ts` agrega los nuevos campos:

```typescript
export async function migrateV4ToV5(db: BodegixDB): Promise<void> {
  // Los campos nuevos son nullables, no requiere migración de datos
  // Dexie manejará los campos undefined como null automáticamente
  console.log('[Migration v4→v5] Schema actualizado con campos de void');
}
```

**Estrategia:**
- Los campos son opcionales/nullables
- Registros existentes conservan `undefined` que Dexie maneja como `null`
- No requiere transformación de datos existentes
- Migración instantánea

## Esquema completo v5

### Tabla: `sales`

```typescript
++id,
saleNumber,
status,
[sessionId+saleNumber],
sessionId,
createdAt,
voidedAt,      // NUEVO en v5
completedAt
```

**Campos:**
- `id`: UUID único
- `saleNumber`: Secuencial único (V-000001, V-000002...)
- `status`: `'draft' | 'completed' | 'voided'`
- `sessionId`: FK a sesión de caja
- `subtotalCents`: Subtotal en centavos
- `taxCents`: Impuestos (0 en MVP)
- `totalCents`: Total final en centavos
- `createdAt`: Timestamp de creación
- `completedAt`: Timestamp de completado (null si draft)
- `voidedAt`: **NUEVO** - Timestamp de anulación (null si no anulada)
- `voidReason`: **NUEVO** - Motivo de anulación (5-240 chars, null si no anulada)

### Tabla: `saleItems`

Sin cambios desde v4.

```typescript
++id,
saleId,
[saleId+productId]
```

### Tabla: `salePayments`

```typescript
++id,
saleId,
[saleId+method],
status,       // MODIFICADO: ahora incluye 'voided'
voidedAt,     // NUEVO en v5
cashSessionId
```

**Campos:**
- `id`: UUID único
- `saleId`: FK a venta
- `method`: Método de pago (cash, yape, plin, card, bank_transfer)
- `status`: **MODIFICADO** - `'pending' | 'completed' | 'voided'`
- `amountCents`: Monto en centavos
- `operationReference`: Referencia externa (código Yape, últimos 4 dígitos, etc.)
- `cashReceivedCents`: Efectivo recibido (solo método cash)
- `changeCents`: Vuelto (solo método cash)
- `cashSessionId`: FK a sesión de caja (solo método cash)
- `voidedAt`: **NUEVO** - Timestamp de anulación del pago
- `voidOperationReference`: **NUEVO** - Referencia a operación de devolución

### Tabla: `saleDrafts`

Sin cambios desde v4.

### Otras tablas

Las tablas de productos, categorías, inventario y caja no cambian en v5.

## Reglas de negocio de anulación

### Elegibilidad para anular

Una venta puede anularse SOLO si:

1. **Estado:** `status === 'completed'`
2. **No anulada previamente:** `voidedAt === null`
3. **Sesión actual:** Pertenece a la sesión de caja abierta actual
4. **Sesión abierta:** La sesión de caja debe estar en estado `open`

### Restricciones

**NO se puede anular una venta si:**
- Ya fue anulada anteriormente (`status === 'voided'`)
- Pertenece a una sesión de caja cerrada
- Pertenece a una sesión de caja diferente a la actual
- No existe sesión de caja abierta

### Motivo obligatorio

- Mínimo: 5 caracteres
- Máximo: 240 caracteres
- Campo requerido y no vacío
- Se almacena en `voidReason`

## Efectos de la anulación

Cuando se anula una venta:

1. **Sale:**
   - `status` → `'voided'`
   - `voidedAt` → timestamp actual
   - `voidReason` → motivo proporcionado

2. **SalePayments:**
   - Todos los pagos: `status` → `'voided'`
   - Todos los pagos: `voidedAt` → timestamp actual
   - Efectivo: se registra retiro compensatorio en `CashOperation` (tipo `withdrawal_void_sale`)

3. **Inventory:**
   - Cada producto: se crea `InventoryOperation` tipo `void_sale_return`
   - Stock devuelto: `+quantity` al inventario
   - Referencia: `saleItemId` para auditoría

4. **Cash (solo pagos en efectivo):**
   - Se crea `CashOperation` con `type: 'withdrawal_void_sale'`
   - `amountCents` negativo (retiro del efectivo devuelto)
   - `description`: "Anulación de venta V-XXXXXX"
   - `referenceId`: `saleId`

## Transacción ACID

La anulación es una operación atómica en 4 pasos dentro de una transacción Dexie:

```typescript
await db.transaction('rw', [db.sales, db.salePayments, db.inventory, db.cashOperations], async () => {
  // 1. Actualizar sale
  await db.sales.update(saleId, {
    status: 'voided',
    voidedAt: timestamp,
    voidReason: reason,
  });

  // 2. Anular todos los pagos
  const payments = await db.salePayments.where('saleId').equals(saleId).toArray();
  for (const payment of payments) {
    await db.salePayments.update(payment.id, {
      status: 'voided',
      voidedAt: timestamp,
    });
  }

  // 3. Devolver stock al inventario
  const items = await db.saleItems.where('saleId').equals(saleId).toArray();
  for (const item of items) {
    await db.inventory.update(item.productId, {
      currentQuantity: currentQuantity + item.quantity,
    });
    await db.inventoryOperations.add({
      type: 'void_sale_return',
      productId: item.productId,
      quantity: item.quantity,
      referenceId: item.id,
      timestamp,
    });
  }

  // 4. Registrar retiro de efectivo (si hay pagos cash)
  for (const payment of cashPayments) {
    await db.cashOperations.add({
      type: 'withdrawal_void_sale',
      sessionId: payment.cashSessionId,
      amountCents: -payment.amountCents,
      description: `Anulación de venta V-${saleNumber}`,
      referenceId: saleId,
      timestamp,
    });
  }
});
```

**Propiedades ACID:**
- **Atomicidad:** Todo o nada (rollback automático en error)
- **Consistencia:** Stock correcto, balance de caja correcto
- **Aislamiento:** Serializable dentro de la transacción
- **Durabilidad:** IndexedDB persiste en disco

## Nuevos códigos de error

```typescript
// sale-errors.ts
export const SaleErrorCode = {
  // ... existentes
  SALE_ALREADY_VOIDED: 'SALE_ALREADY_VOIDED',
  CANNOT_VOID_AFTER_SESSION_CLOSE: 'CANNOT_VOID_AFTER_SESSION_CLOSE',
  CANNOT_VOID_DIFFERENT_SESSION: 'CANNOT_VOID_DIFFERENT_SESSION',
  VOID_REASON_TOO_SHORT: 'VOID_REASON_TOO_SHORT',
  VOID_REASON_TOO_LONG: 'VOID_REASON_TOO_LONG',
  NO_OPEN_SESSION_FOR_VOID: 'NO_OPEN_SESSION_FOR_VOID',
} as const;
```

## Índices

### `sales`
- `++id`: Primaria
- `saleNumber`: Correlativo único
- `[sessionId+saleNumber]`: Compuesto para búsqueda eficiente
- `sessionId`: FK
- `createdAt`: Ordenamiento temporal
- `voidedAt`: **NUEVO** - Filtrado de ventas anuladas

### `salePayments`
- `++id`: Primaria
- `saleId`: FK
- `[saleId+method]`: Compuesto
- `status`: **MODIFICADO** - Incluye estado 'voided'
- `voidedAt`: **NUEVO** - Filtrado de pagos anulados
- `cashSessionId`: FK (nullable)

## Integridad referencial

- `sales.sessionId` → `cashSessions.id`
- `sales.voidedAt` debe ser `>= createdAt`
- `sales.voidedAt` debe ser `<= timestamp actual`
- `salePayments.voidedAt` debe coincidir con `sales.voidedAt` de la venta padre
- Si `sales.status === 'voided'` entonces `voidedAt !== null` y `voidReason !== null`

## Queries reactivos

### Obtener venta con datos de anulación

```typescript
const sale = await db.sales.get(saleId);
if (sale?.status === 'voided') {
  console.log(`Venta anulada el ${sale.voidedAt}`);
  console.log(`Motivo: ${sale.voidReason}`);
}
```

### Filtrar ventas no anuladas

```typescript
const activeSales = await db.sales
  .where('voidedAt')
  .equals(null as any)
  .toArray();
```

### Obtener pagos anulados de una venta

```typescript
const voidedPayments = await db.salePayments
  .where('saleId')
  .equals(saleId)
  .filter(p => p.status === 'voided')
  .toArray();
```

## Auditoría

La anulación deja rastro completo:

1. **Sale:** `voidedAt` + `voidReason` + `status: 'voided'`
2. **Payments:** `voidedAt` + `status: 'voided'`
3. **Inventory:** `InventoryOperation` con `type: 'void_sale_return'`
4. **Cash:** `CashOperation` con `type: 'withdrawal_void_sale'`

**Trazabilidad:**
- Se puede reconstruir qué se anuló, cuándo, por qué y quién
- Los datos originales de la venta se preservan
- El motivo queda registrado permanentemente
- Las operaciones de inventario y caja están enlazadas por `referenceId`

## Casos de uso

### UC-VOID-001: Anular venta de la sesión actual

**Precondiciones:**
- Hay una sesión de caja abierta
- La venta pertenece a esa sesión
- La venta está completada y no anulada

**Flujo:**
1. Usuario busca venta en historial
2. Usuario abre detalle de venta
3. Sistema verifica elegibilidad
4. Usuario hace clic en "Anular venta"
5. Sistema muestra diálogo con advertencias
6. Usuario ingresa motivo (5-240 chars)
7. Usuario confirma
8. Sistema ejecuta transacción atómica
9. Sistema muestra éxito y actualiza UI

### UC-VOID-002: Intentar anular venta de sesión cerrada

**Precondiciones:**
- La venta pertenece a una sesión cerrada

**Flujo:**
1. Usuario busca venta en historial
2. Usuario abre detalle de venta
3. Sistema verifica elegibilidad
4. Sistema muestra mensaje: "Solo puedes anular ventas de la sesión actual abierta"
5. Botón "Anular venta" no se muestra

## Testing

### Tests unitarios
- Reglas de elegibilidad (`sale-void-rules.test.ts`)
- Validación de motivo (min/max length)
- Cálculos de devolución

### Tests de integración
- Transacción ACID completa
- Rollback en error
- Integridad referencial
- Estado consistente después de void

### Tests E2E
- Flujo completo de anulación
- Validación de formulario
- UX responsive (Dialog/Drawer)
- Navegación teclado (Tab, Enter, Escape)
- Persistencia de filtros

## Migración desde v4

```bash
# La migración es automática al abrir la app
# No requiere intervención manual
# Los datos existentes se preservan
```

## Versión anterior

Ver [Esquema v4](./database-schema-v4.md) para la versión anterior.

## Versión siguiente

Por definir.
