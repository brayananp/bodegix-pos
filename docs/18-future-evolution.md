# 18. Evolución futura y preparación

## Propósito

Documentar cómo la arquitectura actual del MVP preserva opciones para crecer SIN reescribir todo. Cada camino evolutivo respeta los límites modulares y puertos existentes.

---

## 1. Camino A: Respaldo en nube (más cercano)

### Cuándo
Después del piloto, cuando se pruebe la pérdida de datos por limpieza de navegador o cambio de dispositivo.

### Ruta evolutiva
```text
┌────────────────────┐
│ Bodegix POS PWA    │
│  modules/backup    │
└─────────┬──────────┘
          │
          ├─ Puerto: BackupRemoteSender (NUEVO)
          │   send(backup: SerializedBackup): Promise<SavedRef>
          │
          ├─ Adaptador 1 (dev/test): MockRemoteSender
          └─ Adaptador 2 (prod): CloudStorageAdapter
                                  └─ HTTPS POST a /v1/backups → API
                                                          │
                                                          ▼
                                            Almacenamiento objeto (S3, R2, etc.)
```

### Qué NO cambia del MVP
- Dominio y casos de uso `exportBackup()` / `restoreBackup()`.
- Formato `bodegix-pos-backup` (checksum + schema) → lo que se sube a la nube es el mismo formato que hoy se descarga.
- Rutas y UI (solo se añade un botón "Subir copia a la nube" y "Restaurar desde la nube" autenticada).

### Qué SÍ cambia
- Nuevo archivo: `modules/backup/application/send-backup-to-cloud.port.ts`
- Nuevo adaptador: `modules/backup/infrastructure/cloud-storage-adapter.ts`
- Ajustes: `settings.cloudEndpoint`, `settings.cloudApiKey` (no en MVP)

---

## 2. Camino B: Sincronización offline → nube

### Cuándo
Cuando haya multidispositivo o backup automático periódico ya no sea suficiente.

### Ruta evolutiva
```text
PWA
 ├─ Dexie (sigue siendo la misma base local)
 ├─ NUEVA tabla infraestructura: `outbox_events` (solo en cliente sync)
 ├─ NUEVO adaptador: `modules/sync/infrastructure/dexie-sync-adapter.ts`
 └─ Periodicamente:
      lee outbox  ──► API REST /sync/batch  ──► PostgreSQL
      aplica inbou←── recibe inbound batch  ──┘
```

### Preparación que hoy ya existe en el MVP
- UUIDs globales via `crypto.randomUUID()` → sin colisiones entre dispositivos.
- `createdAt` / `updatedAt` por entidad → resolución de conflictos simple (LWW o por regla de dominio).
- Registros inmutables: ventas completadas, pagos, movimientos de inventario → sin merges complejos.
- Anulaciones explícitas + voided en lugar de borrar → conflictos más fáciles.
- Esquema versionado en Dexie + migraciones.

### Qué NO agregamos HOY (ADR)
- `tenantId`
- `branchId`
- `userId`
- `deviceId`
- `syncStatus`
- `serverVersion`
- `deletedAt`

Se agregan en los modelos CUANDO exista un backend real que los use. El MVP no los necesita.

---

## 3. Camino C: Backend modular (cuando aparezca)

### Cuándo
Cuando aparezca una combinación de:
- autenticación / multiusuario
- sincronización multi-dispositivo
- integraciones pasarelas / SUNAT que no pueden vivir en cliente
- analítica agregada

### Arquitectura backend sugerida
**Monolito modular**, NO microservicios (ref: ADR-0012).

```text
Backend TypeScript (Node/Bun/Workers)
├── modules/
│   ├── catalog/      ← mismo dominio del cliente, mismos casos de uso
│   ├── inventory/
│   ├── sales/
│   ├── cash/
│   ├── reporting/
│   ├── backup/
│   ├── sync/         (NUEVO — no existe en cliente)
│   └── auth/         (NUEVO — no existe en cliente)
├── shared/kernel/    ← misma idea de shared/kernel
└── infrastructure/
    └── persistence/  PostgreSQL + Drizzle (adaptador)
```

