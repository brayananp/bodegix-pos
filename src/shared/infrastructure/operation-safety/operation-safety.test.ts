import { describe, expect, it, vi } from "vitest";
import { getOperationSafetyCoordinator } from "./operation-safety";

describe("operation safety coordinator", () => {
	it("cuenta registros concurrentes y publica snapshots inmutables", () => {
		const coordinator = getOperationSafetyCoordinator();
		const listener = vi.fn();
		const unsubscribe = coordinator.subscribe(listener);
		const releaseA = coordinator.register("dirty_form");
		const releaseB = coordinator.register("dirty_form");
		expect(coordinator.getSnapshot().blockers).toEqual(["dirty_form"]);
		releaseA();
		expect(coordinator.getSnapshot().blockers).toEqual(["dirty_form"]);
		releaseB();
		expect(coordinator.getSnapshot().blockers).toEqual([]);
		expect(listener).toHaveBeenCalledTimes(4);
		unsubscribe();
	});
});
