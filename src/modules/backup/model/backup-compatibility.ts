import { BackupError } from "./backup-errors";

export type BackupMigrationTransform = (
	table: string,
	value: unknown,
	key?: unknown,
) => { value: unknown; key?: unknown };

export interface BackupSchemaTableDescriptor {
	readonly name: string;
	readonly schema: string;
	readonly required: boolean;
}

export interface BackupSchemaDescriptor {
	readonly databaseVersion: number;
	readonly databaseName: string;
	readonly tables: BackupSchemaTableDescriptor[];
}

export interface BackupMigrationPlan {
	readonly fromSchemaVersion: number;
	readonly toSchemaVersion: number;
	readonly transform: BackupMigrationTransform;
}

export function resolveBackupMigration(
	fromSchemaVersion: number,
	toSchemaVersion: number,
	plans: readonly BackupMigrationPlan[],
): BackupMigrationTransform | undefined {
	if (fromSchemaVersion === toSchemaVersion) return undefined;
	if (fromSchemaVersion > toSchemaVersion) throw new BackupError("BACKUP_CREATED_BY_NEWER_APP");
	const chain: BackupMigrationPlan[] = [];
	let current = fromSchemaVersion;
	while (current < toSchemaVersion) {
		const plan = plans.find(({ fromSchemaVersion: from }) => from === current);
		if (!plan || plan.toSchemaVersion <= current) {
			throw new BackupError("BACKUP_SCHEMA_MIGRATION_UNAVAILABLE");
		}
		chain.push(plan);
		current = plan.toSchemaVersion;
	}
	if (current !== toSchemaVersion) throw new BackupError("BACKUP_SCHEMA_MIGRATION_UNAVAILABLE");
	return (table, value, key) => {
		let currentValue = value;
		let currentKey = key;
		for (const plan of chain) {
			const result = plan.transform(table, currentValue, currentKey);
			currentValue = result.value;
			currentKey = result.key;
		}
		return currentKey === undefined
			? { value: currentValue }
			: { value: currentValue, key: currentKey };
	};
}
