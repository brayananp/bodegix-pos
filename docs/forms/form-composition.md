# Composición de formularios

## Infraestructura común

`src/shared/ui/forms/form-context.ts` crea una sola pareja de contextos mediante
`createFormHookContexts`. Exporta `fieldContext`, `formContext`, `useFieldContext` y
`useFormContext`. `app-form.ts` llama una sola vez a `createFormHook` y exporta
`useAppForm`, `withForm` y `withFieldGroup`.

Los campos registrados son `TextField`, `MoneyField`, `IntegerField`, `BarcodeField`,
`SelectField` y `FieldErrorInfo`. Cada uno obtiene exclusivamente el campo actual con
`useFieldContext<T>()`; encapsula label, eventos, errores, `aria-invalid` y
`data-invalid`. Ninguno recibe la instancia completa ni conoce catálogo o Dexie.

Los componentes de formulario registrados son `SubmitButton`, `FormActions`,
`FormError`, `DirtyStateIndicator` y `UnsavedChangesGuard`. `SubmitButton` y el guard
usan selectores granulares sobre `canSubmit`, `isSubmitting` e `isDirty`.

## Uso en módulos

Los formularios renderizan campos con `form.AppField` y colocan componentes registrados
dentro de `form.AppForm`. `ProductFormFields` se define con `withForm` y una función
nombrada `Render`; recibe la instancia tipada y las categorías sin recurrir a contexto
tipado de último recurso. `withFieldGroup` queda exportado para grupos realmente
reutilizables, pero no se usa en catálogo porque no existe aún uno.

`productFormOptions` y `categoryFormOptions` centralizan valores base y validación Zod
de submit. El blur usa los esquemas de campo. Los casos de uso vuelven a validar las
invariantes y el adaptador las comprueba dentro de la transacción.

## Valores, conversión y errores

`ProductFormValues` conserva dinero, cantidades opcionales e IDs como strings. Los
mapeadores puros limpian entradas, convierten vacíos a `null` y transforman dinero a
céntimos mediante separación de parte entera/decimal, nunca mediante coma flotante.
Editar crea la instancia cuando la entidad ya está cargada y la remonta con una `key`
por ID, evitando que un producto herede valores de otro.

Los errores de negocio se discriminan con `CatalogErrorCode`. Duplicado de código se
asigna a `barcode`; categoría inválida a `categoryId`; nombre duplicado a `name`; los
errores desconocidos se presentan como error general sin cerrar el formulario.

## Dirty state y reglas para formularios nuevos

`UnsavedChangesGuard` bloquea navegación de Router y `beforeunload` cuando
`isDirty && !isSubmitting`. El resolver muestra un `AlertDialog`, permite continuar o
descartar y se desactiva tras `form.reset()` en un envío exitoso.

Para un formulario nuevo:

1. Define valores editables, esquema Zod, `formOptions` y mapeadores puros.
2. Reutiliza campos registrados y `AppField`; no repitas cableado de errores/eventos.
3. Usa `withForm` al extraer una composición grande y `withFieldGroup` solo si se reusa.
4. Mantén casos de uso y persistencia fuera de `formOptions` y de los campos comunes.
5. Mapea errores por código y usa únicamente APIs públicas del formulario.
