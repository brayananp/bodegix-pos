import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { DexieCompleteSaleUnitOfWork } from "./dexie-complete-sale-unit-of-work";
import { DexieSaleDraftStore } from "./dexie-sale-draft-store";
import { DexieSaleHistoryQueries } from "./dexie-sale-history-queries";
import { DexieSaleProductQueries } from "./dexie-sale-product-queries";
import { DexieSaleResultQueries } from "./dexie-sale-result-queries";
import { DexieVoidSaleUnitOfWork } from "./dexie-void-sale-unit-of-work";

export { DexieCompleteSaleUnitOfWork } from "./dexie-complete-sale-unit-of-work";
export { DexieSaleDraftStore } from "./dexie-sale-draft-store";
export { DexieSaleHistoryQueries } from "./dexie-sale-history-queries";
export { DexieSaleProductQueries } from "./dexie-sale-product-queries";
export { DexieSaleResultQueries } from "./dexie-sale-result-queries";
export { DexieVoidSaleUnitOfWork } from "./dexie-void-sale-unit-of-work";
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

export function getVoidSaleUnitOfWork(): DexieVoidSaleUnitOfWork {
	return new DexieVoidSaleUnitOfWork(getLocalDatabase());
}

export function getSaleHistoryQueries(): DexieSaleHistoryQueries {
	return new DexieSaleHistoryQueries(getLocalDatabase());
}
