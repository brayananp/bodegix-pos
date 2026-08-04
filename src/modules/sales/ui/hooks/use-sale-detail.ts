import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getSaleHistoryQueries } from "../../infrastructure";

/**
 * Hook para obtener el detalle completo de una venta.
 *
 * @param saleId - ID de la venta
 * @returns Detalle de la venta o undefined durante carga, null si no existe
 */
export function useSaleDetail(saleId: string | null) {
	const queries = useMemo(() => getSaleHistoryQueries(), []);

	return useLiveQuery(() => {
		if (!saleId) return null;
		return queries.getSaleDetail(saleId);
	}, [saleId]);
}
