export type ReportingErrorCode =
	| "INVALID_REPORTING_PERIOD"
	| "INVALID_REPORTING_VALUE"
	| "REPORTING_OVERFLOW"
	| "REPORTING_SETTINGS_MISSING";

export class ReportingError extends Error {
	constructor(
		readonly code: ReportingErrorCode,
		message: string,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "ReportingError";
	}
}
