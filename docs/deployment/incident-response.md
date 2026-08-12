# Incident response

| Escenario | Síntoma/diagnóstico | Acción segura | Política |
| --- | --- | --- | --- |
| Deployment roto | Shell/status fallan; inspeccionar URL/commit | Congelar promoción, smoke artifact previo | Rollback si compatible |
| Asset 404 | JS/CSS 404 o MIME HTML | Revisar hash y filesystem-before-fallback | Rollback o forward-fix |
| Service Worker | No controla/offline falla | Revisar scope, `sw.js`, Cache Storage | No unregister automático |
| CSP incorrecta | Console bloquea recurso propio | Comparar header real/config | Forward-fix; rollback si DB permite |
| Update loop | waiting/active recarga repetida | Posponer update, conservar estados/evidencia | Promover artifact seguro |
| Migración DB | Error al abrir schema nuevo | Leer impacto/matriz; no downgrade | `forward_only` → forward-fix |
| Backup/restore | Validación/hash/compatibilidad falla | Detener restore; conservar archivo y datos actuales | No recuperar remotamente |

Registrar hora, URL, versión/commit, alcance y evidencia sin datos comerciales. Bodegix no guarda copia
remota: pérdida de IndexedDB solo puede recuperarse desde backup válido custodiado por usuario.
