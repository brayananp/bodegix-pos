import type { DatabaseDiagnosticReport } from "@/shared/infrastructure/local-db";
import type { BodegixBackupManifestV1, BackupSource } from "./backup-manifest";

export interface CreateBackupResult {
	readonly fileName: string;
	readonly fileSizeBytes: number;
	readonly createdAt: number;
	readonly source: BackupSource;
	readonly databaseSchemaVersion: number;
	readonly tableCount: number;
	readonly rowCount: number;
	readonly payloadSha256: string;
}

export interface BackupValidationIssue {
	readonly code: string;
	readonly message: string;
}

export interface BackupValidationReport {
	readonly status: "valid" | "valid_with_warnings" | "invalid";
	readonly manifest: BodegixBackupManifestV1;
	readonly tableCounts: Record<string, number>;
	readonly warnings: BackupValidationIssue[];
	readonly errors: BackupValidationIssue[];
	readonly diagnostics: DatabaseDiagnosticReport;
}

export interface RestoreBackupResult {
	readonly restoredAt: number;
	readonly sourceBackupCreatedAt: number;
	readonly sourceApplicationVersion: string;
	readonly sourceDatabaseVersion: number;
	readonly installationId: string;
	readonly businessName: string;
	readonly tableCount: number;
	readonly rowCount: number;
	readonly safetyBackupFileName: string;
	readonly diagnostics: DatabaseDiagnosticReport;
}
