# Interfaz de venta

## Ruta: `/sale`

Experiencia operativa única para registrar ventas en tiempo real.

**Search params:**
- `q` — término de búsqueda de productos
- `categoryId` — filtro de categoría
- `panel` — modo móvil: `"cart"` | `"checkout"` | `"result"`
- `saleId` — ID de venta para mostrar resultado

## Layout responsive

### Desktop (≥768px)

**Panel dividido persistente:**
- **Izquierda (60%):** Catálogo de productos
  - Buscador con autocompletado
  - Filtro por categorías (tabs horizontales)
  - Grid de productos con precio y stock
  - Botón "Agregar" por producto
  - Estado de carga y vacío

- **Derecha (40%):** Carrito sticky
  - Lista de ítems con controles de cantidad
  - Subtotales por línea
  - Total destacado
  - Botón "Cobrar" (disabled si caja cerrada o carrito vacío)
  - Botón "Limpiar carrito" con confirmación

**Overlays:**
- Checkout: `Dialog` centrado con backdrop
- Resultado: `Dialog` centrado con backdrop
- Confirmaciones: `AlertDialog`

**Flujo:**
1. Usuario busca y agrega productos (carrito siempre visible)
2. Click "Cobrar" → Dialog de checkout
3. Ingresa pagos → Submit → Dialog de resultado
4. "Nueva venta" → vuelve al catálogo, carrito vacío

### Móvil (<768px)

**Catálogo a pantalla completa:**
- Buscador fijo en header
- Filtros de categoría en tabs scrollables
- Grid de productos optimizado (2 columnas)
- Barra inferior sticky con:
  - Total actual del carrito
  - Botón "Ver carrito" con badge de cantidad

**Sheet bottom único** (`SaleMobileSheet`):
- Altura: 92vh con esquinas redondeadas superiores
- Tres modos exclusivos (no anidados):
  
  1. **`cart`** — Carrito completo
     - Lista de ítems
     - Controles de cantidad
     - Total
     - Botones "Limpiar" y "Cobrar"
  
  2. **`checkout`** — Formulario de pago
     - Campos de pagos múltiples
     - Totales asignado/pendiente/vuelto
     - "Confirmar venta"
  
  3. **`result`** — Resultado post-venta
     - Número de venta
     - Detalle de ítems y pagos
     - "Nueva venta"

**Transiciones:**
- `cart` → `checkout`: Click "Cobrar"
- `checkout` → `result`: Submit exitoso
- `result` → cerrado: Click "Nueva venta"
- Cualquier modo → cerrado: Swipe down o backdrop

## Componentes principales

### `SaleProductSearch`

Buscador con debounce (300ms) para actualizar search params `q`.

**Props:**
```typescript
{
  value: string,
  onChange: (value: string) => void,
  disabled?: boolean
}
```

**Accesibilidad:**
- `<label>` asociado a input
- `aria-label="Buscar producto por nombre o código"`
- Placeholder descriptivo

### `SaleProductGrid`

Grid responsive de productos disponibles.

**Desktop:** 3-4 columnas adaptativas  
**Móvil:** 2 columnas fijas

**Por producto:**
- Imagen placeholder o ícono
- Nombre truncado
- Precio destacado
- Stock disponible con badge de estado
- Botón "Agregar" (disabled si stock = 0)

**Estados:**
- Loading: skeleton grid
- Empty: mensaje con ilustración
- Error: alerta con retry

**Accesibilidad:**
- `<ul>` semántico con `<li>` por producto
- `aria-label` descriptivo en botones
- Contraste de color en badges

### `SaleCart`

Lista de ítems del carrito con gestión de cantidades.

**Por ítem:**
- Nombre del producto
- Precio unitario
- Controles de cantidad:
  - Botón `-` (decrementa, elimina si llega a 0)
  - Input numérico editable
  - Botón `+` (incrementa, valida stock)
- Subtotal calculado
- Botón "Eliminar" con ícono

**Footer:**
- Subtotal y total (iguales en Fase 5)
- Botón "Limpiar carrito" secundario
- Botón "Cobrar" primario (CTA)

**Validaciones en tiempo real:**
- Stock insuficiente: deshabilita `+` y muestra warning
- Cantidad máxima: 9,999 unidades
- Input manual valida enteros positivos

**Estados:**
- Vacío: mensaje "Agrega productos para comenzar"
- Con ítems: lista scrollable
- Cargando: skeleton de ítems

### `CheckoutForm`

Formulario de pagos múltiples con `@tanstack/react-form`.

**Campos dinámicos (`PaymentAllocationFields`):**
- Array de pagos con `useFieldArray`
- Por pago:
  - Select de método (`cash`, `yape`, `plin`, `card`, `bank_transfer`)
  - Input de monto (validado ≥ 0.01)
  - Input de referencia (requerido si no es efectivo)
  - Botón "Eliminar pago"
- Botón "Agregar otro pago"

**Indicadores de totales:**
- Total a cobrar (fixed, del carrito)
- Total asignado (suma de pagos ingresados)
- Pendiente (total - asignado)
  - Verde si = 0
  - Amarillo si > 0
  - Rojo si < 0
- Vuelto (solo si método incluye efectivo y asignado > total)

**Validaciones:**
- Al menos 1 pago
- Suma exacta = total de venta
- Métodos únicos (no repetir "yape" dos veces)
- Referencia obligatoria en externos
- Montos positivos

**Submit:**
- Disabled si hay errores de validación
- Loading state durante transacción
- Manejo de errores tipados con mensajes amigables

**UnsavedChangesGuard:**
- Detecta `isDirty && !isSubmitting`
- Alerta al intentar cerrar o navegar
- Confirmación "Descartar cambios" / "Seguir editando"

