import { useLiveQuery } from "dexie-react-hooks";
import type { SaleProductListItem } from "../../application";
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

/** Carga los productos del carrito en lote para nombres/stock. */
export function useSaleProductsForCart(ids: string[]): LiveState<SaleProductListItem[]> {
	const key = ids.slice().sort().join(",");
	return safely(
		useLiveQuery(
			() =>
				run(() =>
					ids.length === 0
						? Promise.resolve([] as SaleProductListItem[])
						: getSaleProductQueries().getProductsByIds(ids),
				),
			[key],
		),
	);
}
