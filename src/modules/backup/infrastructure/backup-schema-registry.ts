import type { BodegixDatabase } from "@/shared/infrastructure/local-db";
import type { BackupMigrationPlan, BackupSchemaDescriptor } from "../model";

function schemaString(table: BodegixDatabase["tables"][number]): string {
	return [table.schema.primKey.src, ...table.schema.indexes.map(({ src }) => src)].join(",");
}

export function createBackupSchemaDescriptor(database: BodegixDatabase): BackupSchemaDescriptor {
	return {
		databaseVersion: database.verno,
		databaseName: database.name,
		tables: database.tables
			.map((table) => ({ name: table.name, schema: schemaString(table), required: true }))
			.sort((left, right) => left.name.localeCompare(right.name)),
	};
}

export const BACKUP_MIGRATION_PLANS: readonly BackupMigrationPlan[] = [];
