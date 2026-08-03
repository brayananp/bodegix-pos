# Interfaz de caja

`/cash` usa search params tipados: `tab`, `panel`, `sessionId`, `page` y `pageSize`. La URL restaura
el detalle al recargar y el botón atrás cierra el overlay conservando la pestaña; los valores de
formularios nunca se serializan.

Sin caja abierta se muestra el último cierre y la acción Abrir caja. Con caja abierta se muestran
el fondo inicial, ventas en efectivo, depósitos, retiros, efectivo esperado, pagos digitales y
movimientos. Apertura y movimientos usan Dialog en escritorio y Drawer en móvil. Cierre y detalle
usan un Sheet de 680 px o pantalla completa. No hay rutas secundarias ni overlays de operación
anidados.

Los formularios reutilizan `formOptions`, `useAppForm`, `withForm`, `AppField`, `AppForm`,
`MoneyField`, `TextField`, `FormActions`, `FormError` y `UnsavedChangesGuard`. La diferencia se
actualiza con una suscripción granular y no se persiste desde React. Foco, labels, mensajes
explícitos y objetivos táctiles mantienen el flujo accesible en teclado y móvil.
