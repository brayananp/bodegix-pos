import { BodegixDatabase } from "./bodegix-database";
import { LocalDatabaseError } from "./database-errors";

let localDatabase: BodegixDatabase | undefined;

export function isIndexedDbAvailable(): boolean {
	return (
		typeof globalThis !== "undefined" &&
		typeof globalThis.indexedDB !== "undefined" &&
		typeof globalThis.IDBKeyRange !== "undefined"
	);
}

export function getLocalDatabase(): BodegixDatabase {
	if (!isIndexedDbAvailable()) {
		throw new LocalDatabaseError("INDEXED_DB_UNAVAILABLE");
	}

	localDatabase ??= new BodegixDatabase();
	return localDatabase;
}

export async function openDatabase(database: BodegixDatabase): Promise<BodegixDatabase> {
	try {
		if (!database.isOpen()) await database.open();
		return database;
	} catch (error) {
		if (error instanceof Error && error.name === "VersionError") {
			throw new LocalDatabaseError("DATABASE_VERSION_UNSUPPORTED", error);
		}
		throw new LocalDatabaseError("DATABASE_OPEN_FAILED", error);
	}
}

export async function openLocalDatabase(): Promise<BodegixDatabase> {
	return openDatabase(getLocalDatabase());
}
