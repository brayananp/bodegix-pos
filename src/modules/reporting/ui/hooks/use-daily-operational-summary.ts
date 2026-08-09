import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useState } from "react";
import { appSettingsRecordSchema, getLocalDatabase } from "@/shared/infrastructure/local-db";
import { getDailyReportingQueries } from "../../infrastructure";
import type { DailyOperationalSummary } from "../../model";

interface ReportingLiveState {
	data: DailyOperationalSummary | undefined;
	error: Error | null;
	isLoading: boolean;
	retry: () => void;
}

async function loadSummary(date: string) {
	try {
		const settings = appSettingsRecordSchema.parse(
			await getLocalDatabase().appSettings.get("main"),
		);
		return {
			data: await getDailyReportingQueries().getDailyOperationalSummary({
				date,
				timezone: settings.timezone,
			}),
			error: null,
		};
	} catch (error) {
		return {
			data: undefined,
			error: error instanceof Error ? error : new Error("Error de lectura del resumen"),
		};
	}
}

export function useDailyOperationalSummary(date: string): ReportingLiveState {
	const [retryKey, setRetryKey] = useState(0);
	const result = useLiveQuery(() => loadSummary(date), [date, retryKey]);
	const retry = useCallback(() => setRetryKey((key) => key + 1), []);
	return {
		data: result?.data,
		error: result?.error ?? null,
		isLoading: result === undefined,
		retry,
	};
}
