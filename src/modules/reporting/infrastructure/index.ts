import { getLocalDatabase } from "@/shared/infrastructure/local-db";
import { DexieDailyReportingQueries } from "./dexie-daily-reporting-queries";

export * from "./dexie-daily-reporting-queries";

export function getDailyReportingQueries(): DexieDailyReportingQueries {
	return new DexieDailyReportingQueries(getLocalDatabase());
}
