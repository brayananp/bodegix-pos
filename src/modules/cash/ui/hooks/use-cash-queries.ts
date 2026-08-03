import { useLiveQuery } from "dexie-react-hooks";
import type { ListCashMovementsQuery, ListCashSessionsQuery } from "../../application";
import { getCashQueries } from "../../infrastructure";

interface LiveState<T> {
	data: T | undefined;
	error: Error | null;
	isLoading: boolean;
}

function state<T>(result: { data?: T; error: Error | null } | undefined): LiveState<T> {
	return {
		data: result?.data,
		error: result?.error ?? null,
		isLoading: result === undefined,
	};
}

async function safely<T>(query: () => Promise<T>): Promise<{ data?: T; error: Error | null }> {
	try {
		return { data: await query(), error: null };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error("Error de lectura local") };
	}
}

export function useCashStatus() {
	return state(useLiveQuery(() => safely(() => getCashQueries().getCashStatus()), []));
}

export function useOpenCashSession() {
	return state(useLiveQuery(() => safely(() => getCashQueries().getOpenSession()), []));
}

export function useCashSessionSummary(sessionId: string | null) {
	const keyedResult = useLiveQuery(
		async () => ({
			sessionId,
			result: await safely(() =>
				sessionId ? getCashQueries().getSessionSummary(sessionId) : Promise.resolve(null),
			),
		}),
		[sessionId],
	);
	if (!keyedResult || keyedResult.sessionId !== sessionId) {
		return { data: undefined, error: null, isLoading: true };
	}
	return state(keyedResult.result);
}

export function useCashSessions(query: ListCashSessionsQuery) {
	return state(
		useLiveQuery(
			() => safely(() => getCashQueries().listSessions(query)),
			[query.page, query.pageSize],
		),
	);
}

export function useCashMovements(query: ListCashMovementsQuery | null) {
	return state(
		useLiveQuery(
			() => safely(() => (query ? getCashQueries().listMovements(query) : Promise.resolve(null))),
			[query?.cashSessionId, query?.page, query?.pageSize],
		),
	);
}
