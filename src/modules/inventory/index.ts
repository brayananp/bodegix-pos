/**
 * Módulo: inventory
 *
 * Responsabilidad: stock actual y movimientos de inventario.
 * - Stock por producto (stockQuantity)
 * - Ledger inmutable de movimientos manuales
 * - Alertas de stock bajo
 *
 * En la Fase 3 no coordina ventas ni caja. Los tipos reservados para ventas
 * permanecen en el modelo persistente, pero no son operaciones públicas.
 *
 * @module inventory
 */

export const INVENTORY_MODULE = "inventory" as const;

export type InventoryModuleId = typeof INVENTORY_MODULE;

export * from "./application";
export * from "./domain";
export * from "./infrastructure";
export * from "./ui";
