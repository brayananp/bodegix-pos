/**
 * Módulo: sales
 *
 * Responsabilidad: ventas, ítems, pagos y anulaciones.
 *
 * Los pagos pertenecen a este módulo en el MVP.
 * No existe un módulo "payments" separado.
 *
 * La transacción completeSale es atómica y coordina:
 * - validación de caja
 * - creación de sale + saleItems + salePayments
 * - descuento de stock (genera InventoryMovement en un mismo tx)
 *
 * @module sales
 */

export const SALES_MODULE = "sales" as const;

export type SalesModuleId = typeof SALES_MODULE;
