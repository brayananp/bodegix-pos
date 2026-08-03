# Casos de uso de ventas

## Estado: Implementado en Fase 5

Todos los casos de uso descritos están completamente implementados y probados.

## Carrito (`SaleDraftStore`)

### `addProduct(productId: string): Promise<Result<void>>`

Agrega o incrementa una línea en `saleDrafts/main`. 

**Validaciones:**
- Producto debe existir y estar activo
- Stock disponible para al menos 1 unidad
- Máximo 100 líneas diferentes en el carrito
- Máximo 9,999 unidades por línea

**Efectos:**
- Actualiza `expectedUnitPriceCents` con el precio actual del catálogo
- Actualiza `updatedAt` con timestamp actual
- Crea el registro `saleDrafts/main` si no existe

**Errores:** `PRODUCT_NOT_FOUND`, `PRODUCT_INACTIVE`, `INSUFFICIENT_STOCK`, `CART_MAX_LINES_EXCEEDED`

### `setQuantity(productId: string, quantity: number): Promise<Result<void>>`

Establece una cantidad específica para un producto en el carrito.

**Validaciones:**
- Cantidad debe ser entero positivo o cero
- Si cantidad es 0, elimina la línea del carrito
- Stock suficiente para la nueva cantidad
- Máximo 9,999 unidades

**Efectos:**
- Actualiza `quantity` del ítem
- Actualiza `updatedAt`
- Elimina el ítem si quantity = 0

**Errores:** `INSUFFICIENT_STOCK`, `INVALID_QUANTITY`, `PRODUCT_NOT_IN_CART`

### `removeProduct(productId: string): Promise<Result<void>>`

Elimina una línea específica del carrito.

**Efectos:**
- Remueve el ítem del array `items`
- Actualiza `updatedAt`
- Elimina todo el registro si queda vacío

### `clear(): Promise<Result<void>>`

Elimina todo el borrador del carrito.

**Efectos:**
- Elimina el registro `saleDrafts/main`
- No afecta ventas completadas

**Uso:** Botón "Limpiar carrito" con confirmación en UI

### `refreshPrices(priceMap: Record<string, number>): Promise<Result<void>>`

Actualiza precios esperados tras detectar cambios en revisión.

**Input:** Mapa `productId → salePriceCents` explícito del usuario

**Efectos:**
- Actualiza `expectedUnitPriceCents` de ítems correspondientes
- Actualiza `updatedAt`
- No modifica cantidades ni productos

**Uso:** Acción "Actualizar precios" tras alerta de cambio de precio

## `reviewSaleDraft(): Promise<Result<SaleDraftReview>>`

Compara el borrador actual contra el estado actual del catálogo.

**Validaciones detectadas:**
- `PRODUCT_NOT_FOUND` — Producto ya no existe
- `PRODUCT_INACTIVE` — Producto desactivado después de agregarlo
- `OUT_OF_STOCK` — Stock = 0
- `INSUFFICIENT_STOCK` — Stock < cantidad en carrito
- `PRICE_CHANGED` — Precio del catálogo ≠ precio esperado

**No modifica datos:** Es una query pura que retorna un reporte.

**Resultado:**
```typescript
{
  isValid: boolean,
  issues: Array<{
    productId: string,
    productName: string,
    type: "NOT_FOUND" | "INACTIVE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK" | "PRICE_CHANGED",
    currentStock?: number,
    requestedQuantity?: number,
    expectedPrice?: number,
    currentPrice?: number
  }>
}
```

**Uso en UI:**
- Ejecutado automáticamente antes de mostrar checkout
- Bloquea botón "Cobrar" si `isValid = false`
- Muestra alertas específicas por cada issue
- Ofrece botón "Actualizar precios" si solo hay cambios de precio

## `completeSale(paymentIntents: PaymentIntent[]): Promise<Result<SaleResult>>`

Ejecuta la transacción atómica de venta con validaciones completas.

**Input:**
```typescript
{
  paymentIntents: Array<{
    method: "cash" | "yape" | "plin" | "card" | "bank_transfer",
    amountCents: number,
    operationReference?: string  // requerido para externos
  }>
}
```

**Precondiciones verificadas:**
1. Existe borrador con al menos 1 ítem
2. Existe sesión de caja con estado `"open"`
3. Todos los productos existen y están activos
4. Stock suficiente para cada ítem (releído en transacción)
5. Precios actuales coinciden con esperados
6. Suma de pagos = total exacto de la venta
7. Cada método de pago es único
8. Pagos externos tienen `operationReference`

