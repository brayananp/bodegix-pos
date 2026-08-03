import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { DexieCompleteSaleUnitOfWork } from "./dexie-complete-sale-unit-of-work";
import { DexieSaleDraftStore } from "./dexie-sale-draft-store";
import { DexieSaleProductQueries } from "./dexie-sale-product-queries";
import { DexieSaleResultQueries } from "./dexie-sale-result-queries";

export { DexieCompleteSaleUnitOfWork } from "./dexie-complete-sale-unit-of-work";
export { DexieSaleDraftStore } from "./dexie-sale-draft-store";
export { DexieSaleProductQueries } from "./dexie-sale-product-queries";
export { DexieSaleResultQueries } from "./dexie-sale-result-queries";
export * from "./sale-record-mappers";

// ── Factories ────────────────────────────────────────────────────────────────

export function getSaleDraftStore(): DexieSaleDraftStore {
	return new DexieSaleDraftStore(getLocalDatabase());
}

export function getSaleProductQueries(): DexieSaleProductQueries {
	return new DexieSaleProductQueries(getLocalDatabase());
}

export function getCompleteSaleUnitOfWork(): DexieCompleteSaleUnitOfWork {
	return new DexieCompleteSaleUnitOfWork(getLocalDatabase());
}

export function getSaleResultQueries(): DexieSaleResultQueries {
	return new DexieSaleResultQueries(getLocalDatabase());
}
