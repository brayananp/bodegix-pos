/**
 * Módulo: catalog
 *
 * Responsabilidad: productos y categorías.
 * - Ciclo de vida activo/inactivo de productos
 * - Búsqueda por nombre, SKU, categoría
 * - Precios de venta en céntimos (MoneyCents)
 *
 * Todo código interno de este módulo debe importarse exclusivamente
 * desde esta API pública. Nunca importes rutas internas directamente.
 *
 * @module catalog
 */

export const CATALOG_MODULE = "catalog" as const;

export type CatalogModuleId = typeof CATALOG_MODULE;