### Mismos límites = mínima fricción
- Los casos de uso `completeSale`/`voidSale` en backend llaman al mismo dominio, misma lógica transaccional, distinto adaptador (PostgreSQL vs Dexie).
- Regla: si un puerto existe en el cliente y aplica en backend, se reutiliza la firma en ambos lados.

---

## 4. Camino D: Extracción de módulo `payments` independiente

### Cuándo
Se activa si TODAS estas condiciones se cumplen:
- Existe integración automática con ≥1 pasarela (Yape API, Plin API, POS integrable).
- Hay webhooks de confirmación / rechazo / reversa.
- Existen conciliaciones automáticas con banco / POS.
- Existen credenciales por comercio (tenant).
- Reembolsos / devoluciones automáticas.

### Antes (MVP):
```text
modules/sales/domain/sale-payment.ts   ← pagos viven aquí
modules/sales/infrastructure/...       ← confirmación manual
```

### Después:
```text
modules/sales/                         ─── importa payments API pública
modules/payments/                      ─── NUEVO
  ├── domain/
  │   ├── external-payment.port.ts     ← puerto ExternalPaymentGateway
  │   ├── conciliation.ts
  │   └── refund.ts
  ├── application/
  │   ├── create-payment-intent.ts
  │   ├── handle-webhook.ts
  │   ├── start-refund.ts
  │   └── daily-conciliation.ts
  └── infrastructure/
      ├── yape-qr-adapter.ts
      ├── plin-qr-adapter.ts
      ├── pos-integrated-adapter.ts
      └── webhook-handler-router.ts
```

En el MVP no hay frontera real. No se extrae.

---

## 5. Camino E: Microservicios

### Cuándo
**Sólo** si ADR-0012 se revoca y hay justificación OPERATIVA demostrable con al menos una de:
- Escalas muy distintas entre reportes y caja (10x diferencia)
- Equipos completamente independientes con releases desacopladas
- SLOs heterogéneos
- Heterogeneidad tecnológica obligatoria

### Anticipo = hoy hacemos NADA
- No diseñamos APIs inter-servicio.
- No sacamos `catalog` en un repositorio separado.
- No rompemos la base de datos local.

---

## 6. Camino F: Facturación electrónica SUNAT

### Preparación en el MVP
- **Snapshots inmutables** de ítems (`productName`, `unitPriceCents`, `unitCostCents`): SUNAT requiere datos históricos exactos de cada transacción, no los actuales del producto.
- Pago por método separado, trazable.
- UUID global por operación.
- Apertura/cierre de caja (turnos) = periodo de declaración.

### Cuando llegue
- Nuevo módulo `billing` con puerto `ElectronicInvoiceIssuer`.
- Adaptadores: SUNAT OSE, otras.
- Módulo `sales` llama vía API pública a `billing` después de `completeSale`.

---

## 7. Preparación para sincronización: check-list en el MVP

Se mantienen hoy ✓; no anticipan campos:

- [x] UUID global por registro
- [x] `createdAt`, `updatedAt` epoch ms UTC
- [x] Esquema versionado Dexie + upgrade scripts
- [x] Formato backup versionado + checksum
- [x] Registros históricos (no se borran ventas, pagos, movimientos)
- [x] Ventas completadas inmutables; anulación con motivo
- [x] Pagos separados de la venta y con estado propio
- [x] InventoryMovements ledger
- [x] Operaciones idempotentes donde corresponda (ej: `restoreBackup` no rompe si se llama 2x con mismo checksum)

## 8. Regla de oro de evolución

> Cada nueva capacidad se implementa primero con la estructura más simple posible dentro del monolito modular. Solo cuando una frontera se convierte en un cuello de botella operativo real —no teórico— se extrae. La extracción consume 5x-10x más tiempo que mantener un módulo limpio. Espera a la señal.
