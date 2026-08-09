import { z } from "zod";
import { getBusinessToday, isValidBusinessDate } from "@/shared/kernel/dates";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const summarySearchSchema = z.object({
	date: dateSchema.nullable().catch(null),
	section: z.enum(["overview", "sales", "cash", "inventory"]).catch("overview"),
});

export type SummarySearch = z.infer<typeof summarySearchSchema>;
export type SummarySection = SummarySearch["section"];

export function resolveSummaryDate(
	requestedDate: string | null,
	timezone = "America/Lima",
	now = Date.now(),
): string {
	const today = getBusinessToday(timezone, now);
	if (!requestedDate || !isValidBusinessDate(requestedDate) || requestedDate > today) return today;
	return requestedDate;
}
