import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import Dexie from "dexie";
import type { CashQueries, ListCashMovementsQuery, ListCashSessionsQuery } from "../application";
import { cashMovementFromRecord, cashSessionFromRecord } from "./cash-record-mappers";
import { calculateOpenSessionSummary, summaryFromSnapshot } from "./cash-summary-builder";

export class DexieCashQueries implements CashQueries {
	constructor(private readonly database: BodegixDatabase) {}

	async getOpenSession() {
		const record = await this.database.cashSessions.where("status").equals("open").first();
		return record ? cashSessionFromRecord(record) : null;
	}

	async getSessionSummary(sessionId: string) {
		const session = await this.database.cashSessions.get(sessionId);
		if (!session) return null;
		return session.status === "closed"
			? summaryFromSnapshot(session)
			: calculateOpenSessionSummary(this.database, session);
	}

	async getCashStatus() {
		const [open, lastClosed] = await Promise.all([
			this.database.cashSessions.where("status").equals("open").first(),
			this.database.cashSessions
				.orderBy("closedAt")
				.reverse()
				.filter(({ status }) => status === "closed")
				.first(),
		]);
		return {
			isOpen: open !== undefined,
			openSession: open ? cashSessionFromRecord(open) : null,
			lastClosedSession: lastClosed ? cashSessionFromRecord(lastClosed) : null,
		};
	}

	async listSessions(query: ListCashSessionsQuery) {
		const collection = this.database.cashSessions.orderBy("openedAt").reverse();
		const total = await collection.count();
		const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
		const page = Math.min(query.page, totalPages);
		const records = await collection
			.offset((page - 1) * query.pageSize)
			.limit(query.pageSize)
			.toArray();
		return {
			items: records.map(cashSessionFromRecord),
			total,
			page,
			pageSize: query.pageSize,
			totalPages,
		};
	}

	async listMovements(query: ListCashMovementsQuery) {
		const collection = this.database.cashMovements
			.where("[cashSessionId+createdAt]")
			.between([query.cashSessionId, Dexie.minKey], [query.cashSessionId, Dexie.maxKey])
			.reverse();
		const total = await collection.count();
		const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
		const page = Math.min(query.page, totalPages);
		const records = await collection
			.offset((page - 1) * query.pageSize)
			.limit(query.pageSize)
			.toArray();
		return {
			items: records.map(cashMovementFromRecord),
			total,
			page,
			pageSize: query.pageSize,
			totalPages,
		};
	}
}
