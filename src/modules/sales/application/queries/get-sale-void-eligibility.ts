import type { SaleHistoryQueries } from "../ports";

export function getSaleVoidEligibility(queries: SaleHistoryQueries, saleId: string) {
	return queries.getSaleVoidEligibility(saleId);
}
