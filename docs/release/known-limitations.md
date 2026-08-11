# Known limitations

- Sin sincronización cloud ni multi-dispositivo.
- Sin autenticación, roles o bloqueo de acceso local.
- Una instalación representa una bodega.
- Backup manual, no cifrado y bajo custodia del usuario.
- Sin SUNAT ni emisión fiscal electrónica.
- Sin devoluciones/anulación después de cerrar la sesión original.
- Pagos externos se verifican manualmente; no hay integración automática.
- Cantidades de inventario enteras, no fraccionarias.
- Catálogo filtra substring cargando hasta 10k productos en memoria; no está virtualizado.
- CSP permite inline por compatibilidad actual; no permite eval.
- Datos IndexedDB no están cifrados en reposo.
- Firefox headless no ejecuta smoke en el host Windows actual por fallo gráfico del navegador; CI
Linux lo mantiene obligatorio.
- HSTS y dominio final quedan para Fase 11/deployment.

