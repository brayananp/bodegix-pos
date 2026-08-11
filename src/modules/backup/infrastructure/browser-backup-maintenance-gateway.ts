import {
	DatabaseMaintenanceError,
	runWithExclusiveDatabaseMaintenance,
} from "@/shared/infrastructure/database-maintenance";
import type { BackupMaintenanceGateway } from "../application";
import { BackupError } from "../model";

export class BrowserBackupMaintenanceGateway implements BackupMaintenanceGateway {
	async runExclusive<T>(operation: () => Promise<T>): Promise<T> {
		try {
			return await runWithExclusiveDatabaseMaintenance(operation);
		} catch (error) {
			if (
				error instanceof DatabaseMaintenanceError &&
				error.code === "DATABASE_MAINTENANCE_OTHER_TABS_ACTIVE"
			) {
				throw new BackupError("BACKUP_OTHER_TABS_ACTIVE", error);
			}
			throw new BackupError("BACKUP_MAINTENANCE_LOCK_FAILED", error);
		}
	}
}
