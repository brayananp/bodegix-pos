import type { AppSettingsRecord, DatabaseDiagnosticReport } from "@/shared/infrastructure/local-db";
import type {
	BackupMigrationTransform,
	BackupProgress,
	BackupValidationReport,
	BodegixBackupManifestV1,
	RestoreProgress,
} from "../../model";

export interface BackupPayloadTableMetadata {
	readonly name: string;
	readonly schema: string;
	readonly rowCount: number;
}

export interface BackupPayloadMetadata {
	readonly databaseName: string;
	readonly databaseVersion: number;
	readonly tables: BackupPayloadTableMetadata[];
}

export interface CurrentInstallationPreview {
	readonly settings: AppSettingsRecord;
	readonly tableCounts: Record<string, number>;
	readonly productCount: number;
	readonly saleCount: number;
	readonly openCashSession: boolean;
	readonly saleDraftItemCount: number;
}

export interface BackupDatabaseGateway {
	exportDatabase(onProgress?: (progress: BackupProgress) => void): Promise<Blob>;
	inspectPayload(payload: Blob): Promise<BackupPayloadMetadata>;
	getSettings(): Promise<AppSettingsRecord>;
	getCurrentPreview(): Promise<CurrentInstallationPreview>;
	markManualBackupSaved(createdAt: number): Promise<void>;
	validateInTemporaryDatabase(
		payload: Blob,
		manifest: BodegixBackupManifestV1,
		transform: BackupMigrationTransform | undefined,
		onProgress?: (progress: RestoreProgress) => void,
	): Promise<BackupValidationReport>;
	restoreIntoCurrentDatabase(
		payload: Blob,
		transform: BackupMigrationTransform | undefined,
		onProgress?: (progress: RestoreProgress) => void,
	): Promise<void>;
	runDeepDiagnostics(): Promise<DatabaseDiagnosticReport>;
}
