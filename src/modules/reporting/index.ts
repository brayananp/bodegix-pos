/**
 * Módulo: reporting
 *
 * Responsabilidad: consultas y proyecciones para resúmenes.
 * - Resumen diario de ventas
 * - Top productos vendidos
 * - Alertas de stock bajo
 * - Historial de caja
 *
 * Este módulo es solo de lectura. No tiene dominio propio
 * con invariantes de negocio. Sus casos de uso son query services.
 *
 * @module reporting
 */

export const REPORTING_MODULE = "reporting" as const;

export type ReportingModuleId = typeof REPORTING_MODULE;

export * from "./application";
export * from "./infrastructure";
export * from "./model";
export * from "./ui";
