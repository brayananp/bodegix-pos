import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { DexieCashQueries } from "./dexie-cash-queries";
import { DexieCashUnitOfWork } from "./dexie-cash-unit-of-work";

export * from "./cash-record-mappers";
export * from "./dexie-cash-queries";
export * from "./dexie-cash-unit-of-work";

export function getCashUnitOfWork(): DexieCashUnitOfWork {
	return new DexieCashUnitOfWork(getLocalDatabase());
}

export function getCashQueries(): DexieCashQueries {
	return new DexieCashQueries(getLocalDatabase());
}
