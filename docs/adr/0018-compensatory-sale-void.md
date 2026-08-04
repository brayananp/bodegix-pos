# ADR 0018: Anulación compensatoria de ventas

**Estado:** Aceptado  
**Fecha:** Enero 2025  
**Contexto:** Fase 6 — Historial y anulación de ventas

## Contexto

El MVP requiere la capacidad de anular ventas que fueron registradas por error. Esta necesidad surge de:

1. **Errores operacionales**: Cliente devuelve producto inmediatamente, error de cantidad, error de precio, venta a cliente equivocado
2. **Requisitos contables**: Mantener auditoría completa de todas las operaciones
3. **Cumplimiento fiscal**: No eliminar físicamente transacciones que ya fueron registradas
4. **Integridad de inventario**: Devolver stock al inventario cuando se anula una venta
5. **Trazabilidad**: Saber quién anuló, cuándo y por qué

Se evaluaron dos enfoques principales:

### Opción A: Eliminación física (hard delete)

Eliminar completamente el registro de la venta y todos sus registros relacionados.

**Ventajas:**
- Base de datos más pequeña
- No hay registros "basura"
- Implementación más simple

**Desventajas:**
- ❌ Pérdida total de auditoría
- ❌ No cumple requisitos contables (no se pueden borrar transacciones)
- ❌ No hay trazabilidad del error
- ❌ Riesgo de integridad referencial si hay datos relacionados
- ❌ No se puede reconstruir qué pasó
- ❌ Problemas de cumplimiento fiscal

### Opción B: Anulación compensatoria (soft delete)

Marcar la venta como anulada sin eliminar los datos originales, registrando motivo y timestamp.

**Ventajas:**
- ✅ Auditoría completa preservada
- ✅ Cumplimiento contable y fiscal
- ✅ Trazabilidad: motivo, timestamp, datos originales
- ✅ Posibilidad de análisis posteriores
- ✅ Reversible desde base de datos si es necesario
- ✅ Mantiene integridad referencial

**Desventajas:**
- Registros nunca se eliminan (crecimiento de base de datos)
- Queries deben filtrar por estado
- Complejidad adicional en reportes

## Decisión

**Se implementa anulación compensatoria (Opción B)** con las siguientes características:

### Marcadores de anulación

**En `SaleRecord`:**
```typescript
voidedAt: number | null      // Timestamp de anulación
voidReason: string | null    // Motivo obligatorio (5-240 chars)
status: "voided"             // Estado de la venta
```

**En `SalePaymentRecord`:**
```typescript
voidedAt: number | null             // Timestamp de anulación
voidOperationReference: string | null  // Referencia a la operación
status: "voided"                    // Estado del pago
```

### Reglas de negocio estrictas

**Una venta puede anularse SOLO si:**
1. Estado es `"completed"` (no draft, no ya anulada)
2. `voidedAt` es `null` (no anulada previamente)
3. Pertenece a la sesión de caja actual
4. La sesión de caja está en estado `"open"`

**NO se puede anular si:**
- La sesión de caja ya está cerrada
- La venta pertenece a otra sesión
- La venta ya fue anulada
- No existe sesión de caja abierta

### Transacción ACID

La anulación coordina 4 tablas atómicamente:

1. **sales**: `status→voided`, `voidedAt`, `voidReason`
2. **salePayments**: Todos `status→voided`, `voidedAt`
3. **inventory**: `+stockQuantity`, operación `void_sale_return`
4. **cashOperations**: `withdrawal_void_sale` para pagos en efectivo

Cualquier fallo produce rollback completo.

### Restricción temporal crítica

**Solo durante sesión actual abierta.**

Razones:
- Control de caja: el efectivo devuelto debe salir de la sesión actual
- Responsabilidad: quien anuló está presente y puede explicar
- Cierre de sesión como "cierre de libros" del día
- Prevención de anulaciones fraudulentas posteriores

**Fase futura:** Anulaciones con autorización especial después de cerrar sesión.

## Consecuencias

### Positivas

✅ **Auditoría completa**
- Todos los datos originales se preservan
- Se sabe exactamente qué se vendió y por qué se anuló
- Análisis histórico posible

✅ **Cumplimiento contable**
- No se borran transacciones
- Trazabilidad completa
- Motivo documentado obligatoriamente

✅ **Trazabilidad fiscal**
- Compatible con requisitos de SUNAT (futuro)
- Historial inmutable de operaciones
- Correlativo de ventas nunca tiene huecos

✅ **Integridad de inventario**
- Stock se restaura automáticamente
- Operaciones de inventario rastreables
- Balance de inventario correcto

✅ **Integridad de caja**
- Efectivo devuelto registrado como retiro
- Balance de caja correcto
- Cierre de sesión con datos exactos

