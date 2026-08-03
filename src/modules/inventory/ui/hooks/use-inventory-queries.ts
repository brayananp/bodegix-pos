import { getCatalogQueries } from "@/modules/catalog";
import { useLiveQuery } from "dexie-react-hooks";
import type { ListInventoryMovementsQuery, SearchInventoryQuery } from "../../application";
import { getInventoryQueries } from "../../infrastructure";

export function useInventory(query: SearchInventoryQuery) {
	return useLiveQuery(
		() => getInventoryQueries().searchInventory(query),
		[
			query.search,
			query.categoryId,
			query.productStatus,
			query.stockStatus,
			query.page,
			query.pageSize,
			query.sort,
		],
	);
}

export function useInventoryProduct(productId: string | null) {
	return useLiveQuery(
		async () =>
			productId
				? ((await getInventoryQueries().getInventoryProduct(productId)) ?? null)
				: undefined,
		[productId],
	);
}

export function useInventoryMovements(query: ListInventoryMovementsQuery) {
	return useLiveQuery(
		() => getInventoryQueries().listInventoryMovements(query),
		[query.productId, query.movementType, query.page, query.pageSize],
	);
}

export function useProductInventoryMovements(productId: string | null) {
	return useLiveQuery(
		() =>
			productId
				? getInventoryQueries().listInventoryMovements({
						productId,
						movementType: "all",
						page: 1,
						pageSize: 25,
					})
				: undefined,
		[productId],
	);
}

export function useInventorySummary() {
	return useLiveQuery(() => getInventoryQueries().getInventorySummary(), []);
}

export function useInventoryCategories() {
	return useLiveQuery(() => getCatalogQueries().listCategories({ status: "all" }), []);
}
