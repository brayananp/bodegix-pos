import type Dexie from "dexie";
import { SCHEMA_V3 } from "./schema-v3";

export const SCHEMA_V4 = {
	...SCHEMA_V3,
	saleDrafts: "id, updatedAt",
} as const;

export function registerSchemaV4(database: Dexie): void {
	database.version(4).stores(SCHEMA_V4);
}
