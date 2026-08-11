import { Temporal } from "temporal-polyfill";
import { BACKUP_FILE_EXTENSION } from "./backup-container";
import type { BackupSource } from "./backup-manifest";

export interface BuildBackupFileNameInput {
	readonly businessName: string;
	readonly createdAt: number;
	readonly timezone: string;
	readonly source: BackupSource;
}

function slug(value: string): string {
	const normalized = value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48)
		.replace(/-+$/g, "");
	return normalized || "mi-bodega";
}

export function buildBackupFileName(input: BuildBackupFileNameInput): string {
	const date = Temporal.Instant.fromEpochMilliseconds(input.createdAt).toZonedDateTimeISO(
		input.timezone,
	);
	const stamp = `${date.year.toString().padStart(4, "0")}${date.month.toString().padStart(2, "0")}${date.day.toString().padStart(2, "0")}-${date.hour.toString().padStart(2, "0")}${date.minute.toString().padStart(2, "0")}${date.second.toString().padStart(2, "0")}`;
	const prefix = input.source === "pre_restore" ? "bodegix-pre-restore" : "bodegix-backup";
	return `${prefix}-${slug(input.businessName)}-${stamp}${BACKUP_FILE_EXTENSION}`;
}
