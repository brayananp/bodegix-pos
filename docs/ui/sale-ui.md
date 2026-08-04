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


---

## Interfaz de historial de ventas (Fase 6)

### Ruta: `/sales`

Página de consulta y gestión del historial de ventas registradas.

**Search params:**
- `search` — término de búsqueda (número, producto, referencia)
- `status` — filtro: `"completed"` | `"voided"`
- `method` — filtro de método de pago
- `page` — número de página (1-indexed, default: 1)

## Layout de historial

### `SalesHistoryPage`

**Estructura:**
- AppShell wrapper
- PageHeader con título, descripción y badge de total
- Filtros horizontales en barra
- Lista de ventas con paginación
- Sheet modal para detalle

**Header:**
```
Historial de Ventas
Consulta y gestiona las ventas registradas
[Badge: 123 ventas]
```

**Filtros:**
- Input de búsqueda con placeholder descriptivo
- Botón "Buscar" con ícono
- Select de estado (Todas/Completadas/Anuladas)
- Select de método de pago (Todos/Efectivo/Yape/Plin/etc.)

**Comportamiento:**
- Filtros se sincronizan con URL
- Búsqueda con Enter o botón
- Cambio de filtro resetea a página 1
- Estados persisten en navegación

### Filtros responsivos

**Desktop:**
```
[Input: Buscar...                    ] [Buscar] [Estado ▾] [Método ▾]
```

**Móvil:**
```
[Input: Buscar...     ] [Buscar]
[Estado ▾] [Método ▾]
```

Flex wrap automático en pantallas pequeñas.

### Lista de ventas

**Card por venta:**
```
┌────────────────────────────────────────┐
│ Venta #123          ✓ Completada      │
│ 15 ene 2025, 14:30 · 3 items          │
│ Efectivo, Yape                         │
│                            S/ 85.50    │
└────────────────────────────────────────┘
```

**Información visible:**
- Número de venta (V-000123)
- Estado con color (verde: completada, rojo: anulada)
- Fecha y hora formateada
- Cantidad de items
- Métodos de pago utilizados
- Total en soles

**Interacción:**
- Botón completo (área touch-friendly)
- Hover: fondo resaltado
- Click: abre Sheet de detalle
- Focus visible en navegación por teclado

**Estados:**
- Loading: 5 skeletons de cards
- Empty: mensaje con ícono "No hay ventas"
- Error: alerta con mensaje

### Paginación

**Componente en footer:**
```
Página 2 de 5 · 87 ventas        [Anterior] [Siguiente]
```

**Comportamiento:**
- "Anterior" disabled en página 1
- "Siguiente" disabled en última página
- Muestra info de página actual y total
- Actualiza URL al cambiar página

---

## Sheet de detalle de venta

### `SaleDetailSheet`

Sheet deslizable desde la derecha con información completa de la venta.

**Dimensiones:**
- Desktop: max-width 680px
- Móvil: ancho completo
- Altura: 100vh con scroll interno

**Header fijo:**
```
Venta #123  [✓ Completada]         [Cerrar]
15 ene 2025, 14:30
```

Si anulada:
```
Venta #123  [✗ Anulada]            [Cerrar]
15 ene 2025, 14:30 · Anulada el 15 ene, 18:45
```

**Contenido scrollable:**

1. **Motivo de anulación** (si aplica)
   ```
   ┌─ Alert destructive ────────────────┐
   │ ⚠ Motivo de anulación              │
   │ Cliente devolvió producto por...   │
   └────────────────────────────────────┘
   ```

2. **Sección: Productos**
   ```
   Productos
   
   ┌────────────────────────────────────┐
   │ Coca Cola 500ml                    │
   │ 2 × S/ 3.50                        │
   │                         S/ 7.00    │
   └────────────────────────────────────┘
   
   ┌────────────────────────────────────┐
   │ Galletas Oreo                      │
   │ 1 × S/ 5.50                        │
   │                         S/ 5.50    │
   └────────────────────────────────────┘
   ```

