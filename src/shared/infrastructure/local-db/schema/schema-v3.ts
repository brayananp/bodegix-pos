import type Dexie from "dexie";
import type { CashSessionRecord } from "../records";
import { SCHEMA_V2 } from "./schema-v2";

export const SCHEMA_V3 = { ...SCHEMA_V2 } as const;

const SNAPSHOT_DEFAULTS = {
	completedSalesCount: null,
	totalSalesCents: null,
	cashSalesCents: null,
	yapeSalesCents: null,
	plinSalesCents: null,
	cardSalesCents: null,
	bankTransferSalesCents: null,
	manualDepositsCents: null,
	manualWithdrawalsCents: null,
} as const;

export function registerSchemaV3(database: Dexie): void {
	database
		.version(3)
		.stores(SCHEMA_V3)
		.upgrade((transaction) =>
			transaction
				.table<CashSessionRecord, string>("cashSessions")
				.toCollection()
				.modify((session) => {
					Object.assign(session, SNAPSHOT_DEFAULTS);
				}),
		);
}
