import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { DexieInventoryQueries } from "./dexie-inventory-queries";
import { DexieInventoryUnitOfWork } from "./dexie-inventory-unit-of-work";

export * from "./dexie-inventory-queries";
export * from "./dexie-inventory-unit-of-work";

export function getInventoryUnitOfWork(): DexieInventoryUnitOfWork {
	return new DexieInventoryUnitOfWork(getLocalDatabase());
}

export function getInventoryQueries(): DexieInventoryQueries {
	return new DexieInventoryQueries(getLocalDatabase());
}
