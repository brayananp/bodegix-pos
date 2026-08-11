import type { BackupDatabaseGateway, BackupMaintenanceGateway } from "../ports";
import { BackupError, type RestoreBackupResult, type RestoreProgress } from "../../model";
import type { CreatedBackupArtifact } from "./create-backup";
import type { InspectBackupResult } from "./inspect-backup";

export async function restoreBackup(
	input: {
		readonly inspected: InspectBackupResult;
		readonly safetyBackup: CreatedBackupArtifact;
		readonly onProgress?: (progress: RestoreProgress) => void;
	},
	dependencies: {
		readonly database: BackupDatabaseGateway;
		readonly maintenance: BackupMaintenanceGateway;
		readonly now?: () => number;
	},
): Promise<RestoreBackupResult> {
	if (input.safetyBackup.result.source !== "pre_restore") {
		throw new BackupError("BACKUP_SAFETY_COPY_REQUIRED");
	}
	const notify = input.onProgress ?? (() => undefined);
	notify({ phase: "waiting_for_tabs", completedRows: 0, totalRows: 0, percentage: null });
	return dependencies.maintenance.runExclusive(async () => {
		notify({ phase: "restoring", completedRows: 0, totalRows: 0, percentage: null });
		try {
			await dependencies.database.restoreIntoCurrentDatabase(
				input.inspected.container.payload,
				input.inspected.transform,
				notify,
			);
		} catch (error) {
			throw new BackupError("BACKUP_RESTORE_FAILED", error);
		}

		notify({ phase: "verifying_restore", completedRows: 0, totalRows: 0, percentage: null });
		const diagnostics = await dependencies.database.runDeepDiagnostics();
		if (diagnostics.status === "fail") {
			try {
				await dependencies.database.restoreIntoCurrentDatabase(
					input.safetyBackup.payload,
					undefined,
					notify,
				);
				const recoveryDiagnostics = await dependencies.database.runDeepDiagnostics();
				if (recoveryDiagnostics.status === "fail") throw new BackupError("BACKUP_RECOVERY_FAILED");
				throw new BackupError("BACKUP_POST_RESTORE_VALIDATION_FAILED", undefined, {
					recovered: true,
				});
			} catch (error) {
				if (
					error instanceof BackupError &&
					error.code === "BACKUP_POST_RESTORE_VALIDATION_FAILED"
				) {
					throw error;
				}
				throw new BackupError("BACKUP_RECOVERY_FAILED", error);
			}
		}

		const settings = await dependencies.database.getSettings();
		const manifest = input.inspected.container.manifest;
		const rowCount = manifest.tables.reduce((sum, table) => sum + table.rowCount, 0);
		notify({ phase: "completed", completedRows: rowCount, totalRows: rowCount, percentage: 100 });
		return {
			restoredAt: (dependencies.now ?? Date.now)(),
			sourceBackupCreatedAt: manifest.createdAt,
			sourceApplicationVersion: manifest.application.version,
			sourceDatabaseVersion: manifest.database.schemaVersion,
			installationId: settings.installationId,
			businessName: settings.businessName,
			tableCount: manifest.tables.length,
			rowCount,
			safetyBackupFileName: input.safetyBackup.result.fileName,
			diagnostics,
		};
	});
}
