import { describe, expect, it, vi } from "vitest";
import { detectDisplayMode, getInstallState } from "./install-status";

describe("install status", () => {
	it("distingue navegador, standalone, prompt y falta de soporte", () => {
		expect(
			getInstallState({ supported: true, displayMode: "browser", promptAvailable: false }),
		).toBe("browser_managed");
		expect(
			getInstallState({ supported: true, displayMode: "standalone", promptAvailable: false }),
		).toBe("installed");
		expect(
			getInstallState({ supported: true, displayMode: "browser", promptAvailable: true }),
		).toBe("available");
		expect(
			getInstallState({ supported: false, displayMode: "browser", promptAvailable: false }),
		).toBe("unsupported");
	});

	it("detecta display-mode mediante capability detection", () => {
		const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
			matches: query === "(display-mode: standalone)",
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));
		expect(detectDisplayMode()).toBe("standalone");
		matchMedia.mockRestore();
	});
});
