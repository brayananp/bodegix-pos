import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { getSaleHistoryQueries } from "../../infrastructure";

export function useSalesCount() {
	const queries = useMemo(() => getSaleHistoryQueries(), []);
	return useLiveQuery(() => queries.countSales(), []);
}
