# 13. Especificación UI/UX

## Inventario contextual (Fase 3)

`/inventory` presenta cuatro métricas, pestañas Stock/Movimientos, filtros tipados y paginación.
Stock usa tabla en escritorio y tarjetas en móvil; movimientos muestran fecha, producto, tipo,
delta con signo, transición y motivo/referencia.

Un único `InventorySheet` representa `detail`, `initial`, `entry`, `reconcile` y `loss`. Ocupa
560–720 px en escritorio y pantalla completa en móvil; mantiene encabezado y acciones accesibles,
scroll interno y safe area. Cambiar operación no anida otro modal. Search params conservan filtros,
pestaña, página y producto; el formulario permanece fuera de la URL. El guard compartido pide
confirmación solo si hay cambios sin guardar.

## Catálogo contextual

`/products` mantiene lista y filtros debajo de las superficies secundarias. Producto
usa un `Sheet` derecho de 640 px en escritorio y ancho/alto completo en móvil, con
encabezado y pie fijos y cuerpo desplazable. Categoría usa `Dialog` en escritorio y
`Drawer` en móvil. Desactivación y descarte usan `AlertDialog`. No se anidan formularios
ni se abren Dialog/Drawer de edición encima de otro overlay.

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

---

## Stack técnico UI

### shadcn/ui v4 (base-vega + hugeicons)

- **Framework**: TanStack Start (SPA, sin RSC).
- **Tailwind**: v4 sin `tailwind.config.js` — tokens en `src/styles.css` mediante `@theme inline` y variables CSS.
- **Base**: `@base-ui/react` en vez de Radix.
- **Íconos**: `@hugeicons/react` + `@hugeicons/core-free-icons`.
- **Alias de importación**: `#/shared/components/ui/*` para componentes, `#/shared/lib/utils` para helpers.
- **Path de instalación**: `src/shared/components/ui/`.

#### Componentes shadcn instalados (56)

Formulario y entrada:

- `button`, `button-group`, `field`, `form`, `input`, `input-group`, `label`, `textarea`,
  `select`, `native-select`, `combobox`, `checkbox`, `switch`, `radio-group`, `slider`,
  `toggle`, `toggle-group`, `input-otp`, `calendar`.

Layout y navegación:

- `card`, `badge`, `separator`, `accordion`, `breadcrumb`, `navigation-menu`, `sidebar`,
  `tabs`, `scroll-area`, `resizable`, `aspect-ratio`, `collapsible`, `item`, `pagination`.

Overlays y diálogos:

- `dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `tooltip`, `hover-card`,
  `context-menu`, `dropdown-menu`, `menubar`, `command`.

Feedback y estados:

- `alert`, `sonner` (toasts), `progress`, `skeleton`, `spinner`, `empty`, `kbd`.

Visualización y datos:

- `avatar`, `table`, `data-table`, `chart`, `carousel`.

#### Instalar más componentes o blocks

```powershell
# Componente individual desde el registry oficial @shadcn
.\node_modules\.bin\shadcn.CMD add data-table chart --yes

# Buscar en registry por palabra clave
.\node_modules\.bin\shadcn.CMD search -q "login"

# Listar registries configurados en components.json
.\node_modules\.bin\shadcn.CMD info --json
```

#### Añadir registries de terceros (blocks, temas)

Editar `components.json` y agregar bajo `registries`:

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/styles/{style}/{name}.json",
    "@example": "https://registry.example.com/{name}.json"
  }
}
```

Luego: `.\node_modules\.bin\shadcn.CMD add @example/nombre-del-block`.

> **Blocks recomendados** para el MVP (evaluar al momento de construir cada pantalla):
> - autenticación, dashboard stats, settings forms, invoice/receipt preview,
>   inventory table, POS product grid, cash drawer summary.

---

### TanStack Form + shadcn Field (composición oficial)

La aplicación define una sola infraestructura con `createFormHookContexts` y
`createFormHook`. Los módulos usan `useAppForm`, `formOptions`, `form.AppField` y
`form.AppForm`; los campos registrados encapsulan shadcn `Field`, eventos y errores.
Zod se pasa directamente como Standard Schema en blur/submit.

```tsx
const form = useAppForm({ ...productFormOptions, onSubmit });

<form.AppForm>
  <form.AppField name="name" validators={{ onBlur: productFormSchema.shape.name }}>
    {(field) => <field.TextField label="Nombre" autoComplete="off" />}
  </form.AppField>
  <form.FormActions onCancel={onCancel} submitLabel="Crear producto" />
</form.AppForm>;
```

`ProductFormFields` usa `withForm` para separar únicamente la composición. Los valores
del formulario no son entidades de dominio; dinero y enteros permanecen como strings
hasta los mapeadores. Consulta `docs/forms/form-composition.md` para las reglas completas.

---

### Proveedores globales en el shell raíz

Montados en `src/routes/__root.tsx`:

1. **`ThemeProvider`** (`next-themes`): atributo `class`, `defaultTheme="system"`, soporte claro/oscuro.
2. **`TooltipProvider`** (shadcn): `delayDuration={150}`.
3. **`Toaster`** (sonner): `position="top-right"`, `richColors`, `closeButton`, íconos Hugeicons.

Usar `toast.success / toast.error / toast.info / toast.warning` para feedback en acciones (guardar, eliminar, cobrar, etc.).

La referencia práctica vigente es `src/modules/catalog/ui/forms`: composición común,
validación Zod por blur/submit, feedback con Sonner y reset tras persistencia exitosa.

## Interfaz de caja implementada

`/cash` alterna Caja actual/Historial. Apertura y movimiento son Dialog/Drawer responsive; cierre y
detalle son Sheet. Search params restauran panel y sesión. El guard compartido protege cambios y la
diferencia usa texto Cuadrada/Sobrante/Faltante además del color.
