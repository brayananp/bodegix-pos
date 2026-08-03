import { nowTimestamp } from "@/shared/kernel/dates";
import { createId } from "@/shared/kernel/ids";
import type { BodegixDatabase } from "./bodegix-database";
import { getLocalDatabase, isIndexedDbAvailable, openDatabase } from "./database-client";
import { LocalDatabaseError, toLocalDatabaseError } from "./database-errors";
import { runDatabaseDiagnostics, type DatabaseDiagnosticReport } from "./diagnostics";
import { appSettingsRecordSchema, type AppSettingsRecord } from "./records";
import { DATABASE_SCHEMA_VERSION } from "./schema";

export interface LocalDatabaseInitializationResult {
	databaseName: string;
	schemaVersion: number;
	installationId: string;
	createdSettings: boolean;
	diagnostics: DatabaseDiagnosticReport;
}

function createInitialSettings(): AppSettingsRecord {
	const timestamp = nowTimestamp();
	return appSettingsRecordSchema.parse({
		id: "main",
		installationId: createId(),
		setupCompleted: false,
		businessName: "Mi bodega",
		currency: "PEN",
		timezone: "America/Lima",
		nextSaleNumber: 1,
		backupReminderDays: 7,
		lastBackupAt: null,
		createdAt: timestamp,
		updatedAt: timestamp,
	});
}

async function ensureAppSettings(
	database: BodegixDatabase,
): Promise<{ settings: AppSettingsRecord; created: boolean }> {
	return database.transaction("rw", database.appSettings, async () => {
		const existing = await database.appSettings.get("main");
		if (existing) {
			const parsed = appSettingsRecordSchema.safeParse(existing);
			if (!parsed.success) throw new LocalDatabaseError("APP_SETTINGS_INVALID", parsed.error);
			return { settings: parsed.data, created: false };
		}

		const settings = createInitialSettings();
		await database.appSettings.add(settings);
		return { settings, created: true };
	});
}

export async function initializeLocalDatabase(
	database?: BodegixDatabase,
): Promise<LocalDatabaseInitializationResult> {
	try {
		if (!isIndexedDbAvailable()) throw new LocalDatabaseError("INDEXED_DB_UNAVAILABLE");

		const targetDatabase = database ?? getLocalDatabase();
		await openDatabase(targetDatabase);
		const { settings, created } = await ensureAppSettings(targetDatabase);
		const diagnostics = await runDatabaseDiagnostics(targetDatabase, "basic");

		return {
			databaseName: targetDatabase.name,
			schemaVersion: DATABASE_SCHEMA_VERSION,
			installationId: settings.installationId,
			createdSettings: created,
			diagnostics,
		};
	} catch (error) {
		throw toLocalDatabaseError(error, "DATABASE_INITIALIZATION_FAILED");
	}
}
