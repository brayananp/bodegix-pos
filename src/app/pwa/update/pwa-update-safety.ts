import type { DatabaseMaintenanceSnapshot } from "@/shared/infrastructure/database-maintenance";
import type { OperationSafetySnapshot } from "@/shared/infrastructure/operation-safety";
import type { PwaUpdateBlocker, PwaUpdateSafetyState } from "../pwa.types";

export function getPwaUpdateSafety(
	operations: OperationSafetySnapshot,
	maintenance: DatabaseMaintenanceSnapshot,
): PwaUpdateSafetyState {
	const blockers = new Set<PwaUpdateBlocker>(operations.blockers);
	const maintenanceState = maintenance.state;
	if (
		maintenanceState.state === "preparing" ||
		maintenanceState.state === "validating_restore" ||
		maintenanceState.state === "restoring" ||
		maintenanceState.state === "reinitializing"
	) {
		blockers.add("database_maintenance");
	}
	if (
		maintenanceState.state === "validating_restore" ||
		maintenanceState.state === "restoring" ||
		maintenanceState.state === "reinitializing" ||
		(maintenanceState.state === "preparing" && maintenanceState.operation === "restore")
	) {
		blockers.add("restore_in_progress");
	}
	return { safeToReload: blockers.size === 0, blockers: [...blockers] };
}
