import { useLocalDatabase } from "@/app/providers/local-database-provider";
import {
	type DatabaseDiagnosticReport,
	getStorageStatus,
	requestPersistentStorage,
	type StorageManagerAdapter,
	type StorageStatus,
} from "@/shared/infrastructure/local-db";
import { useCallback, useEffect, useState } from "react";

const browserStorageAdapter: StorageManagerAdapter = {
	getStorageStatus,
	requestPersistentStorage,
};

export function useLocalStorageStatus(
	storageAdapter: StorageManagerAdapter = browserStorageAdapter,
) {
	const { status, runDiagnostics } = useLocalDatabase();
	const [storage, setStorage] = useState<StorageStatus | null>(null);
	const [diagnostics, setDiagnostics] = useState<DatabaseDiagnosticReport | null>(
		status.state === "ready" ? status.result.diagnostics : null,
	);
	const [storagePending, setStoragePending] = useState(true);
	const [diagnosticPending, setDiagnosticPending] = useState(false);

	useEffect(() => {
		let active = true;
		setStoragePending(true);
		void storageAdapter
			.getStorageStatus()
			.then((nextStatus) => {
				if (active) setStorage(nextStatus);
			})
			.catch(() => {
				if (active) {
					setStorage({
						supported: false,
						persistenceSupported: false,
						persisted: null,
						usageBytes: null,
						quotaBytes: null,
						usagePercentage: null,
					});
				}
			})
			.finally(() => {
				if (active) setStoragePending(false);
			});
		return () => {
			active = false;
		};
	}, [storageAdapter]);

	const requestPersistence = useCallback(async () => {
		setStoragePending(true);
		const nextStatus = await storageAdapter.requestPersistentStorage();
		setStorage(nextStatus);
		setStoragePending(false);
	}, [storageAdapter]);

	const rerunDiagnostics = useCallback(async () => {
		setDiagnosticPending(true);
		try {
			setDiagnostics(await runDiagnostics("deep"));
		} finally {
			setDiagnosticPending(false);
		}
	}, [runDiagnostics]);

	return {
		status,
		storage,
		diagnostics,
		storagePending,
		diagnosticPending,
		requestPersistence,
		rerunDiagnostics,
	};
}
