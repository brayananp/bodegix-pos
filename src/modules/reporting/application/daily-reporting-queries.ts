import type { DailyOperationalSummary } from "../model";

export interface GetDailyOperationalSummaryInput {
	readonly date: string;
	readonly timezone: string;
}

export interface DailyReportingQueries {
	getDailyOperationalSummary(
		input: GetDailyOperationalSummaryInput,
	): Promise<DailyOperationalSummary>;
}
