# Módulo `inventory`

Vertical slice responsable del saldo materializado de cada producto y de su ledger inmutable.
El catálogo crea productos con stock cero y conserva el saldo al editar; solamente inventario lo
modifica después de la creación.

## Modelo

```text
Product.stockQuantity (consulta rápida)
+ InventoryMovement[] (trazabilidad)
```

No es event sourcing: el listado lee el saldo desde `products`, no reconstruye el estado plegando
todo el historial. Cada escritura modifica `products.stockQuantity` e inserta exactamente un
movimiento dentro de la misma transacción Dexie. Un conteo sin diferencia no escribe nada.

## Operaciones públicas

- `initializeProductStock`: una vez, desde cero y con cantidad positiva.
- `registerStockEntry`: entrada manual `purchase`; no crea compras ni proveedores.
- `reconcileProductStock`: deriva `adjustment_in` o `adjustment_out` desde la cantidad contada.
- `registerStockLoss`: registra `damaged`, `expired` u otra pérdida como `adjustment_out`.
- `InventoryQueries`: listado, detalle, resumen e historial global o por producto.

Las cantidades son enteras, el saldo nunca puede ser negativo y los movimientos confirmados no
se editan ni se eliminan. `Product.updatedAt` cambia con toda modificación persistida, incluido el
stock.

## Dependencias

El dominio es puro. Aplicación declara comandos y los puertos orientados a unidad de trabajo y
consultas. Infraestructura adapta Dexie. UI usa los contratos públicos y `useLiveQuery` únicamente
para lecturas. El módulo no importa archivos privados de `catalog`.

Los tipos `sale` y `sale_void` se conservan en el modelo persistido para evolución futura, pero no
existe ningún comando ni control de interfaz que los genere en la Fase 3.
