import type { CashMovementRecord, CashSessionRecord } from "@/shared/infrastructure/local-db";
import type { CashMovement, CashSession } from "../domain";

export function cashSessionFromRecord(record: CashSessionRecord): CashSession {
	return {
		id: record.id,
		status: record.status,
		openingCashCents: record.openingCashCents,
		expectedCashCents: record.expectedCashCents,
		countedCashCents: record.countedCashCents,
		differenceCents: record.differenceCents,
		openedAt: record.openedAt,
		closedAt: record.closedAt,
	};
}

export function cashMovementFromRecord(record: CashMovementRecord): CashMovement {
	return { ...record };
}
