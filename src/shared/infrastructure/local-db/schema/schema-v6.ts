import type Dexie from "dexie";
import { SCHEMA_V5 } from "./schema-v5";

/** V6: índice mínimo para ordenar el historial por total sin cargar todas las ventas. */
export const SCHEMA_V6 = {
	...SCHEMA_V5,
	sales:
		"id, &saleNumber, cashSessionId, status, createdAt, totalCents, [status+createdAt], [cashSessionId+createdAt]",
} as const;

export function registerSchemaV6(database: Dexie): void {
	database.version(6).stores(SCHEMA_V6);
}
