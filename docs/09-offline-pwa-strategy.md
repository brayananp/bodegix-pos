# 09. Estrategia offline y PWA

## Objetivos

- Abrir la aplicación sin conexión después de instalarla.
- Registrar ventas, pagos, inventario y caja sin red.
- Evitar pérdida por una actualización inesperada.
- Informar claramente el estado de conexión.
- Mantener separadas la caché del shell y la base de datos.

## Distribución de responsabilidades

| Necesidad | Tecnología |
|---|---|
| Datos estructurados | IndexedDB mediante Dexie |
| Recursos de aplicación | Cache Storage mediante service worker |
| Instalación | Web App Manifest |
| Actualización | Service worker con aviso al usuario |
| Persistencia | StorageManager cuando esté disponible |
| Respaldo | Archivo descargable e importable |

## Estrategia de caché

### Precache

- HTML del shell.
- JavaScript.
- CSS.
- Fuentes locales.
- Iconos.
- Imágenes esenciales.

### Runtime cache

En el MVP debe ser mínima porque no existen APIs críticas remotas.

- Recursos estáticos versionados.
- No almacenar respuestas sensibles.
- No confiar en runtime cache para datos de negocio.

## Actualizaciones

Se recomienda una estrategia con aviso:

```text
Hay una nueva versión disponible.
[Actualizar ahora] [Después]
```

Reglas:

1. No recargar si el carrito tiene elementos.
2. No recargar durante una transacción.
3. Ofrecer actualización después de completar o cancelar la venta.
4. Ejecutar migraciones al abrir la nueva versión.
5. Mostrar recuperación si una migración falla.

## Persistencia del almacenamiento

Durante configuración o después de uso significativo:

```typescript
const granted =
  await navigator.storage?.persist?.();
```

También se consultará:

```typescript
const estimate =
  await navigator.storage?.estimate?.();
```

La interfaz mostrará:

- persistencia concedida o no;
- uso aproximado;
- cuota aproximada;
- fecha del último respaldo.

## Estado offline

La UI debe mostrar un indicador discreto:

```text
● Sin conexión — trabajando localmente
```

No debe bloquear la operación.

## Primera carga

La aplicación necesita conexión para descargar el shell la primera vez. El onboarding debe verificar que:

- el service worker está registrado;
- el shell fue almacenado;
- la base local abre correctamente;
- existe espacio suficiente;
- se puede exportar un respaldo.

## Prueba offline obligatoria

1. Instalar.
2. Crear productos.
3. Abrir caja.
4. Activar modo avión.
5. Cerrar y abrir la PWA.
6. Registrar ventas.
7. Registrar una entrada.
8. Cerrar caja.
9. Exportar respaldo.
10. Volver a conectar y actualizar.

## Navegadores objetivo

Prioridad:

1. Chrome/Chromium en Android.
2. Chrome/Edge en escritorio.
3. Safari iOS como compatibilidad secundaria a verificar.

No se prometerá compatibilidad sin pruebas reales en el dispositivo.

## Fuentes técnicas oficiales

- TanStack Start SPA mode: https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode
- Vite PWA: https://vite-pwa-org.netlify.app/
- MDN Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API
- MDN persist: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
