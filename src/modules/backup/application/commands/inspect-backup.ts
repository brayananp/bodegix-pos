import type { BackupCryptoGateway, BackupDatabaseGateway, BackupPayloadMetadata } from "../ports";
import {
	BACKUP_FORMAT_VERSION,
	BackupError,
	type BackupMigrationTransform,
	type BackupMigrationPlan,
	type BackupSchemaDescriptor,
	type BackupValidationReport,
	type ParsedBackupContainer,
	resolveBackupMigration,
	type RestoreProgress,
} from "../../model";

export interface InspectBackupResult {
	readonly container: ParsedBackupContainer;
	readonly metadata: BackupPayloadMetadata;
	readonly validation: BackupValidationReport;
	readonly transform: BackupMigrationTransform | undefined;
}

function assertTables(
	metadata: BackupPayloadMetadata,
	descriptor: BackupSchemaDescriptor,
	manifestTables: ParsedBackupContainer["manifest"]["tables"],
): void {
	const expected = new Map(descriptor.tables.map((table) => [table.name, table]));
	const actual = new Map(metadata.tables.map((table) => [table.name, table]));
	for (const table of descriptor.tables) {
		if (table.required && !actual.has(table.name)) {
			throw new BackupError("BACKUP_TABLE_MISSING", undefined, { table: table.name });
		}
	}
	for (const table of metadata.tables) {
		const expectedTable = expected.get(table.name);
		if (!expectedTable)
			throw new BackupError("BACKUP_TABLE_UNEXPECTED", undefined, { table: table.name });
		if (expectedTable.schema !== table.schema) {
			throw new BackupError("BACKUP_TABLE_SCHEMA_MISMATCH", undefined, { table: table.name });
		}
	}
	const manifest = new Map(manifestTables.map((table) => [table.name, table]));
	for (const table of metadata.tables) {
		const outer = manifest.get(table.name);
		if (!outer) throw new BackupError("BACKUP_TABLE_MISSING", undefined, { table: table.name });
		if (outer.schema !== table.schema) {
			throw new BackupError("BACKUP_TABLE_SCHEMA_MISMATCH", undefined, { table: table.name });
		}
		if (outer.rowCount !== table.rowCount) {
			throw new BackupError("BACKUP_ROW_COUNT_MISMATCH", undefined, { table: table.name });
		}
	}
	if (manifest.size !== metadata.tables.length) throw new BackupError("BACKUP_TABLE_UNEXPECTED");
}

export async function inspectBackup(
	file: Blob,
	dependencies: {
		readonly database: BackupDatabaseGateway;
		readonly crypto: BackupCryptoGateway;
		readonly parseContainer: (
			file: Blob,
			crypto: BackupCryptoGateway,
		) => Promise<ParsedBackupContainer>;
		readonly schema: BackupSchemaDescriptor;
		readonly migrations: readonly BackupMigrationPlan[];
	},
	onProgress?: (progress: RestoreProgress) => void,
): Promise<InspectBackupResult> {
	onProgress?.({ phase: "reading_file", completedRows: 0, totalRows: 0, percentage: null });
	const container = await dependencies.parseContainer(file, dependencies.crypto);
	if (container.manifest.formatVersion > BACKUP_FORMAT_VERSION) {
		throw new BackupError("BACKUP_FORMAT_UNSUPPORTED");
	}
	onProgress?.({
		phase: "checking_compatibility",
		completedRows: 0,
		totalRows: 0,
		percentage: null,
	});
	const metadata = await dependencies.database.inspectPayload(container.payload);
	if (metadata.databaseName !== dependencies.schema.databaseName) {
		throw new BackupError("BACKUP_DATABASE_NAME_INVALID");
	}
	if (
		container.manifest.database.name !== metadata.databaseName ||
		container.manifest.database.schemaVersion !== metadata.databaseVersion
	) {
		throw new BackupError("BACKUP_SCHEMA_INCOMPATIBLE");
	}
	const transform = resolveBackupMigration(
		metadata.databaseVersion,
		dependencies.schema.databaseVersion,
		dependencies.migrations,
	);
	assertTables(metadata, dependencies.schema, container.manifest.tables);
	onProgress?.({ phase: "validating_database", completedRows: 0, totalRows: 0, percentage: null });
	const validation = await dependencies.database.validateInTemporaryDatabase(
		container.payload,
		container.manifest,
		transform,
		onProgress,
	);
	if (validation.status === "invalid") throw new BackupError("BACKUP_VALIDATION_FAILED");
	return { container, metadata, validation, transform };
}
