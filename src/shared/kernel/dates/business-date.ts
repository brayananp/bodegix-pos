import { Temporal } from "temporal-polyfill";

export interface BusinessDayRange {
	readonly date: string;
	readonly timezone: string;
	readonly start: number;
	readonly endExclusive: number;
}

function plainDate(value: string): Temporal.PlainDate {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("Fecha comercial inválida");
	const parsed = Temporal.PlainDate.from(value);
	if (parsed.toString() !== value) throw new RangeError("Fecha comercial inválida");
	return parsed;
}

function midnight(date: Temporal.PlainDate, timezone: string): Temporal.ZonedDateTime {
	return date.toZonedDateTime({ timeZone: timezone, plainTime: Temporal.PlainTime.from("00:00") });
}

export function isValidBusinessDate(value: string): boolean {
	try {
		plainDate(value);
		return true;
	} catch {
		return false;
	}
}

export function getBusinessDayRange(date: string, timezone: string): BusinessDayRange {
	const selectedDate = plainDate(date);
	const start = midnight(selectedDate, timezone).epochMilliseconds;
	const endExclusive = midnight(selectedDate.add({ days: 1 }), timezone).epochMilliseconds;
	return { date, timezone, start, endExclusive };
}

export function getBusinessToday(timezone: string, now = Date.now()): string {
	if (!Number.isSafeInteger(now) || now < 0) throw new RangeError("Timestamp inválido");
	return Temporal.Instant.fromEpochMilliseconds(now)
		.toZonedDateTimeISO(timezone)
		.toPlainDate()
		.toString();
}

export function addBusinessDays(date: string, days: number): string {
	if (!Number.isSafeInteger(days)) throw new RangeError("Cantidad de días inválida");
	return plainDate(date).add({ days }).toString();
}
