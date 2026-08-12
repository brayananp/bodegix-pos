import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OfflineBanner } from "../connectivity/offline-banner";
import { PwaContext } from "../pwa-context";
import type { PwaContextValue } from "../pwa.types";
import { PwaUpdateBanner } from "../update/pwa-update-banner";
import { PwaInstallCard } from "./pwa-install-card";
import { PwaStatusCard } from "./pwa-status-card";

function context(overrides: Partial<PwaContextValue> = {}): PwaContextValue {
	return {
		supported: true,
		browserOnline: true,
		connectivityLabel: "online",
		version: "1.2.3",
		build: {
			version: "1.2.3",
			commitSha: "abcdef1234567890",
			buildTimestamp: "2026-08-12T00:00:00.000Z",
		},
		serviceWorker: {
			registered: true,
			controlling: true,
			offlineReady: true,
			updateAvailable: false,
			registrationError: false,
		},
		installation: {
			displayMode: "browser",
			state: "browser_managed",
			installPromptAvailable: false,
			installed: false,
		},
		updateState: "idle",
		availableRelease: null,
		updateSafety: { safeToReload: true, blockers: [] },
		updatePostponed: false,
		install: vi.fn().mockResolvedValue("unavailable"),
		checkForUpdate: vi.fn().mockResolvedValue(undefined),
		applyUpdate: vi.fn().mockResolvedValue(true),
		postponeUpdate: vi.fn(),
		showUpdatePrompt: vi.fn(),
		dismissOfflineReady: vi.fn(),
		...overrides,
	};
}

function renderPwa(node: React.ReactNode, value = context()) {
	return render(<PwaContext.Provider value={value}>{node}</PwaContext.Provider>);
}

describe("PWA components", () => {
	it("muestra banner offline sin bloquear la operación", () => {
		renderPwa(<OfflineBanner />, context({ browserOnline: false, connectivityLabel: "offline" }));
		expect(screen.getByText(/continúa funcionando/i)).toBeInTheDocument();
	});

	it("muestra versión y estado Service Worker", () => {
		renderPwa(<PwaStatusCard />);
		expect(screen.getByText("1.2.3")).toBeInTheDocument();
		expect(screen.getByText("Activo y controlando")).toBeInTheDocument();
	});

	it("ofrece instalación solo cuando existe prompt", async () => {
		const install = vi.fn().mockResolvedValue("accepted");
		renderPwa(
			<PwaInstallCard />,
			context({
				installation: {
					displayMode: "browser",
					state: "available",
					installPromptAvailable: true,
					installed: false,
				},
				install,
			}),
		);
		await userEvent.click(screen.getByRole("button", { name: "Instalar Bodegix" }));
		expect(install).toHaveBeenCalledOnce();
	});

	it("bloquea actualización dirty y permite posponer", async () => {
		const postponeUpdate = vi.fn();
		renderPwa(
			<PwaUpdateBanner />,
			context({
				serviceWorker: {
					registered: true,
					controlling: true,
					offlineReady: true,
					updateAvailable: true,
					registrationError: false,
				},
				updateState: "available",
				updateSafety: { safeToReload: false, blockers: ["dirty_form"] },
				postponeUpdate,
			}),
		);
		expect(screen.getByRole("button", { name: "Actualizar ahora" })).toBeDisabled();
		expect(screen.getByText(/Termina o descarta/)).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Más tarde" }));
		expect(postponeUpdate).toHaveBeenCalledOnce();
	});

	it("aplica una actualización disponible cuando no hay blockers", async () => {
		const applyUpdate = vi.fn().mockResolvedValue(true);
		renderPwa(
			<PwaUpdateBanner />,
			context({
				serviceWorker: {
					registered: true,
					controlling: true,
					offlineReady: true,
					updateAvailable: true,
					registrationError: false,
				},
				updateState: "available",
				applyUpdate,
			}),
		);
		await userEvent.click(screen.getByRole("button", { name: "Actualizar ahora" }));
		expect(applyUpdate).toHaveBeenCalledOnce();
	});
});