**Transacción atómica (8 tablas):**

1. **`appSettings`**
   - Lee y valida `nextSaleNumber`
   - Incrementa correlativo
   
2. **`cashSessions`**
   - Verifica estado `"open"`
   - Lee `id` de sesión activa

3. **`products`** (por cada ítem)
   - Lee precio y stock actual
   - Valida precio esperado vs actual
   - Valida stock ≥ cantidad
   - Decrementa `stockQuantity`

4. **`sales`**
   - Crea registro con ID generado
   - Asigna `saleNumber` desde correlativo
   - Estado inicial `"completed"`
   - Vincula a `cashSessionId`

5. **`saleItems`** (por cada ítem)
   - Crea snapshot con:
     - `productName` actual
     - `unitPriceCents` actual
     - `unitCostCents` actual
     - `quantity` del carrito
     - `subtotalCents` calculado

6. **`salePayments`** (por cada intento)
   - Estado `"verified"` para pagos manuales
   - Copia `method` y `amountCents`
   - Persiste `operationReference` si existe

7. **`inventoryMovements`** (por cada ítem)
   - Tipo `"sale"`
   - `quantityDelta` negativo
   - `referenceType: "sale"`
   - `referenceId: saleId`
   - `stockAfter` calculado

8. **`saleDrafts`**
   - Elimina el registro `"main"`

**Rollback automático:** Cualquier fallo en cualquier paso revierte toda la transacción.

**Resultado exitoso:**
```typescript
{
  id: string,
  saleNumber: number,
  formattedSaleNumber: string,  // "V-000123"
  items: Array<{
    id: string,
    productName: string,
    quantity: number,
    unitPriceCents: number,
    subtotalCents: number
  }>,
  payments: Array<{
    id: string,
    method: string,
    amountCents: number,
    operationReference: string | null
  }>,
  subtotalCents: number,
  totalCents: number,
  changeCents: number,
  createdAt: string
}
```

**Errores tipados:**
- `CASH_SESSION_REQUIRED` — No hay caja abierta
- `CART_EMPTY` — Borrador vacío o inexistente
- `PRODUCT_NOT_FOUND` — Producto eliminado entre revisión y commit
- `PRODUCT_INACTIVE` — Producto desactivado entre revisión y commit
- `PRODUCT_PRICE_CHANGED` — Precio cambió entre revisión y commit
- `INSUFFICIENT_STOCK` — Stock insuficiente (otra venta simultánea)
- `PAYMENT_TOTAL_MISMATCH` — Suma de pagos ≠ total
- `DUPLICATE_PAYMENT_METHOD` — Método repetido
- `EXTERNAL_PAYMENT_MISSING_REFERENCE` — Falta ref. en Yape/Plin/POS/Transferencia

**Concurrencia:**
- Dos pestañas/dispositivos compitiendo por stock: solo una transacción exitosa
- Dexie garantiza serialización de escrituras
- Stock nunca queda negativo por race conditions

## `getSaleResult(saleId: string): Promise<Result<SaleResult>>`

Reconstruye la vista de resultado desde snapshots persistidos.

**No consulta precios actuales:** Usa `productName`, `unitPriceCents` y `unitCostCents` guardados en `saleItems`.

**Joins realizados:**
- `sales` JOIN `saleItems` ON `saleId`
- `sales` JOIN `salePayments` ON `saleId`

**Formato de salida:** Igual al resultado de `completeSale`.

**Uso en UI:** Mostrar resumen tras completar venta y recargar página.

## Pruebas

### Unitarias
- `sale-rules.test.ts` — Validaciones de negocio
- `sale-totals.test.ts` — Cálculos de totales y vuelto
- `checkout-form.mappers.test.ts` — Transformaciones de datos

### Integración
- `sales.integration.test.ts` — Flujo completo contra Dexie con fake-indexeddb
  - Carrito: agregar, actualizar, limpiar
  - Revisión: detectar cambios de precio y stock
  - Completar venta: transacción exitosa y rollback en errores
  - Resultado: reconstrucción desde snapshots

### E2E
- `e2e/sale.spec.ts` — Flujo real en navegador
  - Completar venta en efectivo con carrito persistido
  - Rechazar cobro sin caja abierta
  - Desktop y móvil

**Cobertura:** 100% de casos de uso implementados.
