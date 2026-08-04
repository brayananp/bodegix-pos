import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import type { PaginationOptions, SaleHistorySummary, SaleSearchFilters } from "../../application";
import { getSaleHistoryQueries } from "../../infrastructure";

/**
 * Hook para buscar ventas con filtros y paginación.
 *
 * @param filters - Filtros de búsqueda
 * @param pagination - Opciones de paginación
 * @returns Resultado paginado con ventas o undefined durante carga
 */
export function useSaleHistory(filters: SaleSearchFilters, pagination: PaginationOptions) {
	const queries = useMemo(() => getSaleHistoryQueries(), []);

	return useLiveQuery(
		() => queries.searchSales(filters, pagination),
		[
			filters.searchText,
			filters.status,
			filters.paymentMethod,
			filters.cashSessionId,
			filters.fromDate,
			filters.toDate,
			pagination.page,
			pagination.pageSize,
		],
	);
}

/**
 * Resultado de la query de historial formateado para UI.
 */
export interface SaleHistoryItem extends SaleHistorySummary {
	/** Formateado de fecha legible */
	readonly createdAtFormatted: string;
	/** Formateado de total con moneda */
	readonly totalFormatted: string;
	/** Badge de estado */
	readonly statusLabel: string;
	/** Métodos de pago como string separado por comas */
	readonly methodsLabel: string;
}
