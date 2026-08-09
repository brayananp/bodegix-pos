import type Dexie from "dexie";
import { SCHEMA_V6 } from "./schema-v6";

/** V7: anulaciones por fecha sin recorrer el historial completo. */
export const SCHEMA_V7 = {
	...SCHEMA_V6,
	sales:
		"id, &saleNumber, cashSessionId, status, createdAt, voidedAt, totalCents, [status+createdAt], [status+voidedAt], [cashSessionId+createdAt]",
} as const;

export function registerSchemaV7(database: Dexie): void {
	database.version(7).stores(SCHEMA_V7);
}
