export type DiagnosticStatus = "pass" | "warning" | "fail";
export type DiagnosticMode = "basic" | "deep";

export interface DatabaseDiagnosticCheck {
	id: string;
	status: DiagnosticStatus;
	message: string;
	details?: Record<string, unknown>;
}

export interface DatabaseDiagnosticReport {
	status: DiagnosticStatus;
	mode: DiagnosticMode;
	checkedAt: number;
	checks: DatabaseDiagnosticCheck[];
}