3. **Sección: Pagos**
   ```
   Pagos
   
   ┌────────────────────────────────────┐
   │ Efectivo                           │
   │ Recibido: S/ 20.00 · Vuelto: 7.50  │
   │                        S/ 12.50    │
   └────────────────────────────────────┘
   ```

   Si anulado:
   ```
   ┌────────────────────────────────────┐
   │ Yape  [Anulado]                    │
   │ Ref: 123456789                     │
   │                        S/ 15.00    │
   └────────────────────────────────────┘
   ```

4. **Totales**
   ```
   ┌────────────────────────────────────┐
   │ Subtotal              S/ 12.50     │
   │ ───────────────────────────────────│
   │ Total                 S/ 12.50     │
   └────────────────────────────────────┘
   ```

5. **Botón de anulación** (si es elegible)
   ```
   [🗙 Anular venta]  (botón rojo ancho completo)
   ```

6. **Mensaje de inelegibilidad** (si no se puede anular)
   ```
   ┌─ Alert ────────────────────────────┐
   │ ℹ No se puede anular esta venta    │
   │ Solo puedes anular ventas de la    │
   │ sesión actual abierta.             │
   └────────────────────────────────────┘
   ```

**Accesibilidad:**
- Focus trap dentro del Sheet
- Escape cierra el Sheet
- Botón "Cerrar" siempre visible
- Contenido scrollable con scrollbar visible

---

## Formulario de anulación

### `VoidSaleForm`

Modal responsive para anular ventas con confirmación explícita.

**Desktop:** Dialog centrado (max 88vh)  
**Móvil:** Drawer bottom (max 92vh)

**Componente:** `ResponsiveDialogDrawer`
- Desktop: `<Dialog>` con backdrop oscuro
- Móvil: `<Drawer>` con swipe handle

### Header fijo

```
Anular Venta #123

Esta acción no se puede deshacer. La venta se marcará
como anulada y el stock será devuelto a los productos.
```

### Contenido scrollable

1. **Advertencias** (Alert destructivo)
   ```
   ┌─ Alert border-destructive ─────────┐
   │ Confirma que:                      │
   │ • La venta fue registrada por error│
   │ • Los productos serán devueltos al │
   │   inventario                       │
   │ • Los pagos serán marcados como    │
   │   anulados                         │
   │ • Esta acción solo es reversible   │
   │   desde la base de datos           │
   └────────────────────────────────────┘
   ```

2. **Campo: Motivo de anulación**
   ```
   Motivo de anulación *
   
   ┌────────────────────────────────────┐
   │ Describe por qué se anula esta     │
   │ venta...                           │
   │                                    │
   │                                    │
   └────────────────────────────────────┘
   
   Mínimo 5 caracteres, 0 actual    235 restantes
   ```

   **Validación en tiempo real:**
   - Contador de caracteres actuales
   - Contador de caracteres restantes
   - Color rojo cuando < 20 restantes
   - Deshabilita submit si < 5 caracteres
   - Limita input a 240 caracteres

3. **Espaciador** (h-4)
   - Asegura que todo el contenido sea scrollable

### Botones de acción (sticky bottom)

```
                         [Cancelar] [Confirmar anulación]
```

**Estados:**
- Normal: "Confirmar anulación"
- Loading: "Anulando..." (ambos botones disabled)
- Submit disabled si motivo inválido

**Desktop:**
- Border top separador
- Padding superior: 20px (sm:pt-5)

**Móvil:**
- Border top separador
- Safe-area padding bottom: `max(1rem, env(safe-area-inset-bottom))`

### Interacciones

**Abrir:**
- Click botón "Anular venta" en detalle
- Muestra dialog/drawer con animación

**Cerrar:**
- Click "Cancelar"
- Click backdrop (solo desktop)
- Tecla Escape
- Submit exitoso (automático)

