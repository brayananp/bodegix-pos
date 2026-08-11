export interface BackupProgress {
	readonly phase: "preparing" | "exporting" | "hashing" | "building_file" | "saving" | "completed";
	readonly completedRows: number;
	readonly totalRows: number;
	readonly percentage: number | null;
}

export interface RestoreProgress {
	readonly phase:
		| "reading_file"
		| "validating_container"
		| "checking_integrity"
		| "checking_compatibility"
		| "validating_database"
		| "creating_safety_backup"
		| "waiting_for_tabs"
		| "restoring"
		| "verifying_restore"
		| "reinitializing"
		| "completed";
	readonly completedRows: number;
	readonly totalRows: number;
	readonly percentage: number | null;
}

export function progressPercentage(completedRows: number, totalRows?: number): number | null {
	if (!totalRows || totalRows <= 0) return null;
	return Math.min(100, Math.max(0, Math.round((completedRows / totalRows) * 100)));
}
