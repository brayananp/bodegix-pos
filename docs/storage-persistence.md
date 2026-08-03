# Persistencia de almacenamiento

IndexedDB almacena los datos en el origen del navegador. Por defecto puede ser almacenamiento
`best-effort`: el navegador decide su expulsión bajo presión y el usuario siempre puede borrarlo.

El panel de configuración consulta `navigator.storage.persisted()` y `estimate()`. Uso, cuota y
porcentaje son **estimaciones**, pueden omitir valores y no representan capacidad garantizada. Una
cuota cero no se usa como divisor.

`persist()` se ejecuta únicamente al pulsar “Solicitar persistencia”. Un resultado `false` significa
que no fue concedida, no un error técnico. La app degrada de forma segura si StorageManager o una
operación concreta no están disponibles. Estas APIs requieren un contexto seguro en navegadores
compatibles.

Persistencia local y respaldo son conceptos distintos:

- persistencia reduce la expulsión automática por el navegador;
- respaldo crea otra copia recuperable fuera del origen;
- la Fase 1 no exporta, importa, restaura ni promete recuperación.

El respaldo se implementará en una fase posterior. Hasta entonces, limpiar datos del sitio,
desinstalar ciertos navegadores o perder el dispositivo puede destruir la única copia.

Referencias MDN: [persist()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist),
[persisted()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persisted) y
[estimate()](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate).
