import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getSaleHistoryQueries } from "../../infrastructure";

export function useSaleVoidEligibility(saleId: string | null) {
	const queries = useMemo(() => getSaleHistoryQueries(), []);
	return useLiveQuery(
		() =>
			saleId
				? queries.getSaleVoidEligibility(saleId)
				: Promise.resolve({ eligible: false as const, reason: "SALE_NOT_FOUND" as const }),
		[saleId],
	);
}
