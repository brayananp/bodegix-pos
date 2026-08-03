import { useLiveQuery } from "dexie-react-hooks";
import { getSaleResultQueries } from "../../infrastructure";

interface LiveState<T> {
	data: T | undefined;
	error: Error | null;
	isLoading: boolean;
}

async function run<T>(query: () => Promise<T>): Promise<{ data?: T; error: Error | null }> {
	try {
		return { data: await query(), error: null };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error("Error de lectura") };
	}
}

function safely<T>(result: { data?: T; error: Error | null } | undefined): LiveState<T> {
	return {
		data: result?.data,
		error: result?.error ?? null,
		isLoading: result === undefined,
	};
}

export function useSaleResult(saleId: string | null) {
	const keyed = useLiveQuery(
		async () => ({
			saleId,
			result: await run(() =>
				saleId ? getSaleResultQueries().getSaleResult(saleId) : Promise.resolve(null),
			),
		}),
		[saleId],
	);
	if (!keyed || keyed.saleId !== saleId) {
		return { data: undefined, error: null, isLoading: true };
	}
	return safely(keyed.result);
}
