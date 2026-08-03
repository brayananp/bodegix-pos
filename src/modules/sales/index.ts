/**
 * Módulo: sales
 *
 * Responsabilidad: carrito, ventas, ítems, pagos.
 *
 * La transacción completeSale es atómica y coordina:
 * - validación de caja abierta
 * - creación de Sale + SaleItem[] + SalePayment[]
 * - descuento de stock + InventoryMovement[] por producto
 * - incremento de nextSaleNumber
 * - limpieza del borrador
 *
 * El módulo cash puede leer las tablas sales/salePayments
 * desde su propio adaptador sin depender de esta API.
 *
 * @module sales
 */

export const SALES_MODULE = "sales" as const;
export type SalesModuleId = typeof SALES_MODULE;

export * from "./application";
export * from "./domain";
export * from "./infrastructure";
export * from "./ui";
