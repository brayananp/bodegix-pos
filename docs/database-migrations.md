# Política de migraciones de la base local

## Reglas

1. Cada versión vive en `schema/schema-vN.ts` y se registra en orden desde el constructor.
2. Una versión publicada no se modifica ni se reutiliza.
3. Un cambio de stores o datos crea `schema-v2.ts`, aun si parece pequeño.
4. Los handlers `upgrade()` históricos se conservan para instalaciones antiguas.
5. Toda migración incluye pruebas desde una fixture de la versión anterior y prueba de reapertura.
6. No se usa modo dinámico, no se borra la base al fallar y `delete()` no es recuperación normal.

La v1 es la primera versión publicada. La v2 de Fase 3 conserva todas las tablas/registros y añade
dos índices compuestos a `inventoryMovements`; Dexie reconstruye índices al abrir sin necesitar un
callback `upgrade()`. La v3 de Fase 4 incorpora campos nullable de snapshot a `cashSessions` con un
`upgrade()` explícito: los registros previos reciben `null` sin alterar su cuadre. Las pruebas abren
bases reales de versiones anteriores y comprueban conservación, migración y reapertura.

## Procedimiento futuro

Antes de liberar una migración:

1. Congelar y conservar el archivo de la versión anterior.
2. Añadir el nuevo mapa de stores y, solo si hace falta, un `upgrade()` transaccional.
3. Validar datos antes y después sin APIs externas, `fetch`, temporizadores ni diálogos dentro de la
   transacción.
4. Probar éxito, rollback ante error, datos existentes y base vacía.
5. Ejecutar `pnpm check:full` y documentar compatibilidad y recuperación manual.

Según Dexie, un error no capturado aborta la transacción. Capturar un error dentro de la
transacción equivale a manejarlo; si debe abortar, se relanza.

Referencia: [Dexie Version.upgrade()](https://dexie.org/docs/Version/Version.upgrade%28%29).

## Migraciones v5 y v6

V5 transforma pagos existentes para inicializar ambos campos de anulación en `null`. V6 agrega el
índice `sales.totalCents` sin reescribir datos. Nunca se modifica una versión publicada; ambas se
registran en orden y se prueban desde bases legacy aisladas.

## Migración v7

V7 agrega los índices `sales.voidedAt` y `sales.[status+voidedAt]` para el resumen diario. No crea
tablas, no transforma registros y conserva ventas anuladas de v6; una fixture real verifica la
migración.
