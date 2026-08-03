import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { useLiveQuery } from "dexie-react-hooks";

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

/** Observa reactivamente si hay una caja abierta. */
export function useOpenCashStatus() {
	return safely(
		useLiveQuery(
			() =>
				run(async () => {
					const db = getLocalDatabase();
					const open = await db.cashSessions.where("status").equals("open").first();
					return { isOpen: open !== undefined, sessionId: open?.id ?? null };
				}),
			[],
		),
	);
}
