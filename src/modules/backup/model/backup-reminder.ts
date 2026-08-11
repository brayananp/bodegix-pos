import { Temporal } from "temporal-polyfill";
import { getBusinessToday } from "@/shared/kernel/dates";

export type BackupReminderStatus = "never" | "up_to_date" | "due_soon" | "overdue";

export interface BackupReminderInput {
	readonly lastBackupAt: number | null;
	readonly backupReminderDays: number;
	readonly now: number;
	readonly timezone: string;
}

export function getBackupReminderStatus(input: BackupReminderInput): BackupReminderStatus {
	if (input.lastBackupAt === null) return "never";
	if (!Number.isSafeInteger(input.backupReminderDays) || input.backupReminderDays <= 0) {
		throw new RangeError("backupReminderDays debe ser un entero positivo");
	}
	const lastDate = Temporal.Instant.fromEpochMilliseconds(input.lastBackupAt)
		.toZonedDateTimeISO(input.timezone)
		.toPlainDate();
	const today = Temporal.PlainDate.from(getBusinessToday(input.timezone, input.now));
	const dueDate = lastDate.add({ days: input.backupReminderDays });
	const remainingDays = today.until(dueDate, { largestUnit: "days" }).days;
	if (remainingDays < 0) return "overdue";
	const dueSoonDays = Math.max(1, Math.ceil(input.backupReminderDays * 0.2));
	return remainingDays <= dueSoonDays ? "due_soon" : "up_to_date";
}
