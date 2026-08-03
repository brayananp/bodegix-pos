import { useLiveQuery } from "dexie-react-hooks";
import type { SaleDraftReview } from "../../application";
import { reviewSaleDraft } from "../../application";
import { getSaleDraftStore, getSaleProductQueries } from "../../infrastructure";

interface LiveState<T> {
	data: T | undefined;
	error: Error | null;
	isLoading: boolean;
}

async function run<T>(query: () => Promise<T>): Promise<{ data?: T; error: Error | null }> {
	try {
		return { data: await query(), error: null };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error("Error de revisión") };
	}
}

function safely<T>(result: { data?: T; error: Error | null } | undefined): LiveState<T> {
	return {
		data: result?.data,
		error: result?.error ?? null,
		isLoading: result === undefined,
	};
}

export function useSaleDraftReview() {
	return safely(
		useLiveQuery(
			() =>
				run(async (): Promise<SaleDraftReview> => {
					const draft = await getSaleDraftStore().get();
					if (!draft || draft.items.length === 0) {
						return { valid: true, issues: [] };
					}
					const ids = draft.items.map((i) => i.productId);
					const products = await getSaleProductQueries().getProductsByIds(ids);
					const productMap = new Map(products.map((p) => [p.id, p]));
					return reviewSaleDraft(draft, productMap);
				}),
			[],
		),
	);
}
