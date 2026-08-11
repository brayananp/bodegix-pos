import { describe, expect, it } from "vitest";
import { DatabaseMaintenanceCoordinator } from "./database-maintenance-coordinator";

describe("DatabaseMaintenanceCoordinator", () => {
	it("mantiene estable el snapshot mientras no cambia el estado", () => {
		const coordinator = new DatabaseMaintenanceCoordinator();
		expect(coordinator.getSnapshot()).toBe(coordinator.getSnapshot());
	});

	it("publica un snapshot nuevo al cambiar de estado", () => {
		const coordinator = new DatabaseMaintenanceCoordinator();
		const previous = coordinator.getSnapshot();
		coordinator.setLocalState({ state: "preparing", operation: "backup" });
		expect(coordinator.getSnapshot()).not.toBe(previous);
		expect(coordinator.getSnapshot().state).toEqual({ state: "preparing", operation: "backup" });
	});
});
