import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getSaleHistoryQueries } from "../../infrastructure";

export function useSaleVoidResult(saleId: string | null) {
	const queries = useMemo(() => getSaleHistoryQueries(), []);
	return useLiveQuery(
		() => (saleId ? queries.getSaleVoidResult(saleId) : Promise.resolve(null)),
		[saleId],
	);
}