**Submit:**
1. Valida longitud del motivo (5-240)
2. Muestra estado loading
3. Ejecuta comando `voidSale()`
4. En éxito:
   - Toast verde: "Venta anulada"
   - Cierra modal
   - Refresca detalle de venta
   - Callback `onSuccess()`
5. En error:
   - Toast rojo con mensaje específico
   - Mantiene modal abierto
   - Permite reintentar

### Validaciones visuales

**Motivo válido (≥5 chars):**
- Botón submit enabled
- Color normal en contador

**Motivo inválido (<5 chars):**
- Botón submit disabled
- Color gris en botón

**Casi al límite (<20 chars restantes):**
- Color rojo en contador de restantes
- Advertencia visual pero no bloquea

### Accesibilidad

- Label asociado al textarea
- Aria-required="true"
- Aria-describedby para ayuda
- Focus automático en textarea al abrir
- Focus trap en modal
- Escape cierra (si no está enviando)
- Enter NO envía (permite saltos de línea)

---

## Patrones responsive comunes (Fase 6)

### `ResponsiveDialogDrawer`

Componente reutilizable para modales adaptativos.

**Props:**
```typescript
{
  open: boolean,
  onOpenChange: (open: boolean) => void,
  title: string,
  description: string,
  children: ReactNode
}
```

**Desktop (≥768px):**
```typescript
<Dialog>
  <DialogContent className="flex max-h-[88dvh] flex-col gap-0">
    <DialogHeader className="shrink-0 border-b">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
    </DialogHeader>
    {children}
  </DialogContent>
</Dialog>
```

**Móvil (<768px):**
```typescript
<Drawer showSwipeHandle>
  <DrawerContent className="max-h-[92dvh]">
    <DrawerHeader className="text-left">
      <DrawerTitle>{title}</DrawerTitle>
      <DrawerDescription>{description}</DrawerDescription>
    </DrawerHeader>
    {children}
  </DrawerContent>
</Drawer>
```

**Características:**
- Detección automática con `useIsMobile()`
- Header fijo, contenido scrollable, acciones sticky
- Safe-area handling en iOS
- Animaciones nativas de cada componente

### Estructura de contenido

**Patrón estándar para hijos:**
```tsx
<form className="flex min-h-0 flex-1 flex-col">
  {/* Contenido scrollable */}
  <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
    {/* Campos, alertas, etc. */}
  </div>
  
  {/* Botones sticky */}
  <div className="border-t px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:border-0 sm:px-6 sm:pb-0 sm:pt-5">
    {/* Botones de acción */}
  </div>
</form>
```

**Clases clave:**
- `min-h-0`: Permite flexbox contraer
- `flex-1`: Expande para llenar espacio
- `overflow-y-auto`: Scroll interno
- `pb-[max(...)]`: Safe-area en iOS
- `sm:px-6`: Padding responsivo

---

## Navegación y rutas

**Rutas implementadas:**
- `/sale` — Punto de venta (Fase 5)
- `/sales` — Historial de ventas (Fase 6)

**Navegación principal:**
```
Sidebar / Bottom Nav:
- Venta → /sale
- Ventas → /sales     (NUEVO)
- Productos → /products
- Inventario → /inventory
- Caja → /cash
- Resumen → /summary
```

**Flujo de navegación:**
1. Usuario hace venta en `/sale`
2. Usuario consulta historial en `/sales`
3. Usuario abre detalle en Sheet
4. Usuario anula venta si es elegible
5. Sheet se cierra, lista se actualiza

---

## Estados y feedback

### Loading states

**Lista de ventas:**
- 5 `<Skeleton>` de cards con altura fija
- Sin contenido visible hasta cargar

**Detalle de venta:**
- Texto: "Cargando venta…" en contenido
- Mantiene estructura del Sheet

### Empty states

**Sin ventas:**
```
       [🛍️ Ícono grande]
       
       No hay ventas
       
       No se encontraron ventas con
       los filtros seleccionados
```

