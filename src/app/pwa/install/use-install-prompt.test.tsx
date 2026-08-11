import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { BeforeInstallPromptEvent } from "./install-prompt.types";
import { useInstallPrompt } from "./use-install-prompt";

function installEvent(outcome: "accepted" | "dismissed") {
	const event = new Event("beforeinstallprompt", { cancelable: true }) as BeforeInstallPromptEvent;
	Object.defineProperties(event, {
		prompt: { value: vi.fn().mockResolvedValue(undefined) },
		userChoice: { value: Promise.resolve({ outcome, platform: "test" }) },
	});
	return event;
}

describe("useInstallPrompt", () => {
	it.each(["accepted", "dismissed"] as const)("consume y limpia prompt %s", async (outcome) => {
		const { result } = renderHook(() => useInstallPrompt(true));
		const event = installEvent(outcome);
		act(() => window.dispatchEvent(event));
		await waitFor(() => expect(result.current.state).toBe("available"));
		let selected: string | undefined;
		await act(async () => {
			selected = await result.current.install();
		});
		expect(selected).toBe(outcome);
		expect(event.prompt).toHaveBeenCalledOnce();
		await waitFor(() => expect(result.current.installPromptAvailable).toBe(false));
	});

	it("marca instalación al recibir appinstalled", () => {
		const { result } = renderHook(() => useInstallPrompt(true));
		act(() => window.dispatchEvent(new Event("appinstalled")));
		expect(result.current.state).toBe("installed");
	});
});
