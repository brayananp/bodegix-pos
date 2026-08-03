import { z } from "zod";

export const saleSearchSchema = z.object({
	q: z.string().catch(""),
	categoryId: z.string().nullable().catch(null),
	panel: z.enum(["cart", "checkout", "result"]).nullable().catch(null),
	saleId: z.string().nullable().catch(null),
});

export type SaleSearch = z.infer<typeof saleSearchSchema>;
export type SalePanel = NonNullable<SaleSearch["panel"]>;
