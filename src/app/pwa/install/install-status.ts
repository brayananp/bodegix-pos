import type { PwaDisplayMode, PwaInstallState } from "../pwa.types";

export function detectDisplayMode(): PwaDisplayMode {
	if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "unknown";
	for (const mode of ["fullscreen", "standalone", "minimal-ui"] as const) {
		if (window.matchMedia(`(display-mode: ${mode})`).matches) return mode;
	}
	const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
	return iosStandalone ? "standalone" : "browser";
}

export function getInstallState(input: {
	supported: boolean;
	displayMode: PwaDisplayMode;
	promptAvailable: boolean;
}): PwaInstallState {
	if (input.displayMode === "standalone" || input.displayMode === "fullscreen") return "installed";
	if (!input.supported) return "unsupported";
	if (input.promptAvailable) return "available";
	if (input.displayMode === "browser" || input.displayMode === "minimal-ui")
		return "browser_managed";
	return "unknown";
}
