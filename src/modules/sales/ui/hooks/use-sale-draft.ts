import { useLiveQuery } from "dexie-react-hooks";
import { getSaleDraftStore } from "../../infrastructure";

interface LiveState<T> {
	data: T | undefined;
	error: Error | null;
	isLoading: boolean;
}

function safely<T>(result: { data?: T; error: Error | null } | undefined): LiveState<T> {
	return {
		data: result?.data,
		error: result?.error ?? null,
		isLoading: result === undefined,
	};
}

async function run<T>(query: () => Promise<T>): Promise<{ data?: T; error: Error | null }> {
	try {
		return { data: await query(), error: null };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error("Error de lectura local") };
	}
}

export function useSaleDraft() {
	return safely(useLiveQuery(() => run(() => getSaleDraftStore().get()), []));
}