### Error states

**Error de carga:**
- Alert con mensaje de error
- Botón "Reintentar"
- Mantiene filtros aplicados

**Error de anulación:**
- Toast rojo con mensaje específico
- Modal permanece abierto
- Usuario puede corregir y reintentar

### Success feedback

**Venta anulada:**
- Toast verde: "Venta anulada"
- Modal se cierra automáticamente
- Lista se refresca
- Detalle muestra nuevo estado

---

## Accesibilidad (WCAG 2.1 AA)

### Navegación por teclado

**Historial:**
- Tab: navega entre filtros, ventas, paginación
- Enter: abre detalle de venta seleccionada
- Escape: cierra Sheet de detalle

**Sheet de detalle:**
- Focus trap: Tab solo dentro del Sheet
- Escape: cierra Sheet
- Enter en botón "Anular": abre modal

**Modal de anulación:**
- Focus automático en textarea
- Tab: textarea → Cancelar → Confirmar
- Escape: cierra modal (si no está enviando)
- Enter: NO envía (permite multiline en textarea)

### ARIA y semántica

**Filtros:**
```html
<input aria-label="Buscar venta" />
<select aria-label="Filtrar por estado" />
```

**Lista:**
```html
<ul role="list">
  <li role="listitem">
    <button aria-label="Ver detalle de venta 123">
      ...
    </button>
  </li>
</ul>
```

**Sheet:**
```html
<div role="dialog" aria-modal="true" aria-labelledby="sheet-title">
  <h2 id="sheet-title">Venta #123</h2>
  ...
</div>
```

**Modal de anulación:**
```html
<textarea
  id="reason"
  aria-label="Motivo de anulación"
  aria-required="true"
  aria-describedby="reason-help"
/>
<div id="reason-help">Mínimo 5 caracteres...</div>
```

### Contraste y colores

**Estados de venta:**
- Completada: fondo verde 600 (contraste 4.5:1)
- Anulada: fondo rojo destructive (contraste 4.5:1)

**Botones:**
- Primary: contraste mínimo 4.5:1
- Destructive: contraste mínimo 4.5:1
- Disabled: contraste 3:1 (permitido)

**Links y botones:**
- Focus visible: outline 2px
- Hover: cambio de color perceptible

---

## Pruebas E2E (Fase 6)

### `e2e/sales-history.spec.ts`

**13 tests implementados:**

1. ✅ Renderizado completo de página
2. ✅ Filtro por estado (Completadas/Anuladas)
3. ✅ Filtro por método de pago
4. ✅ Búsqueda por texto con botón
5. ✅ Búsqueda con tecla Enter
6. ✅ Estado vacío sin resultados
7. ✅ Navegación entre páginas
8. ✅ Abrir Sheet de detalle
9. ✅ Cerrar Sheet con botón
10. ✅ Navegación por teclado (Tab, Enter)
11. ✅ Cerrar con Escape
12. ✅ Persistencia de filtros en URL
13. ✅ Badge con total de ventas

**Cobertura:**
- Renderizado y estructura
- Interacciones de usuario
- Estados de loading/empty
- Accesibilidad por teclado
- Responsividad (desktop y móvil)

---

## Mejoras futuras

**Historial:**
- [ ] Filtro por rango de fechas
- [ ] Filtro por rango de montos
- [ ] Exportar CSV/Excel
- [ ] Impresión de comprobantes
- [ ] Búsqueda avanzada (múltiples criterios)

**Anulación:**
- [ ] Autorización por supervisor
- [ ] Anulación parcial de items
- [ ] Límites de monto sin autorización
- [ ] Registro de usuario que anuló
- [ ] Generación de nota de crédito

**UX:**
- [ ] Infinite scroll en lista
- [ ] Preview rápido en hover (desktop)
- [ ] Shortcuts de teclado globales
- [ ] Modo oscuro
- [ ] Personalización de columnas visibles
