# 12. Seguridad y privacidad

## Modelo de amenaza del MVP

La aplicación es local y no tiene autenticación. Cualquier persona con acceso al dispositivo y al perfil del navegador puede acceder a los datos.

Esto debe comunicarse claramente.

## Riesgos principales

- Pérdida o robo del dispositivo.
- Borrado del almacenamiento.
- Respaldo manipulado.
- XSS desde dependencias o contenido no escapado.
- QR incorrecto.
- Capturas falsas de pagos.
- Datos de tarjeta ingresados por error.
- Actualización defectuosa.
- Importación destructiva.
- Acceso compartido al dispositivo.

## Controles

### Datos

- No almacenar secretos bancarios.
- No almacenar datos completos de tarjetas.
- Validar todas las entradas.
- Escapar contenido mostrado.
- Limitar tamaño de textos.
- Validar archivos importados.
- Calcular checksum.
- Crear copia previa a restauración.

### Aplicación

- Content Security Policy compatible con PWA.
- Sin scripts remotos innecesarios.
- Dependencias auditadas.
- Lockfile versionado.
- Actualizaciones controladas.
- No insertar HTML no confiable.
- Manejo global de errores.

### Pagos

- Mensaje contra capturas.
- Confirmación manual explícita.
- Referencia opcional.
- Separación entre pago registrado y procesamiento externo.

### Dispositivo

Recomendaciones al usuario:

- activar bloqueo de pantalla;
- no compartir el perfil del navegador;
- mantener respaldo fuera del dispositivo;
- verificar QR antes de operar;
- instalar solo desde la URL oficial.

## Privacidad

Datos previstos:

- nombre del negocio;
- productos;
- ventas;
- importes;
- referencias de operaciones opcionales.

El MVP no necesita:

- DNI de clientes;
- teléfonos de clientes;
- geolocalización;
- contactos;
- cámara salvo escaneo opcional futuro;
- micrófono.

## Respaldo

El archivo puede contener información comercial sensible. Debe advertirse:

> Guarda el respaldo en un lugar seguro. Cualquier persona con el archivo podría leer la información del negocio.

El cifrado de respaldo con contraseña puede agregarse posteriormente, pero no debe implementarse de forma improvisada.
