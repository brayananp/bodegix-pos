import {
	DATABASE_MAINTENANCE_LOCK_NAME,
	DatabaseMaintenanceError,
} from "./database-maintenance.types";

interface LockManagerLike {
	request<T>(
		name: string,
		options: { mode: "shared" | "exclusive"; ifAvailable?: boolean },
		callback: (lock: unknown | null) => Promise<T>,
	): Promise<T>;
}

function getLockManager(): LockManagerLike | null {
	if (typeof navigator === "undefined") return null;
	const candidate = (navigator as Navigator & { locks?: LockManagerLike }).locks;
	return candidate ?? null;
}

export function isWebLocksAvailable(): boolean {
	return getLockManager() !== null;
}

export async function runWithSharedDatabaseLock<T>(task: () => Promise<T>): Promise<T> {
	const locks = getLockManager();
	if (!locks) return task();
	return locks.request(DATABASE_MAINTENANCE_LOCK_NAME, { mode: "shared" }, async (lock) => {
		if (!lock) throw new DatabaseMaintenanceError("DATABASE_MAINTENANCE_LOCK_UNAVAILABLE");
		return task();
	});
}

export async function runWithExclusiveDatabaseLock<T>(task: () => Promise<T>): Promise<T> {
	const locks = getLockManager();
	if (!locks) return task();
	return locks.request(DATABASE_MAINTENANCE_LOCK_NAME, { mode: "exclusive" }, async (lock) => {
		if (!lock) throw new DatabaseMaintenanceError("DATABASE_MAINTENANCE_LOCK_UNAVAILABLE");
		return task();
	});
}
