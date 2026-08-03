import { useLiveQuery } from "dexie-react-hooks";
import type { ListCategoriesQuery, SearchProductsQuery } from "../../application";
import { getCatalogQueries } from "../../infrastructure";

export function useProducts(query: SearchProductsQuery) {
	return useLiveQuery(
		() => getCatalogQueries().searchProducts(query),
		[query.search, query.categoryId, query.status, query.page, query.pageSize, query.sort],
	);
}

export function useProduct(productId: string | null) {
	return useLiveQuery(
		async () =>
			productId ? ((await getCatalogQueries().getProductById(productId)) ?? null) : undefined,
		[productId],
	);
}

export function useCategories(query: ListCategoriesQuery = {}) {
	return useLiveQuery(
		() => getCatalogQueries().listCategories(query),
		[query.search ?? "", query.status ?? "all"],
	);
}

export function useCategory(categoryId: string | null) {
	return useLiveQuery(
		async () =>
			categoryId ? ((await getCatalogQueries().getCategoryById(categoryId)) ?? null) : undefined,
		[categoryId],
	);
}
