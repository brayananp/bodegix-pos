# Estrategia de actualización

El registro comprueba actualizaciones al iniciar, cada 60 minutos, al recuperar foco tras 15 minutos
y por acción manual. Un Service Worker nuevo permanece `waiting`; la aplicación presenta “Nueva
versión disponible” con `Actualizar ahora` y `Más tarde`.

`Actualizar ahora` solo se habilita si no existen blockers:

- formulario dirty;
- checkout en curso;
- validación o restauración de respaldo;
- mantenimiento/reinicialización de base;
- otra operación crítica registrada.

Posponer no descarta el worker: deja una barra discreta para volver a mostrarlo. Al aceptar, la app
envía `SKIP_WAITING` y permite una única recarga controlada. No existe `autoUpdate` ni bucle de
recarga. Cache Storage puede cambiar; Dexie/IndexedDB y los archivos `.bodegix` no se borran ni se
reinicializan. Una migración futura de esquema sigue siendo responsabilidad de Dexie.