### `SaleCompletedResult`

Vista de resumen post-venta (read-only).

**Header:**
- Ícono de éxito (checkmark verde)
- "Venta completada"
- Hora de registro
- Badge con número de venta: `V-000123`

**Secciones:**

1. **Productos**
   - Lista de ítems vendidos
   - Nombre × cantidad
   - Subtotal por línea

2. **Pagos**
   - Método de pago con ícono
   - Referencia si aplica
   - Monto

3. **Totales**
   - Total de venta
   - Vuelto (si aplica, destacado en verde)

**Acción:**
- Botón "Nueva venta" principal
  - Cierra dialog/sheet
  - Limpia resultado de URL
  - Redirige a catálogo con carrito vacío

### `SaleDraftIssues`

Componente de alertas de validación pre-checkout.

**Ejecutado por:** `useSaleDraftReview` antes de abrir checkout

**Tipos de alertas:**

1. **Producto no encontrado** (error crítico)
   - Mensaje: "El producto X ya no existe"
   - Acción: "Eliminar del carrito"

2. **Producto inactivo** (error crítico)
   - Mensaje: "El producto X fue desactivado"
   - Acción: "Eliminar del carrito"

3. **Agotado** (error crítico)
   - Mensaje: "X está agotado (stock: 0)"
   - Acción: "Eliminar del carrito"

4. **Stock insuficiente** (warning)
   - Mensaje: "X: stock disponible 5, solicitado 10"
   - Acción: "Ajustar cantidad" (auto-reduce a stock disponible)

5. **Precio cambiado** (warning)
   - Mensaje: "El precio de X cambió: S/ 3.50 → S/ 4.00"
   - Acción: "Actualizar precios"

**Bloqueo de checkout:**
- Errores críticos bloquean "Cobrar"
- Warnings permiten continuar pero recomiendan acción
- "Actualizar todos los precios" si solo hay cambios de precio

## Hooks personalizados

### `useSaleDraft()`

Gestión reactiva del carrito con Dexie.

**Retorna:**
```typescript
{
  draft: SaleDraft | null,
  isLoading: boolean,
  addProduct: (productId: string) => Promise<Result<void>>,
  setQuantity: (productId: string, quantity: number) => Promise<Result<void>>,
  removeProduct: (productId: string) => Promise<Result<void>>,
  clear: () => Promise<Result<void>>,
  refreshPrices: (priceMap: Record<string, number>) => Promise<Result<void>>
}
```

**Features:**
- Suscripción automática con `useLiveQuery`
- Actualización optimista en UI
- Manejo de errores con toast
- Persistencia inmediata en IndexedDB

### `useSaleDraftReview()`

Validación automática del carrito.

**Retorna:**
```typescript
{
  review: SaleDraftReview | null,
  isReviewing: boolean,
  reviewError: Error | null,
  refresh: () => Promise<void>
}
```

**Ejecutado:**
- Al cargar página `/sale`
- Antes de abrir checkout
- Después de cada cambio en carrito (debounced)

**No modifica datos:** Solo reporta issues

### `useCompleteSale()`

Transacción de venta con gestión de estados.

**Retorna:**
```typescript
{
  completeSale: (paymentIntents: PaymentIntent[]) => Promise<Result<SaleResult>>,
  isCompleting: boolean,
  lastResult: SaleResult | null
}
```

**Manejo de errores:**
- Traduce `SaleError` a mensajes de usuario
- Toast de error específico por tipo
- Mantiene formulario abierto en error
- Cierra y muestra resultado en éxito

## Accesibilidad

## Accesibilidad

### Formularios
- Labels explícitos en todos los inputs
- `aria-label` en controles de cantidad
- `aria-describedby` para mensajes de error
- `aria-invalid` en campos con error

### Navegación
- Orden de tabulación lógico
- Focus visible en controles
- Skip links para saltar secciones
- Atajos de teclado:
  - `Enter` en búsqueda → buscar
  - `Esc` en dialogs → cerrar (con confirmación si dirty)

### Feedback
- `role="alert"` en errores críticos
- `aria-live="polite"` en actualizaciones de carrito
- Loading states con spinners y texto
- Toasts con `aria-live` para notificaciones

### Semántica
- `<ul>` / `<li>` en grids y listas
- `<article>` para productos
- `<dialog>` para modales
- Headings jerárquicos (h1 → h2 → h3)

## Performance

### Optimizaciones
- Búsqueda con debounce (300ms)
- Virtualización de listas largas (>100 productos)
- Lazy loading de imágenes
- Memoización de cálculos de totales
- Suscripciones Dexie selectivas (solo tablas necesarias)

### Persistencia
- Escrituras de carrito debounced (evita writes excesivos)
- Transacción de venta en un solo commit
- Índices Dexie optimizados para queries frecuentes

## Pruebas

### Unitarias
- `sale-search.test.ts` — lógica de búsqueda
- `checkout-form.mappers.test.ts` — transformaciones

### Integración
- Renderizado de componentes con Testing Library
- Interacciones de formulario
- Validaciones de campo

### E2E
- `e2e/sale.spec.ts`:
  - Flujo completo desktop
  - Flujo completo móvil
  - Rechazo sin caja abierta
  - Carrito persistido en recargas

## Mejoras futuras

**Fase 6:**
- Anulaciones de venta
- Historial de ventas
- Reimpresión de tickets

**Fase 7:**
- Búsqueda por voz
- Escáner de códigos de barras
- Modo kiosko

**Fase 8:**
- Descuentos y promociones
- Clientes frecuentes
- Fiado y cuentas por cobrar
