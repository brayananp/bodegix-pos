import { useCallback, useEffect, useMemo, useState } from "react";
import type { PwaDisplayMode } from "../pwa.types";
import type { BeforeInstallPromptEvent } from "./install-prompt.types";
import { detectDisplayMode, getInstallState } from "./install-status";

export function useInstallPrompt(supported: boolean) {
	const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
	const [displayMode, setDisplayMode] = useState<PwaDisplayMode>(detectDisplayMode);

	useEffect(() => {
		const media = window.matchMedia?.("(display-mode: standalone)");
		const refreshDisplayMode = () => setDisplayMode(detectDisplayMode());
		const capturePrompt = (event: Event) => {
			event.preventDefault();
			setPromptEvent(event as BeforeInstallPromptEvent);
		};
		const markInstalled = () => {
			setPromptEvent(null);
			setDisplayMode("standalone");
		};
		window.addEventListener("beforeinstallprompt", capturePrompt);
		window.addEventListener("appinstalled", markInstalled);
		media?.addEventListener?.("change", refreshDisplayMode);
		return () => {
			window.removeEventListener("beforeinstallprompt", capturePrompt);
			window.removeEventListener("appinstalled", markInstalled);
			media?.removeEventListener?.("change", refreshDisplayMode);
		};
	}, []);

	const install = useCallback(async () => {
		if (!promptEvent) return "unavailable" as const;
		await promptEvent.prompt();
		const choice = await promptEvent.userChoice;
		setPromptEvent(null);
		return choice.outcome;
	}, [promptEvent]);

	const state = useMemo(
		() => getInstallState({ supported, displayMode, promptAvailable: promptEvent !== null }),
		[supported, displayMode, promptEvent],
	);

	return {
		displayMode,
		state,
		installed: state === "installed",
		installPromptAvailable: promptEvent !== null,
		install,
	};
}
