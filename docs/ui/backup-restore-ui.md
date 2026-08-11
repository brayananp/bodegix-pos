# UI de respaldo y restauración

La capacidad vive en `/settings?section=data`; no agrega un ítem al sidebar. Los search params solo
guardan `section=general|storage|data` y `panel=backup|restore`. Archivo, progreso, validación y texto
de confirmación permanecen en memoria.

Crear respaldo usa Dialog en escritorio y Drawer en móvil. Explica el alcance, advierte caja/carrito,
muestra progreso y resultado. Restaurar usa un Sheet derecho de 820 px y ancho completo móvil, sin
overlays anidados. Sus pasos son archivo, validación, confirmación y resultado. La vista previa
compara negocio, versión, tablas y conteos del respaldo con productos, ventas y caja actuales.

TanStack Form exige reemplazo total, aceptación condicional de advertencias, confirmación del
download fallback y `RESTAURAR`. Durante la importación no se puede cerrar ni navegar. El éxito
ofrece reinicio controlado. Errores de checksum, versión, diagnóstico y pestañas usan mensajes
específicos sin mostrar datos sensibles.
