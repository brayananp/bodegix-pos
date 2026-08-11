export interface BackupMaintenanceGateway {
	runExclusive<T>(operation: () => Promise<T>): Promise<T>;
}
