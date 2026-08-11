import {
	BodegixDatabase,
	getLocalDatabase,
	openDatabase,
	runDatabaseDiagnostics,
	appSettingsRecordSchema,
	type DatabaseDiagnosticReport,
} from "@/shared/infrastructure/local-db";
import { runWithDatabaseWriteAccess } from "@/shared/infrastructure/database-maintenance";
import { createId } from "@/shared/kernel/ids";
import type {
	BackupDatabaseGateway,
	BackupPayloadMetadata,
	CurrentInstallationPreview,
} from "../application";
import { BACKUP_APPLICATION_VERSION } from "../application";
import {
	BackupError,
	type BackupMigrationTransform,
	progressPercentage,
	type BackupProgress,
	type BackupValidationIssue,
	type BackupValidationReport,
	type BodegixBackupManifestV1,
	type RestoreProgress,
} from "../model";

function backupProgress(completedRows: number, totalRows?: number): BackupProgress {
	return {
		phase: "exporting",
		completedRows,
		totalRows: totalRows ?? 0,
		percentage: progressPercentage(completedRows, totalRows),
	};
}

function restoreProgress(completedRows: number, totalRows?: number): RestoreProgress {
	return {
		phase: "restoring",
		completedRows,
		totalRows: totalRows ?? 0,
		percentage: progressPercentage(completedRows, totalRows),
	};
}

export class DexieBackupDatabaseGateway implements BackupDatabaseGateway {
	constructor(private readonly database: BodegixDatabase = getLocalDatabase()) {}

	async exportDatabase(onProgress?: (progress: BackupProgress) => void): Promise<Blob> {
		await openDatabase(this.database);
		const { exportDB } = await import("dexie-export-import");
		return exportDB(this.database, {
			noTransaction: false,
			prettyJson: false,
			progressCallback: ({ completedRows, totalRows }) => {
				onProgress?.(backupProgress(completedRows, totalRows));
				return true;
			},
		});
	}

	async inspectPayload(payload: Blob): Promise<BackupPayloadMetadata> {
		try {
			const { peakImportFile } = await import("dexie-export-import");
			const metadata = await peakImportFile(payload);
			return {
				databaseName: metadata.data.databaseName,
				databaseVersion: metadata.data.databaseVersion,
				tables: metadata.data.tables.map(({ name, schema, rowCount }) => ({
					name,
					schema,
					rowCount,
				})),
			};
		} catch (error) {
			throw new BackupError("BACKUP_FILE_INVALID", error);
		}
	}

	async getSettings() {
		const settings = await this.database.appSettings.get("main");
		const parsed = appSettingsRecordSchema.safeParse(settings);
		if (!parsed.success) throw new BackupError("BACKUP_VALIDATION_FAILED", parsed.error);
		return parsed.data;
	}

	async getCurrentPreview(): Promise<CurrentInstallationPreview> {
		const settings = await this.getSettings();
		const counts = await Promise.all(this.database.tables.map((table) => table.count()));
		const tableCounts = Object.fromEntries(
			this.database.tables.map((table, index) => [table.name, counts[index] ?? 0]),
		);
		const [openCashSession, draft] = await Promise.all([
			this.database.cashSessions.where("status").equals("open").first(),
			this.database.saleDrafts.get("main"),
		]);
		return {
			settings,
			tableCounts,
			productCount: tableCounts.products ?? 0,
			saleCount: tableCounts.sales ?? 0,
			openCashSession: openCashSession !== undefined,
			saleDraftItemCount: draft?.items.length ?? 0,
		};
	}

	markManualBackupSaved(createdAt: number): Promise<void> {
		return runWithDatabaseWriteAccess(async () => {
			const updated = await this.database.appSettings.update("main", {
				lastBackupAt: createdAt,
				updatedAt: Math.max(Date.now(), createdAt),
			});
			if (updated !== 1) throw new BackupError("BACKUP_VALIDATION_FAILED");
		});
	}

