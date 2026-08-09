import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const salesHistorySearchSchema = z.object({
	q: z.string().catch(""),
	status: z.enum(["all", "completed", "voided"]).catch("all"),
	paymentMethod: z.enum(["all", "cash", "yape", "plin", "card", "bank_transfer"]).catch("all"),
	range: z.enum(["today", "last_7_days", "this_month", "all", "custom"]).catch("today"),
	from: dateSchema.nullable().catch(null),
	to: dateSchema.nullable().catch(null),
	cashSessionId: z.string().nullable().catch(null),
	page: z.number().int().positive().catch(1),
	pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]).catch(25),
	sort: z.enum(["newest", "oldest", "total-desc", "total-asc"]).catch("newest"),
	panel: z.enum(["detail", "void", "void-result"]).nullable().catch(null),
	saleId: z.string().nullable().catch(null),
});

export type SalesHistorySearch = z.infer<typeof salesHistorySearchSchema>;
export type SaleHistoryPanelMode = NonNullable<SalesHistorySearch["panel"]>;

function limaDate(timestamp: number): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Lima",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(timestamp);
	const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
	return `${values.year}-${values.month}-${values.day}`;
}

function limaDayStart(date: string): number {
	return Date.parse(`${date}T05:00:00.000Z`);
}

export function resolveSalesDateRange(search: SalesHistorySearch, now = Date.now()) {
	if (search.range === "all") return { fromDate: undefined, toDate: undefined, error: null };
	let from: string;
	let to: string;
	const today = limaDate(now);
	if (search.range === "custom") {
		if (!search.from || !search.to) {
			return { fromDate: undefined, toDate: undefined, error: "Selecciona las dos fechas." };
		}
		from = search.from;
		to = search.to;
	} else if (search.range === "last_7_days") {
		from = limaDate(limaDayStart(today) - 6 * 86_400_000);
		to = today;
	} else if (search.range === "this_month") {
		from = `${today.slice(0, 7)}-01`;
		to = today;
	} else {
		from = today;
		to = today;
	}
	if (from > to)
		return {
			fromDate: undefined,
			toDate: undefined,
			error: "La fecha inicial debe ser anterior a la final.",
		};
	return {
		fromDate: limaDayStart(from),
		toDate: limaDayStart(to) + 86_400_000 - 1,
		error: null,
	};
}
