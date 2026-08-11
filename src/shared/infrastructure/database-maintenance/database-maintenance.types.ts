export const DATABASE_MAINTENANCE_LOCK_NAME = "bodegix-database-maintenance";
export const DATABASE_MAINTENANCE_CHANNEL_NAME = "bodegix-database-maintenance";

export type DatabaseMaintenanceOperation = "backup" | "restore";

export type DatabaseMaintenanceState =
	| { state: "idle" }
	| { state: "preparing"; operation: DatabaseMaintenanceOperation }
	| { state: "validating_restore" }
	| { state: "restoring" }
	| { state: "reinitializing" }
	| { state: "error"; error: DatabaseMaintenanceError };

export type DatabaseMaintenanceErrorCode =
	| "DATABASE_MAINTENANCE_ACTIVE"
	| "DATABASE_MAINTENANCE_LOCK_UNAVAILABLE"
	| "DATABASE_MAINTENANCE_OTHER_TABS_ACTIVE";

export class DatabaseMaintenanceError extends Error {
	override readonly name = "DatabaseMaintenanceError";

	constructor(
		readonly code: DatabaseMaintenanceErrorCode,
		override readonly cause?: unknown,
	) {
		super(code);
	}
}

export interface DatabaseMaintenanceSnapshot {
	readonly state: DatabaseMaintenanceState;
	readonly remote: boolean;
	readonly webLocksAvailable: boolean;
	readonly broadcastChannelAvailable: boolean;
}

export type DatabaseMaintenanceMessage =
	| { type: "maintenance-probe"; operationId: string; tabId: string }
	| { type: "maintenance-peer"; operationId: string; tabId: string }
	| { type: "maintenance-starting"; operationId: string; tabId: string }
	| { type: "maintenance-ready"; operationId: string; tabId: string }
	| { type: "maintenance-completed"; operationId: string }
	| { type: "maintenance-failed"; operationId: string };
