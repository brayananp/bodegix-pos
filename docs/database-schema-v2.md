# Esquema de base local v2

Estado: vigente desde Fase 3. La v1 permanece documentada e inmutable.

V2 conserva las nueve tablas y todos los registros. El único cambio estructural está en
`inventoryMovements`:

```text
id, productId, type, referenceType, referenceId, createdAt,
[productId+createdAt], [referenceType+referenceId],
[type+createdAt], [productId+type+createdAt]
```

`[type+createdAt]` sirve al historial global filtrado. `[productId+type+createdAt]` sirve al
historial de un producto filtrado. Los rangos se recorren en orden inverso para mostrar lo más
reciente primero y aplicar `offset/limit` después del índice.

No existe transformación `upgrade()`: los campos ya estaban persistidos. La migración probada
verifica que categorías, productos y movimientos v1 siguen disponibles y que los índices nuevos
pueden consultarse tras abrir con `BodegixDatabase`.
