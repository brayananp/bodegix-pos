import type { StorageStatus } from "./storage-manager.types";

function getBrowserStorageManager(): StorageManager | null {
	if (typeof navigator === "undefined" || !navigator.storage) return null;
	return navigator.storage;
}

function unsupportedStatus(): StorageStatus {
	return {
		supported: false,
		persistenceSupported: false,
		persisted: null,
		usageBytes: null,
		quotaBytes: null,
		usagePercentage: null,
	};
}

async function readStorageStatus(storage: StorageManager): Promise<StorageStatus> {
	const persistenceSupported = typeof storage.persist === "function";
	let persisted: boolean | null = null;
	let usageBytes: number | null = null;
	let quotaBytes: number | null = null;

	if (typeof storage.persisted === "function") {
		try {
			persisted = await storage.persisted();
		} catch {
			persisted = null;
		}
	}

	if (typeof storage.estimate === "function") {
		try {
			const estimate = await storage.estimate();
			usageBytes = typeof estimate.usage === "number" ? estimate.usage : null;
			quotaBytes = typeof estimate.quota === "number" ? estimate.quota : null;
		} catch {
			usageBytes = null;
			quotaBytes = null;
		}
	}

	const usagePercentage =
		usageBytes !== null && quotaBytes !== null && quotaBytes > 0
			? Math.min(100, (usageBytes / quotaBytes) * 100)
			: null;

	return {
		supported: true,
		persistenceSupported,
		persisted,
		usageBytes,
		quotaBytes,
		usagePercentage,
	};
}

export async function getStorageStatus(): Promise<StorageStatus> {
	const storage = getBrowserStorageManager();
	return storage ? readStorageStatus(storage) : unsupportedStatus();
}

export async function requestPersistentStorage(): Promise<StorageStatus> {
	const storage = getBrowserStorageManager();
	if (!storage) return unsupportedStatus();

	if (typeof storage.persist === "function") {
		try {
			await storage.persist();
		} catch (error) {
			void error;
			// La lectura posterior degrada el estado sin convertir un rechazo en un fallo de la app.
		}
	}

	return readStorageStatus(storage);
}
