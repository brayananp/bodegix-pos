import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getSaleVoidEligibility } from "../../application";

/**
 * Hook para verificar si una venta puede ser anulada.
 *
 * @param saleId - ID de la venta
 * @returns Información de elegibilidad o undefined durante carga, null si no existe
 */
export function useSaleVoidEligibility(saleId: string | null) {
	const database = useMemo(() => getLocalDatabase(), []);

	return useLiveQuery(() => {
		if (!saleId) return null;
		return getSaleVoidEligibility(database, saleId);
	}, [saleId]);
}
