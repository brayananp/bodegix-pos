import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useConnectivityStatus } from "./use-connectivity-status";

describe("useConnectivityStatus", () => {
	it("presenta online/offline usando detector existente", () => {
		Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
		const { result } = renderHook(useConnectivityStatus);
		expect(result.current).toEqual({ browserOnline: true, label: "online" });
		Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
		act(() => window.dispatchEvent(new Event("offline")));
		expect(result.current).toEqual({ browserOnline: false, label: "offline" });
	});
});
