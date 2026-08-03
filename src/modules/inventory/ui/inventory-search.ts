import { z } from "zod";

export const inventorySearchSchema = z.object({
	tab: z.enum(["stock", "movements"]).catch("stock"),
	q: z.string().catch(""),
	productStatus: z.enum(["all", "active", "inactive"]).catch("active"),
	stockStatus: z.enum(["all", "in_stock", "low_stock", "out_of_stock"]).catch("all"),
	categoryId: z.string().nullable().catch(null),
	movementType: z
		.enum([
			"all",
			"initial_stock",
			"purchase",
			"adjustment_in",
			"adjustment_out",
			"damaged",
			"expired",
		])
		.catch("all"),
	page: z.number().int().positive().catch(1),
	pageSize: z.union([z.literal(25), z.literal(50), z.literal(100)]).catch(25),
	sort: z.enum(["name-asc", "stock-asc", "stock-desc", "updated-desc"]).catch("name-asc"),
	panel: z.enum(["detail", "initial", "entry", "reconcile", "loss"]).nullable().catch(null),
	productId: z.string().nullable().catch(null),
});

export type InventorySearch = z.infer<typeof inventorySearchSchema>;
export type InventoryPanelMode = "detail" | "initial" | "entry" | "reconcile" | "loss";
