# Mantenimiento entre pestañas

El nombre estable de lock y canal es `bodegix-database-maintenance`. Catálogo, inventario, caja,
ventas, anulaciones, borrador y configuración envuelven sus transacciones con un Web Lock
`shared`. Restore pide `exclusive`, por lo que espera escrituras ya iniciadas y evita nuevas
escrituras hasta finalizar.

BroadcastChannel anuncia `maintenance-starting`, recibe ACK `maintenance-ready` y termina con
`maintenance-completed` o `maintenance-failed`. Otras pestañas mantienen sus formularios montados,
bloquean nuevas escrituras y muestran la pantalla de mantenimiento; al finalizar vuelven a estado
idle y las consultas Dexie reactivas se actualizan.

Sin Web Locks se sondean peers mediante el canal y la restauración se bloquea si existen otras
pestañas. Sin BroadcastChannel pero con Web Locks se conserva exclusión, aunque no hay aviso visual
remoto. Sin ambas APIs solo se puede proteger la pestaña actual; la UI documenta que la plataforma
no permite prometer exclusión perfecta.
