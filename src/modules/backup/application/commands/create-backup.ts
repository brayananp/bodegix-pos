import type {
	BackupCryptoGateway,
	BackupDatabaseGateway,
	BackupFileGateway,
	SaveBackupFileResult,
} from "../ports";
import {
	backupManifestCoreV1Schema,
	buildBackupFileName,
	BackupError,
	type BackupFile,
	type BackupProgress,
	type BackupSource,
	type BodegixBackupManifestV1,
	type CreateBackupResult,
} from "../../model";

export const BACKUP_APPLICATION_NAME = "Bodegix POS" as const;
export const BACKUP_APPLICATION_VERSION = "0.1.0";

export interface CreatedBackupArtifact {
	readonly file: BackupFile;
	readonly payload: Blob;
	readonly result: CreateBackupResult;
}

export interface CreateBackupDependencies {
	readonly database: BackupDatabaseGateway;
	readonly crypto: BackupCryptoGateway;
	readonly encodeContainer: (manifest: BodegixBackupManifestV1, payload: Blob) => Promise<Blob>;
	readonly canonicalize: (value: unknown) => string;
	readonly now?: () => number;
}

export async function createBackup(
	dependencies: CreateBackupDependencies,
	input: { source: BackupSource; onProgress?: (progress: BackupProgress) => void },
): Promise<CreatedBackupArtifact> {
	const notify = input.onProgress ?? (() => undefined);
	const createdAt = (dependencies.now ?? Date.now)();
	notify({ phase: "preparing", completedRows: 0, totalRows: 0, percentage: null });
	try {
		const payload = await dependencies.database.exportDatabase(notify);
		const [metadata, settings] = await Promise.all([
			dependencies.database.inspectPayload(payload),
			dependencies.database.getSettings(),
		]);
		notify({ phase: "hashing", completedRows: 0, totalRows: 0, percentage: null });
		const payloadSha256 = await dependencies.crypto.sha256(payload);
		const tables = [...metadata.tables]
			.sort((left, right) => left.name.localeCompare(right.name))
			.map(({ name, rowCount, schema }) => ({ name, rowCount, schema }));
		const core = backupManifestCoreV1Schema.parse({
			formatName: "bodegix-backup",
			formatVersion: 1,
			createdAt,
			source: input.source,
			application: { name: BACKUP_APPLICATION_NAME, version: BACKUP_APPLICATION_VERSION },
			database: { name: metadata.databaseName, schemaVersion: metadata.databaseVersion },
			installation: {
				installationId: settings.installationId,
				businessName: settings.businessName,
				currency: settings.currency,
				timezone: settings.timezone,
			},
			payload: { byteLength: payload.size, sha256: payloadSha256 },
			tables,
		});
		const manifestSha256 = await dependencies.crypto.sha256(
			new TextEncoder().encode(dependencies.canonicalize(core)),
		);
		const manifest: BodegixBackupManifestV1 = {
			...core,
			integrity: { manifestSha256 },
		};
		notify({ phase: "building_file", completedRows: 0, totalRows: 0, percentage: null });
		const blob = await dependencies.encodeContainer(manifest, payload);
		const name = buildBackupFileName({
			businessName: settings.businessName,
			createdAt,
			timezone: settings.timezone,
			source: input.source,
		});
		const rowCount = tables.reduce((sum, table) => sum + table.rowCount, 0);
		return {
			file: { name, blob, manifest },
			payload,
			result: {
				fileName: name,
				fileSizeBytes: blob.size,
				createdAt,
				source: input.source,
				databaseSchemaVersion: metadata.databaseVersion,
				tableCount: tables.length,
				rowCount,
				payloadSha256,
			},
		};
	} catch (error) {
		if (error instanceof BackupError) throw error;
		throw new BackupError("BACKUP_EXPORT_FAILED", error);
	}
}

export async function saveCreatedBackup(
	artifact: CreatedBackupArtifact,
	fileGateway: BackupFileGateway,
	database: BackupDatabaseGateway,
	onProgress?: (progress: BackupProgress) => void,
): Promise<SaveBackupFileResult> {
	onProgress?.({ phase: "saving", completedRows: 0, totalRows: 0, percentage: null });
	const saved = await fileGateway.save(artifact.file);
	if (saved.status === "cancelled") return saved;
	if (artifact.result.source === "manual") {
		await database.markManualBackupSaved(artifact.result.createdAt);
	}
	onProgress?.({ phase: "completed", completedRows: 0, totalRows: 0, percentage: 100 });
	return saved;
}
