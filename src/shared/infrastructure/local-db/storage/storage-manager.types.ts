export interface StorageStatus {
	supported: boolean;
	persistenceSupported: boolean;
	persisted: boolean | null;
	usageBytes: number | null;
	quotaBytes: number | null;
	usagePercentage: number | null;
}

export interface StorageManagerAdapter {
	getStorageStatus(): Promise<StorageStatus>;
	requestPersistentStorage(): Promise<StorageStatus>;
}
