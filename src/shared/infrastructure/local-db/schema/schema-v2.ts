import type Dexie from "dexie";
import { SCHEMA_V1 } from "./schema-v1";

export const SCHEMA_V2 = {
	...SCHEMA_V1,
	inventoryMovements:
		"id, productId, type, referenceType, referenceId, createdAt, [productId+createdAt], [referenceType+referenceId], [type+createdAt], [productId+type+createdAt]",
} as const;

export function registerSchemaV2(database: Dexie): void {
	database.version(2).stores(SCHEMA_V2);
}
