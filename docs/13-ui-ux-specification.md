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

### TanStack Form + shadcn Field (composition pattern)

> **Regla del proyecto**: **No** usar `@tanstack/zod-form-adapter` (deprecado).
> Integrar Zod manualmente dentro de `validators.onChange` / `validators.onSubmit`.

Referencia rápida: <https://tanstack.com/form/latest/docs/framework/react/quick-start>

#### Patrón estándar — Campo simple

```tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/shared/components/ui/field";
import { Input } from "#/shared/components/ui/input";

const schema = z.object({
  name: z.string().min(3).max(120),
});

type FormShape = z.infer<typeof schema>;

function Demo() {
  const form = useForm<FormShape>({
    defaultValues: { name: "" },
    validators: {
      onChange: ({ value }) => {
        const res = schema.safeParse(value);
        if (res.success) return undefined;
        const fields: Partial<Record<keyof FormShape, string[]>> = {};
        for (const issue of res.error.issues) {
          const key = issue.path[0] as keyof FormShape | undefined;
          if (key) (fields[key] ??= []).push(issue.message);
        }
        return { fields };
      },
    },
    onSubmit: ({ value }) => {
      // …
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field
          name="name"
          children={(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={field.state.meta.errors.length > 0 || undefined}
              />
              <FieldDescription>Ayuda visible.</FieldDescription>
              <FieldError
                errors={field.state.meta.errors.map((m) => ({ message: m }))}
              />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
```

#### Convenciones

| Aspecto              | Implementación                                                                |
| -------------------- | ----------------------------------------------------------------------------- |
| Agrupación           | `FieldGroup` envolviendo todos los campos.                                    |
| Campo individual     | `<form.Field name=…>` renderizando dentro `<Field data-invalid=…>`.          |
| Estado inválido      | `data-invalid` en `<Field>`, `aria-invalid` en el control (Input/Select/etc). |
| Mensaje de error     | `<FieldError errors={[ { message } ]} />` mapeado desde `field.state.meta.errors`. |
| Submit protegido     | `<form.Subscribe selector={s => [s.canSubmit, s.isSubmitting]} />`.          |
| Switch / Radio / Checkbox | `<Field orientation="horizontal">` + `<FieldTitle>` + `<FieldContent>`. |
| Layout 2 col tablet  | `<div className="grid grid-cols-1 gap-7 md:grid-cols-2">` anidando `<form.Field>`. |

---

### Proveedores globales en el shell raíz

Montados en `src/routes/__root.tsx`:

1. **`ThemeProvider`** (`next-themes`): atributo `class`, `defaultTheme="system"`, soporte claro/oscuro.
2. **`TooltipProvider`** (shadcn): `delayDuration={150}`.
3. **`Toaster`** (sonner): `position="top-right"`, `richColors`, `closeButton`, íconos Hugeicons.

Usar `toast.success / toast.error / toast.info / toast.warning` para feedback en acciones (guardar, eliminar, cobrar, etc.).

Ejemplo práctico en `src/routes/index.tsx`: formulario completo de *Nuevo Producto* que combina `Card`, `Field*`, `Input`, `Select`, `Switch`, `Textarea`, validación Zod con `validators.onChange` + `onSubmit`, confirmación por `toast.success`, y reset del formulario. Sirve como referencia para el resto del MVP.

