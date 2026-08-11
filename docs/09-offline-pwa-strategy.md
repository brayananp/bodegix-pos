# 09. Estrategia offline y PWA

## Portabilidad completamente offline

Crear, validar y restaurar no realiza solicitudes de red. File System Access es una mejora
progresiva con fallback de descarga/input. Web Locks y BroadcastChannel coordinan pestañas; su
degradación y límites están documentados. Cache/install/update pertenecen a Fase 9.

## Estado tras Fase 1

IndexedDB ya es la fuente local y la base se abre exclusivamente después del montaje cliente. El
panel permite consultar persistencia, uso y cuota estimados y solicitar `persist()` por acción
explícita. Esto no implementa todavía service worker, caché offline del shell ni respaldo. Ver
[storage-persistence.md](./storage-persistence.md).

## Contexto arquitectónico

Esta estrategia es la base del **monolito modular local-first** del proyecto (ref: [ADR-0007](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0007-local-first-modular-monolith.md)). Todos los datos y reglas de negocio viven en cliente. No hay backend crítico. Las operaciones críticas (venta, anulación, apertura/cierre de caja) no dependen de la red.

## Objetivos

- Abrir la aplicación sin conexión después de instalarla.
- Registrar ventas, pagos, inventario y caja sin red.
- Evitar pérdida por una actualización inesperada.
- Informar claramente el estado de conexión.
- Mantener separadas la caché del shell y la base de datos.
- Garantizar que Dexie (adaptador de infraestructura —ref: [ADR-0014](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/adr/0014-dexie-as-local-adapter.md)) sea el único punto de acceso a datos locales.

## Distribución de responsabilidades

| Necesidad | Tecnología | Lugar arquitectónico |
|---|---|---|
| Datos estructurados | IndexedDB mediante Dexie | `shared/infrastructure/db` |
| Recursos de aplicación | Cache Storage mediante service worker | `app/pwa/` |
| Instalación | Web App Manifest | `app/pwa/` |
| Actualización | Service worker con aviso al usuario | `app/pwa/` |
| Persistencia | StorageManager cuando esté disponible | `shared/infrastructure/storage` |
| Respaldo | Archivo descargable e importable | `modules/backup` |
| Shell UI offline | componente React | `app/layout` + `routes/*` |
| Reglas de negocio | Dominio puro en módulos | `modules/*/domain` |

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

## Preparación para sincronización futura

Ver detalles completos en [18-future-evolution.md](file:///c:/Users/ALEXIS/PROYECTOS/productos/bodegix-pos/docs/18-future-evolution.md).

Hoy se preserva en el MVP:
- UUID global por registro
- `createdAt` / `updatedAt` UTC
- Ventas completadas inmutables + anulaciones explícitas
- Esquema versionado Dexie
- Formato de backup versionado

**Campos que NO se agregan todavía** (no hay infraestructura real que los use): `tenantId`, `branchId`, `userId`, `deviceId`, `syncStatus`, `serverVersion`, `deletedAt`.

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
