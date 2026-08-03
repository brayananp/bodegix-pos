import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { DexieCatalogQueries } from "./dexie-catalog-queries";
import { DexieCatalogStore } from "./dexie-catalog-store";

export * from "./dexie-catalog-queries";
export * from "./dexie-catalog-store";

export function getCatalogStore(): DexieCatalogStore {
	return new DexieCatalogStore(getLocalDatabase());
}

export function getCatalogQueries(): DexieCatalogQueries {
	return new DexieCatalogQueries(getLocalDatabase());
}
