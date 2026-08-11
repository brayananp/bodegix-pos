# Web App Manifest

| Campo | Valor |
| --- | --- |
| `name` | Bodegix POS |
| `short_name` | Bodegix |
| `description` | Punto de venta offline-first para bodegas. |
| `id` | `/` |
| `start_url` | `/sale` |
| `scope` | `/` |
| `display` | `standalone` |
| `orientation` | `any` |
| `theme_color` | `#16a34a` |
| `background_color` | `#ffffff` |

Incluye iconos PNG 192×192, 512×512 y maskable 512×512. Los shortcuts abren Venta (`/sale`),
Inventario (`/inventory`) y Caja (`/cash`). El manifest generado se sirve como
`application/manifest+json`; Apple usa además `apple-touch-icon.png`.
