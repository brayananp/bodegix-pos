# Instalabilidad

La instalación es progressive enhancement. Requiere manifest válido, HTTPS (o localhost), Service
Worker e iconos adecuados. La aplicación escucha `beforeinstallprompt`, conserva el evento solo en
memoria y ofrece instalación cuando el navegador la permite; `appinstalled` y `display-mode`
actualizan el estado.

`beforeinstallprompt` no es estándar universal. En Chrome/Edge desktop y Android puede existir un
prompt programático. En iOS normalmente se usa Compartir → Agregar a pantalla de inicio. Otros
navegadores pueden ofrecer instalación únicamente en su menú o no ofrecerla. La UI nunca promete
el mismo comportamiento.

En `standalone` se respetan safe areas y no se muestra una falsa acción de instalación. La app sigue
siendo utilizable en pestaña normal cuando la instalación no está disponible o el usuario la rechaza.
