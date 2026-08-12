export type PwaDisplayMode = "browser" | "standalone" | "fullscreen" | "minimal-ui" | "unknown";

export type PwaInstallState =
	| "unsupported"
	| "available"
	| "installed"
	| "browser_managed"
	| "unknown";

export type PwaUpdateState = "idle" | "checking" | "available" | "applying" | "error";

export type ReleaseDatabaseImpact = "none" | "backward_compatible" | "forward_only";

export interface AvailableReleaseInfo {
	readonly version: string;
	readonly databaseImpact: ReleaseDatabaseImpact;
}

export type PwaUpdateBlocker =
	| "dirty_form"
	| "checkout_in_progress"
	| "database_maintenance"
	| "restore_in_progress"
	| "critical_operation";

export interface PwaUpdateSafetyState {
	readonly safeToReload: boolean;
	readonly blockers: readonly PwaUpdateBlocker[];
}

export interface PwaState {
	readonly supported: boolean;
	readonly browserOnline: boolean;
	readonly connectivityLabel: "online" | "offline";
	readonly version: string;
	readonly build: typeof __BUILD_METADATA__;
	readonly serviceWorker: {
		readonly registered: boolean;
		readonly controlling: boolean;
		readonly offlineReady: boolean;
		readonly updateAvailable: boolean;
		readonly registrationError: boolean;
	};
	readonly installation: {
		readonly displayMode: PwaDisplayMode;
		readonly state: PwaInstallState;
		readonly installPromptAvailable: boolean;
		readonly installed: boolean;
	};
	readonly updateState: PwaUpdateState;
	readonly availableRelease: AvailableReleaseInfo | null;
	readonly updateSafety: PwaUpdateSafetyState;
	readonly updatePostponed: boolean;
}

export interface PwaContextValue extends PwaState {
	install(): Promise<"accepted" | "dismissed" | "unavailable">;
	checkForUpdate(): Promise<void>;
	applyUpdate(): Promise<boolean>;
	postponeUpdate(): void;
	showUpdatePrompt(): void;
	dismissOfflineReady(): void;
}
