/**
 * Módulo: inventory
 *
 * Responsabilidad: stock actual y movimientos de inventario.
 * - Stock por producto (stockQuantity)
 * - Ledger de movimientos: entradas, salidas, ajustes
 * - Alertas de stock bajo
 *
 * Los movimientos de salida son generados por `sales` al completar una venta.
 * Este módulo no tiene autoridad sobre las ventas.
 *
 * @module inventory
 */

export const INVENTORY_MODULE = "inventory" as const;

export type InventoryModuleId = typeof INVENTORY_MODULE;