### Negativas

⚠️ **Crecimiento de base de datos**
- Ventas anuladas nunca se eliminan
- En un año con 10% de anulaciones, 10% más de registros
- Mitigación: Es crecimiento lineal, no exponencial
- Mitigación futura: Archivo de ventas antiguas

⚠️ **Complejidad en queries**
- Filtros deben excluir ventas anuladas cuando corresponda
- Reportes deben distinguir ventas activas vs anuladas
- Mitigación: Índice en `voidedAt` para filtrado eficiente
- Mitigación: Funciones helper encapsulan filtrado

⚠️ **No permite anulaciones posteriores**
- Solo durante sesión actual abierta
- Errores detectados días después requieren otro proceso
- Mitigación: Es intencional para control de caja
- Fase futura: Proceso de anulación con autorización

### Impacto en el sistema

**Schema:**
- Versión 5 con campos de anulación
- Migración sin transformación de datos
- Compatible con ventas v4 existentes

**Queries:**
```typescript
// Ventas activas (por defecto)
.where('voidedAt').equals(null)

// Ventas anuladas
.where('status').equals('voided')

// Todas las ventas
.toArray() // sin filtro
```

**Reportes:**
- Ventas completadas: `status === 'completed' && voidedAt === null`
- Ventas anuladas: `status === 'voided'`
- Total real: solo ventas completadas
- Análisis de errores: ventas anuladas agrupadas por motivo

**UI:**
- Historial muestra ambas con indicador visual claro
- Filtro explícito por estado
- Detalle muestra motivo de anulación
- Badge rojo para ventas anuladas

## Alternativas consideradas y rechazadas

### Transacción negativa

Crear una "venta negativa" con items y pagos negativos.

**Rechazada porque:**
- Complejidad innecesaria en queries (sumar positivos y negativos)
- Duplicación de datos (productos, referencias)
- Confunde el concepto de venta
- Correlativo duplicado o artificial
- No es el estándar contable

### Tabla de anulaciones separada

Tabla `voidedSales` con referencia a `sales`.

**Rechazada porque:**
- Requiere JOIN adicional siempre
- Información de anulación está fragmentada
- Complejidad en integridad referencial
- No ofrece ventajas reales sobre campos inline

### Eliminación con respaldo

Eliminar de `sales` pero copiar a `deletedSales`.

**Rechazada porque:**
- Dos fuentes de verdad diferentes
- Queries complejas en dos tablas
- Diagnóstico debe revisar ambas tablas
- No resuelve problema de cumplimiento

## Referencias

- [ADR 0016: Cash Session Integrity](./0016-cash-session-integrity.md) — Sesión como unidad de cierre
- [ADR 0015: Inventory Hybrid Model](./0015-inventory-hybrid-model.md) — Movimientos de inventario
- [ADR 0017: Sale Draft Persistence](./0017-sale-draft-persistence.md) — Persistencia de carrito
- [docs/database-schema-v5.md](../database-schema-v5.md) — Esquema completo
- [docs/PHASE-6-SUMMARY.md](../PHASE-6-SUMMARY.md) — Resumen de implementación
- [docs/use-cases/sales-use-cases.md](../use-cases/sales-use-cases.md) — Caso de uso `voidSale()`

## Notas de implementación

### Validación pre-transacción

Verificar elegibilidad ANTES de iniciar transacción:
```typescript
const eligibility = await getSaleVoidEligibility(saleId);
if (!eligibility.canVoid) {
  throw new Error(eligibility.reason);
}
```

### Orden de operaciones en transacción

1. Validar sale existe y está completed
2. Actualizar sale (voided)
3. Actualizar payments (voided)
4. Incrementar inventory
5. Crear inventory operations
6. Crear cash operation (si efectivo)

Este orden minimiza riesgo de estado inconsistente en rollback.

### Índices necesarios

```typescript
// Para filtrar ventas activas eficientemente
.where('voidedAt').equals(null)

// Para filtrar ventas anuladas
.where('status').equals('voided')

// Para buscar por sesión
.where('sessionId').equals(sessionId)
```

### Testing crítico

- ✅ Transacción ACID completa
- ✅ Rollback en cada punto de fallo
- ✅ Prevención de doble anulación
- ✅ Validación de sesión actual
- ✅ Restauración correcta de stock
- ✅ Registro correcto en caja

## Revisión futura

**Fase 7+:**
- Considerar anulaciones con autorización posterior al cierre
- Evaluar archivo de ventas antiguas (> 1 año)
- Implementar notas de crédito para anulaciones parciales
- Agregar campo `voidedByUserId` cuando haya multiusuario

**Mantener:**
- Anulación compensatoria como método principal
- Auditoría completa siempre
- Motivo obligatorio
- Trazabilidad completa
