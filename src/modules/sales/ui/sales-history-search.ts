import { z } from "zod";
import { addBusinessDays, getBusinessDayRange, getBusinessToday } from "@/shared/kernel/dates";

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

export function resolveSalesDateRange(search: SalesHistorySearch, now = Date.now()) {
	if (search.range === "all") return { fromDate: undefined, toDate: undefined, error: null };
	let from: string;
	let to: string;
	const today = getBusinessToday("America/Lima", now);
	if (search.range === "custom") {
		if (!search.from || !search.to) {
			return { fromDate: undefined, toDate: undefined, error: "Selecciona las dos fechas." };
		}
		from = search.from;
		to = search.to;
	} else if (search.range === "last_7_days") {
		from = addBusinessDays(today, -6);
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
		fromDate: getBusinessDayRange(from, "America/Lima").start,
		toDate: getBusinessDayRange(to, "America/Lima").endExclusive - 1,
		error: null,
	};
}
