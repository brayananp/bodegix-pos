import type { DatabaseMaintenanceSnapshot } from "@/shared/infrastructure/database-maintenance";
import type { OperationSafetySnapshot } from "@/shared/infrastructure/operation-safety";
import { describe, expect, it } from "vitest";
import { getPwaUpdateSafety } from "./pwa-update-safety";

const idleMaintenance: DatabaseMaintenanceSnapshot = {
	state: { state: "idle" },
	remote: false,
	webLocksAvailable: true,
	broadcastChannelAvailable: true,
};

describe("PWA update safety", () => {
	it("permite recargar sin operaciones activas", () => {
		expect(getPwaUpdateSafety({ blockers: [] }, idleMaintenance)).toEqual({
			safeToReload: true,
			blockers: [],
		});
	});

	it.each([
		"dirty_form",
		"checkout_in_progress",
		"critical_operation",
	] as const)("bloquea por %s", (blocker) => {
		const operations: OperationSafetySnapshot = { blockers: [blocker] };
		expect(getPwaUpdateSafety(operations, idleMaintenance)).toMatchObject({
			safeToReload: false,
			blockers: [blocker],
		});
	});

	it("distingue restauración de mantenimiento general", () => {
		const restoring = getPwaUpdateSafety(
			{ blockers: [] },
			{ ...idleMaintenance, state: { state: "restoring" } },
		);
		expect(restoring.blockers).toEqual(["database_maintenance", "restore_in_progress"]);
	});

	it("deduplica varios blockers", () => {
		const result = getPwaUpdateSafety(
			{ blockers: ["dirty_form", "checkout_in_progress"] },
			{ ...idleMaintenance, state: { state: "preparing", operation: "restore" } },
		);
		expect(result.safeToReload).toBe(false);
		expect(result.blockers).toHaveLength(4);
	});
});
