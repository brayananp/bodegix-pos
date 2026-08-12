# Rollback

| Impacto DB | Política |
| --- | --- |
| `none` | Promover deployment anterior probado + smoke |
| `backward_compatible` | Solo rollback demostrado con prueba A → B → A |
| `forward_only` | Rollback prohibido; forward-fix |

Frontend rollback no revierte Dexie. Nunca downgrade, borrado IndexedDB o `registration.unregister()`.
Verificar matriz, release.json y estados SW old/waiting/active. Redeploy de artifact retenido; no rebuild
silencioso desde branch vieja. Detalle: [rollback-and-incidents.md](../release/rollback-and-incidents.md).