	async validateInTemporaryDatabase(
		payload: Blob,
		manifest: BodegixBackupManifestV1,
		transform: BackupMigrationTransform | undefined,
		onProgress?: (progress: RestoreProgress) => void,
	): Promise<BackupValidationReport> {
		const temporary = new BodegixDatabase(`bodegix-restore-validation-${createId()}`);
		try {
			await openDatabase(temporary);
			const { importInto } = await import("dexie-export-import");
			await importInto(temporary, payload, {
				noTransaction: false,
				clearTablesBeforeImport: true,
				overwriteValues: true,
				acceptNameDiff: true,
				acceptVersionDiff: false,
				acceptChangedPrimaryKey: false,
				acceptMissingTables: false,
				...(transform ? { transform } : {}),
				progressCallback: ({ completedRows, totalRows }) => {
					onProgress?.({
						...restoreProgress(completedRows, totalRows),
						phase: "validating_database",
					});
					return true;
				},
			});
			const diagnostics = await runDatabaseDiagnostics(temporary, "deep");
			const counts = await Promise.all(temporary.tables.map((table) => table.count()));
			const tableCounts = Object.fromEntries(
				temporary.tables.map((table, index) => [table.name, counts[index] ?? 0]),
			);
			const errors: BackupValidationIssue[] = [];
			for (const table of manifest.tables) {
				if ((tableCounts[table.name] ?? -1) !== table.rowCount) {
					errors.push({
						code: "BACKUP_ROW_COUNT_MISMATCH",
						message: `La tabla ${table.name} no coincide.`,
					});
				}
			}
			if (diagnostics.status === "fail") {
				errors.push({
					code: "BACKUP_VALIDATION_FAILED",
					message: "El diagnóstico detectó inconsistencias.",
				});
			}
			const settings = await temporary.appSettings.get("main");
			if (!appSettingsRecordSchema.safeParse(settings).success) {
				errors.push({
					code: "BACKUP_VALIDATION_FAILED",
					message: "La configuración no es válida.",
				});
			}
			const [openCash, draft] = await Promise.all([
				temporary.cashSessions.where("status").equals("open").first(),
				temporary.saleDrafts.get("main"),
			]);
			const warnings: BackupValidationIssue[] = [];
			if (openCash)
				warnings.push({
					code: "OPEN_CASH_SESSION",
					message: "El respaldo contiene una caja abierta.",
				});
			if (draft?.items.length)
				warnings.push({
					code: "PENDING_SALE_DRAFT",
					message: "El respaldo contiene una venta pendiente.",
				});
			if (manifest.application.version !== BACKUP_APPLICATION_VERSION) {
				warnings.push({
					code: "APPLICATION_VERSION_DIFFERS",
					message: "La versión de aplicación es diferente, pero el esquema es compatible.",
				});
			}
			return {
				status:
					errors.length > 0 ? "invalid" : warnings.length > 0 ? "valid_with_warnings" : "valid",
				manifest,
				tableCounts,
				warnings,
				errors,
				diagnostics,
			};
		} catch (error) {
			if (error instanceof BackupError) throw error;
			throw new BackupError("BACKUP_VALIDATION_FAILED", error);
		} finally {
			temporary.close();
			await temporary.delete();
		}
	}

	async restoreIntoCurrentDatabase(
		payload: Blob,
		transform: BackupMigrationTransform | undefined,
		onProgress?: (progress: RestoreProgress) => void,
	): Promise<void> {
		await openDatabase(this.database);
		const { importInto } = await import("dexie-export-import");
		await importInto(this.database, payload, {
			noTransaction: false,
			clearTablesBeforeImport: true,
			overwriteValues: true,
			acceptNameDiff: false,
			acceptVersionDiff: false,
			acceptChangedPrimaryKey: false,
			acceptMissingTables: false,
			...(transform ? { transform } : {}),
			progressCallback: ({ completedRows, totalRows }) => {
				onProgress?.(restoreProgress(completedRows, totalRows));
				return true;
			},
		});
	}

	runDeepDiagnostics(): Promise<DatabaseDiagnosticReport> {
		return runDatabaseDiagnostics(this.database, "deep");
	}
}
