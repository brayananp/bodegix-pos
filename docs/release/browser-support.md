# Browser support

El target real es el definido por Vite 8 y las APIs usadas, no versiones numéricas inventadas.


| Plataforma                       | Estado                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| Chromium moderno desktop/Android | Soportado; PWA, IndexedDB, offline, install y update probados.                     |
| Firefox moderno desktop          | Soportado como web app; smoke obligatorio en CI Linux. Install PWA no es contrato. |
| Safari/WebKit moderno desktop    | Soportado como web app; smoke de producción probado.                               |
| iOS/iPadOS Safari moderno        | Web app con instalación manual y límites del sistema sobre storage/caches.         |


Playwright usa los navegadores fijados por `@playwright/test 1.62.1`; CI instala Chromium, Firefox y
WebKit desde lockfile. En este Windows headless, Firefox 1538 falla antes de crear una página por
`RenderCompositorSWGL`; no es un error cargado por Bodegix. CI Linux conserva la cobertura Firefox.

Requisitos: IndexedDB, Web Crypto, Service Worker y módulos ES. Service Worker/installación requieren
HTTPS salvo localhost. File System Access es mejora progresiva: backup/restore conserva fallback.