import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { BrowserBackupCryptoGateway } from "./browser-backup-crypto-gateway";
import { BrowserBackupFileGateway } from "./browser-backup-file-gateway";
import { BrowserBackupMaintenanceGateway } from "./browser-backup-maintenance-gateway";
import {
	canonicalizeJson,
	encodeBackupContainer,
	parseBackupContainer,
} from "./backup-container-codec";
import { BACKUP_MIGRATION_PLANS, createBackupSchemaDescriptor } from "./backup-schema-registry";
import { DexieBackupDatabaseGateway } from "./dexie-backup-database-gateway";

export { BrowserBackupCryptoGateway } from "./browser-backup-crypto-gateway";
export { BrowserBackupFileGateway } from "./browser-backup-file-gateway";
export { BrowserBackupMaintenanceGateway } from "./browser-backup-maintenance-gateway";
export {
	canonicalizeJson,
	encodeBackupContainer,
	parseBackupContainer,
} from "./backup-container-codec";
export { BACKUP_MIGRATION_PLANS, createBackupSchemaDescriptor } from "./backup-schema-registry";
export { DexieBackupDatabaseGateway } from "./dexie-backup-database-gateway";

export function createBackupServices() {
	const databaseInstance = getLocalDatabase();
	return {
		database: new DexieBackupDatabaseGateway(databaseInstance),
		crypto: new BrowserBackupCryptoGateway(),
		file: new BrowserBackupFileGateway(),
		maintenance: new BrowserBackupMaintenanceGateway(),
		encodeContainer: encodeBackupContainer,
		parseContainer: parseBackupContainer,
		canonicalize: canonicalizeJson,
		schema: createBackupSchemaDescriptor(databaseInstance),
		migrations: BACKUP_MIGRATION_PLANS,
	};
}
