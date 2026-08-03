import { z } from "zod";

export const cashSearchSchema = z.object({
	tab: z.enum(["current", "history"]).catch("current"),
	panel: z.enum(["open", "deposit", "withdrawal", "close", "detail"]).nullable().catch(null),
	sessionId: z.string().nullable().catch(null),
	page: z.number().int().positive().catch(1),
	pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]).catch(25),
});

export type CashSearch = z.infer<typeof cashSearchSchema>;
export type CashPanel = NonNullable<CashSearch["panel"]>;
