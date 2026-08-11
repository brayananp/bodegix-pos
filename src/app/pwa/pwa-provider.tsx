import { getDatabaseMaintenanceCoordinator } from "@/shared/infrastructure/database-maintenance";
import { getOperationSafetyCoordinator } from "@/shared/infrastructure/operation-safety";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useConnectivityStatus } from "./connectivity/use-connectivity-status";
import { useInstallPrompt } from "./install";
import { PwaContext } from "./pwa-context";
import type { PwaContextValue, PwaUpdateState } from "./pwa.types";
import { PwaOfflineReadyNotice } from "./components/pwa-offline-ready-notice";
import { PwaUpdateBanner } from "./update/pwa-update-banner";
import { getPwaUpdateSafety } from "./update/pwa-update-safety";
import { isStaleChunkError } from "./update/is-stale-chunk-error";

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;
const FOCUS_CHECK_MINIMUM_MS = 15 * 60 * 1000;

export function PwaProvider({ children }: { children: React.ReactNode }) {
	const supported = typeof navigator !== "undefined" && "serviceWorker" in navigator;
	const connectivity = useConnectivityStatus();
	const installation = useInstallPrompt(supported);
	const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
	const lastCheckAtRef = useRef(0);
	const [registered, setRegistered] = useState(false);
	const [controlling, setControlling] = useState(
		() => supported && navigator.serviceWorker.controller !== null,
	);
	const [registrationError, setRegistrationError] = useState(false);
	const [updateState, setUpdateState] = useState<PwaUpdateState>("idle");
	const [updatePostponed, setUpdatePostponed] = useState(false);

	const handleRegistered = useCallback(
		(_swUrl: string, registration: ServiceWorkerRegistration | undefined) => {
			registrationRef.current = registration ?? null;
			setRegistered(Boolean(registration));
			setRegistrationError(false);
		},
		[],
	);
	const handleRegisterError = useCallback(() => {
		setRegistrationError(true);
		setRegistered(false);
	}, []);

	const {
		needRefresh: [needRefresh],
		offlineReady: [offlineReady, setOfflineReady],
		updateServiceWorker,
	} = useRegisterSW({
		onRegisteredSW: handleRegistered,
		onRegisterError: handleRegisterError,
	});

	const maintenanceCoordinator = getDatabaseMaintenanceCoordinator();
	const maintenance = useSyncExternalStore(
		maintenanceCoordinator.subscribe,
		maintenanceCoordinator.getSnapshot,
		maintenanceCoordinator.getSnapshot,
	);
	const operationCoordinator = getOperationSafetyCoordinator();
	const operations = useSyncExternalStore(
		operationCoordinator.subscribe,
		operationCoordinator.getSnapshot,
		operationCoordinator.getSnapshot,
	);
	const updateSafety = useMemo(
		() => getPwaUpdateSafety(operations, maintenance),
		[operations, maintenance],
	);

	useEffect(() => {
		if (!supported) return;
		const handleControllerChange = () =>
			setControlling(navigator.serviceWorker.controller !== null);
		navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
		void navigator.serviceWorker.getRegistration().then((registration) => {
			if (!registration) return;
			registrationRef.current = registration;
			setRegistered(true);
			setControlling(navigator.serviceWorker.controller !== null);
		});
		return () =>
			navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
	}, [supported]);

	useEffect(() => {
		if (needRefresh) {
			setUpdateState("available");
			setUpdatePostponed(false);
		} else {
			setUpdateState((current) => (current === "available" ? "idle" : current));
		}
	}, [needRefresh]);

	useEffect(() => {
		if (!needRefresh) return;
		const handlePreloadError = (event: Event) => {
			event.preventDefault();
			setUpdateState("available");
			setUpdatePostponed(false);
		};
		const handleError = (event: ErrorEvent) => {
			if (!isStaleChunkError(event.error ?? event.message)) return;
			event.preventDefault();
			setUpdateState("available");
			setUpdatePostponed(false);
		};
		const handleRejection = (event: PromiseRejectionEvent) => {
			if (!isStaleChunkError(event.reason)) return;
			event.preventDefault();
			setUpdateState("available");
			setUpdatePostponed(false);
		};
		window.addEventListener("vite:preloadError", handlePreloadError);
		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handleRejection);
		return () => {
			window.removeEventListener("vite:preloadError", handlePreloadError);
			window.removeEventListener("error", handleError);
			window.removeEventListener("unhandledrejection", handleRejection);
		};
	}, [needRefresh]);

	const updateRegistration = useCallback(async (showChecking: boolean) => {
		const registration = registrationRef.current;
		if (!registration || !navigator.onLine) return;
		if (showChecking) setUpdateState("checking");
		lastCheckAtRef.current = Date.now();
		try {
			await registration.update();
			if (showChecking) setUpdateState((current) => (current === "checking" ? "idle" : current));
		} catch {
			setUpdateState("error");
		}
	}, []);

	const checkForUpdate = useCallback(async () => updateRegistration(true), [updateRegistration]);

	useEffect(() => {
		if (!supported || !connectivity.browserOnline) return;
		void updateRegistration(false);
		const interval = window.setInterval(() => void updateRegistration(false), UPDATE_INTERVAL_MS);
		const handleFocus = () => {
			if (Date.now() - lastCheckAtRef.current >= FOCUS_CHECK_MINIMUM_MS) {
				void updateRegistration(false);
			}
		};
		window.addEventListener("focus", handleFocus);
		return () => {
			window.clearInterval(interval);
			window.removeEventListener("focus", handleFocus);
		};
	}, [connectivity.browserOnline, supported, updateRegistration]);

	const applyUpdate = useCallback(async () => {
		if (!needRefresh || !updateSafety.safeToReload) return false;
		setUpdateState("applying");
		try {
			await updateServiceWorker(true);
			return true;
		} catch {
			setUpdateState("error");
			return false;
		}
	}, [needRefresh, updateSafety.safeToReload, updateServiceWorker]);

	const value = useMemo<PwaContextValue>(
		() => ({
			supported,
			browserOnline: connectivity.browserOnline,
			connectivityLabel: connectivity.label,
			version: __APP_VERSION__,
			serviceWorker: {
				registered,
				controlling,
				offlineReady: offlineReady || controlling,
				updateAvailable: needRefresh,
				registrationError,
			},
			installation: {
				displayMode: installation.displayMode,
				state: installation.state,
				installPromptAvailable: installation.installPromptAvailable,
				installed: installation.installed,
			},
			updateState,
			updateSafety,
			updatePostponed,
			install: installation.install,
			checkForUpdate,
			applyUpdate,
			postponeUpdate: () => setUpdatePostponed(true),
			showUpdatePrompt: () => setUpdatePostponed(false),
			dismissOfflineReady: () => setOfflineReady(false),
		}),
		[
			supported,
			connectivity,
			registered,
			controlling,
			offlineReady,
			needRefresh,
			registrationError,
			installation,
			updateState,
			updateSafety,
			updatePostponed,
			checkForUpdate,
			applyUpdate,
			setOfflineReady,
		],
	);

	return (
		<PwaContext.Provider value={value}>
			{children}
			<PwaUpdateBanner />
			<PwaOfflineReadyNotice visible={offlineReady && !needRefresh} />
		</PwaContext.Provider>
	);
}
