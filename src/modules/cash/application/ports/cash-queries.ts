import type { CashMovement, CashSession, CashSessionSummary } from "../../domain";

export type CashPageSize = 25 | 50 | 100;

export interface CashSessionListItem extends CashSession {}

export interface ListCashSessionsQuery {
	page: number;
	pageSize: CashPageSize;
}

export interface CashSessionSearchResult {
	items: CashSessionListItem[];
	total: number;
	page: number;
	pageSize: CashPageSize;
	totalPages: number;
}

export interface ListCashMovementsQuery {
	cashSessionId: string;
	page: number;
	pageSize: CashPageSize;
}

export interface CashMovementSearchResult {
	items: CashMovement[];
	total: number;
	page: number;
	pageSize: CashPageSize;
	totalPages: number;
}

export interface CashStatus {
	isOpen: boolean;
	openSession: CashSession | null;
	lastClosedSession: CashSessionListItem | null;
}

export interface CashQueries {
	getOpenSession(): Promise<CashSession | null>;
	getSessionSummary(sessionId: string): Promise<CashSessionSummary | null>;
	getCashStatus(): Promise<CashStatus>;
	listSessions(query: ListCashSessionsQuery): Promise<CashSessionSearchResult>;
	listMovements(query: ListCashMovementsQuery): Promise<CashMovementSearchResult>;
}
