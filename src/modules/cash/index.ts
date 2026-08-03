/**
 * Módulo: cash
 *
 * Responsabilidad: sesiones de caja, depósitos, retiros y cierre.
 * - Apertura de caja con fondo inicial
 * - Registro de depósitos y retiros durante la jornada
 * - Cierre de caja: cálculo de efectivo esperado vs real
 * - Una sola sesión de caja activa a la vez
 *
 * @module cash
 */

export const CASH_MODULE = "cash" as const;

export type CashModuleId = typeof CASH_MODULE;

export * from "./application";
export * from "./domain";
export * from "./infrastructure";
export * from "./ui";
