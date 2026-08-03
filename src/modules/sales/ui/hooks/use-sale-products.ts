import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { useLiveQuery } from "dexie-react-hooks";
import type { SearchSaleProductsQuery } from "../../application";
import { getSaleProductQueries } from "../../infrastructure";

interface LiveState<T> {
	data: T | undefined;
	error: Error | null;
	isLoading: boolean;
}

async function run<T>(query: () => Promise<T>): Promise<{ data?: T; error: Error | null }> {
	try {
		return { data: await query(), error: null };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error("Error de lectura local") };
	}
}

function safely<T>(result: { data?: T; error: Error | null } | undefined): LiveState<T> {
	return {
		data: result?.data,
		error: result?.error ?? null,
		isLoading: result === undefined,
	};
}

export function useSaleProducts(query: SearchSaleProductsQuery) {
	return safely(
		useLiveQuery(
			() => run(() => getSaleProductQueries().searchProducts(query)),
			[query.search, query.categoryId, query.page, query.pageSize],
		),
	);
}

export function useSaleCategories() {
	return safely(
		useLiveQuery(
			() =>
				run(async () => {
					const database = getLocalDatabase();
					const all = await database.categories.toArray();
					return all
						.filter((c) => c.isActive)
						.sort((a, b) => a.name.localeCompare(b.name, "es"))
						.map((c) => ({ id: c.id, name: c.name }));
				}),
			[],
		),
	);
}
